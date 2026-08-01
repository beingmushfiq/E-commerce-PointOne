<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Warehouse extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code', 'address', 'city', 'country', 'is_active'];

    public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class);
    }
}
