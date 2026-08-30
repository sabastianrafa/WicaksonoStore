<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->unique()
                ->constrained()
                ->cascadeOnDelete();

            $table->enum('method', [
                'transfer_bank',
                'gopay',
                'ovo',
                'dana',
                'cod',
            ]);

            $table->decimal('amount', 15, 2);

            $table->enum('status', [
                'pending',
                'paid',
                'rejected',
            ])->default('pending');

            $table->string('proof')
                ->nullable();

            $table->text('notes')
                ->nullable();

            $table->foreignId('verified_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('verified_at')
                ->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};