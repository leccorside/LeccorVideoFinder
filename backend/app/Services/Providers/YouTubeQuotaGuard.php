<?php

namespace App\Services\Providers;

use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Log;

class YouTubeQuotaGuard
{
    protected int $dailyLimit;

    public function __construct(?int $dailyLimit = null)
    {
        $this->dailyLimit = $dailyLimit ?? (int) env('YOUTUBE_DAILY_QUOTA_LIMIT', 9000);
    }

    /**
     * Retorna a chave do Redis para a data corrente em UTC.
     */
    protected function getTodayKey(): string
    {
        $today = gmdate('Y-m-d');
        return "videofinder:quota:youtube:{$today}";
    }

    /**
     * Verifica se é seguro consumir o número solicitado de pontos de quota.
     */
    public function canConsume(int $points = 100): bool
    {
        $currentUsage = $this->getCurrentUsage();
        return ($currentUsage + $points) <= $this->dailyLimit;
    }

    /**
     * Registra o consumo de quota e adiciona histórico de operação.
     */
    public function recordConsumption(int $points, string $operation = 'search'): void
    {
        $key = $this->getTodayKey();

        try {
            Redis::incrby($key, $points);
            Redis::expire($key, 172800); // 48h de retenção para auditoria

            // Registro de telemetria da operação
            $opKey = "{$key}:ops";
            Redis::hincrby($opKey, $operation, $points);
            Redis::expire($opKey, 172800);

            Log::info("YouTube Quota consumida: +{$points} pts ({$operation}). Total hoje: " . ($this->getCurrentUsage()));
        } catch (\Throwable $e) {
            Log::warning("Falha ao registrar quota no Redis: " . $e->getMessage());
        }
    }

    /**
     * Retorna o total de pontos já consumidos hoje.
     */
    public function getCurrentUsage(): int
    {
        try {
            $val = Redis::get($this->getTodayKey());
            return $val ? (int) $val : 0;
        } catch (\Throwable $e) {
            Log::warning("Falha ao ler quota do Redis: " . $e->getMessage());
            return 0;
        }
    }

    /**
     * Retorna a quantidade de pontos restantes antes de acionar o fallback.
     */
    public function getRemainingQuota(): int
    {
        $usage = $this->getCurrentUsage();
        $remaining = $this->dailyLimit - $usage;
        return max(0, $remaining);
    }

    /**
     * Informa se a quota diária está esgotada ou perigosamente próxima do teto.
     */
    public function isExhausted(): bool
    {
        return $this->getCurrentUsage() >= $this->dailyLimit;
    }

    /**
     * Retorna um resumo completo de status para exibição no Dashboard e Telemetria.
     */
    public function getUsage(): array
    {
        $used = $this->getCurrentUsage();
        $remaining = $this->getRemainingQuota();
        $percent = $this->dailyLimit > 0 ? round(($used / $this->dailyLimit) * 100, 1) : 0;

        // Tempo até o reset (meia-noite UTC)
        $now = time();
        $midnight = strtotime('tomorrow 00:00:00 UTC');
        $secondsUntilReset = max(0, $midnight - $now);

        $operations = [];
        try {
            $opsData = Redis::hgetall($this->getTodayKey() . ':ops');
            if (is_array($opsData)) {
                $operations = $opsData;
            }
        } catch (\Throwable $e) {
            // Silencioso
        }

        return [
            'date_utc' => gmdate('Y-m-d'),
            'limit' => $this->dailyLimit,
            'consumed' => $used,
            'remaining' => $remaining,
            'percentage_used' => $percent,
            'is_exhausted' => $this->isExhausted(),
            'seconds_until_reset' => $secondsUntilReset,
            'reset_at_utc' => gmdate('Y-m-d\TH:i:s\Z', $midnight),
            'operations' => $operations,
        ];
    }

    /**
     * Reseta a quota diária (utilizado para testes ou ação manual do administrador).
     */
    public function reset(): void
    {
        try {
            Redis::del($this->getTodayKey());
            Redis::del($this->getTodayKey() . ':ops');
        } catch (\Throwable $e) {
            Log::warning("Falha ao resetar quota no Redis: " . $e->getMessage());
        }
    }
}

