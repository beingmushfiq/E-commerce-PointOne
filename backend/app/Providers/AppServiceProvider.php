<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Edition\EditionManager;
use App\Tenancy\TenantManager;
use App\Domain\Payments\PaymentGatewayManager;
use App\Domain\Fulfillment\CourierManager;
use App\Services\OrderStateMachine;
use App\Domain\Accounting\Services\JournalEntryService;
use App\Domain\Accounting\Services\FinancialReportService;
use App\Domain\Accounting\Services\CommerceLedgerBridge;

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

        $this->app->singleton(JournalEntryService::class, function () {
            return new JournalEntryService();
        });

        $this->app->singleton(FinancialReportService::class, function () {
            return new FinancialReportService();
        });

        $this->app->singleton(CommerceLedgerBridge::class, function ($app) {
            return new CommerceLedgerBridge($app->make(JournalEntryService::class));
        });

        $this->app->singleton(PaymentGatewayManager::class, function ($app) {
            return new PaymentGatewayManager($app->make(CommerceLedgerBridge::class));
        });

        $this->app->singleton(CourierManager::class, function ($app) {
            return new CourierManager(
                $app->make(OrderStateMachine::class),
                $app->make(CommerceLedgerBridge::class)
            );
        });

        $this->app->singleton(\App\Domain\Ai\AiAssistantManager::class, function () {
            $classifier = new \App\Domain\Ai\Services\BilingualIntentClassifier();
            $retriever = new \App\Domain\Ai\Services\CatalogKnowledgeRetriever();
            $local = new \App\Domain\Ai\Adapters\LocalDeterministicAssistant($classifier, $retriever);
            return new \App\Domain\Ai\AiAssistantManager($local);
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
