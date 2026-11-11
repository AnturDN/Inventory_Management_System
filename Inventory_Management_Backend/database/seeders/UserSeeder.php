<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use Faker\Factory as Faker;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        $roleIds = Role::pluck('id')->toArray();
        $genders = ['male', 'female', 'other'];

        for ($i = 0; $i < 500; $i++) {
            User::create([
                'name'     => $faker->name,
                'email'    => $faker->unique()->safeEmail,
                'password' => Hash::make('password'), // Default password
                'gender'   => $faker->randomElement($genders),
                'contact'  => $faker->optional()->phoneNumber,
                'image'    => $faker->optional()->imageUrl(300, 300, 'people', true, 'User'),
                'status'   => $faker->boolean(90),
                'role_id'  => $faker->randomElement($roleIds),
            ]);
        }
    }
}
