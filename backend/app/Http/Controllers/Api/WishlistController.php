<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    /**
     * Menampilkan semua produk di wishlist user.
     *
     * GET /api/wishlist
     */
    public function index(Request $request): JsonResponse
    {
        $wishlist = $request->user()
            ->wishlists()
            ->with(['product' => function ($query) {
                $query->with(['category', 'images']);
            }])
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Data wishlist berhasil diambil.',
            'data' => $wishlist,
        ]);
    }

    /**
     * Menambahkan produk ke wishlist.
     *
     * POST /api/wishlist/{product}
     */
    public function store(Request $request, Product $product): JsonResponse
    {
        if (!$product->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan atau tidak aktif.',
            ], 404);
        }

        $wishlistItem = $request->user()->wishlists()->firstOrCreate([
            'product_id' => $product->id,
        ]);

        $wishlistItem->load(['product.category', 'product.images']);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan ke wishlist.',
            'data' => $wishlistItem,
        ], 201);
    }

    /**
     * Menghapus produk dari wishlist.
     *
     * DELETE /api/wishlist/{product}
     */
    public function destroy(Request $request, Product $product): JsonResponse
    {
        $deleted = $request->user()
            ->wishlists()
            ->where('product_id', $product->id)
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus dari wishlist.',
        ]);
    }

    /**
     * Mengecek status produk di wishlist.
     *
     * GET /api/wishlist/{product}
     */
    public function check(Request $request, Product $product): JsonResponse
    {
        $exists = $request->user()
            ->wishlists()
            ->where('product_id', $product->id)
            ->exists();

        return response()->json([
            'success' => true,
            'message' => 'Status wishlist berhasil dicek.',
            'data' => [
                'in_wishlist' => $exists,
            ],
        ]);
    }
}
