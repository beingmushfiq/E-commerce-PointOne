<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductReview;
use App\Models\Slider;
use App\Models\Menu;
use App\Models\Page;
use App\Models\Faq;
use App\Models\BlogCategory;
use App\Models\BlogPost;
use App\Models\Coupon;
use App\Models\FlashSale;
use App\Models\FlashSaleProduct;
use App\Models\Warehouse;
use App\Models\Stock;
use App\Models\StorefrontSetting;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

class ProductionSeeder extends Seeder
{
    /**
     * Run production-safe, non-destructive, idempotent database seeds.
     * Populates all products, categories, brands, CMS content, storefront
     * settings, and administrative accounts. Safe to run repeatedly.
     */
    public function run(): void
    {
        // =====================================================================
        // 1. ROLES & PERMISSIONS SETUP
        // =====================================================================
        $adminRole = Role::firstOrCreate(
            ['name' => 'admin'],
            ['display_name' => 'Administrator', 'guard_name' => 'web']
        );

        $customerRole = Role::firstOrCreate(
            ['name' => 'customer'],
            ['display_name' => 'Customer', 'guard_name' => 'web']
        );

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

        // =====================================================================
        // 2. VERIFIED OPERATIONAL & ADMINISTRATIVE ACCOUNTS
        // =====================================================================
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

        $legacyAdmin = User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            ['name' => 'System Admin', 'password' => Hash::make('12345678')]
        );
        if (!$legacyAdmin->hasRole('admin')) {
            $legacyAdmin->assignRole($adminRole);
        }

        $customer = User::updateOrCreate(
            ['email' => 'customer@centerpoint.com'],
            ['name' => 'Alexander Wright', 'password' => Hash::make('password123')]
        );
        if (!$customer->hasRole('customer')) {
            $customer->assignRole($customerRole);
        }

        // =====================================================================
        // 3. SAAS MASTER CONTROL PANEL PLATFORM ADMINS & SUBSCRIPTION PLANS
        // =====================================================================
        try {
            if (Schema::connection('central')->hasTable('platform_admins')) {
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
            // Handled gracefully in standalone installations
        }

        try {
            if (Schema::connection('central')->hasTable('plans')) {
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
            // Handled gracefully in standalone installations
        }

        // =====================================================================
        // 4. STOREFRONT THEME, BRANDING & INTEGRATION SETTINGS
        // =====================================================================
        try {
            StorefrontSetting::seedDefaults();
        } catch (\Throwable) {
            // Gracefully proceed if settings table is not yet migrated
        }

        // =====================================================================
        // 5. CMS HERO SLIDERS & BANNERS
        // =====================================================================
        $sliders = [
            [
                'title' => 'Curated Modern Living',
                'subtitle' => 'Explore Premium Apparel, Home Essentials, Tech Accessories & Lifestyle Goods',
                'image' => 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
                'button_text' => 'Explore Collection',
                'button_link' => '/category/fashion',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'title' => 'Horology & Complications',
                'subtitle' => 'Bespoke timepieces and fine complications crafted with generational mastery',
                'image' => 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=1200&q=80',
                'button_text' => 'Discover Timepieces',
                'button_link' => '/category/timepieces',
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'title' => 'Spring / Summer 2026 Collection',
                'subtitle' => 'Tailored Silhouettes in Organic Linen & Lightweight Merino Wool',
                'image' => 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80',
                'button_text' => 'Shop Apparel',
                'button_link' => '/category/fashion',
                'sort_order' => 3,
                'is_active' => true,
            ],
        ];
        foreach ($sliders as $s) {
            Slider::updateOrCreate(['title' => $s['title']], $s);
        }

        // =====================================================================
        // 6. HEADER & NAVIGATION MENUS
        // =====================================================================
        $menus = [
            ['title' => 'Home', 'url' => '/', 'sort_order' => 1, 'is_active' => true],
            ['title' => 'Timepieces', 'url' => '/category/timepieces', 'sort_order' => 2, 'is_active' => true],
            ['title' => 'Haute Joaillerie', 'url' => '/category/jewelry', 'sort_order' => 3, 'is_active' => true],
            ['title' => 'Fashion & Apparel', 'url' => '/category/fashion', 'sort_order' => 4, 'is_active' => true],
            ['title' => 'Home & Living', 'url' => '/category/home-living', 'sort_order' => 5, 'is_active' => true],
            ['title' => 'Tech & Audio', 'url' => '/category/tech', 'sort_order' => 6, 'is_active' => true],
            ['title' => 'Personal Care', 'url' => '/category/care', 'sort_order' => 7, 'is_active' => true],
        ];
        foreach ($menus as $m) {
            Menu::updateOrCreate(['title' => $m['title']], $m);
        }

        // =====================================================================
        // 7. CMS INFORMATIONAL PAGES
        // =====================================================================
        $pages = [
            [
                'title' => 'About CENTERPOINT',
                'slug' => 'about-us',
                'content' => 'CENTERPOINT is the vanguard of dual-edition luxury commerce, connecting discerning international clients with master craftspeople across horology, fine jewelry, tailored textiles, and bespoke interiors.',
                'meta_title' => 'About CENTERPOINT | Sovereign Luxury Commerce',
                'meta_description' => 'Learn about the philosophy, generational artisans, and verified provenance behind CENTERPOINT.',
                'is_published' => true,
            ],
            [
                'title' => 'Concierge & Express Shipping',
                'slug' => 'shipping-policy',
                'content' => 'Every consignment is dispatched in tamper-evident secured armor packaging with full transit insurance. We partner with specialized global couriers and domestic logistics leaders including Steadfast, Pathao, and RedX.',
                'meta_title' => 'Shipping & Concierge Service',
                'meta_description' => 'Complimentary express dispatch on all qualifying orders across Bangladesh and worldwide.',
                'is_published' => true,
            ],
            [
                'title' => 'Terms of Service',
                'slug' => 'terms-of-service',
                'content' => 'All transactions conducted on CENTERPOINT are governed by verified digital escrow, double-entry financial reconciliation, and authentic manufacturer warranty guarantees.',
                'meta_title' => 'Terms of Service | CENTERPOINT',
                'meta_description' => 'Official transaction terms, authenticity guarantees, and commercial conditions.',
                'is_published' => true,
            ],
            [
                'title' => 'Privacy & Security Protocol',
                'slug' => 'privacy-policy',
                'content' => 'Your financial data and personal identity are encrypted using bank-grade AES-256 ciphers. We enforce zero data monetization and rigorous tenant boundary isolation.',
                'meta_title' => 'Privacy Protocol | CENTERPOINT',
                'meta_description' => 'Our commitment to data sovereignty, tenant privacy, and transaction confidentiality.',
                'is_published' => true,
            ],
        ];
        foreach ($pages as $p) {
            Page::updateOrCreate(['slug' => $p['slug']], $p);
        }

        // =====================================================================
        // 8. FAQS
        // =====================================================================
        $faqs = [
            [
                'category' => 'Shipping',
                'question' => 'What is your shipping policy across Bangladesh and internationally?',
                'answer' => 'We offer complimentary express delivery on orders over ৳ 50,000. Within Dhaka, deliveries arrive within 24 hours. Countrywide deliveries take 48-72 hours via Steadfast and Pathao.',
                'sort_order' => 1,
                'is_active' => true,
            ],
            [
                'category' => 'Returns',
                'question' => 'How does the 30-day return policy work?',
                'answer' => 'We offer a 30-day hassle-free inspection window for unworn items in original packaging with prepaid tamper-evident return shipping.',
                'sort_order' => 2,
                'is_active' => true,
            ],
            [
                'category' => 'Payments',
                'question' => 'Which payment gateways and currencies are supported?',
                'answer' => 'We support native bKash, SSLCommerz, Nagad, Visa, Mastercard, AMEX, and Cash on Delivery (COD), with multi-currency pricing in BDT, USD, and EUR.',
                'sort_order' => 3,
                'is_active' => true,
            ],
            [
                'category' => 'Authenticity',
                'question' => 'Are all timepieces and luxury items guaranteed authentic?',
                'answer' => 'Every single piece is serialized, physically inspected by certified horologists or gemologists, and accompanied by a cryptographic Certificate of Authenticity.',
                'sort_order' => 4,
                'is_active' => true,
            ],
        ];
        foreach ($faqs as $f) {
            Faq::updateOrCreate(['question' => $f['question']], $f);
        }

        // =====================================================================
        // 9. BLOG EDITORIALS
        // =====================================================================
        $blogCat = BlogCategory::firstOrCreate(
            ['slug' => 'journal'],
            ['name' => 'The CENTERPOINT Journal']
        );

        BlogPost::updateOrCreate(
            ['slug' => 'art-of-tactile-minimalist-interior-design'],
            [
                'category_id' => $blogCat->id,
                'author_id' => $admin->id,
                'title' => 'The Art of Tactile Minimalist Interior Design',
                'featured_image' => 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=1200&q=80',
                'excerpt' => 'Discover how textured ceramics, natural timber, and warm illumination compose meditative luxury living spaces.',
                'content' => 'Interior architecture is not merely about ornamentation; it is the physical poetry of light, space, and tactile truth. In this issue of the Journal, we explore the master joinery of American walnut, the tactile glaze of hand-thrown stoneware, and the soft ambient diffusion of brushed solid brass.',
                'is_published' => true,
                'published_at' => now(),
            ]
        );

        BlogPost::updateOrCreate(
            ['slug' => 'renaissance-of-haute-horlogerie-2026'],
            [
                'category_id' => $blogCat->id,
                'author_id' => $admin->id,
                'title' => 'The Renaissance of Haute Horlogerie in 2026',
                'featured_image' => 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=1200&q=80',
                'excerpt' => 'Why mechanical tourbillons, perpetual calendars, and silicon escapements continue to captivate connoisseurs.',
                'content' => 'In an era of fleeting digital obsolescence, a high-frequency mechanical chronometer beats with eternal human ingenuity. Each gear tooth polished by hand, each balance wheel weighted with gold screws, each tourbillon cage rotating to neutralize Earth gravity.',
                'is_published' => true,
                'published_at' => now(),
            ]
        );

        // =====================================================================
        // 10. PRODUCT CATEGORIES & BRANDS
        // =====================================================================
        $timepiecesCat = Category::updateOrCreate(
            ['slug' => 'timepieces'],
            [
                'name' => 'Horology & Timepieces',
                'description' => 'Precision mechanical complication watches and Haute Horlogerie chronometers',
                'image' => 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80',
                'is_active' => true,
                'is_featured' => true,
                'sort_order' => 1,
            ]
        );

        $jewelryCat = Category::updateOrCreate(
            ['slug' => 'jewelry'],
            [
                'name' => 'Haute Joaillerie',
                'description' => 'Artisanal gemstones, hand-set diamonds, and 18K solid gold precious jewelry',
                'image' => 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80',
                'is_active' => true,
                'is_featured' => true,
                'sort_order' => 2,
            ]
        );

        $fashionCat = Category::updateOrCreate(
            ['slug' => 'fashion'],
            [
                'name' => 'Fashion & Apparel',
                'description' => 'Tailored garments crafted from organic cashmere, Belgian linen, and merino wool',
                'image' => 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
                'is_active' => true,
                'is_featured' => true,
                'sort_order' => 3,
            ]
        );

        $homeCat = Category::updateOrCreate(
            ['slug' => 'home-living'],
            [
                'name' => 'Home & Living',
                'description' => 'Handcrafted ceramics, solid walnut furniture, and tactile interior décor',
                'image' => 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
                'is_active' => true,
                'is_featured' => true,
                'sort_order' => 4,
            ]
        );

        $techCat = Category::updateOrCreate(
            ['slug' => 'tech'],
            [
                'name' => 'Tech & Audio',
                'description' => 'Studio-grade acoustic audio, CNC machined mechanical peripherals, and precision gear',
                'image' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
                'is_active' => true,
                'is_featured' => true,
                'sort_order' => 5,
            ]
        );

        $careCat = Category::updateOrCreate(
            ['slug' => 'care'],
            [
                'name' => 'Personal Care',
                'description' => 'Botanical skincare, organic aromatics, and holistic self-care elixirs',
                'image' => 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80',
                'is_active' => true,
                'is_featured' => true,
                'sort_order' => 6,
            ]
        );

        // Brands
        $horlogerieBrand = Brand::updateOrCreate(
            ['slug' => 'atelier-horlogerie'],
            ['name' => 'Atelier Horlogerie', 'website' => 'https://centerpoint.devcenterpoint.com', 'is_active' => true, 'is_featured' => true]
        );
        $nordicBrand = Brand::updateOrCreate(
            ['slug' => 'nordic'],
            ['name' => 'Nordic Studio', 'website' => 'https://centerpoint.devcenterpoint.com', 'is_active' => true, 'is_featured' => true]
        );
        $aesopBrand = Brand::updateOrCreate(
            ['slug' => 'aesop'],
            ['name' => 'Aesop Studio', 'website' => 'https://centerpoint.devcenterpoint.com', 'is_active' => true, 'is_featured' => true]
        );
        $minimalBrand = Brand::updateOrCreate(
            ['slug' => 'minimal'],
            ['name' => 'Minimal Goods', 'website' => 'https://centerpoint.devcenterpoint.com', 'is_active' => true, 'is_featured' => true]
        );
        $joaillerieBrand = Brand::updateOrCreate(
            ['slug' => 'maison-joaillerie'],
            ['name' => 'Maison Joaillerie', 'website' => 'https://centerpoint.devcenterpoint.com', 'is_active' => true, 'is_featured' => true]
        );

        // =====================================================================
        // 11. CENTRAL WAREHOUSE FOR INVENTORY ALLOCATIONS
        // =====================================================================
        $vaultWarehouse = Warehouse::firstOrCreate(
            ['code' => 'WH-DAC-01'],
            [
                'name' => 'Dhaka Central Vault',
                'address' => 'Gulshan Commercial Avenue, Tejgaon',
                'city' => 'Dhaka',
                'country' => 'Bangladesh',
                'is_active' => true,
            ]
        );

        // =====================================================================
        // 12. COMPREHENSIVE PRODUCT CATALOG (28+ LUXURY ITEMS)
        // =====================================================================
        $catalog = [
            // --- HOROLOGY & TIMEPIECES ---
            [
                'cat' => $timepiecesCat, 'brand' => $horlogerieBrand,
                'name' => 'Chronomètre Souverain Tourbillon', 'slug' => 'chronometre-souverain-tourbillon',
                'sku' => 'HORO-TOURB-01', 'price' => 3850000.00, 'sale' => 3650000.00, 'qty' => 5, 'featured' => true,
                'summary' => 'Grade-5 titanium case with manual-wind silicon escapement chronometer.',
                'desc' => 'Handcrafted by Geneva master horologists. Features an ultra-light flying tourbillon cage rotating once per 60 seconds, dual mainspring barrels providing 72 hours of power reserve, and an exhibition sapphire caseback.',
                'img' => 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80'
            ],
            [
                'cat' => $timepiecesCat, 'brand' => $horlogerieBrand,
                'name' => 'Grand Complication Perpetual Calendar', 'slug' => 'grand-complication-perpetual-calendar',
                'sku' => 'HORO-PERPET-02', 'price' => 4950000.00, 'sale' => null, 'qty' => 3, 'featured' => true,
                'summary' => '18K rose gold casing with astronomical moonphase and perpetual leap year indicator.',
                'desc' => 'Accurate to one single day in 122 years. The dial is hand-guillochéd in solid sterling silver, protected by double anti-reflective sapphire crystal with alligator leather strap.',
                'img' => 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80'
            ],
            [
                'cat' => $timepiecesCat, 'brand' => $horlogerieBrand,
                'name' => 'Titanium Skeleton Flyback Chronograph', 'slug' => 'titanium-skeleton-flyback-chronograph',
                'sku' => 'HORO-CHRONO-03', 'price' => 1950000.00, 'sale' => 1800000.00, 'qty' => 8, 'featured' => true,
                'summary' => 'Open-worked skeleton dial with column-wheel flyback complication.',
                'desc' => 'Forged from aerospace-grade blasted titanium with integrated rubber strap and ceramic bezel. Water resistant to 100 meters.',
                'img' => 'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800&q=80'
            ],

            // --- HAUTE JOAILLERIE ---
            [
                'cat' => $jewelryCat, 'brand' => $joaillerieBrand,
                'name' => 'Pavé Diamond Solitaire Eternity Ring', 'slug' => 'pave-diamond-solitaire-eternity-ring',
                'sku' => 'JEWEL-RING-01', 'price' => 850000.00, 'sale' => 780000.00, 'qty' => 6, 'featured' => true,
                'summary' => '2.5-carat certified brilliant-cut diamond mounted on 950 platinum.',
                'desc' => 'D-color, VVS1 clarity diamond surrounded by a micro-pavé band of exceptional brilliance. Accompanied by official GIA grading certification.',
                'img' => 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80'
            ],
            [
                'cat' => $jewelryCat, 'brand' => $joaillerieBrand,
                'name' => '18K Sculptural Hammered Gold Bangle', 'slug' => '18k-sculptural-hammered-gold-bangle',
                'sku' => 'JEWEL-BANGLE-02', 'price' => 520000.00, 'sale' => null, 'qty' => 10, 'featured' => false,
                'summary' => 'Solid 18K yellow gold cuff with artisanal brushed texture.',
                'desc' => 'Individually forged and hand-hammered by master jewelers. Features a secure concealed hinge clasp designed for effortless everyday grace.',
                'img' => 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80'
            ],

            // --- FASHION & APPAREL ---
            [
                'cat' => $fashionCat, 'brand' => $nordicBrand,
                'name' => 'Heavyweight Wool Overshirt', 'slug' => 'heavyweight-wool-overshirt',
                'sku' => 'WOOL-SHIRT-01', 'price' => 28500.00, 'sale' => 24500.00, 'qty' => 40, 'featured' => true,
                'summary' => 'Tailored from 100% organic merino wool with a relaxed architectural silhouette.',
                'desc' => 'A versatile layering piece crafted for crisp morning walks and effortless evening style. Features horn buttons and dual chest pockets.',
                'img' => 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80'
            ],
            [
                'cat' => $fashionCat, 'brand' => $minimalBrand,
                'name' => 'Minimalist Leather Tote Bag', 'slug' => 'minimalist-leather-tote-bag',
                'sku' => 'BAG-TOTE-02', 'price' => 45000.00, 'sale' => null, 'qty' => 18, 'featured' => true,
                'summary' => 'Full-grain Italian vegetable-tanned leather carryall with reinforced handles.',
                'desc' => 'Spacious main compartment holds your daily essentials, laptop, and notebook. Handcrafted with subtle painted edges and brass hardware.',
                'img' => 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80'
            ],
            [
                'cat' => $fashionCat, 'brand' => $nordicBrand,
                'name' => 'Tailored Linen Trouser', 'slug' => 'tailored-linen-trouser',
                'sku' => 'PANTS-LINEN-03', 'price' => 22000.00, 'sale' => 18500.00, 'qty' => 25, 'featured' => false,
                'summary' => 'Breathable Belgian linen pants featuring double forward pleats.',
                'desc' => 'Cut for a relaxed straight drape, ideal for warm climates and refined business settings. Fitted with side adjusters and unhemmed cuffs for bespoke fitting.',
                'img' => 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80'
            ],
            [
                'cat' => $fashionCat, 'brand' => $minimalBrand,
                'name' => 'Structured Cashmere Knit Sweater', 'slug' => 'structured-cashmere-knit-sweater',
                'sku' => 'SWEATER-CASH-04', 'price' => 38000.00, 'sale' => null, 'qty' => 15, 'featured' => true,
                'summary' => 'Pure Grade-A Mongolian cashmere crewneck pullover sweater.',
                'desc' => 'Incredibly soft hand-feel with heavy 7-gauge knit structure. Ribbed collar, cuffs, and hem ensure lasting shape retention over seasons.',
                'img' => 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80'
            ],
            [
                'cat' => $fashionCat, 'brand' => $nordicBrand,
                'name' => 'Canvas Weekender Duffle Bag', 'slug' => 'canvas-weekender-duffle-bag',
                'sku' => 'BAG-WEEKEND-05', 'price' => 28000.00, 'sale' => 23500.00, 'qty' => 30, 'featured' => false,
                'summary' => 'Heavy-duty 18oz waxed cotton canvas bag with bridle leather accents.',
                'desc' => 'Includes customized luggage tag, antique brass hardware, shoe compartment, and detachable padded shoulder strap.',
                'img' => 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'
            ],
            [
                'cat' => $fashionCat, 'brand' => $minimalBrand,
                'name' => 'Classic Leather Chelsea Boot', 'slug' => 'classic-leather-chelsea-boot',
                'sku' => 'SHOES-CHELSEA-06', 'price' => 35000.00, 'sale' => null, 'qty' => 20, 'featured' => false,
                'summary' => 'Full Goodyear welted calfskin leather ankle boots with elastic side gores.',
                'desc' => 'Hand-burnished cognac leather finish with Dainite rubber studs embedded into stacked leather soles for superior grip in all weather.',
                'img' => 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&q=80'
            ],
            [
                'cat' => $fashionCat, 'brand' => $nordicBrand,
                'name' => 'Organic Cotton Oxford Shirt', 'slug' => 'organic-cotton-oxford-shirt',
                'sku' => 'SHIRT-OXFORD-07', 'price' => 14500.00, 'sale' => 12000.00, 'qty' => 50, 'featured' => false,
                'summary' => 'Pre-washed organic Supima cotton shirt with classic button-down collar.',
                'desc' => 'Timeless wardrobe staple designed for effortless layering with genuine mother-of-pearl buttons and single needle stitching.',
                'img' => 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80'
            ],

            // --- HOME & LIVING ---
            [
                'cat' => $homeCat, 'brand' => $nordicBrand,
                'name' => 'Handcrafted Matte Ceramic Teapot', 'slug' => 'handcrafted-matte-ceramic-teapot',
                'sku' => 'CERAMIC-POT-08', 'price' => 13500.00, 'sale' => 11500.00, 'qty' => 30, 'featured' => true,
                'summary' => 'Japanese-inspired stoneware with hand-bent brass handle and integrated mesh filter.',
                'desc' => 'Individually wheel-thrown and wood-fired to achieve a satin tactile glaze. Perfect for slow mindful tea ceremonies.',
                'img' => 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80'
            ],
            [
                'cat' => $homeCat, 'brand' => $minimalBrand,
                'name' => 'Solid Oak Desk Organizer', 'slug' => 'solid-oak-desk-organizer',
                'sku' => 'OAK-DESK-09', 'price' => 9500.00, 'sale' => null, 'qty' => 60, 'featured' => false,
                'summary' => 'Milled from sustainably harvested European white oak with felt base.',
                'desc' => 'Keep your executive workspace tidy with precision CNC-machined slots for fountain pens, smartphone, keys, and daily stationery.',
                'img' => 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80'
            ],
            [
                'cat' => $homeCat, 'brand' => $nordicBrand,
                'name' => 'Sculptural Brass Desk Lamp', 'slug' => 'sculptural-brass-desk-lamp',
                'sku' => 'LAMP-BRASS-10', 'price' => 32000.00, 'sale' => 26000.00, 'qty' => 12, 'featured' => true,
                'summary' => 'Dimmable 2700K warm LED fixture with spun solid brass shade.',
                'desc' => 'Articulated arm provides targeted architectural illumination for evening drafting or reading. Heavy machined base ensures steadfast balance.',
                'img' => 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80'
            ],
            [
                'cat' => $homeCat, 'brand' => $minimalBrand,
                'name' => 'Minimalist Linen Throw Blanket', 'slug' => 'minimalist-linen-throw-blanket',
                'sku' => 'HOME-BLANKET-11', 'price' => 16500.00, 'sale' => null, 'qty' => 35, 'featured' => false,
                'summary' => 'Pre-washed French flax linen throw with delicate eyelash fringe.',
                'desc' => 'Naturally hypoallergenic and thermoregulating for summer coolness and winter warmth. Generously proportioned at 150cm x 220cm.',
                'img' => 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80'
            ],
            [
                'cat' => $homeCat, 'brand' => $nordicBrand,
                'name' => 'Hand-Poured Soy Scented Candle', 'slug' => 'hand-poured-soy-scented-candle',
                'sku' => 'CANDLE-SOY-12', 'price' => 5500.00, 'sale' => null, 'qty' => 100, 'featured' => false,
                'summary' => 'Aromatic notes of Hinoki wood, smoked cedar, and wild mountain lavender.',
                'desc' => 'Poured into a reusable matte ceramic vessel with a crackling wooden wick. Burns cleanly for approximately 65 hours.',
                'img' => 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80'
            ],
            [
                'cat' => $homeCat, 'brand' => $minimalBrand,
                'name' => 'Architectural Walnut Coffee Table', 'slug' => 'architectural-walnut-coffee-table',
                'sku' => 'FURN-TABLE-13', 'price' => 95000.00, 'sale' => 82000.00, 'qty' => 5, 'featured' => true,
                'summary' => 'Low-profile solid American walnut coffee table with chamfered edge profile.',
                'desc' => 'Stunning centerpiece for contemporary living spaces. Traditional mortise-and-tenon joinery finished with natural non-toxic hardwax oil.',
                'img' => 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&q=80'
            ],
            [
                'cat' => $homeCat, 'brand' => $nordicBrand,
                'name' => 'Nordic Ceramic Dinnerware Set', 'slug' => 'nordic-ceramic-dinnerware-set',
                'sku' => 'CERAMIC-SET-14', 'price' => 36000.00, 'sale' => null, 'qty' => 22, 'featured' => false,
                'summary' => 'Complete handcrafted tableware featuring organic curves and speckled glaze.',
                'desc' => 'Includes 4 dinner plates, 4 salad plates, 4 coupe bowls, and 4 mugs. Chip resistant, dishwasher, oven, and microwave safe.',
                'img' => 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80'
            ],

            // --- TECH & AUDIO ---
            [
                'cat' => $techCat, 'brand' => $minimalBrand,
                'name' => 'Noise-Canceling Wireless Headphones', 'slug' => 'noise-canceling-wireless-headphones',
                'sku' => 'AUDIO-HEADPHONE-15', 'price' => 39500.00, 'sale' => 34500.00, 'qty' => 45, 'featured' => true,
                'summary' => 'Audiophile-grade 40mm beryllium drivers with hybrid active noise cancellation.',
                'desc' => 'Crafted with memory foam lambskin ear pads, lightweight anodized aluminum frame, and 35-hour playback via USB-C fast charging.',
                'img' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'
            ],
            [
                'cat' => $techCat, 'brand' => $minimalBrand,
                'name' => 'Aluminum Wireless Charging Pad', 'slug' => 'aluminum-wireless-charging-pad',
                'sku' => 'TECH-CHARGE-16', 'price' => 8500.00, 'sale' => null, 'qty' => 90, 'featured' => false,
                'summary' => '15W Qi-certified inductive charger wrapped in pebble leather.',
                'desc' => 'Sleek weighted aluminum base ensures stability on desks or nightstands. Simultaneously powers smartphone and wireless earbuds.',
                'img' => 'https://images.unsplash.com/photo-1622445268121-8a141885b5d8?w=800&q=80'
            ],
            [
                'cat' => $techCat, 'brand' => $minimalBrand,
                'name' => 'Mechanical Wireless Keyboard', 'slug' => 'mechanical-wireless-keyboard',
                'sku' => 'TECH-KEYBOARD-17', 'price' => 24500.00, 'sale' => 21000.00, 'qty' => 30, 'featured' => true,
                'summary' => 'Hot-swappable tactile mechanical switches with CNC aluminum chassis.',
                'desc' => 'Gasket-mounted dampening for satisfying acoustics. Features Bluetooth 5.3, 2.4GHz wireless dongle, and south-facing RGB illumination.',
                'img' => 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'
            ],
            [
                'cat' => $techCat, 'brand' => $minimalBrand,
                'name' => 'Ergonomic Precision Wireless Mouse', 'slug' => 'ergonomic-precision-wireless-mouse',
                'sku' => 'TECH-MOUSE-18', 'price' => 13500.00, 'sale' => null, 'qty' => 40, 'featured' => false,
                'summary' => 'Electromagnetic MagSpeed scroll wheel with multi-device cross-computer control.',
                'desc' => 'Contoured shape crafted to comfortably cradle your palm and thumb over long creative sessions. 8,000 DPI sensor tracks on glass.',
                'img' => 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80'
            ],
            [
                'cat' => $techCat, 'brand' => $minimalBrand,
                'name' => 'Portable Hi-Fi Bluetooth Speaker', 'slug' => 'portable-hifi-bluetooth-speaker',
                'sku' => 'AUDIO-SPEAKER-19', 'price' => 26000.00, 'sale' => 22500.00, 'qty' => 28, 'featured' => false,
                'summary' => '360-degree acoustic projection with IP67 dust and water resistance.',
                'desc' => 'Encased in custom Kvadrat wool fabric with a genuine leather handle. Dual passive radiators produce punchy, distortion-free bass.',
                'img' => 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80'
            ],
            [
                'cat' => $techCat, 'brand' => $minimalBrand,
                'name' => 'Leather Laptop Sleeve (14-inch)', 'slug' => 'leather-laptop-sleeve-14-inch',
                'sku' => 'TECH-SLEEVE-20', 'price' => 11500.00, 'sale' => null, 'qty' => 50, 'featured' => false,
                'summary' => 'Ultra-slim magnetic closure sleeve tailored for MacBook Pro 14.',
                'desc' => 'Plush microfiber lining prevents surface scratches. Slim profile slips cleanly into briefcases or totes without added bulk.',
                'img' => 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80'
            ],

            // --- PERSONAL CARE ---
            [
                'cat' => $careCat, 'brand' => $aesopBrand,
                'name' => 'Botanical Hand Wash & Balm Set', 'slug' => 'botanical-hand-wash-balm-set',
                'sku' => 'CARE-SET-21', 'price' => 9500.00, 'sale' => 8200.00, 'qty' => 80, 'featured' => true,
                'summary' => 'Cleanser and nourishing balm infused with Mandarin rind and Atlas cedarwood.',
                'desc' => 'Leaves hands cleansed, hydrated, and subtly fragranced. Presented in 500ml recyclable amber bottles with precision pumps.',
                'img' => 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80'
            ],
            [
                'cat' => $careCat, 'brand' => $aesopBrand,
                'name' => 'Facial Hydrating Serum & Toner', 'slug' => 'facial-hydrating-serum-toner',
                'sku' => 'CARE-SERUM-22', 'price' => 12000.00, 'sale' => null, 'qty' => 60, 'featured' => false,
                'summary' => 'Concentrated botanical elixir enriched with Vitamin C, Niacinamide, and Green Tea.',
                'desc' => 'Lightweight hydrating formula absorbs rapidly to replenish the skin moisture barrier and shield against urban pollution.',
                'img' => 'https://images.unsplash.com/photo-1608248597309-8d19760773d5?w=800&q=80'
            ],
            [
                'cat' => $careCat, 'brand' => $aesopBrand,
                'name' => 'Cedarwood & Bergamot Body Wash', 'slug' => 'cedarwood-bergamot-body-wash',
                'sku' => 'CARE-BODY-23', 'price' => 5800.00, 'sale' => null, 'qty' => 120, 'featured' => false,
                'summary' => 'Gentle low-foaming gel cleanser with woody, citrus herbal aromatics.',
                'desc' => 'Cleanses thoroughly without stripping natural protective lipids. Formulated with aloe vera and cold-pressed botanical oils.',
                'img' => 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800&q=80'
            ],
            [
                'cat' => $careCat, 'brand' => $aesopBrand,
                'name' => 'Aromatic Room Spray Collection', 'slug' => 'aromatic-room-spray-collection',
                'sku' => 'CARE-SPRAY-26', 'price' => 8800.00, 'sale' => 7500.00, 'qty' => 70, 'featured' => true,
                'summary' => 'Trio of distinctive interior fragrances to elevate residential and office atmospheres.',
                'desc' => 'Includes 50ml spray bottles of Cythera, Istros, and Olous. Formulated with botanical extracts to linger delicately for hours.',
                'img' => 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=800&q=80'
            ],
        ];

        foreach ($catalog as $item) {
            $product = Product::updateOrCreate(
                ['sku' => $item['sku']],
                [
                    'category_id' => $item['cat']->id,
                    'brand_id' => $item['brand']->id,
                    'name' => $item['name'],
                    'slug' => $item['slug'],
                    'type' => 'physical',
                    'summary' => $item['summary'],
                    'description' => $item['desc'],
                    'price' => $item['price'],
                    'sale_price' => $item['sale'],
                    'quantity' => $item['qty'],
                    'is_active' => true,
                    'is_featured' => $item['featured'],
                ]
            );

            // Primary Image
            ProductImage::updateOrCreate(
                ['product_id' => $product->id, 'is_primary' => true],
                ['image_path' => $item['img'], 'sort_order' => 1]
            );

            // Warehouse Inventory Allocation
            Stock::updateOrCreate(
                ['warehouse_id' => $vaultWarehouse->id, 'product_id' => $product->id],
                [
                    'quantity' => $item['qty'],
                    'reserved_quantity' => 0,
                    'low_stock_threshold' => 5,
                ]
            );
        }

        // =====================================================================
        // 13. PROMOTIONS & MARKETING COUPONS
        // =====================================================================
        Coupon::updateOrCreate(
            ['code' => 'CENTERPOINT10'],
            [
                'type' => 'percentage',
                'value' => 10.00,
                'min_order_amount' => 5000.00,
                'max_discount' => 20000.00,
                'usage_limit' => 500,
                'used_count' => 14,
                'starts_at' => now()->subDays(10),
                'expires_at' => now()->addYear(),
                'is_active' => true,
            ]
        );

        Coupon::updateOrCreate(
            ['code' => 'VIPLUXURY'],
            [
                'type' => 'fixed',
                'value' => 2500.00,
                'min_order_amount' => 25000.00,
                'usage_limit' => 200,
                'used_count' => 8,
                'starts_at' => now()->subDays(5),
                'expires_at' => now()->addYear(),
                'is_active' => true,
            ]
        );

        // Flash Sale
        $flashSale = FlashSale::updateOrCreate(
            ['slug' => 'private-salon-2026'],
            [
                'title' => 'Curated Private Salon 2026',
                'starts_at' => now()->subDay(),
                'ends_at' => now()->addDays(7),
                'is_active' => true,
            ]
        );

        $flashProducts = Product::where('is_featured', true)->take(4)->get();
        foreach ($flashProducts as $fp) {
            FlashSaleProduct::updateOrCreate(
                ['flash_sale_id' => $flashSale->id, 'product_id' => $fp->id],
                [
                    'discount_price' => round($fp->price * 0.85, 2),
                    'quantity_limit' => 10,
                    'sold_count' => 2,
                ]
            );
        }

        // =====================================================================
        // 14. VERIFIED 5-STAR PRODUCT REVIEWS
        // =====================================================================
        $firstProduct = Product::where('slug', 'chronometre-souverain-tourbillon')->first();
        if ($firstProduct && $customer) {
            ProductReview::updateOrCreate(
                ['product_id' => $firstProduct->id, 'user_id' => $customer->id],
                [
                    'rating' => 5,
                    'title' => 'Masterpiece of Modern Horology',
                    'comment' => 'The mechanical finishing on the bridge and tourbillon cage is simply sublime. White glove delivery in Dhaka was completed within 18 hours with full provenance documentation.',
                    'is_approved' => true,
                ]
            );
        }

        $secondProduct = Product::where('slug', 'heavyweight-wool-overshirt')->first();
        if ($secondProduct && $customer) {
            ProductReview::updateOrCreate(
                ['product_id' => $secondProduct->id, 'user_id' => $customer->id],
                [
                    'rating' => 5,
                    'title' => 'Impeccable Drape & Fabric Weight',
                    'comment' => 'The merino wool handfeel is warm yet remarkably breathable. Horn buttons and collar structure reflect true bespoke tailoring.',
                    'is_approved' => true,
                ]
            );
        }

        // =====================================================================
        // 15. SAMPLE OPERATIONAL ORDERS (FOR STUDIO ANALYTICS & METRICS)
        // =====================================================================
        try {
            $this->call(SampleOrderSeeder::class);
        } catch (\Throwable) {
            // Handled gracefully if sample orders are already populated
        }

        // =====================================================================
        // 16. DOUBLE-ENTRY ACCOUNTING LEDGER (CHART OF ACCOUNTS)
        // =====================================================================
        $this->call(ChartOfAccountsSeeder::class);
    }
}
