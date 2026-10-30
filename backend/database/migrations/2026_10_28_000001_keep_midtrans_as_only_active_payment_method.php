<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('payment_methods')
            ->where('code', '<>', 'midtrans')
            ->update(['is_active' => false, 'updated_at' => now()]);

        DB::table('payment_methods')->updateOrInsert(
            ['code' => 'midtrans'],
            [
                'name' => 'Midtrans',
                'type' => 'gateway',
                'account_number' => null,
                'account_name' => null,
                'qris_image' => null,
                'description' => 'Pembayaran melalui Midtrans Snap.',
                'icon' => '💳',
                'requires_proof' => false,
                'is_active' => true,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        // Metode lama sengaja tidak diaktifkan otomatis saat rollback.
    }
};
