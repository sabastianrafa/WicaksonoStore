<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

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
        if ($payment->method === 'midtrans') {
            throw ValidationException::withMessages([
                'payment' => 'Pembayaran Midtrans hanya dapat diverifikasi melalui notifikasi Midtrans.',
            ]);
        }

        $request->validate([
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        DB::transaction(function () use ($request, $payment) {
            $lockedPayment = Payment::query()
                ->with(['order', 'paymentMethod'])
                ->lockForUpdate()
                ->findOrFail($payment->id);

            if ($lockedPayment->status !== PaymentStatus::PENDING) {
                throw ValidationException::withMessages([
                    'payment' => 'Pembayaran ini sudah diproses dan tidak dapat diverifikasi ulang.',
                ]);
            }

            if ($lockedPayment->method === 'midtrans') {
                throw ValidationException::withMessages([
                    'payment' => 'Pembayaran Midtrans hanya dapat diverifikasi melalui notifikasi Midtrans.',
                ]);
            }

            if ($lockedPayment->order?->order_status === OrderStatus::CANCELLED) {
                throw ValidationException::withMessages([
                    'payment' => 'Pesanan yang dibatalkan tidak dapat dibayar.',
                ]);
            }

            if ($lockedPayment->paymentMethod?->requires_proof && ! $lockedPayment->proof) {
                throw ValidationException::withMessages([
                    'payment' => 'Bukti pembayaran belum diunggah oleh pelanggan.',
                ]);
            }

            $lockedPayment->update([
                'status' => PaymentStatus::PAID,
                'verified_by' => $request->user()->id,
                'verified_at' => now(),
                'notes' => $request->input('notes', $lockedPayment->notes),
            ]);

            $order = $lockedPayment->order;
            if ($order && $order->order_status === OrderStatus::PENDING) {
                $order->update([
                    'order_status' => OrderStatus::CONFIRMED,
                    'confirmed_at' => now(),
                ]);
            }
        });

        $payment->refresh()->load(['order.user', 'verifier']);

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
        if ($payment->method === 'midtrans') {
            throw ValidationException::withMessages([
                'payment' => 'Status pembayaran Midtrans dikelola oleh notifikasi Midtrans.',
            ]);
        }

        $request->validate([
            'notes' => ['sometimes', 'nullable', 'string', 'min:3', 'max:500'],
            'reason' => ['required_without:notes', 'nullable', 'string', 'min:3', 'max:500'],
        ]);

        $notes = trim((string) ($request->input('reason') ?? $request->input('notes') ?? ''));

        if ($notes === '') {
            throw ValidationException::withMessages([
                'reason' => 'Alasan penolakan wajib diisi.',
            ]);
        }

        DB::transaction(function () use ($request, $payment, $notes) {
            $lockedPayment = Payment::query()
                ->with(['order', 'paymentMethod'])
                ->lockForUpdate()
                ->findOrFail($payment->id);

            if ($lockedPayment->status !== PaymentStatus::PENDING) {
                throw ValidationException::withMessages([
                    'payment' => 'Pembayaran ini sudah diproses dan tidak dapat ditolak ulang.',
                ]);
            }

            if ($lockedPayment->method === 'midtrans') {
                throw ValidationException::withMessages([
                    'payment' => 'Status pembayaran Midtrans dikelola oleh notifikasi Midtrans.',
                ]);
            }

            if ($lockedPayment->order?->order_status === OrderStatus::CANCELLED) {
                throw ValidationException::withMessages([
                    'payment' => 'Pembayaran pesanan yang dibatalkan tidak dapat diproses.',
                ]);
            }

            if ($lockedPayment->paymentMethod?->requires_proof && ! $lockedPayment->proof) {
                throw ValidationException::withMessages([
                    'payment' => 'Belum ada bukti pembayaran yang dapat ditolak.',
                ]);
            }

            $lockedPayment->update([
                'status' => PaymentStatus::REJECTED,
                'verified_by' => $request->user()->id,
                'verified_at' => now(),
                'notes' => $notes,
            ]);
        });

        $payment->refresh()->load(['order.user', 'verifier']);

        return response()->json([
            'success' => true,
            'message' => 'Pembayaran ditolak.',
            'data' => $payment,
        ]);
    }
}
