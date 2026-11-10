<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShippingRate extends Model
{
    protected $fillable = ['shipping_method_id', 'area_code', 'service_type', 'cost_per_kg'];

    protected function casts(): array
    {
        return ['cost_per_kg' => 'decimal:2'];
    }

    public function method(): BelongsTo
    {
        return $this->belongsTo(ShippingMethod::class, 'shipping_method_id');
    }
}
