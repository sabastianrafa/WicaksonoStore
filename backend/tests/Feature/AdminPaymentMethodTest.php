<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class AdminPaymentMethodTest extends TestCase
{
    use DatabaseTransactions;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('public');

        $this->admin = User::factory()->create(['role' => UserRole::ADMIN]);
    }

    public function test_admin_can_create_bank_method_with_account_number(): void
    {
        $response = $this->actingAs($this->admin)->postJson('/api/admin/payment-methods', [
            'name' => 'Transfer BCA',
            'code' => 'transfer_bca',
            'type' => 'bank',
            'account_number' => '1234567890',
            'account_name' => 'PT Wicaksono',
            'is_active' => true,
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'type' => 'bank',
                    'account_number' => '1234567890',
                    'account_name' => 'PT Wicaksono',
                ],
            ]);

        $this->assertDatabaseHas('payment_methods', [
            'code' => 'transfer_bca',
            'account_number' => '1234567890',
        ]);
    }

    public function test_qris_method_stores_uploaded_image(): void
    {
        $response = $this->actingAs($this->admin)->post('/api/admin/payment-methods', [
            'name' => 'QRIS',
            'code' => 'qris',
            'type' => 'qris',
            'is_active' => true,
            'qris_image' => UploadedFile::fake()->image('qr.png'),
        ], ['Accept' => 'application/json']);

        $response->assertStatus(201)
            ->assertJson(['data' => ['type' => 'qris']]);

        $method = PaymentMethod::where('code', 'qris')->first();

        $this->assertNotNull($method->qris_image);
        Storage::disk('public')->assertExists($method->qris_image);
    }

    public function test_bank_method_ignores_qris_fields(): void
    {
        $response = $this->actingAs($this->admin)->post('/api/admin/payment-methods', [
            'name' => 'Mandiri',
            'code' => 'mandiri',
            'type' => 'bank',
            'account_number' => '999',
            'is_active' => true,
            'qris_image' => UploadedFile::fake()->image('qr.png'),
        ], ['Accept' => 'application/json']);

        $response->assertStatus(201);

        $this->assertNull(PaymentMethod::where('code', 'mandiri')->first()->qris_image);
    }

    public function test_switching_type_clears_stale_data(): void
    {
        $method = PaymentMethod::create([
            'name' => 'QRIS',
            'code' => 'qris',
            'type' => 'qris',
            'qris_image' => 'payment-methods/lama.jpg',
            'is_active' => true,
        ]);

        Storage::disk('public')->put('payment-methods/lama.jpg', 'dummy');

        $this->actingAs($this->admin)
            ->putJson("/api/admin/payment-methods/{$method->id}", [
                'name' => 'QRIS',
                'type' => 'bank',
                'account_number' => '555',
            ])
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'type' => 'bank',
                    'account_number' => '555',
                    'qris_image' => null,
                ],
            ]);

        Storage::disk('public')->assertMissing('payment-methods/lama.jpg');
    }

    public function test_admin_can_update_payment_method(): void
    {
        $method = PaymentMethod::create([
            'name' => 'OVO',
            'code' => 'ovo',
            'type' => 'bank',
            'account_number' => '111',
            'is_active' => true,
        ]);

        $this->actingAs($this->admin)
            ->putJson("/api/admin/payment-methods/{$method->id}", [
                'name' => 'OVO Updated',
                'is_active' => false,
            ])
            ->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'OVO Updated',
                    'is_active' => false,
                ],
            ]);
    }

    public function test_payment_method_code_must_be_unique(): void
    {
        PaymentMethod::create([
            'name' => 'Transfer Bank',
            'code' => 'transfer_bank',
            'type' => 'bank',
            'is_active' => true,
        ]);

        $this->actingAs($this->admin)->postJson('/api/admin/payment-methods', [
            'name' => 'Duplikat',
            'code' => 'transfer_bank',
            'type' => 'bank',
        ])->assertStatus(422)->assertJsonValidationErrors('code');
    }

    public function test_type_is_required_on_create(): void
    {
        $this->actingAs($this->admin)->postJson('/api/admin/payment-methods', [
            'name' => 'Tanpa Tipe',
            'code' => 'tanpa-tipe',
        ])->assertStatus(422)->assertJsonValidationErrors('type');
    }

    public function test_cannot_delete_payment_method_used_by_payments(): void
    {
        $method = PaymentMethod::create([
            'name' => 'COD',
            'code' => 'cod',
            'type' => 'bank',
            'is_active' => true,
        ]);

        $order = Order::create([
            'user_id' => $this->admin->id,
            'shipping_method_id' => ShippingMethod::create([
                'name' => 'Kurir Uji PM',
                'code' => 'kurir-uji-pm',
                'cost' => 10000,
                'is_active' => true,
            ])->id,
            'order_number' => 'ORD-UIJIPM-001',
            'subtotal' => 10000,
            'shipping_cost' => 0,
            'total' => 10000,
            'shipping_name' => 'Admin Uji',
            'shipping_phone' => '080000000000',
            'shipping_province' => 'Jawa Timur',
            'shipping_city' => 'Malang',
            'shipping_postal_code' => '65145',
            'shipping_address' => 'Jl. Uji No. 1',
            'order_status' => OrderStatus::PENDING,
        ]);

        Payment::create([
            'order_id' => $order->id,
            'method' => $method->code,
            'amount' => 10000,
            'status' => PaymentStatus::PAID,
        ]);

        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/payment-methods/{$method->id}")
            ->assertStatus(422);

        $this->assertDatabaseHas('payment_methods', ['id' => $method->id]);
    }

    public function test_can_delete_unused_payment_method(): void
    {
        $method = PaymentMethod::create([
            'name' => 'ShopeePay',
            'code' => 'shopeepay',
            'type' => 'qris',
            'is_active' => true,
        ]);

        $this->actingAs($this->admin)
            ->deleteJson("/api/admin/payment-methods/{$method->id}")
            ->assertStatus(200);

        $this->assertDatabaseMissing('payment_methods', ['id' => $method->id]);
    }

    public function test_public_endpoint_only_returns_active_methods(): void
    {
        PaymentMethod::create([
            'name' => 'Aktif',
            'code' => 'aktif',
            'type' => 'bank',
            'is_active' => true,
        ]);

        PaymentMethod::create([
            'name' => 'Nonaktif',
            'code' => 'nonaktif',
            'type' => 'bank',
            'is_active' => false,
        ]);

        $codes = collect($this->getJson('/api/payment-methods')->json('data'))
            ->pluck('code');

        $this->assertTrue($codes->contains('aktif'));
        $this->assertFalse($codes->contains('nonaktif'));
    }

    public function test_guest_cannot_manage_payment_methods(): void
    {
        $this->postJson('/api/admin/payment-methods', [
            'name' => 'Ilegal',
            'code' => 'ilegal',
            'type' => 'bank',
        ])->assertStatus(401);
    }

    public function test_non_admin_cannot_manage_payment_methods(): void
    {
        $user = User::factory()->create(['role' => UserRole::USER]);

        $this->actingAs($user)->postJson('/api/admin/payment-methods', [
            'name' => 'Ilegal',
            'code' => 'ilegal',
            'type' => 'bank',
        ])->assertStatus(403);
    }

    public function test_bank_method_requires_account_number(): void
    {
        $this->actingAs($this->admin)->postJson('/api/admin/payment-methods', [
            'name' => 'Tanpa Rek',
            'code' => 'tanpa-rek',
            'type' => 'bank',
        ])->assertStatus(422)->assertJsonValidationErrors('account_number');
    }

    public function test_qris_method_requires_image(): void
    {
        $this->actingAs($this->admin)->postJson('/api/admin/payment-methods', [
            'name' => 'QRIS Kosong',
            'code' => 'qris-kosong',
            'type' => 'qris',
        ])->assertStatus(422)->assertJsonValidationErrors('qris_image');
    }

    public function test_partial_update_does_not_require_name(): void
    {
        $method = PaymentMethod::create([
            'name' => 'OVO',
            'code' => 'ovo',
            'type' => 'bank',
            'account_number' => '111',
            'is_active' => true,
        ]);

        $this->actingAs($this->admin)
            ->patchJson("/api/admin/payment-methods/{$method->id}", [
                'is_active' => false,
            ])
            ->assertStatus(200)
            ->assertJson([
                'data' => [
                    'name' => 'OVO',
                    'is_active' => false,
                ],
            ]);
    }

    public function test_qris_image_url_is_relative(): void
    {
        $method = PaymentMethod::create([
            'name' => 'QRIS',
            'code' => 'qris',
            'type' => 'qris',
            'qris_image' => 'payment-methods/abc.png',
            'is_active' => true,
        ]);

        $this->assertSame('/storage/payment-methods/abc.png', $method->qris_image_url);
    }
}
