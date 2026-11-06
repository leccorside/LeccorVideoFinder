<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class SecurityValidationTest extends TestCase
{
    public function test_search_handles_xss_payloads_without_executing_or_breaking(): void
    {
        $payload = '<script>alert("xss")</script><img src=x onerror=alert(1)>';

        $response = $this->postJson('/api/search', [
            'q' => $payload,
            'platforms' => ['dailymotion'],
        ]);

        $response->assertStatus(200);
        $content = $response->getContent();
        // Garante que o retorno é JSON e não HTML interpretado
        $this->assertJson($content);
        $this->assertStringNotContainsString('<script>alert("xss")</script>', $response->json('data.results.0.title', ''));
    }

    public function test_search_handles_sql_injection_payloads_safely(): void
    {
        $sqliPayload = "' OR '1'='1' UNION SELECT null, null, null--";

        $response = $this->postJson('/api/search', [
            'q' => $sqliPayload,
        ]);

        // Não pode dar erro 500 de banco de dados
        $response->assertStatus(200);
        $this->assertTrue($response->json('success'));
    }

    public function test_transcript_search_requires_query_string(): void
    {
        $response = $this->postJson('/api/transcript/search', []);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['query']);
    }

    public function test_unauthorized_user_cannot_access_protected_auth_endpoint_without_token(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401);
    }

    public function test_long_search_query_is_constrained(): void
    {
        $longQuery = str_repeat('a', 1500);

        $response = $this->postJson('/api/search', [
            'q' => $longQuery,
        ]);

        // Deve retornar 200 truncado/sanitizado ou 422 de validação, nunca erro fatal 500
        $this->assertContains($response->status(), [200, 422]);
    }
}

