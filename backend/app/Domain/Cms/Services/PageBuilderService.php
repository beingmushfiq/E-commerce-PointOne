<?php

namespace App\Domain\Cms\Services;

use App\Models\Cms\PageVersion;
use App\Models\Page;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class PageBuilderService
{
    /**
     * Update page sections and custom code as draft.
     */
    public function saveDraft(
        Page $page,
        array $sections,
        ?string $customCss = null,
        ?string $customJs = null,
        ?int $userId = null
    ): Page {
        $this->validateSections($sections);

        $page->update([
            'sections'   => $sections,
            'custom_css' => $customCss,
            'custom_js'  => $customJs,
        ]);

        return $page->fresh();
    }

    /**
     * Publish current page state and record an immutable version history record.
     */
    public function publishPage(Page $page, ?string $notes = null, ?int $userId = null): PageVersion
    {
        return DB::transaction(function () use ($page, $notes, $userId) {
            $currentVersion = $page->version ?: 1;

            // 1. Record snapshot in page_versions
            $version = PageVersion::create([
                'page_id'            => $page->id,
                'version_number'     => $currentVersion,
                'sections'           => $page->sections,
                'custom_css'         => $page->custom_css,
                'custom_js'          => $page->custom_js,
                'notes'              => $notes ?? "Published version {$currentVersion}",
                'created_by_user_id' => $userId,
            ]);

            // 2. Increment page version counter and mark published
            $page->update([
                'version'      => $currentVersion + 1,
                'is_published' => true,
            ]);

            return $version;
        });
    }

    /**
     * Rollback page sections and custom styling to an earlier published version.
     */
    public function rollbackToVersion(Page $page, int $versionNumber): Page
    {
        $version = PageVersion::where('page_id', $page->id)
            ->where('version_number', $versionNumber)
            ->firstOrFail();

        $page->update([
            'sections'   => $version->sections,
            'custom_css' => $version->custom_css,
            'custom_js'  => $version->custom_js,
        ]);

        return $page->fresh();
    }

    /**
     * Validate section schema structure.
     */
    protected function validateSections(array $sections): void
    {
        $allowedTypes = [
            'hero',
            'featured_products',
            'banner_grid',
            'sandboxed_embed',
            'testimonials',
            'faq',
            'rich_text',
            'newsletter',
        ];

        foreach ($sections as $index => $section) {
            if (!is_array($section) || !isset($section['id']) || !isset($section['type'])) {
                throw new InvalidArgumentException(
                    "Section at index {$index} must contain an 'id' and 'type' identifier."
                );
            }

            if (!in_array($section['type'], $allowedTypes)) {
                throw new InvalidArgumentException(
                    "Unsupported section type [{$section['type']}] at index {$index}."
                );
            }
        }
    }
}

