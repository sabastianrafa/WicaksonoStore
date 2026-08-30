<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class CartTest extends TestCase
{
    use DatabaseTransactions;

    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();
        $this->category = Category::create([
            'name' => 'Kategori Cart Test',
            'slug' => 'kategori-cart-test',
            'is_active' => true,
        ]);
    }

    public function test_user_can_add_item_to_cart_and_calculate_subtotal(): void
    {
        $user = User::factory()->create();

        $product1 = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Produk Cart 1',
            'slug' => 'produk-cart-1',
            'price' => 20000,
            'stock' => 10,
            'is_active' => true,
        ]);

        $product2 = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Produk Cart 2',
            'slug' => 'produk-cart-2',
            'price' => 15000,
            'stock' => 10,
            'is_active' => true,
        ]);

        // 1. Add product 1 (qty 2 = 40000)
        $add1 = $this->actingAs($user)->postJson('/api/cart/items', [
            'product_id' => $product1->id,
            'quantity' => 2,
        ]);
        $add1->assertStatus(201);

        // 2. Add product 2 (qty 1 = 15000)
        $add2 = $this->actingAs($user)->postJson('/api/cart/items', [
            'product_id' => $product2->id,
            'quantity' => 1,
        ]);
        $add2->assertStatus(201);

        // 3. View cart (total_items: 3, subtotal: 55000)
        $cartResponse = $this->actingAs($user)->getJson('/api/cart');
        $cartResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'total_items' => 3,
                    'subtotal' => 55000,
                ],
            ]);
    }

    public function test_cart_validates_stock_limit(): void
    {
        $user = User::factory()->create();

        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Produk Stok Tipis',
            'slug' => 'produk-stok-tipis',
            'price' => 20000,
            'stock' => 3,
            'is_active' => true,
        ]);

        // Try adding 5 (exceeds stock 3)
        $response = $this->actingAs($user)->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => 5,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }

    public function test_user_can_update_remove_and_clear_cart(): void
    {
        $user = User::factory()->create();

        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Produk Update Cart',
            'slug' => 'produk-update-cart',
            'price' => 10000,
            'stock' => 10,
            'is_active' => true,
        ]);

        $addResponse = $this->actingAs($user)->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => 1,
        ]);
        $itemId = $addResponse->json('data.id');

        // Update quantity to 4
        $updateResponse = $this->actingAs($user)->putJson("/api/cart/items/{$itemId}", [
            'quantity' => 4,
        ]);
        $updateResponse->assertStatus(200);

        $checkCart = $this->actingAs($user)->getJson('/api/cart');
        $this->assertEquals(40000, $checkCart->json('data.subtotal'));

        // Remove item
        $removeResponse = $this->actingAs($user)->deleteJson("/api/cart/items/{$itemId}");
        $removeResponse->assertStatus(200);

        $emptyCheck = $this->actingAs($user)->getJson('/api/cart');
        $this->assertEquals(0, $emptyCheck->json('data.total_items'));

        // Add item again and clear
        $this->actingAs($user)->postJson('/api/cart/items', [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);
        $clearResponse = $this->actingAs($user)->deleteJson('/api/cart');
        $clearResponse->assertStatus(200);

        $finalCheck = $this->actingAs($user)->getJson('/api/cart');
        $this->assertEquals(0, $finalCheck->json('data.total_items'));
    }
}
