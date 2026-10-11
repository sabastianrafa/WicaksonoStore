<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShippingPromotion;
use App\Services\LocationCatalog;
use App\Services\LocationCatalogUnavailable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ShippingPromotionController extends Controller
{
    public function show(LocationCatalog $locations): JsonResponse
    {
        $promotion = ShippingPromotion::query()->find(1);
        $codes = $promotion?->area_codes ?? [];

        try {
            $areas = $this->resolveAreaLabels($codes, $locations);
        } catch (LocationCatalogUnavailable $exception) {
            return $this->locationServiceUnavailable($exception);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'is_active' => $promotion?->is_active ?? false,
                'minimum_purchase' => (float) ($promotion?->minimum_purchase ?? 0),
                'area_codes' => $codes,
                'areas' => $areas,
            ],
        ]);
    }

    public function update(Request $request, LocationCatalog $locations): JsonResponse
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
            'minimum_purchase' => ['required', 'numeric', 'min:0'],
            'area_codes' => ['present', 'array'],
            'area_codes.*' => ['required', 'string', 'distinct', 'max:10'],
        ]);

        if ($validated['is_active'] && count($validated['area_codes']) === 0) {
            throw ValidationException::withMessages([
                'area_codes' => 'Pilih minimal satu wilayah untuk mengaktifkan promo.',
            ]);
        }

        try {
            $areas = $this->resolveAreaLabels($validated['area_codes'], $locations);
        } catch (LocationCatalogUnavailable $exception) {
            return $this->locationServiceUnavailable($exception);
        }

        $promotion = ShippingPromotion::query()->updateOrCreate(
            ['id' => 1],
            [
                'is_active' => $validated['is_active'],
                'minimum_purchase' => $validated['minimum_purchase'],
                'area_codes' => array_column($areas, 'code'),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan promo ongkir berhasil disimpan.',
            'data' => [
                'is_active' => $promotion->is_active,
                'minimum_purchase' => (float) $promotion->minimum_purchase,
                'area_codes' => $promotion->area_codes,
                'areas' => $areas,
            ],
        ]);
    }

    /**
     * @param list<string> $codes
     * @return list<array{code: string, name: string, level: string}>
     */
    private function resolveAreaLabels(array $codes, LocationCatalog $locations): array
    {
        $provinces = $locations->provinces();
        $areas = [];

        foreach ($codes as $code) {
            if (preg_match('/^\d{2}$/', $code)) {
                foreach ($provinces as $province) {
                    if ($province['code'] === $code) {
                        $areas[] = [
                            'code' => $code,
                            'name' => $province['name'],
                            'level' => 'province',
                        ];
                        continue 2;
                    }
                }
            } elseif (preg_match('/^(\d{2})\.\d{2}$/', $code, $matches)) {
                foreach ($locations->regencies($matches[1]) as $regency) {
                    if ($regency['code'] === $code) {
                        $areas[] = [
                            'code' => $code,
                            'name' => $regency['name'],
                            'level' => 'regency',
                        ];
                        continue 2;
                    }
                }
            }

            throw ValidationException::withMessages([
                'area_codes' => "Kode wilayah promo {$code} tidak ditemukan.",
            ]);
        }

        return $areas;
    }

    private function locationServiceUnavailable(LocationCatalogUnavailable $exception): JsonResponse
    {
        Log::error('Gagal memvalidasi wilayah promo ongkir.', [
            'exception' => $exception,
        ]);

        return response()->json([
            'success' => false,
            'message' => $exception->getMessage(),
        ], 503);
    }
}
