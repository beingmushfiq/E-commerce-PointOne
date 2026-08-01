<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Page;
use App\Models\Slider;
use App\Models\Menu;
use App\Models\BlogPost;
use App\Models\Faq;
use Illuminate\Http\JsonResponse;

class CmsController extends Controller
{
    public function sliders(): JsonResponse
    {
        $sliders = Slider::where('is_active', true)->orderBy('sort_order')->get();
        return response()->json(['status' => 'success', 'data' => $sliders]);
    }

    public function menus(): JsonResponse
    {
        $menus = Menu::with('children')
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get();
        return response()->json(['status' => 'success', 'data' => $menus]);
    }

    public function page(string $slug): JsonResponse
    {
        $page = Page::where('slug', $slug)->where('is_published', true)->firstOrFail();
        return response()->json(['status' => 'success', 'data' => $page]);
    }

    public function blogPosts(): JsonResponse
    {
        $posts = BlogPost::with(['category', 'author:id,name'])
            ->where('is_published', true)
            ->latest('published_at')
            ->paginate(10);
        return response()->json(['status' => 'success', 'data' => $posts]);
    }

    public function blogPost(string $slug): JsonResponse
    {
        $post = BlogPost::with(['category', 'author:id,name'])
            ->where('slug', $slug)
            ->where('is_published', true)
            ->firstOrFail();
        return response()->json(['status' => 'success', 'data' => $post]);
    }

    public function faqs(): JsonResponse
    {
        $faqs = Faq::where('is_active', true)->orderBy('sort_order')->get()->groupBy('category');
        return response()->json(['status' => 'success', 'data' => $faqs]);
    }
}
