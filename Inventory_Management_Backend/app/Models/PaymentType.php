<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentType extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'type', 'logo', 'status'];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function expenses()
    {
        return $this->hasMany(Expense::class);
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
