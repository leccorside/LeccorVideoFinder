<?php

namespace App\Services\Search;

use App\DTOs\SearchQueryDTO;
use App\DTOs\VideoSearchResultDTO;

class RelevanceScorer
{
    /**
     * Remove acentos para comparação tolerante a variações ortográficas e diacríticos.
     */
    private function stripAccents(string $str): string
    {
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $str);
        if ($ascii !== false && !empty($ascii)) {
            return mb_strtolower($ascii, 'UTF-8');
        }
        return mb_strtolower($str, 'UTF-8');
    }

    /**
     * Calcula o score de relevância ponderado (0 a 100) para um item de vídeo.
     */
    public function score(VideoSearchResultDTO $video, SearchQueryDTO $query): VideoSearchResultDTO
    {
        $rawQuery = trim($query->query);
        $normalizedQuery = mb_strtolower($rawQuery, 'UTF-8');
        $cleanQuery = $this->stripAccents($rawQuery);

        $title = mb_strtolower($video->title, 'UTF-8');
        $cleanTitle = $this->stripAccents($video->title);

        $description = mb_strtolower($video->description, 'UTF-8');
        $cleanDesc = $this->stripAccents($video->description);

        $score = 20; // Score base inicial
        $matchType = 'text_match';
        $matchedSnippet = $video->matchedSnippet;
        $matchedTimestamp = $video->matchedTimestamp;

        // 1. Correspondência exata da frase inteira no título (+45 pontos)
        if (!empty($cleanQuery) && (str_contains($title, $normalizedQuery) || str_contains($cleanTitle, $cleanQuery))) {
            $score += 45;
            $matchType = 'exact_phrase';
            $matchedSnippet = $video->title;
        }

        // 2. Correspondência em Transcrição com timestamp (+35 pontos)
        if ($video->transcript && !empty($video->transcript['segments'])) {
            foreach ($video->transcript['segments'] as $segment) {
                $segText = mb_strtolower($segment['text'] ?? '', 'UTF-8');
                $cleanSeg = $this->stripAccents($segment['text'] ?? '');
                if (str_contains($segText, $normalizedQuery) || str_contains($cleanSeg, $cleanQuery)) {
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

        // 3. Correspondência na Descrição (+20 pontos proporcionais)
        if (!empty($cleanQuery) && (str_contains($description, $normalizedQuery) || str_contains($cleanDesc, $cleanQuery))) {
            $score += 20;
            if (!$matchedSnippet) {
                $matchedSnippet = $this->extractSnippetAroundMatch($video->description, $rawQuery);
            }
        } else {
            // Contagem de palavras isoladas no título ou na descrição
            $words = array_filter(explode(' ', $cleanQuery), fn($w) => mb_strlen($w) > 2);
            $foundWords = 0;
            foreach ($words as $word) {
                if (str_contains($cleanTitle, $word) || str_contains($cleanDesc, $word)) {
                    $foundWords++;
                }
            }
            if (count($words) > 0) {
                $wordRatio = $foundWords / count($words);
                $score += (int) ($wordRatio * 20);
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

