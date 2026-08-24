<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ShippingMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    /**
     * Menampilkan daftar pesanan user.
     *
     * GET /api/orders
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->user()
            ->orders()
            ->with([
                'items.product.images',
                'shippingMethod',
                'payment',
            ]);

        if ($request->filled('status')) {
            $query->where('order_status', $request->input('status'));
        }

        $perPage = min(max((int) $request->input('per_page', 10), 1), 50);
        $orders = $query->latest()->paginate($perPage);

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
     * Membuat pesanan baru (Checkout).
     *
     * POST /api/orders
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'address_id' => ['required', 'exists:addresses,id'],
            'shipping_method_id' => ['required', 'exists:shipping_methods,id'],
            'payment_method' => ['sometimes', Rule::enum(PaymentMethod::class)],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        $user = $request->user();

        // 1. Ambil alamat dan pastikan milik user
        $address = Address::where('user_id', $user->id)
            ->where('id', $validated['address_id'])
            ->first();

        if (!$address) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat pengiriman tidak valid atau tidak ditemukan.',
            ], 422);
        }

        // 2. Ambil metode pengiriman
        $shippingMethod = ShippingMethod::where('is_active', true)
            ->find($validated['shipping_method_id']);

        if (!$shippingMethod) {
            return response()->json([
                'success' => false,
                'message' => 'Metode pengiriman tidak tersedia atau tidak aktif.',
            ], 422);
        }

        // 3. Ambil cart
        $cart = $user->cart;
        if (!$cart || $cart->items()->count() === 0) {
            return response()->json([
                'success' => false,
                'message' => 'Keranjang belanja masih kosong.',
            ], 422);
        }

        $cartItems = $cart->items()->with('product')->get();

        try {
            $order = DB::transaction(function () use ($user, $address, $shippingMethod, $cart, $cartItems, $validated) {
                $subtotal = 0;
                $orderItemsData = [];

                foreach ($cartItems as $item) {
                    $product = Product::lockForUpdate()->find($item->product_id);

                    if (!$product || !$product->is_active) {
                        $productName = $item->product ? $item->product->name : 'Produk';
                        throw new \Exception("Produk '{$productName}' sudah tidak aktif atau tidak tersedia.");
                    }

                    if ($product->stock < $item->quantity) {
                        throw new \Exception("Stok untuk produk '{$product->name}' tidak mencukupi (tersedia: {$product->stock}).");
                    }

                    $itemPrice = (float) $product->price;
                    $itemSubtotal = $itemPrice * $item->quantity;
                    $subtotal += $itemSubtotal;

                    // Kurangi stock & tambah sold
                    $product->decrement('stock', $item->quantity);
                    $product->increment('sold', $item->quantity);

                    $orderItemsData[] = [
                        'product_id' => $product->id,
                        'product_name' => $product->name,
                        'price' => $itemPrice,
                        'quantity' => $item->quantity,
                        'subtotal' => $itemSubtotal,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }

                $shippingCost = (float) $shippingMethod->cost;
                $grandTotal = $subtotal + $shippingCost;

                // Buat nomor pesanan unik
                $orderNumber = 'ORD-' . date('Ymd') . '-' . strtoupper(Str::random(6));

                $order = Order::create([
                    'user_id' => $user->id,
                    'address_id' => $address->id,
                    'shipping_method_id' => $shippingMethod->id,
                    'order_number' => $orderNumber,
                    'subtotal' => $subtotal,
                    'shipping_cost' => $shippingCost,
                    'total' => $grandTotal,
                    'shipping_name' => $address->name,
                    'shipping_phone' => $address->phone,
                    'shipping_province' => $address->province,
                    'shipping_city' => $address->city,
                    'shipping_postal_code' => $address->postal_code,
                    'shipping_address' => $address->address,
                    'order_status' => OrderStatus::PENDING,
                    'notes' => $validated['notes'] ?? null,
                ]);

                // Simpan order items
                foreach ($orderItemsData as $itemData) {
                    $order->items()->create($itemData);
                }

                // Buat Payment pending
                $paymentMethod = $validated['payment_method'] ?? PaymentMethod::TRANSFER_BANK->value;
                Payment::create([
                    'order_id' => $order->id,
                    'method' => $paymentMethod,
                    'amount' => $grandTotal,
                    'status' => PaymentStatus::PENDING,
                ]);

                // Kosongkan keranjang setelah order berhasil
                $cart->items()->delete();

                return $order;
            });

            $order->load([
                'items.product.images',
                'shippingMethod',
                'payment',
                'address',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pesanan berhasil dibuat.',
                'data' => $order,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * Menampilkan detail pesanan.
     *
     * GET /api/orders/{order}
     */
    public function show(Request $request, Order $order): JsonResponse
    {
        if ($order->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.',
            ], 404);
        }

        $order->load([
            'items.product.images',
            'shippingMethod',
            'payment',
            'address',
            'reviews',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Detail pesanan berhasil diambil.',
            'data' => $order,
        ]);
    }

    /**
     * Membatalkan pesanan.
     *
     * POST /api/orders/{order}/cancel
     */
    public function cancel(Request $request, Order $order): JsonResponse
    {
        if ($order->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan.',
            ], 404);
        }

        if ($order->order_status !== OrderStatus::PENDING) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pesanan berstatus pending yang dapat dibatalkan.',
            ], 422);
        }

        DB::transaction(function () use ($order) {
            // Kembalikan stok produk
            foreach ($order->items as $item) {
                if ($item->product_id) {
                    $product = Product::find($item->product_id);
                    if ($product) {
                        $product->increment('stock', $item->quantity);
                        $product->decrement('sold', min($product->sold, $item->quantity));
                    }
                }
            }

            $order->update([
                'order_status' => OrderStatus::CANCELLED,
                'cancelled_at' => now(),
            ]);

            if ($order->payment && $order->payment->status === PaymentStatus::PENDING) {
                $order->payment->update([
                    'status' => PaymentStatus::REJECTED,
                    'notes' => 'Pesanan dibatalkan oleh pengguna.',
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Pesanan berhasil dibatalkan.',
            'data' => $order->fresh(['items', 'payment']),
        ]);
    }
}
