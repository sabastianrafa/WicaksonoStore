<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = User::factory()->create(['role' => UserRole::ADMIN]);
    }

    public function test_admin_can_access_dashboard_statistics(): void
    {
        $category = Category::create([
            'name' => 'Kategori Dash',
            'slug' => 'kategori-dash',
            'is_active' => true,
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Dash',
            'slug' => 'produk-dash',
            'price' => 50000,
            'stock' => 20,
            'sold' => 10,
            'is_active' => true,
        ]);

        $customer = User::factory()->create(['role' => UserRole::USER]);

        $order = Order::create([
            'user_id' => $customer->id,
            'order_number' => 'ORD-DASH-1',
            'subtotal' => 50000,
            'shipping_cost' => 10000,
            'total' => 60000,
            'shipping_name' => 'Customer',
            'shipping_phone' => '08123456789',
            'shipping_province' => 'Jatim',
            'shipping_city' => 'Malang',
            'shipping_postal_code' => '65145',
            'shipping_address' => 'Alamat',
            'order_status' => OrderStatus::CONFIRMED,
        ]);

        Payment::create([
            'order_id' => $order->id,
            'method' => 'transfer_bank',
            'amount' => 60000,
            'status' => PaymentStatus::PAID,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/admin/dashboard');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'summary' => [
                        'total_orders' => 1,
                        'total_revenue' => 60000,
                    ],
                ],
            ]);
    }

    public function test_admin_can_access_sales_and_product_reports(): void
    {
        $salesResponse = $this->actingAs($this->admin)->getJson('/api/admin/reports/sales');
        $salesResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'total_orders' => 0,
                ],
            ]);

        $productResponse = $this->actingAs($this->admin)->getJson('/api/admin/reports/products');
        $productResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }

    public function test_admin_can_manage_users(): void
    {
        $user = User::factory()->create(['role' => UserRole::USER]);

        // 1. List users
        $listResponse = $this->actingAs($this->admin)->getJson('/api/admin/users');
        $listResponse->assertStatus(200);

        // 2. Show user
        $showResponse = $this->actingAs($this->admin)->getJson("/api/admin/users/{$user->id}");
        $showResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $user->id,
                ],
            ]);

        // 3. Update role
        $roleResponse = $this->actingAs($this->admin)->patchJson("/api/admin/users/{$user->id}/role", [
            'role' => 'admin',
        ]);
        $roleResponse->assertStatus(200);
        $this->assertEquals(UserRole::ADMIN, $user->fresh()->role);

        // 4. Delete user
        $deleteResponse = $this->actingAs($this->admin)->deleteJson("/api/admin/users/{$user->id}");
        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('users', ['id' => $user->id]);

        // 5. Admin cannot delete self
        $selfDelete = $this->actingAs($this->admin)->deleteJson("/api/admin/users/{$this->admin->id}");
        $selfDelete->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }
}
