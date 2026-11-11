<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Warehouse;
use Faker\Factory as Faker;

class WarehouseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 0; $i < 10; $i++) {
            Warehouse::create([
                'name' => $faker->company . ' Warehouse',
                'address' => $faker->address,
                'status' => $faker->boolean(90), // 90% chance of being true
            ]);
        }
    }
}
