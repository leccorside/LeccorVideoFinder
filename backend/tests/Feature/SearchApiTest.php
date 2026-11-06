<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Redis;
use Tests\TestCase;

class SearchApiTest extends TestCase
{
    public function test_health_check_returns_operational(): void
    {
        $response = $this->getJson('/api/health');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'timestamp',
            'services' => [
                'api',
                'database',
                'redis',
            ],
        ]);
    }

    public function test_search_endpoint_returns_json_results(): void
    {
        $response = $this->postJson('/api/search', [
            'q' => 'Steve Jobs',
            'platforms' => ['dailymotion'],
            'duration' => 'all',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
        ]);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'query',
                'total',
                'results',
                'stats',
            ],
        ]);
    }

    public function test_admin_metrics_endpoint_returns_telemetry(): void
    {
        $response = $this->getJson('/api/admin/metrics');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'timestamp',
            'kpis' => [
                'total_searches',
                'searches_today',
                'total_favorites',
                'total_transcripts',
                'avg_latency_ms',
            ],
            'youtube_quota',
            'providers',
            'infrastructure',
            'weekly_volume',
        ]);
    }

    public function test_admin_providers_can_be_listed_and_toggled(): void
    {
        // 1. List
        $listResponse = $this->getJson('/api/admin/providers');
        $listResponse->assertStatus(200);
        $listResponse->assertJson(['success' => true]);

        // 2. Toggle
        $toggleResponse = $this->postJson('/api/admin/providers/dailymotion/toggle');
        $toggleResponse->assertStatus(200);
        $toggleResponse->assertJson(['success' => true, 'provider' => 'dailymotion']);

        // Toggle back to ensure it remains active
        $this->postJson('/api/admin/providers/dailymotion/toggle');
    }

    public function test_admin_settings_can_be_retrieved_and_updated(): void
    {
        $getResponse = $this->getJson('/api/admin/settings');
        $getResponse->assertStatus(200);
        $getResponse->assertJson(['success' => true]);

        $putResponse = $this->putJson('/api/admin/settings', [
            'search_cache_ttl_hours' => 36,
            'youtube_daily_quota_limit' => 8500,
        ]);

        $putResponse->assertStatus(200);
        $putResponse->assertJson(['success' => true]);
    }
}

