<?php

namespace App\Services\CircuitBreaker;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class CircuitBreaker
{
    public const STATE_CLOSED = 'CLOSED';       // Funcionamento normal
    public const STATE_OPEN = 'OPEN';           // Bloqueado após falhas consecutivas
    public const STATE_HALF_OPEN = 'HALF_OPEN'; // Testando recuperação

    protected int $failureThreshold;
    protected int $recoveryTimeSeconds;

    public function __construct(int $failureThreshold = 3, int $recoveryTimeSeconds = 60)
    {
        $this->failureThreshold = $failureThreshold;
        $this->recoveryTimeSeconds = $recoveryTimeSeconds;
    }

    /**
     * Retorna a chave do Redis para o estado do circuito de um provedor.
     */
    protected function getKey(string $providerId): string
    {
        return "videofinder:circuit:{$providerId}";
    }

    /**
     * Verifica se o provedor está disponível para receber chamadas.
     */
    public function isAvailable(string $providerId): bool
    {
        $state = $this->getState($providerId);

        if ($state === self::STATE_CLOSED) {
            return true;
        }

        if ($state === self::STATE_OPEN) {
            $key = $this->getKey($providerId);
            $lastFailureTime = (int) (Redis::hget($key, 'last_failure') ?: 0);

            // Se o tempo de recuperação já expirou, passa para HALF_OPEN
            if ((time() - $lastFailureTime) >= $this->recoveryTimeSeconds) {
                Redis::hset($key, 'state', self::STATE_HALF_OPEN);
                Log::info("CircuitBreaker [{$providerId}]: Transição de OPEN para HALF_OPEN.");
                return true;
            }

            return false;
        }

        // HALF_OPEN permite uma requisição de teste
        return true;
    }

    /**
     * Retorna o estado atual do circuito.
     */
    public function getState(string $providerId): string
    {
        try {
            $state = Redis::hget($this->getKey($providerId), 'state');
            return $state ?: self::STATE_CLOSED;
        } catch (\Throwable $e) {
            return self::STATE_CLOSED;
        }
    }

    /**
     * Registra uma chamada com sucesso, resetando contadores de falha.
     */
    public function recordSuccess(string $providerId): void
    {
        try {
            $key = $this->getKey($providerId);
            $currentState = $this->getState($providerId);

            if ($currentState === self::STATE_HALF_OPEN) {
                Log::info("CircuitBreaker [{$providerId}]: Provedor recuperado! Circuito FECHADO.");
            }

            Redis::hset($key, 'state', self::STATE_CLOSED);
            Redis::hset($key, 'failure_count', 0);
            Redis::expire($key, 86400);
        } catch (\Throwable $e) {
            Log::warning("CircuitBreaker falha ao registrar sucesso: " . $e->getMessage());
        }
    }

    /**
     * Registra uma falha de conexão ou erro do provedor.
     */
    public function recordFailure(string $providerId): void
    {
        try {
            $key = $this->getKey($providerId);
            $failures = (int) Redis::hincrby($key, 'failure_count', 1);
            Redis::hset($key, 'last_failure', time());
            Redis::expire($key, 86400);

            if ($failures >= $this->failureThreshold) {
                Redis::hset($key, 'state', self::STATE_OPEN);
                Log::warning("CircuitBreaker [{$providerId}]: ABERTO devido a {$failures} falhas consecutivas. Bloqueado por {$this->recoveryTimeSeconds}s.");
            }
        } catch (\Throwable $e) {
            Log::warning("CircuitBreaker falha ao registrar erro: " . $e->getMessage());
        }
    }

    /**
     * Reseta manualmente o circuito de um provedor para CLOSED.
     */
    public function reset(string $providerId): void
    {
        try {
            Redis::del($this->getKey($providerId));
        } catch (\Throwable $e) {
            // Silencioso
        }
    }
}

