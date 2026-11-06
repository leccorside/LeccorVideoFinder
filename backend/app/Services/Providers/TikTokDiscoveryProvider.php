<?php

namespace App\Services\Providers;

use App\Contracts\VideoSearchProviderInterface;
use App\DTOs\SearchQueryDTO;
use App\DTOs\VideoSearchResultDTO;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TikTokDiscoveryProvider implements VideoSearchProviderInterface
{
    protected string $searxngUrl;

    public function __construct(?string $searxngUrl = null)
    {
        $this->searxngUrl = rtrim($searxngUrl ?? env('SEARXNG_URL', 'http://searxng:8080'), '/');
    }

    public function getId(): string
    {
        return 'tiktok';
    }

    public function getName(): string
    {
        return 'TikTok Public Discovery';
    }

    public function getPlatform(): string
    {
        return 'tiktok';
    }

    public function isAvailable(): bool
    {
        return !empty($this->searxngUrl);
    }

    public function getCapabilities(): array
    {
        return [
            'text_search',
            'short_videos',
            'free_unlimited',
        ];
    }

    public function getStatus(): array
    {
        return [
            'available' => $this->isAvailable(),
            'platform' => 'tiktok',
            'mode' => 'public_discovery',
        ];
    }

    /**
     * @return VideoSearchResultDTO[]
     */
    public function search(SearchQueryDTO $query): array
    {
        try {
            $searchQuery = trim($query->query . ' site:tiktok.com/@');

            $response = Http::timeout(8)->get("{$this->searxngUrl}/search", [
                'q' => $searchQuery,
                'format' => 'json',
                'language' => 'auto',
            ]);

            if (!$response->successful()) {
                return [];
            }

            $json = $response->json();
            $items = $json['results'] ?? [];

            $results = [];
            foreach ($items as $item) {
                $url = $item['url'] ?? '';
                if (!preg_match('/tiktok\.com\/@([a-zA-Z0-9_.-]+)\/video\/(\d+)/i', $url, $matches)) {
                    continue;
                }

                $username = '@' . $matches[1];
                $videoId = $matches[2];
                $cleanUrl = "https://www.tiktok.com/{$username}/video/{$videoId}";

                $title = trim(html_entity_decode($item['title'] ?? 'Vídeo TikTok', ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                // Limpar sufixos comuns do TikTok no título
                $title = preg_replace('/\s*\|\s*TikTok$/i', '', $title);

                $description = trim(html_entity_decode($item['content'] ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                $thumbUrl = $item['thumbnail'] ?? $item['img_src'] ?? 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=800&auto=format&fit=crop&q=80';

                // Duração estimada para shorts do TikTok (geralmente entre 15s e 60s)
                $duration = null;
                if (!empty($item['length'])) {
                    $parts = explode(':', $item['length']);
                    if (count($parts) === 2) {
                        $duration = ((int) $parts[0] * 60) + (int) $parts[1];
                    }
                } else {
                    $duration = 45; // Duração média estimada para reels/shorts
                }

                $results[] = new VideoSearchResultDTO(
                    id: (string) Str::uuid(),
                    platform: 'tiktok',
                    externalId: $videoId,
                    title: $title,
                    description: $description,
                    originalUrl: $cleanUrl,
                    canonicalUrl: "tiktok:{$videoId}",
                    thumbnailUrl: $thumbUrl,
                    author: $username,
                    durationSeconds: $duration,
                    publishedAt: $item['publishedDate'] ?? null,
                    viewsCount: null,
                    relevanceScore: 78,
                    matchType: 'title_match',
                    matchedSnippet: null,
                    matchedTimestamp: null,
                    transcript: null,
                    extra: [
                        'tiktok_id' => $videoId,
                        'author_handle' => $username,
                    ]
                );

                if (count($results) >= $query->limit) {
                    break;
                }
            }

            return $results;
        } catch (\Throwable $e) {
            Log::error("Exceção ao consultar TikTokDiscoveryProvider: " . $e->getMessage());
            return [];
        }
    }
}

