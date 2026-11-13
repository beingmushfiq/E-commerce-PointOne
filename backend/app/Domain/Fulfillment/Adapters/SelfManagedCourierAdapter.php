<?php

namespace App\Domain\Fulfillment\Adapters;

use App\Domain\Fulfillment\Contracts\CourierProviderContract;
use App\Models\Order;
use Illuminate\Support\Str;

class SelfManagedCourierAdapter implements CourierProviderContract
{
    public function getIdentifier(): string
    {
        return 'self';
    }

    public function bookShipment(Order $order, array $options = []): array
    {
        $consignmentId = 'SELF-' . strtoupper(Str::random(8));
        $trackingCode = 'INT-TRK-' . strtoupper(Str::random(10));

        $codAmount = ($order->payment_method === 'cod' && $order->payment_status !== 'paid')
            ? (float) $order->grand_total
            : 0.00;

        return [
            'success'        => true,
            'consignment_id' => $consignmentId,
            'tracking_code'  => $trackingCode,
            'shipping_cost'  => (float) ($options['shipping_cost'] ?? 50.00),
            'label_url'      => url("/api/v1/fulfillment/label/{$consignmentId}"),
            'raw_response'   => [
                'type'           => 'self_managed_fleet',
                'assigned_rider' => $options['rider_name'] ?? 'In-House Courier Staff',
                'cod_to_collect' => $codAmount,
            ],
        ];
    }

    public function trackShipment(string $consignmentId): array
    {
        return [
            'status'         => 'out_for_delivery',
            'consignment_id' => $consignmentId,
            'status_details' => 'Delivery rider en route to customer destination',
            'raw_response'   => ['delivery_mode' => 'internal_fleet'],
        ];
    }

    public function cancelShipment(string $consignmentId): bool
    {
        return true;
    }

    public function generateLabel(string $consignmentId): ?string
    {
        return url("/api/v1/fulfillment/label/{$consignmentId}");
    }

    public function handleWebhook(array $payload, array $headers = []): array
    {
        return ['handled' => true, 'status' => 'acknowledged'];
    }
}

