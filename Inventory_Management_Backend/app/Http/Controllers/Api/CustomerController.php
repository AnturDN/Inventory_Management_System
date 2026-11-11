<?php

namespace App\Http\Controllers\Api;

use App\Models\Customer;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Exception;

class CustomerController extends Controller
{
    public function index()
    {
        try {
            $customers = Customer::select('id', 'name', 'email', 'contact', 'image', 'status')
                ->orderByDesc('id')
                ->get();

            return response()->json($customers);
        } catch (Exception $e) {
            Log::error('Customer@index: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching customers'], 500);
        }
    }

    public function getAllCustomers(Request $request)
    {
        try {
            $limit = $request->get('limit', 10);

            $customers = Customer::select('id', 'name', 'email', 'contact', 'image', 'status')
                ->orderByDesc('id')
                ->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Customers fetched successfully.',
                'data' => $customers,
            ]);
        } catch (Exception $e) {
            Log::error('Customer@getAllCustomers: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching paginated customers'], 500);
        }
    }

    public function searchCustomers(Request $request)
    {
        try {
            $search = $request->get('search', null);
            $limit = $request->get('limit', 10);

            $query = Customer::select('id', 'name', 'email', 'contact', 'image', 'status')
                ->orderByDesc('id');

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                        ->orWhere('email', 'like', '%' . $search . '%')
                        ->orWhere('contact', 'like', '%' . $search . '%');
                });
            }

            $customers = $query->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Customer search completed.',
                'data' => $customers,
            ]);
        } catch (Exception $e) {
            Log::error('Customer@searchCustomers: ' . $e->getMessage());
            return response()->json(['message' => 'Server error during customer search'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $request->merge([
                'status' => $request->has('status') ? filter_var($request->status, FILTER_VALIDATE_BOOLEAN) : true
            ]);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:customers,email',
                'password' => 'nullable|string|min:6',
                'contact' => 'nullable|string|max:20',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->except(['image']);

            if (!empty($data['password'])) {
                $data['password'] = Hash::make($data['password']);
            } else {
                unset($data['password']);
            }

            if ($request->hasFile('image')) {
                $folder = public_path('images/customer');
                if (!File::exists($folder)) File::makeDirectory($folder, 0755, true);

                $file = $request->file('image');
                $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move($folder, $filename);

                $data['image'] = url('images/customer/' . $filename);
            }

            $customer = Customer::create($data);

            return response()->json(['message' => 'Customer created successfully', 'data' => $customer], 201);
        } catch (Exception $e) {
            Log::error('Customer@store: ' . $e->getMessage());
            return response()->json(['message' => 'Server error creating customer'], 500);
        }
    }

    public function show($id)
    {
        try {
            $customer = Customer::select('id', 'name', 'email', 'contact', 'image', 'status')->find($id);
            if (!$customer) {
                return response()->json(['message' => 'Customer not found'], 404);
            }

            return response()->json($customer);
        } catch (Exception $e) {
            Log::error('Customer@show: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching customer'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $customer = Customer::find($id);
            if (!$customer) {
                return response()->json(['message' => 'Customer not found'], 404);
            }

            if ($request->has('status')) {
                $request->merge(['status' => filter_var($request->status, FILTER_VALIDATE_BOOLEAN)]);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:customers,email,' . $customer->id,
                'password' => 'nullable|string|min:6',
                'contact' => 'nullable|string|max:20',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->except(['image', 'password']);

            if (!empty($request->password)) {
                $data['password'] = Hash::make($request->password);
            }

            if ($request->hasFile('image')) {
                $folder = public_path('images/customer');
                if (!File::exists($folder)) File::makeDirectory($folder, 0755, true);

                if ($customer->image) {
                    $oldImage = public_path('images/customer/' . basename($customer->image));
                    if (File::exists($oldImage)) File::delete($oldImage);
                }

                $file = $request->file('image');
                $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move($folder, $filename);

                $data['image'] = url('images/customer/' . $filename);
            }

            $customer->update($data);

            return response()->json(['message' => 'Customer updated successfully', 'data' => $customer]);
        } catch (Exception $e) {
            Log::error('Customer@update: ' . $e->getMessage());
            return response()->json(['message' => 'Server error updating customer'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $customer = Customer::find($id);
            if (!$customer) {
                return response()->json(['message' => 'Customer not found'], 404);
            }

            if ($customer->image) {
                $imagePath = public_path('images/customer/' . basename($customer->image));
                if (File::exists($imagePath)) File::delete($imagePath);
            }

            $customer->delete();

            return response()->json(['message' => 'Customer deleted successfully']);
        } catch (Exception $e) {
            Log::error('Customer@destroy: ' . $e->getMessage());
            return response()->json(['message' => 'Server error deleting customer'], 500);
        }
    }
}
