<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('label');
            $table->string('name');
            $table->string('phone', 20);
            $table->string('province');
            $table->string('province_code', 20)->nullable();
            $table->string('city');
            $table->string('regency_code', 20)->nullable();
            $table->string('district', 255)->nullable();
            $table->string('district_code', 20)->nullable();
            $table->string('village', 255)->nullable();
            $table->string('village_code', 20)->nullable();
            $table->string('postal_code', 10);
            $table->string('rt', 3)->nullable();
            $table->string('rw', 3)->nullable();
            $table->string('neighborhood')->nullable();
            $table->string('landmark')->nullable();
            $table->text('address');
            $table->boolean('is_default')->default(false);
            $table->timestamps();
            $table->index(['user_id', 'is_default']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('addresses');
    }
};
