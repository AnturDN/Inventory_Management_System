<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Customer;
use Faker\Factory as Faker;
use Illuminate\Support\Facades\Hash;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 0; $i < 30; $i++) {
            Customer::create([
                'name'     => $faker->name,
                'email'    => $faker->unique()->safeEmail,
                'password' => Hash::make('password'), // default password
                'contact'  => $faker->optional()->phoneNumber,
                'image'    => $faker->optional()->imageUrl(300, 300, 'people', true, 'Customer'),
                'status'   => $faker->boolean(90),
            ]);
        }
    }
}
