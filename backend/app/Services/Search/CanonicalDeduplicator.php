<?php

namespace App\Services\Search;

use App\DTOs\VideoSearchResultDTO;

class CanonicalDeduplicator
{
    /**
     * Deduplica uma lista de resultados preservando os melhores metadados.
     *
     * @param VideoSearchResultDTO[] $results
     * @return VideoSearchResultDTO[]
     */
    public function deduplicate(array $results): array
    {
        $uniqueMap = [];

        foreach ($results as $item) {
            $canonicalKey = $this->extractCanonicalKey($item);

            if (!isset($uniqueMap[$canonicalKey])) {
                $uniqueMap[$canonicalKey] = $item;
                continue;
            }

            // Se já existe, mescla os dados favorecendo o item mais completo
            $existing = $uniqueMap[$canonicalKey];
            $uniqueMap[$canonicalKey] = $this->mergeBestMetadata($existing, $item);
        }

        return array_values($uniqueMap);
    }

    /**
     * Retorna o identificador canônico a partir de uma URL e plataforma.
     */
    public function getCanonicalIdentifier(string $url, string $platform = 'web'): string
    {
        $platform = strtolower($platform);

        if ($platform === 'youtube' || str_contains($url, 'youtu.be') || str_contains($url, 'youtube.com')) {
            $youtubeId = $this->extractYouTubeId($url);
            if ($youtubeId) {
                return 'youtube:' . $youtubeId;
            }
        }

        if ($platform === 'tiktok' || str_contains($url, 'tiktok.com')) {
            if (preg_match('/video\/(\d+)/i', $url, $matches)) {
                return 'tiktok:' . $matches[1];
            }
        }

        if ($platform === 'instagram' || str_contains($url, 'instagram.com')) {
            if (preg_match('/(?:reel|p)\/([a-zA-Z0-9_-]+)/i', $url, $matches)) {
                return 'instagram:' . $matches[1];
            }
        }

        if ($platform === 'vimeo' || str_contains($url, 'vimeo.com')) {
            if (preg_match('/vimeo\.com\/(?:video\/)?(\d+)/i', $url, $matches)) {
                return 'vimeo:' . $matches[1];
            }
        }

        if ($platform === 'dailymotion' || str_contains($url, 'dailymotion.com')) {
            if (preg_match('/video\/([a-zA-Z0-9]+)/i', $url, $matches)) {
                return 'dailymotion:' . $matches[1];
            }
        }

        $cleanUrl = $this->stripTrackingParams($url);
        return $platform . ':' . md5($cleanUrl);
    }

    /**
     * Gera uma chave única padronizada para identificar vídeos duplicados em diferentes fontes.
     */
    public function extractCanonicalKey(VideoSearchResultDTO $item): string
    {
        $url = $item->originalUrl;
        $platform = strtolower($item->platform);

        // 1. YouTube
        if ($platform === 'youtube' || str_contains($url, 'youtu.be') || str_contains($url, 'youtube.com')) {
            $youtubeId = $this->extractYouTubeId($url) ?: $item->externalId;
            if ($youtubeId) {
                return 'youtube:' . $youtubeId;
            }
        }

        // 2. TikTok
        if ($platform === 'tiktok' || str_contains($url, 'tiktok.com')) {
            if (preg_match('/video\/(\d+)/i', $url, $matches)) {
                return 'tiktok:' . $matches[1];
            }
        }

        // 3. Instagram Reels
        if ($platform === 'instagram' || str_contains($url, 'instagram.com')) {
            if (preg_match('/(?:reel|p)\/([a-zA-Z0-9_-]+)/i', $url, $matches)) {
                return 'instagram:' . $matches[1];
            }
        }

        // 4. Vimeo
        if ($platform === 'vimeo' || str_contains($url, 'vimeo.com')) {
            if (preg_match('/vimeo\.com\/(?:video\/)?(\d+)/i', $url, $matches)) {
                return 'vimeo:' . $matches[1];
            }
        }

        // 5. Dailymotion
        if ($platform === 'dailymotion' || str_contains($url, 'dailymotion.com')) {
            if (preg_match('/video\/([a-zA-Z0-9]+)/i', $url, $matches)) {
                return 'dailymotion:' . $matches[1];
            }
        }

        // Fallback: platform + externalId ou hash limpo da URL
        if (!empty($item->externalId)) {
            return $platform . ':' . $item->externalId;
        }

        // Normalização genérica de URL removendo query strings de tracking
        $cleanUrl = $this->stripTrackingParams($url);
        return $platform . ':' . md5($cleanUrl);
    }

    /**
     * Extrai o ID oficial do YouTube a partir de qualquer variação de URL.
     */
    public function extractYouTubeId(string $url): ?string
    {
        $pattern = '/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|v\/|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/i';
        if (preg_match($pattern, $url, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Remove parâmetros de tracking e analíticos de URLs (utm_*, si, feature, etc.).
     */
    public function stripTrackingParams(string $url): string
    {
        $parsed = parse_url($url);
        if (!$parsed || !isset($parsed['scheme'], $parsed['host'])) {
            return $url;
        }

        $base = $parsed['scheme'] . '://' . $parsed['host'] . ($parsed['path'] ?? '');

        if (!empty($parsed['query'])) {
            parse_str($parsed['query'], $queryParams);
            // Remover parâmetros de tracking comuns
            $trackingKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'si', 'feature', 'fbclid', 'igshid'];
            foreach ($trackingKeys as $k) {
                unset($queryParams[$k]);
            }
            if (!empty($queryParams)) {
                $base .= '?' . http_build_query($queryParams);
            }
        }

        return rtrim($base, '/');
    }

    /**
     * Consolida dois registros do mesmo vídeo escolhendo os campos mais ricos.
     */
    private function mergeBestMetadata(VideoSearchResultDTO $a, VideoSearchResultDTO $b): VideoSearchResultDTO
    {
        // Se um deles tem transcrição, prioriza
        $transcript = $a->transcript ?: $b->transcript;
        $matchedTimestamp = $a->matchedTimestamp ?? $b->matchedTimestamp;
        $matchedSnippet = $a->matchedSnippet ?: $b->matchedSnippet;
        $durationSeconds = $a->durationSeconds ?: $b->durationSeconds;
        $viewsCount = $a->viewsCount ?: $b->viewsCount;
        $relevanceScore = max($a->relevanceScore, $b->relevanceScore);
        $thumbnailUrl = !empty($a->thumbnailUrl) ? $a->thumbnailUrl : $b->thumbnailUrl;

        return new VideoSearchResultDTO(
            id: $a->id,
            platform: $a->platform,
            externalId: $a->externalId ?: $b->externalId,
            title: strlen($a->title) >= strlen($b->title) ? $a->title : $b->title,
            description: strlen($a->description) >= strlen($b->description) ? $a->description : $b->description,
            originalUrl: $a->originalUrl,
            canonicalUrl: $a->canonicalUrl ?: $b->canonicalUrl,
            thumbnailUrl: $thumbnailUrl,
            author: $a->author !== 'Autor Desconhecido' ? $a->author : $b->author,
            durationSeconds: $durationSeconds,
            publishedAt: $a->publishedAt ?: $b->publishedAt,
            viewsCount: $viewsCount,
            relevanceScore: $relevanceScore,
            matchType: $a->matchType !== 'unverified' ? $a->matchType : $b->matchType,
            matchedSnippet: $matchedSnippet,
            matchedTimestamp: $matchedTimestamp,
            transcript: $transcript,
            extra: array_merge($b->extra, $a->extra)
        );
    }
}
