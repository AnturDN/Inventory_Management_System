<?php

namespace Database\Seeders;

use App\Models\Investment;
use App\Models\PaymentType;
use App\Models\User;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;

class InvestmentSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        $paymentTypeIds = PaymentType::pluck('id')->toArray();
        $userIds = User::pluck('id')->toArray();


        if (empty($paymentTypeIds) || empty($userIds)) {
            $this->command->error('Payment Types and Users must have data before running InvestmentSeeder.');
            return;
        }

        for ($i = 0; $i < 20; $i++) {
            Investment::create([
                'name'            => $faker->company,
                'payment_type_id' => $faker->randomElement($paymentTypeIds),
                'amount'          => $faker->randomFloat(2, 1000, 100000),
                'description'     => $faker->optional()->sentence(),
                'user_id'         => $faker->randomElement($userIds),
                'image'           => null, // or provide a dummy path like 'https://example.com/image.jpg'
                'deed_image'      => null, // or dummy image
                'status'          => $faker->boolean(90),
            ]);
        }
    }
}
