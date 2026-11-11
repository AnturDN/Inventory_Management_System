<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Warehouse extends Model
{
    use HasFactory;

     protected $fillable = [
        'name',
        'address',
        'status',
    ];
    public function stocks() {
        return $this->hasMany(Stock::class);
    }
}
