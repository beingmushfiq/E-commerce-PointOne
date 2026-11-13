<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Edition\EditionManager;
use App\Tenancy\TenantManager;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(EditionManager::class, function () {
            $edition = config('centerpoint.edition', 'standalone');
            $features = config('centerpoint.features', []);
            return new EditionManager($edition, $features);
        });

        $this->app->singleton(TenantManager::class, function ($app) {
            return new TenantManager($app->make(EditionManager::class));
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
