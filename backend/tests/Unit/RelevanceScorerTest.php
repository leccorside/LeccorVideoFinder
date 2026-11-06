<?php

namespace Tests\Unit;

use App\DTOs\SearchQueryDTO;
use App\DTOs\VideoSearchResultDTO;
use App\Services\Search\RelevanceScorer;
use PHPUnit\Framework\TestCase;

class RelevanceScorerTest extends TestCase
{
    private RelevanceScorer $scorer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->scorer = new RelevanceScorer();
    }

    public function test_exact_phrase_in_title_receives_high_score(): void
    {
        $query = SearchQueryDTO::fromArray(['q' => 'Nunca desista dos seus sonhos']);
        $video = VideoSearchResultDTO::fromArray([
            'id' => 'v1',
            'platform' => 'youtube',
            'title' => 'Nunca desista dos seus sonhos — Discurso Motivacional',
            'description' => 'Um vídeo inspirador para o seu dia.',
            'original_url' => 'https://youtube.com/watch?v=123',
            'thumbnail_url' => 'https://i.ytimg.com/vi/123/default.jpg',
            'duration_seconds' => 180,
        ]);

        $scored = $this->scorer->score($video, $query);

        $this->assertGreaterThanOrEqual(60, $scored->relevanceScore);
        $this->assertEquals('exact_phrase', $scored->matchType);
    }

    public function test_transcript_match_detects_spoken_snippet_and_timestamp(): void
    {
        $query = SearchQueryDTO::fromArray(['q' => 'ponte que conecta os seus objetivos']);
        $video = VideoSearchResultDTO::fromArray([
            'id' => 'v2',
            'platform' => 'youtube',
            'title' => 'Como ter Disciplina Diária',
            'description' => 'Vídeo sobre foco e constância.',
            'original_url' => 'https://youtube.com/watch?v=456',
            'thumbnail_url' => 'https://i.ytimg.com/vi/456/default.jpg',
            'duration_seconds' => 300,
            'transcript' => [
                'language' => 'pt-BR',
                'segments' => [
                    ['startTime' => 20, 'endTime' => 35, 'text' => 'Comece o dia cedo.'],
                    ['startTime' => 94, 'endTime' => 110, 'text' => 'A disciplina é a única ponte que conecta os seus objetivos com o resultado.'],
                ],
            ],
        ]);

        $scored = $this->scorer->score($video, $query);

        $this->assertEquals('transcript_match', $scored->matchType);
        $this->assertEquals(94, $scored->matchedTimestamp);
        $this->assertStringContainsString('ponte que conecta os seus objetivos', $scored->matchedSnippet);
    }

    public function test_sort_orders_videos_by_relevance_descending(): void
    {
        $query = SearchQueryDTO::fromArray(['q' => 'foco']);

        $vLow = VideoSearchResultDTO::fromArray([
            'id' => 'low',
            'platform' => 'web',
            'title' => 'Outro assunto qualquer sem palavras',
            'original_url' => 'https://example.com/1',
        ]);

        $vHigh = VideoSearchResultDTO::fromArray([
            'id' => 'high',
            'platform' => 'youtube',
            'title' => 'foco total no trabalho',
            'thumbnail_url' => 'https://example.com/thumb.jpg',
            'duration_seconds' => 120,
            'original_url' => 'https://youtube.com/watch?v=2',
        ]);

        $scoredLow = $this->scorer->score($vLow, $query);
        $scoredHigh = $this->scorer->score($vHigh, $query);

        $sorted = $this->scorer->sort([$scoredLow, $scoredHigh]);

        $this->assertEquals('high', $sorted[0]->id);
        $this->assertEquals('low', $sorted[1]->id);
    }
}

