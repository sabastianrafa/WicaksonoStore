<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class ReviewTest extends TestCase
{
    use DatabaseTransactions;

    protected User $user;
    protected Product $product;
    protected Order $completedOrder;
    protected Order $pendingOrder;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['role' => UserRole::USER]);

        $category = Category::create([
            'name' => 'Kategori Review Test',
            'slug' => 'kategori-review-test',
            'is_active' => true,
        ]);

        $this->product = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Review Test',
            'slug' => 'produk-review-test',
            'price' => 20000,
            'stock' => 10,
            'rating' => 0,
            'review_count' => 0,
            'is_active' => true,
        ]);

        $this->completedOrder = Order::create([
            'user_id' => $this->user->id,
            'order_number' => 'ORD-REV-COMPLETED',
            'subtotal' => 20000,
            'shipping_cost' => 10000,
            'total' => 30000,
            'shipping_name' => 'Budi',
            'shipping_phone' => '08123456789',
            'shipping_province' => 'Jatim',
            'shipping_city' => 'Malang',
            'shipping_postal_code' => '65145',
            'shipping_address' => 'Jl. Test',
            'order_status' => OrderStatus::COMPLETED,
        ]);

        OrderItem::create([
            'order_id' => $this->completedOrder->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'price' => 20000,
            'quantity' => 1,
            'subtotal' => 20000,
        ]);

        $this->pendingOrder = Order::create([
            'user_id' => $this->user->id,
            'order_number' => 'ORD-REV-PENDING',
            'subtotal' => 20000,
            'shipping_cost' => 10000,
            'total' => 30000,
            'shipping_name' => 'Budi',
            'shipping_phone' => '08123456789',
            'shipping_province' => 'Jatim',
            'shipping_city' => 'Malang',
            'shipping_postal_code' => '65145',
            'shipping_address' => 'Jl. Test',
            'order_status' => OrderStatus::PENDING,
        ]);

        OrderItem::create([
            'order_id' => $this->pendingOrder->id,
            'product_id' => $this->product->id,
            'product_name' => $this->product->name,
            'price' => 20000,
            'quantity' => 1,
            'subtotal' => 20000,
        ]);
    }

    public function test_eligible_user_can_submit_review_and_updates_rating(): void
    {
        $response = $this->actingAs($this->user)->postJson("/api/products/{$this->product->id}/reviews", [
            'order_id' => $this->completedOrder->id,
            'rating' => 5,
            'comment' => 'Produk sangat enak dan renyah!',
        ]);

        $response->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'rating' => 5,
                    'comment' => 'Produk sangat enak dan renyah!',
                ],
            ]);

        // Product rating & review count updated
        $freshProduct = $this->product->fresh();
        $this->assertEquals(5.00, (float) $freshProduct->rating);
        $this->assertEquals(1, $freshProduct->review_count);
    }

    public function test_user_cannot_review_uncompleted_order(): void
    {
        $response = $this->actingAs($this->user)->postJson("/api/products/{$this->product->id}/reviews", [
            'order_id' => $this->pendingOrder->id,
            'rating' => 4,
            'comment' => 'Belum sampai',
        ]);

        $response->assertStatus(422);
    }

    public function test_cannot_submit_duplicate_review_for_same_order(): void
    {
        // First review
        $this->actingAs($this->user)->postJson("/api/products/{$this->product->id}/reviews", [
            'order_id' => $this->completedOrder->id,
            'rating' => 5,
            'comment' => 'Review pertama',
        ]);

        // Second review for same order and product
        $duplicateResponse = $this->actingAs($this->user)->postJson("/api/products/{$this->product->id}/reviews", [
            'order_id' => $this->completedOrder->id,
            'rating' => 4,
            'comment' => 'Review kedua',
        ]);

        $duplicateResponse->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_public_can_view_product_reviews(): void
    {
        $this->actingAs($this->user)->postJson("/api/products/{$this->product->id}/reviews", [
            'order_id' => $this->completedOrder->id,
            'rating' => 5,
            'comment' => 'Review Publik',
        ]);

        $response = $this->getJson("/api/products/{$this->product->id}/reviews");
        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
    }
}
