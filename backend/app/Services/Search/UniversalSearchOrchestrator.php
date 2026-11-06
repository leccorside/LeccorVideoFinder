<?php

namespace App\Services\Search;

use App\Contracts\VideoSearchProviderInterface;
use App\DTOs\SearchQueryDTO;
use App\DTOs\VideoSearchResultDTO;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class UniversalSearchOrchestrator
{
    /**
     * @var VideoSearchProviderInterface[]
     */
    protected array $providers = [];

    protected CanonicalDeduplicator $deduplicator;
    protected RelevanceScorer $scorer;

    public function __construct(
        CanonicalDeduplicator $deduplicator,
        RelevanceScorer $scorer
    ) {
        $this->deduplicator = $deduplicator;
        $this->scorer = $scorer;
    }

    /**
     * Registra um provedor de busca no orquestrador.
     */
    public function registerProvider(VideoSearchProviderInterface $provider): void
    {
        $this->providers[$provider->getId()] = $provider;
    }

    /**
     * Retorna todos os provedores registrados.
     *
     * @return VideoSearchProviderInterface[]
     */
    public function getProviders(): array
    {
        return $this->providers;
    }

    /**
     * Executa a busca universal sincronizada ou agregada em todas as fontes disponíveis.
     *
     * @param SearchQueryDTO $query
     * @param callable|null $onProviderResult Callback chamado progressivamente quando cada provedor conclui
     * @return array Resumo contendo 'results', 'stats', 'providers'
     */
    public function search(SearchQueryDTO $query, ?callable $onProviderResult = null): array
    {
        $startTime = microtime(true);
        $cacheKey = $query->getCacheKey();

        // 1. Verificação de Cache Redis
        if (Cache::has($cacheKey)) {
            $cached = Cache::get($cacheKey);
            if (is_array($cached) && !empty($cached['results'])) {
                $cached['stats']['from_cache'] = true;
                $cached['stats']['duration_ms'] = (int) ((microtime(true) - $startTime) * 1000);
                return $cached;
            }
        }

        // 2. Filtrar provedores habilitados
        $activeProviders = $this->filterActiveProviders($query);
        $allRawResults = [];
        $providerStats = [];

        // 3. Execução nos provedores
        foreach ($activeProviders as $provider) {
            $providerStart = microtime(true);
            $providerId = $provider->getId();

            try {
                $results = $provider->search($query);
                $providerDuration = (int) ((microtime(true) - $providerStart) * 1000);

                $providerStats[$providerId] = [
                    'name' => $provider->getName(),
                    'platform' => $provider->getPlatform(),
                    'count' => count($results),
                    'duration_ms' => $providerDuration,
                    'status' => 'success',
                ];

                $allRawResults = array_merge($allRawResults, $results);

                // Notificar callback de streaming progressivo
                if ($onProviderResult) {
                    $onProviderResult($providerId, $results, $providerStats[$providerId]);
                }
            } catch (\Throwable $e) {
                Log::warning("Falha ao consultar provedor {$providerId}: " . $e->getMessage());
                $providerStats[$providerId] = [
                    'name' => $provider->getName(),
                    'platform' => $provider->getPlatform(),
                    'count' => 0,
                    'duration_ms' => (int) ((microtime(true) - $providerStart) * 1000),
                    'status' => 'error',
                    'error' => $e->getMessage(),
                ];

                if ($onProviderResult) {
                    $onProviderResult($providerId, [], $providerStats[$providerId]);
                }
            }
        }

        // 4. Deduplicação Canônica
        $deduplicated = $this->deduplicator->deduplicate($allRawResults);

        // 5. Pontuação de Relevância
        $scored = array_map(function (VideoSearchResultDTO $video) use ($query) {
            return $this->scorer->score($video, $query);
        }, $deduplicated);

        // 6. Ordenação
        $sorted = $this->scorer->sort($scored, $query->sortBy);

        // 7. Paginação
        $paged = array_slice($sorted, $query->offset, $query->limit);

        $totalDurationMs = (int) ((microtime(true) - $startTime) * 1000);

        $payload = [
            'results' => array_map(fn(VideoSearchResultDTO $v) => $v->toArray(), $paged),
            'total' => count($sorted),
            'query' => $query->toArray(),
            'stats' => [
                'duration_ms' => $totalDurationMs,
                'from_cache' => false,
                'total_providers' => count($activeProviders),
                'successful_providers' => count(array_filter($providerStats, fn($s) => $s['status'] === 'success')),
            ],
            'providers' => $providerStats,
        ];

        // 8. Salvar em Cache (TTL de 24 horas por padrão)
        if (!empty($sorted)) {
            Cache::put($cacheKey, $payload, now()->addHours(24));
        }

        return $payload;
    }

    /**
     * Filtra provedores que suportam a consulta e que foram selecionados pelo usuário.
     */
    protected function filterActiveProviders(SearchQueryDTO $query): array
    {
        $selected = $query->platforms;

        return array_filter($this->providers, function (VideoSearchProviderInterface $provider) use ($selected) {
            if (!$provider->isAvailable()) {
                return false;
            }

            if (empty($selected) || in_array('all', $selected)) {
                return true;
            }

            return in_array($provider->getPlatform(), $selected) || in_array($provider->getId(), $selected);
        });
    }
}

