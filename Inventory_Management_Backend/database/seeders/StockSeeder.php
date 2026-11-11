<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Stock;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Warehouse;
use App\Models\User;
use Faker\Factory as Faker;

class StockSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        $productIds = Product::pluck('id')->toArray();
        $supplierIds = Supplier::pluck('id')->toArray();
        $warehouseIds = Warehouse::pluck('id')->toArray();
        $userIds = User::pluck('id')->toArray();

        for ($i = 0; $i < 60; $i++) {
            $quantity = $faker->numberBetween(1, 1000);
            $buyPrice = $faker->randomFloat(2, 10, 1000);
            $sellPrice = $buyPrice + $faker->randomFloat(2, 1, 500);
            $totalAmount = $buyPrice * $quantity;
            $paidAmount = $faker->randomFloat(2, 0, $totalAmount);
            $dueAmount = $totalAmount - $paidAmount;

            Stock::create([
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
                'status' => $faker->boolean(90),
            ]);
        }
    }
}
