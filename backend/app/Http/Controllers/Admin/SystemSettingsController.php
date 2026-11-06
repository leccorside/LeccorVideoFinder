<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Cache\VideoSearchCache;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class SystemSettingsController extends Controller
{
    public function __construct(
        protected VideoSearchCache $cache
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
     * POST /api/admin/cache/flush-all
     */
    public function flushAll(): JsonResponse
    {
        $keys = Redis::keys('videofinder:*');
        $count = 0;

        if (!empty($keys)) {
            foreach ($keys as $key) {
                // Não apaga chaves de configuração permanente
                if (!str_contains($key, ':settings:')) {
                    Redis::del($key);
                    $count++;
                }
            }
        }

        return response()->json([
            'success' => true,
            'deleted_keys' => $count,
            'message' => "Cache geral purgado com sucesso ({$count} chaves removidas).",
        ]);
    }
}
