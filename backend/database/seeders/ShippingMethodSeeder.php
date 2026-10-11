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
                'name' => 'J&T Express',
                'code' => 'JNT_REG',
                'description' => 'Untuk tujuan di Pulau Jawa di luar Malang Raya.',
                'cost' => 14000,
                'estimated_days' => '2-4 hari',
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'GoSend',
                'code' => 'GOSEND',
                'description' => 'Pengiriman GoSend untuk wilayah Malang Raya.',
                'cost' => 25000,
                'estimated_days' => 'Hari yang sama',
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Lion Parcel',
                'code' => 'LION_PARCEL',
                'description' => 'Pengiriman untuk tujuan di luar Pulau Jawa.',
                'cost' => 30000,
                'estimated_days' => '3-5 hari',
                'is_active' => true,
                'sort_order' => 7,
            ],
        ];

        foreach ($shippingMethods as $shippingMethod) {
            ShippingMethod::firstOrCreate(
                ['code' => $shippingMethod['code']],
                $shippingMethod
            );
        }
    }
}