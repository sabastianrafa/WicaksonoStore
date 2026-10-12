<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('shipping_courier_code')->nullable()->after('shipping_method_id');
            $table->string('shipping_service_code')->nullable()->after('shipping_courier_code');
            $table->string('shipping_courier_name')->nullable()->after('shipping_service_code');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'shipping_courier_code',
                'shipping_service_code',
                'shipping_courier_name',
            ]);
        });
    }
};
