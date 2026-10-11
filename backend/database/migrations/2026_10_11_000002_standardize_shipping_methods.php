<?php

use App\Models\ShippingMethod;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (
            ! DB::table('shipping_methods')->where('code', 'GOSEND')->exists()
            && DB::table('shipping_methods')->where('code', 'INSTANT')->exists()
        ) {
            DB::table('shipping_methods')
                ->where('code', 'INSTANT')
                ->update([
                    'code' => 'GOSEND',
                    'name' => 'GoSend',
                    'description' => 'Pengiriman GoSend untuk wilayah Malang Raya.',
                    'sort_order' => 1,
                    'updated_at' => now(),
                ]);
        }

        $methods = [
            [
                'name' => 'GoSend',
                'code' => 'GOSEND',
                'description' => 'Pengiriman GoSend untuk wilayah Malang Raya.',
                'cost' => 25000,
                'estimated_days' => 'Hari yang sama',
                'sort_order' => 1,
            ],
            [
                'name' => 'J&T Express',
                'code' => 'JNT_REG',
                'description' => 'Untuk tujuan di Pulau Jawa di luar Malang Raya.',
                'cost' => 14000,
                'estimated_days' => '2-4 hari',
                'sort_order' => 2,
            ],
            [
                'name' => 'Lion Parcel',
                'code' => 'LION_PARCEL',
                'description' => 'Pengiriman untuk tujuan di luar Pulau Jawa.',
                'cost' => 30000,
                'estimated_days' => '3-5 hari',
                'sort_order' => 3,
            ],
        ];

        foreach ($methods as $method) {
            $existing = DB::table('shipping_methods')
                ->where('code', $method['code'])
                ->first();

            if ($existing) {
                DB::table('shipping_methods')
                    ->where('id', $existing->id)
                    ->update([
                        'name' => $method['name'],
                        'description' => $method['description'],
                        'is_active' => true,
                        'sort_order' => $method['sort_order'],
                        'updated_at' => now(),
                    ]);
                continue;
            }

            DB::table('shipping_methods')->insert([
                ...$method,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        DB::table('shipping_methods')
            ->whereNotIn('code', ShippingMethod::SUPPORTED_CODES)
            ->update([
                'is_active' => false,
                'updated_at' => now(),
            ]);
    }

    public function down(): void
    {
        // Keep the normalized courier configuration and historical order references.
    }
};
