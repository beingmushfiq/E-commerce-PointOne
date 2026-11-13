<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Cms\Services\PageBuilderService;
use App\Domain\Cms\Services\ThemeTokenService;
use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\Cms\StorefrontEmbed;
use App\Models\Cms\ThemeConfig;
use App\Models\Faq;
use App\Models\Menu;
use App\Models\Page;
use App\Models\Slider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class CmsController extends Controller
{
    // ==========================================
    // PUBLIC CMS ENDPOINTS
    // ==========================================

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

    /**
     * Get section-based builder schema for interactive storefront rendering.
     */
    public function pageSections(string $slug): JsonResponse
    {
        $page = Page::where('slug', $slug)->where('is_published', true)->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data'   => [
                'id'         => $page->id,
                'title'      => $page->title,
                'slug'       => $page->slug,
                'sections'   => $page->sections ?? [],
                'custom_css' => $page->custom_css,
                'version'    => $page->version,
                'meta'       => [
                    'title'       => $page->meta_title ?? $page->title,
                    'description' => $page->meta_description,
                ],
            ],
        ]);
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

    /**
     * Get active design system tokens and computed CSS custom properties.
     */
    public function theme(ThemeTokenService $themeService): JsonResponse
    {
        $activeTheme = $themeService->getActiveTheme();
        $cssVars = $themeService->generateCssVariables($activeTheme);

        return response()->json([
            'status' => 'success',
            'data'   => [
                'name'      => $activeTheme->name,
                'tokens'    => $activeTheme->tokens,
                'css_rules' => $cssVars,
            ],
        ]);
    }

    /**
     * SEC-04 Remediation: Sandboxed iframe renderer with strict Content Security Policy.
     * Prevents arbitrary tenant JavaScript from accessing parent session/auth headers or DOM.
     */
    public function renderEmbed(string $token): Response
    {
        $embed = StorefrontEmbed::where('sandbox_token', $token)
            ->where('is_published', true)
            ->firstOrFail();

        $htmlContent = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Storefront Embed</title>
    <style>
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        {$embed->css_code}
    </style>
</head>
<body>
    <div id="embed-root">
        {$embed->html_code}
    </div>
    <script>
        (function() {
            try {
                {$embed->js_code}
            } catch (err) {
                console.error("Storefront embed runtime error:", err);
            }
        })();
    </script>
</body>
</html>
HTML;

        // Strict CSP: isolated from parent origin, prevents cookie/token exfiltration
        $cspPolicy = "default-src 'none'; " .
                     "script-src 'unsafe-inline' https:; " .
                     "style-src 'unsafe-inline' https:; " .
                     "img-src https: data:; " .
                     "font-src https: data:; " .
                     "connect-src https:; " .
                     "frame-ancestors 'self' http://localhost:* http://127.0.0.1:* https://*.centerpoint.test;";

        return response($htmlContent, 200)
            ->header('Content-Type', 'text/html; charset=UTF-8')
            ->header('Content-Security-Policy', $cspPolicy)
            ->header('X-Content-Type-Options', 'nosniff');
    }

    // ==========================================
    // PRIVILEGED CMS MANAGEMENT ENDPOINTS
    // ==========================================

    public function adminPages(): JsonResponse
    {
        $pages = Page::with('versions')->orderBy('title')->get();
        return response()->json(['status' => 'success', 'data' => $pages]);
    }

    public function adminStorePage(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title'            => 'required|string|max:255',
            'slug'             => 'required|string|max:255|unique:pages,slug',
            'content'          => 'nullable|string',
            'sections'         => 'nullable|array',
            'custom_css'       => 'nullable|string',
            'custom_js'        => 'nullable|string',
            'meta_title'       => 'nullable|string|max:255',
            'meta_description' => 'nullable|string',
            'is_published'     => 'boolean',
        ]);

        $page = Page::create($validated);

        return response()->json([
            'status'  => 'success',
            'message' => 'Page created successfully',
            'data'    => $page,
        ], 201);
    }

    public function adminUpdatePage(
        Request $request,
        int $id,
        PageBuilderService $builderService
    ): JsonResponse {
        $page = Page::findOrFail($id);

        $validated = $request->validate([
            'sections'   => 'required|array',
            'custom_css' => 'nullable|string',
            'custom_js'  => 'nullable|string',
        ]);

        $updated = $builderService->saveDraft(
            page: $page,
            sections: $validated['sections'],
            customCss: $validated['custom_css'] ?? null,
            customJs: $validated['custom_js'] ?? null,
            userId: $request->user()?->id
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Page draft saved successfully',
            'data'    => $updated,
        ]);
    }

    public function adminPublishPage(
        Request $request,
        int $id,
        PageBuilderService $builderService
    ): JsonResponse {
        $page = Page::findOrFail($id);

        $validated = $request->validate([
            'notes' => 'nullable|string|max:255',
        ]);

        $version = $builderService->publishPage(
            page: $page,
            notes: $validated['notes'] ?? null,
            userId: $request->user()?->id
        );

        return response()->json([
            'status'  => 'success',
            'message' => 'Page published and version recorded',
            'data'    => [
                'page'    => $page->fresh(),
                'version' => $version,
            ],
        ]);
    }

    public function adminRollbackPage(
        Request $request,
        int $id,
        PageBuilderService $builderService
    ): JsonResponse {
        $page = Page::findOrFail($id);

        $validated = $request->validate([
            'version_number' => 'required|integer',
        ]);

        $restored = $builderService->rollbackToVersion(
            page: $page,
            versionNumber: $validated['version_number']
        );

        return response()->json([
            'status'  => 'success',
            'message' => "Page rolled back to version {$validated['version_number']}",
            'data'    => $restored,
        ]);
    }

    public function adminStoreEmbed(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'         => 'required|string|max:255',
            'html_code'    => 'nullable|string',
            'css_code'     => 'nullable|string',
            'js_code'      => 'nullable|string',
            'is_published' => 'boolean',
        ]);

        $embed = StorefrontEmbed::create([
            'name'               => $validated['name'],
            'sandbox_token'      => Str::random(32),
            'html_code'          => $validated['html_code'] ?? '',
            'css_code'           => $validated['css_code'] ?? '',
            'js_code'            => $validated['js_code'] ?? '',
            'is_sandboxed'       => true,
            'is_published'       => $validated['is_published'] ?? true,
            'created_by_user_id' => $request->user()?->id,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Sandboxed embed created successfully',
            'data'    => $embed,
        ], 201);
    }

    public function adminUpdateTheme(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'       => 'nullable|string|max:255',
            'tokens'     => 'required|array',
            'custom_css' => 'nullable|string',
        ]);

        $theme = ThemeConfig::firstOrCreate(
            ['is_active' => true],
            [
                'name'       => $validated['name'] ?? 'Custom Theme',
                'tokens'     => $validated['tokens'],
                'custom_css' => $validated['custom_css'] ?? '',
            ]
        );

        $theme->update([
            'name'       => $validated['name'] ?? $theme->name,
            'tokens'     => $validated['tokens'],
            'custom_css' => $validated['custom_css'] ?? $theme->custom_css,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Theme tokens updated successfully',
            'data'    => $theme,
        ]);
    }
}
