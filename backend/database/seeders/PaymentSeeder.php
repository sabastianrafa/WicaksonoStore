<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        $orders = Order::all();

        $admin = User::where('role', 'admin')->first();

        foreach ($orders as $order) {
            $method = collect([
                'transfer_bank',
                'gopay',
                'ovo',
                'dana',
                'cod',
            ])->random();

            // Status payment disesuaikan dengan status order.
            if ($order->order_status === 'pending') {
                $status = 'pending';
            } elseif ($order->order_status === 'cancelled') {
                $status = 'rejected';
            } else {
                $status = 'paid';
            }

            Payment::create([
                'order_id' => $order->id,

                'method' => $method,

                'amount' => $order->total,

                'status' => $status,

                'proof' => $status === 'paid' && $method !== 'cod'
                    ? 'payments/payment-' . $order->id . '.jpg'
                    : null,

                'notes' => $status === 'rejected'
                    ? 'Pembayaran ditolak.'
                    : null,

                'verified_by' => $status === 'paid' && $method !== 'cod'
                    ? $admin?->id
                    : null,

                'verified_at' => $status === 'paid' && $method !== 'cod'
                    ? $order->created_at->copy()->addHours(3)
                    : null,
            ]);
        }
    }
}