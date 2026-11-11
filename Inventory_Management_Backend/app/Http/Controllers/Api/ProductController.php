<?php

namespace App\Http\Controllers\Api;

use App\Models\Product;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Exception;

class ProductController extends Controller
{
    private const IMAGE_FOLDER = 'images/products';

    private function ensureImageFolderExists()
    {
        $folder = public_path(self::IMAGE_FOLDER);
        if (!File::exists($folder)) {
            File::makeDirectory($folder, 0755, true);
        }
        return $folder;
    }

    private function uploadImage($file)
    {
        $this->ensureImageFolderExists();
        $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
        $file->move(public_path(self::IMAGE_FOLDER), $filename);
        return url(self::IMAGE_FOLDER . '/' . $filename);
    }

    private function deleteImageIfExists($imageUrl)
    {
        if (!$imageUrl) return;

        $path = public_path(self::IMAGE_FOLDER . '/' . basename($imageUrl));
        if (File::exists($path)) {
            File::delete($path);
        }
    }

    public function index()
    {
        try {
            $products = Product::with(['category', 'brand', 'user.role','stocks'])
                ->orderByDesc('id')
                ->get();

            return response()->json($products);
        } catch (Exception $e) {
            Log::error('Product@index: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Server error fetching products'], 500);
        }
    }

    public function getAllProducts(Request $request)
    {
        try {
            $validated = $request->validate([
                'limit' => 'integer|min:1|max:100'
            ]);
            $limit = $validated['limit'] ?? 10;

            $products = Product::with(['category', 'brand', 'user.role','stocks'])
                ->select('id', 'name', 'description', 'quantity', 'image', 'status', 'category_id', 'brand_id', 'user_id')
                ->orderByDesc('id')
                ->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Products fetched successfully.',
                'data' => $products,
            ]);
        } catch (Exception $e) {
            Log::error('Product@getAllProducts: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Server error fetching paginated products'], 500);
        }
    }

    public function searchProducts(Request $request)
    {
        try {
            $validated = $request->validate([
                'search' => 'nullable|string|max:255',
                'limit' => 'integer|min:1|max:100',
            ]);

            $search = $validated['search'] ?? null;
            $limit = $validated['limit'] ?? 10;

            $query = Product::with(['category', 'brand', 'user.role'])
                ->select('id', 'name', 'description', 'quantity', 'image', 'status', 'category_id', 'brand_id', 'user_id')
                ->orderByDesc('id');

            if ($search) {
                $query->where('name', 'like', "%$search%")
                      ->orWhere('description', 'like', "%$search%");
            }

            $products = $query->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Product search completed.',
                'data' => $products,
            ]);
        } catch (Exception $e) {
            Log::error('Product@searchProducts: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Server error during product search'], 500);
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
                'description' => 'nullable|string',
                'quantity' => 'required|integer|min:0',
                'category_id' => 'required|exists:categories,id',
                'brand_id' => 'required|exists:brands,id',
                'user_id' => 'required|exists:users,id',
                'status' => 'nullable|boolean',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->except(['image']);

            if ($request->hasFile('image')) {
                $data['image'] = $this->uploadImage($request->file('image'));
            }

            $product = Product::create($data);

            return response()->json(['message' => 'Product created successfully', 'data' => $product], 201);
        } catch (Exception $e) {
            Log::error('Product@store: ' . $e->getMessage(), ['payload' => $request->all(), 'exception' => $e]);
            return response()->json(['message' => 'Server error creating product'], 500);
        }
    }

    public function show($id)
    {
        try {
            $product = Product::with(['category', 'brand', 'user.role'])->find($id);

            if (!$product) {
                return response()->json(['message' => 'Product not found'], 404);
            }

            return response()->json($product);
        } catch (Exception $e) {
            Log::error('Product@show: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['message' => 'Server error fetching product'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $product = Product::find($id);

            if (!$product) {
                return response()->json(['message' => 'Product not found'], 404);
            }

            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'quantity' => 'sometimes|required|integer|min:0',
                'category_id' => 'sometimes|required|exists:categories,id',
                'brand_id' => 'sometimes|required|exists:brands,id',
                'user_id' => 'sometimes|required|exists:users,id',
                'status' => 'nullable|boolean',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->except(['image']);

            if ($request->hasFile('image')) {
                $this->deleteImageIfExists($product->image);
                $data['image'] = $this->uploadImage($request->file('image'));
            }

            $product->update($data);

            return response()->json(['message' => 'Product updated successfully', 'data' => $product]);
        } catch (Exception $e) {
            Log::error('Product@update: ' . $e->getMessage(), ['id' => $id, 'payload' => $request->all(), 'exception' => $e]);
            return response()->json(['message' => 'Server error updating product'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $product = Product::find($id);

            if (!$product) {
                return response()->json(['message' => 'Product not found'], 404);
            }

            $this->deleteImageIfExists($product->image);

            $product->delete();

            return response()->json(['message' => 'Product deleted successfully']);
        } catch (Exception $e) {
            Log::error('Product@destroy: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['message' => 'Server error deleting product'], 500);
        }
    }
}
