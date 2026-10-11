<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use App\Services\LocationCatalog;
use App\Services\LocationCatalogUnavailable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AddressController extends Controller
{
    /**
     * Menampilkan semua alamat user yang sedang login.
     *
     * GET /api/addresses
     */
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()
            ->addresses()
            ->orderByDesc('is_default')
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Data alamat berhasil diambil.',
            'data' => $addresses,
        ]);
    }

    /**
     * Menyimpan alamat baru.
     *
     * POST /api/addresses
     */
    public function store(Request $request, LocationCatalog $locations): JsonResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'province_code' => ['required', 'string', 'max:20'],
            'regency_code' => ['required', 'string', 'max:20'],
            'district_code' => ['required', 'string', 'max:20'],
            'village_code' => ['required', 'string', 'max:20'],
            'postal_code' => ['required', 'regex:/^\d{5}$/'],
            'rt' => ['nullable', 'string', 'max:3'],
            'rw' => ['nullable', 'string', 'max:3'],
            'neighborhood' => ['nullable', 'string', 'max:255'],
            'landmark' => ['nullable', 'string', 'max:255'],
            'address' => ['required', 'string', 'min:5', 'max:2000'],
            'province' => ['prohibited'],
            'city' => ['prohibited'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        try {
            $location = $locations->resolve(
                $validated['province_code'],
                $validated['regency_code'],
                $validated['district_code'],
                $validated['village_code']
            );
        } catch (LocationCatalogUnavailable $exception) {
            return $this->locationServiceUnavailable($exception);
        }

        $user = $request->user();

        $address = DB::transaction(function () use ($user, $validated, $request, $location) {
            $hasExistingAddresses = $user->addresses()->exists();
            $isDefault = $request->boolean('is_default');

            // Jika belum punya alamat sama sekali, jadikan default otomatis
            if (!$hasExistingAddresses) {
                $isDefault = true;
            } elseif ($isDefault) {
                $user->addresses()->update(['is_default' => false]);
            }

            return $user->addresses()->create([
                'label' => $validated['label'],
                'name' => $validated['name'],
                'phone' => $validated['phone'],
                'province' => $location['province'],
                'province_code' => $location['province_code'],
                'city' => $location['city'],
                'regency_code' => $location['regency_code'],
                'district' => $location['district'],
                'district_code' => $location['district_code'],
                'village' => $location['village'],
                'village_code' => $location['village_code'],
                'postal_code' => $validated['postal_code'],
                'rt' => $validated['rt'] ?? null,
                'rw' => $validated['rw'] ?? null,
                'neighborhood' => $validated['neighborhood'] ?? null,
                'landmark' => $validated['landmark'] ?? null,
                'address' => $validated['address'],
                'is_default' => $isDefault,
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Alamat berhasil ditambahkan.',
            'data' => $address,
        ], 201);
    }

    /**
     * Menampilkan detail alamat.
     *
     * GET /api/addresses/{address}
     */
    public function show(Request $request, Address $address): JsonResponse
    {
        if ($address->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail alamat berhasil diambil.',
            'data' => $address,
        ]);
    }

    /**
     * Mengubah alamat.
     *
     * PUT/PATCH /api/addresses/{address}
     */
    public function update(Request $request, Address $address, LocationCatalog $locations): JsonResponse
    {
        if ($address->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat tidak ditemukan.',
            ], 404);
        }

        $validated = $request->validate([
            'label' => ['sometimes', 'string', 'max:255'],
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['sometimes', 'string', 'max:20'],
            'province_code' => ['sometimes', 'required', 'string', 'max:20'],
            'regency_code' => ['sometimes', 'required', 'string', 'max:20'],
            'district_code' => ['sometimes', 'required', 'string', 'max:20'],
            'village_code' => ['sometimes', 'required', 'string', 'max:20'],
            'postal_code' => ['sometimes', 'regex:/^\d{5}$/'],
            'rt' => ['sometimes', 'nullable', 'string', 'max:3'],
            'rw' => ['sometimes', 'nullable', 'string', 'max:3'],
            'neighborhood' => ['sometimes', 'nullable', 'string', 'max:255'],
            'landmark' => ['sometimes', 'nullable', 'string', 'max:255'],
            'address' => ['sometimes', 'string', 'min:5', 'max:2000'],
            'province' => ['prohibited'],
            'city' => ['prohibited'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        $locationFields = ['province_code', 'regency_code', 'district_code', 'village_code'];
        if (collect($locationFields)->contains(fn (string $field) => array_key_exists($field, $validated))) {
            $codes = [
                $validated['province_code'] ?? $address->province_code,
                $validated['regency_code'] ?? $address->regency_code,
                $validated['district_code'] ?? $address->district_code,
                $validated['village_code'] ?? $address->village_code,
            ];

            if (in_array(null, $codes, true)) {
                throw ValidationException::withMessages([
                    'province_code' => 'Pilih provinsi, kabupaten/kota, kecamatan, dan kelurahan/desa.',
                ]);
            }

            try {
                $location = $locations->resolve(...$codes);
            } catch (LocationCatalogUnavailable $exception) {
                return $this->locationServiceUnavailable($exception);
            }

            $validated = array_merge($validated, [
                'province_code' => $location['province_code'],
                'province' => $location['province'],
                'regency_code' => $location['regency_code'],
                'city' => $location['city'],
                'district_code' => $location['district_code'],
                'district' => $location['district'],
                'village_code' => $location['village_code'],
                'village' => $location['village'],
            ]);
        }

        $user = $request->user();

        DB::transaction(function () use ($user, $address, $validated, $request) {
            if ($request->has('is_default') && $request->boolean('is_default')) {
                $user->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
            }

            $address->update($validated);
        });

        return response()->json([
            'success' => true,
            'message' => 'Alamat berhasil diperbarui.',
            'data' => $address->fresh(),
        ]);
    }

    /**
     * Menghapus alamat.
     *
     * DELETE /api/addresses/{address}
     */
    public function destroy(Request $request, Address $address): JsonResponse
    {
        if ($address->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat tidak ditemukan.',
            ], 404);
        }

        $user = $request->user();
        $wasDefault = $address->is_default;

        DB::transaction(function () use ($user, $address, $wasDefault) {
            $address->delete();

            if ($wasDefault) {
                $firstRemaining = $user->addresses()->latest()->first();
                if ($firstRemaining) {
                    $firstRemaining->update(['is_default' => true]);
                }
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Alamat berhasil dihapus.',
        ]);
    }

    private function locationServiceUnavailable(LocationCatalogUnavailable $exception): JsonResponse
    {
        Log::error('Gagal memvalidasi alamat terhadap referensi wilayah Indonesia.', [
            'exception' => $exception,
        ]);

        return response()->json([
            'success' => false,
            'message' => $exception->getMessage(),
        ], 503);
    }
}
