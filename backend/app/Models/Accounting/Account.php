<?php

namespace App\Models\Accounting;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Account extends Model
{
    use HasFactory;

    protected $table = 'chart_of_accounts';

    protected $fillable = [
        'code',
        'name',
        'type', // asset, liability, equity, revenue, expense
        'normal_balance', // debit, credit
        'parent_id',
        'description',
        'currency',
        'is_active',
        'is_system',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_system' => 'boolean',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    public function journalEntryLines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class, 'account_id');
    }

    /**
     * Compute current net balance respecting the account's normal balance type.
     */
    public function getBalance(?string $asOfDate = null): float
    {
        $query = $this->journalEntryLines()
            ->whereHas('journalEntry', function ($q) use ($asOfDate) {
                $q->where('status', 'posted');
                if ($asOfDate) {
                    $q->where('entry_date', '<=', $asOfDate);
                }
            });

        $totalDebit = (float) $query->sum('debit');
        $totalCredit = (float) $query->sum('credit');

        return $this->normal_balance === 'debit'
            ? ($totalDebit - $totalCredit)
            : ($totalCredit - $totalDebit);
    }
}
