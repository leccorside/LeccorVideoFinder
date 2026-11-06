<?php

namespace App\Services\Providers;

use App\Contracts\VideoSearchProviderInterface;
use App\DTOs\SearchQueryDTO;
use App\DTOs\VideoSearchResultDTO;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RedditProvider implements VideoSearchProviderInterface
{
    protected string $searxngUrl;

    public function __construct(?string $searxngUrl = null)
    {
        $this->searxngUrl = rtrim($searxngUrl ?? env('SEARXNG_URL', 'http://searxng:8080'), '/');
    }

    public function getId(): string
    {
        return 'reddit';
    }

    public function getName(): string
    {
        return 'Reddit Video Discovery';
    }

    public function getPlatform(): string
    {
        return 'reddit';
    }

    public function isAvailable(): bool
    {
        return !empty($this->searxngUrl);
    }

    public function getCapabilities(): array
    {
        return [
            'text_search',
            'community_videos',
            'free_unlimited',
        ];
    }

    public function getStatus(): array
    {
        return [
            'available' => $this->isAvailable(),
            'platform' => 'reddit',
            'mode' => 'public_discovery',
        ];
    }

    /**
     * @return VideoSearchResultDTO[]
     */
    public function search(SearchQueryDTO $query): array
    {
        try {
            $searchQuery = trim($query->query . ' (site:reddit.com/r/videos OR site:v.redd.it)');

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
                if (!str_contains($url, 'reddit.com') && !str_contains($url, 'v.redd.it')) {
                    continue;
                }

                // Identificador do post
                $externalId = 'rd_' . substr(md5($url), 0, 10);
                if (preg_match('/comments\/([a-zA-Z0-9]+)/i', $url, $m)) {
                    $externalId = $m[1];
                }

                $title = trim(html_entity_decode($item['title'] ?? 'Vídeo no Reddit', ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                // Limpar sufixos comuns do Reddit
                $title = preg_replace('/\s*:\s*r\/[a-zA-Z0-9_]+$/i', '', $title);

                $description = trim(html_entity_decode($item['content'] ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                $thumbUrl = $item['thumbnail'] ?? $item['img_src'] ?? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';

                // Subreddit
                $author = 'r/videos';
                if (preg_match('/reddit\.com\/r\/([a-zA-Z0-9_]+)/i', $url, $subMatches)) {
                    $author = 'r/' . $subMatches[1];
                }

                $results[] = new VideoSearchResultDTO(
                    id: (string) Str::uuid(),
                    platform: 'reddit',
                    externalId: $externalId,
                    title: $title,
                    description: $description,
                    originalUrl: $url,
                    canonicalUrl: "reddit:{$externalId}",
                    thumbnailUrl: $thumbUrl,
                    author: $author,
                    durationSeconds: null,
                    publishedAt: $item['publishedDate'] ?? null,
                    viewsCount: null,
                    relevanceScore: 72,
                    matchType: 'title_match',
                    matchedSnippet: null,
                    matchedTimestamp: null,
                    transcript: null,
                    extra: [
                        'subreddit' => $author,
                    ]
                );

                if (count($results) >= $query->limit) {
                    break;
                }
            }

            return $results;
        } catch (\Throwable $e) {
            Log::error("Exceção ao consultar RedditProvider: " . $e->getMessage());
            return [];
        }
    }
}

