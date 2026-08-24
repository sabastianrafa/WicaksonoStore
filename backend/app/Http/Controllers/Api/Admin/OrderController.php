<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    private function canChangeStatus(
        string $current,
        string $new
    ): bool {
        $transitions = [
            'pending' => [
                'confirmed',
                'cancelled',
            ],

            'confirmed' => [
                'processing',
                'cancelled',
            ],

            'processing' => [
                'shipped',
            ],

            'shipped' => [
                'completed',
            ],

            'completed' => [],

            'cancelled' => [],
        ];

        return in_array(
            $new,
            $transitions[$current] ?? [],
            true
        );
    }
    /**
     * Menampilkan semua pesanan untuk admin.
     *
     * GET /api/admin/orders
     */
    public function index(Request $request): JsonResponse
    {
        $query = Order::query()
            ->with([
                'user',
                'items.product.images',
                'shippingMethod',
                'payment',
            ]);

        /*
        |--------------------------------------------------------------------------
        | FILTER BY STATUS
        |--------------------------------------------------------------------------
        */
        if ($request->filled('status')) {
            $query->where('order_status', $request->input('status'));
        }

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('order_number', 'like', "%{$search}%")
                    ->orWhere('shipping_name', 'like', "%{$search}%")
                    ->orWhere('shipping_phone', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        /*
        |--------------------------------------------------------------------------
        | DATE RANGE
        |--------------------------------------------------------------------------
        */
        if ($request->filled('start_date')) {
            $query->whereDate('created_at', '>=', $request->input('start_date'));
        }

        if ($request->filled('end_date')) {
            $query->whereDate('created_at', '<=', $request->input('end_date'));
        }

        /*
        |--------------------------------------------------------------------------
        | SORTING
        |--------------------------------------------------------------------------
        */
        switch ($request->input('sort')) {
            case 'oldest':
                $query->oldest();
                break;
            case 'total_desc':
                $query->orderByDesc('total');
                break;
            case 'total_asc':
                $query->orderBy('total');
                break;
            case 'latest':
            default:
                $query->latest();
                break;
        }

        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);
        $orders = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Data pesanan berhasil diambil.',
            'data' => $orders->items(),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    /**
     * Menampilkan detail pesanan admin.
     *
     * GET /api/admin/orders/{order}
     */
    public function show(Order $order): JsonResponse
    {
        $order->load([
            'user',
            'items.product.images',
            'shippingMethod',
            'payment.verifier',
            'address',
            'reviews.user',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Detail pesanan berhasil diambil.',
            'data' => $order,
        ]);
    }

    /**
     * Memperbarui status pesanan.
     *
     * PATCH /api/admin/orders/{order}/status
     */
    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::enum(OrderStatus::class)],
        ]);

        $newStatus = OrderStatus::from($validated['status']);
        $oldStatus = $order->order_status;

        DB::transaction(function () use ($order, $newStatus, $oldStatus) {
            $updates = [
                'order_status' => $newStatus,
            ];

            if ($newStatus === OrderStatus::CONFIRMED && !$order->confirmed_at) {
                $updates['confirmed_at'] = now();
            } elseif ($newStatus === OrderStatus::SHIPPED && !$order->shipped_at) {
                $updates['shipped_at'] = now();
            } elseif ($newStatus === OrderStatus::COMPLETED && !$order->completed_at) {
                $updates['completed_at'] = now();
            } elseif ($newStatus === OrderStatus::CANCELLED && $oldStatus !== OrderStatus::CANCELLED) {
                $updates['cancelled_at'] = now();

                // Kembalikan stock produk
                foreach ($order->items as $item) {
                    if ($item->product_id) {
                        $product = Product::find($item->product_id);
                        if ($product) {
                            $product->increment('stock', $item->quantity);
                            $product->decrement('sold', min($product->sold, $item->quantity));
                        }
                    }
                }
            }

            $order->update($updates);
        });

        $order->load([
            'user',
            'items.product.images',
            'shippingMethod',
            'payment',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Status pesanan berhasil diperbarui.',
            'data' => $order,
        ]);
    }
}
