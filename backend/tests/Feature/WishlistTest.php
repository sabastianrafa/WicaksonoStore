<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class WishlistTest extends TestCase
{
    use DatabaseTransactions;

    public function test_user_can_manage_wishlist(): void
    {
        $user = User::factory()->create();

        $category = Category::create([
            'name' => 'Kategori Wishlist',
            'slug' => 'kategori-wishlist',
            'is_active' => true,
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Idaman',
            'slug' => 'produk-idaman',
            'price' => 25000,
            'stock' => 10,
            'is_active' => true,
        ]);

        // 1. Add to wishlist
        $addResponse = $this->actingAs($user)->postJson("/api/wishlist/{$product->id}");
        $addResponse->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseHas('wishlists', [
            'user_id' => $user->id,
            'product_id' => $product->id,
        ]);

        // 2. Prevent duplicate addition
        $duplicateResponse = $this->actingAs($user)->postJson("/api/wishlist/{$product->id}");
        $duplicateResponse->assertStatus(201);
        $this->assertEquals(1, Wishlist::where('user_id', $user->id)->where('product_id', $product->id)->count());

        // 3. Check wishlist status
        $checkResponse = $this->actingAs($user)->getJson("/api/wishlist/{$product->id}");
        $checkResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'in_wishlist' => true,
                ],
            ]);

        // 4. List wishlist
        $listResponse = $this->actingAs($user)->getJson('/api/wishlist');
        $listResponse->assertStatus(200);
        $this->assertCount(1, $listResponse->json('data'));

        // 5. Remove from wishlist
        $deleteResponse = $this->actingAs($user)->deleteJson("/api/wishlist/{$product->id}");
        $deleteResponse->assertStatus(200);

        $this->assertDatabaseMissing('wishlists', [
            'user_id' => $user->id,
            'product_id' => $product->id,
        ]);
    }
}
