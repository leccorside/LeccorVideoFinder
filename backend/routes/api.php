<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HealthController;

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

