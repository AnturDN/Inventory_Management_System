<?php

// app/Http/Controllers/Api/TransactionController.php

namespace App\Http\Controllers\Api;

use App\Models\Transaction;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Exception;

class TransactionController extends Controller
{
    public function index()
    {
        try {
            $transactions = Transaction::with(['stock', 'expense', 'paymentType', 'user'])
                ->orderByDesc('id')
                ->get();

            return response()->json($transactions);
        } catch (Exception $e) {
            Log::error('Transaction@index: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching transactions'], 500);
        }
    }

    public function paginated(Request $request)
    {
        try {
            $validated = $request->validate([
                'limit' => 'integer|min:1|max:100',
            ]);
            $limit = $validated['limit'] ?? 10;

            $transactions = Transaction::with(['stock', 'expense', 'paymentType', 'user'])
                ->orderByDesc('id')
                ->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Transactions fetched successfully.',
                'data' => $transactions,
            ]);
        } catch (Exception $e) {
            Log::error('Transaction@paginated: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching paginated transactions'], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $validated = $request->validate([
                'search' => 'nullable|string|max:255',
                'limit' => 'integer|min:1|max:100',
            ]);
            $search = $validated['search'] ?? null;
            $limit = $validated['limit'] ?? 10;

            $query = Transaction::with(['stock', 'expense', 'paymentType', 'user'])->orderByDesc('id');

            if ($search) {
                $query->where('type', 'like', "%$search%")
                      ->orWhere('others', 'like', "%$search%")
                      ->orWhere('comments', 'like', "%$search%");
            }

            $transactions = $query->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Transactions search completed.',
                'data' => $transactions,
            ]);
        } catch (Exception $e) {
            Log::error('Transaction@search: ' . $e->getMessage());
            return response()->json(['message' => 'Server error searching transactions'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'type' => 'required|string|max:100',
                'stock_id' => 'nullable|exists:stocks,id',
                'expense_id' => 'nullable|exists:expenses,id',
                'payment_type_id' => 'nullable|exists:payment_types,id',
                'others' => 'nullable|string',
                'comments' => 'nullable|string',
                'amount' => 'required|numeric|min:0',
                'user_id' => 'required|exists:users,id',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $transaction = Transaction::create($request->all());

            return response()->json(['message' => 'Transaction created successfully', 'data' => $transaction], 201);
        } catch (Exception $e) {
            Log::error('Transaction@store: ' . $e->getMessage());
            return response()->json(['message' => 'Server error creating transaction'], 500);
        }
    }

    public function show($id)
    {
        try {
            $transaction = Transaction::with(['stock', 'expense', 'paymentType', 'user'])->find($id);
            if (!$transaction) {
                return response()->json(['message' => 'Transaction not found'], 404);
            }

            return response()->json($transaction);
        } catch (Exception $e) {
            Log::error('Transaction@show: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching transaction'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $transaction = Transaction::find($id);
            if (!$transaction) {
                return response()->json(['message' => 'Transaction not found'], 404);
            }

            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'type' => 'sometimes|required|string|max:100',
                'stock_id' => 'nullable|exists:stocks,id',
                'expense_id' => 'nullable|exists:expenses,id',
                'payment_type_id' => 'nullable|exists:payment_types,id',
                'others' => 'nullable|string',
                'comments' => 'nullable|string',
                'amount' => 'sometimes|required|numeric|min:0',
                'user_id' => 'sometimes|required|exists:users,id',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $transaction->update($request->all());

            return response()->json(['message' => 'Transaction updated successfully', 'data' => $transaction]);
        } catch (Exception $e) {
            Log::error('Transaction@update: ' . $e->getMessage());
            return response()->json(['message' => 'Server error updating transaction'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $transaction = Transaction::find($id);
            if (!$transaction) {
                return response()->json(['message' => 'Transaction not found'], 404);
            }

            $transaction->delete();

            return response()->json(['message' => 'Transaction deleted successfully']);
        } catch (Exception $e) {
            Log::error('Transaction@destroy: ' . $e->getMessage());
            return response()->json(['message' => 'Server error deleting transaction'], 500);
        }
    }
}
