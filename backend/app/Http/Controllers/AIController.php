<?php

namespace App\Http\Controllers;

use App\Services\AI\OllamaService;
use App\Services\AI\QueryExpander;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIController extends Controller
{
    protected OllamaService $ollama;
    protected QueryExpander $expander;

    public function __construct()
    {
        $this->ollama = new OllamaService();
        $this->expander = new QueryExpander($this->ollama);
    }

    /**
     * GET /api/ai/models
     * Retorna os modelos locais montados do host e o estado de saúde do Ollama.
     */
    public function models(): JsonResponse
    {
        $available = $this->ollama->isAvailable();
        $models = $available ? $this->ollama->getInstalledModels() : [];

        return response()->json([
            'success' => true,
            'is_available' => $available,
            'active_model' => env('OLLAMA_LLM_MODEL', 'qwen2.5vl:7b'),
            'models' => $models,
            'using_host_ollama' => true,
        ]);
    }

    /**
     * POST /api/ai/expand
     * Expande uma busca conceitual em palavras-chave e intenção.
     */
    public function expand(Request $request): JsonResponse
    {
        if (!$request->has('q') && $request->has('query')) {
            $request->merge(['q' => $request->input('query')]);
        }

        $validated = $request->validate([
            'q' => 'required|string|min:1|max:300',
        ]);

        $expansion = $this->expander->expand($validated['q']);

        return response()->json([
            'success' => true,
            'data' => $expansion,
        ]);
    }

    /**
     * POST /api/ai/synthesize
     * Gera uma síntese semântica dos vídeos encontrados.
     */
    public function synthesize(Request $request): JsonResponse
    {
        if (!$request->has('q') && $request->has('query')) {
            $request->merge(['q' => $request->input('query')]);
        }

        $validated = $request->validate([
            'q' => 'required|string|min:1|max:300',
            'intent' => 'nullable|string',
            'video_count' => 'nullable|integer',
        ]);

        $q = $validated['q'];
        $intent = $validated['intent'] ?? $q;
        $count = $validated['video_count'] ?? 10;

        $prompt = "Em português do Brasil, gere um resumo executivo de 2 frases explicando por que vídeos sobre '{$q}' com intenção '{$intent}' são relevantes para o espectador, sem saudações e sem introduções.";
        $synthesis = $this->ollama->generate($prompt);

        if (empty($synthesis)) {
            $synthesis = "A busca reuniu {$count} vídeos essenciais em múltiplas plataformas explorando '{$q}', priorizando conteúdos que abordam a aplicação prática e o contexto do tema.";
        }

        return response()->json([
            'success' => true,
            'data' => [
                'query' => $q,
                'synthesis' => $synthesis,
                'model' => env('OLLAMA_LLM_MODEL', 'qwen2.5vl:7b'),
            ],
        ]);
    }
}
