<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use DatabaseTransactions;

    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Budi Wicaksono',
            'email' => 'budi@example.com',
            'phone' => '08123456789',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Registrasi berhasil.',
            ])
            ->assertJsonStructure([
                'data' => [
                    'user' => ['id', 'name', 'email', 'phone', 'role'],
                    'token',
                ],
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'budi@example.com',
            'role' => 'user',
        ]);
    }

    public function test_register_validation_fails_on_duplicate_email(): void
    {
        User::factory()->create([
            'email' => 'existing@example.com',
        ]);

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Duplicate User',
            'email' => 'existing@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(422)
            ->assertJsonStructure([
                'success',
                'message',
                'errors' => ['email'],
            ]);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $user = User::factory()->create([
            'email' => 'user@test.com',
            'password' => 'password123',
            'role' => UserRole::USER,
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'user@test.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Login berhasil.',
            ])
            ->assertJsonStructure([
                'data' => [
                    'user',
                    'token',
                ],
            ]);
    }

    public function test_user_cannot_login_with_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'user@test.com',
            'password' => 'password123',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'user@test.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422);
    }

    public function test_authenticated_user_can_get_profile_and_logout(): void
    {
        /** @var User $user */
        $user = User::factory()->create([
            'role' => UserRole::USER,
        ]);

        $profileResponse = $this->actingAs($user)
            ->getJson('/api/auth/me');

        $profileResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'email' => $user->email,
                    ],
                ],
            ]);

        $logoutResponse = $this->actingAs($user)
            ->postJson('/api/auth/logout');

        $logoutResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Logout berhasil.',
            ]);
    }

    public function test_admin_routes_are_protected_from_regular_users(): void
    {
        $user = User::factory()->create([
            'role' => UserRole::USER,
        ]);

        /** @var User $user */
        $response = $this->actingAs($user)
            ->getJson('/api/admin/dashboard');

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Forbidden.',
            ]);
    }

    public function test_admin_can_access_admin_routes(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::ADMIN,
        ]);

        /** @var User $admin */
        $response = $this->actingAs($admin)
            ->getJson('/api/admin/dashboard');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }
}
