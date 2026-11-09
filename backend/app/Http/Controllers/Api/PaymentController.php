<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
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

class PaymentController extends Controller
{
    /**
     * Konfigurasi Midtrans.
     */
    private function configureMidtrans(): void
    {
        Config::$serverKey = config('services.midtrans.server_key');
        Config::$isProduction = (bool) config('services.midtrans.is_production');
        Config::$isSanitized = true;
        Config::$is3ds = true;
    }

    /**
     * Menampilkan informasi pembayaran pesanan.
     *
     * GET /api/orders/{order}/payment
     */
    public function show(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->user_id === $request->user()->id, 404);

        $payment = $order->payment;

        // Membuat payment Midtrans jika belum tersedia.
        if (!$payment) {
            if ($order->order_status === OrderStatus::CANCELLED) {
                return response()->json([
                    'success' => false,
                    'message' => 'Pesanan telah dibatalkan.',
                ], 422);
            }

            $payment = Payment::create([
                'order_id' => $order->id,
                'method' => 'midtrans',
                'amount' => $order->total,
                'status' => PaymentStatus::PENDING,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Informasi pembayaran berhasil diambil.',
            'data' => [
                'payment' => $payment,

                'midtrans_attempt_status' => $payment
                    ->midtransTransactions()
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
     * Membuat atau menggunakan kembali Snap Token.
     *
     * POST /api/orders/{order}/payment/snap-token
     */
    public function createSnapToken(
        Request $request,
        Order $order
    ): JsonResponse {
        abort_unless($order->user_id === $request->user()->id, 404);

        $payment = $order->payment;

        if (
            !$payment ||
            !in_array(
                $payment->status,
                [PaymentStatus::PENDING, PaymentStatus::REJECTED],
                true
            )
        ) {
            return response()->json([
                'success' => false,
                'message' => 'Pembayaran tidak tersedia.',
            ], 422);
        }

        if ($order->order_status === OrderStatus::CANCELLED) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan telah dibatalkan.',
            ], 422);
        }

        if ($payment->method !== 'midtrans') {
            return response()->json([
                'success' => false,
                'message' => 'Metode pembayaran tidak valid.',
            ], 422);
        }

        $serverKey = config('services.midtrans.server_key');
        $clientKey = config('services.midtrans.client_key');

        if (!filled($serverKey) || !filled($clientKey)) {
            return response()->json([
                'success' => false,
                'message' => 'Konfigurasi Midtrans belum lengkap.',
            ], 503);
        }

        $this->configureMidtrans();

        try {
            $result = DB::transaction(function () use ($payment, $order) {
                $lockedPayment = Payment::query()
                    ->lockForUpdate()
                    ->findOrFail($payment->id);

                if (
                    !in_array(
                        $lockedPayment->status,
                        [PaymentStatus::PENDING, PaymentStatus::REJECTED],
                        true
                    )
                ) {
                    throw new \RuntimeException(
                        'Pembayaran sudah selesai diproses.'
                    );
                }

                // Gunakan kembali transaksi aktif jika masih tersedia.
                $latestAttempt = $lockedPayment
                    ->midtransTransactions()
                    ->latest('id')
                    ->lockForUpdate()
                    ->first();

                if (
                    $latestAttempt &&
                    in_array($latestAttempt->status, ['created', 'pending'], true) &&
                    filled($latestAttempt->snap_token)
                ) {
                    return [
                        'snap_token' => $latestAttempt->snap_token,
                        'midtrans_order_id' => $latestAttempt->midtrans_order_id,
                    ];
                }

                // Membuat ID transaksi baru untuk percobaan pembayaran.
                $midtransOrderId = $order->order_number
                    . '-R'
                    . Str::upper(Str::random(8));

                $attempt = $lockedPayment->midtransTransactions()->create([
                    'midtrans_order_id' => $midtransOrderId,
                    'status' => 'created',
                    'gross_amount' => round((float) $order->total),
                ]);

                // Meminta Snap Token dari Midtrans.
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

                $attempt->update([
                    'snap_token' => $snapToken,
                ]);

                if ($lockedPayment->status === PaymentStatus::REJECTED) {
                    $lockedPayment->update([
                        'status' => PaymentStatus::PENDING,
                        'verified_at' => null,
                        'verified_by' => null,
                    ]);
                }

                return [
                    'snap_token' => $snapToken,
                    'midtrans_order_id' => $midtransOrderId,
                ];
            });

        } catch (\Throwable $exception) {
            report($exception);

            return response()->json([
                'success' => false,
                'message' => 'Gagal menyiapkan pembayaran Midtrans.',
            ], 502);
        }

        return response()->json([
            'success' => true,
            'message' => 'Snap Token berhasil dibuat.',
            'data' => [
                'snap_token' => $result['snap_token'],
                'midtrans_order_id' => $result['midtrans_order_id'],
                'client_key' => $clientKey,
                'is_production' => (bool) config('services.midtrans.is_production'),
            ],
        ]);
    }

    /**
     * Menerima notifikasi pembayaran dari Midtrans.
     *
     * POST /api/payments/midtrans/notification
     */
    public function handleMidtransNotification(
        Request $request
    ): JsonResponse {
        $notification = $request->validate([
            'order_id' => ['required', 'string'],
            'status_code' => ['required', 'string'],
            'gross_amount' => [
                'required',
                'string',
                'regex:/^\d+(?:\.\d{1,2})?$/',
            ],
            'signature_key' => ['required', 'string'],
            'transaction_status' => ['required', 'string'],
            'transaction_id' => ['nullable', 'string'],
            'payment_type' => ['nullable', 'string'],
            'fraud_status' => ['nullable', 'string'],
            'refund_amount' => ['nullable', 'numeric', 'min:0'],
        ]);

        // Validasi signature Midtrans.
        $serverKey = (string) config('services.midtrans.server_key');

        if ($serverKey === '') {
            return response()->json([
                'success' => false,
                'message' => 'Konfigurasi Midtrans belum tersedia.',
            ], 503);
        }

        $expectedSignature = hash(
            'sha512',
            $notification['order_id']
            . $notification['status_code']
            . $notification['gross_amount']
            . $serverKey
        );

        if (!hash_equals(
            $expectedSignature,
            $notification['signature_key']
        )) {
            Log::warning('Signature Midtrans tidak valid.', [
                'order_id' => $notification['order_id'],
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Signature tidak valid.',
            ], 403);
        }

        // Mencari transaksi berdasarkan ID Midtrans.
        $attempt = MidtransTransaction::query()
            ->where('midtrans_order_id', $notification['order_id'])
            ->with('payment.order')
            ->first();

        if (!$attempt?->payment?->order) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan.',
            ], 404);
        }

        $payment = $attempt->payment;
        $order = $payment->order;

        if ($payment->method !== 'midtrans') {
            return response()->json([
                'success' => false,
                'message' => 'Metode pembayaran tidak valid.',
            ], 404);
        }

        // Memastikan nominal transaksi sesuai.
        $expectedAmount = number_format(
            round((float) $order->total),
            2,
            '.',
            ''
        );

        $receivedAmount = number_format(
            (float) $notification['gross_amount'],
            2,
            '.',
            ''
        );

        $paymentAmount = number_format(
            round((float) $payment->amount),
            2,
            '.',
            ''
        );

        $attemptAmount = number_format(
            (float) $attempt->gross_amount,
            2,
            '.',
            ''
        );

        if (
            $expectedAmount !== $receivedAmount ||
            $paymentAmount !== $receivedAmount ||
            $attemptAmount !== $receivedAmount
        ) {
            Log::warning('Nominal pembayaran Midtrans tidak cocok.', [
                'order_id' => $order->order_number,
                'expected' => $expectedAmount,
                'received' => $receivedAmount,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Nominal pembayaran tidak cocok.',
            ], 422);
        }

        // Memperbarui status transaksi secara atomik.
        DB::transaction(function () use ($attempt, $notification) {
            $lockedAttempt = MidtransTransaction::query()
                ->lockForUpdate()
                ->findOrFail($attempt->id);

            $payment = Payment::query()
                ->lockForUpdate()
                ->findOrFail($lockedAttempt->payment_id);

            $order = Order::query()
                ->lockForUpdate()
                ->findOrFail($payment->order_id);

            if ($payment->method !== 'midtrans') {
                return;
            }

            $status = strtolower(
                $notification['transaction_status']
            );

            $fraudStatus = strtolower(
                (string) ($notification['fraud_status'] ?? '')
            );

            // Simpan informasi transaksi Midtrans.
            $lockedAttempt->update([
                'status' => $status,
                'transaction_id' =>
                    $notification['transaction_id']
                    ?? $lockedAttempt->transaction_id,
                'payment_type' =>
                    $notification['payment_type']
                    ?? $lockedAttempt->payment_type,
            ]);

            $payment->midtrans_transaction_id =
                $notification['transaction_id']
                ?? $payment->midtrans_transaction_id;

            $payment->midtrans_transaction_status = $status;

            $payment->midtrans_payment_type =
                $notification['payment_type']
                ?? $payment->midtrans_payment_type;

            // Pembayaran berhasil.
            if (
                $status === 'settlement' ||
                ($status === 'capture' && $fraudStatus === 'accept')
            ) {
                if (
                    $order->order_status !== OrderStatus::CANCELLED &&
                    !in_array(
                        $payment->status,
                        [
                            PaymentStatus::REFUNDED,
                            PaymentStatus::PARTIALLY_REFUNDED,
                        ],
                        true
                    )
                ) {
                    $payment->status = PaymentStatus::PAID;
                    $payment->verified_at = now();
                    $payment->verified_by = null;

                    if ($order->order_status === OrderStatus::PENDING) {
                        $order->update([
                            'order_status' => OrderStatus::CONFIRMED,
                            'confirmed_at' => now(),
                        ]);
                    }
                } else {
                    Log::warning(
                        'Pembayaran diterima setelah pesanan dibatalkan.',
                        ['order_id' => $order->order_number]
                    );
                }
            }

            // Transaksi gagal atau kedaluwarsa.
            elseif (in_array($status, ['expire', 'deny', 'cancel'], true)) {
                // Status payment tetap pending agar pelanggan dapat mencoba lagi.
            }

            // Refund.
            elseif ($status === 'refund') {
                $payment->status = PaymentStatus::REFUNDED;
            }

            elseif ($status === 'partial_refund') {
                if ($payment->status !== PaymentStatus::REFUNDED) {
                    $payment->status = PaymentStatus::PARTIALLY_REFUNDED;
                }
            }

            $payment->save();
        });

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi Midtrans berhasil diproses.',
        ]);
    }
}
