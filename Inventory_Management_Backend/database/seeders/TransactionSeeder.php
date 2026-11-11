<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Transaction;
use App\Models\Stock;
use App\Models\Expense;
use App\Models\PaymentType;
use App\Models\User;
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

        if (empty($users)) {
            $this->command->error('Users must have data before running TransactionSeeder.');
            return;
        }

        for ($i = 0; $i < 40; $i++) {

            $type = $faker->randomElement(['income', 'expense']);

            $stockId = null;
            $expenseId = null;

            if ($type === 'income' && !empty($stocks)) {
                $stockId = $faker->randomElement($stocks);
            }

            if ($type === 'expense' && !empty($expenses)) {
                $expenseId = $faker->randomElement($expenses);
            }

            $paymentTypeId = !empty($paymentTypes)
                ? $faker->randomElement($paymentTypes)
                : null;

            $userId = $faker->randomElement($users);

            Transaction::create([
                'type' => $type,
                'stock_id' => $stockId,
                'expense_id' => $expenseId,
                'payment_type_id' => $paymentTypeId,
                'others' => $faker->sentence(),
                'comments' => $faker->paragraph(),
                'amount' => $faker->randomFloat(2, 50, 1000),
                'user_id' => $userId,
                'status' => $faker->boolean(90),
            ]);
        }
    }
}
