<?php

namespace Database\Seeders;

use App\Models\ShippingMethod;
use Illuminate\Database\Seeder;

class ShippingMethodSeeder extends Seeder
{
    public function run(): void
    {
        $shippingMethods = [
            [
                'name' => 'JNE Regular',
                'code' => 'JNE_REG',
                'description' => 'Pengiriman reguler melalui JNE.',
                'cost' => 15000,
                'estimated_days' => '2-4 hari',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'J&T Express',
                'code' => 'JNT_REG',
                'description' => 'Pengiriman reguler melalui J&T Express.',
                'cost' => 14000,
                'estimated_days' => '2-4 hari',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'SiCepat REG',
                'code' => 'SICEPAT_REG',
                'description' => 'Pengiriman reguler melalui SiCepat.',
                'cost' => 13000,
                'estimated_days' => '2-3 hari',
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'AnterAja Regular',
                'code' => 'ANTERAJA_REG',
                'description' => 'Pengiriman reguler melalui AnterAja.',
                'cost' => 12000,
                'estimated_days' => '2-4 hari',
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'name' => 'Instant Delivery',
                'code' => 'INSTANT',
                'description' => 'Pengiriman instan untuk wilayah yang tersedia.',
                'cost' => 25000,
                'estimated_days' => 'Hari yang sama',
                'is_active' => true,
                'sort_order' => 5,
            ],
            [
                'name' => 'Same Day Delivery',
                'code' => 'SAME_DAY',
                'description' => 'Pengiriman pada hari yang sama untuk wilayah tertentu.',
                'cost' => 20000,
                'estimated_days' => '1 hari',
                'is_active' => true,
                'sort_order' => 6,
            ],
        ];

        foreach ($shippingMethods as $shippingMethod) {
            ShippingMethod::create($shippingMethod);
        }
    }
}