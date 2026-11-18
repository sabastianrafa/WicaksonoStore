<?php

namespace App\Services;

use App\Models\ShippingMethod;
use App\Models\ShippingPromotion;
use App\Models\ShippingRate;

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
        string $villageCode,
        string $serviceType = 'reguler'
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
                'service_type' => $serviceType,
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
            'service_type' => $serviceType,
        ] : null;
    }

    /**
     * @param array{method: ShippingMethod, location: array{province_code: string, regency_code: string}} $quote
     * @return array{cost: float, discount: float, original_cost: float, promotion_applied: bool}
     */
    public function parcelMetrics(iterable $items, string $serviceType = 'reguler', array $overrides = []): array
    {
        $actual = 0.0;
        $length = $width = $height = 0.0;
        foreach ($items as $item) {
            if (! $item->product) continue;
            $qty = (int) $item->quantity;
            $actual += ((float) $item->product->weight / 1000) * $qty;
            $length = max($length, (float) $item->product->length);
            $width = max($width, (float) $item->product->width);
            $height += (float) $item->product->height * $qty;
        }
        foreach (['berat_aktual' => 'actual', 'panjang' => 'length', 'lebar' => 'width', 'tinggi' => 'height'] as $key => $target) {
            if (isset($overrides[$key])) $$target = (float) $overrides[$key];
        }
        $volumetric = $length * $width * $height / ($serviceType === 'cargo' ? 4000 : 6000);
        $gross = max($actual, $volumetric);
        $floor = (int) floor($gross);
        $fraction = $gross - $floor;
        $billable = $fraction <= .30 ? max(1, $floor) : (int) ceil($gross);
        return ['actual_weight' => $actual, 'volumetric_weight' => $volumetric, 'gross_weight' => $gross, 'billable_weight' => $billable, 'dimensions' => compact('length', 'width', 'height'), 'service_type' => $serviceType];
    }

    public function pricing(array $quote, float $subtotal, int $billableWeight = 1): array
    {
        $codes = [$quote['location']['regency_code'], $quote['location']['province_code'], '*'];
        $rate = ShippingRate::query()->where('shipping_method_id', $quote['method']->id)
            ->where('service_type', $quote['service_type'] ?? 'reguler')->whereIn('area_code', $codes)
            ->orderByRaw('CASE area_code WHEN ? THEN 0 WHEN ? THEN 1 ELSE 2 END', [$codes[0], $codes[1]])->first();
        $costPerKg = (float) ($rate?->cost_per_kg ?? $quote['method']->cost);
        $originalCost = $costPerKg * $billableWeight;
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
            'discount' => $applies ? min(10000, $originalCost) : 0.0,
            'cost' => $applies ? max(0, $originalCost - min(10000, $originalCost)) : $originalCost,
            'cost_per_kg' => $costPerKg,
            'promotion_applied' => (bool) $applies,
        ];
    }
}
