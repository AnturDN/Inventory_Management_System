<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Category;
use App\Models\Brand;
use App\Models\User;
use Faker\Factory as Faker;

class ProductSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        // Fetch existing IDs for foreign keys
        $categoryIds = Category::pluck('id')->toArray();
        $brandIds = Brand::pluck('id')->toArray();
        $userIds = User::pluck('id')->toArray();

        for ($i = 0; $i < 5; $i++) {
            Product::create([
                'name' => $faker->word(),
                'description' => $faker->optional()->sentence(10),
                'quantity' => $faker->numberBetween(1, 100),
                'category_id' => $faker->randomElement($categoryIds),
                'brand_id' => $faker->randomElement($brandIds),
                'user_id' => $faker->randomElement($userIds),
                'image' => $faker->optional()->imageUrl(640, 480, 'technics', true),
                'status' => $faker->boolean(85), // 85% chance true
            ]);
        }
    }
}
