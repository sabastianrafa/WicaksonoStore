<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Models\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

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

        $payment = $order->payment;
        if ($payment?->status === PaymentStatus::PAID) {
            return response()->json([
                'success' => false,
                'message' => 'Pembayaran pesanan ini sudah diverifikasi.',
            ], 422);
        }

        if ($payment?->status === PaymentStatus::PENDING && $payment->proof) {
            return response()->json([
                'success' => false,
                'message' => 'Bukti pembayaran sedang menunggu verifikasi admin.',
            ], 422);
        }

        $validated = $request->validate([
            'proof' => [
                'required_without:method',
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:1800',
            ],
            'method' => [
                'nullable',
                Rule::exists('payment_methods', 'code')->where('is_active', true),
            ],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $selectedMethod = isset($validated['method'])
            ? PaymentMethod::query()
                ->where('code', $validated['method'])
                ->where('is_active', true)
                ->configured()
                ->first()
            : null;

        if (isset($validated['method']) && ! $selectedMethod) {
            return response()->json([
                'success' => false,
                'message' => 'Metode pembayaran belum dikonfigurasi.',
            ], 422);
        }

        if (!$payment) {
            $method = $selectedMethod ?? PaymentMethod::query()
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

            $payment = new Payment([
                'order_id' => $order->id,
                'amount' => $order->total,
                'method' => $method->code,
                'payment_method_name' => $method->name,
                'payment_method_type' => $method->type,
                'payment_account_number' => $method->account_number,
                'payment_account_name' => $method->account_name,
                'payment_qris_image' => $method->qris_image,
                'payment_method_description' => $method->description,
                'status' => PaymentStatus::PENDING,
            ]);
        }

        if ($selectedMethod && $payment->proof && ! $request->hasFile('proof')) {
            return response()->json([
                'success' => false,
                'message' => 'Unggah bukti pembayaran baru saat mengganti metode pembayaran.',
            ], 422);
        }

        if ($selectedMethod) {
            $payment->method = $selectedMethod->code;
            $payment->payment_method_name = $selectedMethod->name;
            $payment->payment_method_type = $selectedMethod->type;
            $payment->payment_account_number = $selectedMethod->account_number;
            $payment->payment_account_name = $selectedMethod->account_name;
            $payment->payment_qris_image = $selectedMethod->qris_image;
            $payment->payment_method_description = $selectedMethod->description;
        }

        if (isset($validated['notes'])) {
            $payment->notes = $validated['notes'];
        }

        $previousProof = $payment->proof;
        if ($request->hasFile('proof')) {
            $path = $request->file('proof')->store('payments', 'public');
            if (! $path) {
                throw new \RuntimeException('Bukti pembayaran gagal disimpan.');
            }

            $payment->proof = $path;
            $payment->status = PaymentStatus::PENDING;
            $payment->verified_by = null;
            $payment->verified_at = null;
            $payment->notes = $validated['notes'] ?? null;
        }

        $payment->save();

        if ($request->hasFile('proof') && $previousProof && $previousProof !== $payment->proof) {
            Storage::disk('public')->delete($previousProof);
        }

        return response()->json([
            'success' => true,
            'message' => 'Bukti pembayaran berhasil diunggah.',
            'data' => $payment->fresh(),
        ]);
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
}
