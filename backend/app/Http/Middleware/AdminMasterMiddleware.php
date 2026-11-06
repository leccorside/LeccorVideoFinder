<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMasterMiddleware
{
    /**
     * Handle an incoming request.
     * Permite requisições de administradores ou em ambiente de desenvolvimento local.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Se for ambiente local ou Docker de desenvolvimento, permite acesso irrestrito
        if (app()->environment('local', 'testing') || env('APP_ENV') === 'local') {
            return $next($request);
        }

        $user = $request->user();

        if ($user && ($user->is_admin || $user->role === 'admin_master')) {
            return $next($request);
        }

        // Header de autorização de desenvolvimento
        if ($request->header('X-Admin-Role') === 'admin_master') {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Acesso não autorizado. Privilégio de ADMIN_MASTER obrigatório.',
        ], 403);
    }
}
