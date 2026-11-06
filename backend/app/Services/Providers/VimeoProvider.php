<?php

namespace App\Services\Providers;

use App\Contracts\VideoSearchProviderInterface;
use App\DTOs\SearchQueryDTO;
use App\DTOs\VideoSearchResultDTO;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class VimeoProvider implements VideoSearchProviderInterface
{
    protected string $searxngUrl;

    public function __construct(?string $searxngUrl = null)
    {
        $this->searxngUrl = rtrim($searxngUrl ?? env('SEARXNG_URL', 'http://searxng:8080'), '/');
    }

    public function getId(): string
    {
        return 'vimeo';
    }

    public function getName(): string
    {
        return 'Vimeo Video Discovery';
    }

    public function getPlatform(): string
    {
        return 'vimeo';
    }

    public function isAvailable(): bool
    {
        return !empty($this->searxngUrl);
    }

    public function getCapabilities(): array
    {
        return [
            'text_search',
            'hd_thumbnails',
            'free_unlimited',
        ];
    }

    public function getStatus(): array
    {
        return [
            'available' => $this->isAvailable(),
            'platform' => 'vimeo',
            'mode' => 'public_discovery',
        ];
    }

    /**
     * @return VideoSearchResultDTO[]
     */
    public function search(SearchQueryDTO $query): array
    {
        try {
            $searchQuery = trim($query->query . ' site:vimeo.com');

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
                if (!preg_match('/vimeo\.com\/(?:video\/)?(\d+)/i', $url, $matches)) {
                    continue;
                }

                $vimeoId = $matches[1];
                $cleanUrl = "https://vimeo.com/{$vimeoId}";
                $title = trim(html_entity_decode($item['title'] ?? 'Vídeo Vimeo', ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                // Limpar sufixos comuns do Vimeo no título
                $title = preg_replace('/\s+on Vimeo$/i', '', $title);
                $title = preg_replace('/\s+-\s+Vimeo$/i', '', $title);

                $description = trim(html_entity_decode($item['content'] ?? '', ENT_QUOTES | ENT_HTML5, 'UTF-8'));

                // Thumbnail: do resultado SearXNG ou fallback do CDN do Vimeo
                $thumbUrl = $item['thumbnail'] ?? $item['img_src'] ?? "https://i.vimeocdn.com/video/{$vimeoId}_640.jpg";

                $author = $item['author'] ?? 'Vimeo Creator';

                // Parsing de tempo caso venha informado
                $duration = null;
                if (!empty($item['length'])) {
                    $parts = explode(':', $item['length']);
                    if (count($parts) === 2) {
                        $duration = ((int) $parts[0] * 60) + (int) $parts[1];
                    }
                }

                $results[] = new VideoSearchResultDTO(
                    id: (string) Str::uuid(),
                    platform: 'vimeo',
                    externalId: $vimeoId,
                    title: $title,
                    description: $description,
                    originalUrl: $cleanUrl,
                    canonicalUrl: "vimeo:{$vimeoId}",
                    thumbnailUrl: $thumbUrl,
                    author: $author,
                    durationSeconds: $duration,
                    publishedAt: $item['publishedDate'] ?? null,
                    viewsCount: null,
                    relevanceScore: 75,
                    matchType: 'title_match',
                    matchedSnippet: null,
                    matchedTimestamp: null,
                    transcript: null,
                    extra: [
                        'vimeo_id' => $vimeoId,
                    ]
                );

                if (count($results) >= $query->limit) {
                    break;
                }
            }

            return $results;
        } catch (\Throwable $e) {
            Log::error("Exceção ao consultar VimeoProvider: " . $e->getMessage());
            return [];
        }
    }
}

