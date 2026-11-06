<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SearchHistory extends Model
{
    use HasFactory;

    protected $table = 'search_history';

    protected $fillable = [
        'user_id',
        'session_id',
        'query',
        'platform_filters',
        'duration_filter',
        'mode',
        'results_count',
    ];

    protected $casts = [
        'platform_filters' => 'array',
        'results_count' => 'integer',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function toPayload(): array
    {
        return [
            'id' => $this->id,
            'query' => $this->query,
            'platform_filters' => $this->platform_filters ?? [],
            'duration_filter' => $this->duration_filter ?? 'all',
            'mode' => $this->mode,
            'results_count' => $this->results_count,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
