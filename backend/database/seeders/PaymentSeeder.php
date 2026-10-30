<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentMethod;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    public function run(): void
    {
        $orders = Order::all();
        $paymentMethod = PaymentMethod::query()->where('code', 'midtrans')->first();

        if (! $paymentMethod) {
            return;
        }

        foreach ($orders as $order) {
            // Status contoh mengikuti status order; pembayaran baru tetap melalui Midtrans Snap.
            if ($order->order_status === 'pending') {
                $status = 'pending';
            } elseif ($order->order_status === 'cancelled') {
                $status = 'rejected';
            } else {
                $status = 'paid';
            }

            Payment::firstOrCreate(
                ['order_id' => $order->id],
                [
                    'method' => 'midtrans',
                    'payment_method_name' => $paymentMethod->name,
                    'payment_method_type' => $paymentMethod->type,
                    'payment_method_description' => $paymentMethod->description,
                    'amount' => $order->total,
                    'status' => $status,
                    'proof' => null,
                    'notes' => $status === 'rejected' ? 'Pesanan dibatalkan.' : null,
                    'verified_by' => null,
                    'verified_at' => $status === 'paid'
                        ? $order->created_at->copy()->addHours(3)
                        : null,
                ]
            );
        }
    }
}
