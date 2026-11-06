<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VideoTranscript extends Model
{
    use HasFactory;

    protected $table = 'video_transcripts';

    protected $fillable = [
        'canonical_url',
        'platform',
        'external_id',
        'video_title',
        'language',
        'is_verified',
        'source',
        'raw_text',
    ];

    protected $casts = [
        'is_verified' => 'boolean',
    ];

    /**
     * Segmentos de fala cronometrados.
     */
    public function segments(): HasMany
    {
        return $this->hasMany(TranscriptSegment::class, 'transcript_id')->orderBy('start_time', 'asc');
    }

    /**
     * Retorna a representação estruturada para DTO / API.
     */
    public function toPayload(): array
    {
        return [
            'id' => $this->id,
            'canonical_url' => $this->canonical_url,
            'platform' => $this->platform,
            'external_id' => $this->external_id,
            'video_title' => $this->video_title,
            'language' => $this->language,
            'is_verified' => $this->is_verified,
            'source' => $this->source,
            'segments' => $this->segments->map(fn(TranscriptSegment $s) => $s->toPayload())->values()->all(),
        ];
    }
}
