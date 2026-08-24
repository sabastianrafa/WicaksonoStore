<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    /**
     * Menampilkan isi keranjang belanja user.
     *
     * GET /api/cart
     */
    public function index(Request $request): JsonResponse
    {
        $cart = $this->getOrCreateCart($request->user());

        $cart->load([
            'items.product' => function ($query) {
                $query->with(['category', 'images']);
            }
        ]);

        $subtotal = 0;
        $totalItems = 0;

        $items = $cart->items->map(function ($item) use (&$subtotal, &$totalItems) {
            $productPrice = $item->product ? (float) $item->product->price : 0;
            $itemSubtotal = $productPrice * $item->quantity;
            $subtotal += $itemSubtotal;
            $totalItems += $item->quantity;

            $itemArray = $item->toArray();
            $itemArray['subtotal'] = $itemSubtotal;
            return $itemArray;
        });

        return response()->json([
            'success' => true,
            'message' => 'Data keranjang berhasil diambil.',
            'data' => [
                'id' => $cart->id,
                'user_id' => $cart->user_id,
                'items' => $items,
                'total_items' => $totalItems,
                'subtotal' => $subtotal,
            ],
        ]);
    }

    /**
     * Menambahkan item ke keranjang.
     *
     * POST /api/cart/items
     */
    public function addItem(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_id' => ['required', 'exists:products,id'],
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $product = Product::findOrFail($validated['product_id']);

        if (!$product->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak tersedia atau tidak aktif.',
            ], 422);
        }

        $cart = $this->getOrCreateCart($request->user());

        $existingItem = $cart->items()
            ->where('product_id', $product->id)
            ->first();

        $requestedQty = (int) $validated['quantity'];
        $currentQty = $existingItem ? $existingItem->quantity : 0;
        $newQty = $currentQty + $requestedQty;

        if ($newQty > $product->stock) {
            return response()->json([
                'success' => false,
                'message' => "Stok produk tidak mencukupi. Stok tersedia: {$product->stock}",
            ], 422);
        }

        if ($existingItem) {
            $existingItem->update(['quantity' => $newQty]);
            $item = $existingItem;
        } else {
            $item = $cart->items()->create([
                'product_id' => $product->id,
                'quantity' => $newQty,
            ]);
        }

        $item->load(['product.category', 'product.images']);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan ke keranjang.',
            'data' => $item,
        ], 201);
    }

    /**
     * Mengubah quantity item di keranjang.
     *
     * PUT /api/cart/items/{item}
     */
    public function updateItem(Request $request, CartItem $item): JsonResponse
    {
        $cart = $this->getOrCreateCart($request->user());

        if ($item->cart_id !== $cart->id) {
            return response()->json([
                'success' => false,
                'message' => 'Item keranjang tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $product = $item->product;

        if (!$product || !$product->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak tersedia atau tidak aktif.',
            ], 422);
        }

        $quantity = (int) $validated['quantity'];

        if ($quantity > $product->stock) {
            return response()->json([
                'success' => false,
                'message' => "Stok produk tidak mencukupi. Stok tersedia: {$product->stock}",
            ], 422);
        }

        $item->update(['quantity' => $quantity]);
        $item->load(['product.category', 'product.images']);

        return response()->json([
            'success' => true,
            'message' => 'Jumlah produk berhasil diperbarui.',
            'data' => $item,
        ]);
    }

    /**
     * Menghapus item dari keranjang.
     *
     * DELETE /api/cart/items/{item}
     */
    public function removeItem(Request $request, CartItem $item): JsonResponse
    {
        $cart = $this->getOrCreateCart($request->user());

        if ($item->cart_id !== $cart->id) {
            return response()->json([
                'success' => false,
                'message' => 'Item keranjang tidak ditemukan.',
            ], 404);
        }

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item berhasil dihapus dari keranjang.',
        ]);
    }

    /**
     * Mengosongkan keranjang.
     *
     * DELETE /api/cart
     */
    public function clear(Request $request): JsonResponse
    {
        $cart = $this->getOrCreateCart($request->user());
        $cart->items()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Keranjang berhasil dikosongkan.',
        ]);
    }

    /**
     * Helper untuk mengambil atau membuat cart user.
     */
    private function getOrCreateCart($user): Cart
    {
        return Cart::firstOrCreate([
            'user_id' => $user->id,
        ]);
    }
}
