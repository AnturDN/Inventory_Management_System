<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\PaymentType;
use Faker\Factory as Faker;

class PaymentTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        // Example payment method types
        $types = ['Digital Wallet', 'Bank Transfer', 'Card', 'Cash', 'Mobile Banking'];

        for ($i = 0; $i < 500; $i++) {
            PaymentType::create([
                'name'  => $faker->unique()->company . ' Pay',
                'type'  => $faker->randomElement($types),
                'logo'  => $faker->optional()->imageUrl(200, 200, 'business', true, 'Payment'),
                'status'=> $faker->boolean(90), // 90% chance of true
            ]);
        }
    }
}
