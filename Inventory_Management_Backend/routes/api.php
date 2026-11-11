<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\WarehouseController;
use App\Http\Controllers\Api\BrandController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\SupplierController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\ExpenseCategoryController;
use App\Http\Controllers\Api\PaymentTypeController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\RetailCustomerController;
use App\Http\Controllers\Api\SellController;
use App\Http\Controllers\Api\InvestmentController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\Api\StockHistoryController;
use App\Http\Controllers\Api\SellItemController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Controllers\Api\DashboardController;



Route::prefix('warehouses')->group(function () {
    Route::get('/', [WarehouseController::class, 'index']); // non-paginated
    Route::get('/paginated', [WarehouseController::class, 'getAllWarehouses']); // paginated
    Route::get('/search', [WarehouseController::class, 'searchWarehouses']); // search
    Route::post('/', [WarehouseController::class, 'store']);
    Route::get('/{id}', [WarehouseController::class, 'show']);
    Route::put('/{id}', [WarehouseController::class, 'update']);
    Route::delete('/{id}', [WarehouseController::class, 'destroy']);
});

Route::prefix('brands')->group(function () {
    Route::get('/', [BrandController::class, 'index']);                    
    Route::get('/paginated', [BrandController::class, 'getAllBrands']);   
    Route::get('/search', [BrandController::class, 'searchBrands']);      
    Route::post('/', [BrandController::class, 'store']);                  
    Route::get('/{id}', [BrandController::class, 'show']);                
    Route::put('/{id}', [BrandController::class, 'update']);              
    Route::delete('/{id}', [BrandController::class, 'destroy']);          
});

Route::prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'index']);                     
    Route::get('/paginated', [CategoryController::class, 'getAllCategories']);    
    Route::get('/search', [CategoryController::class, 'searchCategories']);      
    Route::post('/', [CategoryController::class, 'store']);                
    Route::get('/{id}', [CategoryController::class, 'show']);                
    Route::put('/{id}', [CategoryController::class, 'update']);               
    Route::delete('/{id}', [CategoryController::class, 'destroy']);         
});

Route::prefix('suppliers')->group(function () {
    Route::get('/', [SupplierController::class, 'index']);                  
    Route::get('/paginated', [SupplierController::class, 'getAllSuppliers']);  
    Route::get('/search', [SupplierController::class, 'searchSuppliers']);      
    Route::post('/', [SupplierController::class, 'store']);                 
    Route::get('/{id}', [SupplierController::class, 'show']);               
    Route::put('/{id}', [SupplierController::class, 'update']);             
    Route::delete('/{id}', [SupplierController::class, 'destroy']);          
});

Route::prefix('roles')->group(function () {
    Route::get('/', [RoleController::class, 'index']);                 
    Route::get('/paginated', [RoleController::class, 'getAllRoles']);  
    Route::get('/search', [RoleController::class, 'searchRoles']);     

    Route::post('/', [RoleController::class, 'store']);                
    Route::get('/{id}', [RoleController::class, 'show']);              
    Route::put('/{id}', [RoleController::class, 'update']);            
    Route::delete('/{id}', [RoleController::class, 'destroy']);        
});

Route::prefix('customers')->group(function () {
    Route::get('/', [CustomerController::class, 'index']);                 
    Route::get('/paginated', [CustomerController::class, 'getAllCustomers']);  
    Route::get('/search', [CustomerController::class, 'searchCustomers']);    
    Route::post('/', [CustomerController::class, 'store']);               
    Route::get('/{id}', [CustomerController::class, 'show']); 
    Route::put('/{id}', [CustomerController::class, 'update']);        
    Route::delete('/{id}', [CustomerController::class, 'destroy']);        
});

Route::prefix('expense-categories')->group(function () {
    Route::get('/', [ExpenseCategoryController::class, 'index']);                  
    Route::get('/paginated', [ExpenseCategoryController::class, 'getAllCategories']);   
    Route::get('/search', [ExpenseCategoryController::class, 'searchCategories']);  
    Route::post('/', [ExpenseCategoryController::class, 'store']);                
    Route::get('/{id}', [ExpenseCategoryController::class, 'show']);              
    Route::put('/{id}', [ExpenseCategoryController::class, 'update']);         
    Route::delete('/{id}', [ExpenseCategoryController::class, 'destroy']);  
});

Route::prefix('payment-types')->group(function () {
    Route::get('/', [PaymentTypeController::class, 'index']);                  
    Route::get('/paginated', [PaymentTypeController::class, 'getAllPaymentTypes']);   
    Route::get('/search', [PaymentTypeController::class, 'searchPaymentTypes']);     
    Route::post('/', [PaymentTypeController::class, 'store']);                
    Route::get('/{id}', [PaymentTypeController::class, 'show']);             
    Route::put('/{id}', [PaymentTypeController::class, 'update']);            
    Route::delete('/{id}', [PaymentTypeController::class, 'destroy']);         
});

Route::prefix('users')->group(function () {
    Route::get('/', [UserController::class, 'index']);                    
    Route::get('/paginated', [UserController::class, 'getAllUsers']); 
    Route::get('/search', [UserController::class, 'searchUsers']);      
    Route::post('/', [UserController::class, 'store']);                   
    Route::get('/{id}', [UserController::class, 'show']);                  
    Route::put('/{id}', [UserController::class, 'update']);               
    Route::delete('/{id}', [UserController::class, 'destroy']);            
});

Route::prefix('expenses')->group(function () {
    Route::get('/', [ExpenseController::class, 'index']);                   // GET all (no pagination)
    Route::get('/paginated', [ExpenseController::class, 'getAllExpenses']); // GET paginated ?limit=10
    Route::get('/search', [ExpenseController::class, 'searchExpenses']);    // GET search ?search=text&limit=10
    Route::post('/', [ExpenseController::class, 'store']);                  // POST create
    Route::get('/{id}', [ExpenseController::class, 'show']);                // GET single
    Route::put('/{id}', [ExpenseController::class, 'update']);              // PUT update
    Route::delete('/{id}', [ExpenseController::class, 'destroy']);          // DELETE
});

Route::prefix('retail-customers')->group(function () {
    Route::get('/', [RetailCustomerController::class, 'index']);                   // all (no pagination)
    Route::get('/paginated', [RetailCustomerController::class, 'getAllCustomers']); // paginated ?limit=10
    Route::get('/search', [RetailCustomerController::class, 'searchCustomers']);    // search ?search=text&limit=10
    Route::post('/', [RetailCustomerController::class, 'store']);                  // create
    Route::get('/{id}', [RetailCustomerController::class, 'show']);                // single
    Route::put('/{id}', [RetailCustomerController::class, 'update']);              // update
    Route::delete('/{id}', [RetailCustomerController::class, 'destroy']);          // delete
});

Route::prefix('sells')->group(function () {
    Route::get('/', [SellController::class, 'index']);
    Route::get('/paginated', [SellController::class, 'getAllSells']);
    Route::get('/search', [SellController::class, 'searchSells']);
    Route::post('/', [SellController::class, 'store']);
    Route::get('/{id}', [SellController::class, 'show']);
    Route::put('/{id}', [SellController::class, 'update']);
    Route::delete('/{id}', [SellController::class, 'destroy']);
});

Route::prefix('investments')->group(function () {
    Route::get('/', [InvestmentController::class, 'index']);
    Route::get('/paginated', [InvestmentController::class, 'getAllInvestments']);
    Route::get('/search', [InvestmentController::class, 'searchInvestments']);
    Route::post('/', [InvestmentController::class, 'store']);
    Route::get('/{id}', [InvestmentController::class, 'show']);
    Route::put('/{id}', [InvestmentController::class, 'update']);
    Route::delete('/{id}', [InvestmentController::class, 'destroy']);
});

Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);                    // GET all (no pagination)
    Route::get('/paginated', [ProductController::class, 'getAllProducts']); // GET paginated ?limit=10
    Route::get('/search', [ProductController::class, 'searchProducts']);    // GET search ?search=text&limit=10
    Route::post('/', [ProductController::class, 'store']);                  // POST create
    Route::get('/{id}', [ProductController::class, 'show']);                // GET single
    Route::put('/{id}', [ProductController::class, 'update']);              // PUT update
    Route::delete('/{id}', [ProductController::class, 'destroy']);          // DELETE
});


Route::prefix('stocks')->group(function () {
    Route::get('/', [StockController::class, 'index']);
    Route::get('/paginated', [StockController::class, 'getAllStocks']);
    Route::get('/search', [StockController::class, 'searchStocks']);
    Route::post('/', [StockController::class, 'store']);
    Route::get('/{id}', [StockController::class, 'show']);
    Route::put('/{id}', [StockController::class, 'update']);
    Route::delete('/{id}', [StockController::class, 'destroy']);
});

Route::prefix('stock-histories')->group(function () {
    Route::get('/', [StockHistoryController::class, 'index']);
    Route::get('/paginated', [StockHistoryController::class, 'getAllStockHistories']);
    Route::get('/search', [StockHistoryController::class, 'searchStockHistories']);
    Route::post('/', [StockHistoryController::class, 'store']);
    Route::get('/{id}', [StockHistoryController::class, 'show']);
    Route::put('/{id}', [StockHistoryController::class, 'update']);
    Route::delete('/{id}', [StockHistoryController::class, 'destroy']);
});

Route::prefix('sell-items')->group(function () {
    Route::get('/', [SellItemController::class, 'index']);
    Route::get('/paginated', [SellItemController::class, 'getAllSellItems']);
    Route::get('/search', [SellItemController::class, 'searchSellItems']);
    Route::post('/', [SellItemController::class, 'store']);
    Route::get('/{id}', [SellItemController::class, 'show']);
    Route::put('/{id}', [SellItemController::class, 'update']);
    Route::delete('/{id}', [SellItemController::class, 'destroy']);
});

Route::prefix('transactions')->group(function () {
    Route::get('/', [TransactionController::class, 'index']);
    Route::get('/paginated', [TransactionController::class, 'paginated']);
    Route::get('/search', [TransactionController::class, 'search']);
    Route::post('/', [TransactionController::class, 'store']);
    Route::get('/{id}', [TransactionController::class, 'show']);
    Route::put('/{id}', [TransactionController::class, 'update']);
    Route::delete('/{id}', [TransactionController::class, 'destroy']);
});

Route::get('dashboard', [DashboardController::class, 'index']);