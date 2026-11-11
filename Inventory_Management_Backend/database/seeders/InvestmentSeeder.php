<?php

namespace Database\Seeders;

use App\Models\Investment;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

class InvestmentSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        for ($i = 0; $i < 500; $i++) {
            Investment::create([
                'name'            => $faker->company,
                'payment_type_id' => rand(1, 20),  // Adjust according to your actual seeded data
                'amount'          => $faker->randomFloat(2, 1000, 100000),
                'description'     => $faker->optional()->sentence(),
                'user_id'         => rand(1, 50),  // Adjust based on your actual users
                'image'           => null, // or provide a dummy path like 'https://example.com/image.jpg'
                'deed_image'      => null, // or dummy image
                'status'          => $faker->boolean(90),
            ]);
        }
    }
}
