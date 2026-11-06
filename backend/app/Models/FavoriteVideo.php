<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FavoriteVideo extends Model
{
    use HasFactory;

    protected $table = 'favorite_videos';

    protected $fillable = [
        'user_id',
        'collection_id',
        'platform',
        'external_id',
        'canonical_url',
        'title',
        'description',
        'thumbnail_url',
        'original_url',
        'author',
        'duration_seconds',
        'views_count',
        'matched_timestamp',
        'matched_snippet',
        'notes',
    ];

    protected $casts = [
        'duration_seconds' => 'integer',
        'views_count' => 'integer',
        'matched_timestamp' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function collection(): BelongsTo
    {
        return $this->belongsTo(Collection::class);
    }

    public function toPayload(): array
    {
        return [
            'id' => (string) $this->id,
            'platform' => $this->platform,
            'externalId' => $this->external_id,
            'title' => $this->title,
            'description' => $this->description,
            'originalUrl' => $this->original_url,
            'canonicalUrl' => $this->canonical_url,
            'thumbnailUrl' => $this->thumbnail_url,
            'author' => $this->author,
            'durationSeconds' => $this->duration_seconds,
            'viewsCount' => $this->views_count,
            'matchedTimestamp' => $this->matched_timestamp,
            'matchedSnippet' => $this->matched_snippet,
            'notes' => $this->notes,
            'collection_id' => $this->collection_id,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
