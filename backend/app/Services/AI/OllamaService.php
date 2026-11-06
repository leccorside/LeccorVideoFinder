<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OllamaService
{
    protected string $baseUrl;
    protected string $defaultModel;

    public function __construct(?string $baseUrl = null, ?string $defaultModel = null)
    {
        $this->baseUrl = rtrim($baseUrl ?? env('OLLAMA_BASE_URL', 'http://ollama:11434'), '/');
        $this->defaultModel = $defaultModel ?? env('OLLAMA_LLM_MODEL', 'qwen2.5vl:7b');
    }

    /**
     * Verifica se o Ollama está operacional e respondendo.
     */
    public function isAvailable(): bool
    {
        try {
            $response = Http::timeout(2)->get("{$this->baseUrl}/api/tags");
            return $response->successful();
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * Retorna a lista de modelos instalados no Ollama.
     */
    public function getInstalledModels(): array
    {
        try {
            $response = Http::timeout(3)->get("{$this->baseUrl}/api/tags");
            if ($response->successful()) {
                $data = $response->json();
                return array_map(fn($m) => $m['name'] ?? '', $data['models'] ?? []);
            }
        } catch (\Throwable $e) {
            Log::warning("Erro ao listar modelos do Ollama: " . $e->getMessage());
        }

        return [];
    }

    /**
     * Gera uma resposta de texto a partir de um prompt via Ollama.
     */
    public function generate(string $prompt, ?string $model = null, array $options = []): ?string
    {
        $model = $model ?? $this->defaultModel;

        try {
            $payload = array_merge([
                'model' => $model,
                'prompt' => $prompt,
                'stream' => false,
                'options' => [
                    'temperature' => 0.2,
                    'num_predict' => 150,
                ],
            ], $options);

            // Timeout de 5s para manter a experiência em tempo real
            $response = Http::timeout(5)->post("{$this->baseUrl}/api/generate", $payload);

            if ($response->successful()) {
                $data = $response->json();
                return trim($data['response'] ?? '');
            }
        } catch (\Throwable $e) {
            Log::info("Inferência Ollama ({$model}) indisponível ou lenta. Acionando fallback gracioso: " . $e->getMessage());
        }

        return null;
    }

    /**
     * Gera vetor de embeddings numéricos a partir de um texto.
     */
    public function embeddings(string $text, ?string $model = null): ?array
    {
        $model = $model ?? $this->defaultModel;

        try {
            $response = Http::timeout(4)->post("{$this->baseUrl}/api/embeddings", [
                'model' => $model,
                'prompt' => $text,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return $data['embedding'] ?? null;
            }
        } catch (\Throwable $e) {
            Log::info("Embeddings Ollama indisponível: " . $e->getMessage());
        }

        return null;
    }
}
