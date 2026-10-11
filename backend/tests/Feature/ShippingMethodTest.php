<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ShippingMethodTest extends TestCase
{
    use DatabaseTransactions;

    public function test_public_can_list_and_show_active_shipping_methods(): void
    {
        $active = ShippingMethod::updateOrCreate(
            ['code' => 'GOSEND'],
            [
                'name' => 'GoSend',
                'description' => 'Pengiriman GoSend.',
                'cost' => 15000,
                'estimated_days' => '1-2 hari',
                'is_active' => true,
                'sort_order' => 1,
            ]
        );

        ShippingMethod::create([
            'name' => 'Kurir tambahan',
            'code' => 'KURIR_TAMBAHAN_TEST',
            'cost' => 10000,
            'is_active' => true,
        ]);

        $listResponse = $this->getJson('/api/shipping-methods');
        $listResponse->assertStatus(200);
        $codes = collect($listResponse->json('data'))->pluck('code');
        $this->assertTrue($codes->contains('GOSEND'));
        $this->assertFalse($codes->contains('KURIR_TAMBAHAN_TEST'));

        $showResponse = $this->getJson("/api/shipping-methods/{$active->id}");
        $showResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $active->id,
                    'code' => 'GOSEND',
                ],
            ]);
    }

    public function test_public_can_load_province_choices_for_checkout(): void
    {
        Http::fake([
            'wilayah.id/api/provinces.json' => Http::response(['data' => [
                ['code' => '35', 'name' => 'Jawa Timur'],
            ]]),
        ]);

        $this->getJson('/api/locations/provinces')
            ->assertOk()
            ->assertJsonPath('data.0.code', '35')
            ->assertJsonPath('data.0.name', 'Jawa Timur');
    }

    public function test_public_shipping_quote_selects_courier_by_destination(): void
    {
        $this->fakeLocations();

        foreach ([
            ['GoSend', 'GOSEND', 25000, 'Hari yang sama'],
            ['J&T Express', 'JNT_REG', 14000, '2-4 hari'],
            ['Lion Parcel', 'LION_PARCEL', 30000, '3-5 hari'],
        ] as [$name, $code, $cost, $estimatedDays]) {
            ShippingMethod::updateOrCreate(
                ['code' => $code],
                [
                    'name' => $name,
                    'cost' => $cost,
                    'estimated_days' => $estimatedDays,
                    'is_active' => true,
                ]
            );
        }

        $customer = User::factory()->create(['role' => UserRole::USER]);
        $malangQuote = $this->actingAs($customer)->postJson('/api/shipping-methods/quote', [
            'province_code' => '35',
            'regency_code' => '35.73',
            'district_code' => '35.73.05',
            'village_code' => '35.73.05.1001',
        ]);
        $malangQuote->assertOk()
            ->assertJsonPath('data.courier.code', 'GOSEND')
            ->assertJsonPath('data.cost', 25000);

        $javaQuote = $this->actingAs($customer)->postJson('/api/shipping-methods/quote', [
            'province_code' => '35',
            'regency_code' => '35.78',
            'district_code' => '35.78.01',
            'village_code' => '35.78.01.1001',
        ]);
        $javaQuote->assertOk()
            ->assertJsonPath('data.courier.code', 'JNT_REG')
            ->assertJsonPath('data.cost', 14000);

        $outsideJavaQuote = $this->actingAs($customer)->postJson('/api/shipping-methods/quote', [
            'province_code' => '51',
            'regency_code' => '51.71',
            'district_code' => '51.71.01',
            'village_code' => '51.71.01.1001',
        ]);
        $outsideJavaQuote->assertOk()
            ->assertJsonPath('data.courier.code', 'LION_PARCEL')
            ->assertJsonPath('data.cost', 30000);
    }

    public function test_admin_can_only_update_rates_for_the_three_supported_couriers(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::ADMIN,
        ]);

        $goSend = ShippingMethod::updateOrCreate(
            ['code' => 'GOSEND'],
            [
                'name' => 'GoSend',
                'cost' => 25000,
                'is_active' => true,
            ]
        );

        $this->actingAs($admin)->putJson("/api/admin/shipping-methods/{$goSend->id}", [
            'cost' => 30000,
            'estimated_days' => 'Hari yang sama',
            'code' => 'KURIR_LAIN',
            'name' => 'Kurir Lain',
            'is_active' => false,
        ])->assertOk()
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'GoSend',
                    'code' => 'GOSEND',
                    'cost' => '30000.00',
                    'is_active' => true,
                ],
            ]);

        $this->actingAs($admin)->postJson('/api/admin/shipping-methods', [
            'name' => 'Kurir Lain',
            'code' => 'KURIR_LAIN',
            'cost' => 12000,
        ])->assertMethodNotAllowed();

        $this->actingAs($admin)->deleteJson("/api/admin/shipping-methods/{$goSend->id}")
            ->assertMethodNotAllowed();
    }

    private function fakeLocations(): void
    {
        Http::fake(function ($request) {
            $path = parse_url($request->url(), PHP_URL_PATH);
            $data = match ($path) {
                '/api/provinces.json' => [
                    ['code' => '35', 'name' => 'Jawa Timur'],
                    ['code' => '51', 'name' => 'Bali'],
                ],
                '/api/regencies/35.json' => [
                    ['code' => '35.73', 'name' => 'Kota Malang'],
                    ['code' => '35.78', 'name' => 'Kota Surabaya'],
                ],
                '/api/regencies/51.json' => [
                    ['code' => '51.71', 'name' => 'Kota Denpasar'],
                ],
                '/api/districts/35.73.json' => [['code' => '35.73.05', 'name' => 'Lowokwaru']],
                '/api/districts/35.78.json' => [['code' => '35.78.01', 'name' => 'Surabaya']],
                '/api/districts/51.71.json' => [['code' => '51.71.01', 'name' => 'Denpasar']],
                default => [[
                    'code' => preg_replace('/\.json$/', '', basename((string) $path)) . '.1001',
                    'name' => 'Kelurahan Test',
                ]],
            };

            return Http::response(['data' => $data]);
        });
    }
}
