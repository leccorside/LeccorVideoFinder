<?php

namespace App\Http\Controllers;

use App\Models\TranscriptSegment;
use App\Models\VideoTranscript;
use App\Services\Transcript\TranscriptExtractorService;
use App\Services\Transcript\TranscriptSearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TranscriptController extends Controller
{
    protected TranscriptExtractorService $extractor;
    protected TranscriptSearchService $searchService;

    public function __construct()
    {
        $this->extractor = new TranscriptExtractorService();
        $this->searchService = new TranscriptSearchService($this->extractor);
    }

    /**
     * GET /api/videos/{platform}/{externalId}/transcript
     * Retorna a transcrição completa de um vídeo com minutagens e timestamps.
     */
    public function show(Request $request, string $platform, string $externalId): JsonResponse
    {
        $title = $request->query('title');
        $desc = $request->query('description');

        $transcript = $this->extractor->getTranscript($platform, $externalId, $title, $desc);

        if (!$transcript) {
            return response()->json([
                'success' => false,
                'message' => 'Nenhuma transcrição encontrada para este vídeo.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $transcript->toPayload(),
        ]);
    }

    /**
     * POST /api/transcript/search
     * "Encontrar Trecho" — Localiza falas e expressões exatas nos vídeos gravados.
     */
    public function search(Request $request): JsonResponse
    {
        // Aceita 'phrase', 'q' ou 'query'
        $phrase = $request->input('phrase', $request->input('q', $request->input('query')));

        if (empty($phrase)) {
            return response()->json([
                'success' => false,
                'message' => 'O parâmetro de busca por frase é obrigatório.',
                'errors' => [
                    'query' => ['O parâmetro de busca por frase é obrigatório.'],
                ],
            ], 422);
        }

        $results = $this->searchService->searchSegments($phrase, 30);

        return response()->json([
            'success' => true,
            'phrase' => $phrase,
            'total' => count($results),
            'data' => $results,
        ]);
    }

    /**
     * POST /api/videos/{platform}/{externalId}/transcript
     * Adiciona ou atualiza manualmente segmentos de transcrição para um vídeo.
     */
    public function store(Request $request, string $platform, string $externalId): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'language' => 'nullable|string|max:10',
            'segments' => 'required|array|min:1',
            'segments.*.start_time' => 'required|integer|min:0',
            'segments.*.end_time' => 'required|integer|min:0',
            'segments.*.text' => 'required|string|min:1',
            'segments.*.speaker' => 'nullable|string|max:100',
        ]);

        $canonicalUrl = "{$platform}:{$externalId}";

        $transcript = VideoTranscript::updateOrCreate(
            [
                'platform' => $platform,
                'external_id' => $externalId,
            ],
            [
                'canonical_url' => $canonicalUrl,
                'video_title' => $validated['title'],
                'language' => $validated['language'] ?? 'pt-BR',
                'is_verified' => true,
                'source' => 'community_verified',
                'raw_text' => implode(' ', array_column($validated['segments'], 'text')),
            ]
        );

        // Atualizar segmentos
        $transcript->segments()->delete();
        foreach ($validated['segments'] as $seg) {
            TranscriptSegment::create([
                'transcript_id' => $transcript->id,
                'start_time' => $seg['start_time'],
                'end_time' => $seg['end_time'],
                'text' => $seg['text'],
                'speaker' => $seg['speaker'] ?? null,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Transcrição salva com sucesso!',
            'data' => $transcript->load('segments')->toPayload(),
        ]);
    }
}
