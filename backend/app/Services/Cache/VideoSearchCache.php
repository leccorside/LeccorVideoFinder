<?php

namespace App\Services\Cache;

use App\DTOs\SearchQueryDTO;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class VideoSearchCache
{
    protected int $defaultTtl;

    public function __construct(int $defaultTtl = 86400) // 24 horas por padrão
    {
        $this->defaultTtl = $defaultTtl;
    }

    /**
     * Recupera do cache Redis o resultado consolidado de uma pesquisa.
     */
    public function get(SearchQueryDTO $query): ?array
    {
        $key = 'videofinder:search:' . $query->getCacheKey();

        try {
            $cached = Redis::get($key);
            if ($cached) {
                $decoded = json_decode($cached, true);
                if (is_array($decoded)) {
                    $decoded['stats']['from_cache'] = true;
                    return $decoded;
                }
            }
        } catch (\Throwable $e) {
            Log::warning("Erro ao ler cache do Redis para query '{$query->query}': " . $e->getMessage());
        }

        return null;
    }

    /**
     * Armazena no Redis o resultado consolidado de uma pesquisa com TTL de 24h.
     */
    public function put(SearchQueryDTO $query, array $data, ?int $ttl = null): void
    {
        $key = 'videofinder:search:' . $query->getCacheKey();
        $ttl = $ttl ?? $this->defaultTtl;

        try {
            Redis::setex($key, $ttl, json_encode($data, JSON_UNESCAPED_UNICODE));
        } catch (\Throwable $e) {
            Log::warning("Erro ao salvar cache no Redis para query '{$query->query}': " . $e->getMessage());
        }
    }

    /**
     * Recupera metadados estendidos de um vídeo pelo seu identificador canônico (ex: youtube:dQw4w9WgXcQ).
     */
    public function getVideoMetadata(string $canonicalUrl): ?array
    {
        $key = 'videofinder:video:' . md5($canonicalUrl);

        try {
            $cached = Redis::get($key);
            if ($cached) {
                return json_decode($cached, true);
            }
        } catch (\Throwable $e) {
            Log::warning("Erro ao ler cache de vídeo: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Armazena metadados de vídeo com TTL agressivo de 72 horas (259200s).
     */
    public function putVideoMetadata(string $canonicalUrl, array $metadata, int $ttl = 259200): void
    {
        $key = 'videofinder:video:' . md5($canonicalUrl);

        try {
            Redis::setex($key, $ttl, json_encode($metadata, JSON_UNESCAPED_UNICODE));
        } catch (\Throwable $e) {
            Log::warning("Erro ao salvar cache de vídeo: " . $e->getMessage());
        }
    }

    /**
     * Limpa todo o cache de buscas.
     */
    public function flush(): bool
    {
        try {
            $keys = Redis::keys('videofinder:search:*');
            if (!empty($keys)) {
                Redis::del($keys);
            }
            return true;
        } catch (\Throwable $e) {
            Log::error("Erro ao limpar cache de buscas: " . $e->getMessage());
            return false;
        }
    }
}

