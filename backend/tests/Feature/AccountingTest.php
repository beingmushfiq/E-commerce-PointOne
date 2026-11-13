<?php

namespace Tests\Feature;

use App\Domain\Accounting\Exceptions\ClosedFiscalPeriodException;
use App\Domain\Accounting\Exceptions\ImmutableJournalEntryException;
use App\Domain\Accounting\Exceptions\UnbalancedJournalEntryException;
use App\Domain\Accounting\Services\CommerceLedgerBridge;
use App\Domain\Accounting\Services\FinancialReportService;
use App\Domain\Accounting\Services\JournalEntryService;
use App\Domain\Payments\PaymentGatewayManager;
use App\Models\Accounting\Account;
use App\Models\Accounting\FiscalPeriod;
use App\Models\Accounting\JournalEntry;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Permission;
use App\Models\Product;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\ChartOfAccountsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AccountingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ChartOfAccountsSeeder::class);
    }

    protected function createFinanceStaffUser(): User
    {
        $user = User::factory()->create();
        $perm = Permission::create([
            'name'         => 'manage-finance',
            'display_name' => 'Manage Finance',
            'group'        => 'finance',
            'guard_name'   => 'web',
        ]);
        $role = Role::create([
            'name'         => 'finance_manager',
            'display_name' => 'Finance Manager',
            'guard_name'   => 'web',
        ]);
        $role->permissions()->attach($perm);
        $user->assignRole($role);

        return $user;
    }

    public function test_journal_service_rejects_unbalanced_entry(): void
    {
        $service = app(JournalEntryService::class);
        $cashAccount = Account::where('code', '1010')->first();
        $salesAccount = Account::where('code', '4010')->first();

        $this->expectException(UnbalancedJournalEntryException::class);

        // Debits (1000) != Credits (950)
        $service->createEntry(
            header: ['description' => 'Unbalanced Sale'],
            lines: [
                ['account_id' => $cashAccount->id, 'debit' => 1000.00, 'credit' => 0.00],
                ['account_id' => $salesAccount->id, 'debit' => 0.00, 'credit' => 950.00],
            ]
        );
    }

    public function test_journal_service_creates_balanced_entry_and_verifies_invariant(): void
    {
        $service = app(JournalEntryService::class);
        $cashAccount = Account::where('code', '1010')->first();
        $salesAccount = Account::where('code', '4010')->first();

        $entry = $service->createEntry(
            header: ['description' => 'Direct Store Cash Sale'],
            lines: [
                ['account_id' => $cashAccount->id, 'debit' => 2500.00, 'credit' => 0.00],
                ['account_id' => $salesAccount->id, 'debit' => 0.00, 'credit' => 2500.00],
            ]
        );

        $this->assertInstanceOf(JournalEntry::class, $entry);
        $this->assertTrue($entry->isBalanced());
        $this->assertEquals(2500.00, $entry->getTotalDebit());
        $this->assertEquals(2500.00, $entry->getTotalCredit());
        $this->assertEquals('posted', $entry->status);

        $this->assertDatabaseHas('journal_entries', [
            'id'     => $entry->id,
            'status' => 'posted',
        ]);
        $this->assertDatabaseCount('journal_entry_lines', 2);
    }

    public function test_journal_service_rejects_posting_in_closed_fiscal_period(): void
    {
        $service = app(JournalEntryService::class);
        $cashAccount = Account::where('code', '1010')->first();
        $salesAccount = Account::where('code', '4010')->first();

        $closedPeriod = FiscalPeriod::create([
            'name'       => 'FY2025-Q4',
            'start_date' => '2025-10-01',
            'end_date'   => '2025-12-31',
            'is_closed'  => true,
            'closed_at'  => now(),
        ]);

        $this->expectException(ClosedFiscalPeriodException::class);

        $service->createEntry(
            header: [
                'entry_date'       => '2025-11-15',
                'fiscal_period_id' => $closedPeriod->id,
                'description'      => 'Late entry into closed period',
            ],
            lines: [
                ['account_id' => $cashAccount->id, 'debit' => 100.00, 'credit' => 0.00],
                ['account_id' => $salesAccount->id, 'debit' => 0.00, 'credit' => 100.00],
            ]
        );
    }

    public function test_journal_entry_reversal_creates_exact_inverse_and_links_audit(): void
    {
        $service = app(JournalEntryService::class);
        $cashAccount = Account::where('code', '1010')->first();
        $salesAccount = Account::where('code', '4010')->first();

        $originalEntry = $service->createEntry(
            header: ['description' => 'Original transaction'],
            lines: [
                ['account_id' => $cashAccount->id, 'debit' => 5000.00, 'credit' => 0.00],
                ['account_id' => $salesAccount->id, 'debit' => 0.00, 'credit' => 5000.00],
            ]
        );

        $reversal = $service->reverseEntry($originalEntry, 'Customer cancellation');

        $this->assertInstanceOf(JournalEntry::class, $reversal);
        $this->assertTrue($reversal->isBalanced());
        $this->assertEquals('posted', $reversal->status);

        // Original entry is now marked reversed
        $originalEntry->refresh();
        $this->assertEquals('reversed', $originalEntry->status);
        $this->assertEquals($reversal->id, $originalEntry->reversed_by_id);

        // Reversal lines must invert: cash credit 5000, sales debit 5000
        $this->assertDatabaseHas('journal_entry_lines', [
            'journal_entry_id' => $reversal->id,
            'account_id'       => $cashAccount->id,
            'credit'           => 5000.00,
        ]);
        $this->assertDatabaseHas('journal_entry_lines', [
            'journal_entry_id' => $reversal->id,
            'account_id'       => $salesAccount->id,
            'debit'            => 5000.00,
        ]);

        // Attempting to reverse again must throw ImmutableJournalEntryException
        $this->expectException(ImmutableJournalEntryException::class);
        $service->reverseEntry($originalEntry, 'Duplicate reversal attempt');
    }

    public function test_financial_reports_trial_balance_pnl_and_balance_sheet(): void
    {
        $journalService = app(JournalEntryService::class);
        $reportService = app(FinancialReportService::class);

        $cash = Account::where('code', '1010')->first();
        $sales = Account::where('code', '4010')->first();
        $cogs = Account::where('code', '5010')->first();
        $inventory = Account::where('code', '1050')->first();
        $capital = Account::where('code', '3010')->first();
        $shippingExp = Account::where('code', '5020')->first();

        // 1. Initial Capital: Debit Cash 100,000, Credit Owners Capital 100,000
        $journalService->createEntry(
            header: ['description' => 'Initial capital investment', 'entry_date' => '2026-01-01'],
            lines: [
                ['account_id' => $cash->id, 'debit' => 100000.00, 'credit' => 0.00],
                ['account_id' => $capital->id, 'debit' => 0.00, 'credit' => 100000.00],
            ]
        );

        // 2. Buy Inventory: Debit Inventory 40,000, Credit Cash 40,000
        $journalService->createEntry(
            header: ['description' => 'Merchandise stock purchase', 'entry_date' => '2026-01-02'],
            lines: [
                ['account_id' => $inventory->id, 'debit' => 40000.00, 'credit' => 0.00],
                ['account_id' => $cash->id, 'debit' => 0.00, 'credit' => 40000.00],
            ]
        );

        // 3. Sell Goods: Debit Cash 30,000, Credit Sales 30,000
        $journalService->createEntry(
            header: ['description' => 'Retail sales', 'entry_date' => '2026-01-05'],
            lines: [
                ['account_id' => $cash->id, 'debit' => 30000.00, 'credit' => 0.00],
                ['account_id' => $sales->id, 'debit' => 0.00, 'credit' => 30000.00],
            ]
        );

        // 4. Recognize COGS: Debit COGS 15,000, Credit Inventory 15,000
        $journalService->createEntry(
            header: ['description' => 'COGS recognition', 'entry_date' => '2026-01-05'],
            lines: [
                ['account_id' => $cogs->id, 'debit' => 15000.00, 'credit' => 0.00],
                ['account_id' => $inventory->id, 'debit' => 0.00, 'credit' => 15000.00],
            ]
        );

        // 5. Courier Expense: Debit Shipping Exp 2,000, Credit Cash 2,000
        $journalService->createEntry(
            header: ['description' => 'Courier bill', 'entry_date' => '2026-01-10'],
            lines: [
                ['account_id' => $shippingExp->id, 'debit' => 2000.00, 'credit' => 0.00],
                ['account_id' => $cash->id, 'debit' => 0.00, 'credit' => 2000.00],
            ]
        );

        // A. Test Trial Balance
        $tb = $reportService->getTrialBalance('2026-01-31');
        $this->assertTrue($tb['is_balanced']);
        $this->assertEquals(187000.00, $tb['total_debits']);
        $this->assertEquals(187000.00, $tb['total_credits']);

        // B. Test Profit and Loss
        $pnl = $reportService->getProfitAndLoss('2026-01-01', '2026-01-31');
        $this->assertEquals(30000.00, $pnl['net_revenue']);
        $this->assertEquals(15000.00, $pnl['cogs']);
        $this->assertEquals(15000.00, $pnl['gross_profit']);
        $this->assertEquals(2000.00, $pnl['total_expenses']);
        $this->assertEquals(13000.00, $pnl['net_income']); // 15,000 - 2,000 = 13,000

        // C. Test Balance Sheet
        $bs = $reportService->getBalanceSheet('2026-01-31');
        $this->assertTrue($bs['is_balanced']);
        // Assets: Cash (100k - 40k + 30k - 2k = 88k) + Inventory (40k - 15k = 25k) = 113,000
        $this->assertEquals(113000.00, $bs['total_assets']);
        // Liabilities: 0.00
        $this->assertEquals(0.00, $bs['total_liabilities']);
        // Equity: Owners Capital (100k) + Net Income (13k) = 113,000
        $this->assertEquals(113000.00, $bs['total_equity']);
        $this->assertEquals(113000.00, $bs['total_liabilities_and_equity']);
    }

    public function test_commerce_ledger_bridge_records_order_payment_and_fulfillment(): void
    {
        $category = Category::create(['name' => 'Fashion', 'slug' => 'fashion']);
        $product = Product::create([
            'category_id' => $category->id,
            'name'        => 'Silk Kurti',
            'slug'        => 'silk-kurti',
            'sku'         => 'FS-001',
            'price'       => 2000.00,
            'cost_price'  => 1100.00,
            'quantity'    => 10,
        ]);

        $order = Order::create([
            'order_number'     => 'ORD-LEDGER-' . uniqid(),
            'subtotal'         => 2000.00,
            'tax_amount'       => 100.00,
            'shipping_cost'    => 80.00,
            'discount_amount'  => 200.00,
            'grand_total'      => 1980.00, // 2000 + 100 + 80 - 200 = 1980
            'status'           => 'pending',
            'payment_status'   => 'unpaid',
            'payment_method'   => 'bkash',
            'shipping_address' => ['city' => 'Dhaka'],
            'billing_address'  => ['city' => 'Dhaka'],
        ]);

        OrderItem::create([
            'order_id'      => $order->id,
            'product_id'    => $product->id,
            'product_name'  => 'Silk Kurti',
            'sku'           => 'FS-001',
            'quantity'      => 1,
            'unit_price'    => 2000.00,
            'total_price'   => 2000.00,
            'snapshot_data' => [
                'name'       => 'Silk Kurti',
                'sku'        => 'FS-001',
                'cost_price' => 1100.00,
            ],
        ]);

        // Process payment via PaymentGatewayManager
        $paymentManager = app(PaymentGatewayManager::class);
        $payment = $paymentManager->processPayment($order, 'test');

        // Verify automated journal entry was created for payment
        $paymentEntry = JournalEntry::where('source_type', 'payment')
            ->where('source_id', $payment->id)
            ->first();

        $this->assertNotNull($paymentEntry);
        $this->assertTrue($paymentEntry->isBalanced());
        // Total debit: Clearing (1980) + Discount (200) = 2180
        // Total credit: Sales (2000) + Tax (100) + Shipping (80) = 2180
        $this->assertEquals(2180.00, $paymentEntry->getTotalDebit());
        $this->assertEquals(2180.00, $paymentEntry->getTotalCredit());

        // Now trigger COGS via bridge
        $bridge = app(CommerceLedgerBridge::class);
        $cogsEntry = $bridge->recordOrderFulfillment($order);

        $this->assertNotNull($cogsEntry);
        $this->assertTrue($cogsEntry->isBalanced());
        $this->assertEquals(1100.00, $cogsEntry->getTotalDebit());
        $this->assertEquals(1100.00, $cogsEntry->getTotalCredit());
    }

    public function test_api_accounting_endpoints_rbac_and_crud(): void
    {
        // 1. Unauthenticated -> 401
        $guestResponse = $this->getJson('/api/v1/accounting/accounts');
        $guestResponse->assertStatus(401);

        // 2. Regular customer without finance permission -> 403
        $customer = User::factory()->create();
        Sanctum::actingAs($customer);

        $customerResponse = $this->getJson('/api/v1/accounting/accounts');
        $customerResponse->assertStatus(403);

        // 3. Authorized finance manager -> 200
        $financeManager = $this->createFinanceStaffUser();
        Sanctum::actingAs($financeManager);

        $accountsResponse = $this->getJson('/api/v1/accounting/accounts');
        $accountsResponse->assertStatus(200)
            ->assertJsonPath('status', 'success');

        // Create new account
        $newAccountResponse = $this->postJson('/api/v1/accounting/accounts', [
            'code'           => '6030',
            'name'           => 'Software Subscription Expense',
            'type'           => 'expense',
            'normal_balance' => 'debit',
            'description'    => 'SaaS tool subscriptions',
        ]);
        $newAccountResponse->assertStatus(201);

        // Post Journal Entry via API
        $cash = Account::where('code', '1010')->first();
        $sales = Account::where('code', '4010')->first();

        $entryResponse = $this->postJson('/api/v1/accounting/journal-entries', [
            'description' => 'API Cash Sale',
            'lines'       => [
                ['account_id' => $cash->id, 'debit' => 750.00, 'credit' => 0.00],
                ['account_id' => $sales->id, 'debit' => 0.00, 'credit' => 750.00],
            ],
        ]);
        $entryResponse->assertStatus(201)
            ->assertJsonPath('status', 'success');

        $entryId = $entryResponse->json('data.id');

        // Post Reversal via API
        $reversalResponse = $this->postJson("/api/v1/accounting/journal-entries/{$entryId}/reverse", [
            'reason' => 'Customer refunded item at counter',
        ]);
        $reversalResponse->assertStatus(200)
            ->assertJsonPath('status', 'success');

        // Test API Reports
        $tbResponse = $this->getJson('/api/v1/accounting/reports/trial-balance');
        $tbResponse->assertStatus(200)
            ->assertJsonPath('data.is_balanced', true);

        $pnlResponse = $this->getJson('/api/v1/accounting/reports/profit-and-loss');
        $pnlResponse->assertStatus(200)
            ->assertJsonPath('status', 'success');

        $bsResponse = $this->getJson('/api/v1/accounting/reports/balance-sheet');
        $bsResponse->assertStatus(200)
            ->assertJsonPath('data.is_balanced', true);
    }
}
