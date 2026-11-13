<?php

namespace App\Domain\Fulfillment\Contracts;

use App\Models\Order;

interface CourierProviderContract
{
    /**
     * Get unique courier provider identifier (e.g. 'steadfast', 'pathao', 'redx', 'self', 'test').
     */
    public function getIdentifier(): string;

    /**
     * Book an official delivery consignment for the order.
     *
     * @return array{
     *     success: bool,
     *     consignment_id: string,
     *     tracking_code: string,
     *     label_url?: string|null,
     *     shipping_cost?: float,
     *     raw_response?: array
     * }
     */
    public function bookShipment(Order $order, array $options = []): array;

    /**
     * Track real-time delivery status for a consignment.
     *
     * @return array{
     *     status: 'in_transit'|'out_for_delivery'|'delivered'|'returned'|'cancelled'|'pending',
     *     consignment_id: string,
     *     tracking_code?: string|null,
     *     status_details?: string|null,
     *     raw_response?: array
     * }
     */
    public function trackShipment(string $consignmentId): array;

    /**
     * Cancel an active courier shipment booking.
     */
    public function cancelShipment(string $consignmentId): bool;

    /**
     * Generate or fetch packing label / invoice URL.
     */
    public function generateLabel(string $consignmentId): ?string;

    /**
     * Handle courier delivery webhook callback.
     *
     * @return array{
     *     handled: bool,
     *     consignment_id?: string,
     *     status?: string,
     *     cod_collected?: float
     * }
     */
    public function handleWebhook(array $payload, array $headers = []): array;
}

