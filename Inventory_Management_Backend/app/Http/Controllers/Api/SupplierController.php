<?php

namespace App\Http\Controllers\Api;

use App\Models\Supplier;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;
use Exception;

class SupplierController extends Controller
{
    public function index()
    {
        try {
            $suppliers = Supplier::select('id', 'name', 'shop_name', 'address', 'contact', 'email', 'image', 'status')
                ->orderByDesc('id')
                ->get();

            return response()->json($suppliers);
        } catch (Exception $e) {
            Log::error('Supplier@index: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Server error while fetching suppliers'], 500);
        }
    }

    public function getAllSuppliers(Request $request)
    {
        try {
            $validated = $request->validate([
                'limit' => 'integer|min:1|max:100',
            ]);
            $limit = $validated['limit'] ?? 10;

            $suppliers = Supplier::select('id', 'name', 'shop_name', 'address', 'contact', 'email', 'image', 'status')
                ->orderByDesc('id')
                ->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Suppliers fetched successfully.',
                'data' => $suppliers
            ]);
        } catch (Exception $e) {
            Log::error('Supplier@getAllSuppliers: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Server error while paginating suppliers'], 500);
        }
    }

    public function searchSuppliers(Request $request)
    {
        try {
            $validated = $request->validate([
                'search' => 'nullable|string|max:255',
                'limit' => 'integer|min:1|max:100',
            ]);

            $search = $validated['search'] ?? null;
            $limit = $validated['limit'] ?? 10;

            $query = Supplier::select('id', 'name', 'shop_name', 'address', 'contact', 'email', 'image', 'status')
                ->orderByDesc('id');

            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('shop_name', 'like', '%' . $search . '%')
                      ->orWhere('contact', 'like', '%' . $search . '%');
                });
            }

            $suppliers = $query->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Suppliers search completed.',
                'data' => $suppliers
            ]);
        } catch (Exception $e) {
            Log::error('Supplier@searchSuppliers: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Server error while searching suppliers'], 500);
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
                'shop_name' => 'required|string|max:255',
                'address' => 'nullable|string|max:500',
                'contact' => 'nullable|string|max:20',
                'email' => 'nullable|email|unique:suppliers,email',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->only(['name', 'shop_name', 'address', 'contact', 'email', 'status']);

            // Image upload handling
            if ($request->hasFile('image')) {
                $folder = public_path('images/supply');
                if (!File::exists($folder)) {
                    File::makeDirectory($folder, 0755, true);
                }

                $file = $request->file('image');
                $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move($folder, $filename);

                $data['image'] = url('images/supply/' . $filename);
            }

            $supplier = Supplier::create($data);

            return response()->json(['message' => 'Supplier created successfully', 'data' => $supplier], 201);
        } catch (Exception $e) {
            Log::error('Supplier@store: ' . $e->getMessage(), ['payload' => $request->all(), 'exception' => $e]);
            return response()->json(['message' => 'Server error while creating supplier'], 500);
        }
    }

    public function show($id)
    {
        try {
            $supplier = Supplier::find($id);
            if (!$supplier) {
                return response()->json(['message' => 'Supplier not found'], 404);
            }
            return response()->json($supplier);
        } catch (Exception $e) {
            Log::error('Supplier@show: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['message' => 'Server error while fetching supplier'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $supplier = Supplier::find($id);
            if (!$supplier) {
                return response()->json(['message' => 'Supplier not found'], 404);
            }

            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'shop_name' => 'sometimes|required|string|max:255',
                'address' => 'nullable|string|max:500',
                'contact' => 'nullable|string|max:20',
                'email' => 'nullable|email|unique:suppliers,email,' . $supplier->id,
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->only(['name', 'shop_name', 'address', 'contact', 'email', 'status']);

            // Handle image update
            if ($request->hasFile('image')) {
                $folder = public_path('images/supply');
                if (!File::exists($folder)) {
                    File::makeDirectory($folder, 0755, true);
                }

                // Delete old image if exists
                if ($supplier->image) {
                    $oldImagePath = public_path('images/supply/' . basename($supplier->image));
                    if (File::exists($oldImagePath)) {
                        File::delete($oldImagePath);
                    }
                }

                $file = $request->file('image');
                $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move($folder, $filename);

                $data['image'] = url('images/supply/' . $filename);
            }

            $supplier->update($data);

            return response()->json(['message' => 'Supplier updated successfully', 'data' => $supplier]);
        } catch (Exception $e) {
            Log::error('Supplier@update: ' . $e->getMessage(), ['id' => $id, 'payload' => $request->all(), 'exception' => $e]);
            return response()->json(['message' => 'Server error while updating supplier'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $supplier = Supplier::find($id);
            if (!$supplier) {
                return response()->json(['message' => 'Supplier not found'], 404);
            }

            // Delete image file if exists
            if ($supplier->image) {
                $imagePath = public_path('images/supply/' . basename($supplier->image));
                if (File::exists($imagePath)) {
                    File::delete($imagePath);
                }
            }

            $supplier->delete();

            return response()->json(['message' => 'Supplier deleted successfully']);
        } catch (Exception $e) {
            Log::error('Supplier@destroy: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['message' => 'Server error while deleting supplier'], 500);
        }
    }
}
