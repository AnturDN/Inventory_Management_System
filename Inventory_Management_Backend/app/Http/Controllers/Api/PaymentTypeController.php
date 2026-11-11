<?php

namespace App\Http\Controllers\Api;

use App\Models\PaymentType;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;
use Exception;

class PaymentTypeController extends Controller
{
    public function index()
    {
        try {
            $paymentTypes = PaymentType::select('id', 'name', 'type', 'logo', 'status')
                ->orderByDesc('id')
                ->get();

            return response()->json($paymentTypes);
        } catch (Exception $e) {
            Log::error('PaymentType@index: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching payment types'], 500);
        }
    }

    public function getAllPaymentTypes(Request $request)
    {
        try {
            $validated = $request->validate([
                'limit' => 'integer|min:1|max:100',
            ]);
            $limit = $validated['limit'] ?? 10;

            $paymentTypes = PaymentType::select('id', 'name', 'type', 'logo', 'status')
                ->orderByDesc('id')
                ->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Payment types fetched successfully.',
                'data' => $paymentTypes,
            ]);
        } catch (Exception $e) {
            Log::error('PaymentType@getAllPaymentTypes: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching paginated payment types'], 500);
        }
    }

    public function searchPaymentTypes(Request $request)
    {
        try {
            $validated = $request->validate([
                'search' => 'nullable|string|max:255',
                'limit' => 'integer|min:1|max:100',
            ]);

            $search = $validated['search'] ?? null;
            $limit = $validated['limit'] ?? 10;

            $query = PaymentType::select('id', 'name', 'type', 'logo', 'status')
                ->orderByDesc('id');

            if ($search) {
                $query->where('name', 'like', '%' . $search . '%')
                      ->orWhere('type', 'like', '%' . $search . '%');
            }

            $paymentTypes = $query->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Payment types search completed.',
                'data' => $paymentTypes,
            ]);
        } catch (Exception $e) {
            Log::error('PaymentType@searchPaymentTypes: ' . $e->getMessage());
            return response()->json(['message' => 'Server error during payment types search'], 500);
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
                'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->only(['name', 'type', 'status']);

            // Handle image upload
            if ($request->hasFile('logo')) {
                $folder = public_path('images/payment_type');
                if (!File::exists($folder)) {
                    File::makeDirectory($folder, 0755, true);
                }

                $file = $request->file('logo');
                $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move($folder, $filename);

                // Save full URL for image
                $data['logo'] = url('images/payment_type/' . $filename);
            }

            $paymentType = PaymentType::create($data);

            return response()->json(['message' => 'Payment type created successfully', 'data' => $paymentType], 201);
        } catch (Exception $e) {
            Log::error('PaymentType@store: ' . $e->getMessage());
            return response()->json(['message' => 'Server error creating payment type'], 500);
        }
    }

    public function show($id)
    {
        try {
            $paymentType = PaymentType::find($id);

            if (!$paymentType) {
                return response()->json(['message' => 'Payment type not found'], 404);
            }

            return response()->json($paymentType);
        } catch (Exception $e) {
            Log::error('PaymentType@show: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching payment type'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $paymentType = PaymentType::find($id);

            if (!$paymentType) {
                return response()->json(['message' => 'Payment type not found'], 404);
            }

            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'type' => 'sometimes|required|string|max:255',
                'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'status' => 'sometimes|nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->only(['name', 'type', 'status']);

            // Handle image upload
            if ($request->hasFile('logo')) {
                $folder = public_path('images/payment_type');
                if (!File::exists($folder)) {
                    File::makeDirectory($folder, 0755, true);
                }

                // Delete old logo file if exists
                if ($paymentType->logo) {
                    $oldImagePath = public_path(parse_url($paymentType->logo, PHP_URL_PATH));
                    if (File::exists($oldImagePath)) {
                        File::delete($oldImagePath);
                    }
                }

                $file = $request->file('logo');
                $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move($folder, $filename);

                $data['logo'] = url('images/payment_type/' . $filename);
            }

            $paymentType->update($data);

            return response()->json(['message' => 'Payment type updated successfully', 'data' => $paymentType]);
        } catch (Exception $e) {
            Log::error('PaymentType@update: ' . $e->getMessage());
            return response()->json(['message' => 'Server error updating payment type'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $paymentType = PaymentType::find($id);

            if (!$paymentType) {
                return response()->json(['message' => 'Payment type not found'], 404);
            }

            // Delete logo file
            if ($paymentType->logo) {
                $oldImagePath = public_path(parse_url($paymentType->logo, PHP_URL_PATH));
                if (File::exists($oldImagePath)) {
                    File::delete($oldImagePath);
                }
            }

            $paymentType->delete();

            return response()->json(['message' => 'Payment type deleted successfully']);
        } catch (Exception $e) {
            Log::error('PaymentType@destroy: ' . $e->getMessage());
            return response()->json(['message' => 'Server error deleting payment type'], 500);
        }
    }
}
