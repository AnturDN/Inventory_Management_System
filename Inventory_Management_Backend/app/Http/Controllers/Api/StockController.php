<?php
namespace App\Http\Controllers\Api;

use App\Models\Stock;
use App\Models\StockHistory;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Exception;

class StockController extends Controller
{
    public function index()
    {
        try {
            $stocks = Stock::with(['product', 'supplier', 'warehouse', 'user'])
                ->orderByDesc('id')
                ->get();

            return response()->json($stocks);
        } catch (Exception $e) {
            Log::error('Stock@index: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching stocks'], 500);
        }
    }

    public function getAllStocks(Request $request)
    {
        try {
            $validated = $request->validate(['limit' => 'integer|min:1|max:100']);
            $limit = $validated['limit'] ?? 10;

            $stocks = Stock::with(['product', 'supplier', 'warehouse', 'user'])
                ->orderByDesc('id')
                ->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Stocks fetched successfully.',
                'data' => $stocks,
            ]);
        } catch (Exception $e) {
            Log::error('Stock@getAllStocks: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching paginated stocks'], 500);
        }
    }

    public function searchStocks(Request $request)
    {
        try {
            $validated = $request->validate([
                'search' => 'nullable|string|max:255',
                'limit' => 'integer|min:1|max:100',
            ]);
            $search = $validated['search'] ?? null;
            $limit = $validated['limit'] ?? 10;

            $query = Stock::with(['product', 'supplier', 'warehouse', 'user'])
                ->orderByDesc('id');

            if ($search) {
                // Search by product name or supplier name
                $query->whereHas('product', function($q) use ($search) {
                    $q->where('name', 'like', "%$search%");
                })->orWhereHas('supplier', function($q) use ($search) {
                    $q->where('name', 'like', "%$search%");
                });
            }

            $stocks = $query->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Stocks search completed.',
                'data' => $stocks,
            ]);
        } catch (Exception $e) {
            Log::error('Stock@searchStocks: ' . $e->getMessage());
            return response()->json(['message' => 'Server error during stocks search'], 500);
        }
    }

   public function store(Request $request)
{
    try {
        if (isset($request['status'])) {
            $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
        }

        $validator = Validator::make($request->all(), [
            'product_id' => 'required|exists:products,id',
            'supplier_id' => 'required|exists:suppliers,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'user_id' => 'required|exists:users,id',
            'quantity' => 'required|integer|min:0',
            'buy_price' => 'required|numeric|min:0',
            'sell_price' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'paid_amount' => 'required|numeric|min:0',
            'due_amount' => 'required|numeric|min:0',
            'status' => 'nullable|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $stockData = $request->only([
            'product_id', 'supplier_id', 'warehouse_id', 'user_id',
            'quantity', 'buy_price', 'sell_price',
            'total_amount', 'paid_amount', 'due_amount', 'status'
        ]);

        // Create Stock
        $stock = Stock::create($stockData);

        // Create Stock History
        $stock_history = StockHistory::create([
            'stock_id'     => $stock->id,
            'product_id'   => $stock->product_id,
            'supplier_id'  => $stock->supplier_id,
            'warehouse_id' => $stock->warehouse_id,
            'user_id'      => $stock->user_id,
            'quantity'     => $stock->quantity,
            'buy_price'    => $stock->buy_price,
            'sell_price'   => $stock->sell_price,
            'total_amount' => $stock->total_amount,
            'paid_amount'  => $stock->paid_amount,
            'due_amount'   => $stock->due_amount,
            'status'       => $stock->status,
        ]);


        Log::info($request->all());



        return response()->json(['message' => 'Stock created successfully', 'data' => $stock], 201);

    } catch (Exception $e) {
        Log::error('Stock@store: ' . $e->getMessage());
        return response()->json(['message' => 'Server error creating stock'], 500);
    }
}

    public function show($id)
    {
        try {
            $stock = Stock::with(['product', 'supplier', 'warehouse', 'user'])->find($id);
            if (!$stock) return response()->json(['message' => 'Stock not found'], 404);
            return response()->json($stock);
        } catch (Exception $e) {
            Log::error('Stock@show: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching stock'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $stock = Stock::find($id);
            if (!$stock) return response()->json(['message' => 'Stock not found'], 404);

            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'product_id' => 'sometimes|required|exists:products,id',
                'supplier_id' => 'sometimes|required|exists:suppliers,id',
                'warehouse_id' => 'sometimes|required|exists:warehouses,id',
                'user_id' => 'sometimes|required|exists:users,id',
                'quantity' => 'sometimes|required|integer|min:0',
                'buy_price' => 'sometimes|required|numeric|min:0',
                'sell_price' => 'sometimes|required|numeric|min:0',
                'total_amount' => 'sometimes|required|numeric|min:0',
                'paid_amount' => 'sometimes|required|numeric|min:0',
                'due_amount' => 'sometimes|required|numeric|min:0',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $stock->update($request->all());

            return response()->json(['message' => 'Stock updated successfully', 'data' => $stock]);
        } catch (Exception $e) {
            Log::error('Stock@update: ' . $e->getMessage());
            return response()->json(['message' => 'Server error updating stock'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $stock = Stock::find($id);
            if (!$stock) return response()->json(['message' => 'Stock not found'], 404);

            $stock->delete();

            return response()->json(['message' => 'Stock deleted successfully']);
        } catch (Exception $e) {
            Log::error('Stock@destroy: ' . $e->getMessage());
            return response()->json(['message' => 'Server error deleting stock'], 500);
        }
    }
}
