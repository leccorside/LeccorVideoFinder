<?php

namespace App\Services\Providers;

use App\Contracts\VideoSearchProviderInterface;
use App\DTOs\SearchQueryDTO;
use App\DTOs\VideoSearchResultDTO;
use App\Services\Search\CanonicalDeduplicator;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SearXNGWebVideoProvider implements VideoSearchProviderInterface
{
    protected string $baseUrl;
    protected CanonicalDeduplicator $deduplicator;

    public function __construct(?string $baseUrl = null, ?CanonicalDeduplicator $deduplicator = null)
    {
        $this->baseUrl = rtrim($baseUrl ?? env('SEARXNG_URL', 'http://searxng:8080'), '/');
        $this->deduplicator = $deduplicator ?? new CanonicalDeduplicator();
    }

    public function getId(): string
    {
        return 'searxng_web';
    }

    public function getName(): string
    {
        return 'SearXNG Web Video Engine';
    }

    public function getPlatform(): string
    {
        return 'web';
    }

    public function isAvailable(): bool
    {
        return !empty($this->baseUrl);
    }

    public function getCapabilities(): array
    {
        return [
            'text_search',
            'web_discovery',
            'multi_platform',
            'date_filter',
            'free_unlimited',
        ];
    }

    public function getStatus(): array
    {
        return [
            'available' => $this->isAvailable(),
            'searxng_url' => $this->baseUrl,
            'quota_free' => true,
        ];
    }

    /**
     * @return VideoSearchResultDTO[]
     */
    public function search(SearchQueryDTO $query): array
    {
        if (!$this->isAvailable()) {
            return [];
        }

        try {
            $searchQuery = $query->query;

            // Filtro de plataformas por dorks quando solicitado
            $platformFilter = '';
            if (!empty($query->platforms) && !in_array('all', $query->platforms)) {
                $sites = [];
                foreach ($query->platforms as $p) {
                    if ($p === 'youtube') $sites[] = 'site:youtube.com';
                    if ($p === 'tiktok') $sites[] = 'site:tiktok.com';
                    if ($p === 'vimeo') $sites[] = 'site:vimeo.com';
                    if ($p === 'instagram') $sites[] = 'site:instagram.com/reel';
                    if ($p === 'dailymotion') $sites[] = 'site:dailymotion.com';
                    if ($p === 'reddit') $sites[] = 'site:reddit.com';
                }
                if (!empty($sites)) {
                    $platformFilter = ' (' . implode(' OR ', $sites) . ')';
                }
            }

            $endpoint = "{$this->baseUrl}/search";
            $params = [
                'q' => trim($searchQuery . $platformFilter),
                'format' => 'json',
                'language' => 'auto',
            ];

            // Filtro de tempo do SearXNG (time_range: day, week, month, year)
            if ($query->period === '24h') {
                $params['time_range'] = 'day';
            } elseif ($query->period === '7d') {
                $params['time_range'] = 'week';
            } elseif ($query->period === '30d') {
                $params['time_range'] = 'month';
            } elseif ($query->period === 'year') {
                $params['time_range'] = 'year';
            }

            // Tentativa 1: Busca na categoria 'videos'
            $videoParams = array_merge($params, ['categories' => 'videos']);
            $response = Http::timeout(8)->get($endpoint, $videoParams);

            $resultsRaw = [];
            if ($response->successful()) {
                $json = $response->json();
                $resultsRaw = $json['results'] ?? [];
            }

            // Tentativa 2 (Fallback): Se a categoria específica de vídeos vier vazia, consulta ampla
            if (empty($resultsRaw)) {
                $broadParams = $params; // sem categories para consultar todos os agregadores
                $broadResponse = Http::timeout(8)->get($endpoint, $broadParams);
                if ($broadResponse->successful()) {
                    $broadJson = $broadResponse->json();
                    $candidates = $broadJson['results'] ?? [];
                    // Filtrar apenas candidatos que sejam de vídeo ou tenham URL de plataformas de vídeo
                    $resultsRaw = array_filter($candidates, function ($item) {
                        $url = $item['url'] ?? '';
                        $isKnownHost = preg_match('/(youtube\.com|youtu\.be|tiktok\.com|vimeo\.com|dailymotion\.com|instagram\.com\/reel|reddit\.com|twitch\.tv)/i', $url);
                        $isTemplate = ($item['template'] ?? '') === 'videos.html';
                        return $isKnownHost || $isTemplate;
                    });
                }
            }

            if (empty($resultsRaw)) {
                return [];
            }

            $results = [];
            foreach ($resultsRaw as $item) {
                $url = $item['url'] ?? null;
                if (!$url || !filter_var($url, FILTER_VALIDATE_URL)) {
                    continue;
                }

                $platform = $this->detectPlatform($url);
                $canonical = $this->deduplicator->getCanonicalIdentifier($url, $platform);
                $title = trim(html_entity_decode($item['title'] ?? 'Vídeo', ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                $description = trim(html_entity_decode($item['content'] ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8'));

                // Extração de thumbnail
                $thumbUrl = $item['thumbnail'] ?? $item['img_src'] ?? null;
                if ($platform === 'youtube') {
                    $ytId = $this->extractYoutubeId($url);
                    if ($ytId) {
                        $thumbUrl = "https://i.ytimg.com/vi/{$ytId}/hqdefault.jpg";
                    }
                }
                if (empty($thumbUrl)) {
                    $thumbUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
                }

                // Duração formatada em segundos
                $lengthStr = $item['length'] ?? null;
                $durationSeconds = $this->parseTimeStringToSeconds($lengthStr);

                // Autor ou Canal
                $author = $item['author'] ?? $item['metadata'] ?? null;
                if (empty($author)) {
                    $author = $this->extractAuthorFromUrlOrTitle($url, $platform);
                }

                // External ID a partir da URL
                $externalId = $this->extractExternalId($url, $platform);

                $results[] = new VideoSearchResultDTO(
                    id: (string) Str::uuid(),
                    platform: $platform,
                    externalId: $externalId,
                    title: $title,
                    description: $description,
                    originalUrl: $url,
                    canonicalUrl: $canonical,
                    thumbnailUrl: $thumbUrl,
                    author: $author,
                    durationSeconds: $durationSeconds,
                    publishedAt: $item['publishedDate'] ?? $item['pubdate'] ?? null,
                    viewsCount: isset($item['views']) && is_numeric($item['views']) ? (int) $item['views'] : null,
                    relevanceScore: 80,
                    matchType: 'title_match',
                    matchedSnippet: null,
                    matchedTimestamp: null,
                    transcript: null,
                    extra: [
                        'engine' => $item['engine'] ?? 'searxng',
                        'engines' => $item['engines'] ?? [],
                    ]
                );

                if (count($results) >= $query->limit) {
                    break;
                }
            }

            return array_values($results);
        } catch (\Throwable $e) {
            Log::error("Exceção ao consultar SearXNGWebVideoProvider: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Detecta a plataforma do vídeo baseado no domínio da URL.
     */
    protected function detectPlatform(string $url): string
    {
        $host = strtolower(parse_url($url, PHP_URL_HOST) ?? '');

        if (str_contains($host, 'youtube.com') || str_contains($host, 'youtu.be')) {
            return 'youtube';
        }
        if (str_contains($host, 'tiktok.com')) {
            return 'tiktok';
        }
        if (str_contains($host, 'instagram.com')) {
            return 'instagram';
        }
        if (str_contains($host, 'vimeo.com')) {
            return 'vimeo';
        }
        if (str_contains($host, 'dailymotion.com')) {
            return 'dailymotion';
        }
        if (str_contains($host, 'reddit.com')) {
            return 'reddit';
        }
        if (str_contains($host, 'twitch.tv')) {
            return 'twitch';
        }

        return 'web';
    }

    /**
     * Extrai o identificador único externo da URL de acordo com a plataforma.
     */
    protected function extractExternalId(string $url, string $platform): string
    {
        if ($platform === 'youtube') {
            $id = $this->extractYoutubeId($url);
            if ($id) return $id;
        }

        if ($platform === 'tiktok') {
            if (preg_match('/video\/(\d+)/', $url, $m)) {
                return $m[1];
            }
        }

        if ($platform === 'vimeo') {
            if (preg_match('/vimeo\.com\/(?:video\/)?(\d+)/', $url, $m)) {
                return $m[1];
            }
        }

        return 'ext_' . substr(md5($url), 0, 12);
    }

    /**
     * Extrai o ID do vídeo do YouTube.
     */
    protected function extractYoutubeId(string $url): ?string
    {
        if (preg_match('/(?:v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/', $url, $matches)) {
            return $matches[1];
        }
        return null;
    }

    /**
     * Converte strings de tempo como "03:45", "1:15:20" ou "45s" para segundos.
     */
    protected function parseTimeStringToSeconds(?string $timeStr): ?int
    {
        if (empty($timeStr)) {
            return null;
        }

        $parts = explode(':', trim($timeStr));
        if (count($parts) === 2) {
            return ((int) $parts[0] * 60) + (int) $parts[1];
        }
        if (count($parts) === 3) {
            return ((int) $parts[0] * 3600) + ((int) $parts[1] * 60) + (int) $parts[2];
        }

        return null;
    }

    /**
     * Tenta identificar o autor a partir da URL.
     */
    protected function extractAuthorFromUrlOrTitle(string $url, string $platform): string
    {
        if ($platform === 'tiktok' && preg_match('/@([a-zA-Z0-9_.-]+)/', $url, $m)) {
            return '@' . $m[1];
        }
        if ($platform === 'youtube') {
            return 'YouTube Creator';
        }

        return ucfirst($platform) . ' Video';
    }
}
