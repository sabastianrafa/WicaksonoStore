<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Models\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\MidtransTransaction;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Transaction;

class PaymentController extends Controller
{
    /**
     * Menampilkan informasi pembayaran pesanan.
     *
     * GET /api/orders/{order}/payment
     */
    public function show(Request $request, Order $order): JsonResponse
    {
        if ($order->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.',
            ], 404);
        }

        $payment = $order->payment;

        if (! $payment) {
            $method = PaymentMethod::query()
                ->where('is_active', true)
                ->configured()
                ->orderBy('sort_order')
                ->first();

            if (! $method) {
                return response()->json([
                    'success' => false,
                    'message' => 'Metode pembayaran belum tersedia. Silakan hubungi admin.',
                ], 422);
            }

            $payment = Payment::create([
                'order_id' => $order->id,
                'method' => $method->code,
                'payment_method_name' => $method->name,
                'payment_method_type' => $method->type,
                'payment_account_number' => $method->account_number,
                'payment_account_name' => $method->account_name,
                'payment_qris_image' => $method->qris_image,
                'payment_method_description' => $method->description,
                'amount' => $order->total,
                'status' => PaymentStatus::PENDING,
            ]);
        }

        $paymentMethod = $this->paymentMethodDetails($payment);

        return response()->json([
            'success' => true,
            'message' => 'Data pembayaran berhasil diambil.',
            'data' => [
                'payment' => $payment,
                'payment_method' => $paymentMethod,
                'midtrans_attempt_status' => $payment->midtransTransactions()
                    ->latest('id')
                    ->value('status'),
                'order' => [
                    'id' => $order->id,
                    'order_number' => $order->order_number,
                    'total' => (float) $order->total,
                    'status' => $order->order_status->value,
                ],
            ],
        ]);
    }

    /**
     * Upload bukti pembayaran manual / perbarui metode pembayaran.
     *
     * POST /api/orders/{order}/payment
     */
    public function store(Request $request, Order $order): JsonResponse
    {
        if ($order->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.',
            ], 404);
        }

        if ($order->order_status === OrderStatus::CANCELLED) {
            return response()->json([
                'success' => false,
                'message' => 'Tidak dapat melakukan pembayaran untuk pesanan yang telah dibatalkan.',
            ], 422);
        }

        return response()->json([
            'success' => false,
            'message' => 'Unggah bukti pembayaran manual sudah tidak tersedia. Selesaikan pembayaran melalui Midtrans Snap.',
        ], 422);
    }

    private function paymentMethodDetails(Payment $payment): ?array
    {
        $currentMethod = $payment->paymentMethod;

        if ($payment->payment_method_name === null && ! $currentMethod) {
            return null;
        }

        $qrisPath = $payment->payment_qris_image ?? $currentMethod?->qris_image;
        $qrisImageUrl = $qrisPath
            ? (str_starts_with($qrisPath, 'http://') || str_starts_with($qrisPath, 'https://')
                ? $qrisPath
                : (str_starts_with($qrisPath, '/storage/')
                    ? $qrisPath
                    : '/storage/' . ltrim($qrisPath, '/')))
            : null;

        return [
            'name' => $payment->payment_method_name ?? $currentMethod?->name,
            'code' => $payment->method,
            'type' => $payment->payment_method_type ?? $currentMethod?->type,
            'account_number' => $payment->payment_account_number ?? $currentMethod?->account_number,
            'account_name' => $payment->payment_account_name ?? $currentMethod?->account_name,
            'qris_image_url' => $payment->payment_qris_image !== null
                ? $qrisImageUrl
                : ($currentMethod?->qris_image_url ?? $qrisImageUrl),
            'description' => $payment->payment_method_description ?? $currentMethod?->description,
        ];
    }

    public function createSnapToken(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->user_id === $request->user()->id, 404);

        $payment = $order->payment;

        if (! $payment || ! in_array($payment->status, [PaymentStatus::PENDING, PaymentStatus::REJECTED], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Pembayaran ini tidak tersedia.',
            ], 422);
        }

        if ($order->order_status === OrderStatus::CANCELLED || $payment->method !== 'midtrans') {
            return response()->json([
                'success' => false,
                'message' => 'Order ini tidak menggunakan pembayaran Midtrans atau sudah dibatalkan.',
            ], 422);
        }

        $serverKey = config('services.midtrans.server_key');
        $clientKey = config('services.midtrans.client_key');
        if (! filled($serverKey) || ! filled($clientKey)) {
            return response()->json([
                'success' => false,
                'message' => 'Konfigurasi Midtrans belum lengkap.',
            ], 503);
        }

        Config::$serverKey = $serverKey;
        Config::$isProduction = (bool) config('services.midtrans.is_production');
        Config::$isSanitized = true;
        Config::$is3ds = true;

        try {
            $result = DB::transaction(function () use ($payment, $order) {
                $lockedPayment = Payment::query()->lockForUpdate()->findOrFail($payment->id);
                if (! in_array($lockedPayment->status, [PaymentStatus::PENDING, PaymentStatus::REJECTED], true)) {
                    throw new \RuntimeException('Pembayaran ini sudah selesai diproses.');
                }

                $latestAttempt = $lockedPayment->midtransTransactions()->latest('id')->lockForUpdate()->first();
                if ($latestAttempt && in_array($latestAttempt->status, ['created', 'pending'], true) && filled($latestAttempt->snap_token)) {
                    return [
                        'snap_token' => $latestAttempt->snap_token,
                        'midtrans_order_id' => $latestAttempt->midtrans_order_id,
                    ];
                }

                $midtransOrderId = $order->order_number.'-R'.Str::upper(Str::random(8));
                $attempt = $lockedPayment->midtransTransactions()->create([
                    'midtrans_order_id' => $midtransOrderId,
                    'status' => 'created',
                    'gross_amount' => round((float) $order->total),
                ]);

                $snapToken = Snap::getSnapToken([
                    'transaction_details' => [
                        'order_id' => $midtransOrderId,
                        'gross_amount' => (int) round((float) $order->total),
                    ],
                    'customer_details' => [
                        'first_name' => $order->shipping_name,
                        'phone' => $order->shipping_phone,
                        'email' => $order->user?->email,
                    ],
                ]);

                $attempt->update(['snap_token' => $snapToken]);
                if ($lockedPayment->status === PaymentStatus::REJECTED) {
                    $lockedPayment->update(['status' => PaymentStatus::PENDING, 'verified_at' => null, 'verified_by' => null]);
                }

                return ['snap_token' => $snapToken, 'midtrans_order_id' => $midtransOrderId];
            });
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menyiapkan pembayaran.',
            ], 502);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'snap_token' => $result['snap_token'],
                'midtrans_order_id' => $result['midtrans_order_id'],
                'client_key' => $clientKey,
                'is_production' => (bool) config('services.midtrans.is_production'),
            ],
        ]);
    }

    /**
     * Batalkan transaksi Midtrans yang pending agar pelanggan dapat memilih kanal lain.
     * Hanya percobaan pending yang bisa dibatalkan; percobaan yang belum memilih kanal
     * tetap dapat diubah langsung dari daftar pilihan Snap.
     */
    public function changeMidtransMethod(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->user_id === $request->user()->id, 404);

        $payment = $order->payment;
        if (
            ! $payment
            || $payment->method !== 'midtrans'
            || $payment->status !== PaymentStatus::PENDING
            || $order->order_status === OrderStatus::CANCELLED
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Pembayaran ini tidak dapat mengganti kanal.',
            ], 422);
        }

        $attempt = $payment->midtransTransactions()->latest('id')->first();
        if (! $attempt || $attempt->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Belum ada transaksi pending. Pilih kanal lain langsung dari panel Midtrans.',
            ], 422);
        }

        $serverKey = config('services.midtrans.server_key');
        if (! filled($serverKey)) {
            return response()->json([
                'success' => false,
                'message' => 'Konfigurasi Midtrans belum lengkap.',
            ], 503);
        }

        Config::$serverKey = $serverKey;
        Config::$isProduction = (bool) config('services.midtrans.is_production');
        Config::$isSanitized = true;
        Config::$is3ds = true;

        try {
            $cancelStatusCode = (string) Transaction::cancel($attempt->midtrans_order_id);
        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Midtrans tidak dapat membatalkan transaksi ini. Periksa status pembayaran lalu coba lagi.',
            ], 502);
        }

        if ($cancelStatusCode !== '200') {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak dapat dibatalkan. Pembayaran mungkin sudah selesai atau kedaluwarsa.',
            ], 409);
        }

        $wasCancelled = DB::transaction(function () use ($attempt, $payment) {
            $lockedAttempt = MidtransTransaction::query()->lockForUpdate()->findOrFail($attempt->id);
            $lockedPayment = Payment::query()->lockForUpdate()->findOrFail($payment->id);

            if (
                $lockedPayment->status !== PaymentStatus::PENDING
                || in_array($lockedAttempt->status, ['settlement', 'capture'], true)
            ) {
                return false;
            }

            $lockedAttempt->update(['status' => 'cancel']);

            return true;
        });

        if (! $wasCancelled) {
            return response()->json([
                'success' => false,
                'message' => 'Status pembayaran berubah saat pembatalan. Perbarui halaman sebelum melanjutkan.',
            ], 409);
        }

        return response()->json([
            'success' => true,
            'message' => 'Transaksi dibatalkan. Anda dapat memilih kanal pembayaran lain.',
        ]);
    }

    /**
     * Menerima notifikasi transaksi Midtrans.
     *
     * POST /api/payments/midtrans/notification
     */
    public function handleMidtransNotification(Request $request): JsonResponse
    {
        $notification = $request->validate([
            'order_id' => ['required', 'string'],
            'status_code' => ['required', 'string'],
            'gross_amount' => ['required', 'string', 'regex:/^\d+(?:\.\d{1,2})?$/'],
            'signature_key' => ['required', 'string'],
            'transaction_status' => ['required', 'string'],
            'transaction_id' => ['nullable', 'string'],
            'payment_type' => ['nullable', 'string'],
            'fraud_status' => ['nullable', 'string'],
            'refund_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        $serverKey = (string) config('services.midtrans.server_key');
        if ($serverKey === '') {
            return response()->json(['success' => false, 'message' => 'Konfigurasi Midtrans belum tersedia.'], 503);
        }

        $expectedSignature = hash('sha512',
            $notification['order_id'].$notification['status_code'].$notification['gross_amount'].$serverKey
        );
        if (! hash_equals($expectedSignature, $notification['signature_key'])) {
            Log::warning('Notifikasi Midtrans ditolak karena signature tidak valid.', [
                'order_id' => $notification['order_id'],
            ]);
            return response()->json(['success' => false, 'message' => 'Signature notifikasi tidak valid.'], 403);
        }

        $attempt = MidtransTransaction::query()
            ->where('midtrans_order_id', $notification['order_id'])
            ->with('payment.order')
            ->first();

        // Support notifications for Snap attempts created before per-attempt IDs were introduced.
        if (! $attempt) {
            $legacyOrder = Order::query()->where('order_number', $notification['order_id'])->with('payment')->first();
            if ($legacyOrder?->payment?->method === 'midtrans') {
                $attempt = MidtransTransaction::query()->firstOrCreate(
                    ['midtrans_order_id' => $notification['order_id']],
                    [
                        'payment_id' => $legacyOrder->payment->id,
                        'status' => 'created',
                        'gross_amount' => round((float) $legacyOrder->total),
                    ]
                );
                $attempt->load('payment.order');
            }
        }

        if (! $attempt?->payment?->order) {
            Log::warning('Notifikasi Midtrans mengacu pada order yang tidak ditemukan.', [
                'order_id' => $notification['order_id'],
            ]);
            return response()->json(['success' => false, 'message' => 'Order tidak ditemukan.'], 404);
        }

        $order = $attempt->payment->order;
        $payment = $attempt->payment;
        if ($payment->method !== 'midtrans') {
            return response()->json(['success' => false, 'message' => 'Pembayaran Midtrans tidak ditemukan.'], 404);
        }

        $expectedAmount = number_format(round((float) $order->total), 2, '.', '');
        $receivedAmount = number_format((float) $notification['gross_amount'], 2, '.', '');
        $paymentAmount = number_format(round((float) $payment->amount), 2, '.', '');
        $attemptAmount = number_format((float) $attempt->gross_amount, 2, '.', '');
        if ($expectedAmount !== $receivedAmount || $paymentAmount !== $receivedAmount || $attemptAmount !== $receivedAmount) {
            Log::warning('Nominal notifikasi Midtrans tidak cocok dengan order.', [
                'order_id' => $order->order_number,
                'expected_amount' => $expectedAmount,
                'received_amount' => $receivedAmount,
            ]);
            return response()->json(['success' => false, 'message' => 'Nominal pembayaran tidak cocok.'], 422);
        }

        DB::transaction(function () use ($attempt, $notification) {
            $lockedAttempt = MidtransTransaction::query()->lockForUpdate()->findOrFail($attempt->id);
            $payment = Payment::query()->lockForUpdate()->findOrFail($lockedAttempt->payment_id);
            $lockedOrder = Order::query()->lockForUpdate()->findOrFail($payment->order_id);

            if ($payment->method !== 'midtrans') {
                return;
            }

            $status = strtolower($notification['transaction_status']);
            $fraudStatus = strtolower((string) ($notification['fraud_status'] ?? ''));

            $lockedAttempt->status = $status;
            $lockedAttempt->transaction_id = $notification['transaction_id'] ?? $lockedAttempt->transaction_id;
            $lockedAttempt->payment_type = $notification['payment_type'] ?? $lockedAttempt->payment_type;
            $lockedAttempt->save();

            $payment->midtrans_transaction_id = $notification['transaction_id'] ?? $payment->midtrans_transaction_id;
            $payment->midtrans_transaction_status = $status;
            $payment->midtrans_payment_type = $notification['payment_type'] ?? $payment->midtrans_payment_type;

            if ($status === 'settlement' || ($status === 'capture' && $fraudStatus === 'accept')) {
                if (
                    $lockedOrder->order_status !== OrderStatus::CANCELLED
                    && ! in_array($payment->status, [PaymentStatus::REFUNDED, PaymentStatus::PARTIALLY_REFUNDED], true)
                ) {
                    $payment->status = PaymentStatus::PAID;
                    $payment->verified_at = now();
                    $payment->verified_by = null;
                    if ($lockedOrder->order_status === OrderStatus::PENDING) {
                        $lockedOrder->update([
                            'order_status' => OrderStatus::CONFIRMED,
                            'confirmed_at' => now(),
                        ]);
                    }
                } else {
                    Log::warning('Pembayaran masuk setelah order dibatalkan.', [
                        'order_id' => $lockedOrder->order_number,
                    ]);
                }
            } elseif (in_array($status, ['expire', 'deny', 'cancel'], true)) {
                // A failed attempt is terminal, but the order remains payable through a new attempt.
                if ($payment->status === PaymentStatus::REJECTED) {
                    $payment->status = PaymentStatus::PENDING;
                }
            } elseif ($status === 'refund') {
                $payment->status = PaymentStatus::REFUNDED;
            } elseif ($status === 'partial_refund') {
                if ($payment->status !== PaymentStatus::REFUNDED) {
                    $payment->status = PaymentStatus::PARTIALLY_REFUNDED;
                }
            }

            $payment->save();
        });

        return response()->json(['success' => true, 'message' => 'Notifikasi Midtrans berhasil diproses.']);
    }
}
