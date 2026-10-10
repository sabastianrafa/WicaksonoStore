<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('addresses', function (Blueprint $table) {
            $table->string('province_code', 20)->nullable()->after('province');
            $table->string('regency_code', 20)->nullable()->after('province_code');
            $table->string('district', 255)->nullable()->after('city');
            $table->string('district_code', 20)->nullable()->after('district');
            $table->string('village', 255)->nullable()->after('district_code');
            $table->string('village_code', 20)->nullable()->after('village');
            $table->string('rt', 3)->nullable()->after('postal_code');
            $table->string('rw', 3)->nullable()->after('rt');
            $table->string('neighborhood')->nullable()->after('rw');
            $table->string('landmark')->nullable()->after('neighborhood');
        });
    }

    public function down(): void
    {
        Schema::table('addresses', function (Blueprint $table) {
            $table->dropColumn([
                'province_code',
                'regency_code',
                'district',
                'district_code',
                'village',
                'village_code',
                'rt',
                'rw',
                'neighborhood',
                'landmark',
            ]);
        });
    }
};
