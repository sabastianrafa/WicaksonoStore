<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class LocationCatalog
{
    private const BASE_URL = 'https://wilayah.id/api';

    /**
     * @return list<array{code: string, name: string}>
     */
    public function provinces(): array
    {
        return $this->fetch('provinces');
    }

    /**
     * @return list<array{code: string, name: string}>
     */
    public function regencies(string $provinceCode): array
    {
        $this->assertCode($provinceCode, 'province_code', '/^\d{2}$/');

        return $this->fetch("regencies/{$provinceCode}");
    }

    /**
     * @return list<array{code: string, name: string}>
     */
    public function districts(string $regencyCode): array
    {
        $this->assertCode($regencyCode, 'regency_code', '/^\d{2}\.\d{2}$/');

        return $this->fetch("districts/{$regencyCode}");
    }

    /**
     * @return list<array{code: string, name: string}>
     */
    public function villages(string $districtCode): array
    {
        $this->assertCode($districtCode, 'district_code', '/^\d{2}\.\d{2}\.\d{2}$/');

        return $this->fetch("villages/{$districtCode}");
    }

    /**
     * Resolve and verify every level against its selected parent.
     *
     * @return array{
     *     province_code: string,
     *     province: string,
     *     regency_code: string,
     *     city: string,
     *     district_code: string,
     *     district: string,
     *     village_code: string,
     *     village: string
     * }
     */
    public function resolve(
        string $provinceCode,
        string $regencyCode,
        string $districtCode,
        string $villageCode
    ): array {
        $province = $this->find($this->provinces(), $provinceCode, 'province_code');
        $regency = $this->find(
            $this->regencies($province['code']),
            $regencyCode,
            'regency_code'
        );
        $district = $this->find(
            $this->districts($regency['code']),
            $districtCode,
            'district_code'
        );
        $village = $this->find(
            $this->villages($district['code']),
            $villageCode,
            'village_code'
        );

        return [
            'province_code' => $province['code'],
            'province' => $province['name'],
            'regency_code' => $regency['code'],
            'city' => $regency['name'],
            'district_code' => $district['code'],
            'district' => $district['name'],
            'village_code' => $village['code'],
            'village' => $village['name'],
        ];
    }

    private function assertCode(string $code, string $field, string $pattern): void
    {
        if (! preg_match($pattern, $code)) {
            throw ValidationException::withMessages([
                $field => 'Kode wilayah tidak valid.',
            ]);
        }
    }

    /**
     * @param list<array{code: string, name: string}> $locations
     * @return array{code: string, name: string}
     */
    private function find(array $locations, string $code, string $field): array
    {
        foreach ($locations as $location) {
            if ($location['code'] === $code) {
                return $location;
            }
        }

        throw ValidationException::withMessages([
            $field => 'Wilayah yang dipilih tidak tersedia atau tidak sesuai dengan wilayah induknya.',
        ]);
    }

    /**
     * @return list<array{code: string, name: string}>
     */
    private function fetch(string $path): array
    {
        return Cache::remember("indonesia-locations:{$path}", now()->addDay(), function () use ($path) {
            try {
                $response = Http::acceptJson()
                    ->timeout(8)
                    ->get(self::BASE_URL . "/{$path}.json");
            } catch (\Illuminate\Http\Client\ConnectionException $exception) {
                throw new LocationCatalogUnavailable(
                    'Daftar wilayah Indonesia sementara tidak dapat diakses.',
                    previous: $exception
                );
            }

            if (! $response->successful()) {
                throw new LocationCatalogUnavailable(
                    'Daftar wilayah Indonesia sementara tidak dapat diakses.'
                );
            }

            $data = $response->json('data');
            if (! is_array($data)) {
                throw new LocationCatalogUnavailable(
                    'Format daftar wilayah Indonesia tidak valid.'
                );
            }

            return array_values(array_filter($data, static fn ($location) =>
                is_array($location)
                && isset($location['code'], $location['name'])
                && is_string($location['code'])
                && is_string($location['name'])
            ));
        });
    }
}
