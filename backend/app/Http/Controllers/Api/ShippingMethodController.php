<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShippingMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ShippingMethodController extends Controller
{
    /**
     * Menampilkan semua metode pengiriman aktif.
     *
     * GET /api/shipping-methods
     */
    public function index(Request $request): JsonResponse
    {
        $shippingMethods = ShippingMethod::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Data metode pengiriman berhasil diambil.',
            'data' => $shippingMethods,
        ]);
    }

    /**
     * Menampilkan detail metode pengiriman.
     *
     * GET /api/shipping-methods/{shippingMethod}
     */
    public function show(
        ShippingMethod $shippingMethod
    ): JsonResponse {
        if (!$shippingMethod->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Metode pengiriman tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail metode pengiriman berhasil diambil.',
            'data' => $shippingMethod,
        ]);
    }
}