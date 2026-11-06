<?php

namespace App\Http\Controllers\Admin;

use App\DTOs\SearchQueryDTO;
use App\Http\Controllers\Controller;
use App\Services\CircuitBreaker\CircuitBreaker;
use App\Services\Providers\DailymotionProvider;
use App\Services\Providers\RedditProvider;
use App\Services\Providers\SearXNGWebVideoProvider;
use App\Services\Providers\SocialReelsDiscoveryProvider;
use App\Services\Providers\TikTokDiscoveryProvider;
use App\Services\Providers\VimeoProvider;
use App\Services\Providers\YouTubeProvider;
use App\Services\Providers\YouTubeQuotaGuard;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redis;

class ProviderController extends Controller
{
    public function __construct(
        protected YouTubeQuotaGuard $quotaGuard,
        protected CircuitBreaker $circuitBreaker,
        protected YouTubeProvider $youtubeProvider,
        protected SearXNGWebVideoProvider $searxngProvider,
        protected DailymotionProvider $dailymotionProvider,
        protected VimeoProvider $vimeoProvider,
        protected TikTokDiscoveryProvider $tiktokProvider,
        protected RedditProvider $redditProvider,
        protected SocialReelsDiscoveryProvider $reelsProvider
    ) {}

    /**
     * GET /api/admin/providers
     * Lista todos os conectores e o status do Circuit Breaker.
     */
    public function index(): JsonResponse
    {
        $providers = [
            [
                'id' => 'youtube',
                'name' => 'YouTube Data API v3',
                'category' => 'api_oficial',
                'quota_type' => '10.000 pts diários',
                'quota_used' => $this->quotaGuard->getUsage()['consumed'] . ' / 10.000 pts',
                'capabilities' => ['duration', 'sort', 'transcripts', 'pagination'],
                'enabled' => Redis::get('videofinder:provider:youtube:enabled') !== '0',
                'circuit' => $this->circuitBreaker->getState('youtube'),
            ],
            [
                'id' => 'searxng_web',
                'name' => 'SearXNG Web Metasearch',
                'category' => 'metabusca_local',
                'quota_type' => 'Ilimitado (Self-Hosted)',
                'quota_used' => 'Livre',
                'capabilities' => ['web_fallback', 'multi_engine', 'thumbnails'],
                'enabled' => Redis::get('videofinder:provider:searxng_web:enabled') !== '0',
                'circuit' => $this->circuitBreaker->getState('searxng_web'),
            ],
            [
                'id' => 'dailymotion',
                'name' => 'Dailymotion REST API',
                'category' => 'api_publica',
                'quota_type' => 'Acesso Aberto',
                'quota_used' => 'Livre',
                'capabilities' => ['duration', 'hd_thumbnails', 'pagination'],
                'enabled' => Redis::get('videofinder:provider:dailymotion:enabled') !== '0',
                'circuit' => $this->circuitBreaker->getState('dailymotion'),
            ],
            [
                'id' => 'tiktok',
                'name' => 'TikTok Discovery Web',
                'category' => 'descoberta_social',
                'quota_type' => 'Descoberta Web',
                'quota_used' => 'Livre',
                'capabilities' => ['short_form', 'reels', 'viral_snippets'],
                'enabled' => Redis::get('videofinder:provider:tiktok:enabled') !== '0',
                'circuit' => $this->circuitBreaker->getState('tiktok'),
            ],
            [
                'id' => 'vimeo',
                'name' => 'Vimeo Open Video API',
                'category' => 'api_publica',
                'quota_type' => 'Acesso Aberto',
                'quota_used' => 'Livre',
                'capabilities' => ['hd_streams', 'creators', 'duration'],
                'enabled' => Redis::get('videofinder:provider:vimeo:enabled') !== '0',
                'circuit' => $this->circuitBreaker->getState('vimeo'),
            ],
            [
                'id' => 'reddit',
                'name' => 'Reddit Video Communities',
                'category' => 'comunidades_web',
                'quota_type' => 'Descoberta Pública',
                'quota_used' => 'Livre',
                'capabilities' => ['community_discussion', 'v_redd_it'],
                'enabled' => Redis::get('videofinder:provider:reddit:enabled') !== '0',
                'circuit' => $this->circuitBreaker->getState('reddit'),
            ],
            [
                'id' => 'social_reels',
                'name' => 'Social Reels (Instagram/Kwai)',
                'category' => 'descoberta_social',
                'quota_type' => 'Descoberta Web',
                'quota_used' => 'Livre',
                'capabilities' => ['short_form', 'vertical_video'],
                'enabled' => Redis::get('videofinder:provider:social_reels:enabled') !== '0',
                'circuit' => $this->circuitBreaker->getState('social_reels'),
            ],
        ];

        return response()->json([
            'success' => true,
            'total' => count($providers),
            'data' => $providers,
        ]);
    }

    /**
     * POST /api/admin/providers/{id}/toggle
     * Ativa ou desativa um conector globalmente.
     */
    public function toggle(string $id): JsonResponse
    {
        $current = Redis::get("videofinder:provider:{$id}:enabled") !== '0';
        $newState = !$current;

        Redis::set("videofinder:provider:{$id}:enabled", $newState ? '1' : '0');

        return response()->json([
            'success' => true,
            'provider' => $id,
            'enabled' => $newState,
            'message' => "Provedor {$id} " . ($newState ? 'ativado' : 'desativado') . ' com sucesso.',
        ]);
    }

    /**
     * POST /api/admin/providers/{id}/reset-circuit
     * Redefine o Circuit Breaker do provedor para CLOSED.
     */
    public function resetCircuit(string $id): JsonResponse
    {
        $this->circuitBreaker->reset($id);

        return response()->json([
            'success' => true,
            'provider' => $id,
            'circuit' => $this->circuitBreaker->getState($id),
            'message' => "Circuit Breaker do provedor {$id} resetado para CLOSED.",
        ]);
    }

    /**
     * POST /api/admin/providers/{id}/test
     * Testa a conectividade em tempo real com uma query rápida de aferição.
     */
    public function test(string $id): JsonResponse
    {
        $start = microtime(true);
        $query = SearchQueryDTO::fromArray([
            'q' => 'natureza',
            'platforms' => [$id],
        ]);

        try {
            $provider = match ($id) {
                'youtube' => $this->youtubeProvider,
                'searxng_web' => $this->searxngProvider,
                'dailymotion' => $this->dailymotionProvider,
                'vimeo' => $this->vimeoProvider,
                'tiktok' => $this->tiktokProvider,
                'reddit' => $this->redditProvider,
                'social_reels' => $this->reelsProvider,
                default => null,
            };

            if (!$provider) {
                return response()->json([
                    'success' => false,
                    'message' => "Provedor '{$id}' não suportado para teste.",
                ], 404);
            }

            $results = $provider->search($query);
            $durationMs = round((microtime(true) - $start) * 1000, 2);

            return response()->json([
                'success' => true,
                'provider' => $id,
                'status' => 'healthy',
                'latency_ms' => $durationMs,
                'results_count' => count($results),
                'sample' => !empty($results) ? [
                    'title' => $results[0]->title,
                    'url' => $results[0]->originalUrl,
                ] : null,
                'message' => "Conexão com {$id} bem-sucedida ({$durationMs}ms, " . count($results) . " resultados).",
            ]);
        } catch (\Throwable $e) {
            $durationMs = round((microtime(true) - $start) * 1000, 2);

            return response()->json([
                'success' => false,
                'provider' => $id,
                'status' => 'unhealthy',
                'latency_ms' => $durationMs,
                'error' => $e->getMessage(),
                'message' => "Falha no teste de conexão com {$id}: " . $e->getMessage(),
            ], 502);
        }
    }
}
