<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'is_admin',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'is_admin' => 'boolean',
    ];

    public function collections(): HasMany
    {
        return $this->hasMany(Collection::class)->orderBy('created_at', 'desc');
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(FavoriteVideo::class)->orderBy('created_at', 'desc');
    }

    public function searchHistory(): HasMany
    {
        return $this->hasMany(SearchHistory::class)->orderBy('created_at', 'desc');
    }
}
