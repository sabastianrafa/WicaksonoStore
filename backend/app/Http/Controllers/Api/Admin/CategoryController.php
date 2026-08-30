<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * Menampilkan semua kategori untuk admin.
     *
     * GET /api/admin/categories
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::query()
            ->withCount('products');

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
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
        | FILTER STATUS
        |--------------------------------------------------------------------------
        */

        if ($request->filled('is_active')) {
            $isActive = filter_var(
                $request->input('is_active'),
                FILTER_VALIDATE_BOOLEAN
            );

            $query->where(
                'is_active',
                $isActive
            );
        }

        /*
        |--------------------------------------------------------------------------
        | SORTING
        |--------------------------------------------------------------------------
        */

        switch ($request->input('sort')) {
            case 'name_desc':
                $query->orderBy(
                    'name',
                    'desc'
                );
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
                $query->orderBy(
                    'name',
                    'asc'
                );
                break;
        }

        /*
        |--------------------------------------------------------------------------
        | PAGINATION
        |--------------------------------------------------------------------------
        */

        $perPage = min(
            max(
                (int) $request->input(
                    'per_page',
                    15
                ),
                1
            ),
            100
        );

        $categories = $query->paginate(
            $perPage
        );

        return response()->json([
            'success' => true,
            'message' => 'Data kategori berhasil diambil.',
            'data' => $categories->items(),

            'meta' => [
                'current_page' =>
                    $categories->currentPage(),

                'last_page' =>
                    $categories->lastPage(),

                'per_page' =>
                    $categories->perPage(),

                'total' =>
                    $categories->total(),
            ],
        ]);
    }

    /**
     * Membuat kategori baru.
     *
     * POST /api/admin/categories
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:categories,name',
            ],

            'icon' => [
                'nullable',
                'string',
                'max:20',
            ],

            'color' => [
                'nullable',
                'string',
                'max:20',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | GENERATE SLUG
        |--------------------------------------------------------------------------
        */

        $slug = $this->generateUniqueSlug(
            $validated['name']
        );

        /*
        |--------------------------------------------------------------------------
        | CREATE CATEGORY
        |--------------------------------------------------------------------------
        */

        $category = Category::create([
            'name' => $validated['name'],

            'slug' => $slug,

            'icon' =>
                $validated['icon'] ?? null,

            'color' =>
                $validated['color'] ?? null,

            'is_active' =>
                $validated['is_active'] ?? true,
        ]);

        /*
        |--------------------------------------------------------------------------
        | LOAD PRODUCT COUNT
        |--------------------------------------------------------------------------
        */

        $category->loadCount('products');

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil ditambahkan.',
            'data' => $category,
        ], 201);
    }

    /**
     * Menampilkan detail kategori.
     *
     * GET /api/admin/categories/{category}
     */
    public function show(
        Category $category
    ): JsonResponse {
        $category->loadCount('products');

        $category->load([
            'products' => function ($query) {
                $query
                    ->with('images')
                    ->latest();
            }
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Detail kategori berhasil diambil.',
            'data' => $category,
        ]);
    }

    /**
     * Mengubah kategori.
     *
     * PUT/PATCH /api/admin/categories/{category}
     */
    public function update(
        Request $request,
        Category $category
    ): JsonResponse {
        $validated = $request->validate([
            'name' => [
                'sometimes',
                'string',
                'max:255',
                'unique:categories,name,' .
                    $category->id,
            ],

            'icon' => [
                'nullable',
                'string',
                'max:20',
            ],

            'color' => [
                'nullable',
                'string',
                'max:20',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | UPDATE SLUG
        |--------------------------------------------------------------------------
        */

        if (isset($validated['name'])) {
            $validated['slug'] =
                $this->generateUniqueSlug(
                    $validated['name'],
                    $category->id
                );
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE CATEGORY
        |--------------------------------------------------------------------------
        */

        $category->update($validated);

        $category->loadCount('products');

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil diperbarui.',
            'data' => $category,
        ]);
    }

    /**
     * Menghapus kategori.
     *
     * DELETE /api/admin/categories/{category}
     */
    public function destroy(
        Category $category
    ): JsonResponse {
        /*
        |--------------------------------------------------------------------------
        | Cek apakah masih memiliki produk
        |--------------------------------------------------------------------------
        */

        if ($category->products()->exists()) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Kategori tidak dapat dihapus karena masih memiliki produk.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | DELETE CATEGORY
        |--------------------------------------------------------------------------
        */

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kategori berhasil dihapus.',
        ]);
    }

    /**
     * Generate slug unik.
     */
    private function generateUniqueSlug(
        string $name,
        ?int $ignoreId = null
    ): string {
        $slug = Str::slug($name);

        $originalSlug = $slug;
        $counter = 1;

        while (
            Category::where(
                'slug',
                $slug
            )
            ->when(
                $ignoreId,
                fn ($query) =>
                    $query->where(
                        'id',
                        '!=',
                        $ignoreId
                    )
            )
            ->exists()
        ) {
            $slug =
                $originalSlug .
                '-' .
                $counter;

            $counter++;
        }

        return $slug;
    }
}