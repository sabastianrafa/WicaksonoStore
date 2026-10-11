<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Address;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AddressTest extends TestCase
{
    use DatabaseTransactions;

    public function test_user_can_create_and_manage_addresses(): void
    {
        $this->fakeLocations();

        /** @var \App\Models\User $user */
        $user = User::factory()->create([
            'role' => UserRole::USER,
        ]);

        // 1. Create first address (auto default)
        $response1 = $this->actingAs($user)->postJson('/api/addresses', [
            'label' => 'Rumah',
            'name' => 'Budi Santoso',
            'phone' => '08123456789',
            'province_code' => '35',
            'regency_code' => '35.73',
            'district_code' => '35.73.05',
            'village_code' => '35.73.05.1001',
            'postal_code' => '65145',
            'address' => 'Jl. Soekarno Hatta No. 12',
        ]);

        $response1->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'label' => 'Rumah',
                    'is_default' => true,
                ],
            ]);

        $firstAddressId = $response1->json('data.id');

        // 2. Create second address with is_default = true
        $response2 = $this->actingAs($user)->postJson('/api/addresses', [
            'label' => 'Kantor',
            'name' => 'Budi Kantor',
            'phone' => '08123456780',
            'province_code' => '35',
            'regency_code' => '35.73',
            'district_code' => '35.73.05',
            'village_code' => '35.73.05.1001',
            'postal_code' => '65141',
            'address' => 'Jl. Ijen No. 45',
            'is_default' => true,
        ]);

        $response2->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'label' => 'Kantor',
                    'is_default' => true,
                ],
            ]);

        // First address must now be is_default = false
        $this->assertDatabaseHas('addresses', [
            'id' => $firstAddressId,
            'is_default' => false,
        ]);

        // 3. List addresses
        $listResponse = $this->actingAs($user)->getJson('/api/addresses');
        $listResponse->assertStatus(200);
        $this->assertCount(2, $listResponse->json('data'));

        // 4. Update address
        $secondAddressId = $response2->json('data.id');
        $updateResponse = $this->actingAs($user)->putJson("/api/addresses/{$secondAddressId}", [
            'label' => 'Kantor Pusat',
        ]);

        $updateResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'label' => 'Kantor Pusat',
                ],
            ]);

        // 5. Delete address
        $deleteResponse = $this->actingAs($user)->deleteJson("/api/addresses/{$secondAddressId}");
        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('addresses', ['id' => $secondAddressId]);

        // First address should now be default again
        $this->assertDatabaseHas('addresses', [
            'id' => $firstAddressId,
            'is_default' => true,
        ]);
    }

    public function test_user_cannot_access_or_modify_other_user_address(): void
    {
        /** @var \App\Models\User $user1 */
        $user1 = User::factory()->create();
        /** @var \App\Models\User $user2 */
        $user2 = User::factory()->create();

        $address = Address::create([
            'user_id' => $user1->id,
            'label' => 'Privat User 1',
            'name' => 'User 1',
            'phone' => '08123456789',
            'province' => 'Jawa Timur',
            'city' => 'Malang',
            'postal_code' => '65145',
            'address' => 'Jl. Mawar No. 1',
            'is_default' => true,
        ]);

        // User 2 tries to view User 1's address
        
        $showResponse = $this->actingAs($user2)->getJson("/api/addresses/{$address->id}");
        $showResponse->assertStatus(404);

        // User 2 tries to update User 1's address
        $updateResponse = $this->actingAs($user2)->putJson("/api/addresses/{$address->id}", [
            'label' => 'Dibajak',
        ]);
        $updateResponse->assertStatus(404);

        // User 2 tries to delete User 1's address
        $deleteResponse = $this->actingAs($user2)->deleteJson("/api/addresses/{$address->id}");
        $deleteResponse->assertStatus(404);

        $this->assertDatabaseHas('addresses', [
            'id' => $address->id,
            'label' => 'Privat User 1',
        ]);
    }

    public function test_address_requires_location_codes_instead_of_free_text_city_and_province(): void
    {
        $user = User::factory()->create(['role' => UserRole::USER]);

        $this->actingAs($user)->postJson('/api/addresses', [
            'label' => 'Rumah',
            'name' => 'Budi Santoso',
            'phone' => '08123456789',
            'province' => 'Jawa Timur',
            'city' => 'Malang',
            'postal_code' => '65145',
            'address' => 'Jl. Soekarno Hatta No. 12',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors([
                'province_code',
                'regency_code',
                'district_code',
                'village_code',
            ]);
    }

    public function test_address_location_labels_are_taken_from_canonical_codes(): void
    {
        $this->fakeLocations();
        $user = User::factory()->create(['role' => UserRole::USER]);

        $this->actingAs($user)->postJson('/api/addresses', [
            'label' => 'Rumah',
            'name' => 'Budi Santoso',
            'phone' => '08123456789',
            'province_code' => '35',
            'regency_code' => '35.73',
            'district_code' => '35.73.05',
            'village_code' => '35.73.05.1001',
            'postal_code' => '65145',
            'address' => 'Jl. Soekarno Hatta No. 12',
        ])->assertCreated()
            ->assertJsonPath('data.province', 'Jawa Timur')
            ->assertJsonPath('data.city', 'Kota Malang')
            ->assertJsonPath('data.district', 'Lowokwaru')
            ->assertJsonPath('data.village', 'Tunggulwulung');
    }

    private function fakeLocations(): void
    {
        Http::fake([
            'wilayah.id/api/provinces.json' => Http::response(['data' => [
                ['code' => '35', 'name' => 'Jawa Timur'],
            ]]),
            'wilayah.id/api/regencies/35.json' => Http::response(['data' => [
                ['code' => '35.73', 'name' => 'Kota Malang'],
            ]]),
            'wilayah.id/api/districts/35.73.json' => Http::response(['data' => [
                ['code' => '35.73.05', 'name' => 'Lowokwaru'],
            ]]),
            'wilayah.id/api/villages/35.73.05.json' => Http::response(['data' => [
                ['code' => '35.73.05.1001', 'name' => 'Tunggulwulung'],
            ]]),
        ]);
    }
}
