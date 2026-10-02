<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();

            $table->string('name');

            // Dipakai payments.method sebagai nilai string.
            $table->string('code')->unique();

            $table->text('description')->nullable();

            // Ikon emoji, maks 20 char seperti kolom category.icon.
            $table->string('icon')
                ->nullable();

            // Methods yang butuh bukti transfer (transfer bank, e-wallet)
            // bisa mewajibkan bukti sebelum bisa diverifikasi admin.
            $table->boolean('requires_proof')
                ->default(true);

            $table->boolean('is_active')
                ->default(true);

            $table->unsignedInteger('sort_order')
                ->default(0);

            $table->timestamps();
        });

        /*
        | payments.method sebelumnya kolom ENUM dengan 5 nilai hardcoded,
        | jadi metode baru tidak bisa disimpan. Diubah ke VARCHAR agar
        | nilainya berasal dari tabel payment_methods.
        */
        Schema::table('payments', function (Blueprint $table) {
            $table->string('method')
                ->change();
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->enum('method', [
                'transfer_bank',
                'gopay',
                'ovo',
                'dana',
                'cod',
            ])->change();
        });

        Schema::dropIfExists('payment_methods');
    }
};