<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\AIController;
use App\Http\Controllers\TranscriptController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CollectionController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\HistoryController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\ProviderController as AdminProviderController;
use App\Http\Controllers\Admin\SystemSettingsController as AdminSettingsController;
use App\Http\Middleware\AdminMasterMiddleware;

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

// Inteligência Artificial Local & Busca Semântica (Ollama)
Route::get('/ai/models', [AIController::class, 'models']);
Route::post('/ai/expand', [AIController::class, 'expand']);
Route::post('/ai/synthesize', [AIController::class, 'synthesize']);

// Pesquisa em Transcrições e Timestamps ("Encontrar Trecho")
Route::get('/videos/{platform}/{externalId}/transcript', [TranscriptController::class, 'show']);
Route::post('/videos/{platform}/{externalId}/transcript', [TranscriptController::class, 'store']);
Route::post('/transcript/search', [TranscriptController::class, 'search']);

// Autenticação (Laravel Sanctum)
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
});

// Coleções de Vídeos
Route::get('/collections', [CollectionController::class, 'index']);
Route::post('/collections', [CollectionController::class, 'store']);
Route::put('/collections/{id}', [CollectionController::class, 'update']);
Route::delete('/collections/{id}', [CollectionController::class, 'destroy']);

// Vídeos Favoritos
Route::get('/favorites', [FavoriteController::class, 'index']);
Route::post('/favorites', [FavoriteController::class, 'store']);
Route::delete('/favorites/{id}', [FavoriteController::class, 'destroy']);
Route::post('/favorites/{id}/collection', [FavoriteController::class, 'setCollection']);

// Histórico de Pesquisas
Route::get('/history', [HistoryController::class, 'index']);
Route::post('/history', [HistoryController::class, 'store']);
Route::delete('/history', [HistoryController::class, 'clear']);
Route::delete('/history/{id}', [HistoryController::class, 'destroy']);

// Painel Admin Master & Telemetria
Route::prefix('admin')->middleware(AdminMasterMiddleware::class)->group(function () {
    Route::get('/metrics', [AdminDashboardController::class, 'metrics']);
    Route::get('/metrics/export', [AdminDashboardController::class, 'export']);
    Route::get('/providers', [AdminProviderController::class, 'index']);
    Route::post('/providers/{id}/toggle', [AdminProviderController::class, 'toggle']);
    Route::post('/providers/{id}/test', [AdminProviderController::class, 'test']);
    Route::post('/providers/{id}/reset-circuit', [AdminProviderController::class, 'resetCircuit']);
    Route::get('/settings', [AdminSettingsController::class, 'index']);
    Route::put('/settings', [AdminSettingsController::class, 'update']);
    Route::post('/ai/test-inference', [AdminSettingsController::class, 'testInference']);
    Route::post('/cache/flush-all', [AdminSettingsController::class, 'flushAll']);
});
