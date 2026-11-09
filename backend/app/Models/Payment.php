<?php

namespace App\Models;

use App\Enums\PaymentStatus;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    protected $fillable = [
        'order_id',
        'method',
        'payment_method_name',
        'payment_method_type',
        'payment_account_number',
        'payment_account_name',
        'payment_qris_image',
        'payment_method_description',
        'amount',
        'status',
        'proof',
        'notes',
        'verified_by',
        'verified_at',
        'midtrans_transaction_id',
        'midtrans_transaction_status',
        'midtrans_payment_type',
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

    public function midtransTransactions(): HasMany
    {
        return $this->hasMany(MidtransTransaction::class);
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
