<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Transaction;
use App\Models\Stock;
use App\Models\Expense;
use App\Models\PaymentType;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class TransactionSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        $stocks = Stock::pluck('id')->toArray();
        $expenses = Expense::pluck('id')->toArray();
        $paymentTypes = PaymentType::pluck('id')->toArray();
        $users = User::pluck('id')->toArray();

        DB::beginTransaction();

        try {
            foreach (range(1, 200) as $i) {
                $type = $faker->randomElement(['income', 'expense']);
                $stockId = $faker->optional()->randomElement($stocks);
                $expenseId = $faker->optional()->randomElement($expenses);
                $paymentTypeId = $faker->optional()->randomElement($paymentTypes);
                $userId = $faker->randomElement($users);
                $amount = $faker->randomFloat(2, 50, 1000);

                Transaction::create([
                    'type'             => $type,
                    'stock_id'         => $stockId,
                    'expense_id'       => $expenseId,
                    'payment_type_id'  => $paymentTypeId,
                    'others'           => $faker->sentence(),
                    'comments'         => $faker->paragraph(),
                    'amount'           => $amount,
                    'user_id'          => $userId,
                    'status'           => $faker->boolean(90),
                ]);
            }

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('TransactionSeeder error: ' . $e->getMessage());
        }
    }
}
