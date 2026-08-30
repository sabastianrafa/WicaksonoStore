<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProductTest extends TestCase
{
    use DatabaseTransactions;

    protected Category $category;

    protected function setUp(): void
    {
        parent::setUp();

        $this->category = Category::create([
            'name' => 'Kategori Produk Test',
            'slug' => 'kategori-produk-test',
            'is_active' => true,
        ]);
    }

    public function test_can_list_and_filter_products(): void
    {
        Product::create([
            'category_id' => $this->category->id,
            'name' => 'Keripik Tempe Super Enak',
            'slug' => 'keripik-tempe-super-enak',
            'price' => 20000,
            'stock' => 50,
            'is_active' => true,
        ]);

        Product::create([
            'category_id' => $this->category->id,
            'name' => 'Apel Manalagi Segar',
            'slug' => 'apel-manalagi-segar',
            'price' => 50000,
            'stock' => 20,
            'is_active' => true,
        ]);

        // Filter search
        $searchResponse = $this->getJson('/api/products?search=Keripik');
        $searchResponse->assertStatus(200);
        $names = collect($searchResponse->json('data'))->pluck('name');
        $this->assertTrue($names->contains('Keripik Tempe Super Enak'));

        // Filter price
        $priceResponse = $this->getJson('/api/products?min_price=30000');
        $priceResponse->assertStatus(200);
        $priceNames = collect($priceResponse->json('data'))->pluck('name');
        $this->assertTrue($priceNames->contains('Apel Manalagi Segar'));
        $this->assertFalse($priceNames->contains('Keripik Tempe Super Enak'));
    }

    public function test_can_show_active_product_detail(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Produk Detail Test',
            'slug' => 'produk-detail-test',
            'price' => 15000,
            'stock' => 10,
            'is_active' => true,
        ]);

        $response = $this->getJson("/api/products/{$product->id}");

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'id' => $product->id,
                    'name' => 'Produk Detail Test',
                ],
            ]);
    }

    public function test_cannot_show_inactive_product_publicly(): void
    {
        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Produk Inaktif',
            'slug' => 'produk-inaktif',
            'price' => 15000,
            'stock' => 10,
            'is_active' => false,
        ]);

        $response = $this->getJson("/api/products/{$product->id}");

        $response->assertStatus(404);
    }

    public function test_admin_can_crud_product(): void
    {
        $admin = User::factory()->create([
            'role' => UserRole::ADMIN,
        ]);

        // 1. Create
        $createResponse = $this->actingAs($admin)->postJson('/api/admin/products', [
            'category_id' => $this->category->id,
            'name' => 'Produk Admin Baru',
            'price' => 30000,
            'original_price' => 35000,
            'stock' => 25,
            'discount' => 14,
            'description' => 'Deskripsi produk admin',
            'is_active' => true,
        ]);

        $createResponse->assertStatus(201)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Produk Admin Baru',
                    'price' => '30000.00',
                ],
            ]);

        $productId = $createResponse->json('data.id');

        // 2. Update
        $updateResponse = $this->actingAs($admin)->putJson("/api/admin/products/{$productId}", [
            'name' => 'Produk Admin Diedit',
            'price' => 32000,
        ]);

        $updateResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'name' => 'Produk Admin Diedit',
                    'price' => '32000.00',
                ],
            ]);

        // 3. Delete
        $deleteResponse = $this->actingAs($admin)->deleteJson("/api/admin/products/{$productId}");

        $deleteResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);

        $this->assertDatabaseMissing('products', [
            'id' => $productId,
        ]);
    }

    public function test_admin_can_manage_product_images(): void
    {
        Storage::fake('public');

        $admin = User::factory()->create([
            'role' => UserRole::ADMIN,
        ]);

        $product = Product::create([
            'category_id' => $this->category->id,
            'name' => 'Produk Bergambar',
            'slug' => 'produk-bergambar',
            'price' => 15000,
            'stock' => 10,
            'is_active' => true,
        ]);

        // Upload image
        $file = UploadedFile::fake()->image('produk1.jpg');
        $uploadResponse = $this->actingAs($admin)
            ->postJson("/api/admin/products/{$product->id}/images", [
                'image' => $file,
                'alt_text' => 'Gambar utama produk',
                'is_primary' => true,
            ]);

        $uploadResponse->assertStatus(201)
            ->assertJson([
                'success' => true,
            ]);

        $imageId = $uploadResponse->json('data.id');
        $path = $uploadResponse->json('data.image');

        Storage::disk('public')->assertExists($path);

        // Delete image
        $deleteResponse = $this->actingAs($admin)
            ->deleteJson("/api/admin/products/{$product->id}/images/{$imageId}");

        $deleteResponse->assertStatus(200);
        $this->assertDatabaseMissing('product_images', ['id' => $imageId]);
        Storage::disk('public')->assertMissing($path);
    }
}
