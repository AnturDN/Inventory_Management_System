<?php
namespace App\Http\Controllers\Api;

use App\Models\SellItem;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Exception;

class SellItemController extends Controller
{
    public function index()
    {
        try {
            $items = SellItem::with(['sell', 'product', 'stock'])
                ->orderByDesc('id')
                ->get();

            return response()->json($items);
        } catch (Exception $e) {
            Log::error('SellItem@index: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching sell items'], 500);
        }
    }

    public function getAllSellItems(Request $request)
    {
        try {
            $validated = $request->validate(['limit' => 'integer|min:1|max:100']);
            $limit = $validated['limit'] ?? 10;

            $items = SellItem::with(['sell', 'product', 'stock'])
                ->orderByDesc('id')
                ->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Sell items fetched successfully.',
                'data' => $items,
            ]);
        } catch (Exception $e) {
            Log::error('SellItem@getAllSellItems: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching paginated sell items'], 500);
        }
    }

    public function searchSellItems(Request $request)
    {
        try {
            $validated = $request->validate([
                'search' => 'nullable|string|max:255',
                'limit' => 'integer|min:1|max:100',
            ]);
            $search = $validated['search'] ?? null;
            $limit = $validated['limit'] ?? 10;

            $query = SellItem::with(['sell', 'product', 'stock'])
                ->orderByDesc('id');

            if ($search) {
                // Search by related sell's id or product's name
                $query->where('id', $search) // Search by sell_item id directly
                    ->orWhereHas('product', function($q) use ($search) {
                        $q->where('name', 'like', "%$search%");
                    })
                    ->orWhereHas('sell', function($q) use ($search) {
                        $q->where('id', $search);
                    });
            }

            $items = $query->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Sell items search completed.',
                'data' => $items,
            ]);
        } catch (Exception $e) {
            Log::error('SellItem@searchSellItems: ' . $e->getMessage());
            return response()->json(['message' => 'Server error during sell items search'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'sell_id' => 'required|exists:sells,id',
                'product_id' => 'required|exists:products,id',
                'stock_id' => 'required|exists:stocks,id',
                'quantity' => 'required|integer|min:1',
                'selling_price' => 'required|numeric|min:0',
                'total' => 'required|numeric|min:0',
                'profit' => 'required|numeric|min:0',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $item = SellItem::create($request->all());

            return response()->json(['message' => 'Sell item created successfully', 'data' => $item], 201);
        } catch (Exception $e) {
            Log::error('SellItem@store: ' . $e->getMessage());
            return response()->json(['message' => 'Server error creating sell item'], 500);
        }
    }

    public function show($id)
    {
        try {
            $item = SellItem::with(['sell', 'product', 'stock'])->find($id);
            if (!$item) return response()->json(['message' => 'Sell item not found'], 404);
            return response()->json($item);
        } catch (Exception $e) {
            Log::error('SellItem@show: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching sell item'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $item = SellItem::find($id);
            if (!$item) return response()->json(['message' => 'Sell item not found'], 404);

            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'sell_id' => 'sometimes|required|exists:sells,id',
                'product_id' => 'sometimes|required|exists:products,id',
                'stock_id' => 'sometimes|required|exists:stocks,id',
                'quantity' => 'sometimes|required|integer|min:1',
                'selling_price' => 'sometimes|required|numeric|min:0',
                'total' => 'sometimes|required|numeric|min:0',
                'profit' => 'sometimes|required|numeric|min:0',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $item->update($request->all());

            return response()->json(['message' => 'Sell item updated successfully', 'data' => $item]);
        } catch (Exception $e) {
            Log::error('SellItem@update: ' . $e->getMessage());
            return response()->json(['message' => 'Server error updating sell item'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $item = SellItem::find($id);
            if (!$item) return response()->json(['message' => 'Sell item not found'], 404);

            $item->delete();

            return response()->json(['message' => 'Sell item deleted successfully']);
        } catch (Exception $e) {
            Log::error('SellItem@destroy: ' . $e->getMessage());
            return response()->json(['message' => 'Server error deleting sell item'], 500);
        }
    }
}
