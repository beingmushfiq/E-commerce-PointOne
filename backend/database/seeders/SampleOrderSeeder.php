<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;

class SampleOrderSeeder extends Seeder
{
    public function run(): void
    {
        $customer = User::where('email', 'customer@centerpoint.com')->first()
            ?? User::first();

        $products = Product::take(4)->get();
        if ($products->isEmpty()) {
            return;
        }

        $sampleOrders = [
            [
                'number'  => 'CP-ORD-8921',
                'status'  => 'processing',
                'pay_status' => 'paid',
                'method'  => 'bkash',
                'subtotal'=> 620.00,
                'total'   => 620.00,
                'city'    => 'Gulshan, Dhaka',
                'items'   => [
                    ['p' => $products[0], 'qty' => 1],
                    ['p' => $products[1], 'qty' => 1],
                ],
            ],
            [
                'number'  => 'CP-ORD-8922',
                'status'  => 'shipped',
                'pay_status' => 'paid',
                'method'  => 'sslcommerz',
                'subtotal'=> 240.00,
                'total'   => 240.00,
                'city'    => 'Dhanmondi, Dhaka',
                'items'   => [
                    ['p' => $products[0], 'qty' => 1],
                ],
            ],
            [
                'number'  => 'CP-ORD-8923',
                'status'  => 'delivered',
                'pay_status' => 'paid',
                'method'  => 'nagad',
                'subtotal'=> 380.00,
                'total'   => 380.00,
                'city'    => 'Banani, Dhaka',
                'items'   => [
                    ['p' => $products[1], 'qty' => 1],
                ],
            ],
            [
                'number'  => 'CP-ORD-8924',
                'status'  => 'pending',
                'pay_status' => 'unpaid',
                'method'  => 'cod',
                'subtotal'=> 185.00,
                'total'   => 185.00,
                'city'    => 'Uttara, Dhaka',
                'items'   => [
                    ['p' => $products[2] ?? $products[0], 'qty' => 1],
                ],
            ],
            [
                'number'  => 'CP-ORD-8925',
                'status'  => 'completed',
                'pay_status' => 'paid',
                'method'  => 'bkash',
                'subtotal'=> 565.00,
                'total'   => 565.00,
                'city'    => 'Chattogram City',
                'items'   => [
                    ['p' => $products[0], 'qty' => 1],
                    ['p' => $products[2] ?? $products[0], 'qty' => 1],
                ],
            ],
        ];

        foreach ($sampleOrders as $data) {
            $order = Order::firstOrCreate(
                ['order_number' => $data['number']],
                [
                    'user_id'          => $customer ? $customer->id : null,
                    'status'           => $data['status'],
                    'payment_status'   => $data['pay_status'],
                    'payment_method'   => $data['method'],
                    'subtotal'         => $data['subtotal'],
                    'discount_amount'  => 0.00,
                    'tax_amount'       => 0.00,
                    'shipping_cost'    => 0.00,
                    'grand_total'      => $data['total'],
                    'shipping_address' => [
                        'recipient_name' => $customer ? $customer->name : 'Alexander Wright',
                        'address_line1'  => 'Road 11, House 42',
                        'city'           => $data['city'],
                        'phone'          => '+8801711000000',
                    ],
                    'billing_address'  => [
                        'recipient_name' => $customer ? $customer->name : 'Alexander Wright',
                        'city'           => $data['city'],
                    ],
                ]
            );

            foreach ($data['items'] as $it) {
                $product = $it['p'];
                OrderItem::firstOrCreate(
                    [
                        'order_id'   => $order->id,
                        'product_id' => $product->id,
                    ],
                    [
                        'product_name' => $product->name,
                        'sku'          => $product->sku,
                        'unit_price'   => $product->price,
                        'quantity'     => $it['qty'],
                        'total_price'  => $product->price * $it['qty'],
                    ]
                );
            }
        }
    }
}

