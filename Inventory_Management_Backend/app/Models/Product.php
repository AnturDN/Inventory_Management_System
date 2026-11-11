<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Product extends Model {
    use HasFactory;

    protected $fillable = [
        'name', 'description', 'quantity',
        'category_id', 'brand_id', 'user_id',
        'image', 'status'
    ];

    protected $casts = [
        'status' => 'boolean'
    ];

    public function category() {
        return $this->belongsTo(Category::class);
    }

    public function brand() {
        return $this->belongsTo(Brand::class);
    }

    public function user() {
        return $this->belongsTo(User::class);
        
    }
    public function stocks() {
        return $this->hasMany(Stock::class);
    }
}
