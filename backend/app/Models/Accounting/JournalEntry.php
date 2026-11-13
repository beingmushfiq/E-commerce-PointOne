<?php

namespace App\Models\Accounting;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class JournalEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'entry_number',
        'fiscal_period_id',
        'entry_date',
        'source_type',
        'source_id',
        'description',
        'status', // draft, posted, reversed
        'reversed_by_id',
        'created_by_user_id',
        'posted_at',
    ];

    protected $casts = [
        'entry_date' => 'date',
        'posted_at'  => 'datetime',
    ];

    public function fiscalPeriod(): BelongsTo
    {
        return $this->belongsTo(FiscalPeriod::class);
    }

    public function lines(): HasMany
    {
        return $this->hasMany(JournalEntryLine::class);
    }

    public function reversedBy(): BelongsTo
    {
        return $this->belongsTo(self::class, 'reversed_by_id');
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function getTotalDebit(): float
    {
        return (float) $this->lines->sum('debit');
    }

    public function getTotalCredit(): float
    {
        return (float) $this->lines->sum('credit');
    }

    /**
     * Verify the double-entry fundamental invariant: Sum(Debits) == Sum(Credits)
     */
    public function isBalanced(): bool
    {
        $debitCents = (int) round($this->getTotalDebit() * 100);
        $creditCents = (int) round($this->getTotalCredit() * 100);

        return $debitCents === $creditCents && $debitCents > 0;
    }
}
