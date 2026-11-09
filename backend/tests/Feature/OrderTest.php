<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Models\Address;
use App\Models\Category;
use App\Models\Order;
use App\Models\PaymentMethod;
use App\Models\Product;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use DatabaseTransactions;

    protected User $user;
    protected Address $address;
    protected ShippingMethod $shippingMethod;
    protected Product $product;
    protected PaymentMethod $paymentMethod;

    protected function setUp(): void
    {
        parent::setUp();

        foreach ([
            'indonesia-locations:provinces',
            'indonesia-locations:regencies/35',
            'indonesia-locations:districts/35.73',
            'indonesia-locations:villages/35.73.05',
        ] as $cacheKey) {
            Cache::forget($cacheKey);
        }
        Http::fake(function ($request) {
            $path = parse_url($request->url(), PHP_URL_PATH);
            $data = match ($path) {
                '/api/provinces.json' => [['code' => '35', 'name' => 'Jawa Timur']],
                '/api/regencies/35.json' => [['code' => '35.73', 'name' => 'Kota Malang']],
                '/api/districts/35.73.json' => [['code' => '35.73.05', 'name' => 'Lowokwaru']],
                default => [['code' => '35.73.05.1001', 'name' => 'Kelurahan Test']],
            };
            return Http::response(['data' => $data]);
        });
        Config::set('services.midtrans.server_key', 'test-server-key');
        Config::set('services.midtrans.client_key', 'test-client-key');

        $this->user = User::factory()->create(['role' => UserRole::USER]);

        $this->address = Address::create([
            'user_id' => $this->user->id,
            'label' => 'Rumah',
            'name' => 'Budi Pembeli',
            'phone' => '08123456789',
            'province' => 'Jawa Timur',
            'province_code' => '35',
            'city' => 'Malang',
            'regency_code' => '35.73',
            'district' => 'Lowokwaru',
            'district_code' => '35.73.05',
            'village' => 'Kelurahan Test',
            'village_code' => '35.73.05.1001',
            'postal_code' => '65145',
            'address' => 'Jl. Kawi No. 10',
            'is_default' => true,
        ]);

        $this->shippingMethod = ShippingMethod::updateOrCreate(['code' => 'GOSEND'], [
            'name' => 'GoSend Test',
            'code' => 'GOSEND',
            'cost' => 10000,
            'is_active' => true,
        ]);

        $this->paymentMethod = PaymentMethod::updateOrCreate(['code' => 'midtrans'], [
            'name' => 'Midtrans Test',
            'type' => PaymentMethod::TYPE_GATEWAY,
            'is_active' => true,
        ]);

        $category = Category::create([
            'name' => 'Kategori Order Test',
            'slug' => 'kategori-order-test',
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'category_id' => $category->id,
            'name' => 'Bakpia Khas Malang',
            'slug' => 'bakpia-khas-malang-test',
            'price' => 30000,
            'stock' => 10,
            'sold' => 5,
            'is_active' => true,
        ]);
    }

    public function test_user_can_checkout_successfully(): void
    {
        // 1. Add to cart (2 * 30000 = 60000)
        $this->actingAs($this->user)->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 2,
        ]);

        // 2. Checkout
        $response = $this->actingAs($this->user)->postJson('/api/orders', [
            'address_id' => $this->address->id,
            'shipping_method_id' => $this->shippingMethod->id,
            'notes' => 'Tolong packing aman',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'message' => 'Pesanan berhasil dibuat.',
                'data' => [
                    'subtotal' => '60000.00',
                    'shipping_cost' => '10000.00',
                    'total' => '70000.00',
                    'order_status' => 'pending',
                ],
            ]);

        $response->assertJsonPath('data.payment.method', 'midtrans');

        // Stock decreased (10 - 2 = 8), sold increased (5 + 2 = 7)
        $this->assertEquals(8, $this->product->fresh()->stock);
        $this->assertEquals(7, $this->product->fresh()->sold);

        // Cart emptied
        $this->assertEquals(0, $this->user->cart->items()->count());
    }

    public function test_cannot_checkout_with_empty_cart(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/orders', [
            'address_id' => $this->address->id,
            'shipping_method_id' => $this->shippingMethod->id,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Keranjang belanja masih kosong.',
            ]);
    }

    public function test_user_can_cancel_pending_order_and_stock_is_restored(): void
    {
        // Add to cart and checkout
        $this->actingAs($this->user)->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 3,
        ]);

        $checkoutResponse = $this->actingAs($this->user)->postJson('/api/orders', [
            'address_id' => $this->address->id,
            'shipping_method_id' => $this->shippingMethod->id,
        ]);

        $checkoutResponse->assertCreated();
        $orderId = $checkoutResponse->json('data.id');
        $this->assertEquals(7, $this->product->fresh()->stock);

        // Cancel order
        $cancelResponse = $this->actingAs($this->user)->postJson("/api/orders/{$orderId}/cancel");
        $cancelResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'order_status' => 'cancelled',
                ],
            ]);

        // Stock restored back to 10
        $this->assertEquals(10, $this->product->fresh()->stock);
    }

    public function test_user_cannot_view_other_user_order(): void
    {
        $otherUser = User::factory()->create();

        // Create order for $this->user
        $this->actingAs($this->user)->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 1,
        ]);

        $checkout = $this->actingAs($this->user)->postJson('/api/orders', [
            'address_id' => $this->address->id,
            'shipping_method_id' => $this->shippingMethod->id,
        ]);
        $checkout->assertCreated();
        $orderId = $checkout->json('data.id');

        // Other user attempts to view
        $response = $this->actingAs($otherUser)->getJson("/api/orders/{$orderId}");
        $response->assertStatus(404);
    }

    public function test_admin_can_view_orders_and_update_status(): void
    {
        $admin = User::factory()->create(['role' => UserRole::ADMIN]);

        // Create order
        $this->actingAs($this->user)->postJson('/api/cart/items', [
            'product_id' => $this->product->id,
            'quantity' => 1,
        ]);

        $checkout = $this->actingAs($this->user)->postJson('/api/orders', [
            'address_id' => $this->address->id,
            'shipping_method_id' => $this->shippingMethod->id,
        ]);
        $checkout->assertCreated();
        $orderId = $checkout->json('data.id');

        // Admin list
        $adminList = $this->actingAs($admin)->getJson('/api/admin/orders');
        $adminList->assertStatus(200);

        // Admin update status to processing
        $updateStatus = $this->actingAs($admin)->patchJson("/api/admin/orders/{$orderId}/status", [
            'status' => 'processing',
        ]);

        $updateStatus->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'order_status' => 'processing',
                ],
            ]);
    }
}
