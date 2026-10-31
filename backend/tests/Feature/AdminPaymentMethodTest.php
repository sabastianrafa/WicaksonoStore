<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\PaymentMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class AdminPaymentMethodTest extends TestCase
{
    use DatabaseTransactions;

    public function test_admin_can_read_the_configured_midtrans_method(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $method = PaymentMethod::updateOrCreate(['code' => 'midtrans'], [
            'name' => 'Midtrans', 'type' => PaymentMethod::TYPE_GATEWAY, 'is_active' => true,
        ]);

        $this->actingAs($admin)->getJson('/api/admin/payment-methods')->assertOk();
        $this->actingAs($admin)->getJson("/api/admin/payment-methods/{$method->id}")
            ->assertOk()->assertJsonPath('data.code', 'midtrans');
    }

    public function test_admin_payment_method_crud_is_not_exposed(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);
        $method = PaymentMethod::updateOrCreate(['code' => 'midtrans'], [
            'name' => 'Midtrans', 'type' => PaymentMethod::TYPE_GATEWAY, 'is_active' => true,
        ]);

        $this->actingAs($admin)->postJson('/api/admin/payment-methods', [])->assertMethodNotAllowed();
        $this->actingAs($admin)->putJson("/api/admin/payment-methods/{$method->id}", [])->assertMethodNotAllowed();
        $this->actingAs($admin)->deleteJson("/api/admin/payment-methods/{$method->id}")->assertMethodNotAllowed();
    }

    public function test_public_endpoint_returns_only_active_methods(): void
    {
        $method = PaymentMethod::updateOrCreate(['code' => 'midtrans'], [
            'name' => 'Midtrans', 'type' => PaymentMethod::TYPE_GATEWAY, 'is_active' => true,
        ]);
        $codes = collect($this->getJson('/api/payment-methods')->assertOk()->json('data'))->pluck('code');
        $this->assertTrue($codes->contains($method->code));
        $this->assertFalse($codes->contains('transfer_bank'));
    }
}
