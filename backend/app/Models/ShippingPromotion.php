<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShippingPromotion extends Model
{
    protected $fillable = [
        'id',
        'is_active',
        'minimum_purchase',
        'area_codes',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'minimum_purchase' => 'decimal:2',
            'area_codes' => 'array',
        ];
    }
}
