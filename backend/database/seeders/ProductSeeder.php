<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categories = Category::pluck('id', 'slug');

        $products = [
            [
                'category' => 'makanan',
                'name' => 'Bakso Malang Frozen',
                'description' => 'Bakso khas Malang dalam bentuk frozen yang praktis untuk dinikmati di rumah.',
                'price' => 35000,
                'original_price' => 40000,
                'stock' => 50,
                'sold' => 125,
                'rating' => 4.80,
                'review_count' => 32,
                'discount' => 13,
                'image' => 'products/bakso-malang-frozen.jpg',
            ],
            [
                'category' => 'keripik',
                'name' => 'Keripik Tempe Malang',
                'description' => 'Keripik tempe renyah khas Malang dengan rasa gurih dan cocok sebagai oleh-oleh.',
                'price' => 18000,
                'original_price' => 22000,
                'stock' => 100,
                'sold' => 245,
                'rating' => 4.90,
                'review_count' => 58,
                'discount' => 18,
                'image' => 'products/keripik-tempe.jpg',
            ],
            [
                'category' => 'keripik',
                'name' => 'Keripik Apel Malang',
                'description' => 'Keripik apel khas Malang dengan tekstur renyah dan rasa apel yang khas.',
                'price' => 25000,
                'original_price' => 30000,
                'stock' => 80,
                'sold' => 187,
                'rating' => 4.70,
                'review_count' => 41,
                'discount' => 17,
                'image' => 'products/keripik-apel.jpg',
            ],
            [
                'category' => 'sambal',
                'name' => 'Sambal Bawang Malang',
                'description' => 'Sambal bawang pedas khas Malang yang cocok untuk berbagai jenis makanan.',
                'price' => 22000,
                'original_price' => 25000,
                'stock' => 70,
                'sold' => 156,
                'rating' => 4.80,
                'review_count' => 37,
                'discount' => 12,
                'image' => 'products/sambal-bawang.jpg',
            ],
            [
                'category' => 'kue-oleh-oleh',
                'name' => 'Pia Malang Premium',
                'description' => 'Pia premium dengan kulit renyah dan isian lembut, cocok sebagai oleh-oleh.',
                'price' => 30000,
                'original_price' => 35000,
                'stock' => 60,
                'sold' => 198,
                'rating' => 4.90,
                'review_count' => 46,
                'discount' => 14,
                'image' => 'products/pia-malang.jpg',
            ],
            [
                'category' => 'camilan',
                'name' => 'Kacang Disco Malang',
                'description' => 'Camilan kacang renyah dengan bumbu gurih dan cocok untuk teman bersantai.',
                'price' => 20000,
                'original_price' => null,
                'stock' => 90,
                'sold' => 112,
                'rating' => 4.60,
                'review_count' => 24,
                'discount' => 0,
                'image' => 'products/kacang-disco.jpg',
            ],
            [
                'category' => 'minuman',
                'name' => 'Kopi Bubuk Malang',
                'description' => 'Kopi bubuk pilihan dari daerah Malang dengan aroma khas dan rasa yang kuat.',
                'price' => 28000,
                'original_price' => 32000,
                'stock' => 75,
                'sold' => 134,
                'rating' => 4.70,
                'review_count' => 29,
                'discount' => 13,
                'image' => 'products/kopi-malang.jpg',
            ],
            [
                'category' => 'batik-kerajinan',
                'name' => 'Batik Khas Malang',
                'description' => 'Batik dengan motif khas Malang yang cocok digunakan maupun dijadikan oleh-oleh.',
                'price' => 150000,
                'original_price' => null,
                'stock' => 25,
                'sold' => 34,
                'rating' => 4.80,
                'review_count' => 12,
                'discount' => 0,
                'image' => 'products/batik-malang.jpg',
            ],
        ];

        foreach ($products as $product) {
            $categoryId = $categories[$product['category']] ?? null;

            if (!$categoryId) {
                continue;
            }

            Product::create([
                'category_id' => $categoryId,
                'name' => $product['name'],
                'slug' => Str::slug($product['name']),
                'description' => $product['description'],
                'price' => $product['price'],
                'original_price' => $product['original_price'],
                'stock' => $product['stock'],
                'sold' => $product['sold'],
                'rating' => $product['rating'],
                'review_count' => $product['review_count'],
                'discount' => $product['discount'],
                'image' => $product['image'],
                'is_active' => true,
            ]);
        }
    }
}