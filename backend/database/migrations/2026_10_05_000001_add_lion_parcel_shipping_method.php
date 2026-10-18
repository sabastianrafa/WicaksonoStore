<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('shipping_methods')->where('code', 'LION_PARCEL')->exists()) {
            return;
        }

        DB::table('shipping_methods')->insert([
            'name' => 'Lion Parcel',
            'code' => 'LION_PARCEL',
            'description' => 'Pengiriman ke luar Pulau Jawa.',
            'cost' => 30000,
            'estimated_days' => '3-5 hari',
            'is_active' => true,
            'sort_order' => 7,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        // Keep the rate record so a rollback does not erase admin configuration.
    }
};