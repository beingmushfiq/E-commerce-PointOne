<?php

namespace App\Services;

use App\Exceptions\InvalidOrderTransitionException;
use App\Models\Order;
use App\Models\OrderHistory;
use App\Models\OrderStateTransition;
use Illuminate\Support\Facades\DB;

class OrderStateMachine
{
    /**
     * Complete deterministic order lifecycle graph.
     */
    protected array $allowedTransitions = [
        'pending' => ['confirmed', 'awaiting_payment', 'processing', 'cancelled'],
        'awaiting_payment' => ['confirmed', 'processing', 'cancelled', 'failed'],
        'confirmed' => ['processing', 'cancelled'],
        'processing' => ['partially_fulfilled', 'ready_for_shipment', 'shipped', 'cancelled'],
        'partially_fulfilled' => ['shipped', 'cancelled'],
        'ready_for_shipment' => ['shipped', 'cancelled'],
        'shipped' => ['partially_delivered', 'delivered', 'failed_delivery', 'returned'],
        'partially_delivered' => ['delivered', 'failed_delivery'],
        'delivered' => ['completed', 'return_requested'],
        'completed' => ['return_requested'],
        'return_requested' => ['returned', 'rejected_return'],
        'returned' => ['refunded', 'partially_refunded'],
        'cancelled' => [],
        'refunded' => [],
        'failed' => ['pending', 'cancelled'],
    ];

    /**
     * Transition an order to a new lifecycle state.
     *
     * @throws InvalidOrderTransitionException
     */
    public function transition(
        Order $order,
        string $newStatus,
        string $actorType = 'system',
        ?int $actorId = null,
        ?string $reason = null,
        array $metadata = []
    ): Order {
        $fromStatus = $order->status;

        if ($fromStatus === $newStatus) {
            return $order;
        }

        $validNextStates = $this->allowedTransitions[$fromStatus] ?? [];

        if (!in_array($newStatus, $validNextStates, true)) {
            throw new InvalidOrderTransitionException(
                "Cannot transition order #{$order->order_number} from status [{$fromStatus}] to [{$newStatus}].",
                fromStatus: $fromStatus,
                toStatus: $newStatus
            );
        }

        return DB::transaction(function () use ($order, $fromStatus, $newStatus, $actorType, $actorId, $reason, $metadata) {
            // 1. Record formal audit state transition
            OrderStateTransition::create([
                'order_id'    => $order->id,
                'from_status' => $fromStatus,
                'to_status'   => $newStatus,
                'actor_type'  => $actorType,
                'actor_id'    => $actorId,
                'reason'      => $reason,
                'metadata'    => $metadata,
            ]);

            // 2. Record legacy history for backwards compatibility
            OrderHistory::create([
                'order_id' => $order->id,
                'status'   => $newStatus,
                'comment'  => $reason ?: "Transitioned from {$fromStatus} to {$newStatus} by {$actorType}",
            ]);

            // 3. Mutate order status
            $order->status = $newStatus;
            $order->save();

            return $order->fresh();
        });
    }

    /**
     * Check if a transition is valid from the current state.
     */
    public function canTransition(Order $order, string $newStatus): bool
    {
        $valid = $this->allowedTransitions[$order->status] ?? [];
        return in_array($newStatus, $valid, true);
    }

    /**
     * Get list of permitted next states for the given order.
     */
    public function getNextStates(Order $order): array
    {
        return $this->allowedTransitions[$order->status] ?? [];
    }
}
