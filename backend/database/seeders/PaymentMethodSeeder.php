<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        /*
        | Kode sengaja huruf kecil dan sama persis dengan nilai yang sudah
        | tersimpan di kolom payments.method, supaya transaksi lama tetap
        | terhubung dengan metode pengayarannya.
        */
        $paymentMethods = [
            [
                'name' => 'Transfer Bank',
                'code' => 'transfer_bank',
                'type' => 'bank',
                'description' => 'BCA, Mandiri, BNI, BRI',
                'icon' => '🏦',
                'requires_proof' => true,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'GoPay',
                'code' => 'gopay',
                'type' => 'qris',
                'description' => 'Bayar via aplikasi Gojek',
                'icon' => '💚',
                'requires_proof' => true,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'OVO',
                'code' => 'ovo',
                'type' => 'qris',
                'description' => 'Bayar via OVO',
                'icon' => '💜',
                'requires_proof' => true,
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'DANA',
                'code' => 'dana',
                'type' => 'qris',
                'description' => 'Bayar via DANA',
                'icon' => '💙',
                'requires_proof' => true,
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'name' => 'Bayar di Tempat (COD)',
                'code' => 'cod',
                'type' => 'bank',
                'description' => 'Tersedia di area tertentu',
                'icon' => '💵',
                'requires_proof' => false,
                'is_active' => true,
                'sort_order' => 5,
            ],
        ];

        foreach ($paymentMethods as $paymentMethod) {
            PaymentMethod::updateOrCreate(
                ['code' => $paymentMethod['code']],
                $paymentMethod
            );
        }
    }
}