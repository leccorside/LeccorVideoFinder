<?php

namespace App\Services\Search;

use App\DTOs\SearchQueryDTO;
use App\DTOs\VideoSearchResultDTO;

class RelevanceScorer
{
    /**
     * Calcula o score de relevância ponderado (0 a 100) para um item de vídeo.
     */
    public function score(VideoSearchResultDTO $video, SearchQueryDTO $query): VideoSearchResultDTO
    {
        $rawQuery = trim($query->query);
        $normalizedQuery = mb_strtolower($rawQuery, 'UTF-8');
        $title = mb_strtolower($video->title, 'UTF-8');
        $description = mb_strtolower($video->description, 'UTF-8');

        $score = 20; // Score base inicial
        $matchType = 'text_match';
        $matchedSnippet = $video->matchedSnippet;
        $matchedTimestamp = $video->matchedTimestamp;

        // 1. Correspondência exata da frase inteira no título (+40 pontos)
        if (!empty($normalizedQuery) && str_contains($title, $normalizedQuery)) {
            $score += 40;
            $matchType = 'exact_phrase';
            $matchedSnippet = $video->title;
        }

        // 2. Correspondência em Transcrição com timestamp (+35 pontos)
        if ($video->transcript && !empty($video->transcript['segments'])) {
            foreach ($video->transcript['segments'] as $segment) {
                $segText = mb_strtolower($segment['text'] ?? '', 'UTF-8');
                if (str_contains($segText, $normalizedQuery)) {
                    $score += 35;
                    $matchType = 'transcript_match';
                    $matchedSnippet = $segment['text'];
                    $matchedTimestamp = (int) ($segment['startTime'] ?? $segment['start_time'] ?? 0);
                    break;
                }
            }
        } elseif ($video->matchedTimestamp !== null) {
            $score += 25;
            $matchType = 'transcript_match';
        }

        // 3. Correspondência na Descrição (+15 pontos proporcionais)
        if (!empty($normalizedQuery) && str_contains($description, $normalizedQuery)) {
            $score += 15;
            if (!$matchedSnippet) {
                $matchedSnippet = $this->extractSnippetAroundMatch($video->description, $rawQuery);
            }
        } else {
            // Contagem de palavras isoladas na descrição
            $words = array_filter(explode(' ', $normalizedQuery), fn($w) => mb_strlen($w) > 2);
            $foundWords = 0;
            foreach ($words as $word) {
                if (str_contains($title, $word) || str_contains($description, $word)) {
                    $foundWords++;
                }
            }
            if (count($words) > 0) {
                $wordRatio = $foundWords / count($words);
                $score += (int) ($wordRatio * 15);
            }
        }

        // 4. Bônus Semântico se estiver em modo IA (+15 a +25 pontos)
        if ($query->mode === 'ai_semantic' || $video->matchType === 'semantic') {
            $score += 15;
            if ($matchType !== 'transcript_match' && $matchType !== 'exact_phrase') {
                $matchType = 'semantic';
            }
        }

        // 5. Penalidade para itens com poucos metadados
        if (empty($video->thumbnailUrl) || empty($video->durationSeconds)) {
            $score -= 10;
        }

        // Se nenhum match específico for encontrado
        if ($score <= 30 && empty($matchedSnippet)) {
            $matchType = 'unverified';
        }

        $finalScore = min(100, max(10, $score));

        return $video->withRelevance(
            score: $finalScore,
            matchType: $matchType,
            snippet: $matchedSnippet,
            timestamp: $matchedTimestamp
        );
    }

    /**
     * Ordena uma lista de vídeos por score de relevância decrescente.
     *
     * @param VideoSearchResultDTO[] $videos
     * @return VideoSearchResultDTO[]
     */
    public function sort(array $videos, string $sortBy = 'relevance'): array
    {
        usort($videos, function (VideoSearchResultDTO $a, VideoSearchResultDTO $b) use ($sortBy) {
            if ($sortBy === 'views') {
                return ($b->viewsCount ?? 0) <=> ($a->viewsCount ?? 0);
            }
            if ($sortBy === 'duration') {
                return ($b->durationSeconds ?? 0) <=> ($a->durationSeconds ?? 0);
            }
            // Padrão: Relevance Score
            return $b->relevanceScore <=> $a->relevanceScore;
        });

        return $videos;
    }

    /**
     * Extrai um trecho do texto contendo a palavra ou frase correspondente.
     */
    private function extractSnippetAroundMatch(string $text, string $needle, int $radius = 70): string
    {
        $pos = mb_stripos($text, $needle, 0, 'UTF-8');
        if ($pos === false) {
            return mb_substr($text, 0, $radius * 2, 'UTF-8') . '...';
        }

        $start = max(0, $pos - $radius);
        $length = mb_strlen($needle, 'UTF-8') + ($radius * 2);
        $snippet = mb_substr($text, $start, $length, 'UTF-8');

        $prefix = $start > 0 ? '...' : '';
        $suffix = ($start + $length) < mb_strlen($text, 'UTF-8') ? '...' : '';

        return $prefix . trim($snippet) . $suffix;
    }
}

