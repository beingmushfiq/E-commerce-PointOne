<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Slider;
use App\Models\Faq;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class AdminCmsContentController extends Controller
{
    /**
     * Store a new hero slider.
     */
    public function storeSlider(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'       => 'required|string|max:255',
            'subtitle'    => 'nullable|string|max:500',
            'image'       => 'required|url',
            'button_text' => 'nullable|string|max:100',
            'button_link' => 'nullable|string|max:255',
            'sort_order'  => 'nullable|integer',
            'is_active'   => 'nullable|boolean',
        ]);

        $slider = Slider::create([
            'title'       => $validated['title'],
            'subtitle'    => $validated['subtitle'] ?? null,
            'image'       => $validated['image'],
            'button_text' => $validated['button_text'] ?? 'Explore Collection',
            'button_link' => $validated['button_link'] ?? '/',
            'sort_order'  => $validated['sort_order'] ?? (Slider::max('sort_order') ?? 0) + 1,
            'is_active'   => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Slider created successfully',
            'data'    => $slider,
        ], 201);
    }

    /**
     * Update an existing slider.
     */
    public function updateSlider(Request $request, int $id): JsonResponse
    {
        $slider = Slider::findOrFail($id);

        $validated = $request->validate([
            'title'       => 'nullable|string|max:255',
            'subtitle'    => 'nullable|string|max:500',
            'image'       => 'nullable|url',
            'button_text' => 'nullable|string|max:100',
            'button_link' => 'nullable|string|max:255',
            'sort_order'  => 'nullable|integer',
            'is_active'   => 'nullable|boolean',
        ]);

        $slider->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Slider updated successfully',
            'data'    => $slider,
        ]);
    }

    /**
     * Delete a slider.
     */
    public function destroySlider(int $id): JsonResponse
    {
        $slider = Slider::findOrFail($id);
        $slider->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Slider removed successfully',
        ]);
    }

    /**
     * Store a new FAQ.
     */
    public function storeFaq(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'question'   => 'required|string|max:255',
            'answer'     => 'required|string',
            'category'   => 'nullable|string|max:100',
            'sort_order' => 'nullable|integer',
            'is_active'  => 'nullable|boolean',
        ]);

        $faq = Faq::create([
            'question'   => $validated['question'],
            'answer'     => $validated['answer'],
            'category'   => $validated['category'] ?? 'General',
            'sort_order' => $validated['sort_order'] ?? 1,
            'is_active'  => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'FAQ created successfully',
            'data'    => $faq,
        ], 201);
    }

    /**
     * Update FAQ.
     */
    public function updateFaq(Request $request, int $id): JsonResponse
    {
        $faq = Faq::findOrFail($id);

        $validated = $request->validate([
            'question'   => 'nullable|string|max:255',
            'answer'     => 'nullable|string',
            'category'   => 'nullable|string|max:100',
            'sort_order' => 'nullable|integer',
            'is_active'  => 'nullable|boolean',
        ]);

        $faq->update($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'FAQ updated successfully',
            'data'    => $faq,
        ]);
    }

    /**
     * Delete FAQ.
     */
    public function destroyFaq(int $id): JsonResponse
    {
        $faq = Faq::findOrFail($id);
        $faq->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'FAQ removed successfully',
        ]);
    }
}

