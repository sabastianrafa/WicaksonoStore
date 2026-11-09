<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MidtransTransaction extends Model
{
    protected $fillable = [
        'payment_id',
        'midtrans_order_id',
        'transaction_id',
        'snap_token',
        'status',
        'gross_amount',
        'payment_type',
    ];

    protected function casts(): array
    {
        return [
            'gross_amount' => 'decimal:2',
        ];
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }
}