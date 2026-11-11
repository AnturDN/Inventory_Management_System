<?php

namespace App\Http\Controllers\Api;

use App\Models\Category;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;
use Exception;

class CategoryController extends Controller
{
    public function index()
    {
        try {
            $categories = Category::select('id', 'name', 'image', 'status')
                ->orderByDesc('id')
                ->get();

            return response()->json($categories);
        } catch (Exception $e) {
            Log::error('Category@index: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Server error while fetching categories'], 500);
        }
    }

    public function getAllCategories(Request $request)
    {
        try {
            $validated = $request->validate([
                'limit' => 'integer|min:1|max:100',
            ]);

            $limit = $validated['limit'] ?? 10;

            $categories = Category::select('id', 'name', 'image', 'status')
                ->orderByDesc('id')
                ->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Categories fetched successfully.',
                'data' => $categories
            ]);
        } catch (Exception $e) {
            Log::error('Category@getAllCategories: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Server error while paginating categories'], 500);
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

            $query = Category::select('id', 'name', 'image', 'status')->orderByDesc('id');

            if (!empty($search)) {
                $query->where('name', 'like', '%' . $search . '%');
            }

            $categories = $query->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Categories search completed.',
                'data' => $categories
            ]);
        } catch (Exception $e) {
            Log::error('Category@searchCategories: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Server error while searching categories'], 500);
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
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->only(['name', 'status']);

            // Handle image upload
            if ($request->hasFile('image')) {
                $folder = public_path('images/category');
                if (!File::exists($folder)) {
                    File::makeDirectory($folder, 0755, true);
                }

                $file = $request->file('image');
                $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move($folder, $filename);

                $data['image'] = url('images/category/' . $filename);  // full URL
            }

            $category = Category::create($data);

            return response()->json(['message' => 'Category created successfully', 'data' => $category], 201);
        } catch (Exception $e) {
            Log::error('Category@store: ' . $e->getMessage(), ['payload' => $request->all(), 'exception' => $e]);
            return response()->json(['message' => 'Server error while creating category'], 500);
        }
    }

    public function show($id)
    {
        try {
            $category = Category::find($id);

            if (!$category) {
                return response()->json(['message' => 'Category not found'], 404);
            }

            return response()->json($category);
        } catch (Exception $e) {
            Log::error('Category@show: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['message' => 'Server error while fetching category'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $category = Category::find($id);

            if (!$category) {
                return response()->json(['message' => 'Category not found'], 404);
            }

            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'status' => 'sometimes|nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->only(['name', 'status']);

            // Handle image update
            if ($request->hasFile('image')) {
                $folder = public_path('images/category');
                if (!File::exists($folder)) {
                    File::makeDirectory($folder, 0755, true);
                }

                // Delete old image file if exists
                if ($category->image) {
                    $oldImagePath = public_path('images/category/' . basename($category->image));
                    if (File::exists($oldImagePath)) {
                        File::delete($oldImagePath);
                    }
                }

                $file = $request->file('image');
                $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move($folder, $filename);

                $data['image'] = url('images/category/' . $filename);
            }

            $category->update($data);

            return response()->json(['message' => 'Category updated successfully', 'data' => $category]);
        } catch (Exception $e) {
            Log::error('Category@update: ' . $e->getMessage(), ['id' => $id, 'payload' => $request->all(), 'exception' => $e]);
            return response()->json(['message' => 'Server error while updating category'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $category = Category::find($id);

            if (!$category) {
                return response()->json(['message' => 'Category not found'], 404);
            }

            // Delete image file if exists
            if ($category->image) {
                $imagePath = public_path('images/category/' . basename($category->image));
                if (File::exists($imagePath)) {
                    File::delete($imagePath);
                }
            }

            $category->delete();

            return response()->json(['message' => 'Category deleted successfully']);
        } catch (Exception $e) {
            Log::error('Category@destroy: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['message' => 'Server error while deleting category'], 500);
        }
    }
}
