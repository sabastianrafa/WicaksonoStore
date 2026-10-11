<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentMethodController extends Controller
{
    /**
     * Menampilkan semua metode pembayaran aktif untuk halaman checkout.
     *
     * GET /api/payment-methods
     */
    public function index(Request $request): JsonResponse
    {
        $paymentMethods = PaymentMethod::query()
            ->where('is_active', true)
            ->configured()
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Data metode pembayaran berhasil diambil.',
            'data' => $paymentMethods,
        ]);
    }

    /**
     * Menampilkan detail metode pembayaran.
     *
     * GET /api/payment-methods/{paymentMethod}
     */
    public function show(
        Request $request,
        string $paymentMethod
    ): JsonResponse {
        $method = PaymentMethod::query()
            ->where('is_active', true)
            ->where('code', $paymentMethod)
            ->first();

        if (!$method) {
            return response()->json([
                'success' => false,
                'message' => 'Metode pembayaran tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail metode pembayaran berhasil diambil.',
            'data' => $method,
        ]);
    }
}