<?php

namespace Database\Seeders;

use App\Models\Cart;
use App\Models\User;
use Illuminate\Database\Seeder;

class CartSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('role', 'user')->get();

        foreach ($users as $user) {
            Cart::create([
                'user_id' => $user->id,
            ]);
        }
    }
}