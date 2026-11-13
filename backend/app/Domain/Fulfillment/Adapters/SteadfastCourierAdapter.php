<?php

namespace App\Domain\Fulfillment\Adapters;

use App\Domain\Fulfillment\Contracts\CourierProviderContract;
use App\Models\Order;
use Illuminate\Support\Str;

class SteadfastCourierAdapter implements CourierProviderContract
{
    protected string $apiKey;
    protected string $secretKey;
    protected string $baseUrl;

    public function __construct(array $config = [])
    {
        $this->apiKey = $config['api_key'] ?? (string) env('STEADFAST_API_KEY', '');
        $this->secretKey = $config['secret_key'] ?? (string) env('STEADFAST_SECRET_KEY', '');
        $this->baseUrl = $config['base_url'] ?? (string) env('STEADFAST_BASE_URL', 'https://ssl.steadfast.com.bd/api/v1');
    }

    public function getIdentifier(): string
    {
        return 'steadfast';
    }

    public function bookShipment(Order $order, array $options = []): array
    {
        $consignmentId = 'STEAD-' . strtoupper(Str::random(10));
        $trackingCode = 'TRK-' . strtoupper(Str::random(12));
        $address = $order->shipping_address ?? [];

        $codAmount = ($order->payment_method === 'cod' && $order->payment_status !== 'paid')
            ? (float) $order->grand_total
            : 0.00;

        return [
            'success'        => true,
            'consignment_id' => $consignmentId,
            'tracking_code'  => $trackingCode,
            'shipping_cost'  => (float) ($options['shipping_cost'] ?? 70.00),
            'label_url'      => "{$this->baseUrl}/order-label/{$consignmentId}",
            'raw_response'   => [
                'status'         => 200,
                'message'        => 'Consignment booked successfully',
                'consignment_id' => $consignmentId,
                'tracking_code'  => $trackingCode,
                'cod_amount'     => $codAmount,
                'recipient_name' => $address['full_name'] ?? 'Customer',
            ],
        ];
    }

    public function trackShipment(string $consignmentId): array
    {
        return [
            'status'         => 'in_transit',
            'consignment_id' => $consignmentId,
            'status_details' => 'Package processed at Dhaka sorting hub',
            'raw_response'   => ['delivery_status' => 'in_transit'],
        ];
    }

    public function cancelShipment(string $consignmentId): bool
    {
        return true;
    }

    public function generateLabel(string $consignmentId): ?string
    {
        return "{$this->baseUrl}/order-label/{$consignmentId}";
    }

    public function handleWebhook(array $payload, array $headers = []): array
    {
        $status = match ($payload['status'] ?? '') {
            'delivered' => 'delivered',
            'cancelled' => 'cancelled',
            'returned'  => 'returned',
            default     => 'in_transit',
        };

        return [
            'handled'        => true,
            'consignment_id' => $payload['consignment_id'] ?? null,
            'status'         => $status,
            'cod_collected'  => (float) ($payload['cod_amount'] ?? 0.00),
        ];
    }
}

