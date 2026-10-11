<?php

namespace App\Services;

use App\Models\ShippingMethod;
use App\Models\ShippingPromotion;

class ShippingQuoteService
{
    public function __construct(private readonly LocationCatalog $locations)
    {
    }

    /**
     * @return array{
     *     location: array{
     *         province_code: string,
     *         province: string,
     *         regency_code: string,
     *         city: string,
     *         district_code: string,
     *         district: string,
     *         village_code: string,
     *         village: string
     *     },
     *     region: string,
     *     method: ShippingMethod,
     *     courier_code: string,
     *     courier_name: string
     * }|null
     */
    public function quote(
        string $provinceCode,
        string $regencyCode,
        string $districtCode,
        string $villageCode
    ): ?array {
        $location = $this->locations->resolve(
            $provinceCode,
            $regencyCode,
            $districtCode,
            $villageCode
        );

        $isMalangRaya = in_array($location['regency_code'], [
            '35.07',
            '35.73',
            '35.79',
        ], true);
        $isJava = in_array($location['province_code'], [
            '31',
            '32',
            '33',
            '34',
            '35',
            '36',
        ], true);

        if ($isMalangRaya) {
            $method = ShippingMethod::query()
                ->where('is_active', true)
                ->where('code', 'GOSEND')
                ->first();

            return $method ? [
                'location' => $location,
                'region' => 'malang',
                'method' => $method,
                'courier_code' => 'GOSEND',
                'courier_name' => 'GoSend',
            ] : null;
        }

        $method = ShippingMethod::query()
            ->where('is_active', true)
            ->where('code', $isJava ? 'JNT_REG' : 'LION_PARCEL')
            ->first();

        return $method ? [
            'location' => $location,
            'region' => $isJava ? 'jawa' : 'luar_pulau',
            'method' => $method,
            'courier_code' => $isJava ? 'JNT_REG' : 'LION_PARCEL',
            'courier_name' => $isJava ? 'J&T Express' : 'Lion Parcel',
        ] : null;
    }

    /**
     * @param array{method: ShippingMethod, location: array{province_code: string, regency_code: string}} $quote
     * @return array{cost: float, discount: float, original_cost: float, promotion_applied: bool}
     */
    public function pricing(array $quote, float $subtotal): array
    {
        $originalCost = (float) $quote['method']->cost;
        $promotion = ShippingPromotion::query()->find(1);
        $matchesArea = $promotion && in_array(
            $quote['location']['province_code'],
            $promotion->area_codes ?? [],
            true
        );
        $matchesArea = $matchesArea || (
            $promotion && in_array(
                $quote['location']['regency_code'],
                $promotion->area_codes ?? [],
                true
            )
        );
        $applies = $promotion?->is_active
            && $subtotal >= (float) $promotion->minimum_purchase
            && $matchesArea;

        return [
            'original_cost' => $originalCost,
            'discount' => $applies ? $originalCost : 0.0,
            'cost' => $applies ? 0.0 : $originalCost,
            'promotion_applied' => (bool) $applies,
        ];
    }
}
