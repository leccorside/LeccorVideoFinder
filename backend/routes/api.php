<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\SearchController;

// Rota de Diagnóstico & Saúde dos Serviços
Route::get('/health', [HealthController::class, 'check']);

// Informações básicas da plataforma
Route::get('/info', function () {
    return response()->json([
        'name' => 'VideoFinder API',
        'version' => '1.0.0',
        'status' => 'operational',
        'design_system' => 'Obsidian Signal',
        'ollama_integration' => [
            'mode' => 'host_native',
            'endpoint' => env('OLLAMA_BASE_URL', 'http://host.docker.internal:11435'),
        ],
    ]);
});

// Mecanismo Universal de Busca
Route::post('/search', [SearchController::class, 'search']);
Route::get('/search/suggestions', [SearchController::class, 'suggestions']);
Route::get('/search/{id}/stream', [SearchController::class, 'stream']);

// Telemetria de Quotas e Gestão de Cache
Route::get('/admin/quota', [SearchController::class, 'quotaStatus']);
Route::post('/admin/cache/clear', [SearchController::class, 'clearCache']);
