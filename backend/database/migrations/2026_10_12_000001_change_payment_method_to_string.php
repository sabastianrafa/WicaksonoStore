<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('method')->change();
        });
    }

    public function down(): void
    {
        // Keep this column flexible when rolling back other migrations;
        // payment method codes are managed dynamically by administrators.
    }
};
