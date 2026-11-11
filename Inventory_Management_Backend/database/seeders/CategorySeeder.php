<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use Faker\Factory as Faker;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 0; $i < 20; $i++) {
            Category::create([
                'name' => $faker->unique()->words(2, true), // e.g. "Smart Devices"
                'image' => $faker->imageUrl(300, 300, 'category', true, 'Category'),
                'status' => $faker->boolean(90), // 90% chance true
            ]);
        }
    }
}
