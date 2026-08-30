<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Review;
use Illuminate\Database\Seeder;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        $orders = Order::with([
            'items.product',
        ])
            ->where('order_status', 'completed')
            ->get();

        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                // Pastikan product masih ada.
                if (!$item->product) {
                    continue;
                }

                // Tidak semua produk harus diberi review.
                if (rand(0, 1) === 0) {
                    continue;
                }

                Review::create([
                    'user_id' => $order->user_id,
                    'product_id' => $item->product_id,
                    'order_id' => $order->id,
                    'rating' => rand(4, 5),
                    'comment' => $this->randomComment(),
                ]);
            }
        }
    }

    private function randomComment(): string
    {
        $comments = [
            'Produknya bagus dan sesuai dengan deskripsi.',
            'Rasanya enak dan kualitasnya bagus.',
            'Packing rapi dan produknya sampai dengan aman.',
            'Cocok untuk oleh-oleh. Recommended!',
            'Produknya berkualitas dan pengiriman cepat.',
            'Sangat puas dengan produknya.',
            'Barang sesuai pesanan dan kualitasnya bagus.',
        ];

        return $comments[array_rand($comments)];
    }
}