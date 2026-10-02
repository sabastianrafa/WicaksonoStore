<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'method',
        'amount',
        'status',
        'proof',
        'notes',
        'verified_by',
        'verified_at',
    ];

    protected function casts(): array
    {
        return [
            // method sengaja tidak di-cast ke enum: nilainya sekarang
            // berasal dari tabel payment_methods dan bisa bertambah.
            'status' => PaymentStatus::class,
            'amount' => 'decimal:2',
            'verified_at' => 'datetime',
        ];
    }

    protected $appends = [
        'proof_url',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'method', 'code');
    }

    public function getProofUrlAttribute(): ?string
    {
        if (!$this->proof) {
            return null;
        }

        if (str_starts_with($this->proof, 'http://') || str_starts_with($this->proof, 'https://')) {
            return $this->proof;
        }

        return asset('storage/' . $this->proof);
    }
}