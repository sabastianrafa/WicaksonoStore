<?php

namespace Database\Seeders;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Database\Seeder;

class CartItemSeeder extends Seeder
{
    public function run(): void
    {
        $carts = Cart::with('user')->get();
        $products = Product::where('is_active', true)->get();

        if ($products->isEmpty()) {
            return;
        }

        foreach ($carts as $cart) {
            // Setiap cart mendapatkan 2 produk berbeda
            $cartProducts = $products->shuffle()->take(2);

            foreach ($cartProducts as $product) {
                CartItem::create([
                    'cart_id' => $cart->id,
                    'product_id' => $product->id,
                    'quantity' => rand(1, 3),
                ]);
            }
        }
    }
}