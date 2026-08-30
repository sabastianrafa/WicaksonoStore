<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReviewController extends Controller
{
    /**
     * Menampilkan ulasan untuk suatu produk.
     *
     * GET /api/products/{product}/reviews
     */
    public function index(Request $request, Product $product): JsonResponse
    {
        $perPage = min(max((int) $request->input('per_page', 10), 1), 50);

        $reviews = $product->reviews()
            ->with(['user' => function ($q) {
                $q->select('id', 'name');
            }])
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Data ulasan produk berhasil diambil.',
            'data' => $reviews->items(),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'per_page' => $reviews->perPage(),
                'total' => $reviews->total(),
            ],
        ]);
    }

    /**
     * Menambahkan ulasan produk oleh user yang telah membeli.
     *
     * POST /api/products/{product}/reviews
     */
    public function store(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => ['required', 'exists:orders,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();

        // 1. Cek kepemilikan order
        $order = Order::where('user_id', $user->id)
            ->where('id', $validated['order_id'])
            ->first();

        if (!$order) {
            return response()->json([
                'success' => false,
                'message' => 'Pesanan tidak ditemukan atau bukan milik Anda.',
            ], 404);
        }

        // 2. Cek status order (harus completed atau shipped)
        $eligibleStatuses = [
            OrderStatus::COMPLETED->value,
            OrderStatus::SHIPPED->value,
        ];

        $orderStatus = $order->order_status instanceof \BackedEnum
            ? $order->order_status->value
            : (string) $order->order_status;

        if (!in_array($orderStatus, $eligibleStatuses, true)) {
            return response()->json([
                'success' => false,
                'message' => 'Ulasan hanya dapat diberikan untuk pesanan yang telah dikirim atau selesai.',
            ], 422);
        }

        // 3. Cek apakah produk benar-benar dibeli dalam order ini
        $itemBought = $order->items()
            ->where('product_id', $product->id)
            ->exists();

        if (!$itemBought) {
            return response()->json([
                'success' => false,
                'message' => 'Produk ini tidak ada dalam daftar pesanan terkait.',
            ], 422);
        }

        // 4. Cek duplikasi review
        $alreadyReviewed = Review::where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->where('order_id', $order->id)
            ->exists();

        if ($alreadyReviewed) {
            return response()->json([
                'success' => false,
                'message' => 'Anda sudah memberikan ulasan untuk produk ini pada pesanan terkait.',
            ], 422);
        }

        // 5. Simpan review & update agregasi rating & review_count pada produk
        $review = DB::transaction(function () use ($user, $product, $order, $validated) {
            $createdReview = Review::create([
                'user_id' => $user->id,
                'product_id' => $product->id,
                'order_id' => $order->id,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
            ]);

            $avgRating = Review::where('product_id', $product->id)->avg('rating') ?: 0;
            $reviewCount = Review::where('product_id', $product->id)->count();

            $product->update([
                'rating' => round($avgRating, 2),
                'review_count' => $reviewCount,
            ]);

            return $createdReview;
        });

        $review->load(['user' => function ($q) {
            $q->select('id', 'name');
        }]);

        return response()->json([
            'success' => true,
            'message' => 'Ulasan berhasil disimpan.',
            'data' => $review,
        ], 201);
    }
}
