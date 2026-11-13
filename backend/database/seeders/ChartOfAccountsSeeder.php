<?php

namespace Database\Seeders;

use App\Models\Accounting\Account;
use Illuminate\Database\Seeder;

class ChartOfAccountsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $accounts = [
            // ASSETS (1000 - 1999)
            [
                'code'           => '1010',
                'name'           => 'Cash on Hand',
                'type'           => 'asset',
                'normal_balance' => 'debit',
                'description'    => 'Physical cash in office registers and petty cash',
                'is_system'      => true,
            ],
            [
                'code'           => '1020',
                'name'           => 'Payment Gateway & Bank Clearing',
                'type'           => 'asset',
                'normal_balance' => 'debit',
                'description'    => 'Undeposited funds from bKash, Nagad, SSLCommerz, and Bank accounts',
                'is_system'      => true,
            ],
            [
                'code'           => '1030',
                'name'           => 'Accounts Receivable',
                'type'           => 'asset',
                'normal_balance' => 'debit',
                'description'    => 'Amounts due from wholesale B2B clients and corporate buyers',
                'is_system'      => true,
            ],
            [
                'code'           => '1050',
                'name'           => 'Merchandise Inventory Asset',
                'type'           => 'asset',
                'normal_balance' => 'debit',
                'description'    => 'Current valuation of stock on hand in warehouses',
                'is_system'      => true,
            ],

            // LIABILITIES (2000 - 2999)
            [
                'code'           => '2010',
                'name'           => 'Accounts Payable',
                'type'           => 'liability',
                'normal_balance' => 'credit',
                'description'    => 'Liabilities owed to suppliers and merchandise vendors',
                'is_system'      => true,
            ],
            [
                'code'           => '2020',
                'name'           => 'Customer Wallet Deposits',
                'type'           => 'liability',
                'normal_balance' => 'credit',
                'description'    => 'Pre-funded customer wallet balances held on store account',
                'is_system'      => true,
            ],
            [
                'code'           => '2030',
                'name'           => 'Sales Tax & VAT Payable',
                'type'           => 'liability',
                'normal_balance' => 'credit',
                'description'    => 'Collected VAT/sales tax due to national revenue authorities',
                'is_system'      => true,
            ],

            // EQUITY (3000 - 3999)
            [
                'code'           => '3010',
                'name'           => 'Owners Capital',
                'type'           => 'equity',
                'normal_balance' => 'credit',
                'description'    => 'Owner equity and paid-in capital',
                'is_system'      => true,
            ],
            [
                'code'           => '3020',
                'name'           => 'Retained Earnings',
                'type'           => 'equity',
                'normal_balance' => 'credit',
                'description'    => 'Cumulative net income retained in the business',
                'is_system'      => true,
            ],

            // REVENUE (4000 - 4999)
            [
                'code'           => '4010',
                'name'           => 'Merchandise Sales Revenue',
                'type'           => 'revenue',
                'normal_balance' => 'credit',
                'description'    => 'Gross sales of merchandise products',
                'is_system'      => true,
            ],
            [
                'code'           => '4020',
                'name'           => 'Sales Discounts & Allowances',
                'type'           => 'revenue',
                'normal_balance' => 'debit', // Contra-revenue
                'description'    => 'Promotional discounts, coupon deductions, and returns',
                'is_system'      => true,
            ],
            [
                'code'           => '4030',
                'name'           => 'Delivery & Shipping Revenue',
                'type'           => 'revenue',
                'normal_balance' => 'credit',
                'description'    => 'Shipping fees billed to customers during checkout',
                'is_system'      => true,
            ],

            // COST OF GOODS SOLD & EXPENSES (5000 - 6999)
            [
                'code'           => '5010',
                'name'           => 'Cost of Goods Sold (COGS)',
                'type'           => 'expense',
                'normal_balance' => 'debit',
                'description'    => 'Direct product acquisition or manufacturing cost of items sold',
                'is_system'      => true,
            ],
            [
                'code'           => '5020',
                'name'           => 'Courier Fulfillment Expense',
                'type'           => 'expense',
                'normal_balance' => 'debit',
                'description'    => 'Direct freight and parcel delivery expenses paid to couriers',
                'is_system'      => true,
            ],
            [
                'code'           => '5030',
                'name'           => 'Payment Gateway Fees',
                'type'           => 'expense',
                'normal_balance' => 'debit',
                'description'    => 'Merchant discount rates charged by bKash, SSLCommerz, Nagad',
                'is_system'      => true,
            ],
            [
                'code'           => '6010',
                'name'           => 'General & Administrative Expenses',
                'type'           => 'expense',
                'normal_balance' => 'debit',
                'description'    => 'Office rent, utilities, staff salaries, and overheads',
                'is_system'      => true,
            ],
        ];

        foreach ($accounts as $account) {
            Account::updateOrCreate(
                ['code' => $account['code']],
                $account
            );
        }
    }
}

