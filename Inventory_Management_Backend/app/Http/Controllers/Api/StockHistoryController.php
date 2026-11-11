<?php

namespace App\Http\Controllers\Api;

use App\Models\StockHistory;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Exception;

class StockHistoryController extends Controller
{
    public function index()
    {
        try {
            $histories = StockHistory::with(['stock', 'product', 'supplier', 'warehouse', 'user'])
                ->orderByDesc('id')
                ->get();

            return response()->json($histories);
        } catch (Exception $e) {
            Log::error('StockHistory@index: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching stock histories'], 500);
        }
    }

    public function getAllStockHistories(Request $request)
    {
        try {
            $validated = $request->validate(['limit' => 'integer|min:1|max:100']);
            $limit = $validated['limit'] ?? 10;

            $histories = StockHistory::with(['stock', 'product', 'supplier', 'warehouse', 'user'])
                ->select('id', 'stock_id', 'product_id', 'supplier_id', 'warehouse_id', 'user_id', 'quantity', 'buy_price', 'sell_price', 'total_amount', 'paid_amount', 'due_amount', 'status')
                ->orderByDesc('id')
                ->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Stock histories fetched successfully.',
                'data' => $histories,
            ]);
        } catch (Exception $e) {
            Log::error('StockHistory@getAllStockHistories: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching stock histories'], 500);
        }
    }

    public function searchStockHistories(Request $request)
    {
        try {
            $validated = $request->validate([
                'search' => 'nullable|string|max:255',
                'limit' => 'integer|min:1|max:100',
            ]);
            $search = $validated['search'] ?? null;
            $limit = $validated['limit'] ?? 10;

            $query = StockHistory::with(['stock', 'product', 'supplier', 'warehouse', 'user'])
                ->select('id', 'stock_id', 'product_id', 'supplier_id', 'warehouse_id', 'user_id', 'quantity', 'buy_price', 'sell_price', 'total_amount', 'paid_amount', 'due_amount', 'status')
                ->orderByDesc('id');

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('stock_id', 'like', "%$search%")
                      ->orWhere('quantity', 'like', "%$search%")
                      ->orWhereHas('product', function ($q) use ($search) {
                          $q->where('name', 'like', "%$search%");
                      })
                      ->orWhereHas('supplier', function ($q) use ($search) {
                          $q->where('name', 'like', "%$search%");
                      })
                      ->orWhereHas('warehouse', function ($q) use ($search) {
                          $q->where('name', 'like', "%$search%");
                      })
                      ->orWhereHas('user', function ($q) use ($search) {
                          $q->where('name', 'like', "%$search%");
                      });
                });
            }

            $histories = $query->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Stock histories search completed.',
                'data' => $histories,
            ]);
        } catch (Exception $e) {
            Log::error('StockHistory@searchStockHistories: ' . $e->getMessage());
            return response()->json(['message' => 'Server error during stock histories search'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'stock_id' => 'required|exists:stocks,id',
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

            $data = $request->all();

            $history = StockHistory::create($data);

            return response()->json(['message' => 'Stock history created successfully', 'data' => $history], 201);
        } catch (Exception $e) {
            Log::error('StockHistory@store: ' . $e->getMessage());
            return response()->json(['message' => 'Server error creating stock history'], 500);
        }
    }

    public function show($id)
    {
        try {
            $history = StockHistory::with(['stock', 'product', 'supplier', 'warehouse', 'user'])->find($id);
            if (!$history) return response()->json(['message' => 'Stock history not found'], 404);
            return response()->json($history);
        } catch (Exception $e) {
            Log::error('StockHistory@show: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching stock history'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $history = StockHistory::find($id);
            if (!$history) return response()->json(['message' => 'Stock history not found'], 404);

            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'stock_id' => 'sometimes|required|exists:stocks,id',
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

            $history->update($request->all());

            return response()->json(['message' => 'Stock history updated successfully', 'data' => $history]);
        } catch (Exception $e) {
            Log::error('StockHistory@update: ' . $e->getMessage());
            return response()->json(['message' => 'Server error updating stock history'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $history = StockHistory::find($id);
            if (!$history) return response()->json(['message' => 'Stock history not found'], 404);

            $history->delete();

            return response()->json(['message' => 'Stock history deleted successfully']);
        } catch (Exception $e) {
            Log::error('StockHistory@destroy: ' . $e->getMessage());
            return response()->json(['message' => 'Server error deleting stock history'], 500);
        }
    }
}