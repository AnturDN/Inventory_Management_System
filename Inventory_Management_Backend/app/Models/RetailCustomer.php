<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RetailCustomer extends Model
{
    use HasFactory;

        protected $fillable = [
        'name',
        'email',
        'password',
        'contact',
        'image',
        'address',
        'status',
        'user_id',
    ];

    // Relation to User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // To get Role via User
    public function role()
    {
        return $this->user->role(); // via user relationship
    }
     public function sells()
    {
        return $this->hasMany(Sell::class, 'retail_customer_id');
    }
    

}
