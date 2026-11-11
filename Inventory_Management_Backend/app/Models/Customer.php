<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;
      protected $fillable = [
        'name',
        'email',
        'password',
        'contact',
        'image',
        'status',
    ];

    protected $hidden = ['password'];

    protected $casts = [
        'status' => 'boolean',
    ];
    public function sells()
    {
        return $this->hasMany(Sell::class);
    }
}
