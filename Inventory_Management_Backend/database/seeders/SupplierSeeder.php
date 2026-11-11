<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;
use Faker\Factory as Faker;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 0; $i < 20; $i++) {
            Supplier::create([
                'name'       => $faker->name,
                'shop_name'  => $faker->company,
                'address'    => $faker->address,
                'contact'    => $faker->phoneNumber,
                'email'      => $faker->unique()->safeEmail,
                'image'      => $faker->imageUrl(300, 300, 'people', true, 'Supplier'),
                'status'     => $faker->boolean(90), // 90% chance true
            ]);
        }
    }
}
