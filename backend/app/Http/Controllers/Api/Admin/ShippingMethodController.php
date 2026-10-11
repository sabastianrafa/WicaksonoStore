<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShippingMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingMethodController extends Controller
{
    /**
     * Menampilkan semua metode pengiriman untuk admin.
     *
     * GET /api/admin/shipping-methods
     */
    public function index(Request $request): JsonResponse
    {
        $query = ShippingMethod::query()
            ->whereIn('code', ShippingMethod::SUPPORTED_CODES);

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {
            $search = $request->input('search');

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere(
                        'description',
                        'like',
                        "%{$search}%"
                    );
            });
        }

        /*
        |--------------------------------------------------------------------------
        | FILTER STATUS
        |--------------------------------------------------------------------------
        */

        if ($request->filled('is_active')) {
            $query->where(
                'is_active',
                filter_var(
                    $request->input('is_active'),
                    FILTER_VALIDATE_BOOLEAN
                )
            );
        }

        /*
        |--------------------------------------------------------------------------
        | SORTING
        |--------------------------------------------------------------------------
        */

        switch ($request->input('sort')) {
            case 'name_asc':
                $query->orderBy('name', 'asc');
                break;

            case 'name_desc':
                $query->orderBy('name', 'desc');
                break;

            case 'cost_asc':
                $query->orderBy('cost', 'asc');
                break;

            case 'cost_desc':
                $query->orderBy('cost', 'desc');
                break;

            case 'latest':
                $query->latest();
                break;

            case 'sort_order':
            default:
                $query
                    ->orderBy('sort_order')
                    ->orderBy('name');
                break;
        }

        /*
        |--------------------------------------------------------------------------
        | PAGINATION
        |--------------------------------------------------------------------------
        */

        $perPage = min(
            max(
                (int) $request->input('per_page', 15),
                1
            ),
            100
        );

        $shippingMethods = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' =>
                'Data metode pengiriman berhasil diambil.',
            'data' => $shippingMethods->items(),

            'meta' => [
                'current_page' =>
                    $shippingMethods->currentPage(),

                'last_page' =>
                    $shippingMethods->lastPage(),

                'per_page' =>
                    $shippingMethods->perPage(),

                'total' =>
                    $shippingMethods->total(),
            ],
        ]);
    }

    /**
     * Menampilkan detail metode pengiriman.
     *
     * GET /api/admin/shipping-methods/{shippingMethod}
     */
    public function show(
        ShippingMethod $shippingMethod
    ): JsonResponse {
        abort_unless(
            in_array($shippingMethod->code, ShippingMethod::SUPPORTED_CODES, true),
            404,
            'Kurir tidak ditemukan.'
        );

        return response()->json([
            'success' => true,
            'message' =>
                'Detail metode pengiriman berhasil diambil.',
            'data' => $shippingMethod,
        ]);
    }

    /**
     * Mengubah metode pengiriman.
     *
     * PUT/PATCH /api/admin/shipping-methods/{shippingMethod}
     */
    public function update(
        Request $request,
        ShippingMethod $shippingMethod
    ): JsonResponse {
        abort_unless(
            in_array($shippingMethod->code, ShippingMethod::SUPPORTED_CODES, true),
            404,
            'Kurir tidak ditemukan.'
        );

        $validated = $request->validate([
            'cost' => [
                'required',
                'numeric',
                'min:0',
            ],

            'estimated_days' => [
                'nullable',
                'string',
                'max:255',
            ],

        ]);

        $shippingMethod->update($validated);

        return response()->json([
            'success' => true,
            'message' =>
                'Metode pengiriman berhasil diperbarui.',
            'data' => $shippingMethod,
        ]);
    }

}