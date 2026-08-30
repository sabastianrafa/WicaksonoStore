<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name' => 'Makanan',
                'slug' => 'makanan',
                'icon' => '🍜',
                'color' => '#E24E32',
                'is_active' => true,
            ],
            [
                'name' => 'Minuman',
                'slug' => 'minuman',
                'icon' => '🥤',
                'color' => '#3498DB',
                'is_active' => true,
            ],
            [
                'name' => 'Keripik',
                'slug' => 'keripik',
                'icon' => '🥔',
                'color' => '#F39C12',
                'is_active' => true,
            ],
            [
                'name' => 'Kue & Oleh-Oleh',
                'slug' => 'kue-oleh-oleh',
                'icon' => '🍰',
                'color' => '#9B59B6',
                'is_active' => true,
            ],
            [
                'name' => 'Sambal',
                'slug' => 'sambal',
                'icon' => '🌶️',
                'color' => '#C0392B',
                'is_active' => true,
            ],
            [
                'name' => 'Camilan',
                'slug' => 'camilan',
                'icon' => '🍪',
                'color' => '#27AE60',
                'is_active' => true,
            ],
            [
                'name' => 'Batik & Kerajinan',
                'slug' => 'batik-kerajinan',
                'icon' => '🎨',
                'color' => '#8E44AD',
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}