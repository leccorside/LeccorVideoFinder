<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AI\OllamaService;
use App\Services\Cache\VideoSearchCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class SystemSettingsController extends Controller
{
    public function __construct(
        protected VideoSearchCache $cache,
        protected OllamaService $ollama
    ) {}

    /**
     * GET /api/admin/settings
     */
    public function index(): JsonResponse
    {
        $settings = [
            'search_cache_ttl_hours' => (int) (Redis::get('videofinder:settings:search_cache_ttl') ?: 24),
            'video_metadata_ttl_hours' => (int) (Redis::get('videofinder:settings:video_cache_ttl') ?: 72),
            'youtube_daily_quota_limit' => (int) (Redis::get('videofinder:settings:youtube_quota_limit') ?: 10000),
            'searxng_url' => env('SEARXNG_URL', 'http://searxng:8080'),
            'ollama_base_url' => env('OLLAMA_BASE_URL', 'http://videofinder-ollama:11434'),
            'default_ai_model' => Redis::get('videofinder:settings:default_ai_model') ?: 'qwen2.5vl:7b',
            'auto_failover_enabled' => Redis::get('videofinder:settings:auto_failover') !== '0',
            'circuit_breaker_threshold' => 3,
            'circuit_breaker_cooldown_seconds' => 60,
        ];

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * PUT /api/admin/settings
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search_cache_ttl_hours' => 'nullable|integer|min:1|max:720',
            'video_metadata_ttl_hours' => 'nullable|integer|min:1|max:720',
            'youtube_daily_quota_limit' => 'nullable|integer|min:1000|max:100000',
            'default_ai_model' => 'nullable|string|max:50',
            'auto_failover_enabled' => 'nullable|boolean',
        ]);

        if (isset($validated['search_cache_ttl_hours'])) {
            Redis::set('videofinder:settings:search_cache_ttl', $validated['search_cache_ttl_hours']);
        }

        if (isset($validated['video_metadata_ttl_hours'])) {
            Redis::set('videofinder:settings:video_cache_ttl', $validated['video_metadata_ttl_hours']);
        }

        if (isset($validated['youtube_daily_quota_limit'])) {
            Redis::set('videofinder:settings:youtube_quota_limit', $validated['youtube_daily_quota_limit']);
        }

        if (isset($validated['default_ai_model'])) {
            Redis::set('videofinder:settings:default_ai_model', $validated['default_ai_model']);
        }

        if (isset($validated['auto_failover_enabled'])) {
            Redis::set('videofinder:settings:auto_failover', $validated['auto_failover_enabled'] ? '1' : '0');
        }

        return response()->json([
            'success' => true,
            'message' => 'Configurações do sistema atualizadas com sucesso.',
        ]);
    }

    /**
     * POST /api/admin/ai/test-inference
     * Testa a inferência de IA com modelo local montado do host.
     */
    public function testInference(Request $request): JsonResponse
    {
        $start = microtime(true);
        $prompt = $request->input('prompt', 'O que diferencia persistência de teimosia?');
        $model = $request->input('model', Redis::get('videofinder:settings:default_ai_model') ?: 'qwen2.5vl:7b');

        try {
            $response = $this->ollama->generate($prompt, $model, ['max_tokens' => 80]);
            $durationMs = round((microtime(true) - $start) * 1000, 2);

            return response()->json([
                'success' => true,
                'model' => $model,
                'prompt' => $prompt,
                'response' => $response ?: 'Inferência local concluída com sucesso.',
                'latency_ms' => $durationMs,
            ]);
        } catch (\Throwable $e) {
            $durationMs = round((microtime(true) - $start) * 1000, 2);

            return response()->json([
                'success' => false,
                'model' => $model,
                'error' => $e->getMessage(),
                'latency_ms' => $durationMs,
            ], 500);
        }
    }

    /**
     * POST /api/admin/cache/flush-all
     */
    public function flushAll(): JsonResponse
    {
        $count = 0;

        try {
            $prefix = config('database.redis.options.prefix', '');
            $rawKeys = Redis::keys('*');

            if (!empty($rawKeys)) {
                foreach ($rawKeys as $key) {
                    $cleanKey = !empty($prefix) && str_starts_with($key, $prefix)
                        ? substr($key, strlen($prefix))
                        : $key;

                    if (!str_contains($cleanKey, ':settings:')) {
                        Redis::del($cleanKey);
                        $count++;
                    }
                }
            }
        } catch (\Throwable $e) {}

        return response()->json([
            'success' => true,
            'deleted_keys' => $count,
            'message' => "Cache geral purgado com sucesso ({$count} chaves removidas).",
        ]);
    }
}
