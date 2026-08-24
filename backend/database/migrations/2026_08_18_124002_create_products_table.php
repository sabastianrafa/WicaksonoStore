<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            $table->foreignId('category_id')
                ->constrained()
                ->restrictOnDelete();

            $table->string('name');
            $table->string('slug')->unique();

            $table->text('description')->nullable();

            $table->decimal('price', 15, 2);
            $table->decimal('original_price', 15, 2)
                ->nullable();

            $table->unsignedInteger('stock')
                ->default(0);

            $table->unsignedInteger('sold')
                ->default(0);

            $table->decimal('rating', 3, 2)
                ->default(0);

            $table->unsignedInteger('review_count')
                ->default(0);

            $table->unsignedInteger('discount')
                ->default(0);

            $table->string('image')->nullable();

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();

            $table->index(['category_id', 'is_active']);
            $table->index('price');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};