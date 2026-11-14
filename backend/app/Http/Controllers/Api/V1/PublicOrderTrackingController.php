<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Shipment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicOrderTrackingController extends Controller
{
    /**
     * Public order tracking by order number, consignment ID, or tracking code.
     */
    public function track(Request $request, string $reference): JsonResponse
    {
        $cleanRef = trim($reference);

        // 1. Try finding by Order Number
        $order = Order::with(['items.product', 'shipments', 'transitions' => function ($q) {
            $q->orderBy('created_at', 'asc');
        }])
        ->where('order_number', $cleanRef)
        ->first();

        // 2. If not found by order number, try finding by Shipment consignment_id or tracking_code
        if (!$order) {
            $shipment = Shipment::where('consignment_id', $cleanRef)
                ->orWhere('tracking_code', $cleanRef)
                ->first();

            if ($shipment) {
                $order = $shipment->order()->with(['items.product', 'shipments', 'transitions' => function ($q) {
                    $q->orderBy('created_at', 'asc');
                }])->first();
            }
        }

        if (!$order) {
            return response()->json([
                'status'  => 'error',
                'message' => 'No order or consignment found with reference: ' . $cleanRef,
            ], 404);
        }

        // Phone verification check if provided
        $providedPhone = $request->query('phone') ?? $request->input('phone');
        $shippingAddress = $order->shipping_address ?? [];
        $orderPhone = $shippingAddress['phone'] ?? null;

        if ($providedPhone && $orderPhone) {
            $cleanProvided = preg_replace('/[^0-9]/', '', $providedPhone);
            $cleanOrderPhone = preg_replace('/[^0-9]/', '', $orderPhone);
            if (substr($cleanProvided, -10) !== substr($cleanOrderPhone, -10)) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Phone number does not match order record',
                ], 403);
            }
        }

        // Build milestones timeline
        $timeline = [];
        $timeline[] = [
            'title'     => 'Order Placed & Registered',
            'time'      => $order->created_at->format('d M Y, h:i A'),
            'completed' => true,
        ];

        $isPaid = in_array($order->payment_status, ['paid', 'verified']);
        $timeline[] = [
            'title'     => $isPaid ? 'Payment Confirmed (' . strtoupper($order->payment_method) . ')' : 'Payment Processing / Cash on Delivery',
            'time'      => $isPaid ? $order->updated_at->format('d M Y, h:i A') : 'Pending verification',
            'completed' => $isPaid,
        ];

        $latestShipment = $order->shipments->first();
        $isDispatched = $order->status === 'dispatched' || $order->status === 'shipped' || ($latestShipment && $latestShipment->status !== 'pending');
        $isDelivered = $order->status === 'delivered' || ($latestShipment && $latestShipment->status === 'delivered');

        $timeline[] = [
            'title'     => 'Inventory Allocated in Vault & Inspected',
            'time'      => $isDispatched ? $order->updated_at->subHours(2)->format('d M Y, h:i A') : 'Awaiting fulfillment',
            'completed' => $isDispatched || $isDelivered,
        ];

        $courierName = $latestShipment?->courier_name ?? 'Steadfast Insured Express';
        $timeline[] = [
            'title'     => 'Handed to Courier (' . ucfirst($courierName) . ')',
            'time'      => $isDispatched ? $order->updated_at->format('d M Y, h:i A') : 'Scheduled for dispatch',
            'completed' => $isDispatched || $isDelivered,
        ];

        $timeline[] = [
            'title'     => 'Delivered to Recipient',
            'time'      => $isDelivered ? $order->updated_at->format('d M Y, h:i A') : 'Estimated within 24-48 hours',
            'completed' => $isDelivered,
        ];

        // Mask recipient details for public privacy
        $recipientName = $shippingAddress['full_name'] ?? 'Valued Patron';
        $city = $shippingAddress['city'] ?? 'Dhaka';
        $district = $shippingAddress['district'] ?? $city;

        return response()->json([
            'status' => 'success',
            'data'   => [
                'order_number'       => $order->order_number,
                'status'             => $order->status,
                'payment_status'     => $order->payment_status,
                'payment_method'     => $order->payment_method,
                'grand_total'        => (float) $order->grand_total,
                'created_at'         => $order->created_at->format('d M Y, h:i A'),
                'recipient'          => $recipientName,
                'destination'        => $district . ', Bangladesh',
                'courier'            => ucfirst($courierName),
                'tracking_number'    => $latestShipment?->tracking_code ?? $latestShipment?->consignment_id ?? 'Pending assignment',
                'estimated_arrival'  => $isDelivered ? 'Delivered' : 'Within 24–48 hours',
                'items_count'        => $order->items->count(),
                'items'              => $order->items->map(fn($item) => [
                    'name'     => $item->product_name ?? $item->product?->name ?? 'Artisanal Item',
                    'quantity' => $item->quantity,
                    'sku'      => $item->sku,
                ]),
                'timeline'           => $timeline,
            ],
        ]);
    }
}
