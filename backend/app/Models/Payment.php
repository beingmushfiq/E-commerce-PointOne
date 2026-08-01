<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = ['order_id', 'payment_method', 'transaction_id', 'amount', 'status', 'payload'];

    protected $casts = [
        'amount' => 'decimal:2',
        'payload' => 'array',
    ];
}
