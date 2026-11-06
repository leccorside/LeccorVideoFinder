<?php

namespace App\Services\Providers;

use App\Contracts\VideoSearchProviderInterface;
use App\DTOs\SearchQueryDTO;
use App\DTOs\VideoSearchResultDTO;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class DailymotionProvider implements VideoSearchProviderInterface
{
    public function getId(): string
    {
        return 'dailymotion';
    }

    public function getName(): string
    {
        return 'Dailymotion Public API';
    }

    public function getPlatform(): string
    {
        return 'dailymotion';
    }

    public function isAvailable(): bool
    {
        return true;
    }

    public function getCapabilities(): array
    {
        return [
            'text_search',
            'duration_filter',
            'views_count',
            'free_unlimited',
            'sort_filter',
        ];
    }

    public function getStatus(): array
    {
        return [
            'available' => true,
            'api' => 'https://api.dailymotion.com/videos',
            'mode' => 'public_free',
        ];
    }

    /**
     * @return VideoSearchResultDTO[]
     */
    public function search(SearchQueryDTO $query): array
    {
        try {
            $params = [
                'search' => $query->query,
                'fields' => 'id,title,description,duration,thumbnail_720_url,url,views_total,created_time,owner.screenname',
                'limit' => min(50, max(5, $query->limit)),
            ];

            // Ordenação
            if ($query->sortBy === 'views') {
                $params['sort'] = 'visited';
            } elseif ($query->sortBy === 'recent') {
                $params['sort'] = 'recent';
            } else {
                $params['sort'] = 'relevance';
            }

            // Filtro de duração nativo do Dailymotion
            if ($query->duration === 'short') {
                $params['shorter_than'] = 60;
            } elseif ($query->duration === 'medium') {
                $params['longer_than'] = 60;
                $params['shorter_than'] = 300;
            } elseif ($query->duration === 'long') {
                $params['longer_than'] = 300;
            }

            $response = Http::timeout(8)
                ->get('https://api.dailymotion.com/videos', $params);

            if (!$response->successful()) {
                Log::warning("Dailymotion API retornou status HTTP " . $response->status());
                return [];
            }

            $data = $response->json();
            $items = $data['list'] ?? [];

            if (empty($items)) {
                return [];
            }

            $results = [];
            foreach ($items as $item) {
                $id = $item['id'] ?? null;
                $url = $item['url'] ?? "https://www.dailymotion.com/video/{$id}";
                if (!$id) {
                    continue;
                }

                $title = trim(html_entity_decode($item['title'] ?? 'Vídeo Dailymotion', ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                $description = trim(html_entity_decode($item['description'] ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8'));

                // Thumbnail de alta qualidade
                $thumbUrl = $item['thumbnail_720_url'] ?? "https://s1.dmcdn.net/v/{$id}/x720";

                // Data de criação formatada
                $publishedAt = null;
                if (!empty($item['created_time'])) {
                    $publishedAt = gmdate('Y-m-d\TH:i:s\Z', (int) $item['created_time']);
                }

                $author = $item['owner.screenname'] ?? 'Canal Dailymotion';
                $duration = isset($item['duration']) ? (int) $item['duration'] : null;
                $views = isset($item['views_total']) ? (int) $item['views_total'] : null;

                $results[] = new VideoSearchResultDTO(
                    id: (string) Str::uuid(),
                    platform: 'dailymotion',
                    externalId: $id,
                    title: $title,
                    description: $description,
                    originalUrl: $url,
                    canonicalUrl: "dailymotion:{$id}",
                    thumbnailUrl: $thumbUrl,
                    author: $author,
                    durationSeconds: $duration,
                    publishedAt: $publishedAt,
                    viewsCount: $views,
                    relevanceScore: 78,
                    matchType: 'title_match',
                    matchedSnippet: null,
                    matchedTimestamp: null,
                    transcript: null,
                    extra: [
                        'owner' => $item['owner.screenname'] ?? null,
                    ]
                );
            }

            return $results;
        } catch (\Throwable $e) {
            Log::error("Exceção ao consultar DailymotionProvider: " . $e->getMessage());
            return [];
        }
    }
}

