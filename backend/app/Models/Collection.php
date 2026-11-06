<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Collection extends Model
{
    use HasFactory;

    protected $table = 'collections';

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'icon',
        'color',
        'is_public',
    ];

    protected $casts = [
        'is_public' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function videos(): HasMany
    {
        return $this->hasMany(FavoriteVideo::class, 'collection_id')->orderBy('created_at', 'desc');
    }

    public function toPayload(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'icon' => $this->icon,
            'color' => $this->color,
            'is_public' => $this->is_public,
            'videos_count' => $this->videos()->count(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
