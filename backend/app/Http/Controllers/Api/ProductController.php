<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /**
     * Menampilkan daftar produk.
     *
     * GET /api/products
     *
     * Query yang tersedia:
     * ?search=keripik
     * ?category_id=1
     * ?min_price=10000
     * ?max_price=50000
     * ?sort=latest
     * ?sort=price_low
     * ?sort=price_high
     * ?per_page=12
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
            $search = $request->input('search');

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        /*
        |--------------------------------------------------------------------------
        | CATEGORY FILTER
        |--------------------------------------------------------------------------
        */

        if ($request->filled('category_id')) {
            $query->where(
                'category_id',
                $request->input('category_id')
            );
        }

        /*
        |--------------------------------------------------------------------------
        | PRICE FILTER
        |--------------------------------------------------------------------------
        */

        if ($request->filled('min_price')) {
            $query->where(
                'price',
                '>=',
                $request->input('min_price')
            );
        }

        if ($request->filled('max_price')) {
            $query->where(
                'price',
                '<=',
                $request->input('max_price')
            );
        }

        /*
        |--------------------------------------------------------------------------
        | SORTING
        |--------------------------------------------------------------------------
        */

        switch ($request->input('sort')) {
            case 'price_low':
                $query->orderBy('price', 'asc');
                break;

            case 'price_high':
                $query->orderBy('price', 'desc');
                break;

            case 'name_asc':
                $query->orderBy('name', 'asc');
                break;

            case 'name_desc':
                $query->orderBy('name', 'desc');
                break;

            case 'latest':
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
            max((int) $request->input('per_page', 12), 1),
            100
        );

        $products = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Data produk berhasil diambil.',
            'data' => $products->items(),

            'meta' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
            ],
        ]);
    }

    /**
     * Menampilkan detail produk.
     *
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