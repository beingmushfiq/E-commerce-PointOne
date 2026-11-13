<?php

namespace App\Models\Marketing;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MarketingEvent extends Model
{
    use HasFactory;

    protected $fillable = [
        'event_id',
        'event_name',
        'user_id',
        'order_id',
        'session_id',
        'event_source',
        'user_data',
        'custom_data',
        'status',
        'error_message',
        'dispatched_at',
    ];

    protected $casts = [
        'user_data'     => 'array',
        'custom_data'   => 'array',
        'dispatched_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}

