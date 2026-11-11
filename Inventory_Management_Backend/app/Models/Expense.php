<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'description',
        'cost',
        'payment_type_id',
        'expense_category_id',
        'user_id',
        'status',
    ];

    // Relations
    public function paymentType()
    {
        return $this->belongsTo(PaymentType::class);
    }

    public function expenseCategory()
    {
        return $this->belongsTo(ExpenseCategory::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
     public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }
}
