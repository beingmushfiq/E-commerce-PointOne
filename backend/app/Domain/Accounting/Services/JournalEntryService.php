<?php

namespace App\Domain\Accounting\Services;

use App\Domain\Accounting\Exceptions\ClosedFiscalPeriodException;
use App\Domain\Accounting\Exceptions\ImmutableJournalEntryException;
use App\Domain\Accounting\Exceptions\UnbalancedJournalEntryException;
use App\Models\Accounting\FiscalPeriod;
use App\Models\Accounting\JournalEntry;
use App\Models\Accounting\JournalEntryLine;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class JournalEntryService
{
    /**
     * Create a double-entry journal entry with strict balance and fiscal period validation.
     *
     * @param array{
     *     entry_date?: string,
     *     entry_number?: string,
     *     fiscal_period_id?: int|null,
     *     source_type?: string,
     *     source_id?: int|null,
     *     description: string,
     *     created_by_user_id?: int|null
     * } $header
     * @param array<int, array{
     *     account_id: int,
     *     debit?: float|int|string,
     *     credit?: float|int|string,
     *     description?: string|null
     * }> $lines
     *
     * @throws UnbalancedJournalEntryException
     * @throws ClosedFiscalPeriodException
     */
    public function createEntry(array $header, array $lines, bool $post = true): JournalEntry
    {
        if (count($lines) < 2) {
            throw new UnbalancedJournalEntryException(
                "A journal entry must contain at least two account lines (one debit, one credit)."
            );
        }

        // 1. Double-Entry Balance Verification (integer cents to eliminate floating-point error)
        $totalDebitsCents = 0;
        $totalCreditsCents = 0;

        foreach ($lines as $line) {
            $debit = (float) ($line['debit'] ?? 0.0);
            $credit = (float) ($line['credit'] ?? 0.0);

            $totalDebitsCents += (int) round($debit * 100);
            $totalCreditsCents += (int) round($credit * 100);
        }

        if ($totalDebitsCents !== $totalCreditsCents || $totalDebitsCents <= 0) {
            throw new UnbalancedJournalEntryException(
                "Journal entry is unbalanced. Sum of debits must strictly equal sum of credits.",
                totalDebits: $totalDebitsCents / 100,
                totalCredits: $totalCreditsCents / 100
            );
        }

        // 2. Fiscal Period Validation
        $entryDate = $header['entry_date'] ?? now()->toDateString();
        $fiscalPeriod = null;

        if (!empty($header['fiscal_period_id'])) {
            $fiscalPeriod = FiscalPeriod::find($header['fiscal_period_id']);
        } else {
            $fiscalPeriod = FiscalPeriod::where('start_date', '<=', $entryDate)
                ->where('end_date', '>=', $entryDate)
                ->first();
        }

        if ($fiscalPeriod && !$fiscalPeriod->isOpen()) {
            throw new ClosedFiscalPeriodException(
                "Cannot post journal entry: Fiscal period [{$fiscalPeriod->name}] is closed."
            );
        }

        // 3. Atomically Record Journal Entry and Lines
        return DB::transaction(function () use ($header, $lines, $entryDate, $fiscalPeriod, $post) {
            $entryNumber = $header['entry_number'] ?? $this->generateEntryNumber($entryDate);

            $entry = JournalEntry::create([
                'entry_number'       => $entryNumber,
                'fiscal_period_id'   => $fiscalPeriod?->id,
                'entry_date'         => $entryDate,
                'source_type'        => $header['source_type'] ?? 'manual',
                'source_id'          => $header['source_id'] ?? null,
                'description'        => $header['description'],
                'status'             => $post ? 'posted' : 'draft',
                'created_by_user_id' => $header['created_by_user_id'] ?? null,
                'posted_at'          => $post ? now() : null,
            ]);

            foreach ($lines as $line) {
                JournalEntryLine::create([
                    'journal_entry_id' => $entry->id,
                    'account_id'       => $line['account_id'],
                    'debit'            => (float) ($line['debit'] ?? 0.0),
                    'credit'           => (float) ($line['credit'] ?? 0.0),
                    'description'      => $line['description'] ?? null,
                ]);
            }

            return $entry->load(['lines.account', 'fiscalPeriod']);
        });
    }

    /**
     * Create an immutable reversal journal entry for an existing posted entry.
     *
     * @throws ImmutableJournalEntryException
     * @throws ClosedFiscalPeriodException
     */
    public function reverseEntry(JournalEntry $entry, string $reason, ?int $userId = null): JournalEntry
    {
        if ($entry->status === 'reversed' || $entry->reversed_by_id !== null) {
            throw new ImmutableJournalEntryException(
                "Journal entry #{$entry->entry_number} has already been reversed."
            );
        }

        $entry->loadMissing('lines');
        $reversalLines = [];

        foreach ($entry->lines as $line) {
            // Strictly invert debits and credits
            $reversalLines[] = [
                'account_id'  => $line->account_id,
                'debit'       => (float) $line->credit,
                'credit'      => (float) $line->debit,
                'description' => "Reversal of line #{$line->id}: {$line->description}",
            ];
        }

        return DB::transaction(function () use ($entry, $reversalLines, $reason, $userId) {
            $reversalDate = now()->toDateString();
            $reversalEntryNumber = 'REV-' . $entry->entry_number;

            // In case of conflict, append random suffix
            if (JournalEntry::where('entry_number', $reversalEntryNumber)->exists()) {
                $reversalEntryNumber .= '-' . strtoupper(Str::random(4));
            }

            $reversalEntry = $this->createEntry([
                'entry_number'       => $reversalEntryNumber,
                'fiscal_period_id'   => $entry->fiscal_period_id,
                'entry_date'         => $reversalDate,
                'source_type'        => 'reversal',
                'source_id'          => $entry->id,
                'description'        => "Reversal of {$entry->entry_number}: {$reason}",
                'created_by_user_id' => $userId,
            ], $reversalLines, post: true);

            // Mark original entry as reversed
            $entry->update([
                'status'         => 'reversed',
                'reversed_by_id' => $reversalEntry->id,
            ]);

            return $reversalEntry;
        });
    }

    /**
     * Generate an audit-compliant, unique journal entry sequence number.
     */
    protected function generateEntryNumber(string $entryDate): string
    {
        $ym = date('Ym', strtotime($entryDate));
        $count = JournalEntry::where('entry_number', 'like', "JE-{$ym}-%")->count() + 1;
        $candidate = sprintf('JE-%s-%05d', $ym, $count);

        while (JournalEntry::where('entry_number', $candidate)->exists()) {
            $count++;
            $candidate = sprintf('JE-%s-%05d', $ym, $count);
        }

        return $candidate;
    }
}

