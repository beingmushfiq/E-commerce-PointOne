<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Product;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ProductionSeeder extends Seeder
{
    /**
     * Run production-safe, non-destructive, idempotent database seeds.
     * Safe to run repeatedly on every deployment.
     */
    public function run(): void
    {
        // 1. Roles Setup
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin'],
            ['display_name' => 'Administrator', 'guard_name' => 'web']
        );

        $customerRole = Role::firstOrCreate(
            ['name' => 'customer'],
            ['display_name' => 'Customer', 'guard_name' => 'web']
        );

        // 2. Permissions Setup & Attachment
        $perms = [
            'access-admin', 'manage-catalog', 'manage-orders', 'manage-cms',
            'manage-users', 'manage-inventory', 'manage-finance', 'manage-marketing'
        ];
        foreach ($perms as $p) {
            $perm = Permission::firstOrCreate(
                ['name' => $p],
                [
                    'display_name' => Str::title(str_replace('-', ' ', $p)),
                    'group' => 'system',
                    'guard_name' => 'web'
                ]
            );
            if (!$adminRole->permissions()->where('permissions.id', $perm->id)->exists()) {
                $adminRole->permissions()->attach($perm->id);
            }
        }

        // 3. Administrative Accounts Setup (Idempotent updateOrCreate)
        $superadmin = User::updateOrCreate(
            ['email' => 'superadmin@centerpoint.com'],
            ['name' => 'Platform Superadmin', 'password' => Hash::make('password123')]
        );
        if (!$superadmin->hasRole('admin')) {
            $superadmin->assignRole($adminRole);
        }

        $admin = User::updateOrCreate(
            ['email' => 'admin@centerpoint.com'],
            ['name' => 'Store Administrator', 'password' => Hash::make('password123')]
        );
        if (!$admin->hasRole('admin')) {
            $admin->assignRole($adminRole);
        }

        $merchant = User::updateOrCreate(
            ['email' => 'merchant@centerpoint.atelier'],
            ['name' => 'Atelier Store Manager', 'password' => Hash::make('password123')]
        );
        if (!$merchant->hasRole('admin')) {
            $merchant->assignRole($adminRole);
        }

        $customer = User::updateOrCreate(
            ['email' => 'customer@centerpoint.com'],
            ['name' => 'Alexander Wright', 'password' => Hash::make('password123')]
        );
        if (!$customer->hasRole('customer')) {
            $customer->assignRole($customerRole);
        }

        // 3b. SaaS Master Control Panel Platform Administrators (Central Database)
        try {
            if (\Illuminate\Support\Facades\Schema::connection('central')->hasTable('platform_admins')) {
                \App\Models\Central\PlatformAdmin::updateOrCreate(
                    ['email' => 'superadmin@centerpoint.com'],
                    [
                        'name' => 'Platform Superadmin',
                        'password' => Hash::make('password123'),
                        'is_super_admin' => true,
                        'is_active' => true,
                    ]
                );
            }
        } catch (\Throwable) {
            // Handled gracefully in standalone single-database installations
        }

        // 3c. SaaS Central Subscription Plans (Starter, Professional, Enterprise)
        try {
            if (\Illuminate\Support\Facades\Schema::connection('central')->hasTable('plans')) {
                $plans = [
                    [
                        'name' => 'Starter Launch',
                        'slug' => 'starter',
                        'price' => 2900.00,
                        'billing_period' => 'monthly',
                        'features_json' => ['custom_domain' => true, 'analytics' => true, 'api_access' => false],
                        'limits_json' => ['max_products' => 500, 'max_staff' => 3, 'storage_mb' => 2048],
                        'is_active' => true,
                    ],
                    [
                        'name' => 'Professional Growth',
                        'slug' => 'pro',
                        'price' => 7900.00,
                        'billing_period' => 'monthly',
                        'features_json' => ['custom_domain' => true, 'analytics' => true, 'api_access' => true, 'double_entry_ledger' => true],
                        'limits_json' => ['max_products' => 5000, 'max_staff' => 15, 'storage_mb' => 10240],
                        'is_active' => true,
                    ],
                    [
                        'name' => 'Enterprise Sovereign',
                        'slug' => 'enterprise',
                        'price' => 19900.00,
                        'billing_period' => 'monthly',
                        'features_json' => ['custom_domain' => true, 'analytics' => true, 'api_access' => true, 'double_entry_ledger' => true, 'white_label' => true, 'dedicated_support' => true],
                        'limits_json' => ['max_products' => 100000, 'max_staff' => 100, 'storage_mb' => 102400],
                        'is_active' => true,
                    ],
                ];
                foreach ($plans as $p) {
                    \App\Models\Central\Plan::updateOrCreate(['slug' => $p['slug']], $p);
                }
            }
        } catch (\Throwable) {
            // Handled gracefully in standalone single-database installations
        }

        // 4. Double-Entry Accounting Chart of Accounts
        $this->call(ChartOfAccountsSeeder::class);

        // 5. Default Categories (if empty)
        if (Category::count() === 0) {
            $categories = [
                ['name' => 'Timepieces', 'slug' => 'timepieces', 'description' => 'Precision mechanical complication watches'],
                ['name' => 'Haute Joaillerie', 'slug' => 'jewelry', 'description' => 'Artisanal gemstones and precious metals'],
                ['name' => 'Atelier Lifestyle', 'slug' => 'lifestyle', 'description' => 'Bespoke leather goods and accessories'],
            ];
            foreach ($categories as $cat) {
                Category::firstOrCreate(['slug' => $cat['slug']], $cat);
            }
        }

        // 6. Default Demo Products (only if catalog is empty)
        if (Product::count() === 0) {
            $timepieceCategory = Category::where('slug', 'timepieces')->first();
            Product::firstOrCreate(
                ['slug' => 'chronometer-tourbillon-01'],
                [
                    'name' => 'Chronomètre Souverain Tourbillon',
                    'category_id' => $timepieceCategory?->id,
                    'price' => 3850000.00,
                    'stock_quantity' => 5,
                    'description' => 'Grade-5 titanium case with manual-wind silicon escapement chronometer.',
                    'image_url' => 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80',
                    'status' => 'published',
                    'is_featured' => true,
                ]
            );
        }
    }
}
