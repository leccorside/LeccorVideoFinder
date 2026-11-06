<?php

namespace App\Http\Controllers;

use App\Models\FavoriteVideo;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    protected function getEffectiveUserId(?User $user): int
    {
        if ($user) {
            return $user->id;
        }

        $defaultUser = User::firstOrCreate(
            ['email' => 'dev@videofinder.local'],
            [
                'name' => 'Criador VideoFinder',
                'password' => bcrypt('password123'),
                'avatar' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            ]
        );

        return $defaultUser->id;
    }

    /**
     * GET /api/favorites
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $this->getEffectiveUserId($request->user());
        $collectionId = $request->query('collection_id');

        $query = FavoriteVideo::where('user_id', $userId);

        if (!empty($collectionId) && $collectionId !== 'all') {
            $query->where('collection_id', (int) $collectionId);
        }

        $favorites = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'success' => true,
            'total' => $favorites->count(),
            'data' => $favorites->map(fn(FavoriteVideo $f) => $f->toPayload()),
        ]);
    }

    /**
     * POST /api/favorites
     */
    public function store(Request $request): JsonResponse
    {
        $userId = $this->getEffectiveUserId($request->user());

        $validated = $request->validate([
            'platform' => 'required|string|max:50',
            'externalId' => 'required|string|max:100',
            'canonicalUrl' => 'nullable|string|max:255',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'originalUrl' => 'required|string',
            'thumbnailUrl' => 'nullable|string',
            'author' => 'nullable|string|max:150',
            'durationSeconds' => 'nullable|integer',
            'viewsCount' => 'nullable|integer',
            'matchedTimestamp' => 'nullable|integer',
            'matchedSnippet' => 'nullable|string',
            'collection_id' => 'nullable|integer',
            'notes' => 'nullable|string',
        ]);

        $canonicalUrl = $validated['canonicalUrl'] ?? "{$validated['platform']}:{$validated['externalId']}";

        $favorite = FavoriteVideo::updateOrCreate(
            [
                'user_id' => $userId,
                'canonical_url' => $canonicalUrl,
            ],
            [
                'platform' => $validated['platform'],
                'external_id' => $validated['externalId'],
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'original_url' => $validated['originalUrl'],
                'thumbnail_url' => $validated['thumbnailUrl'] ?? null,
                'author' => $validated['author'] ?? 'Autor Desconhecido',
                'duration_seconds' => $validated['durationSeconds'] ?? null,
                'views_count' => $validated['viewsCount'] ?? null,
                'matched_timestamp' => $validated['matchedTimestamp'] ?? null,
                'matched_snippet' => $validated['matchedSnippet'] ?? null,
                'collection_id' => $validated['collection_id'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Vídeo salvo nos favoritos!',
            'data' => $favorite->toPayload(),
        ]);
    }

    /**
     * DELETE /api/favorites/{id}
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $userId = $this->getEffectiveUserId($request->user());

        // Permite apagar por ID numérico ou por canonicalUrl
        $query = FavoriteVideo::where('user_id', $userId);
        if (is_numeric($id)) {
            $query->where('id', (int) $id);
        } else {
            $query->where(function ($q) use ($id) {
                $q->where('canonical_url', $id)
                  ->orWhere('external_id', $id);
            });
        }

        $favorite = $query->first();

        if ($favorite) {
            $favorite->delete();
            return response()->json([
                'success' => true,
                'message' => 'Vídeo removido dos favoritos.',
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Vídeo não encontrado nos favoritos.',
        ], 404);
    }

    /**
     * POST /api/favorites/{id}/collection
     */
    public function setCollection(Request $request, int $id): JsonResponse
    {
        $userId = $this->getEffectiveUserId($request->user());
        $favorite = FavoriteVideo::where('id', $id)->where('user_id', $userId)->firstOrFail();

        $collectionId = $request->input('collection_id');
        $favorite->update(['collection_id' => $collectionId]);

        return response()->json([
            'success' => true,
            'message' => 'Vídeo alocado na coleção com sucesso!',
            'data' => $favorite->toPayload(),
        ]);
    }
}
