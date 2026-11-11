<?php

namespace App\Http\Controllers\Api;

use App\Models\Expense;
use App\Models\Transaction;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Exception;

class ExpenseController extends Controller
{
    public function index()
    {
        try {
            $expenses = Expense::with(['paymentType', 'expenseCategory', 'user'])
                ->orderByDesc('id')
                ->get();

            return response()->json($expenses);
        } catch (Exception $e) {
            Log::error('Expense@index: '.$e->getMessage());
            return response()->json(['message' => 'Server error fetching expenses'], 500);
        }
    }

    public function getAllExpenses(Request $request)
    {
        try {
            $validated = $request->validate([
                'limit' => 'integer|min:1|max:100',
            ]);
            $limit = $validated['limit'] ?? 10;

            $expenses = Expense::with(['paymentType', 'expenseCategory', 'user'])
                ->orderByDesc('id')
                ->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Expenses fetched successfully.',
                'data' => $expenses,
            ]);
        } catch (Exception $e) {
            Log::error('Expense@getAllExpenses: '.$e->getMessage());
            return response()->json(['message' => 'Server error fetching paginated expenses'], 500);
        }
    }

    public function searchExpenses(Request $request)
    {
        try {
            $validated = $request->validate([
                'search' => 'nullable|string|max:255',
                'limit' => 'integer|min:1|max:100',
            ]);
            $search = $validated['search'] ?? null;
            $limit = $validated['limit'] ?? 10;

            $query = Expense::with(['paymentType', 'expenseCategory', 'user'])
                ->orderByDesc('id');

            if ($search) {
                $query->where('description', 'like', '%' . $search . '%');
            }

            $expenses = $query->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Expenses search completed.',
                'data' => $expenses,
            ]);
        } catch (Exception $e) {
            Log::error('Expense@searchExpenses: '.$e->getMessage());
            return response()->json(['message' => 'Server error during expenses search'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'description' => 'required|string',
                'cost' => 'required|numeric|min:0',
                'payment_type_id' => 'required|exists:payment_types,id',
                'expense_category_id' => 'required|exists:expense_categories,id',
                'user_id' => 'required|exists:users,id',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $expense = Expense::create($request->only([
                'description',
                'cost',
                'payment_type_id',
                'expense_category_id',
                'user_id',
                'status',
            ]));

            $trans = [
                'type' => 'Out',
                'expense_id' => $expense->id,
                'payment_type_id' => $expense->payment_type_id,
                'others' => 'nullable|string',
                'comments' => 'Expenses',
                'amount' => $expense->cost,
                'user_id' => $expense->user_id,
                'status' => '1',
            ];

            $transaction = Transaction::create($trans);

            return response()->json(['message' => 'Expense created successfully', 'data' => $expense], 201);
        } catch (Exception $e) {
            Log::error('Expense@store: '.$e->getMessage());
            return response()->json(['message' => 'Server error creating expense'], 500);
        }
    }

    public function show($id)
    {
        try {
            $expense = Expense::with(['paymentType', 'expenseCategory', 'user'])->find($id);

            if (!$expense) {
                return response()->json(['message' => 'Expense not found'], 404);
            }

            return response()->json($expense);
        } catch (Exception $e) {
            Log::error('Expense@show: '.$e->getMessage());
            return response()->json(['message' => 'Server error fetching expense'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $expense = Expense::find($id);

            if (!$expense) {
                return response()->json(['message' => 'Expense not found'], 404);
            }

            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'description' => 'sometimes|required|string',
                'cost' => 'sometimes|required|numeric|min:0',
                'payment_type_id' => 'sometimes|required|exists:payment_types,id',
                'expense_category_id' => 'sometimes|required|exists:expense_categories,id',
                'user_id' => 'sometimes|required|exists:users,id',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $expense->update($request->only([
                'description',
                'cost',
                'payment_type_id',
                'expense_category_id',
                'user_id',
                'status',
            ]));

            return response()->json(['message' => 'Expense updated successfully', 'data' => $expense]);
        } catch (Exception $e) {
            Log::error('Expense@update: '.$e->getMessage());
            return response()->json(['message' => 'Server error updating expense'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $expense = Expense::find($id);

            if (!$expense) {
                return response()->json(['message' => 'Expense not found'], 404);
            }

            $expense->delete();

            return response()->json(['message' => 'Expense deleted successfully']);
        } catch (Exception $e) {
            Log::error('Expense@destroy: '.$e->getMessage());
            return response()->json(['message' => 'Server error deleting expense'], 500);
        }
    }
}
