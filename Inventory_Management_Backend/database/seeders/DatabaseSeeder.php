<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            WarehouseSeeder::class,
            BrandSeeder::class,
            CategorySeeder::class,
            SupplierSeeder::class,
            RoleSeeder::class,
            CustomerSeeder::class,
            ExpenseCategorySeeder::class,
            PaymentTypeSeeder::class,
            UserSeeder::class,
            RetailCustomerSeeder::class,
            ProductSeeder::class,
            StockSeeder::class,
            ExpenseSeeder::class,
            InvestmentSeeder::class,
            SellSeeder::class,
            StockHistorySeeder::class,
            SellItemSeeder::class,
            TransactionSeeder::class,
        ]);
    }
}