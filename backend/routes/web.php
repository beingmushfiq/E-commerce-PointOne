<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\V1\SeoController;

Route::get('/', function () {
    return view('welcome');
});

// Authoritative Root Crawl Endpoints
Route::get('/sitemap.xml', [SeoController::class, 'sitemap']);
Route::get('/robots.txt', [SeoController::class, 'robotsTxt']);
