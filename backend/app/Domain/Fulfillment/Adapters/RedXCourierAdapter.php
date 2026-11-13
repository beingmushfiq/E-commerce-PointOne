<?php

namespace App\Domain\Fulfillment\Adapters;

use App\Domain\Fulfillment\Contracts\CourierProviderContract;
use App\Models\Order;
use Illuminate\Support\Str;

class RedXCourierAdapter implements CourierProviderContract
{
    protected string $apiToken;
    protected string $baseUrl;

    public function __construct(array $config = [])
    {
        $this->apiToken = $config['api_token'] ?? (string) env('REDX_API_TOKEN', '');
        $this->baseUrl = $config['base_url'] ?? (string) env('REDX_BASE_URL', 'https://openapi.redx.com.bd/v1.0.0-beta');
    }

    public function getIdentifier(): string
    {
        return 'redx';
    }

    public function bookShipment(Order $order, array $options = []): array
    {
        $trackingId = 'REDX-' . strtoupper(Str::random(10));

        $codAmount = ($order->payment_method === 'cod' && $order->payment_status !== 'paid')
            ? (float) $order->grand_total
            : 0.00;

        return [
            'success'        => true,
            'consignment_id' => $trackingId,
            'tracking_code'  => $trackingId,
            'shipping_cost'  => (float) ($options['shipping_cost'] ?? 75.00),
            'label_url'      => "{$this->baseUrl}/parcels/{$trackingId}/label",
            'raw_response'   => [
                'tracking_id' => $trackingId,
                'cash_collection_amount' => $codAmount,
            ],
        ];
    }

    public function trackShipment(string $consignmentId): array
    {
        return [
            'status'         => 'in_transit',
            'consignment_id' => $consignmentId,
            'status_details' => 'Parcel in transit with RedX fleet',
            'raw_response'   => ['status' => 'in_transit'],
        ];
    }

    public function cancelShipment(string $consignmentId): bool
    {
        return true;
    }

    public function generateLabel(string $consignmentId): ?string
    {
        return "{$this->baseUrl}/parcels/{$consignmentId}/label";
    }

    public function handleWebhook(array $payload, array $headers = []): array
    {
        return [
            'handled'        => true,
            'consignment_id' => $payload['tracking_id'] ?? null,
            'status'         => $payload['status'] ?? 'in_transit',
        ];
    }
}

