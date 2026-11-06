<?php

namespace App\DTOs;

readonly class SearchQueryDTO
{
    public function __construct(
        public string $query,
        public array $platforms = [],
        public string $duration = 'all',
        public string $period = 'all',
        public string $mode = 'simple',
        public string $language = 'pt-BR',
        public int $limit = 30,
        public int $offset = 0,
        public string $sortBy = 'relevance',
        public ?string $sessionId = null
    ) {}

    public static function fromArray(array $data): self
    {
        $platforms = $data['platforms'] ?? [];
        if (is_string($platforms)) {
            $platforms = array_filter(explode(',', $platforms));
        }

        return new self(
            query: trim($data['q'] ?? $data['query'] ?? ''),
            platforms: (array) $platforms,
            duration: $data['duration'] ?? 'all',
            period: $data['period'] ?? 'all',
            mode: $data['mode'] ?? 'simple',
            language: $data['language'] ?? 'pt-BR',
            limit: min(100, max(1, (int) ($data['limit'] ?? 30))),
            offset: max(0, (int) ($data['offset'] ?? 0)),
            sortBy: $data['sort'] ?? $data['sortBy'] ?? 'relevance',
            sessionId: $data['session_id'] ?? null
        );
    }

    public function toArray(): array
    {
        return [
            'query' => $this->query,
            'platforms' => $this->platforms,
            'duration' => $this->duration,
            'period' => $this->period,
            'mode' => $this->mode,
            'language' => $this->language,
            'limit' => $this->limit,
            'offset' => $this->offset,
            'sortBy' => $this->sortBy,
            'session_id' => $this->sessionId,
        ];
    }

    /**
     * Gera uma chave de hash estável para armazenamento em cache.
     */
    public function getCacheKey(): string
    {
        $plat = $this->platforms;
        sort($plat);

        $payload = [
            'q' => strtolower($this->query),
            'plat' => $plat,
            'dur' => $this->duration,
            'per' => $this->period,
            'mod' => $this->mode,
            'lang' => $this->language,
        ];

        return 'search_cache:' . md5(json_encode($payload));
    }
}
