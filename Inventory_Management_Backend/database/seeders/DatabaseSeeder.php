<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
       $this->call([
        WarehouseSeeder::class,
    ]);

    $this->call([
        BrandSeeder::class,
    ]);
    $this->call([
        CategorySeeder::class,
    ]);
      $this->call([
        SupplierSeeder::class,
    ]);
     $this->call([
        RoleSeeder::class,
    ]);
    $this->call([
        CustomerSeeder::class,
    ]);
    $this->call([
        ExpenseCategorySeeder::class,
    ]);
    $this->call([
        PaymentTypeSeeder::class,
    ]);
    $this->call([
        UserSeeder::class,
    ]);
    $this->call([
        ExpenseSeeder::class,
    ]);
    $this->call([RetailCustomerSeeder::class,
    ]);
    $this->call([
        SellSeeder::class,
    ]);
    $this->call([
        InvestmentSeeder::class,
    ]);
     $this->call([
        ProductSeeder::class,
    ]);
    
    $this->call(StockSeeder::class);

    $this->call([
        StockHistorySeeder::class,
    ]);
    
    $this->call([
        SellItemSeeder::class,
    ]);
    $this->call([
    TransactionSeeder::class,
    ]);



    }
}
