<?php

namespace App\Services\AI;

class CosineSimilarity
{
    /**
     * Calcula a similaridade por cosseno entre dois vetores numéricos.
     * Retorna um float entre -1.0 e 1.0 (ou 0.0 se inválido).
     *
     * @param float[] $vecA
     * @param float[] $vecB
     * @return float
     */
    public function calculate(array $vecA, array $vecB): float
    {
        $count = count($vecA);
        if ($count === 0 || $count !== count($vecB)) {
            return 0.0;
        }

        $dotProduct = 0.0;
        $normA = 0.0;
        $normB = 0.0;

        for ($i = 0; $i < $count; $i++) {
            $a = (float) $vecA[$i];
            $b = (float) $vecB[$i];

            $dotProduct += $a * $b;
            $normA += $a * $a;
            $normB += $b * $b;
        }

        if ($normA <= 0.0 || $normB <= 0.0) {
            return 0.0;
        }

        $similarity = $dotProduct / (sqrt($normA) * sqrt($normB));

        // Clamping para evitar imprecisões de ponto flutuante
        return max(-1.0, min(1.0, $similarity));
    }

    /**
     * Retorna a similaridade normalizada em escala percentual (0 a 100).
     */
    public function calculatePercentage(array $vecA, array $vecB): int
    {
        $raw = $this->calculate($vecA, $vecB);
        // Mapeia [-1.0, 1.0] para [0, 100]
        $normalized = ($raw + 1.0) / 2.0;
        return (int) round($normalized * 100);
    }
}

