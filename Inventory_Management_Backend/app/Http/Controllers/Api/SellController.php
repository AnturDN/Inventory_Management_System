<?php

namespace App\Http\Controllers\Api;

use App\Models\Sell;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Exception;

class SellController extends Controller
{
    public function index() {
        try {
            $sells = Sell::with(['user', 'customer', 'retailCustomer'])
                ->orderByDesc('id')->get();

            return response()->json($sells);
        } catch (Exception $e) {
            Log::error('Sell@index: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching sells'], 500);
        }
    }

    public function getAllSells(Request $request) {
        try {
            $validated = $request->validate(['limit' => 'integer|min:1|max:100']);
            $limit = $validated['limit'] ?? 10;

            $sells = Sell::with(['user', 'customer', 'retailCustomer'])
                ->orderByDesc('id')->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Sells fetched successfully.',
                'data' => $sells,
            ]);
        } catch (Exception $e) {
            Log::error('Sell@getAllSells: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }

public function searchSells(Request $request)
{
    try {
        $validated = $request->validate([
            'search' => 'nullable|string|max:255',
            'limit' => 'integer|min:1|max:100',
        ]);

        $search = $validated['search'] ?? null;
        $limit = $validated['limit'] ?? 10;

        $query = Sell::with(['user', 'customer', 'retailCustomer'])->orderByDesc('id');

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('total_amount', 'like', "%$search%")
                  ->orWhere('paid_amount', 'like', "%$search%")
                  ->orWhere('net_profit', 'like', "%$search%")
                  ->orWhereHas('user', function ($sub) use ($search) {
                      $sub->where('name', 'like', "%$search%");
                  })
                  ->orWhereHas('customer', function ($sub) use ($search) {
                      $sub->where('name', 'like', "%$search%");
                  })
                  ->orWhereHas('retailCustomer', function ($sub) use ($search) {
                      $sub->where('name', 'like', "%$search%");
                  });
            });
        }

        $sells = $query->paginate($limit);

        return response()->json([
            'status' => true,
            'message' => 'Sells search completed.',
            'data' => $sells,
        ]);
    } catch (Exception $e) {
        Log::error('Sell@searchSells: ' . $e->getMessage());
        return response()->json(['message' => 'Server error'], 500);
    }
}


    public function store(Request $request) {
        try {
            $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);

            $validator = Validator::make($request->all(), [
                'total_amount' => 'required|numeric',
                'paid_amount' => 'required|numeric',
                'due_amount' => 'required|numeric',
                'total_profit' => 'required|numeric',
                'discount' => 'nullable|numeric',
                'net_profit' => 'required|numeric',
                'user_id' => 'required|exists:users,id',
                'customer_id' => 'required|exists:customers,id',
                'retail_customer_id' => 'required|exists:retail_customers,id',
                'status' => 'nullable|boolean',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            ]);

            if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

            $data = $request->except('image');

            if ($request->hasFile('image')) {
                $folder = public_path('images/sells');
                if (!File::exists($folder)) File::makeDirectory($folder, 0755, true);

                $file = $request->file('image');
                $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move($folder, $filename);
                $data['image'] = url('images/sells/' . $filename);
            }

            $sell = Sell::create($data);
            return response()->json(['message' => 'Sell created successfully', 'data' => $sell], 201);
        } catch (Exception $e) {
            Log::error('Sell@store: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    public function show($id) {
        try {
            $sell = Sell::with(['user', 'customer', 'retailCustomer'])->find($id);
            if (!$sell) return response()->json(['message' => 'Sell not found'], 404);
            return response()->json($sell);
        } catch (Exception $e) {
            Log::error('Sell@show: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    public function update(Request $request, $id) {
        try {
            $sell = Sell::find($id);
            if (!$sell) return response()->json(['message' => 'Sell not found'], 404);

            $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);

            $validator = Validator::make($request->all(), [
                'total_amount' => 'sometimes|numeric',
                'paid_amount' => 'sometimes|numeric',
                'due_amount' => 'sometimes|numeric',
                'total_profit' => 'sometimes|numeric',
                'discount' => 'nullable|numeric',
                'net_profit' => 'sometimes|numeric',
                'user_id' => 'sometimes|exists:users,id',
                'customer_id' => 'sometimes|exists:customers,id',
                'retail_customer_id' => 'sometimes|exists:retail_customers,id',
                'status' => 'nullable|boolean',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            ]);

            if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

            $data = $request->except('image');

            if ($request->hasFile('image')) {
                $folder = public_path('images/sells');
                if (!File::exists($folder)) File::makeDirectory($folder, 0755, true);

                if ($sell->image) {
                    $old = public_path(parse_url($sell->image, PHP_URL_PATH));
                    if (File::exists($old)) File::delete($old);
                }

                $file = $request->file('image');
                $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move($folder, $filename);
                $data['image'] = url('images/sells/' . $filename);
            }

            $sell->update($data);
            return response()->json(['message' => 'Sell updated successfully', 'data' => $sell]);
        } catch (Exception $e) {
            Log::error('Sell@update: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    public function destroy($id) {
        try {
            $sell = Sell::find($id);
            if (!$sell) return response()->json(['message' => 'Sell not found'], 404);

            if ($sell->image) {
                $old = public_path(parse_url($sell->image, PHP_URL_PATH));
                if (File::exists($old)) File::delete($old);
            }

            $sell->delete();
            return response()->json(['message' => 'Sell deleted successfully']);
        } catch (Exception $e) {
            Log::error('Sell@destroy: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }
}