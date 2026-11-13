<?php

namespace App\Domain\Accounting\Services;

use App\Models\Accounting\Account;
use App\Models\Accounting\JournalEntryLine;

class FinancialReportService
{
    /**
     * Generate an authoritative Trial Balance proving Sum(Debits) == Sum(Credits).
     */
    public function getTrialBalance(?string $asOfDate = null): array
    {
        $asOfDate = $asOfDate ?? now()->toDateString();

        $accounts = Account::orderBy('code')->get();

        $reportLines = [];
        $totalDebits = 0.0;
        $totalCredits = 0.0;

        foreach ($accounts as $account) {
            $lineQuery = JournalEntryLine::where('account_id', $account->id)
                ->whereHas('journalEntry', function ($q) use ($asOfDate) {
                    $q->where('status', 'posted')
                        ->where('entry_date', '<=', $asOfDate);
                });

            $accountDebits = (float) $lineQuery->sum('debit');
            $accountCredits = (float) $lineQuery->sum('credit');

            $totalDebits += $accountDebits;
            $totalCredits += $accountCredits;

            $netBalance = $account->normal_balance === 'debit'
                ? ($accountDebits - $accountCredits)
                : ($accountCredits - $accountDebits);

            $reportLines[] = [
                'account_id'     => $account->id,
                'code'           => $account->code,
                'name'           => $account->name,
                'type'           => $account->type,
                'normal_balance' => $account->normal_balance,
                'total_debit'    => $accountDebits,
                'total_credit'   => $accountCredits,
                'net_balance'    => $netBalance,
            ];
        }

        $debitCents = (int) round($totalDebits * 100);
        $creditCents = (int) round($totalCredits * 100);
        $isBalanced = ($debitCents === $creditCents);

        return [
            'as_of_date'    => $asOfDate,
            'is_balanced'   => $isBalanced,
            'total_debits'  => round($totalDebits, 2),
            'total_credits' => round($totalCredits, 2),
            'accounts'      => $reportLines,
        ];
    }

    /**
     * Generate a Profit and Loss (Income Statement) report for a specific date range.
     */
    public function getProfitAndLoss(string $startDate, string $endDate): array
    {
        $revenueLines = [];
        $grossRevenue = 0.0;
        $totalDiscounts = 0.0;

        // 1. Process Revenue Accounts (4xxx)
        $revenueAccounts = Account::where('type', 'revenue')->orderBy('code')->get();
        foreach ($revenueAccounts as $account) {
            $lineQuery = JournalEntryLine::where('account_id', $account->id)
                ->whereHas('journalEntry', function ($q) use ($startDate, $endDate) {
                    $q->where('status', 'posted')
                        ->whereBetween('entry_date', [$startDate, $endDate]);
                });

            $debits = (float) $lineQuery->sum('debit');
            $credits = (float) $lineQuery->sum('credit');

            if ($account->normal_balance === 'debit') {
                // Contra-revenue (e.g. Sales Discounts/Returns)
                $amount = $debits - $credits;
                $totalDiscounts += $amount;
            } else {
                $amount = $credits - $debits;
                $grossRevenue += $amount;
            }

            $revenueLines[] = [
                'code'   => $account->code,
                'name'   => $account->name,
                'amount' => round($amount, 2),
            ];
        }

        $netRevenue = $grossRevenue - $totalDiscounts;

        // 2. Cost of Goods Sold (5010)
        $cogsAccount = Account::where('code', '5010')->first();
        $totalCogs = 0.0;
        if ($cogsAccount) {
            $cogsQuery = JournalEntryLine::where('account_id', $cogsAccount->id)
                ->whereHas('journalEntry', function ($q) use ($startDate, $endDate) {
                    $q->where('status', 'posted')
                        ->whereBetween('entry_date', [$startDate, $endDate]);
                });
            $totalCogs = (float) ($cogsQuery->sum('debit') - $cogsQuery->sum('credit'));
        }

        $grossProfit = $netRevenue - $totalCogs;

        // 3. Operating & Administrative Expenses (other expense accounts)
        $expenseAccounts = Account::where('type', 'expense')
            ->where('code', '!=', '5010')
            ->orderBy('code')
            ->get();

        $expenseLines = [];
        $totalExpenses = 0.0;
        foreach ($expenseAccounts as $account) {
            $lineQuery = JournalEntryLine::where('account_id', $account->id)
                ->whereHas('journalEntry', function ($q) use ($startDate, $endDate) {
                    $q->where('status', 'posted')
                        ->whereBetween('entry_date', [$startDate, $endDate]);
                });

            $amount = (float) ($lineQuery->sum('debit') - $lineQuery->sum('credit'));
            $totalExpenses += $amount;

            $expenseLines[] = [
                'code'   => $account->code,
                'name'   => $account->name,
                'amount' => round($amount, 2),
            ];
        }

        $netIncome = $grossProfit - $totalExpenses;

        return [
            'start_date'      => $startDate,
            'end_date'        => $endDate,
            'gross_revenue'   => round($grossRevenue, 2),
            'discounts'       => round($totalDiscounts, 2),
            'net_revenue'     => round($netRevenue, 2),
            'cogs'            => round($totalCogs, 2),
            'gross_profit'    => round($grossProfit, 2),
            'total_expenses'  => round($totalExpenses, 2),
            'net_income'      => round($netIncome, 2),
            'revenue_lines'   => $revenueLines,
            'expense_lines'   => $expenseLines,
        ];
    }

    /**
     * Generate an authoritative Balance Sheet (Assets = Liabilities + Equity) as of a given date.
     */
    public function getBalanceSheet(?string $asOfDate = null): array
    {
        $asOfDate = $asOfDate ?? now()->toDateString();

        // 1. Assets (1xxx)
        $assetAccounts = Account::where('type', 'asset')->orderBy('code')->get();
        $assetLines = [];
        $totalAssets = 0.0;

        foreach ($assetAccounts as $account) {
            $balance = $account->getBalance($asOfDate);
            $totalAssets += $balance;
            $assetLines[] = [
                'code'    => $account->code,
                'name'    => $account->name,
                'balance' => round($balance, 2),
            ];
        }

        // 2. Liabilities (2xxx)
        $liabilityAccounts = Account::where('type', 'liability')->orderBy('code')->get();
        $liabilityLines = [];
        $totalLiabilities = 0.0;

        foreach ($liabilityAccounts as $account) {
            $balance = $account->getBalance($asOfDate);
            $totalLiabilities += $balance;
            $liabilityLines[] = [
                'code'    => $account->code,
                'name'    => $account->name,
                'balance' => round($balance, 2),
            ];
        }

        // 3. Equity (3xxx) + Cumulative Retained Earnings to Date
        $equityAccounts = Account::where('type', 'equity')->orderBy('code')->get();
        $equityLines = [];
        $totalEquityAccounts = 0.0;

        foreach ($equityAccounts as $account) {
            $balance = $account->getBalance($asOfDate);
            $totalEquityAccounts += $balance;
            $equityLines[] = [
                'code'    => $account->code,
                'name'    => $account->name,
                'balance' => round($balance, 2),
            ];
        }

        // Cumulative Net Income to date from P&L (All revenue - All expense)
        $allRevenue = (float) JournalEntryLine::whereHas('account', fn($q) => $q->where('type', 'revenue'))
            ->whereHas('journalEntry', fn($q) => $q->where('status', 'posted')->where('entry_date', '<=', $asOfDate))
            ->selectRaw('SUM(credit) - SUM(debit) as net_revenue')
            ->value('net_revenue') ?? 0.0;

        $allExpense = (float) JournalEntryLine::whereHas('account', fn($q) => $q->where('type', 'expense'))
            ->whereHas('journalEntry', fn($q) => $q->where('status', 'posted')->where('entry_date', '<=', $asOfDate))
            ->selectRaw('SUM(debit) - SUM(credit) as net_expense')
            ->value('net_expense') ?? 0.0;

        $cumulativeNetIncome = $allRevenue - $allExpense;

        $totalEquity = $totalEquityAccounts + $cumulativeNetIncome;
        $totalLiabilitiesAndEquity = $totalLiabilities + $totalEquity;

        $assetCents = (int) round($totalAssets * 100);
        $liabEquityCents = (int) round($totalLiabilitiesAndEquity * 100);
        $isBalanced = ($assetCents === $liabEquityCents);

        return [
            'as_of_date'                   => $asOfDate,
            'is_balanced'                  => $isBalanced,
            'total_assets'                 => round($totalAssets, 2),
            'total_liabilities'            => round($totalLiabilities, 2),
            'total_equity'                 => round($totalEquity, 2),
            'cumulative_net_income'        => round($cumulativeNetIncome, 2),
            'total_liabilities_and_equity' => round($totalLiabilitiesAndEquity, 2),
            'assets'                       => $assetLines,
            'liabilities'                  => $liabilityLines,
            'equity'                       => $equityLines,
        ];
    }
}

