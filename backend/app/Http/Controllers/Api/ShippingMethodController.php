<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ShippingMethod;
use App\Services\LocationCatalogUnavailable;
use App\Services\ShippingQuoteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
            ->whereIn('code', ShippingMethod::SUPPORTED_CODES)
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
    public function quote(Request $request, ShippingQuoteService $quotes): JsonResponse
    {
        $validated = $request->validate([
            'province_code' => ['required', 'string', 'max:20'],
            'regency_code' => ['required', 'string', 'max:20'],
            'district_code' => ['required', 'string', 'max:20'],
            'village_code' => ['required', 'string', 'max:20'],
        ]);

        try {
            $quote = $quotes->quote(
                $validated['province_code'],
                $validated['regency_code'],
                $validated['district_code'],
                $validated['village_code']
            );
        } catch (LocationCatalogUnavailable $exception) {
            Log::error('Tidak dapat memvalidasi wilayah tujuan untuk ongkir.', [
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 503);
        }

        if (! $quote) {
            return response()->json([
                'success' => false,
                'message' => 'Tarif kurir untuk wilayah ini belum tersedia. Silakan hubungi admin.',
            ], 422);
        }

        $subtotal = (float) ($request->user()->cart?->items()
            ->with('product')
            ->get()
            ->sum(fn ($item) => (float) ($item->product?->price ?? 0) * $item->quantity) ?? 0);
        $pricing = $quotes->pricing($quote, $subtotal);

        return response()->json([
            'success' => true,
            'message' => 'Ongkos kirim berhasil dihitung.',
            'data' => [
                'region' => $quote['region'],
                'courier' => [
                    'id' => $quote['method']->id,
                    'code' => $quote['courier_code'],
                    'name' => $quote['courier_name'],
                    'estimated_days' => $quote['method']->estimated_days,
                ],
                'cost' => $pricing['cost'],
                'original_cost' => $pricing['original_cost'],
                'shipping_discount' => $pricing['discount'],
                'promotion_applied' => $pricing['promotion_applied'],
                'location' => $quote['location'],
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
        if (
            ! $shippingMethod->is_active
            || ! in_array($shippingMethod->code, ShippingMethod::SUPPORTED_CODES, true)
        ) {
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