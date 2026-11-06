<?php

namespace App\Services\Providers;

use App\Contracts\VideoSearchProviderInterface;
use App\DTOs\SearchQueryDTO;
use App\DTOs\VideoSearchResultDTO;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class YouTubeProvider implements VideoSearchProviderInterface
{
    protected ?string $apiKey;
    protected YouTubeQuotaGuard $quotaGuard;

    public function __construct(?string $apiKey = null, ?YouTubeQuotaGuard $quotaGuard = null)
    {
        $this->apiKey = $apiKey ?? env('YOUTUBE_API_KEY');
        $this->quotaGuard = $quotaGuard ?? new YouTubeQuotaGuard();
    }

    public function getId(): string
    {
        return 'youtube';
    }

    public function getName(): string
    {
        return 'YouTube Data API v3';
    }

    public function getPlatform(): string
    {
        return 'youtube';
    }

    public function isAvailable(): bool
    {
        if (empty($this->apiKey)) {
            return false;
        }

        return !$this->quotaGuard->isExhausted();
    }

    public function getCapabilities(): array
    {
        return [
            'text_search',
            'duration_filter',
            'date_filter',
            'views_count',
            'exact_metadata',
            'channel_filter',
        ];
    }

    public function getStatus(): array
    {
        return [
            'available' => $this->isAvailable(),
            'has_api_key' => !empty($this->apiKey),
            'quota' => $this->quotaGuard->getUsage(),
        ];
    }

    /**
     * @return VideoSearchResultDTO[]
     */
    public function search(SearchQueryDTO $query): array
    {
        if (!$this->isAvailable() || !$this->quotaGuard->canConsume(100)) {
            Log::info("YouTubeProvider indisponível ou sem quota. Provedor Web SearXNG assumirá a descoberta de vídeos.");
            return [];
        }

        try {
            $params = [
                'part' => 'snippet',
                'type' => 'video',
                'q' => $query->query,
                'maxResults' => min(50, max(5, $query->limit)),
                'key' => $this->apiKey,
            ];

            // Ordenação
            if ($query->sortBy === 'recent') {
                $params['order'] = 'date';
            } elseif ($query->sortBy === 'views') {
                $params['order'] = 'viewCount';
            } else {
                $params['order'] = 'relevance';
            }

            // Filtro de duração
            if ($query->duration === 'short') {
                $params['videoDuration'] = 'short'; // < 4 min
            } elseif ($query->duration === 'medium') {
                $params['videoDuration'] = 'medium'; // 4 a 20 min
            } elseif ($query->duration === 'long') {
                $params['videoDuration'] = 'long'; // > 20 min
            }

            // Filtro de período
            if ($query->period === '24h') {
                $params['publishedAfter'] = gmdate('Y-m-d\TH:i:s\Z', strtotime('-1 day'));
            } elseif ($query->period === '7d') {
                $params['publishedAfter'] = gmdate('Y-m-d\TH:i:s\Z', strtotime('-7 days'));
            } elseif ($query->period === '30d') {
                $params['publishedAfter'] = gmdate('Y-m-d\TH:i:s\Z', strtotime('-30 days'));
            } elseif ($query->period === 'year') {
                $params['publishedAfter'] = gmdate('Y-m-d\TH:i:s\Z', strtotime('-365 days'));
            }

            $response = Http::timeout(8)
                ->get('https://www.googleapis.com/youtube/v3/search', $params);

            if (!$response->successful()) {
                Log::warning("Erro na requisição YouTube Search API: " . $response->body());
                return [];
            }

            // Registra 100 pontos consumidos
            $this->quotaGuard->recordConsumption(100, 'search');

            $data = $response->json();
            $items = $data['items'] ?? [];

            if (empty($items)) {
                return [];
            }

            // Extrair IDs para consulta em lote de detalhes (duração, views)
            $videoIds = [];
            foreach ($items as $item) {
                if (isset($item['id']['videoId'])) {
                    $videoIds[] = $item['id']['videoId'];
                }
            }

            $videoDetails = $this->fetchVideoDetails($videoIds);

            $results = [];
            foreach ($items as $item) {
                $videoId = $item['id']['videoId'] ?? null;
                if (!$videoId) {
                    continue;
                }

                $snippet = $item['snippet'] ?? [];
                $details = $videoDetails[$videoId] ?? null;

                $durationSeconds = $details ? $details['duration'] : null;
                $viewsCount = $details ? $details['views'] : null;

                // Escolha da melhor thumbnail
                $thumbUrl = "https://i.ytimg.com/vi/{$videoId}/hqdefault.jpg";
                if (!empty($snippet['thumbnails']['high']['url'])) {
                    $thumbUrl = $snippet['thumbnails']['high']['url'];
                } elseif (!empty($snippet['thumbnails']['medium']['url'])) {
                    $thumbUrl = $snippet['thumbnails']['medium']['url'];
                }

                $results[] = new VideoSearchResultDTO(
                    id: (string) Str::uuid(),
                    platform: 'youtube',
                    externalId: $videoId,
                    title: html_entity_decode($snippet['title'] ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8'),
                    description: $snippet['description'] ?? '',
                    originalUrl: "https://www.youtube.com/watch?v={$videoId}",
                    canonicalUrl: "youtube:{$videoId}",
                    thumbnailUrl: $thumbUrl,
                    author: $snippet['channelTitle'] ?? 'Canal YouTube',
                    durationSeconds: $durationSeconds,
                    publishedAt: $snippet['publishedAt'] ?? null,
                    viewsCount: $viewsCount,
                    relevanceScore: 85,
                    matchType: 'title_match',
                    matchedSnippet: null,
                    matchedTimestamp: null,
                    transcript: null,
                    extra: [
                        'channel_id' => $snippet['channelId'] ?? null,
                    ]
                );
            }

            return $results;
        } catch (\Throwable $e) {
            Log::error("Exceção ao consultar YouTubeProvider: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Consulta detalhes adicionais (duração exata e views) em lote (consome apenas 1 ponto de quota).
     */
    protected function fetchVideoDetails(array $videoIds): array
    {
        if (empty($videoIds) || empty($this->apiKey) || !$this->quotaGuard->canConsume(1)) {
            return [];
        }

        try {
            $idsChunk = implode(',', array_slice($videoIds, 0, 50));
            $response = Http::timeout(6)
                ->get('https://www.googleapis.com/youtube/v3/videos', [
                    'part' => 'contentDetails,statistics',
                    'id' => $idsChunk,
                    'key' => $this->apiKey,
                ]);

            if ($response->successful()) {
                $this->quotaGuard->recordConsumption(1, 'videos_detail');
                $data = $response->json();
                $mapped = [];

                foreach ($data['items'] ?? [] as $v) {
                    $id = $v['id'] ?? null;
                    if (!$id) {
                        continue;
                    }

                    $isoDuration = $v['contentDetails']['duration'] ?? null;
                    $durationSec = $isoDuration ? $this->parseIsoDuration($isoDuration) : null;
                    $views = isset($v['statistics']['viewCount']) ? (int) $v['statistics']['viewCount'] : null;

                    $mapped[$id] = [
                        'duration' => $durationSec,
                        'views' => $views,
                    ];
                }

                return $mapped;
            }
        } catch (\Throwable $e) {
            Log::warning("Erro ao consultar detalhes de vídeos no YouTube: " . $e->getMessage());
        }

        return [];
    }

    /**
     * Converte duração ISO 8601 (ex: PT1H2M30S, PT5M12S, PT45S) em segundos.
     */
    protected function parseIsoDuration(string $duration): ?int
    {
        try {
            $interval = new \DateInterval($duration);
            return ($interval->h * 3600) + ($interval->i * 60) + $interval->s;
        } catch (\Throwable $e) {
            return null;
        }
    }
}
