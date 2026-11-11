<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SellItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'sell_id', 'product_id', 'stock_id', 'quantity', 'selling_price', 'total', 'profit', 'status'
    ];

    protected $casts = [
        'status' => 'boolean',
        'selling_price' => 'decimal:2',
        'total' => 'decimal:2',
        'profit' => 'decimal:2',
    ];

    public function sell() {
        return $this->belongsTo(Sell::class);
    }

    public function product() {
        return $this->belongsTo(Product::class);
    }

    public function stock() {
        return $this->belongsTo(Stock::class);
    }
}
