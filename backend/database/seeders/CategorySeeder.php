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
                'is_active' => true,
            ],
            [
                'name' => 'Minuman',
                'slug' => 'minuman',
                'is_active' => true,
            ],
            [
                'name' => 'Keripik',
                'slug' => 'keripik',
                'is_active' => true,
            ],
            [
                'name' => 'Kue & Oleh-Oleh',
                'slug' => 'kue-oleh-oleh',
                'is_active' => true,
            ],
            [
                'name' => 'Sambal',
                'slug' => 'sambal',
                'is_active' => true,
            ],
            [
                'name' => 'Camilan',
                'slug' => 'camilan',
                'is_active' => true,
            ],
            [
                'name' => 'Batik & Kerajinan',
                'slug' => 'batik-kerajinan',
                'is_active' => true,
            ],
        ];

        foreach ($categories as $category) {
            Category::create($category);
        }
    }
}
