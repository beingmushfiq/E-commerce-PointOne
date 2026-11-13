<?php

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class TenantDatabaseConfig extends Model
{
    protected $connection = 'central';

    protected $fillable = [
        'tenant_id',
        'driver',
        'host',
        'port',
        'database_name',
        'username',
        'encrypted_password',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function setEncryptedPasswordAttribute(string $value): void
    {
        $this->attributes['encrypted_password'] = Crypt::encryptString($value);
    }

    public function getDecryptedPassword(): string
    {
        try {
            return Crypt::decryptString($this->encrypted_password);
        } catch (\Exception) {
            return '';
        }
    }
}

