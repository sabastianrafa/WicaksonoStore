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
        return $query->where(function (Builder $query) {
            $query->where(function (Builder $query) {
                $query->where('type', self::TYPE_BANK)
                    ->whereNotNull('account_number')
                    ->where('account_number', '<>', '')
                    ->whereNotNull('account_name')
                    ->where('account_name', '<>', '');
            })->orWhere(function (Builder $query) {
                $query->where('type', self::TYPE_QRIS)
                    ->whereNotNull('qris_image')
                    ->where('qris_image', '<>', '');
            });
        });
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