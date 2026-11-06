<?php

namespace App\Services\Providers;

use App\Contracts\VideoSearchProviderInterface;
use App\DTOs\SearchQueryDTO;
use App\DTOs\VideoSearchResultDTO;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SocialReelsDiscoveryProvider implements VideoSearchProviderInterface
{
    protected string $searxngUrl;

    public function __construct(?string $searxngUrl = null)
    {
        $this->searxngUrl = rtrim($searxngUrl ?? env('SEARXNG_URL', 'http://searxng:8080'), '/');
    }

    public function getId(): string
    {
        return 'instagram';
    }

    public function getName(): string
    {
        return 'Instagram Reels & Social Video';
    }

    public function getPlatform(): string
    {
        return 'instagram';
    }

    public function isAvailable(): bool
    {
        return !empty($this->searxngUrl);
    }

    public function getCapabilities(): array
    {
        return [
            'text_search',
            'reels_discovery',
            'short_videos',
            'free_unlimited',
        ];
    }

    public function getStatus(): array
    {
        return [
            'available' => $this->isAvailable(),
            'platform' => 'instagram',
            'mode' => 'public_discovery',
        ];
    }

    /**
     * @return VideoSearchResultDTO[]
     */
    public function search(SearchQueryDTO $query): array
    {
        try {
            $searchQuery = trim($query->query . ' site:instagram.com/reel/');

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
                if (!preg_match('/instagram\.com\/reel\/([a-zA-Z0-9_-]+)/i', $url, $matches)) {
                    continue;
                }

                $reelId = $matches[1];
                $cleanUrl = "https://www.instagram.com/reel/{$reelId}/";

                $title = trim(html_entity_decode($item['title'] ?? 'Instagram Reel', ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                // Limpar sufixos comuns do Instagram no título
                $title = preg_replace('/\s*on Instagram:.*$/i', '', $title);
                $title = preg_replace('/\s*• Instagram photos and videos$/i', '', $title);

                $description = trim(html_entity_decode($item['content'] ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                $thumbUrl = $item['thumbnail'] ?? $item['img_src'] ?? 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&auto=format&fit=crop&q=80';

                $author = 'Instagram Creator';
                if (preg_match('/(?:by|de)\s+@?([a-zA-Z0-9_.-]+)/i', $title . ' ' . $description, $authMatches)) {
                    $author = '@' . $authMatches[1];
                }

                $results[] = new VideoSearchResultDTO(
                    id: (string) Str::uuid(),
                    platform: 'instagram',
                    externalId: $reelId,
                    title: $title,
                    description: $description,
                    originalUrl: $cleanUrl,
                    canonicalUrl: "instagram:{$reelId}",
                    thumbnailUrl: $thumbUrl,
                    author: $author,
                    durationSeconds: 30, // Formato reels padrão
                    publishedAt: $item['publishedDate'] ?? null,
                    viewsCount: null,
                    relevanceScore: 76,
                    matchType: 'title_match',
                    matchedSnippet: null,
                    matchedTimestamp: null,
                    transcript: null,
                    extra: [
                        'reel_id' => $reelId,
                    ]
                );

                if (count($results) >= $query->limit) {
                    break;
                }
            }

            return $results;
        } catch (\Throwable $e) {
            Log::error("Exceção ao consultar SocialReelsDiscoveryProvider: " . $e->getMessage());
            return [];
        }
    }
}

