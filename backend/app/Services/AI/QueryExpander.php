<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redis;

class QueryExpander
{
    protected OllamaService $ollama;

    public function __construct(?OllamaService $ollama = null)
    {
        $this->ollama = $ollama ?? new OllamaService();
    }

    /**
     * Expande uma busca gerando termos sinônimos e intenção conceituada.
     */
    public function expand(string $query): array
    {
        $query = trim($query);
        if (empty($query)) {
            return [
                'original_query' => '',
                'expanded_terms' => [],
                'intent' => 'Consulta vazia',
                'search_phrase' => '',
                'is_ai_generated' => false,
            ];
        }

        $cacheKey = 'videofinder:ai:expansion:' . md5(mb_strtolower($query));

        // 1. Verificar Cache Redis (72 horas)
        try {
            $cached = Redis::get($cacheKey);
            if ($cached) {
                $decoded = json_decode($cached, true);
                if (is_array($decoded)) {
                    $decoded['from_cache'] = true;
                    return $decoded;
                }
            }
        } catch (\Throwable $e) {
            Log::warning("Erro ao ler cache de expansão: " . $e->getMessage());
        }

        // 2. Se o Ollama estiver disponível, gerar expansão contextual
        if ($this->ollama->isAvailable()) {
            $prompt = <<<EOT
Você é um motor de busca semântica de vídeos. Analise a seguinte consulta de pesquisa em linguagem natural:
"{$query}"

Retorne ESTRITAMENTE um JSON no seguinte formato (sem explicações adicionais, sem markdown e sem crases):
{
  "intent": "Resumo em 1 frase da intenção real de busca",
  "keywords": ["termo1", "termo2", "termo3", "termo4"],
  "search_phrase": "frase otimizada de busca com as palavras mais relevantes"
}
EOT;

            $response = $this->ollama->generate($prompt, null, [
                'options' => [
                    'temperature' => 0.2,
                    'num_predict' => 150,
                ],
            ]);

            if (!empty($response)) {
                $jsonClean = trim($response);
                // Remover delimitadores markdown caso o modelo tenha incluído
                if (str_starts_with($jsonClean, '```json')) {
                    $jsonClean = substr($jsonClean, 7);
                }
                if (str_starts_with($jsonClean, '```')) {
                    $jsonClean = substr($jsonClean, 3);
                }
                if (str_ends_with($jsonClean, '```')) {
                    $jsonClean = substr($jsonClean, 0, -3);
                }
                $jsonClean = trim($jsonClean);

                $parsed = json_decode($jsonClean, true);
                if (is_array($parsed) && !empty($parsed['keywords'])) {
                    $result = [
                        'original_query' => $query,
                        'expanded_terms' => array_values(array_unique(array_slice($parsed['keywords'], 0, 6))),
                        'intent' => $parsed['intent'] ?? 'Busca conceitual por vídeos relevantes',
                        'search_phrase' => $parsed['search_phrase'] ?? $query,
                        'is_ai_generated' => true,
                        'model' => env('OLLAMA_LLM_MODEL', 'qwen2.5vl:7b'),
                    ];

                    // Salvar no Redis por 72h
                    try {
                        Redis::setex($cacheKey, 259200, json_encode($result, JSON_UNESCAPED_UNICODE));
                    } catch (\Throwable $e) {
                        // Silencioso
                    }

                    return $result;
                }
            }
        }

        // 3. Fallback Gracioso Léxico (sem travar a aplicação)
        return $this->fallbackExpansion($query);
    }

    /**
     * Gera expansão léxica automática a partir da query usando regras linguísticas.
     */
    protected function fallbackExpansion(string $query): array
    {
        $stopwords = ['de', 'a', 'o', 'que', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu', 'sua', 'ou', 'ser', 'quando', 'muito', 'há', 'nos', 'já', 'está', 'eu', 'também', 'só', 'pelo', 'pela', 'até', 'isso', 'ela', 'entre', 'era', 'depois', 'sem', 'mesmo', 'aos', 'ter', 'seus', 'quem', 'nas', 'me', 'esse', 'eles', 'estão', 'você', 'tinha', 'foram', 'essa', 'num', 'nem', 'suas', 'meu', 'às', 'minha', 'têm', 'numa', 'pelos', 'elas', 'havia', 'seja', 'qual', 'será', 'nós', 'tenho', 'lhe', 'deles', 'essas', 'esses', 'pelas', 'este', 'fosse', 'dele', 'tu', 'te', 'vocês', 'vos', 'lhes', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'nosso', 'nossa', 'nossos', 'nossas', 'dela', 'delas'];

        $words = preg_split('/\s+/u', mb_strtolower($query));
        $filtered = array_filter($words, function ($w) use ($stopwords) {
            $w = trim($w, ".,!?:;\"'()[]{}");
            return mb_strlen($w) > 2 && !in_array($w, $stopwords);
        });

        $keywords = array_values(array_unique($filtered));

        return [
            'original_query' => $query,
            'expanded_terms' => $keywords,
            'intent' => 'Busca direcionada por termos-chave essenciais',
            'search_phrase' => implode(' ', $keywords),
            'is_ai_generated' => false,
            'model' => 'lexical_fallback',
        ];
    }
}

