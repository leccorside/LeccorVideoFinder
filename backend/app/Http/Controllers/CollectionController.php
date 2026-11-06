<?php

namespace App\Http\Controllers;

use App\Models\Collection;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CollectionController extends Controller
{
    /**
     * Retorna o ID do usuário ativo ou cria um usuário padrão de desenvolvimento.
     */
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
     * GET /api/collections
     */
    public function index(Request $request): JsonResponse
    {
        $userId = $this->getEffectiveUserId($request->user());

        $collections = Collection::where('user_id', $userId)
            ->withCount('videos')
            ->orderBy('created_at', 'desc')
            ->get();

        // Se for a primeira vez e o usuário não tiver coleções, cria coleções de demonstração
        if ($collections->isEmpty()) {
            $defaultCols = [
                ['title' => 'Cortes de Sabedoria & Vida', 'description' => 'Trechos inspiradores e entrevistas sobre mentalidade', 'icon' => 'auto_stories', 'color' => '#8B5CF6'],
                ['title' => 'Palestras & Discursos Épicos', 'description' => 'Keynotes universitários e momentos marcantes', 'icon' => 'podium', 'color' => '#06B6D4'],
                ['title' => 'Documentários de Tecnologia', 'description' => 'Histórias da computação e biografias de inovadores', 'icon' => 'terminal', 'color' => '#F43F5E'],
            ];

            foreach ($defaultCols as $col) {
                Collection::create(array_merge($col, ['user_id' => $userId]));
            }

            $collections = Collection::where('user_id', $userId)
                ->withCount('videos')
                ->orderBy('created_at', 'desc')
                ->get();
        }

        return response()->json([
            'success' => true,
            'data' => $collections->map(fn(Collection $c) => $c->toPayload()),
        ]);
    }

    /**
     * POST /api/collections
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:150',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
            'is_public' => 'nullable|boolean',
        ]);

        $userId = $this->getEffectiveUserId($request->user());

        $collection = Collection::create([
            'user_id' => $userId,
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? 'folder',
            'color' => $validated['color'] ?? '#8B5CF6',
            'is_public' => $validated['is_public'] ?? false,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Coleção criada com sucesso!',
            'data' => $collection->toPayload(),
        ], 201);
    }

    /**
     * PUT /api/collections/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $userId = $this->getEffectiveUserId($request->user());
        $collection = Collection::where('id', $id)->where('user_id', $userId)->firstOrFail();

        $validated = $request->validate([
            'title' => 'nullable|string|max:150',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:50',
        ]);

        $collection->update(array_filter($validated));

        return response()->json([
            'success' => true,
            'message' => 'Coleção atualizada com sucesso!',
            'data' => $collection->toPayload(),
        ]);
    }

    /**
     * DELETE /api/collections/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $userId = $this->getEffectiveUserId($request->user());
        $collection = Collection::where('id', $id)->where('user_id', $userId)->firstOrFail();

        $collection->delete();

        return response()->json([
            'success' => true,
            'message' => 'Coleção removida com sucesso.',
        ]);
    }
}
