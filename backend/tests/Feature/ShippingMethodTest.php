<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ShippingMethodTest extends TestCase
{
    use DatabaseTransactions;

    public function test_public_can_list_and_show_active_shipping_methods(): void
    {
        $active = ShippingMethod::create([
            'name' => 'Kurir Cepat Test',
            'code' => 'kurir-cepat-test',
            'description' => 'Pengiriman kilat',
            'cost' => 15000,
            'estimated_days' => '1-2 hari',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $inactive = ShippingMethod::create([
            'name' => 'Kurir Nonaktif',
            'code' => 'kurir-nonaktif',
            'cost' => 10000,
            'is_active' => false,
        ]);

        $listResponse = $this->getJson('/api/shipping-methods');
        $listResponse->assertStatus(200);
        $codes = collect($listResponse->json('data'))->pluck('code');
        $this->assertTrue($codes->contains('kurir-cepat-test'));
        $this->assertFalse($codes->contains('kurir-nonaktif'));

        $showResponse = $this->getJson("/api/shipping-methods/{$active->id}");
        $showResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $active->id,
                    'code' => 'kurir-cepat-test',
                ],
            ]);
    }

    public function test_admin_can_crud_shipping_methods(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::ADMIN,
        ]);

        // 1. Create
        $createResponse = $this->actingAs($admin)->postJson('/api/admin/shipping-methods', [
            'name' => 'Ekspedisi Baru',
            'code' => 'ekspedisi-baru',
            'description' => 'Deskripsi ekspedisi',
            'cost' => 25000,
            'estimated_days' => '2-3 hari',
            'is_active' => true,
            'sort_order' => 1,
        ]);

        $createResponse->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'code' => 'ekspedisi-baru',
                ],
            ]);

        $id = $createResponse->json('data.id');

        // 2. Update
        $updateResponse = $this->actingAs($admin)->putJson("/api/admin/shipping-methods/{$id}", [
            'name' => 'Ekspedisi Diedit',
            'cost' => 30000,
        ]);

        $updateResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Ekspedisi Diedit',
                ],
            ]);

        // 3. Delete
        $deleteResponse = $this->actingAs($admin)->deleteJson("/api/admin/shipping-methods/{$id}");
        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('shipping_methods', ['id' => $id]);
    }
}
