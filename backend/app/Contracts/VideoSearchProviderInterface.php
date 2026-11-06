<?php

namespace App\Contracts;

use App\DTOs\SearchQueryDTO;
use App\DTOs\VideoSearchResultDTO;

interface VideoSearchProviderInterface
{
    /**
     * Identificador do provedor (ex: 'youtube', 'tiktok', 'vimeo', 'searxng').
     */
    public function getId(): string;

    /**
     * Nome amigável do provedor para exibição.
     */
    public function getName(): string;

    /**
     * Plataforma alvo (ex: 'youtube', 'tiktok', 'instagram', 'vimeo', 'reddit', 'web').
     */
    public function getPlatform(): string;

    /**
     * Executa a busca de vídeos e retorna uma lista de DTOs normalizados.
     *
     * @param SearchQueryDTO $query
     * @return VideoSearchResultDTO[]
     */
    public function search(SearchQueryDTO $query): array;

    /**
     * Retorna os recursos e filtros suportados pelo provedor.
     * Ex: ['text_search', 'duration_filter', 'date_filter', 'transcripts', 'views_count']
     */
    public function getCapabilities(): array;

    /**
     * Indica se o provedor está disponível e com cotas ativas no momento.
     */
    public function isAvailable(): bool;

    /**
     * Retorna informações de diagnóstico e saúde do provedor.
     */
    public function getStatus(): array;
}

