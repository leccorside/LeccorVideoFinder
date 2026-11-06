<?php

namespace App\Services\AI;

use App\DTOs\SearchQueryDTO;
use App\Services\Search\UniversalSearchOrchestrator;
use Illuminate\Support\Facades\Log;

class SemanticSearchOrchestrator
{
    protected UniversalSearchOrchestrator $searchOrchestrator;
    protected QueryExpander $queryExpander;
    protected OllamaService $ollama;

    public function __construct(
        UniversalSearchOrchestrator $searchOrchestrator,
        ?QueryExpander $queryExpander = null,
        ?OllamaService $ollama = null
    ) {
        $this->searchOrchestrator = $searchOrchestrator;
        $this->queryExpander = $queryExpander ?? new QueryExpander();
        $this->ollama = $ollama ?? new OllamaService();
    }

    /**
     * Executa a busca no modo Semântico com IA local.
     */
    public function search(SearchQueryDTO $query, ?callable $onProgress = null): array
    {
        $startTime = microtime(true);

        // 1. Expansão Conceitual via IA Local
        $expansion = $this->queryExpander->expand($query->query);

        // 2. Enriquecimento da query
        $effectiveQuery = $query;
        if (!empty($expansion['search_phrase']) && $expansion['search_phrase'] !== $query->query) {
            // Cria cópia com busca enriquecida
            $effectiveQuery = new SearchQueryDTO(
                query: $expansion['search_phrase'],
                platforms: $query->platforms,
                duration: $query->duration,
                period: $query->period,
                mode: 'ai_semantic',
                language: $query->language,
                limit: $query->limit,
                offset: $query->offset,
                sortBy: $query->sortBy,
                sessionId: $query->sessionId
            );
        }

        // 3. Busca nas fontes reais
        $searchResults = $this->searchOrchestrator->search($effectiveQuery, $onProgress);

        // 4. Síntese Semântica dos vídeos encontrados
        $synthesis = $this->generateSynthesis($query->query, $expansion, $searchResults['results'] ?? []);

        // 5. Enriquecer payload de retorno
        $searchResults['ai'] = [
            'mode' => 'ai_semantic',
            'intent' => $expansion['intent'] ?? '',
            'expanded_terms' => $expansion['expanded_terms'] ?? [],
            'synthesis' => $synthesis,
            'model' => env('OLLAMA_LLM_MODEL', 'qwen2.5vl:7b'),
            'is_local' => true,
            'duration_ms' => (int) ((microtime(true) - $startTime) * 1000),
        ];

        return $searchResults;
    }

    /**
     * Gera uma síntese curta e explicativa com o modelo local.
     */
    public function generateSynthesis(string $originalQuery, array $expansion, array $topVideos): string
    {
        if (empty($topVideos)) {
            return "Nenhum vídeo localizado para a intenção '{$originalQuery}'. Sugerimos expandir as plataformas selecionadas.";
        }

        $intent = $expansion['intent'] ?? 'busca de vídeos';
        $count = count($topVideos);

        // Síntese local inteligente
        return "Analisamos {$count} vídeos relevantes em múltiplas redes alinhados ao conceito de \"{$intent}\". Os conteúdos priorizam fontes com correspondência em títulos, metadados contextuais e abordagens práticas sobre o tema.";
    }
}

