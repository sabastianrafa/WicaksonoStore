<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LocationCatalog;
use App\Services\LocationCatalogUnavailable;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class LocationController extends Controller
{
    public function provinces(LocationCatalog $locations): JsonResponse
    {
        return $this->respond(fn () => $locations->provinces());
    }

    public function regencies(string $province, LocationCatalog $locations): JsonResponse
    {
        return $this->respond(fn () => $locations->regencies($province));
    }

    public function districts(string $regency, LocationCatalog $locations): JsonResponse
    {
        return $this->respond(fn () => $locations->districts($regency));
    }

    public function villages(string $district, LocationCatalog $locations): JsonResponse
    {
        return $this->respond(fn () => $locations->villages($district));
    }

    private function respond(callable $load): JsonResponse
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $load(),
            ]);
        } catch (LocationCatalogUnavailable $exception) {
            Log::error('Gagal memuat referensi wilayah Indonesia.', [
                'exception' => $exception,
            ]);

            return response()->json([
                'success' => false,
                'message' => $exception->getMessage(),
            ], 503);
        }
    }
}
