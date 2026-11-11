<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ExpenseCategory;
use Faker\Factory as Faker;

class ExpenseCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        // Example types — adjust based on your business logic
        $types = ['Operational', 'Administrative', 'Marketing', 'Travel', 'Supplies'];

        for ($i = 0; $i < 500; $i++) {
            ExpenseCategory::create([
                'name'   => $faker->unique()->words(2, true), // e.g. "Office Rent"
                'type'   => $faker->randomElement($types),
                'status' => $faker->boolean(90), // 90% chance of true
            ]);
        }
    }
}
