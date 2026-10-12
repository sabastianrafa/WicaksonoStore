<?php

namespace App\Console\Commands;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ExpireUnpaidOrders extends Command
{
    protected $signature = 'orders:expire-unpaid';

    protected $description = 'Cancel pending orders unpaid for 24 hours and restore inventory';

    public function handle(): int
    {
        Order::query()
            ->where('order_status', OrderStatus::PENDING->value)
            ->where('created_at', '<=', now()->subHours(24))
            ->whereHas('payment', fn ($query) => $query->where('status', PaymentStatus::PENDING->value))
            ->select('id')
            ->chunkById(100, function ($orders): void {
                foreach ($orders as $candidate) {
                    DB::transaction(function () use ($candidate): void {
                        $order = Order::query()->lockForUpdate()->with('payment', 'items')->find($candidate->id);
                        if (! $order
                            || $order->order_status !== OrderStatus::PENDING
                            || $order->payment?->status !== PaymentStatus::PENDING
                            || $order->created_at->gt(now()->subHours(24))) {
                            return;
                        }

                        foreach ($order->items as $item) {
                            if (! $item->product_id) {
                                continue;
                            }

                            $product = Product::query()->lockForUpdate()->find($item->product_id);
                            if ($product) {
                                $product->increment('stock', $item->quantity);
                                $product->decrement('sold', min($product->sold, $item->quantity));
                            }
                        }

                        $order->update([
                            'order_status' => OrderStatus::CANCELLED,
                            'cancelled_at' => now(),
                        ]);
                        $order->payment->update([
                            'status' => PaymentStatus::REJECTED,
                            'notes' => 'Pesanan dibatalkan otomatis karena pembayaran tidak diterima dalam 24 jam.',
                        ]);
                    });
                }
            });

        return self::SUCCESS;
    }
}
