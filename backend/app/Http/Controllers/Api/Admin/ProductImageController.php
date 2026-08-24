<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductImageController extends Controller
{
    /**
     * Upload gambar produk.
     *
     * POST /api/admin/products/{product}/images
     */
    public function store(
        Request $request,
        Product $product
    ): JsonResponse {
        $validated = $request->validate([
            'image' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            'alt_text' => [
                'nullable',
                'string',
                'max:255',
            ],

            'is_primary' => [
                'sometimes',
                'boolean',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Jika gambar dijadikan primary,
        | gambar primary sebelumnya harus dilepas.
        |--------------------------------------------------------------------------
        */

        $isPrimary = $validated['is_primary'] ?? false;

        if ($isPrimary) {
            $product->images()->update([
                'is_primary' => false,
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | Kalau produk belum punya gambar,
        | gambar pertama otomatis menjadi primary.
        |--------------------------------------------------------------------------
        */

        if (!$product->images()->exists()) {
            $isPrimary = true;
        }

        /*
        |--------------------------------------------------------------------------
        | Upload file
        |--------------------------------------------------------------------------
        */

        $path = $request->file('image')->store(
            'products',
            'public'
        );

        /*
        |--------------------------------------------------------------------------
        | Tentukan urutan gambar
        |--------------------------------------------------------------------------
        */

        $sortOrder = (
            $product->images()->max('sort_order') ?? -1
        ) + 1;

        /*
        |--------------------------------------------------------------------------
        | Simpan ke database
        |--------------------------------------------------------------------------
        */

        $image = $product->images()->create([
            'path' => $path,
            'alt_text' => $validated['alt_text'] ?? null,
            'is_primary' => $isPrimary,
            'sort_order' => $sortOrder,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Gambar produk berhasil diupload.',
            'data' => $image,
        ], 201);
    }

    /**
     * Menghapus gambar produk.
     *
     * DELETE /api/admin/products/{product}/images/{image}
     */
    public function destroy(
        Product $product,
        ProductImage $image
    ): JsonResponse {
        /*
        |--------------------------------------------------------------------------
        | Pastikan gambar benar-benar milik produk
        |--------------------------------------------------------------------------
        */

        if ($image->product_id !== $product->id) {
            return response()->json([
                'success' => false,
                'message' => 'Gambar tidak ditemukan pada produk ini.',
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | Hapus file dari storage
        |--------------------------------------------------------------------------
        */

        if ($image->path) {
            Storage::disk('public')->delete($image->path);
        }

        $wasPrimary = $image->is_primary;

        $image->delete();

        /*
        |--------------------------------------------------------------------------
        | Jika yang dihapus adalah primary,
        | pilih gambar lain sebagai primary.
        |--------------------------------------------------------------------------
        */

        if ($wasPrimary) {
            $newPrimary = $product->images()
                ->orderBy('sort_order')
                ->first();

            if ($newPrimary) {
                $newPrimary->update([
                    'is_primary' => true,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Gambar produk berhasil dihapus.',
        ]);
    }

    /**
     * Menjadikan gambar sebagai gambar utama.
     *
     * PATCH /api/admin/products/{product}/images/{image}/primary
     */
    public function setPrimary(
        Product $product,
        ProductImage $image
    ): JsonResponse {
        if ($image->product_id !== $product->id) {
            return response()->json([
                'success' => false,
                'message' => 'Gambar tidak ditemukan pada produk ini.',
            ], 404);
        }

        /*
        |--------------------------------------------------------------------------
        | Reset semua gambar
        |--------------------------------------------------------------------------
        */

        $product->images()->update([
            'is_primary' => false,
        ]);

        /*
        |--------------------------------------------------------------------------
        | Set gambar pilihan menjadi primary
        |--------------------------------------------------------------------------
        */

        $image->update([
            'is_primary' => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Gambar utama berhasil diubah.',
            'data' => $image->fresh(),
        ]);
    }
}
