<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\UserRole;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Menampilkan daftar semua pengguna.
     *
     * GET /api/admin/users
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query()
            ->withCount(['orders', 'reviews', 'addresses']);

        if ($request->filled('role')) {
            $query->where('role', $request->input('role'));
        }

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $perPage = min(max((int) $request->input('per_page', 15), 1), 100);
        $users = $query->latest()->paginate($perPage);

        return response()->json([
            'success' => true,
            'message' => 'Data pengguna berhasil diambil.',
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Menampilkan detail pengguna.
     *
     * GET /api/admin/users/{user}
     */
    public function show(User $user): JsonResponse
    {
        $user->load([
            'addresses',
            'orders' => function ($q) {
                $q->latest()->take(10);
            },
        ]);

        $user->loadCount(['orders', 'reviews', 'addresses']);

        return response()->json([
            'success' => true,
            'message' => 'Detail pengguna berhasil diambil.',
            'data' => $user,
        ]);
    }

    /**
     * Mengubah peran (role) pengguna.
     *
     * PATCH /api/admin/users/{user}/role
     */
    public function updateRole(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', Rule::enum(UserRole::class)],
        ]);

        $user->update([
            'role' => $validated['role'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Role pengguna berhasil diperbarui.',
            'data' => $user,
        ]);
    }

    /**
     * Menghapus pengguna.
     *
     * DELETE /api/admin/users/{user}
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        // Admin tidak boleh menghapus akunnya sendiri
        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'Pengguna berhasil dihapus.',
        ]);
    }
}
