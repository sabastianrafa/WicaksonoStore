<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'label' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'province' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'postal_code' => ['required', 'string', 'max:10'],
            'address' => ['required', 'string'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

        $user = $request->user();

        $address = DB::transaction(function () use ($user, $validated, $request) {
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
                'province' => $validated['province'],
                'city' => $validated['city'],
                'postal_code' => $validated['postal_code'],
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
    public function update(Request $request, Address $address): JsonResponse
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
            'province' => ['sometimes', 'string', 'max:255'],
            'city' => ['sometimes', 'string', 'max:255'],
            'postal_code' => ['sometimes', 'string', 'max:10'],
            'address' => ['sometimes', 'string'],
            'is_default' => ['sometimes', 'boolean'],
        ]);

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
}
