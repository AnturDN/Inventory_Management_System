<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Stock;
use App\Models\StockHistory;
use Faker\Factory as Faker;

class StockHistorySeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        $stocks = Stock::where('quantity', '>', 0)->get();

        if ($stocks->isEmpty()) {
            $this->command->error('Stocks must have data before running StockHistorySeeder.');
            return;
        }

        for ($i = 0; $i < 50; $i++) {
            // Select one stock so all related IDs remain consistent
            $stock = $stocks->random();

            $quantity = $faker->numberBetween(1, 100);
            $buyPrice = $stock->buy_price;
            $sellPrice = $stock->sell_price;

            $totalAmount = $quantity * $buyPrice;
            $paidAmount = $faker->randomFloat(2, 0, $totalAmount);
            $dueAmount = $totalAmount - $paidAmount;

            StockHistory::create([
                'stock_id' => $stock->id,
                'product_id' => $stock->product_id,
                'supplier_id' => $stock->supplier_id,
                'warehouse_id' => $stock->warehouse_id,
                'user_id' => $stock->user_id,
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
