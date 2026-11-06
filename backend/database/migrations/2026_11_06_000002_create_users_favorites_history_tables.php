<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Tabela de Usuários
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->unique();
                $table->timestamp('email_verified_at')->nullable();
                $table->string('password');
                $table->string('avatar')->nullable();
                $table->boolean('is_admin')->default(false);
                $table->rememberToken();
                $table->timestamps();
            });
        }

        // 2. Tabela de Coleções de Vídeos
        Schema::create('collections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->string('icon', 50)->default('folder');
            $table->string('color', 50)->default('#8B5CF6');
            $table->boolean('is_public')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });

        // 3. Tabela de Favoritos
        Schema::create('favorite_videos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('collection_id')->nullable()->constrained('collections')->onDelete('set null');
            $table->string('platform', 50);
            $table->string('external_id', 100);
            $table->string('canonical_url', 255)->index();
            $table->string('title', 255);
            $table->text('description')->nullable();
            $table->text('thumbnail_url')->nullable();
            $table->text('original_url');
            $table->string('author', 150)->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->bigInteger('views_count')->nullable();
            $table->integer('matched_timestamp')->nullable();
            $table->text('matched_snippet')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'canonical_url']);
        });

        // 4. Tabela de Histórico de Pesquisas
        Schema::create('search_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('cascade');
            $table->string('session_id', 100)->nullable()->index();
            $table->string('query', 255);
            $table->json('platform_filters')->nullable();
            $table->string('duration_filter', 20)->nullable();
            $table->string('mode', 30)->default('simple');
            $table->integer('results_count')->default(0);
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('search_history');
        Schema::dropIfExists('favorite_videos');
        Schema::dropIfExists('collections');
        Schema::dropIfExists('users');
    }
};
