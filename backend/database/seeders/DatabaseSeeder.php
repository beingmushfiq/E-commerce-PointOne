<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Product;
use App\Models\Slider;
use App\Models\Menu;
use App\Models\Faq;
use App\Models\BlogPost;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate existing data cleanly with driver compatibility
        $driver = DB::connection()->getDriverName();
        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
        } elseif ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        }

        DB::table('model_has_roles')->truncate();
        DB::table('role_has_permissions')->truncate();
        User::truncate();
        Role::truncate();
        Permission::truncate();
        Product::truncate();
        Category::truncate();
        Brand::truncate();
        Slider::truncate();
        Menu::truncate();
        Faq::truncate();
        BlogPost::truncate();

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON;');
        } elseif ($driver === 'mysql') {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }

        // 1. Roles & Permissions Setup
        $adminRole = Role::create(['name' => 'admin', 'display_name' => 'Administrator', 'guard_name' => 'web']);
        $customerRole = Role::create(['name' => 'customer', 'display_name' => 'Customer', 'guard_name' => 'web']);

        $perms = [
            'access-admin', 'manage-catalog', 'manage-orders', 'manage-cms', 'manage-users'
        ];
        foreach ($perms as $p) {
            $perm = Permission::create([
                'name' => $p,
                'display_name' => Str::title(str_replace('-', ' ', $p)),
                'group' => 'system',
                'guard_name' => 'web'
            ]);
            $adminRole->permissions()->attach($perm->id);
        }

        // Default Admin User
        $admin = User::create([
            'name' => 'System Admin',
            'email' => 'admin@gmail.com',
            'password' => Hash::make('12345678'),
        ]);
        $admin->assignRole($adminRole);

        // Default Customer User
        $customer = User::create([
            'name' => 'Alexander Wright',
            'email' => 'customer@centerpoint.com',
            'password' => Hash::make('password123'),
        ]);
        $customer->assignRole($customerRole);

        // 2. Sliders
        Slider::create([
            'title' => 'Curated Modern Living',
            'subtitle' => 'Explore Premium Apparel, Home Essentials, Tech Accessories & Lifestyle Goods',
            'image' => 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80',
            'button_text' => 'Explore Collection',
            'button_link' => '/',
            'sort_order' => 1,
            'is_active' => true,
        ]);
        Slider::create([
            'title' => 'Spring / Summer 2026 Collection',
            'subtitle' => 'Tailored Silhouettes in Organic Linen & Lightweight Merino Wool',
            'image' => 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&q=80',
            'button_text' => 'Shop Apparel',
            'button_link' => '/',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        // 3. Menus
        Menu::create(['title' => 'Home', 'url' => '/', 'sort_order' => 1]);
        Menu::create(['title' => 'Fashion & Apparel', 'url' => '/category/fashion', 'sort_order' => 2]);
        Menu::create(['title' => 'Home & Living', 'url' => '/category/home-living', 'sort_order' => 3]);
        Menu::create(['title' => 'Tech & Audio', 'url' => '/category/tech', 'sort_order' => 4]);
        Menu::create(['title' => 'Personal Care', 'url' => '/category/care', 'sort_order' => 5]);

        // 4. FAQs
        Faq::create([
            'question' => 'What is your shipping policy?',
            'answer' => 'We offer complimentary express global shipping on all orders over $150. Standard orders deliver within 3-5 business days.',
            'is_active' => true,
        ]);
        Faq::create([
            'question' => 'How do returns work?',
            'answer' => 'We offer a 30-day hassle-free return window for unworn items in original packaging with prepaid shipping labels.',
            'is_active' => true,
        ]);

        // 5. Blog Posts
        BlogPost::create([
            'author_id' => $admin->id,
            'title' => 'The Art of Tactile Minimalist Interior Design',
            'slug' => 'art-of-tactile-minimalist-interior-design',
            'excerpt' => 'Discover how textured ceramics, natural timber, and warm lighting create serene spaces.',
            'content' => 'Full architectural principles behind modern Scandinavian interior curation...',
            'is_published' => true,
        ]);

        // 6. Categories
        $fashion = Category::create(['name' => 'Fashion & Apparel', 'slug' => 'fashion', 'is_featured' => true]);
        $homeLiving = Category::create(['name' => 'Home & Living', 'slug' => 'home-living', 'is_featured' => true]);
        $tech = Category::create(['name' => 'Tech Accessories', 'slug' => 'tech', 'is_featured' => true]);
        $care = Category::create(['name' => 'Personal Care', 'slug' => 'care', 'is_featured' => true]);

        // 7. Brands
        $nordic = Brand::create(['name' => 'Nordic Studio', 'slug' => 'nordic', 'is_featured' => true]);
        $aesop = Brand::create(['name' => 'Aesop Studio', 'slug' => 'aesop', 'is_featured' => true]);
        $minimal = Brand::create(['name' => 'Minimal Goods', 'slug' => 'minimal', 'is_featured' => true]);

        // --- 25+ PRODUCTS CATALOG ---
        $productsData = [
            // Fashion & Apparel (7 items)
            [
                'cat' => $fashion, 'brand' => $nordic, 'name' => 'Heavyweight Wool Overshirt', 'slug' => 'heavyweight-wool-overshirt',
                'sku' => 'WOOL-SHIRT-01', 'price' => 240.00, 'sale' => 195.00, 'qty' => 40, 'featured' => true,
                'summary' => 'Tailored from 100% organic merino wool with a relaxed silhouette.',
                'desc' => 'A versatile layering piece crafted for crisp morning walks and effortless evening style. Features horn buttons and dual chest pockets.',
                'img' => 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80'
            ],
            [
                'cat' => $fashion, 'brand' => $minimal, 'name' => 'Minimalist Leather Tote Bag', 'slug' => 'minimalist-leather-tote-bag',
                'sku' => 'BAG-TOTE-02', 'price' => 380.00, 'sale' => null, 'qty' => 18, 'featured' => true,
                'summary' => 'Full-grain Italian leather carryall with reinforced handles.',
                'desc' => 'Spacious main compartment holds your daily essentials, laptop, and notebook. Handcrafted with subtle edge painting.',
                'img' => 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80'
            ],
            [
                'cat' => $fashion, 'brand' => $nordic, 'name' => 'Tailored Linen Trouser', 'slug' => 'tailored-linen-trouser',
                'sku' => 'PANTS-LINEN-03', 'price' => 185.00, 'sale' => 150.00, 'qty' => 25, 'featured' => false,
                'summary' => 'Breathable Belgian linen pants featuring a pleated front.',
                'desc' => 'Cut for a relaxed straight fit, ideal for warm climates and relaxed business meetings.',
                'img' => 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80'
            ],
            [
                'cat' => $fashion, 'brand' => $minimal, 'name' => 'Structured Cashmere Knit Sweater', 'slug' => 'structured-cashmere-knit-sweater',
                'sku' => 'SWEATER-CASH-04', 'price' => 310.00, 'sale' => null, 'qty' => 15, 'featured' => true,
                'summary' => 'Pure Grade-A Mongolian cashmere pullover sweater.',
                'desc' => 'Incredibly soft hand-feel with ribbed collar, cuffs, and hem for longevity.',
                'img' => 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80'
            ],
            [
                'cat' => $fashion, 'brand' => $nordic, 'name' => 'Canvas Weekender Duffle Bag', 'slug' => 'canvas-weekender-duffle-bag',
                'sku' => 'BAG-WEEKEND-05', 'price' => 220.00, 'sale' => 180.00, 'qty' => 30, 'featured' => false,
                'summary' => 'Heavy-duty waxed cotton canvas bag with vegetable-tanned leather accents.',
                'desc' => 'Includes luggage tag, brass hardware, and detachable shoulder strap.',
                'img' => 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80'
            ],
            [
                'cat' => $fashion, 'brand' => $minimal, 'name' => 'Classic Leather Chelsea Boot', 'slug' => 'classic-leather-chelsea-boot',
                'sku' => 'SHOES-CHELSEA-06', 'price' => 290.00, 'sale' => null, 'qty' => 20, 'featured' => false,
                'summary' => 'Goodyear welted leather ankle boots with durable elastic side gores.',
                'desc' => 'Hand-burnished leather finish with a comfortable stacked leather heel.',
                'img' => 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800&q=80'
            ],
            [
                'cat' => $fashion, 'brand' => $nordic, 'name' => 'Organic Cotton Oxford Shirt', 'slug' => 'organic-cotton-oxford-shirt',
                'sku' => 'SHIRT-OXFORD-07', 'price' => 125.00, 'sale' => 99.00, 'qty' => 50, 'featured' => false,
                'summary' => 'Pre-shrunk organic cotton shirt with crisp button-down collar.',
                'desc' => 'Timeless wardrobe staple designed for effortless layering across seasons.',
                'img' => 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80'
            ],

            // Home & Living (7 items)
            [
                'cat' => $homeLiving, 'brand' => $nordic, 'name' => 'Handcrafted Matte Ceramic Teapot', 'slug' => 'handcrafted-matte-ceramic-teapot',
                'sku' => 'CERAMIC-POT-08', 'price' => 115.00, 'sale' => 95.00, 'qty' => 30, 'featured' => true,
                'summary' => 'Japanese-inspired stoneware with a brass handle and integrated filter.',
                'desc' => 'Each piece is individually wheel-thrown and finished with a satin tactile glaze. Perfect for slow morning tea rituals.',
                'img' => 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&q=80'
            ],
            [
                'cat' => $homeLiving, 'brand' => $minimal, 'name' => 'Solid Oak Desk Organizer', 'slug' => 'solid-oak-desk-organizer',
                'sku' => 'OAK-DESK-09', 'price' => 85.00, 'sale' => null, 'qty' => 60, 'featured' => false,
                'summary' => 'Carved from sustainably harvested European white oak.',
                'desc' => 'Keep your workspace tidy with custom slots for pens, phone, keys, and daily stationery.',
                'img' => 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80'
            ],
            [
                'cat' => $homeLiving, 'brand' => $nordic, 'name' => 'Sculptural Brass Desk Lamp', 'slug' => 'sculptural-brass-desk-lamp',
                'sku' => 'LAMP-BRASS-10', 'price' => 260.00, 'sale' => 210.00, 'qty' => 12, 'featured' => true,
                'summary' => 'Dimmable warm LED fixture with brushed solid brass shade.',
                'desc' => 'Adjustable arm provides targeted task illumination for quiet reading or design work.',
                'img' => 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80'
            ],
            [
                'cat' => $homeLiving, 'brand' => $minimal, 'name' => 'Minimalist Linen Throw Blanket', 'slug' => 'minimalist-linen-throw-blanket',
                'sku' => 'HOME-BLANKET-11', 'price' => 140.00, 'sale' => null, 'qty' => 35, 'featured' => false,
                'summary' => 'Washed stonewashed French flax linen throw with subtle fringe detail.',
                'desc' => 'Lightweight yet insulating for couch lounging or bed layering.',
                'img' => 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80'
            ],
            [
                'cat' => $homeLiving, 'brand' => $nordic, 'name' => 'Hand-Poured Soy Scented Candle', 'slug' => 'hand-poured-soy-scented-candle',
                'sku' => 'CANDLE-SOY-12', 'price' => 48.00, 'sale' => null, 'qty' => 100, 'featured' => false,
                'summary' => 'Scent notes of Hinoki wood, amber resin, and wild lavender.',
                'desc' => 'Poured into a reusable matte black ceramic vessel with a natural cotton wick.',
                'img' => 'https://images.unsplash.com/photo-1603006905003-be475563bc59?w=800&q=80'
            ],
            [
                'cat' => $homeLiving, 'brand' => $minimal, 'name' => 'Architectural Walnut Coffee Table', 'slug' => 'architectural-walnut-coffee-table',
                'sku' => 'FURN-TABLE-13', 'price' => 750.00, 'sale' => 640.00, 'qty' => 5, 'featured' => true,
                'summary' => 'Low-profile solid American walnut coffee table with bevel edges.',
                'desc' => 'Centerpiece for living rooms featuring clean joinery and matte protective seal.',
                'img' => 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=800&q=80'
            ],
            [
                'cat' => $homeLiving, 'brand' => $nordic, 'name' => 'Nordic Ceramic Dinnerware Set', 'slug' => 'nordic-ceramic-dinnerware-set',
                'sku' => 'CERAMIC-SET-14', 'price' => 280.00, 'sale' => null, 'qty' => 22, 'featured' => false,
                'summary' => '16-piece stoneware dinnerware set featuring organic curved edges.',
                'desc' => 'Includes 4 dinner plates, 4 salad plates, 4 bowls, and 4 mugs. Dishwasher and microwave safe.',
                'img' => 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80'
            ],

            // Tech & Audio (6 items)
            [
                'cat' => $tech, 'brand' => $minimal, 'name' => 'Noise-Canceling Wireless Headphones', 'slug' => 'noise-canceling-wireless-headphones',
                'sku' => 'AUDIO-HEADPHONE-15', 'price' => 320.00, 'sale' => 280.00, 'qty' => 45, 'featured' => true,
                'summary' => 'Studio-grade audio with active noise cancellation and 30-hour battery.',
                'desc' => 'Designed with memory foam ear cushions and lightweight aluminum arms for all-day comfort during travel or focused work.',
                'img' => 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80'
            ],
            [
                'cat' => $tech, 'brand' => $minimal, 'name' => 'Aluminum Wireless Charging Pad', 'slug' => 'aluminum-wireless-charging-pad',
                'sku' => 'TECH-CHARGE-16', 'price' => 65.00, 'sale' => null, 'qty' => 90, 'featured' => false,
                'summary' => 'Fast inductive charger wrapped in premium pebble leather.',
                'desc' => 'Streamline your bedside table or desk setup. Powers smartphones and earbuds quickly without tangled cables.',
                'img' => 'https://images.unsplash.com/photo-1622445268121-8a141885b5d8?w=800&q=80'
            ],
            [
                'cat' => $tech, 'brand' => $minimal, 'name' => 'Mechanical Wireless Keyboard', 'slug' => 'mechanical-wireless-keyboard',
                'sku' => 'TECH-KEYBOARD-17', 'price' => 195.00, 'sale' => 165.00, 'qty' => 30, 'featured' => true,
                'summary' => 'Compact 75% layout with hot-swappable tactile switches and RGB lighting.',
                'desc' => 'CNC machined aluminum case with Bluetooth 5.2 and USB-C connectivity.',
                'img' => 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80'
            ],
            [
                'cat' => $tech, 'brand' => $minimal, 'name' => 'Ergonomic Precision Wireless Mouse', 'slug' => 'ergonomic-precision-wireless-mouse',
                'sku' => 'TECH-MOUSE-18', 'price' => 110.00, 'sale' => null, 'qty' => 40, 'featured' => false,
                'summary' => 'MagSpeed electromagnetic scrolling with multi-device pairing.',
                'desc' => 'Contoured palm rest designed for quiet clicks and all-day wrist support.',
                'img' => 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800&q=80'
            ],
            [
                'cat' => $tech, 'brand' => $minimal, 'name' => 'Portable Hi-Fi Bluetooth Speaker', 'slug' => 'portable-hifi-bluetooth-speaker',
                'sku' => 'AUDIO-SPEAKER-19', 'price' => 210.00, 'sale' => 185.00, 'qty' => 28, 'featured' => false,
                'summary' => '360-degree acoustic driver with IP67 water resistance and 20h playback.',
                'desc' => 'Wrapped in acoustically transparent fabric with a leather carrying handle.',
                'img' => 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80'
            ],
            [
                'cat' => $tech, 'brand' => $minimal, 'name' => 'Leather Laptop Sleeve (14-inch)', 'slug' => 'leather-laptop-sleeve-14-inch',
                'sku' => 'TECH-SLEEVE-20', 'price' => 95.00, 'sale' => null, 'qty' => 50, 'featured' => false,
                'summary' => 'Padded microfiber interior with magnetic closure flap.',
                'desc' => 'Tailored specifically for 14-inch MacBook and ultrabooks for scratch-free protection.',
                'img' => 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&q=80'
            ],

            // Personal Care (6 items)
            [
                'cat' => $care, 'brand' => $aesop, 'name' => 'Botanical Hand Wash & Balm Set', 'slug' => 'botanical-hand-wash-balm-set',
                'sku' => 'CARE-SET-21', 'price' => 75.00, 'sale' => 65.00, 'qty' => 80, 'featured' => true,
                'summary' => 'Invigorating cleanser and hydrating balm infused with citrus peel and cedarwood.',
                'desc' => 'Formulated to nourish and soften hands with rich botanical extracts. Presented in signature amber glass pump bottles.',
                'img' => 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80'
            ],
            [
                'cat' => $care, 'brand' => $aesop, 'name' => 'Facial Hydrating Serum & Toner', 'slug' => 'facial-hydrating-serum-toner',
                'sku' => 'CARE-SERUM-22', 'price' => 90.00, 'sale' => null, 'qty' => 60, 'featured' => false,
                'summary' => 'Lightweight antioxidant serum enriched with Vitamin C and Niacinamide.',
                'desc' => 'Absorbs instantly to replenish skin moisture barrier and balance natural tone.',
                'img' => 'https://images.unsplash.com/photo-1608248597309-8d19760773d5?w=800&q=80'
            ],
            [
                'cat' => $care, 'brand' => $aesop, 'name' => 'Cedarwood & Bergamot Body Wash', 'slug' => 'cedarwood-bergamot-body-wash',
                'sku' => 'CARE-BODY-23', 'price' => 45.00, 'sale' => null, 'qty' => 120, 'featured' => false,
                'summary' => 'Gentle low-foaming gel cleanser with earthy woody aromatics.',
                'desc' => 'Cleanses thoroughly without stripping natural essential moisture.',
                'img' => 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=800&q=80'
            ],
            [
                'cat' => $care, 'brand' => $aesop, 'name' => 'Exfoliating Bamboo Body Scrub', 'slug' => 'exfoliating-bamboo-body-scrub',
                'sku' => 'CARE-SCRUB-24', 'price' => 52.00, 'sale' => 44.00, 'qty' => 40, 'featured' => false,
                'summary' => 'Finely milled bamboo stem powder blended with essential oils.',
                'desc' => 'Polishes away dry surface cells leaving skin smooth and deeply radiant.',
                'img' => 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=800&q=80'
            ],
            [
                'cat' => $care, 'brand' => $aesop, 'name' => 'Nourishing Hair Treatment Oil', 'slug' => 'nourishing-hair-treatment-oil',
                'sku' => 'CARE-HAIR-25', 'price' => 60.00, 'sale' => null, 'qty' => 50, 'featured' => false,
                'summary' => 'Concentrated elixir of jojoba, borage seed, and argan oil.',
                'desc' => 'Calms frizz and adds silky luster to dry hair ends without greasy residue.',
                'img' => 'https://images.unsplash.com/photo-1608248597309-8d19760773d5?w=800&q=80'
            ],
            [
                'cat' => $care, 'brand' => $aesop, 'name' => 'Aromatic Room Spray Collection', 'slug' => 'aromatic-room-spray-collection',
                'sku' => 'CARE-SPRAY-26', 'price' => 68.00, 'sale' => 58.00, 'qty' => 70, 'featured' => true,
                'summary' => 'Trio of botanically infused room sprays to transform interior atmospheres.',
                'desc' => 'Includes scents: Istros, Cythera, and Olous in 50ml glass spray bottles.',
                'img' => 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?w=800&q=80'
            ]
        ];

        foreach ($productsData as $data) {
            $prod = Product::create([
                'category_id' => $data['cat']->id,
                'brand_id' => $data['brand']->id,
                'name' => $data['name'],
                'slug' => $data['slug'],
                'sku' => $data['sku'],
                'type' => 'physical',
                'summary' => $data['summary'],
                'description' => $data['desc'],
                'price' => $data['price'],
                'sale_price' => $data['sale'],
                'quantity' => $data['qty'],
                'is_featured' => $data['featured'],
            ]);
            $prod->images()->create([
                'image_path' => $data['img'],
                'is_primary' => true,
            ]);
        }
    }
}
