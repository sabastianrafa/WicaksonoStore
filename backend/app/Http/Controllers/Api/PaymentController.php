<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
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

        if (!$payment) {
            $payment = Payment::create([
                'order_id' => $order->id,
                'method' => PaymentMethod::TRANSFER_BANK,
                'amount' => $order->total,
                'status' => PaymentStatus::PENDING,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data pembayaran berhasil diambil.',
            'data' => $payment,
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

        $validated = $request->validate([
            'proof' => [
                'required_without:method',
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'method' => ['nullable', Rule::enum(PaymentMethod::class)],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $payment = $order->payment;

        if (!$payment) {
            $payment = new Payment([
                'order_id' => $order->id,
                'amount' => $order->total,
                'method' => $validated['method'] ?? PaymentMethod::TRANSFER_BANK->value,
                'status' => PaymentStatus::PENDING,
            ]);
        }

        if (isset($validated['method'])) {
            $payment->method = $validated['method'];
        }

        if (isset($validated['notes'])) {
            $payment->notes = $validated['notes'];
        }

        if ($request->hasFile('proof')) {
            // Hapus bukti lama jika ada
            if ($payment->proof) {
                Storage::disk('public')->delete($payment->proof);
            }

            $path = $request->file('proof')->store('payments', 'public');
            $payment->proof = $path;
            // Jika sebelumnya di-reject, kembalikan ke pending saat upload bukti baru
            $payment->status = PaymentStatus::PENDING;
            $payment->verified_by = null;
            $payment->verified_at = null;
        }

        $payment->save();

        return response()->json([
            'success' => true,
            'message' => 'Bukti pembayaran berhasil diunggah.',
            'data' => $payment->fresh(),
        ]);
    }
}
