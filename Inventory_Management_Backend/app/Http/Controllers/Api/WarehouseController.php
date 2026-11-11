<?php

namespace App\Http\Controllers\Api;

use App\Models\Warehouse;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Exception;

class WarehouseController extends Controller
{
    public function index()
    {
        try {
            $warehouses = Warehouse::select('id', 'name', 'address', 'status')
                ->orderByDesc('id')
                ->get();

            return response()->json($warehouses);
        } catch (Exception $e) {
            Log::error('Warehouse@index: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Server error while fetching warehouses'], 500);
        }
    }

    public function getAllWarehouses(Request $request)
    {
        try {
            $validated = $request->validate([
                'limit' => 'integer|min:1|max:100',
            ]);

            $limit = $validated['limit'] ?? 10;

            $warehouses = Warehouse::select('id', 'name', 'address', 'status')
                ->orderByDesc('id')
                ->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Warehouses fetched successfully.',
                'data' => $warehouses
            ]);
        } catch (Exception $e) {
            Log::error('Warehouse@getAllWarehouses: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Server error while paginating warehouses'], 500);
        }
    }

    public function searchWarehouses(Request $request)
    {
        try {
            $validated = $request->validate([
                'search' => 'nullable|string|max:255',
                'limit' => 'integer|min:1|max:100',
                'paginate' => 'nullable|boolean',
            ]);

            $search = $validated['search'] ?? null;
            $limit = $validated['limit'] ?? 10;
            $shouldPaginate = $validated['paginate'] ?? true;

            $query = Warehouse::select('id', 'name', 'address', 'status')
                ->orderByDesc('id');

            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%$search%")
                      ->orWhere('address', 'like', "%$search%");
                });
            }

            $warehouses = $shouldPaginate
                ? $query->paginate($limit)
                : $query->get();

            return response()->json([
                'status' => true,
                'message' => 'Warehouses search completed.',
                'data' => $warehouses
            ]);
        } catch (Exception $e) {
            Log::error('Warehouse@searchWarehouses: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Server error while searching warehouses'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'address' => 'nullable|string',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $warehouse = Warehouse::create($request->only(['name', 'address', 'status']));

            return response()->json([
                'message' => 'Warehouse created successfully',
                'data' => $warehouse
            ], 201);
        } catch (Exception $e) {
            Log::error('Warehouse@store: ' . $e->getMessage(), [
                'payload' => $request->all(),
                'exception' => $e
            ]);
            return response()->json(['message' => 'Server error while creating warehouse'], 500);
        }
    }

    public function show($id)
    {
        try {
            $warehouse = Warehouse::find($id);

            if (!$warehouse) {
                return response()->json(['message' => 'Warehouse not found'], 404);
            }

            return response()->json($warehouse);
        } catch (Exception $e) {
            Log::error('Warehouse@show: ' . $e->getMessage(), [
                'id' => $id,
                'exception' => $e
            ]);
            return response()->json(['message' => 'Server error while fetching warehouse'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $warehouse = Warehouse::find($id);

            if (!$warehouse) {
                return response()->json(['message' => 'Warehouse not found'], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'address' => 'sometimes|nullable|string',
                'status' => 'sometimes|nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $warehouse->update($request->only(['name', 'address', 'status']));

            return response()->json([
                'message' => 'Warehouse updated successfully',
                'data' => $warehouse
            ]);
        } catch (Exception $e) {
            Log::error('Warehouse@update: ' . $e->getMessage(), [
                'id' => $id,
                'payload' => $request->all(),
                'exception' => $e
            ]);
            return response()->json(['message' => 'Server error while updating warehouse'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $warehouse = Warehouse::find($id);

            if (!$warehouse) {
                return response()->json(['message' => 'Warehouse not found'], 404);
            }

            $warehouse->delete();

            return response()->json(['message' => 'Warehouse deleted successfully']);
        } catch (Exception $e) {
            Log::error('Warehouse@destroy: ' . $e->getMessage(), [
                'id' => $id,
                'exception' => $e
            ]);
            return response()->json(['message' => 'Server error while deleting warehouse'], 500);
        }
    }
}