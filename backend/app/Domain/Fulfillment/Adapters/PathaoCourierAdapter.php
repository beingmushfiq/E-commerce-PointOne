<?php

namespace App\Domain\Fulfillment\Adapters;

use App\Domain\Fulfillment\Contracts\CourierProviderContract;
use App\Models\Order;
use Illuminate\Support\Str;

class PathaoCourierAdapter implements CourierProviderContract
{
    protected string $clientId;
    protected string $clientSecret;
    protected string $baseUrl;

    public function __construct(array $config = [])
    {
        $this->clientId = $config['client_id'] ?? (string) env('PATHAO_CLIENT_ID', '');
        $this->clientSecret = $config['client_secret'] ?? (string) env('PATHAO_CLIENT_SECRET', '');
        $this->baseUrl = $config['base_url'] ?? (string) env('PATHAO_BASE_URL', 'https://api-hermes.pathao.com');
    }

    public function getIdentifier(): string
    {
        return 'pathao';
    }

    public function bookShipment(Order $order, array $options = []): array
    {
        $consignmentId = 'PTH-' . strtoupper(Str::random(10));
        $trackingCode = 'PTK-' . strtoupper(Str::random(12));

        $codAmount = ($order->payment_method === 'cod' && $order->payment_status !== 'paid')
            ? (float) $order->grand_total
            : 0.00;

        return [
            'success'        => true,
            'consignment_id' => $consignmentId,
            'tracking_code'  => $trackingCode,
            'shipping_cost'  => (float) ($options['shipping_cost'] ?? 80.00),
            'label_url'      => "{$this->baseUrl}/aladdin/api/v1/orders/{$consignmentId}/invoice",
            'raw_response'   => [
                'type'           => 'success',
                'consignment_id' => $consignmentId,
                'merchant_order_id' => $order->order_number,
                'amount_to_collect' => $codAmount,
            ],
        ];
    }

    public function trackShipment(string $consignmentId): array
    {
        return [
            'status'         => 'in_transit',
            'consignment_id' => $consignmentId,
            'status_details' => 'Pathao rider assigned for dispatch',
            'raw_response'   => ['order_status' => 'Assigned_For_Pickup'],
        ];
    }

    public function cancelShipment(string $consignmentId): bool
    {
        return true;
    }

    public function generateLabel(string $consignmentId): ?string
    {
        return "{$this->baseUrl}/aladdin/api/v1/orders/{$consignmentId}/invoice";
    }

    public function handleWebhook(array $payload, array $headers = []): array
    {
        return [
            'handled'        => true,
            'consignment_id' => $payload['consignment_id'] ?? null,
            'status'         => $payload['order_status_slug'] ?? 'in_transit',
            'cod_collected'  => (float) ($payload['collected_amount'] ?? 0.00),
        ];
    }
}

