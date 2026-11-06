<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuthAndFavoritesTest extends TestCase
{
    public function test_user_can_register_and_receive_sanctum_token(): void
    {
        $uniqueEmail = 'user_' . Str::random(8) . '@videofinder.local';

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Criador Teste',
            'email' => $uniqueEmail,
            'password' => 'senhaSegura123',
            'password_confirmation' => 'senhaSegura123',
        ]);

        $response->assertStatus(201);
        $response->assertJson([
            'success' => true,
        ]);
        $response->assertJsonStructure([
            'success',
            'token',
            'user' => [
                'id',
                'name',
                'email',
            ],
        ]);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        $uniqueEmail = 'login_' . Str::random(8) . '@videofinder.local';

        User::create([
            'name' => 'Login User',
            'email' => $uniqueEmail,
            'password' => bcrypt('password123'),
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $uniqueEmail,
            'password' => 'password123',
        ]);

        $response->assertStatus(200);
        $response->assertJson(['success' => true]);
        $this->assertNotEmpty($response->json('token'));
    }

    protected function createUser(): User
    {
        return User::create([
            'name' => 'User ' . Str::random(5),
            'email' => 'user_' . Str::random(8) . '@videofinder.local',
            'password' => bcrypt('password123'),
        ]);
    }

    public function test_authenticated_user_can_manage_collections(): void
    {
        $user = $this->createUser();
        $token = $user->createToken('test')->plainTextToken;

        // 1. Criar Coleção
        $createRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/collections', [
                'title' => 'Cortes Podcast',
                'icon' => 'mic',
            ]);

        $createRes->assertStatus(201);
        $colId = $createRes->json('data.id');

        // 2. Listar Coleções
        $listRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/collections');

        $listRes->assertStatus(200);
        $listRes->assertJson(['success' => true]);

        // 3. Excluir Coleção
        $deleteRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/collections/{$colId}");

        $deleteRes->assertStatus(200);
    }

    public function test_user_can_save_and_remove_favorite_videos(): void
    {
        $user = $this->createUser();
        $token = $user->createToken('test')->plainTextToken;

        $externalId = 'ext_' . Str::random(6);

        // 1. Salvar Favorito
        $saveRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/favorites', [
                'platform' => 'youtube',
                'externalId' => $externalId,
                'title' => 'Vídeo Inspirador de Superação',
                'originalUrl' => "https://youtube.com/watch?v={$externalId}",
                'durationSeconds' => 320,
            ]);

        $saveRes->assertStatus(201);
        $favId = $saveRes->json('data.id');

        // 2. Listar Favoritos
        $listRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/favorites');

        $listRes->assertStatus(200);
        $listRes->assertJson(['success' => true]);

        // 3. Remover Favorito por ID
        $delRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/favorites/{$favId}");

        $delRes->assertStatus(200);
    }

    public function test_search_history_lifecycle(): void
    {
        $user = $this->createUser();
        $token = $user->createToken('test')->plainTextToken;

        // 1. Gravar Pesquisa
        $storeRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/history', [
                'query' => 'inteligência artificial na produção de vídeo',
                'mode' => 'ai_semantic',
                'results_count' => 15,
            ]);

        $storeRes->assertStatus(201);
        $historyId = $storeRes->json('data.id');

        // 2. Listar Histórico
        $listRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/history');

        $listRes->assertStatus(200);
        $listRes->assertJson(['success' => true]);

        // 3. Remover Item Específico
        $delRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson("/api/history/{$historyId}");

        $delRes->assertStatus(200);

        // 4. Limpar Todo o Histórico
        $clearRes = $this->withHeader('Authorization', "Bearer {$token}")
            ->deleteJson('/api/history');

        $clearRes->assertStatus(200);
    }
}
