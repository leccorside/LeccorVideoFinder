<?php

namespace App\Http\Controllers;

use App\DTOs\SearchQueryDTO;
use App\Services\Cache\VideoSearchCache;
use App\Services\Providers\SearXNGWebVideoProvider;
use App\Services\Providers\YouTubeProvider;
use App\Services\Providers\YouTubeQuotaGuard;
use App\Services\Search\CanonicalDeduplicator;
use App\Services\Search\RelevanceScorer;
use App\Services\Search\UniversalSearchOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SearchController extends Controller
{
    protected UniversalSearchOrchestrator $orchestrator;
    protected YouTubeQuotaGuard $quotaGuard;
    protected VideoSearchCache $cache;

    public function __construct()
    {
        $deduplicator = new CanonicalDeduplicator();
        $scorer = new RelevanceScorer();
        $this->quotaGuard = new YouTubeQuotaGuard();
        $this->cache = new VideoSearchCache();

        $this->orchestrator = new UniversalSearchOrchestrator($deduplicator, $scorer);

        // Registro de provedores reais da Etapa 4
        // 1. YouTube API v3 oficial com proteção rígida de cotas
        $this->orchestrator->registerProvider(new YouTubeProvider(
            apiKey: env('YOUTUBE_API_KEY'),
            quotaGuard: $this->quotaGuard
        ));

        // 2. SearXNG Metabusca Web Local (YouTube, TikTok, Vimeo, etc. 100% gratuito)
        $this->orchestrator->registerProvider(new SearXNGWebVideoProvider(
            baseUrl: env('SEARXNG_URL', 'http://searxng:8080'),
            deduplicator: $deduplicator
        ));
    }

    /**
     * POST /api/search
     * Executa a busca síncrona retornando os resultados consolidados e deduplicados.
     */
    public function search(Request $request): JsonResponse
    {
        // Aceita 'q' ou 'query' indistintamente
        if (!$request->has('q') && $request->has('query')) {
            $request->merge(['q' => $request->input('query')]);
        }

        $validated = $request->validate([
            'q' => 'required|string|min:1|max:255',
            'platforms' => 'nullable',
            'duration' => 'nullable|string|in:all,short,medium,long',
            'period' => 'nullable|string|in:all,24h,7d,30d,year',
            'mode' => 'nullable|string|in:simple,exact,ai_semantic',
            'sort' => 'nullable|string|in:relevance,recent,views,duration',
            'limit' => 'nullable|integer|min:1|max:100',
            'offset' => 'nullable|integer|min:0',
        ]);

        $queryDTO = SearchQueryDTO::fromArray($validated);
        $response = $this->orchestrator->search($queryDTO);

        return response()->json([
            'success' => true,
            'data' => $response,
        ]);
    }

    /**
     * GET /api/search/{id}/stream
     * Streaming em tempo real via Server-Sent Events (SSE).
     */
    public function stream(Request $request, string $id): StreamedResponse
    {
        $queryText = $request->query('q', $request->query('query', 'Vídeos Motivacionais'));
        $queryDTO = SearchQueryDTO::fromArray([
            'q' => $queryText,
            'session_id' => $id,
            'mode' => $request->query('ai') === '1' ? 'ai_semantic' : 'simple',
            'platforms' => $request->query('platforms'),
            'duration' => $request->query('duration', 'all'),
            'period' => $request->query('period', 'all'),
            'sort' => $request->query('sort', 'relevance'),
        ]);

        return new StreamedResponse(function () use ($queryDTO, $id) {
            // Desativar buffering no PHP
            if (ob_get_level()) {
                ob_end_clean();
            }

            // 1. Evento de início da sessão
            echo "event: session_start\n";
            echo "data: " . json_encode([
                'session_id' => $id,
                'query' => $queryDTO->query,
                'timestamp' => now()->toIso8601String(),
            ]) . "\n\n";
            flush();

            // 2. Execução progressiva por provedor
            $callback = function (string $providerId, array $results, array $stats) {
                echo "event: provider_result\n";
                echo "data: " . json_encode([
                    'provider_id' => $providerId,
                    'count' => count($results),
                    'stats' => $stats,
                    'sample_items' => array_map(fn($v) => $v->toArray(), array_slice($results, 0, 2)),
                ]) . "\n\n";
                flush();
            };

            $finalResults = $this->orchestrator->search($queryDTO, $callback);

            // 3. Evento final consolidado
            echo "event: session_complete\n";
            echo "data: " . json_encode([
                'session_id' => $id,
                'total' => $finalResults['total'],
                'stats' => $finalResults['stats'],
                'results' => $finalResults['results'],
            ]) . "\n\n";
            flush();
        }, 200, [
            'Content-Type' => 'text/event-stream',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
            'Connection' => 'keep-alive',
        ]);
    }

    /**
     * GET /api/search/suggestions
     * Retorna sugestões rápidas de autocompletar e frases faladas.
     */
    public function suggestions(Request $request): JsonResponse
    {
        $q = trim($request->query('q', ''));

        $baseSuggestions = [
            ['text' => 'Nunca desista dos seus sonhos', 'type' => 'transcript', 'count' => '1.4k vídeos falados'],
            ['text' => 'Disciplina é mais importante que motivação', 'type' => 'transcript', 'count' => '890 vídeos'],
            ['text' => 'Steve Jobs discurso Stanford 2005 íntegra', 'type' => 'title', 'count' => '420 vídeos'],
            ['text' => 'Como começar a programar do zero', 'type' => 'title', 'count' => '1.2k vídeos'],
            ['text' => 'O sucesso é construído nos dias difíceis', 'type' => 'semantic', 'count' => '650 vídeos'],
        ];

        if (!empty($q)) {
            $filtered = array_filter($baseSuggestions, function ($item) use ($q) {
                return mb_stripos($item['text'], $q, 0, 'UTF-8') !== false;
            });
            return response()->json(['suggestions' => array_values($filtered)]);
        }

        return response()->json(['suggestions' => $baseSuggestions]);
    }

    /**
     * GET /api/admin/quota
     * Retorna a telemetria atual da quota da YouTube Data API v3.
     */
    public function quotaStatus(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'quota' => $this->quotaGuard->getUsage(),
            'has_api_key' => !empty(env('YOUTUBE_API_KEY')),
            'searxng_fallback_ready' => true,
        ]);
    }

    /**
     * POST /api/admin/cache/clear
     * Limpa o cache de buscas.
     */
    public function clearCache(): JsonResponse
    {
        $success = $this->cache->flush();

        return response()->json([
            'success' => $success,
            'message' => $success ? 'Cache de buscas limpo com sucesso.' : 'Falha ao limpar cache.',
        ]);
    }
}
