<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ShippingMethod extends Model
{
    use HasFactory;

    public const SUPPORTED_CODES = ['GOSEND', 'JNT_REG', 'LION_PARCEL'];

    protected $fillable = [
        'name',
        'code',
        'description',
        'cost',
        'estimated_days',
        'is_active',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'cost' => 'decimal:2',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ];
    }
}