<?php

namespace Database\Seeders;

use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentMethodSeeder extends Seeder
{
    public function run(): void
    {
        PaymentMethod::query()->where('code', '<>', 'midtrans')->update(['is_active' => false]);

        PaymentMethod::updateOrCreate(
            ['code' => 'midtrans'],
            [
                'name' => 'Midtrans',
                'type' => 'gateway',
                'account_number' => null,
                'account_name' => null,
                'qris_image' => null,
                'description' => 'Pembayaran melalui Virtual Account, QRIS, e-wallet, atau kartu via Midtrans Snap.',
                'icon' => '💳',
                'requires_proof' => false,
                'is_active' => true,
                'sort_order' => 1,
            ]
        );
    }
}
