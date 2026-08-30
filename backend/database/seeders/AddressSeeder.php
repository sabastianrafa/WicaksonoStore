<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Seeder;

class AddressSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::where('role', 'user')->get();

        foreach ($users as $user) {
            Address::create([
                'user_id' => $user->id,
                'label' => 'Rumah',
                'name' => $user->name,
                'phone' => $user->phone ?? '081234567890',
                'province' => 'Jawa Timur',
                'city' => 'Malang',
                'postal_code' => '65145',
                'address' => 'Jl. Contoh No. 123, Kota Malang, Jawa Timur',
                'is_default' => true,
            ]);
        }
    }
}