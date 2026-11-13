<?php

namespace App\Models\Marketing;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderAttribution extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'utm_source',
        'utm_medium',
        'utm_campaign',
        'utm_content',
        'utm_term',
        'referrer_url',
        'landing_page',
        'fbclid',
        'gclid',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}

