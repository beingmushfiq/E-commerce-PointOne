<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Accounting\Exceptions\ClosedFiscalPeriodException;
use App\Domain\Accounting\Exceptions\ImmutableJournalEntryException;
use App\Domain\Accounting\Exceptions\UnbalancedJournalEntryException;
use App\Domain\Accounting\Services\FinancialReportService;
use App\Domain\Accounting\Services\JournalEntryService;
use App\Http\Controllers\Controller;
use App\Models\Accounting\Account;
use App\Models\Accounting\JournalEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AccountingController extends Controller
{
    public function __construct(
        protected JournalEntryService $journalService,
        protected FinancialReportService $reportService
    ) {}

    /**
     * List all accounts in the Chart of Accounts.
     */
    public function accounts(Request $request): JsonResponse
    {
        $query = Account::query();

        if ($request->has('type')) {
            $query->where('type', $request->query('type'));
        }

        if ($request->has('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%");
            });
        }

        $accounts = $query->orderBy('code')->get()->map(function ($account) {
            return [
                'id'             => $account->id,
                'code'           => $account->code,
                'name'           => $account->name,
                'type'           => $account->type,
                'normal_balance' => $account->normal_balance,
                'description'    => $account->description,
                'currency'       => $account->currency,
                'is_active'      => $account->is_active,
                'is_system'      => $account->is_system,
                'current_balance'=> $account->getBalance(),
            ];
        });

        return response()->json([
            'status' => 'success',
            'data'   => $accounts,
        ]);
    }

    /**
     * Create a new custom account.
     */
    public function storeAccount(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code'           => 'required|string|max:50|unique:chart_of_accounts,code',
            'name'           => 'required|string|max:255',
            'type'           => 'required|in:asset,liability,equity,revenue,expense',
            'normal_balance' => 'required|in:debit,credit',
            'parent_id'      => 'nullable|exists:chart_of_accounts,id',
            'description'    => 'nullable|string',
            'currency'       => 'nullable|string|max:10',
        ]);

        $account = Account::create($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Account created successfully',
            'data'    => $account,
        ], 201);
    }

    /**
     * List journal entries with filters.
     */
    public function journalEntries(Request $request): JsonResponse
    {
        $query = JournalEntry::with(['lines.account', 'fiscalPeriod', 'reversedBy'])
            ->orderByDesc('entry_date')
            ->orderByDesc('id');

        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('source_type')) {
            $query->where('source_type', $request->query('source_type'));
        }

        $entries = $query->paginate($request->query('per_page', 20));

        return response()->json([
            'status' => 'success',
            'data'   => $entries,
        ]);
    }

    /**
     * Post a balanced double-entry journal entry.
     */
    public function storeJournalEntry(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'entry_date'         => 'nullable|date',
            'description'        => 'required|string|max:255',
            'fiscal_period_id'   => 'nullable|exists:fiscal_periods,id',
            'source_type'        => 'nullable|string|max:50',
            'source_id'          => 'nullable|integer',
            'lines'              => 'required|array|min:2',
            'lines.*.account_id' => 'required|exists:chart_of_accounts,id',
            'lines.*.debit'      => 'nullable|numeric|min:0',
            'lines.*.credit'     => 'nullable|numeric|min:0',
            'lines.*.description'=> 'nullable|string|max:255',
        ]);

        try {
            $entry = $this->journalService->createEntry(
                header: [
                    'entry_date'         => $validated['entry_date'] ?? now()->toDateString(),
                    'description'        => $validated['description'],
                    'fiscal_period_id'   => $validated['fiscal_period_id'] ?? null,
                    'source_type'        => $validated['source_type'] ?? 'manual',
                    'source_id'          => $validated['source_id'] ?? null,
                    'created_by_user_id' => $request->user()?->id,
                ],
                lines: $validated['lines'],
                post: true
            );

            return response()->json([
                'status'  => 'success',
                'message' => 'Journal entry posted successfully',
                'data'    => $entry,
            ], 201);
        } catch (UnbalancedJournalEntryException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        } catch (ClosedFiscalPeriodException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 403);
        }
    }

    /**
     * Post an immutable reversal for an existing posted journal entry.
     */
    public function reverseJournalEntry(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:255',
        ]);

        $entry = JournalEntry::findOrFail($id);

        try {
            $reversal = $this->journalService->reverseEntry(
                entry: $entry,
                reason: $validated['reason'],
                userId: $request->user()?->id
            );

            return response()->json([
                'status'  => 'success',
                'message' => 'Journal entry reversed successfully',
                'data'    => $reversal,
            ]);
        } catch (ImmutableJournalEntryException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        } catch (ClosedFiscalPeriodException $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 403);
        }
    }

    /**
     * Generate Trial Balance.
     */
    public function trialBalance(Request $request): JsonResponse
    {
        $asOfDate = $request->query('as_of_date', now()->toDateString());
        $report = $this->reportService->getTrialBalance($asOfDate);

        return response()->json([
            'status' => 'success',
            'data'   => $report,
        ]);
    }

    /**
     * Generate Profit and Loss (Income Statement).
     */
    public function profitAndLoss(Request $request): JsonResponse
    {
        $startDate = $request->query('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->query('end_date', now()->toDateString());

        $report = $this->reportService->getProfitAndLoss($startDate, $endDate);

        return response()->json([
            'status' => 'success',
            'data'   => $report,
        ]);
    }

    /**
     * Generate Balance Sheet.
     */
    public function balanceSheet(Request $request): JsonResponse
    {
        $asOfDate = $request->query('as_of_date', now()->toDateString());
        $report = $this->reportService->getBalanceSheet($asOfDate);

        return response()->json([
            'status' => 'success',
            'data'   => $report,
        ]);
    }
}

