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
        Schema::create('video_transcripts', function (Blueprint $table) {
            $table->id();
            $table->string('canonical_url', 255)->index();
            $table->string('platform', 50)->index();
            $table->string('external_id', 100)->index();
            $table->string('video_title', 255)->nullable();
            $table->string('language', 10)->default('pt-BR');
            $table->boolean('is_verified')->default(false);
            $table->string('source', 50)->default('closed_captions');
            $table->longText('raw_text')->nullable();
            $table->timestamps();

            $table->unique(['platform', 'external_id', 'language']);
        });

        Schema::create('video_transcript_segments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('transcript_id')->constrained('video_transcripts')->onDelete('cascade');
            $table->unsignedInteger('start_time'); // em segundos
            $table->unsignedInteger('end_time');   // em segundos
            $table->text('text');
            $table->string('speaker', 100)->nullable();
            $table->timestamps();

            $table->index(['transcript_id', 'start_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('video_transcript_segments');
        Schema::dropIfExists('video_transcripts');
    }
};
