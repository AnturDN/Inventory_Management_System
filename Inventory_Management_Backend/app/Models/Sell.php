<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Sell extends Model
{
    use HasFactory;

    protected $fillable = [
        'total_amount', 'paid_amount', 'due_amount',
        'total_profit', 'discount', 'net_profit',
        'user_id', 'customer_id', 'retail_customer_id',
        'image', 'status'
    ];

    protected $casts = [
        'status' => 'boolean'
    ];

    public function user() {
        return $this->belongsTo(User::class);
    }

    public function customer() {
        return $this->belongsTo(Customer::class);
    }

    public function retailCustomer() {
        return $this->belongsTo(RetailCustomer::class, 'retail_customer_id');
    }
}
