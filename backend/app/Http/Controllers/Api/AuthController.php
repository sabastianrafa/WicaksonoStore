<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register user baru.
     *
     * POST /api/auth/register
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:20',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => $validated['password'],

            // User yang melakukan register
            // selalu mendapatkan role user.
            'role' => 'user',
        ]);

        // Buat token Sanctum
        $token = $user->createToken(
            'wicaksono-app'
        )->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Registrasi berhasil.',
            'data' => [
                'user' => $this->userData($user),
                'token' => $token,
            ],
        ], 201);
    }

    /**
     * Login.
     *
     * POST /api/auth/login
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => [
                'required',
                'email',
            ],

            'password' => [
                'required',
                'string',
            ],
        ]);

        $user = User::where(
            'email',
            $validated['email']
        )->first();

        if (
            !$user ||
            !Hash::check(
                $validated['password'],
                $user->password
            )
        ) {
            throw ValidationException::withMessages([
                'email' => [
                    'Email atau password salah.',
                ],
            ]);
        }

        // Hapus token lama jika diperlukan.
        // Untuk sekarang kita bersihkan token lama
        // agar satu login menghasilkan satu token aktif.
        $user->tokens()->delete();

        $token = $user->createToken(
            'wicaksono-app'
        )->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'user' => $this->userData($user),
                'token' => $token,
            ],
        ]);
    }

    /**
     * Mendapatkan user yang sedang login.
     *
     * GET /api/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'message' => 'Data user berhasil diambil.',
            'data' => [
                'user' => $this->userData($user),
            ],
        ]);
    }

    /**
     * Logout.
     *
     * POST /api/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        if ($token && method_exists($token, 'delete')) {
            $token->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    /**
     * Format response user.
     */
    private function userData(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role->value,
        ];
    }
}