<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Http;

class HealthController extends Controller
{
    /**
     * Verifica a conectividade e saúde dos serviços conectados.
     */
    public function check(): JsonResponse
    {
        $services = [
            'api' => [
                'status' => 'healthy',
                'version' => '1.0.0',
                'php_version' => PHP_VERSION,
                'environment' => config('app.env'),
            ],
            'database' => $this->checkDatabase(),
            'redis' => $this->checkRedis(),
            'searxng' => $this->checkSearxng(),
            'ollama_host' => $this->checkOllama(),
        ];

        $isAllHealthy = $services['api']['status'] === 'healthy'
            && $services['database']['status'] === 'healthy'
            && $services['redis']['status'] === 'healthy';

        return response()->json([
            'status' => $isAllHealthy ? 'operational' : 'degraded',
            'timestamp' => now()->toIso8601String(),
            'services' => $services,
        ], $isAllHealthy ? 200 : 207);
    }

    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();
            return [
                'status' => 'healthy',
                'driver' => config('database.default'),
                'database' => config('database.connections.mysql.database'),
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    private function checkRedis(): array
    {
        try {
            Redis::ping();
            return [
                'status' => 'healthy',
                'client' => config('database.redis.client'),
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'unhealthy',
                'error' => $e->getMessage(),
            ];
        }
    }

    private function checkSearxng(): array
    {
        $url = env('SEARXNG_URL', 'http://searxng:8080');
        try {
            $response = Http::timeout(2)->get("{$url}/config");
            return [
                'status' => $response->successful() ? 'healthy' : 'degraded',
                'url' => $url,
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'unreachable',
                'url' => $url,
                'note' => 'Metabusca SearXNG em inicialização ou indisponível',
            ];
        }
    }

    private function checkOllama(): array
    {
        $ollamaUrl = env('OLLAMA_BASE_URL', 'http://host.docker.internal:11435');
        try {
            $response = Http::timeout(2)->get("{$ollamaUrl}/api/tags");
            if ($response->successful()) {
                $models = collect($response->json('models', []))->pluck('name')->toArray();
                return [
                    'status' => 'healthy',
                    'url' => $ollamaUrl,
                    'installed_models' => $models,
                    'using_host_ollama' => true,
                ];
            }
            return [
                'status' => 'unreachable',
                'url' => $ollamaUrl,
                'note' => 'Ollama local do host retornou código ' . $response->status(),
            ];
        } catch (\Throwable $e) {
            return [
                'status' => 'unreachable',
                'url' => $ollamaUrl,
                'note' => 'Ollama local do host não respondeu no timeout estipulado (fallback léxico ativo)',
            ];
        }
    }
}

