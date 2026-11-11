<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Transaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'type',
        'stock_id',
        'expense_id',
        'investment_id',
        'payment_type_id',
        'others',
        'comments',
        'amount',
        'user_id',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function stock() {
        return $this->belongsTo(Stock::class);
    }

    public function expense() {
        return $this->belongsTo(Expense::class);
    }

    public function paymentType() {
        return $this->belongsTo(PaymentType::class);
    }

    public function user() {
        return $this->belongsTo(User::class);
    }


    public function investment() {
        return $this->belongsTo(Investment::class);
    }
}
