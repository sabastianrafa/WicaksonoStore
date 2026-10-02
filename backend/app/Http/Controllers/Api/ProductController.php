<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * GET /api/products
     *
     * Query:
     * ?page=1
     * ?per_page=6
     * ?search=keripik
     * ?category_id=1
     * ?min_price=10000
     * ?max_price=50000
     * ?min_rating=4
     * ?sort=terlaris
     * ?sort=termurah
     * ?sort=termahal
     * ?sort=rating
     * ?sort=terbaru
     */
    public function index(Request $request): JsonResponse
    {
        $query = Product::query()
            ->with([
                'category',
                'images',
            ])
            ->where('is_active', true);

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {
            $search = trim($request->input('search'));

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        /*
        |--------------------------------------------------------------------------
        | CATEGORY
        |--------------------------------------------------------------------------
        */

        if ($request->filled('category_id')) {
            $query->where(
                'category_id',
                (int) $request->input('category_id')
            );
        }

        /*
        |--------------------------------------------------------------------------
        | PRICE
        |--------------------------------------------------------------------------
        */

        if ($request->filled('min_price')) {
            $query->where(
                'price',
                '>=',
                (int) $request->input('min_price')
            );
        }

        if ($request->filled('max_price')) {
            $query->where(
                'price',
                '<=',
                (int) $request->input('max_price')
            );
        }

        /*
        |--------------------------------------------------------------------------
        | RATING
        |--------------------------------------------------------------------------
        */

        if ($request->filled('min_rating')) {
            $query->where(
                'rating',
                '>=',
                (float) $request->input('min_rating')
            );
        }

        /*
        |--------------------------------------------------------------------------
        | PROMO / DISKON
        |--------------------------------------------------------------------------
        |
        | Jika discounted=1 maka hanya mengambil produk
        | yang memiliki diskon lebih dari 0.
        |
        | Contoh:
        | /api/products?discounted=1
        |
        */

        if ($request->boolean('discounted')) {
            $query->where('discount', '>', 0);
        }

        /*
        |--------------------------------------------------------------------------
        | SORTING
        |--------------------------------------------------------------------------
        */

        switch ($request->input('sort', 'terbaru')) {
            case 'terlaris':
                $query->orderByDesc('sold');
                break;

            case 'termurah':
                $query->orderBy('price', 'asc');
                break;

            case 'termahal':
                $query->orderBy('price', 'desc');
                break;

            case 'rating':
                $query->orderByDesc('rating');
                break;

            case 'nama_asc':
                $query->orderBy('name', 'asc');
                break;

            case 'nama_desc':
                $query->orderBy('name', 'desc');
                break;

            case 'terbaru':
            default:
                $query->latest();
                break;
        }

        /*
        |--------------------------------------------------------------------------
        | PAGINATION
        |--------------------------------------------------------------------------
        */

        $perPage = min(
            max((int) $request->input('per_page', 10), 1),
            100
        );

        $products = $query->paginate($perPage);

        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'success' => true,
            'message' => 'Data produk berhasil diambil.',
            'data' => $products->items(),

            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'from' => $products->firstItem(),
                'to' => $products->lastItem(),
            ],
        ]);
    }

    /**
     * GET /api/products/{product}
     */
    public function show(Product $product): JsonResponse
    {
        if (!$product->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $product->load([
            'category',
            'images',
            'reviews.user',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Detail produk berhasil diambil.',
            'data' => $product,
        ]);
    }
}