<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('payment_method_name')->nullable();
            $table->string('payment_method_type', 20)->nullable();
            $table->string('payment_account_number')->nullable();
            $table->string('payment_account_name')->nullable();
            $table->string('payment_qris_image')->nullable();
            $table->text('payment_method_description')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn([
                'payment_method_name',
                'payment_method_type',
                'payment_account_number',
                'payment_account_name',
                'payment_qris_image',
                'payment_method_description',
            ]);
        });
    }
};
