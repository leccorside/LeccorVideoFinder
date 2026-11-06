<?php

namespace App\Http\Controllers;

use App\Models\SearchHistory;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HistoryController extends Controller
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
     * GET /api/history
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $this->getEffectiveUserId($request->user());

        $history = SearchHistory::where('user_id', $userId)
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        // Se estiver vazio, popula com buscas de exemplo
        if ($history->isEmpty()) {
            $defaultQueries = [
                ['query' => 'Steve Jobs discurso Stanford', 'mode' => 'simple', 'results_count' => 30],
                ['query' => 'disciplina e superação de fracassos', 'mode' => 'ai_semantic', 'results_count' => 143],
                ['query' => 'cortes de podcast motivacional', 'mode' => 'simple', 'results_count' => 85],
            ];

            foreach ($defaultQueries as $item) {
                SearchHistory::create(array_merge($item, ['user_id' => $userId]));
            }

            $history = SearchHistory::where('user_id', $userId)
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json([
            'success' => true,
            'total' => $history->count(),
            'data' => $history->map(fn(SearchHistory $h) => $h->toPayload()),
        ]);
    }

    /**
     * POST /api/history
     */
    public function store(Request $request): JsonResponse
    {
        $userId = $this->getEffectiveUserId($request->user());

        $validated = $request->validate([
            'query' => 'required|string|max:255',
            'platform_filters' => 'nullable|array',
            'duration_filter' => 'nullable|string|max:20',
            'mode' => 'nullable|string|max:30',
            'results_count' => 'nullable|integer',
        ]);

        $item = SearchHistory::create([
            'user_id' => $userId,
            'query' => $validated['query'],
            'platform_filters' => $validated['platform_filters'] ?? null,
            'duration_filter' => $validated['duration_filter'] ?? 'all',
            'mode' => $validated['mode'] ?? 'simple',
            'results_count' => $validated['results_count'] ?? 0,
        ]);

        return response()->json([
            'success' => true,
            'data' => $item->toPayload(),
        ], 201);
    }

    /**
     * DELETE /api/history/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $userId = $this->getEffectiveUserId($request->user());

        SearchHistory::where('id', $id)->where('user_id', $userId)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item removido do histórico.',
        ]);
    }

    /**
     * DELETE /api/history
     * Limpa todo o histórico de pesquisas do usuário.
     */
    public function clear(Request $request): JsonResponse
    {
        $userId = $this->getEffectiveUserId($request->user());

        SearchHistory::where('user_id', $userId)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Histórico de pesquisas limpo com sucesso.',
        ]);
    }
}
