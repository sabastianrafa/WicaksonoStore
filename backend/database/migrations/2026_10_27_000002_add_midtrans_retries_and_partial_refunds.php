<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('midtrans_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->string('midtrans_order_id')->unique();
            $table->string('transaction_id')->nullable()->index();
            $table->text('snap_token')->nullable();
            $table->string('status')->default('created');
            $table->decimal('gross_amount', 15, 2);
            $table->string('payment_type')->nullable();
            $table->timestamps();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->enum('status', ['pending', 'paid', 'rejected', 'refunded', 'partially_refunded'])
                ->default('pending')
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->enum('status', ['pending', 'paid', 'rejected', 'refunded'])
                ->default('pending')
                ->change();
        });

        Schema::dropIfExists('midtrans_transactions');
    }
};
