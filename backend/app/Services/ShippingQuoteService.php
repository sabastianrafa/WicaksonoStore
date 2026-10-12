<?php

namespace App\Services;

use App\Models\ShippingMethod;
use App\Models\ShippingPromotion;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Client\ConnectionException;

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
        ?string $destinationPostalCode = null,
        iterable $cartItems = []
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

            $quote = $method ? [
                'location' => $location,
                'region' => 'malang',
                'method' => $method,
                'courier_code' => 'GOSEND',
                'courier_name' => 'GoSend',
            ] : null;
        } else {
            $method = ShippingMethod::query()
                ->where('is_active', true)
                ->where('code', $isJava ? 'JNT_REG' : 'LION_PARCEL')
                ->first();

            $quote = $method ? [
                'location' => $location,
                'region' => $isJava ? 'jawa' : 'luar_pulau',
                'method' => $method,
                'courier_code' => $isJava ? 'JNT_REG' : 'LION_PARCEL',
                'courier_name' => $isJava ? 'J&T Express' : 'Lion Parcel',
            ] : null;
        }

        if (! config('services.biteship.key')) {
            return $quote;
        }

        if (! $destinationPostalCode || ! preg_match('/^\d{5}$/', $destinationPostalCode)) {
            throw ValidationException::withMessages([
                'destination_postal_code' => 'Kode pos tujuan 5 digit diperlukan untuk menghitung tarif Biteship.',
            ]);
        }

        $items = collect($cartItems)->map(function ($cartItem): array {
            $product = $cartItem->product;
            if (! $product || (int) $product->weight < 1) {
                throw ValidationException::withMessages([
                    'weight' => 'Bobot produk belum diisi. Lengkapi bobot semua produk di admin sebelum menghitung ongkir.',
                ]);
            }

            return [
                'name' => $product->name,
                'value' => (int) round((float) $product->price),
                'quantity' => (int) $cartItem->quantity,
                'weight' => (int) $product->weight,
            ];
        })->values()->all();

        if (! $items) {
            throw ValidationException::withMessages([
                'items' => 'Keranjang kosong, tarif Biteship tidak dapat dihitung.',
            ]);
        }

        $requestBody = [
            'origin_postal_code' => (int) config('services.biteship.origin_postal_code'),
            'destination_postal_code' => (int) $destinationPostalCode,
            'couriers' => config('services.biteship.couriers'),
            'items' => $items,
        ];

        try {
            $response = Http::acceptJson()
                ->asJson()
                ->withHeaders(['Authorization' => config('services.biteship.key')])
                ->timeout(15)
                ->post(rtrim(config('services.biteship.url'), '/') . '/v1/rates/couriers', $requestBody);
        } catch (ConnectionException $exception) {
            Log::warning('Biteship rate request failed to connect.', ['error' => $exception->getMessage()]);
            throw new BiteshipUnavailable('Layanan cek ongkir sedang tidak dapat dihubungi. Silakan coba lagi.');
        }

        if (! $response->successful()) {
            $errorCode = $response->json('code');
            Log::warning('Biteship rate request returned an error.', [
                'status' => $response->status(),
                'code' => $errorCode,
                'message' => $response->json('message'),
            ]);

            $message = match ((string) $errorCode) {
                '40001001' => 'Kode pos asal atau tujuan tidak valid atau belum tersedia di Biteship. Periksa kode pos alamat dan BITESHIP_ORIGIN_POSTAL_CODE.',
                '40001002' => 'Data tarif yang dikirim ke Biteship belum lengkap. Pastikan keranjang berisi produk dengan bobot dan harga yang valid.',
                '40001010' => 'Tidak ada kurir Biteship yang melayani rute ini. Coba aktifkan kurir lain pada BITESHIP_COURIERS.',
                default => match ($response->status()) {
                    401, 403 => 'Biteship menolak API key. Periksa token Biteship dan pastikan token sesuai dengan mode test atau live.',
                    default => 'Biteship gagal menghitung ongkir (HTTP ' . $response->status() . '). Periksa log backend untuk kode error Biteship.',
                },
            };

            throw new BiteshipUnavailable($message);
        }

        $rate = collect($response->json('pricing', []))
            ->filter(fn ($rate) => isset($rate['price'], $rate['courier_code']))
            ->sortBy('price')
            ->first();

        if (! $rate) {
            throw new BiteshipUnavailable('Tidak ada layanan kurir Biteship untuk alamat dan bobot produk ini.');
        }

        $methodCode = match (strtolower((string) $rate['courier_code'])) {
            'gojek', 'grab' => 'GOSEND',
            'lion' => 'LION_PARCEL',
            default => 'JNT_REG',
        };
        $method = ShippingMethod::query()
            ->where('is_active', true)
            ->where('code', $methodCode)
            ->first();
        if (! $method) {
            throw new BiteshipUnavailable('Metode kurir hasil Biteship belum diaktifkan pada pengaturan pengiriman.');
        }

        return array_merge($quote ?? [], [
            'location' => $location,
            'region' => $quote['region'] ?? ($isMalangRaya ? 'malang' : ($isJava ? 'jawa' : 'luar_pulau')),
            'method' => $method,
            'biteship_price' => (float) $rate['price'],
            'courier_code' => (string) $rate['courier_code'],
            'courier_name' => (string) ($rate['courier_name'] ?? $rate['courier_code']),
            'service_code' => (string) ($rate['courier_service_code'] ?? $rate['type'] ?? ''),
            'estimated_days' => $rate['duration'] ?? null,
        ]);
    }

    /**
     * @param array{method: ShippingMethod, location: array{province_code: string, regency_code: string}} $quote
     * @return array{cost: float, discount: float, original_cost: float, promotion_applied: bool}
     */
    public function pricing(array $quote, float $subtotal): array
    {
        $originalCost = (float) ($quote['biteship_price'] ?? $quote['method']->cost);
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
