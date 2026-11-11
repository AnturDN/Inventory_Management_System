<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SellItem;
use App\Models\Sell;
use App\Models\Product;
use App\Models\Stock;
use Illuminate\Support\Facades\DB;

class SellItemSeeder extends Seeder
{
    public function run(): void
    {
        DB::beginTransaction();

        try {
            $sells = Sell::inRandomOrder()->take(10)->get();
            $products = Product::inRandomOrder()->take(10)->get();
            $stocks = Stock::inRandomOrder()->take(10)->get();

            foreach (range(1, 20) as $i) {
                $sell = $sells->random();
                $product = $products->random();
                $stock = $stocks->random();
                $quantity = rand(1, 5);
                $price = rand(100, 500);
                $total = $quantity * $price;
                $profit = rand(10, 100);

                SellItem::create([
                    'sell_id'       => $sell->id,
                    'product_id'    => $product->id,
                    'stock_id'      => $stock->id,
                    'quantity'      => $quantity,
                    'selling_price' => $price,
                    'total'         => $total,
                    'profit'        => $profit,
                    'status'        => true,
                ]);
            }

            DB::commit();

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('SellItemSeeder error: ' . $e->getMessage());
        }
    }
}
