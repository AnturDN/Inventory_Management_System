<?php

namespace App\Http\Controllers\Api;

use App\Models\Investment;
use App\Models\Transaction;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Exception;

class InvestmentController extends Controller
{
    public function index()
    {
        try {
            $investments = Investment::with(['user', 'paymentType'])->orderByDesc('id')->get();
            return response()->json($investments);
        } catch (Exception $e) {
            Log::error('Investment@index: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching investments'], 500);
        }
    }

    public function getAllInvestments(Request $request)
    {
        try {
            $validated = $request->validate([
                'limit' => 'integer|min:1|max:100'
            ]);
            $limit = $validated['limit'] ?? 10;

            $investments = Investment::with(['user', 'paymentType'])
                ->orderByDesc('id')
                ->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Investments fetched successfully',
                'data' => $investments
            ]);
        } catch (Exception $e) {
            Log::error('Investment@getAll: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    public function searchInvestments(Request $request)
    {
        try {
            $validated = $request->validate([
                'search' => 'nullable|string|max:255',
                'limit' => 'integer|min:1|max:100'
            ]);
            $search = $validated['search'] ?? null;
            $limit = $validated['limit'] ?? 10;

            $query = Investment::with(['user', 'paymentType'])->orderByDesc('id');

            if ($search) {
                $query->where('name', 'like', "%$search%")
                      ->orWhere('amount', 'like', "%$search%")
                      ->orWhere('description', 'like', "%$search%");
            }

            $results = $query->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Investments search completed',
                'data' => $results
            ]);
        } catch (Exception $e) {
            Log::error('Investment@search: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'payment_type_id' => 'required|exists:payment_types,id',
                'amount' => 'required|numeric',
                'description' => 'nullable|string',
                'user_id' => 'required|exists:users,id',
                'status' => 'nullable|boolean',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'deed_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            ]);

            if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

            $data = $request->except(['image', 'deed_image']);

            if ($request->hasFile('image')) {
                $data['image'] = $this->saveImage($request->file('image'), 'images/investments');
            }

            if ($request->hasFile('deed_image')) {
                $data['deed_image'] = $this->saveImage($request->file('deed_image'), 'images/investments/deed_image');
            }

            $investment = Investment::create($data);

            Log::info($investment);



            //  $trans = [
            //     'type' => 'In',
            //     'investment_id' => $investment->id,
            //     'payment_type_id' => $investment->payment_type_id,
            //     'others' => 'nullable|string',
            //     'comments' => 'Invested For Business',
            //     'amount' => $investment->amount,
            //     'user_id' => $investment->user_id,
            //     'status' => '1',
            // ];

            // $transaction = Transaction::create($trans);







            return response()->json(['message' => 'Investment created', 'data' => $investment], 201);
        } catch (Exception $e) {
            Log::error('Investment@store: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    public function show($id)
    {
        try {
            $investment = Investment::with(['user', 'paymentType'])->find($id);
            if (!$investment) return response()->json(['message' => 'Not found'], 404);
            return response()->json($investment);
        } catch (Exception $e) {
            Log::error('Investment@show: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $investment = Investment::find($id);
            if (!$investment) return response()->json(['message' => 'Not found'], 404);

            $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|string|max:255',
                'payment_type_id' => 'sometimes|exists:payment_types,id',
                'amount' => 'sometimes|numeric',
                'description' => 'nullable|string',
                'user_id' => 'sometimes|exists:users,id',
                'status' => 'nullable|boolean',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'deed_image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            ]);

            if ($validator->fails()) return response()->json(['errors' => $validator->errors()], 422);

            $data = $request->except(['image', 'deed_image']);

            if ($request->hasFile('image')) {
                if ($investment->image) $this->deleteImage($investment->image);
                $data['image'] = $this->saveImage($request->file('image'), 'images/investments');
            }

            if ($request->hasFile('deed_image')) {
                if ($investment->deed_image) $this->deleteImage($investment->deed_image);
                $data['deed_image'] = $this->saveImage($request->file('deed_image'), 'images/investments/deed_image');
            }

            $investment->update($data);
            return response()->json(['message' => 'Investment updated', 'data' => $investment]);
        } catch (Exception $e) {
            Log::error('Investment@update: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $investment = Investment::find($id);
            if (!$investment) return response()->json(['message' => 'Not found'], 404);

            if ($investment->image) $this->deleteImage($investment->image);
            if ($investment->deed_image) $this->deleteImage($investment->deed_image);

            $investment->delete();
            return response()->json(['message' => 'Investment deleted']);
        } catch (Exception $e) {
            Log::error('Investment@destroy: ' . $e->getMessage());
            return response()->json(['message' => 'Server error'], 500);
        }
    }

    private function saveImage($file, $folder)
    {
        $path = public_path($folder);
        if (!File::exists($path)) File::makeDirectory($path, 0755, true);
        $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
        $file->move($path, $filename);
        return url($folder . '/' . $filename);
    }

    private function deleteImage($imageUrl)
    {
        $path = public_path(parse_url($imageUrl, PHP_URL_PATH));
        if (File::exists($path)) File::delete($path);
    }
}
