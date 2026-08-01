<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\UserAddress;
use App\Models\Wallet;
use App\Models\Wishlist;
use App\Models\SupportTicket;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class CustomerController extends Controller
{
    // Addresses
    public function addresses(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses;
        return response()->json(['status' => 'success', 'data' => $addresses]);
    }

    public function storeAddress(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'type' => 'nullable|string|in:shipping,billing',
            'full_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address_line_1' => 'required|string|max:255',
            'address_line_2' => 'nullable|string|max:255',
            'city' => 'required|string|max:100',
            'state' => 'nullable|string|max:100',
            'postal_code' => 'required|string|max:20',
            'country' => 'required|string|max:100',
            'is_default' => 'nullable|boolean',
        ]);

        if (!empty($validated['is_default'])) {
            $request->user()->addresses()->update(['is_default' => false]);
        }

        $address = $request->user()->addresses()->create($validated);

        return response()->json(['status' => 'success', 'data' => $address], 201);
    }

    // Wallet
    public function wallet(Request $request): JsonResponse
    {
        $wallet = Wallet::firstOrCreate(
            ['user_id' => $request->user()->id],
            ['balance' => 0.00, 'reward_points' => 0]
        );
        $wallet->load('transactions');

        return response()->json(['status' => 'success', 'data' => $wallet]);
    }

    // Wishlist
    public function wishlist(Request $request): JsonResponse
    {
        $wishlist = Wishlist::with('product.images')
            ->where('user_id', $request->user()->id)
            ->get();

        return response()->json(['status' => 'success', 'data' => $wishlist]);
    }

    public function toggleWishlist(Request $request, int $productId): JsonResponse
    {
        Product::findOrFail($productId);
        $user = $request->user();

        $existing = Wishlist::where('user_id', $user->id)->where('product_id', $productId)->first();

        if ($existing) {
            $existing->delete();
            return response()->json(['status' => 'success', 'message' => 'Removed from wishlist', 'in_wishlist' => false]);
        }

        Wishlist::create([
            'user_id' => $user->id,
            'product_id' => $productId,
        ]);

        return response()->json(['status' => 'success', 'message' => 'Added to wishlist', 'in_wishlist' => true]);
    }

    // Support Tickets
    public function tickets(Request $request): JsonResponse
    {
        $tickets = $request->user()->tickets()->with('messages')->latest()->get();
        return response()->json(['status' => 'success', 'data' => $tickets]);
    }

    public function storeTicket(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'subject' => 'required|string|max:255',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'message' => 'required|string',
        ]);

        $ticket = $request->user()->tickets()->create([
            'ticket_number' => 'TICK-' . strtoupper(Str::random(8)),
            'subject' => $validated['subject'],
            'priority' => $validated['priority'] ?? 'medium',
            'status' => 'open',
        ]);

        $ticket->messages()->create([
            'user_id' => $request->user()->id,
            'message' => $validated['message'],
        ]);

        return response()->json(['status' => 'success', 'data' => $ticket->load('messages')], 201);
    }
}
