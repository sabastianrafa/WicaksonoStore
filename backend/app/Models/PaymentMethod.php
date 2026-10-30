<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class PaymentMethod extends Model
{
    public const TYPE_BANK = 'bank';

    public const TYPE_QRIS = 'qris';
    public const TYPE_GATEWAY = 'gateway';

    protected $fillable = [
        'name',
        'code',
        'type',
        'account_number',
        'account_name',
        'qris_image',
        'description',
        'icon',
        'requires_proof',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'requires_proof' => 'boolean',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    protected $appends = [
        'qris_image_url',
        'is_ready',
    ];

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class, 'method', 'code');
    }

    public function isQris(): bool
    {
        return $this->type === self::TYPE_QRIS;
    }

    public function isConfigured(): bool
    {
        if ($this->type === self::TYPE_GATEWAY && $this->code === 'midtrans') {
            return filled(config('services.midtrans.server_key'))
                && filled(config('services.midtrans.client_key'));
        }

        return $this->isQris()
            ? filled($this->qris_image)
            : filled($this->account_number) && filled($this->account_name);
    }

    public function getIsReadyAttribute(): bool
    {
        return $this->isConfigured();
    }

    public function scopeConfigured(Builder $query): Builder
    {
        $gatewayConfigured = filled(config('services.midtrans.server_key'))
            && filled(config('services.midtrans.client_key'));

        return $query->where('type', self::TYPE_GATEWAY)
            ->where('code', 'midtrans')
            ->when(! $gatewayConfigured, fn (Builder $query) => $query->whereRaw('1 = 0'));
    }

    public function getQrisImageUrlAttribute(): ?string
    {
        if (!$this->qris_image) {
            return null;
        }

        if (str_starts_with($this->qris_image, 'http://') || str_starts_with($this->qris_image, 'https://')) {
            return $this->qris_image;
        }

        /*
        | asset() memakai host yang terkunci di APP_URL, yang di develop
        | sering tidak sama dengan host frontend (mis. 127.0.0.1:5173).
        | URL relatif lebih aman karena frontend knows BACKEND_URL-nya.
        */
        return '/storage/' . ltrim($this->qris_image, '/');
    }

    /**
     * Hapus file QRIS lama. Dipanggil controller saat gambar diganti
     * atau saat metode dihapus.
     */
    public function deleteQrisImage(): void
    {
        if ($this->qris_image) {
            Storage::disk('public')->delete($this->qris_image);
            $this->qris_image = null;
        }
    }
}
