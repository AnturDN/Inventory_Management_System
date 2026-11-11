<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SellItem;
use App\Models\Sell;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;
use Faker\Factory as Faker;

class SellItemSeeder extends Seeder
{
    public function run(): void
    {
        $faker = Faker::create();

        $sells = Sell::all();
        $stocks = Stock::where('quantity', '>', 0)->get();

        if ($sells->isEmpty() || $stocks->isEmpty()) {
            $this->command->error('Sells and Stocks must have data before running SellItemSeeder.');
            return;
        }

        DB::beginTransaction();

        try {
            for ($i = 0; $i < 20; $i++) {
                $sell = $sells->random();
                $stock = $stocks->random();

                $quantity = $faker->numberBetween(
                    1,
                    min(5, $stock->quantity)
                );

                $price = $faker->numberBetween(100, 500);
                $total = $quantity * $price;
                $profit = $faker->numberBetween(10, 100) * $quantity;

                SellItem::create([
                    'sell_id' => $sell->id,
                    'product_id' => $stock->product_id,
                    'stock_id' => $stock->id,
                    'quantity' => $quantity,
                    'selling_price' => $price,
                    'total' => $total,
                    'profit' => $profit,
                    'status' => true,
                ]);
            }

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();

            $this->command->error('SellItemSeeder error: ' . $e->getMessage());

            throw $e;
        }
    }
}
