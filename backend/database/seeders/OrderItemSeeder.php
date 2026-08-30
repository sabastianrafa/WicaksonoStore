<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Database\Seeder;

class OrderItemSeeder extends Seeder
{
    public function run(): void
    {
        $orders = Order::all();
        $products = Product::where('is_active', true)->get();

        if ($orders->isEmpty() || $products->isEmpty()) {
            return;
        }

        foreach ($orders as $order) {
            // Setiap order mendapatkan 2-3 produk berbeda.
            $orderProducts = $products
                ->shuffle()
                ->take(rand(2, min(3, $products->count())));

            $subtotal = 0;

            foreach ($orderProducts as $product) {
                $quantity = rand(1, 3);
                $price = (float) $product->price;
                $itemSubtotal = $price * $quantity;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'price' => $price,
                    'quantity' => $quantity,
                    'subtotal' => $itemSubtotal,
                ]);

                $subtotal += $itemSubtotal;
            }

            // Sinkronkan subtotal dan total order
            // berdasarkan item yang benar-benar dibeli.
            $order->update([
                'subtotal' => $subtotal,
                'total' => $subtotal + (float) $order->shipping_cost,
            ]);
        }
    }
}