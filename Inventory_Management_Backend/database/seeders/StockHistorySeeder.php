<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\StockHistory;
use App\Models\Stock;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\User;

class StockHistorySeeder extends Seeder
{
    public function run(): void
    {
        $faker = \Faker\Factory::create();

        // Make sure related tables are not empty
        $stockIds = Stock::pluck('id')->toArray();
        $productIds = Product::pluck('id')->toArray();
        $supplierIds = Supplier::pluck('id')->toArray();
        $warehouseIds = Warehouse::pluck('id')->toArray();
        $userIds = User::pluck('id')->toArray();

        if (
            empty($stockIds) || empty($productIds) || empty($supplierIds) ||
            empty($warehouseIds) || empty($userIds)
        ) {
            $this->command->error('Related tables must have data before running StockHistorySeeder.');
            return;
        }

        for ($i = 0; $i < 300; $i++) {
            $quantity = $faker->numberBetween(1, 100);
            $buyPrice = $faker->randomFloat(2, 10, 500);
            $sellPrice = $faker->randomFloat(2, $buyPrice, $buyPrice + 200);
            $totalAmount = $quantity * $buyPrice;
            $paidAmount = $faker->randomFloat(2, 0, $totalAmount);
            $dueAmount = $totalAmount - $paidAmount;

            StockHistory::create([
                'stock_id' => $faker->randomElement($stockIds),
                'product_id' => $faker->randomElement($productIds),
                'supplier_id' => $faker->randomElement($supplierIds),
                'warehouse_id' => $faker->randomElement($warehouseIds),
                'user_id' => $faker->randomElement($userIds),
                'quantity' => $quantity,
                'buy_price' => $buyPrice,
                'sell_price' => $sellPrice,
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'due_amount' => $dueAmount,
                'status' => $faker->boolean(90), // 90% active
            ]);
        }
    }
}
