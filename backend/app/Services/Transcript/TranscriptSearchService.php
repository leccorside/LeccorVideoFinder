<?php

namespace App\Services\Transcript;

use App\Models\TranscriptSegment;
use App\Models\VideoTranscript;

class TranscriptSearchService
{
    protected TranscriptExtractorService $extractor;

    public function __construct(?TranscriptExtractorService $extractor = null)
    {
        $this->extractor = $extractor ?? new TranscriptExtractorService();
    }

    /**
     * Busca por trechos de fala exatos ou aproximados nas transcrições persistidas.
     */
    public function searchSegments(string $phrase, int $limit = 20): array
    {
        $phrase = trim($phrase);
        if (mb_strlen($phrase) < 2) {
            return [];
        }

        $segments = TranscriptSegment::with('transcript')
            ->where('text', 'LIKE', "%{$phrase}%")
            ->orderBy('id', 'desc')
            ->limit($limit)
            ->get();

        $results = [];
        foreach ($segments as $segment) {
            $transcript = $segment->transcript;
            if (!$transcript) continue;

            $timestampUrl = $this->extractor->generateTimestampUrl(
                $transcript->platform,
                $transcript->external_id,
                $segment->start_time
            );

            $results[] = [
                'segment_id' => $segment->id,
                'transcript_id' => $transcript->id,
                'platform' => $transcript->platform,
                'external_id' => $transcript->external_id,
                'canonical_url' => $transcript->canonical_url,
                'video_title' => $transcript->video_title,
                'start_time' => $segment->start_time,
                'end_time' => $segment->end_time,
                'formatted_time' => $segment->formatted_start_time,
                'timestamp_url' => $timestampUrl,
                'speaker' => $segment->speaker,
                'text' => $segment->text,
                'matched_phrase' => $phrase,
            ];
        }

        return $results;
    }

    /**
     * Encontra e anexa a transcrição correspondente ao DTO do vídeo durante o pipeline de busca.
     */
    public function attachTranscriptIfAvailable(string $platform, string $externalId, ?string $title = null, ?string $description = null): ?array
    {
        $transcript = $this->extractor->getTranscript($platform, $externalId, $title, $description);

        if (!$transcript) {
            return null;
        }

        return [
            'language' => $transcript->language,
            'isVerified' => $transcript->is_verified,
            'source' => $transcript->source,
            'segments' => $transcript->segments->map(function ($s) {
                return [
                    'startTime' => $s->start_time,
                    'endTime' => $s->end_time,
                    'text' => $s->text,
                    'speaker' => $s->speaker,
                ];
            })->values()->all(),
        ];
    }

    /**
     * Enriquece uma lista de resultados de busca com dados de transcrição e evidência de falas.
     */
    public function enrichResults(array $results, string $query): array
    {
        $queryLower = mb_strtolower($query);
        $enriched = [];

        foreach ($results as $index => $item) {
            // Processa transcrição prioritariamente para os primeiros resultados
            if ($index < 10 && empty($item['transcript'])) {
                $platform = $item['platform'] ?? 'youtube';
                $externalId = $item['externalId'] ?? '';
                $title = $item['title'] ?? '';
                $description = $item['description'] ?? '';

                $transcriptData = $this->attachTranscriptIfAvailable($platform, $externalId, $title, $description);

                if ($transcriptData) {
                    $item['transcript'] = $transcriptData;

                    // Procurar se algum segmento contém o termo da busca
                    foreach ($transcriptData['segments'] as $seg) {
                        $segTextLower = mb_strtolower($seg['text']);
                        if (str_contains($segTextLower, $queryLower)) {
                            $item['matchedSnippet'] = $seg['text'];
                            $item['matchedTimestamp'] = $seg['startTime'];
                            $item['matchType'] = 'transcript_match';
                            $item['relevanceScore'] = max($item['relevanceScore'] ?? 0, 95);
                            break;
                        }
                    }
                }
            }

            $enriched[] = $item;
        }

        return $enriched;
    }
}
