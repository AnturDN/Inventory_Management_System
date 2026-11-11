<?php

namespace Database\Seeders;

use App\Models\RetailCustomer;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Faker\Factory as Faker;

class RetailCustomerSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        // Get valid user IDs to associate
        $userIds = User::pluck('id')->toArray();

        for ($i = 0; $i < 500; $i++) {
            RetailCustomer::create([
                'name'      => $faker->name,
                'email'     => $faker->unique()->safeEmail,
                'password'  => Hash::make('password'), // default password
                'contact'   => $faker->optional()->phoneNumber,
                'image'     => $faker->optional()->imageUrl(640, 480, 'people', true),
                'address'   => $faker->optional()->address,
                'status'    => $faker->boolean(90),
                'user_id'   => $faker->randomElement($userIds),
            ]);
        }
    }
}
