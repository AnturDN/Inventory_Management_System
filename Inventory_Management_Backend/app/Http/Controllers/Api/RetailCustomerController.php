<?php

namespace App\Http\Controllers\Api;

use App\Models\RetailCustomer;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Exception;

class RetailCustomerController extends Controller
{
    private const IMAGE_FOLDER = 'images/retail_customers';

    private function ensureImageFolderExists(): string
    {
        $folder = public_path(self::IMAGE_FOLDER);
        if (!File::exists($folder)) {
            File::makeDirectory($folder, 0755, true);
        }
        return $folder;
    }

    private function uploadImage($file): string
    {
        $this->ensureImageFolderExists();
        $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
        $file->move(public_path(self::IMAGE_FOLDER), $filename);
        return url(self::IMAGE_FOLDER . '/' . $filename);
    }

    private function deleteImageIfExists($imageUrl): void
    {
        $path = public_path(self::IMAGE_FOLDER . '/' . basename($imageUrl));
        if (File::exists($path)) {
            File::delete($path);
        }
    }

    public function index()
    {
        try {
            $customers = RetailCustomer::with('user.role')->orderByDesc('id')->get();
            return response()->json($customers);
        } catch (Exception $e) {
            Log::error('RetailCustomer@index: '.$e->getMessage());
            return response()->json(['message' => 'Server error fetching retail customers'], 500);
        }
    }

    public function getAllCustomers(Request $request)
    {
        try {
            $validated = $request->validate(['limit' => 'integer|min:1|max:100']);
            $limit = $validated['limit'] ?? 10;

            $customers = RetailCustomer::with('user.role')
                ->orderByDesc('id')
                ->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Retail customers fetched successfully.',
                'data' => $customers,
            ]);
        } catch (Exception $e) {
            Log::error('RetailCustomer@getAllCustomers: '.$e->getMessage());
            return response()->json(['message' => 'Server error fetching paginated retail customers'], 500);
        }
    }

    public function searchCustomers(Request $request)
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

            $query = RetailCustomer::with('user.role')->orderByDesc('id');

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%$search%")
                      ->orWhere('email', 'like', "%$search%")
                      ->orWhere('contact', 'like', "%$search%")
                      ->orWhere('address', 'like', "%$search%");
                });
            }

            $customers = $shouldPaginate ? $query->paginate($limit) : $query->get();

            return response()->json([
                'status' => true,
                'message' => 'Retail customers search completed.',
                'data' => $customers,
            ]);
        } catch (Exception $e) {
            Log::error('RetailCustomer@searchCustomers: '.$e->getMessage());
            return response()->json(['message' => 'Server error during retail customers search'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:retail_customers,email',
                'password' => 'required|string|min:6',
                'contact' => 'nullable|string|max:20',
                'address' => 'nullable|string',
                'user_id' => 'required|exists:users,id',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->except(['image', 'password']);
            $data['password'] = Hash::make($request->password);

            if ($request->hasFile('image')) {
                $data['image'] = $this->uploadImage($request->file('image'));
            }

            $customer = RetailCustomer::create($data);

            return response()->json(['message' => 'Retail customer created successfully', 'data' => $customer], 201);
        } catch (Exception $e) {
            Log::error('RetailCustomer@store: '.$e->getMessage(), ['payload' => $request->all()]);
            return response()->json(['message' => 'Server error creating retail customer'], 500);
        }
    }

    public function show($id)
    {
        try {
            $customer = RetailCustomer::with('user.role')->find($id);

            if (!$customer) {
                return response()->json(['message' => 'Retail customer not found'], 404);
            }

            return response()->json($customer);
        } catch (Exception $e) {
            Log::error('RetailCustomer@show: '.$e->getMessage(), ['id' => $id]);
            return response()->json(['message' => 'Server error fetching retail customer'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $customer = RetailCustomer::find($id);

            if (!$customer) {
                return response()->json(['message' => 'Retail customer not found'], 404);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:retail_customers,email,'.$id,
                'password' => 'sometimes|nullable|string|min:6',
                'contact' => 'nullable|string|max:20',
                'address' => 'nullable|string',
                'user_id' => 'sometimes|required|exists:users,id',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->except(['image', 'password']);

            if ($request->filled('password')) {
                $data['password'] = Hash::make($request->password);
            }

            if ($request->hasFile('image')) {
                $this->deleteImageIfExists($customer->image);
                $data['image'] = $this->uploadImage($request->file('image'));
            }

            $customer->update($data);

            return response()->json(['message' => 'Retail customer updated successfully', 'data' => $customer]);
        } catch (Exception $e) {
            Log::error('RetailCustomer@update: '.$e->getMessage(), ['id' => $id, 'payload' => $request->all()]);
            return response()->json(['message' => 'Server error updating retail customer'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $customer = RetailCustomer::find($id);

            if (!$customer) {
                return response()->json(['message' => 'Retail customer not found'], 404);
            }

            $this->deleteImageIfExists($customer->image);
            $customer->delete();

            return response()->json(['message' => 'Retail customer deleted successfully']);
        } catch (Exception $e) {
            Log::error('RetailCustomer@destroy: '.$e->getMessage(), ['id' => $id]);
            return response()->json(['message' => 'Server error deleting retail customer'], 500);
        }
    }
}