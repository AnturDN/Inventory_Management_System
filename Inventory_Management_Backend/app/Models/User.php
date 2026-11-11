<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class User extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'password',
        'gender',
        'contact',
        'image',
        'status',
        'role_id',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    // Relationship: User belongs to Role
    public function role()
    {
        return $this->belongsTo(Role::class);
    }
    // User.php
    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }
     public function sells()
    {
        return $this->hasMany(Sell::class);
    }
    public function investments()
    {
        return $this->hasMany(Investment::class);
    }
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }



}
