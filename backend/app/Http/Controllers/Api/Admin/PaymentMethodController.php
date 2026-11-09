<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class PaymentMethodController extends Controller
{
    /**
     * Menampilkan semua metode pembayaran untuk admin.
     *
     * GET /api/admin/payment-methods
     */
    public function index(Request $request): JsonResponse
    {
        $query = PaymentMethod::query()
            ->where('code', 'midtrans')
            ->withCount('payments');

        if ($request->filled('search')) {
            $search = $request->input('search');

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('type')) {
            $query->where(
                'type',
                $request->input('type')
            );
        }

        if ($request->filled('is_active')) {
            $query->where(
                'is_active',
                filter_var(
                    $request->input('is_active'),
                    FILTER_VALIDATE_BOOLEAN
                )
            );
        }

        switch ($request->input('sort')) {
            case 'name_desc':
                $query->orderBy('name', 'desc');
                break;

            case 'latest':
                $query->latest();
                break;

            case 'name_asc':
            default:
                $query->orderBy('sort_order')
                    ->orderBy('name');
                break;
        }

        $perPage = min(
            max((int) $request->input('per_page', 15), 1),
            100
        );

        $paymentMethods = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Data metode pembayaran berhasil diambil.',
            'data' => $paymentMethods->items(),

            'meta' => [
                'current_page' => $paymentMethods->currentPage(),
                'last_page' => $paymentMethods->lastPage(),
                'per_page' => $paymentMethods->perPage(),
                'total' => $paymentMethods->total(),
            ],
        ]);
    }

    /**
     * Menambahkan metode pembayaran baru.
     *
     * POST /api/admin/payment-methods
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatePayload($request);

        $paymentMethod = PaymentMethod::create([
            'name' => $validated['name'],
            'code' => strtolower($validated['code']),
            'type' => $validated['type'],
            'account_number' => $validated['type'] === PaymentMethod::TYPE_BANK
                ? ($validated['account_number'] ?? null)
                : null,
            'account_name' => $validated['type'] === PaymentMethod::TYPE_BANK
                ? ($validated['account_name'] ?? null)
                : null,
            'qris_image' => null,
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? null,
            'requires_proof' => $validated['requires_proof'] ?? true,
            'is_active' => $validated['is_active'] ?? true,
            'sort_order' => $validated['sort_order'] ?? 0,
        ]);

        // QRIS wajib punya gambar, jadi upload setelah record dibuat.
        if ($validated['type'] === PaymentMethod::TYPE_QRIS) {
            $this->storeQrisImage($request, $paymentMethod);
        }

        if ($paymentMethod->is_active && ! $paymentMethod->isConfigured()) {
            $paymentMethod->update(['is_active' => false]);
        }

        $paymentMethod->loadCount('payments');

        return response()->json([
            'success' => true,
            'message' => 'Metode pembayaran berhasil ditambahkan.',
            'data' => $paymentMethod->fresh(),
        ], 201);
    }

    /**
     * Menampilkan detail metode pembayaran.
     *
     * GET /api/admin/payment-methods/{paymentMethod}
     */
    public function show(
        PaymentMethod $paymentMethod
    ): JsonResponse {
        abort_unless($paymentMethod->code === 'midtrans', 404);

        $paymentMethod->loadCount('payments');

        return response()->json([
            'success' => true,
            'message' => 'Detail metode pembayaran berhasil diambil.',
            'data' => $paymentMethod,
        ]);
    }

    /**
     * Mengubah metode pembayaran.
     *
     * PUT/PATCH /api/admin/payment-methods/{paymentMethod}
     */
    public function update(
        Request $request,
        PaymentMethod $paymentMethod
    ): JsonResponse {
        $validated = $this->validatePayload($request, $paymentMethod);

        if (isset($validated['code'])
            && strtolower($validated['code']) !== $paymentMethod->code
            && $paymentMethod->payments()->exists()) {
            throw ValidationException::withMessages([
                'code' => 'Kode metode tidak dapat diubah karena sudah digunakan oleh transaksi.',
            ]);
        }

        /*
        | Tipe bisa berubah. Kalau record pindah dari QRIS ke bank (atau
        | sebaliknya), data milik tipe lama harus dibersihkan supaya tidak
        | ada rekening yatim atau file QR yang tidak terpakai.
        */
        $newType = $validated['type'] ?? $paymentMethod->type;
        $typeChanged = $newType !== $paymentMethod->type;
        $willBeActive = $validated['is_active'] ?? $paymentMethod->is_active;
        $hasPaymentDetails = $newType === PaymentMethod::TYPE_BANK
            ? filled($validated['account_number'] ?? ($typeChanged ? null : $paymentMethod->account_number))
                && filled($validated['account_name'] ?? ($typeChanged ? null : $paymentMethod->account_name))
            : ($request->hasFile('qris_image') || ($newType === $paymentMethod->type && filled($paymentMethod->qris_image)));

        if ($willBeActive && ! $hasPaymentDetails) {
            throw ValidationException::withMessages([
                $newType === PaymentMethod::TYPE_BANK ? 'account_number' : 'qris_image' =>
                    $newType === PaymentMethod::TYPE_BANK
                        ? 'Lengkapi nomor rekening sebelum mengaktifkan metode.'
                        : 'Unggah gambar QRIS sebelum mengaktifkan metode.',
            ]);
        }

        $previousQrisImage = $paymentMethod->qris_image;
        $nextQrisImage = $newType === PaymentMethod::TYPE_QRIS && ! $typeChanged
            ? $previousQrisImage
            : null;

        $paymentMethod->update([
            'name' => $validated['name'] ?? $paymentMethod->name,
            'code' => isset($validated['code'])
                ? strtolower($validated['code'])
                : $paymentMethod->code,
            'type' => $newType,
            'qris_image' => $nextQrisImage,
            'account_number' => $newType === PaymentMethod::TYPE_BANK
                ? ($validated['account_number'] ?? ($typeChanged ? null : $paymentMethod->account_number))
                : null,
            'account_name' => $newType === PaymentMethod::TYPE_BANK
                ? ($validated['account_name'] ?? ($typeChanged ? null : $paymentMethod->account_name))
                : null,
            'description' => array_key_exists('description', $validated)
                ? $validated['description']
                : $paymentMethod->description,
            'icon' => array_key_exists('icon', $validated)
                ? $validated['icon']
                : $paymentMethod->icon,
            'requires_proof' => $validated['requires_proof'] ?? $paymentMethod->requires_proof,
            'is_active' => $validated['is_active'] ?? $paymentMethod->is_active,
            'sort_order' => $validated['sort_order'] ?? $paymentMethod->sort_order,
        ]);

        if ($newType === PaymentMethod::TYPE_QRIS && $request->hasFile('qris_image')) {
            $this->storeQrisImage($request, $paymentMethod);
        }

        $currentQrisImage = $paymentMethod->fresh()->qris_image;
        $imageIsUsedByPayment = $previousQrisImage
            && $paymentMethod->payments()
                ->where('payment_qris_image', $previousQrisImage)
                ->exists();
        if ($previousQrisImage && $previousQrisImage !== $currentQrisImage && ! $imageIsUsedByPayment) {
            Storage::disk('public')->delete($previousQrisImage);
        }

        $paymentMethod->loadCount('payments');

        return response()->json([
            'success' => true,
            'message' => 'Metode pembayaran berhasil diperbarui.',
            'data' => $paymentMethod->fresh(),
        ]);
    }

    /**
     * Menghapus metode pembayaran.
     *
     * DELETE /api/admin/payment-methods/{paymentMethod}
     */
    public function destroy(
        PaymentMethod $paymentMethod
    ): JsonResponse {
        if ($paymentMethod->payments()->exists()) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Metode pembayaran tidak dapat dihapus karena sudah dipakai pada transaksi.',
            ], 422);
        }

        $paymentMethod->deleteQrisImage();
        $paymentMethod->delete();

        return response()->json([
            'success' => true,
            'message' => 'Metode pembayaran berhasil dihapus.',
        ]);
    }

    /**
     * Validasi dengan aturan per tipe:
     * - bank wajib punya nomor rekening.
     * - qris wajib punya gambar QR (file saat create, atau yang sudah ada).
     */
    private function validatePayload(
        Request $request,
        ?PaymentMethod $paymentMethod = null
    ): array {
        $isUpdate = $paymentMethod !== null;

        $validated = $request->validate([
            'name' => [
                $isUpdate ? 'sometimes' : 'required',
                'string',
                'max:255',
            ],

            'code' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('payment_methods', 'code')->ignore(
                    $paymentMethod->id ?? 0
                ),
            ],

            'type' => [
                $isUpdate ? 'sometimes' : 'required',
                Rule::in([
                    PaymentMethod::TYPE_BANK,
                    PaymentMethod::TYPE_QRIS,
                ]),
            ],

            'account_number' => [
                'nullable',
                'string',
                'max:255',
            ],

            'account_name' => [
                'nullable',
                'string',
                'max:255',
            ],

            'qris_image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            'description' => ['nullable', 'string'],

            'icon' => ['nullable', 'string', 'max:20'],

            'requires_proof' => ['sometimes', 'boolean'],

            'is_active' => ['sometimes', 'boolean'],

            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ], [
            'type.required' => 'Pilih metode: Bank atau QRIS.',
        ]);

        $type = $validated['type'] ?? ($isUpdate ? $paymentMethod->type : null);

        /*
        | Aturan per tipe ditegakkan di backend juga supaya API tidak bisa
        | menyimpan metode Bank tanpa rekening atau QRIS tanpa gambar.
        */
        $willBeActive = $validated['is_active'] ?? ($paymentMethod?->is_active ?? true);

        if ($type === PaymentMethod::TYPE_BANK && $willBeActive) {
            $accountNumber = $validated['account_number']
                ?? ($isUpdate ? $paymentMethod->account_number : null);
            $accountName = $validated['account_name']
                ?? ($isUpdate ? $paymentMethod->account_name : null);

            if (!$accountNumber || !$accountName) {
                throw ValidationException::withMessages([
                    'account_number' => 'Nomor rekening dan nama pemilik wajib diisi untuk metode Bank.',
                ]);
            }
        }

        if ($type === PaymentMethod::TYPE_QRIS && $willBeActive) {
            $hasImage = $request->hasFile('qris_image')
                || ($isUpdate && $paymentMethod->qris_image);

            if (!$hasImage) {
                throw ValidationException::withMessages([
                    'qris_image' => 'Gambar QRIS wajib diunggah untuk metode QRIS.',
                ]);
            }
        }

        return $validated;
    }

    /**
     * Simpan gambar QRIS, hapus file lama kalau ada.
     */
    private function storeQrisImage(
        Request $request,
        PaymentMethod $paymentMethod
    ): void {
        if (!$request->hasFile('qris_image')) {
            return;
        }

        $path = $request->file('qris_image')->store(
            'payment-methods',
            'public'
        );

        if (! $path) {
            throw new \RuntimeException('Gambar QRIS gagal disimpan.');
        }

        $previousImage = $paymentMethod->qris_image;
        $paymentMethod->update(['qris_image' => $path]);

        $imageIsUsedByPayment = $previousImage
            && $paymentMethod->payments()
                ->where('payment_qris_image', $previousImage)
                ->exists();
        if ($previousImage && $previousImage !== $path && ! $imageIsUsedByPayment) {
            Storage::disk('public')->delete($previousImage);
        }
    }
}
