<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Shipment extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'courier_name',
        'consignment_id',
        'tracking_code',
        'status',
        'cod_amount',
        'shipping_cost',
        'label_url',
        'pickup_address',
        'delivery_address',
        'courier_response',
    ];

    protected $casts = [
        'cod_amount' => 'decimal:2',
        'shipping_cost' => 'decimal:2',
        'pickup_address' => 'array',
        'delivery_address' => 'array',
        'courier_response' => 'array',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}

