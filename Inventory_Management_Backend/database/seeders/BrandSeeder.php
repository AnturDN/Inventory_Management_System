<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Brand;
use Faker\Factory as Faker;

class BrandSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 0; $i < 500; $i++) {
            Brand::create([
                'name' => $faker->unique()->company,
                'logo' => $faker->imageUrl(200, 200, 'business', true, 'Brand'),
                'status' => $faker->boolean(90), // 90% chance of true
            ]);
        }
    }
}
