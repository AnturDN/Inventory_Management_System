<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

     protected $fillable = [
        'name',
        'shop_name',
        'address',
        'contact',
        'email',
        'image',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];
    public function stocks() {
        return $this->hasMany(Stock::class);
    }
}
