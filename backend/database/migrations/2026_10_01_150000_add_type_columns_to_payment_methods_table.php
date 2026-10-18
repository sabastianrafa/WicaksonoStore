<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        /*
        | Form metode pembayaran dibedakan dua jenis:
        | - bank  : pembeli transfer ke rekening, jadi butuh nomor rekening.
        | - qris  : pembeli scan QR, jadi admin mengunggah gambar QR-nya.
        */
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->string('type')
                ->default('bank')
                ->after('code');

            $table->string('account_number')
                ->nullable()
                ->after('type');

            $table->string('account_name')
                ->nullable()
                ->after('account_number');

            $table->string('qris_image')
                ->nullable()
                ->after('account_name');
        });
    }

    public function down(): void
    {
        Schema::table('payment_methods', function (Blueprint $table) {
            $table->dropColumn(['type', 'account_number', 'account_name', 'qris_image']);
        });
    }
};