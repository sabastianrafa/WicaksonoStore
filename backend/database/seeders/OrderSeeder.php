<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\Order;
use App\Models\ShippingMethod;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class OrderSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('role', 'user')
            ->with('addresses')
            ->get();

        $shippingMethods = ShippingMethod::where('is_active', true)->get();

        if ($users->isEmpty() || $shippingMethods->isEmpty()) {
            return;
        }

        $statuses = [
            'pending',
            'confirmed',
            'processing',
            'shipped',
            'completed',
        ];

        foreach ($users as $user) {
            $address = $user->addresses->first();

            if (!$address) {
                continue;
            }

            $shippingMethod = $shippingMethods->random();

            $subtotal = rand(2, 8) * 25000;
            $shippingCost = (float) $shippingMethod->cost;
            $total = $subtotal + $shippingCost;

            $status = $statuses[array_rand($statuses)];

            $createdAt = now()->subDays(rand(1, 30));

            $data = [
                'user_id' => $user->id,
                'address_id' => $address->id,
                'shipping_method_id' => $shippingMethod->id,

                'order_number' => 'WKS-' . strtoupper(
                    Str::random(10)
                ),

                'subtotal' => $subtotal,
                'shipping_cost' => $shippingCost,
                'total' => $total,

                'shipping_name' => $address->name,
                'shipping_phone' => $address->phone,
                'shipping_province' => $address->province,
                'shipping_city' => $address->city,
                'shipping_postal_code' => $address->postal_code,
                'shipping_address' => $address->address,

                'order_status' => $status,

                'notes' => null,

                'confirmed_at' => null,
                'shipped_at' => null,
                'completed_at' => null,
                'cancelled_at' => null,

                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ];

            // Atur timestamp berdasarkan status order.
            if (in_array($status, [
                'confirmed',
                'processing',
                'shipped',
                'completed',
            ])) {
                $data['confirmed_at'] = $createdAt->copy()->addHours(2);
            }

            if (in_array($status, [
                'shipped',
                'completed',
            ])) {
                $data['shipped_at'] = $createdAt->copy()->addDays(1);
            }

            if ($status === 'completed') {
                $data['completed_at'] = $createdAt->copy()->addDays(3);
            }

            Order::create($data);
        }
    }
}