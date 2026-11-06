<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TranscriptSegment extends Model
{
    use HasFactory;

    protected $table = 'video_transcript_segments';

    protected $fillable = [
        'transcript_id',
        'start_time',
        'end_time',
        'text',
        'speaker',
    ];

    protected $casts = [
        'start_time' => 'integer',
        'end_time' => 'integer',
    ];

    public function transcript(): BelongsTo
    {
        return $this->belongsTo(VideoTranscript::class, 'transcript_id');
    }

    /**
     * Retorna a minutagem formatada (ex: "01:34").
     */
    public function getFormattedStartTimeAttribute(): string
    {
        $minutes = floor($this->start_time / 60);
        $seconds = $this->start_time % 60;
        return sprintf('%02d:%02d', $minutes, $seconds);
    }

    public function toPayload(): array
    {
        return [
            'id' => $this->id,
            'start_time' => $this->start_time,
            'end_time' => $this->end_time,
            'formatted_time' => $this->formatted_start_time,
            'text' => $this->text,
            'speaker' => $this->speaker,
        ];
    }
}
