<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stock extends Model
{
    use HasFactory;

    protected $fillable = [
        'product_id', 'supplier_id', 'warehouse_id', 'user_id', 'quantity', 
        'buy_price', 'sell_price', 'total_amount', 'paid_amount', 'due_amount', 'status'
    ];

    protected $casts = [
        'status' => 'boolean',
        'buy_price' => 'decimal:2',
        'sell_price' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
    ];

    public function product() {
        return $this->belongsTo(Product::class);
    }

    public function supplier() {
        return $this->belongsTo(Supplier::class);
    }

    public function warehouse() {
        return $this->belongsTo(Warehouse::class);
    }

    public function user() {
        return $this->belongsTo(User::class);
    }
     public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
