<?php

namespace App\Http\Controllers\Api;

use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Exception;

class ExpenseCategoryController extends Controller
{
    public function index()
    {
        try {
            $categories = ExpenseCategory::select('id', 'name', 'type', 'status')
                ->orderByDesc('id')
                ->get();

            return response()->json($categories);
        } catch (Exception $e) {
            Log::error('ExpenseCategory@index: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching expense categories'], 500);
        }
    }

    public function getAllCategories(Request $request)
    {
        try {
            $validated = $request->validate([
                'limit' => 'integer|min:1|max:100',
            ]);
            $limit = $validated['limit'] ?? 10;

            $categories = ExpenseCategory::select('id', 'name', 'type', 'status')
                ->orderByDesc('id')
                ->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Expense categories fetched successfully.',
                'data' => $categories,
            ]);
        } catch (Exception $e) {
            Log::error('ExpenseCategory@getAllCategories: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching paginated expense categories'], 500);
        }
    }

    public function searchCategories(Request $request)
    {
        try {
            $validated = $request->validate([
                'search' => 'nullable|string|max:255',
                'limit' => 'integer|min:1|max:100',
            ]);

            $search = $validated['search'] ?? null;
            $limit = $validated['limit'] ?? 10;

            $query = ExpenseCategory::select('id', 'name', 'type', 'status')
                ->orderByDesc('id');

            if ($search) {
                $query->where('name', 'like', '%' . $search . '%')
                      ->orWhere('type', 'like', '%' . $search . '%');
            }

            $categories = $query->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Expense category search completed.',
                'data' => $categories,
            ]);
        } catch (Exception $e) {
            Log::error('ExpenseCategory@searchCategories: ' . $e->getMessage());
            return response()->json(['message' => 'Server error during expense category search'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'type' => 'required|string|max:255',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $category = ExpenseCategory::create($request->only(['name', 'type', 'status']));

            return response()->json(['message' => 'Expense category created successfully', 'data' => $category], 201);
        } catch (Exception $e) {
            Log::error('ExpenseCategory@store: ' . $e->getMessage());
            return response()->json(['message' => 'Server error creating expense category'], 500);
        }
    }

    public function show($id)
    {
        try {
            $category = ExpenseCategory::find($id);
            if (!$category) {
                return response()->json(['message' => 'Expense category not found'], 404);
            }
            return response()->json($category);
        } catch (Exception $e) {
            Log::error('ExpenseCategory@show: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching expense category'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $category = ExpenseCategory::find($id);
            if (!$category) {
                return response()->json(['message' => 'Expense category not found'], 404);
            }

            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'type' => 'sometimes|required|string|max:255',
                'status' => 'sometimes|nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $category->update($request->only(['name', 'type', 'status']));

            return response()->json(['message' => 'Expense category updated successfully', 'data' => $category]);
        } catch (Exception $e) {
            Log::error('ExpenseCategory@update: ' . $e->getMessage());
            return response()->json(['message' => 'Server error updating expense category'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $category = ExpenseCategory::find($id);
            if (!$category) {
                return response()->json(['message' => 'Expense category not found'], 404);
            }

            $category->delete();

            return response()->json(['message' => 'Expense category deleted successfully']);
        } catch (Exception $e) {
            Log::error('ExpenseCategory@destroy: ' . $e->getMessage());
            return response()->json(['message' => 'Server error deleting expense category'], 500);
        }
    }
}
