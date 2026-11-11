<?php

namespace Database\Seeders;

use App\Models\Sell;
use Illuminate\Database\Seeder;
use Faker\Factory as Faker;
use Illuminate\Support\Facades\DB;

class SellSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        $userIds = DB::table('users')->pluck('id')->toArray();
        $customerIds = DB::table('customers')->pluck('id')->toArray();
        $retailCustomerIds = DB::table('retail_customers')->pluck('id')->toArray();

        if (empty($userIds) || empty($customerIds) || empty($retailCustomerIds)) {
            $this->command->error("Ensure users, customers, and retail_customers tables are populated before seeding sells.");
            return;
        }

        for ($i = 0; $i < 40; $i++) {
            $totalAmount = $faker->randomFloat(2, 1000, 10000);
            $paidAmount = $faker->randomFloat(2, 500, $totalAmount);
            $dueAmount = $totalAmount - $paidAmount;
            $totalProfit = $faker->randomFloat(2, 100, 2000);
            $discount = $faker->randomFloat(2, 0, 500);
            $netProfit = $totalProfit - $discount;

            Sell::create([
                'total_amount'       => $totalAmount,
                'paid_amount'        => $paidAmount,
                'due_amount'         => $dueAmount,
                'total_profit'       => $totalProfit,
                'discount'           => $discount,
                'net_profit'         => $netProfit,
                'user_id'            => $faker->randomElement($userIds),
                'customer_id'        => $faker->randomElement($customerIds),
                'retail_customer_id' => $faker->randomElement($retailCustomerIds),
                'image'              => $faker->imageUrl(640, 480, 'business', true, 'sell'),
                'status'             => $faker->boolean(),
            ]);
        }
    }
}
