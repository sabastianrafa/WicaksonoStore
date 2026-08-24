<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Admin Wicaksono',
            'email' => 'admin@wicaksono.test',
            'phone' => '081234567890',
            'role' => 'admin',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
        ]);

        User::create([
            'name' => 'Bastian User',
            'email' => 'user@wicaksono.test',
            'phone' => '081234567891',
            'role' => 'user',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
        ]);

        User::create([
            'name' => 'Andi Pratama',
            'email' => 'andi@wicaksono.test',
            'phone' => '081234567892',
            'role' => 'user',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
        ]);

        User::create([
            'name' => 'Siti Rahma',
            'email' => 'siti@wicaksono.test',
            'phone' => '081234567893',
            'role' => 'user',
            'email_verified_at' => now(),
            'password' => Hash::make('password123'),
        ]);
    }
}