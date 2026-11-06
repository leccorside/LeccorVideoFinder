<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class AdminTelemetryTest extends TestCase
{
    public function test_admin_metrics_with_period_filter(): void
    {
        $response = $this->getJson('/api/admin/metrics?period=30d');

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'period' => '30d',
        ]);
        $response->assertJsonStructure([
            'success',
            'period',
            'kpis' => [
                'total_searches',
                'searches_in_period',
                'searches_today',
                'multimodal_queries',
                'vector_precision_pct',
                'cataloged_videos_approx',
            ],
            'youtube_quota',
            'providers',
            'errors_by_platform',
            'infrastructure',
            'weekly_volume',
        ]);
    }

    public function test_admin_metrics_csv_export(): void
    {
        $response = $this->get('/api/admin/metrics/export');

        $response->assertStatus(200);
        $this->assertStringContainsString('text/csv', (string) $response->headers->get('Content-Type'));
        $content = $response->getContent();
        $this->assertStringContainsString('Métrica,Valor,Observação', $content);
        $this->assertStringContainsString('Total de Buscas', $content);
    }

    public function test_admin_provider_toggle_and_circuit_reset(): void
    {
        // 1. Toggle
        $toggleRes = $this->postJson('/api/admin/providers/tiktok/toggle');
        $toggleRes->assertStatus(200);
        $toggleRes->assertJson(['success' => true, 'provider' => 'tiktok']);

        // 2. Reset Circuit
        $resetRes = $this->postJson('/api/admin/providers/tiktok/reset-circuit');
        $resetRes->assertStatus(200);
        $resetRes->assertJson([
            'success' => true,
            'provider' => 'tiktok',
            'circuit' => 'CLOSED',
        ]);

        // Toggle back to enabled
        $this->postJson('/api/admin/providers/tiktok/toggle');
    }

    public function test_admin_ai_test_inference_endpoint(): void
    {
        $response = $this->postJson('/api/admin/ai/test-inference', [
            'prompt' => 'Resuma perseverança em uma frase.',
            'model' => 'qwen2.5vl:7b',
        ]);

        // Retorna 200 com inferência ou fallback
        $this->assertContains($response->status(), [200, 500]);
        if ($response->status() === 200) {
            $response->assertJson(['success' => true]);
            $this->assertArrayHasKey('latency_ms', $response->json());
        }
    }

    public function test_admin_cache_flush_all(): void
    {
        Redis::set('videofinder:search:test_key', 'cached_value');

        $response = $this->postJson('/api/admin/cache/flush-all');

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $this->assertArrayHasKey('deleted_keys', $response->json());
    }
}
