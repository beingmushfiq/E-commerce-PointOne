<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Fulfillment\CourierManager;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Shipment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FulfillmentController extends Controller
{
    public function __construct(
        protected CourierManager $courierManager
    ) {}

    /**
     * Book delivery consignment with selected courier provider.
     */
    public function book(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'courier'  => 'required|string',
            'options'  => 'nullable|array',
        ]);

        $order = Order::findOrFail($validated['order_id']);

        $shipment = $this->courierManager->bookOrderShipment(
            order: $order,
            courier: $validated['courier'],
            options: $validated['options'] ?? []
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Shipment booked successfully',
            'data'    => $shipment,
        ], 201);
    }

    /**
     * Track real-time shipment status by consignment ID or tracking code.
     */
    public function track(Request $request, string $consignmentId): JsonResponse
    {
        $shipment = Shipment::where('consignment_id', $consignmentId)
            ->orWhere('tracking_code', $consignmentId)
            ->firstOrFail();

        $tracking = $this->courierManager->trackOrderShipment($shipment);

        return response()->json([
            'status' => 'success',
            'data'   => [
                'shipment' => $shipment->fresh(),
                'tracking' => $tracking,
            ],
        ]);
    }

    /**
     * Handle incoming courier webhook callbacks.
     */
    public function webhook(Request $request, string $courier): JsonResponse
    {
        $adapter = $this->courierManager->resolve($courier);
        $result = $adapter->handleWebhook($request->all(), $request->headers->all());

        if (($result['handled'] ?? false) && !empty($result['consignment_id'])) {
            $shipment = Shipment::where('consignment_id', $result['consignment_id'])->first();
            if ($shipment) {
                $this->courierManager->trackOrderShipment($shipment);
            }
        }

        return response()->json([
            'status' => 'success',
            'data'   => $result,
        ]);
    }
}
