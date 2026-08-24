<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Menampilkan semua kategori.
     *
     * GET /api/categories
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::query()
            ->withCount([
                'products' => function ($query) {
                    $query->where('is_active', true);
                }
            ])
            ->where('is_active', true);

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        |
        | Contoh:
        | GET /api/categories?search=keripik
        |
        */

        if ($request->filled('search')) {
            $search = $request->input('search');

            $query->where(
                'name',
                'like',
                "%{$search}%"
            );
        }

        /*
        |--------------------------------------------------------------------------
        | SORTING
        |--------------------------------------------------------------------------
        */

        switch ($request->input('sort')) {
            case 'name_desc':
                $query->orderBy('name', 'desc');
                break;

            case 'products':
                $query->orderBy(
                    'products_count',
                    'desc'
                );
                break;

            case 'latest':
                $query->latest();
                break;

            case 'name_asc':
            default:
                $query->orderBy('name', 'asc');
                break;
        }

        $categories = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Data kategori berhasil diambil.',
            'data' => $categories,
        ]);
    }

    /**
     * Menampilkan detail kategori.
     *
     * GET /api/categories/{category}
     */
    public function show(Category $category): JsonResponse
    {
        /*
        |--------------------------------------------------------------------------
        | Kategori tidak aktif tidak dapat dilihat user.
        |--------------------------------------------------------------------------
        */

        if (!$category->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Kategori tidak ditemukan.',
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | Ambil produk aktif dalam kategori
        |--------------------------------------------------------------------------
        */

        $category->load([
            'products' => function ($query) {
                $query
                    ->where('is_active', true)
                    ->with([
                        'images',
                        'category',
                    ])
                    ->latest();
            }
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Detail kategori berhasil diambil.',
            'data' => $category,
        ]);
    }
}