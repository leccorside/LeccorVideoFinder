<?php

namespace App\DTOs;

readonly class VideoSearchResultDTO
{
    public function __construct(
        public string $id,
        public string $platform,
        public string $externalId,
        public string $title,
        public string $description,
        public string $originalUrl,
        public string $canonicalUrl,
        public string $thumbnailUrl,
        public string $author,
        public ?int $durationSeconds = null,
        public ?string $publishedAt = null,
        public ?int $viewsCount = null,
        public int $relevanceScore = 50,
        public string $matchType = 'text_match',
        public ?string $matchedSnippet = null,
        public ?int $matchedTimestamp = null,
        public ?array $transcript = null,
        public array $extra = []
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'] ?? (string) \Illuminate\Support\Str::uuid(),
            platform: $data['platform'] ?? 'web',
            externalId: (string) ($data['externalId'] ?? $data['external_id'] ?? ''),
            title: $data['title'] ?? '',
            description: $data['description'] ?? '',
            originalUrl: $data['originalUrl'] ?? $data['original_url'] ?? '',
            canonicalUrl: $data['canonicalUrl'] ?? $data['canonical_url'] ?? ($data['originalUrl'] ?? ''),
            thumbnailUrl: $data['thumbnailUrl'] ?? $data['thumbnail_url'] ?? '',
            author: $data['author'] ?? 'Autor Desconhecido',
            durationSeconds: isset($data['durationSeconds']) ? (int) $data['durationSeconds'] : (isset($data['duration_seconds']) ? (int) $data['duration_seconds'] : null),
            publishedAt: $data['publishedAt'] ?? $data['published_at'] ?? null,
            viewsCount: isset($data['viewsCount']) ? (int) $data['viewsCount'] : (isset($data['views_count']) ? (int) $data['views_count'] : null),
            relevanceScore: min(100, max(0, (int) ($data['relevanceScore'] ?? $data['relevance_score'] ?? 50))),
            matchType: $data['matchType'] ?? $data['match_type'] ?? 'text_match',
            matchedSnippet: $data['matchedSnippet'] ?? $data['matched_snippet'] ?? null,
            matchedTimestamp: isset($data['matchedTimestamp']) ? (int) $data['matchedTimestamp'] : (isset($data['matched_timestamp']) ? (int) $data['matched_timestamp'] : null),
            transcript: $data['transcript'] ?? null,
            extra: $data['extra'] ?? []
        );
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'platform' => $this->platform,
            'externalId' => $this->externalId,
            'title' => $this->title,
            'description' => $this->description,
            'originalUrl' => $this->originalUrl,
            'canonicalUrl' => $this->canonicalUrl,
            'thumbnailUrl' => $this->thumbnailUrl,
            'author' => $this->author,
            'durationSeconds' => $this->durationSeconds,
            'publishedAt' => $this->publishedAt,
            'viewsCount' => $this->viewsCount,
            'relevanceScore' => $this->relevanceScore,
            'matchType' => $this->matchType,
            'matchedSnippet' => $this->matchedSnippet,
            'matchedTimestamp' => $this->matchedTimestamp,
            'transcript' => $this->transcript,
            'extra' => $this->extra,
        ];
    }

    /**
     * Retorna uma nova instância com a pontuação de relevância e tipo de match atualizados.
     */
    public function withRelevance(int $score, string $matchType, ?string $snippet = null, ?int $timestamp = null): self
    {
        return new self(
            id: $this->id,
            platform: $this->platform,
            externalId: $this->externalId,
            title: $this->title,
            description: $this->description,
            originalUrl: $this->originalUrl,
            canonicalUrl: $this->canonicalUrl,
            thumbnailUrl: $this->thumbnailUrl,
            author: $this->author,
            durationSeconds: $this->durationSeconds,
            publishedAt: $this->publishedAt,
            viewsCount: $this->viewsCount,
            relevanceScore: min(100, max(0, $score)),
            matchType: $matchType,
            matchedSnippet: $snippet ?? $this->matchedSnippet,
            matchedTimestamp: $timestamp ?? $this->matchedTimestamp,
            transcript: $this->transcript,
            extra: $this->extra
        );
    }
}

