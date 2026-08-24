<?php

namespace App\Models;

use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Payment extends Model
{
    use HasFactory;

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
            'method' => PaymentMethod::class,
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
