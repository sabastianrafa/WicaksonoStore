<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('midtrans_transaction_id')->nullable()->index();
            $table->string('midtrans_transaction_status')->nullable();
            $table->string('midtrans_payment_type')->nullable();
            $table->enum('status', ['pending', 'paid', 'rejected', 'refunded'])
                ->default('pending')
                ->change();
        });

        DB::table('payment_methods')->updateOrInsert(
            ['code' => 'midtrans'],
            [
                'name' => 'Midtrans',
                'type' => 'gateway',
                'description' => 'Pembayaran online melalui Midtrans Snap.',
                'icon' => '💳',
                'requires_proof' => false,
                'is_active' => true,
                'sort_order' => 6,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('payment_methods')->where('code', 'midtrans')->delete();

        Schema::table('payments', function (Blueprint $table) {
            $table->dropIndex(['midtrans_transaction_id']);
            $table->dropColumn([
                'midtrans_transaction_id',
                'midtrans_transaction_status',
                'midtrans_payment_type',
            ]);
            $table->enum('status', ['pending', 'paid', 'rejected'])
                ->default('pending')
                ->change();
        });
    }
};
