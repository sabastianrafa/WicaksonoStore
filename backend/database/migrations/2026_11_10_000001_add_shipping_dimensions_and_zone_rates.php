<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->decimal('length', 10, 2)->default(0);
            $table->decimal('width', 10, 2)->default(0);
            $table->decimal('height', 10, 2)->default(0);
        });

        Schema::create('shipping_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shipping_method_id')->constrained()->cascadeOnDelete();
            $table->string('area_code')->default('*');
            $table->enum('service_type', ['reguler', 'cargo']);
            $table->decimal('cost_per_kg', 15, 2);
            $table->timestamps();
            $table->unique(['shipping_method_id', 'area_code', 'service_type'], 'shipping_rates_unique_zone');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('shipping_service_type')->default('reguler');
        });
    }

    public function down(): void
    {
        Schema::table('orders', fn (Blueprint $table) => $table->dropColumn('shipping_service_type'));
        Schema::dropIfExists('shipping_rates');
        Schema::table('products', fn (Blueprint $table) => $table->dropColumn(['length', 'width', 'height']));
    }
};
