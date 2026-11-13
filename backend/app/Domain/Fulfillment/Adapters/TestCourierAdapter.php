<?php

namespace App\Domain\Fulfillment\Adapters;

use App\Domain\Fulfillment\Contracts\CourierProviderContract;
use App\Models\Order;
use Illuminate\Support\Str;

class TestCourierAdapter implements CourierProviderContract
{
    public function __construct(
        protected bool $shouldSucceed = true
    ) {}

    public function getIdentifier(): string
    {
        return 'test';
    }

    public function bookShipment(Order $order, array $options = []): array
    {
        $consignmentId = 'TEST-CSG-' . strtoupper(Str::random(8));
        $trackingCode = 'TEST-TRK-' . strtoupper(Str::random(10));

        return [
            'success'        => $this->shouldSucceed,
            'consignment_id' => $consignmentId,
            'tracking_code'  => $trackingCode,
            'shipping_cost'  => 50.00,
            'label_url'      => "https://test-courier.local/label/{$consignmentId}.pdf",
            'raw_response'   => ['test' => true],
        ];
    }

    public function trackShipment(string $consignmentId): array
    {
        return [
            'status'         => 'in_transit',
            'consignment_id' => $consignmentId,
            'status_details' => 'Test courier package in transit',
            'raw_response'   => ['test' => true],
        ];
    }

    public function cancelShipment(string $consignmentId): bool
    {
        return true;
    }

    public function generateLabel(string $consignmentId): ?string
    {
        return "https://test-courier.local/label/{$consignmentId}.pdf";
    }

    public function handleWebhook(array $payload, array $headers = []): array
    {
        return [
            'handled'        => true,
            'consignment_id' => $payload['consignment_id'] ?? 'TEST-CSG-123',
            'status'         => 'delivered',
            'cod_collected'  => (float) ($payload['cod_amount'] ?? 0.00),
        ];
    }
}

