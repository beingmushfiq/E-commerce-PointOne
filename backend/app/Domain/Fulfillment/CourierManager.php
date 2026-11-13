<?php

namespace App\Domain\Fulfillment;

use App\Domain\Accounting\Services\CommerceLedgerBridge;
use App\Domain\Fulfillment\Adapters\PathaoCourierAdapter;
use App\Domain\Fulfillment\Adapters\RedXCourierAdapter;
use App\Domain\Fulfillment\Adapters\SelfManagedCourierAdapter;
use App\Domain\Fulfillment\Adapters\SteadfastCourierAdapter;
use App\Domain\Fulfillment\Adapters\TestCourierAdapter;
use App\Domain\Fulfillment\Contracts\CourierProviderContract;
use App\Domain\Fulfillment\Exceptions\ShipmentBookingFailedException;
use App\Models\Order;
use App\Models\Shipment;
use App\Services\OrderStateMachine;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class CourierManager
{
    /** @var array<string, CourierProviderContract> */
    protected array $adapters = [];

    public function __construct(
        protected ?OrderStateMachine $orderStateMachine = null,
        protected ?CommerceLedgerBridge $ledgerBridge = null
    ) {
        $this->registerDefaultAdapters();
    }

    protected function registerDefaultAdapters(): void
    {
        $this->adapters['steadfast'] = new SteadfastCourierAdapter();
        $this->adapters['pathao'] = new PathaoCourierAdapter();
        $this->adapters['redx'] = new RedXCourierAdapter();
        $this->adapters['self'] = new SelfManagedCourierAdapter();
        $this->adapters['test'] = new TestCourierAdapter(true);
    }

    public function registerAdapter(string $name, CourierProviderContract $adapter): void
    {
        $this->adapters[strtolower($name)] = $adapter;
    }

    public function resolve(string $courier): CourierProviderContract
    {
        $key = strtolower($courier);

        if (!isset($this->adapters[$key])) {
            throw new InvalidArgumentException("Courier provider [{$courier}] is not supported or active.");
        }

        return $this->adapters[$key];
    }

    /**
     * Book delivery consignment and record shipment in database.
     *
     * @throws ShipmentBookingFailedException
     */
    public function bookOrderShipment(Order $order, string $courier, array $options = []): Shipment
    {
        $adapter = $this->resolve($courier);
        $result = $adapter->bookShipment($order, $options);

        if (!($result['success'] ?? false)) {
            throw new ShipmentBookingFailedException(
                "Courier booking rejected for order #{$order->order_number}",
                courier: $courier,
                responsePayload: $result['raw_response'] ?? []
            );
        }

        return DB::transaction(function () use ($order, $courier, $result, $options) {
            $codAmount = ($order->payment_method === 'cod' && $order->payment_status !== 'paid')
                ? (float) $order->grand_total
                : 0.00;

            $shipment = Shipment::create([
                'order_id'         => $order->id,
                'courier_name'     => $courier,
                'consignment_id'   => $result['consignment_id'],
                'tracking_code'    => $result['tracking_code'],
                'status'           => 'booked',
                'cod_amount'       => $codAmount,
                'shipping_cost'    => $result['shipping_cost'] ?? 0.00,
                'label_url'        => $result['label_url'] ?? null,
                'pickup_address'   => $options['pickup_address'] ?? null,
                'delivery_address' => $order->shipping_address ?? [],
                'courier_response' => $result['raw_response'] ?? [],
            ]);

            // Transition order status to 'processing' or 'ready_for_shipment' if applicable
            if ($this->orderStateMachine && $this->orderStateMachine->canTransition($order, 'ready_for_shipment')) {
                $this->orderStateMachine->transition(
                    order: $order,
                    newStatus: 'ready_for_shipment',
                    actorType: 'staff',
                    reason: "Consignment {$result['consignment_id']} booked via {$courier}"
                );
            }

            return $shipment;
        });
    }

    /**
     * Track and synchronize shipment status.
     */
    public function trackOrderShipment(Shipment $shipment): array
    {
        $adapter = $this->resolve($shipment->courier_name);
        $tracking = $adapter->trackShipment($shipment->consignment_id);

        if (isset($tracking['status']) && $tracking['status'] !== $shipment->status) {
            $shipment->update([
                'status'           => $tracking['status'],
                'courier_response' => array_merge($shipment->courier_response ?? [], $tracking['raw_response'] ?? []),
            ]);

            // If delivered, update order status if applicable
            if ($tracking['status'] === 'delivered') {
                if ($this->orderStateMachine && $this->orderStateMachine->canTransition($shipment->order, 'delivered')) {
                    $this->orderStateMachine->transition(
                        order: $shipment->order,
                        newStatus: 'delivered',
                        actorType: 'courier',
                        reason: "Delivered by {$shipment->courier_name}"
                    );
                }

                // Record COGS & inventory reduction in double-entry ledger
                $this->ledgerBridge?->recordOrderFulfillment($shipment->order);
            }
        }

        return $tracking;
    }
}

