<?php

namespace Tests\Unit;

use App\DTOs\VideoSearchResultDTO;
use App\Services\Search\CanonicalDeduplicator;
use PHPUnit\Framework\TestCase;

class CanonicalDeduplicatorTest extends TestCase
{
    private CanonicalDeduplicator $deduplicator;

    protected function setUp(): void
    {
        parent::setUp();
        $this->deduplicator = new CanonicalDeduplicator();
    }

    public function test_extracts_youtube_id_from_standard_url(): void
    {
        $id = $this->deduplicator->getCanonicalIdentifier('https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube');
        $this->assertEquals('youtube:dQw4w9WgXcQ', $id);
    }

    public function test_extracts_youtube_id_from_short_url_and_strips_tracking(): void
    {
        $id = $this->deduplicator->getCanonicalIdentifier('https://youtu.be/dQw4w9WgXcQ?si=abcdef123&utm_source=twitter', 'youtube');
        $this->assertEquals('youtube:dQw4w9WgXcQ', $id);
    }

    public function test_extracts_youtube_shorts_url(): void
    {
        $id = $this->deduplicator->getCanonicalIdentifier('https://www.youtube.com/shorts/dQw4w9WgXcQ', 'youtube');
        $this->assertEquals('youtube:dQw4w9WgXcQ', $id);
    }

    public function test_extracts_tiktok_video_id(): void
    {
        $id = $this->deduplicator->getCanonicalIdentifier('https://www.tiktok.com/@motivacao/video/729182910281928?is_from_webapp=1', 'tiktok');
        $this->assertEquals('tiktok:729182910281928', $id);
    }

    public function test_extracts_vimeo_video_id(): void
    {
        $id = $this->deduplicator->getCanonicalIdentifier('https://vimeo.com/90219021', 'vimeo');
        $this->assertEquals('vimeo:90219021', $id);
    }

    public function test_extracts_dailymotion_video_id(): void
    {
        $id = $this->deduplicator->getCanonicalIdentifier('https://www.dailymotion.com/video/x8abcdef', 'dailymotion');
        $this->assertEquals('dailymotion:x8abcdef', $id);
    }

    public function test_deduplicates_identical_videos_preserving_best_metadata(): void
    {
        $item1 = VideoSearchResultDTO::fromArray([
            'id' => '1',
            'platform' => 'youtube',
            'external_id' => 'dQw4w9WgXcQ',
            'title' => 'Título Incompleto',
            'original_url' => 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            'relevance_score' => 60,
        ]);

        $item2 = VideoSearchResultDTO::fromArray([
            'id' => '2',
            'platform' => 'youtube',
            'external_id' => 'dQw4w9WgXcQ',
            'title' => 'Título Completo e Rico em Detalhes',
            'description' => 'Descrição detalhada com informações do vídeo',
            'original_url' => 'https://youtu.be/dQw4w9WgXcQ',
            'thumbnail_url' => 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
            'duration_seconds' => 212,
            'relevance_score' => 95,
        ]);

        $deduplicated = $this->deduplicator->deduplicate([$item1, $item2]);

        $this->assertCount(1, $deduplicated);
        $this->assertEquals('Título Completo e Rico em Detalhes', $deduplicated[0]->title);
        $this->assertEquals(95, $deduplicated[0]->relevanceScore);
        $this->assertEquals(212, $deduplicated[0]->durationSeconds);
    }
}

