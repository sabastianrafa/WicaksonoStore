<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id',
        'path',
        'alt_text',
        'is_primary',
        'sort_order',
    ];

    protected $casts = [
        'is_primary' => 'boolean',
        'sort_order' => 'integer',
    ];

    protected $appends = [
        'url',
    ];

    /**
     * Product pemilik gambar.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(
            Product::class
        );
    }

    /**
     * URL gambar yang bisa digunakan React.
     */
    public function getUrlAttribute(): string
    {
        if (!$this->path) {
            return '';
        }

        if (
            str_starts_with($this->path, 'http://') ||
            str_starts_with($this->path, 'https://')
        ) {
            return $this->path;
        }

        return asset('storage/' . $this->path);
    }
}
