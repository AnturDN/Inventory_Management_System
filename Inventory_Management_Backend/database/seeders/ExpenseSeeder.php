<?php

namespace Database\Seeders;

use App\Models\Expense;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class ExpenseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $faker = Faker::create();

        // Ensure related IDs exist
        $paymentTypeIds = DB::table('payment_types')->pluck('id')->toArray();
        $expenseCategoryIds = DB::table('expense_categories')->pluck('id')->toArray();
        $userIds = DB::table('users')->pluck('id')->toArray();

        if (empty($paymentTypeIds) || empty($expenseCategoryIds) || empty($userIds)) {
            $this->command->error('Related tables must have data: payment_types, expense_categories, users');
            return;
        }

        $data = [];

        for ($i = 0; $i < 500; $i++) {
            $data[] = [
                'description' => $faker->sentence(),
                'cost' => $faker->randomFloat(2, 100, 5000),
                'payment_type_id' => $faker->randomElement($paymentTypeIds),
                'expense_category_id' => $faker->randomElement($expenseCategoryIds),
                'user_id' => $faker->randomElement($userIds),
                'status' => $faker->boolean(),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        Expense::insert($data);
    }
}
