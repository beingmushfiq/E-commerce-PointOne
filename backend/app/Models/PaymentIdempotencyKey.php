<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentIdempotencyKey extends Model
{
    use HasFactory;

    protected $fillable = [
        'idempotency_key',
        'provider',
        'order_id',
        'status',
        'response_payload',
    ];

    protected $casts = [
        'response_payload' => 'array',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}

