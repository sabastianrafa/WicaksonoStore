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
     * Menghitung ongkir berdasarkan tujuan dan tarif kurir aktif.
     *
     * POST /api/shipping-methods/quote
     */
    public function quote(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'city' => ['required', 'string', 'max:100'],
            'province' => ['required', 'string', 'max:100'],
        ]);

        $city = strtolower(trim($validated['city']));
        $province = strtolower(str_replace('.', '', trim($validated['province'])));

        if (in_array($city, ['malang', 'kota malang'], true)) {
            $region = 'malang';
            $courierCode = 'GOSEND';
            $method = ShippingMethod::query()
                ->where('is_active', true)
                ->whereIn('code', ['GOSEND', 'INSTANT'])
                ->orderByRaw("CASE WHEN code = 'GOSEND' THEN 0 ELSE 1 END")
                ->first();
            $courierName = 'GoSend';
        } elseif (in_array($province, [
            'banten',
            'dki jakarta',
            'jakarta',
            'jawa barat',
            'jawa tengah',
            'di yogyakarta',
            'yogyakarta',
            'jawa timur',
        ], true)) {
            $region = 'jawa';
            $courierCode = 'JNT_REG';
            $method = ShippingMethod::query()
                ->where('code', $courierCode)
                ->where('is_active', true)
                ->first();
            $courierName = 'J&T Express';
        } else {
            $region = 'luar_jawa';
            $courierCode = 'LION_PARCEL';
            $method = ShippingMethod::query()
                ->where('code', $courierCode)
                ->where('is_active', true)
                ->first();
            $courierName = 'Lion Parcel';
        }

        if (!$method) {
            return response()->json([
                'success' => false,
                'message' => "Tarif {$courierName} belum tersedia. Silakan hubungi admin.",
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Ongkos kirim berhasil dihitung.',
            'data' => [
                'region' => $region,
                'courier' => [
                    'id' => $method->id,
                    'code' => $courierCode,
                    'name' => $courierName,
                    'estimated_days' => $method->estimated_days,
                ],
                'cost' => (float) $method->cost,
            ],
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