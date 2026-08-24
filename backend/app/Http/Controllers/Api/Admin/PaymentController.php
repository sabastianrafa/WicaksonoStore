<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    /**
     * Menampilkan daftar semua pembayaran untuk admin.
     *
     * GET /api/admin/payments
     */
    public function index(Request $request): JsonResponse
    {
        $query = Payment::query()
            ->with([
                'order.user',
                'order.shippingMethod',
                'verifier',
            ]);

        /*
        |--------------------------------------------------------------------------
        | FILTER BY STATUS
        |--------------------------------------------------------------------------
        */
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        /*
        |--------------------------------------------------------------------------
        | FILTER BY METHOD
        |--------------------------------------------------------------------------
        */
        if ($request->filled('method')) {
            $query->where('method', $request->input('method'));
        }

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('order', function ($oq) use ($search) {
                $oq->where('order_number', 'like', "%{$search}%")
                    ->orWhere('shipping_name', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);
        $payments = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Data pembayaran berhasil diambil.',
            'data' => $payments->items(),
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
        ]);
    }

    /**
     * Menampilkan detail pembayaran.
     *
     * GET /api/admin/payments/{payment}
     */
    public function show(Payment $payment): JsonResponse
    {
        $payment->load([
            'order.user',
            'order.items.product.images',
            'order.shippingMethod',
            'order.address',
            'verifier',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Detail pembayaran berhasil diambil.',
            'data' => $payment,
        ]);
    }

    /**
     * Memverifikasi / menerima pembayaran.
     *
     * PATCH /api/admin/payments/{payment}/verify
     */
    public function verify(Request $request, Payment $payment): JsonResponse
    {
        $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($request, $payment) {
            $payment->update([
                'status' => PaymentStatus::PAID,
                'verified_by' => $request->user()->id,
                'verified_at' => now(),
                'notes' => $request->input('notes', $payment->notes),
            ]);

            // Jika pesanan masih pending, ubah ke confirmed
            $order = $payment->order;
            if ($order && $order->order_status === OrderStatus::PENDING) {
                $order->update([
                    'order_status' => OrderStatus::CONFIRMED,
                    'confirmed_at' => now(),
                ]);
            }
        });

        $payment->load(['order.user', 'verifier']);

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran berhasil diverifikasi.',
            'data' => $payment,
        ]);
    }

    /**
     * Menolak pembayaran.
     *
     * PATCH /api/admin/payments/{payment}/reject
     */
    public function reject(Request $request, Payment $payment): JsonResponse
    {
        $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $notes = $request->input('reason') ?? $request->input('notes') ?? $payment->notes;

        $payment->update([
            'status' => PaymentStatus::REJECTED,
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
            'notes' => $notes,
        ]);

        $payment->load(['order.user', 'verifier']);

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran ditolak.',
            'data' => $payment,
        ]);
    }
}
