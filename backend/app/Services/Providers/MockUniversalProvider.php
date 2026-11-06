<?php

namespace App\Services\Providers;

use App\Contracts\VideoSearchProviderInterface;
use App\DTOs\SearchQueryDTO;
use App\DTOs\VideoSearchResultDTO;

class MockUniversalProvider implements VideoSearchProviderInterface
{
    protected string $id;
    protected string $name;
    protected string $platform;

    public function __construct(string $id = 'web-discovery', string $name = 'Web Video Discovery', string $platform = 'web')
    {
        $this->id = $id;
        $this->name = $name;
        $this->platform = $platform;
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function getPlatform(): string
    {
        return $this->platform;
    }

    public function search(SearchQueryDTO $query): array
    {
        $q = $query->query;

        // Demonstração estruturada em conformidade com o formato DTO
        return [
            new VideoSearchResultDTO(
                id: (string) \Illuminate\Support\Str::uuid(),
                platform: $this->platform,
                externalId: 'ext_' . substr(md5($q . $this->id . '1'), 0, 10),
                title: "{$q} — Análise e Explicação Completa",
                description: "Vídeo detalhado abordando o tema: {$q}, com exemplos práticos, contexto histórico e dicas para aplicação.",
                originalUrl: "https://{$this->platform}.com/watch?v=sample1",
                canonicalUrl: "{$this->platform}:sample1",
                thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80',
                author: 'Canal de Conteúdo Aberto',
                durationSeconds: 320,
                publishedAt: 'há 2 dias',
                viewsCount: 45000,
                relevanceScore: 92,
                matchType: 'exact_phrase',
                matchedSnippet: "Neste trecho essencial sobre {$q}, aprendemos a não recuar diante dos desafios.",
                matchedTimestamp: 42,
                transcript: [
                    'language' => 'pt-BR',
                    'isVerified' => true,
                    'segments' => [
                        ['startTime' => 20, 'endTime' => 38, 'text' => "Iniciando a discussão sobre {$q}."],
                        ['startTime' => 42, 'endTime' => 58, 'text' => "Neste trecho essencial sobre {$q}, aprendemos a não recuar diante dos desafios."],
                        ['startTime' => 60, 'endTime' => 85, 'text' => "A constância supera a motivação temporária."],
                    ],
                ]
            ),
            new VideoSearchResultDTO(
                id: (string) \Illuminate\Support\Str::uuid(),
                platform: $this->platform,
                externalId: 'ext_' . substr(md5($q . $this->id . '2'), 0, 10),
                title: "A Verdade Sobre: {$q} em 5 Minutos",
                description: "Resumo condensado sobre {$q} para quem precisa de clareza rápida e insights acionáveis.",
                originalUrl: "https://{$this->platform}.com/video/sample2",
                canonicalUrl: "{$this->platform}:sample2",
                thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&auto=format&fit=crop&q=80',
                author: 'Cortes Rápidos & Insights',
                durationSeconds: 185,
                publishedAt: 'há 1 semana',
                viewsCount: 120000,
                relevanceScore: 84,
                matchType: 'text_match',
                matchedSnippet: "Principais pontos práticos de {$q} analisados.",
                matchedTimestamp: 15
            ),
        ];
    }

    public function getCapabilities(): array
    {
        return ['text_search', 'exact_phrase', 'transcripts', 'duration_filter'];
    }

    public function isAvailable(): bool
    {
        return true;
    }

    public function getStatus(): array
    {
        return [
            'status' => 'operational',
            'latency_ms' => 120,
            'quota_free' => true,
        ];
    }
}

