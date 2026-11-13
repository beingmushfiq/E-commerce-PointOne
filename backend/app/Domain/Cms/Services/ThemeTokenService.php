<?php

namespace App\Domain\Cms\Services;

use App\Models\Cms\ThemeConfig;

class ThemeTokenService
{
    /**
     * Get active theme configuration, falling back to Centerpoint default luxury tokens.
     */
    public function getActiveTheme(): ThemeConfig
    {
        $theme = ThemeConfig::where('is_active', true)->first();

        if ($theme) {
            return $theme;
        }

        return new ThemeConfig([
            'name'       => 'Centerpoint Obsidian Noir',
            'is_active'  => true,
            'tokens'     => $this->getDefaultTokens(),
            'custom_css' => '',
        ]);
    }

    /**
     * Generate CSS variable declarations from design tokens.
     */
    public function generateCssVariables(ThemeConfig $theme): string
    {
        $tokens = array_merge($this->getDefaultTokens(), $theme->tokens ?? []);
        $cssLines = [":root {"];

        // Colors
        if (!empty($tokens['colors'])) {
            foreach ($tokens['colors'] as $key => $val) {
                $cssLines[] = "  --cp-color-{$key}: {$val};";
            }
        }

        // Typography
        if (!empty($tokens['fonts'])) {
            foreach ($tokens['fonts'] as $key => $val) {
                $cssLines[] = "  --cp-font-{$key}: {$val};";
            }
        }

        // Border Radius & Spacing
        if (!empty($tokens['borderRadius'])) {
            foreach ($tokens['borderRadius'] as $key => $val) {
                $cssLines[] = "  --cp-radius-{$key}: {$val};";
            }
        }

        $cssLines[] = "}";

        if (!empty($theme->custom_css)) {
            $cssLines[] = $theme->custom_css;
        }

        return implode("\n", $cssLines);
    }

    /**
     * Default design system tokens.
     */
    public function getDefaultTokens(): array
    {
        return [
            'colors' => [
                'primary'       => '#111827',
                'primary-hover' => '#1f2937',
                'accent'        => '#d97706',
                'accent-hover'  => '#b45309',
                'background'    => '#ffffff',
                'surface'       => '#f9fafb',
                'text'          => '#111827',
                'text-muted'    => '#6b7280',
                'border'        => '#e5e7eb',
            ],
            'fonts' => [
                'sans'    => "'Inter', system-ui, -apple-system, sans-serif",
                'heading' => "'Playfair Display', Georgia, serif",
                'mono'    => "'JetBrains Mono', monospace",
            ],
            'borderRadius' => [
                'sm' => '0.25rem',
                'md' => '0.5rem',
                'lg' => '1.0rem',
                'full' => '9999px',
            ],
        ];
    }
}

