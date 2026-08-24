<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\User;
use App\Models\Wishlist;
use Illuminate\Database\Seeder;

class WishlistSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('role', 'user')->get();
        $products = Product::where('is_active', true)->get();

        if ($users->isEmpty() || $products->isEmpty()) {
            return;
        }

        foreach ($users as $user) {
            // Setiap user mendapatkan 2-4 wishlist.
            $wishlistProducts = $products
                ->shuffle()
                ->take(rand(2, min(4, $products->count())));

            foreach ($wishlistProducts as $product) {
                Wishlist::create([
                    'user_id' => $user->id,
                    'product_id' => $product->id,
                ]);
            }
        }
    }
}