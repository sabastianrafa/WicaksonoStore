<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use DatabaseTransactions;

    public function test_can_list_public_active_categories(): void
    {
        $category = Category::create([
            'name' => 'Kategori Test',
            'slug' => 'kategori-test',
            'icon' => '🍟',
            'color' => '#FF0000',
            'is_active' => true,
        ]);

        $inactive = Category::create([
            'name' => 'Kategori Inactive',
            'slug' => 'kategori-inactive',
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/categories');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $names = collect($response->json('data'))->pluck('name');
        $this->assertTrue($names->contains('Kategori Test'));
        $this->assertFalse($names->contains('Kategori Inactive'));
    }

    public function test_can_show_single_category(): void
    {
        $category = Category::create([
            'name' => 'Kategori Detail',
            'slug' => 'kategori-detail',
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/categories/{$category->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $category->id,
                    'name' => 'Kategori Detail',
                ],
            ]);
    }

    public function test_admin_can_crud_categories(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::ADMIN,
        ]);

        // 1. Create
        $createResponse = $this->actingAs($admin)->postJson('/api/admin/categories', [
            'name' => 'Kategori Baru Admin',
            'icon' => '📦',
            'color' => '#333333',
            'is_active' => true,
        ]);

        $createResponse->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Kategori Baru Admin',
                ],
            ]);

        $categoryId = $createResponse->json('data.id');

        // 2. Update
        $updateResponse = $this->actingAs($admin)->putJson("/api/admin/categories/{$categoryId}", [
            'name' => 'Kategori Diubah',
            'is_active' => true,
        ]);

        $updateResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Kategori Diubah',
                ],
            ]);

        // 3. Delete
        $deleteResponse = $this->actingAs($admin)->deleteJson("/api/admin/categories/{$categoryId}");

        $deleteResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseMissing('categories', [
            'id' => $categoryId,
        ]);
    }

    public function test_cannot_delete_category_with_products(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::ADMIN,
        ]);

        $category = Category::create([
            'name' => 'Kategori Ada Produk',
            'slug' => 'kategori-ada-produk',
            'is_active' => true,
        ]);

        Product::create([
            'category_id' => $category->id,
            'name' => 'Produk Kategori',
            'slug' => 'produk-kategori-test',
            'price' => 10000,
            'stock' => 10,
            'is_active' => true,
        ]);

        $response = $this->actingAs($admin)->deleteJson("/api/admin/categories/{$category->id}");

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
            ]);
    }
}
