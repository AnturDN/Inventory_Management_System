<?php

namespace App\Http\Controllers\Api;

use App\Models\Brand;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\File;
use Exception;

class BrandController extends Controller
{
    private const IMAGE_FOLDER = 'images/brands';

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
        $path = public_path(self::IMAGE_FOLDER . '/' . basename($imageUrl));
        if (File::exists($path)) {
            File::delete($path);
        }
    }

    public function index()
    {
        try {
            $brands = Brand::select('id', 'name', 'logo', 'status')
                ->orderByDesc('id')
                ->get();

            return response()->json($brands);
        } catch (Exception $e) {
            Log::error('Brand@index: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Server error while fetching brands'], 500);
        }
    }

    public function getAllBrands(Request $request)
    {
        try {
            $validated = $request->validate([
                'limit' => 'integer|min:1|max:100',
            ]);

            $limit = $validated['limit'] ?? 10;

            $brands = Brand::select('id', 'name', 'logo', 'status')
                ->orderByDesc('id')
                ->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Brands fetched successfully.',
                'data' => $brands
            ]);
        } catch (Exception $e) {
            Log::error('Brand@getAllBrands: ' . $e->getMessage(), ['exception' => $e]);
            return response()->json(['message' => 'Server error while paginating brands'], 500);
        }
    }

    // public function searchBrands(Request $request)
    // {
    //     try {
    //         $validated = $request->validate([
    //             'search' => 'nullable|string|max:255',
    //             'limit' => 'integer|min:1|max:100',
    //         ]);

    //         $search = $validated['search'] ?? null;
    //         $limit = $validated['limit'] ?? 10;

    //         $query = Brand::select('id', 'name', 'logo', 'status')->orderByDesc('id');

    //         if (!empty($search)) {
    //             $query->where('name', 'like', '%' . $search . '%');
    //         }

    //         $brands = $query->paginate($limit);

    //         return response()->json([
    //             'status' => true,
    //             'message' => 'Brands search completed.',
    //             'data' => $brands
    //         ]);
    //     } catch (Exception $e) {
    //         Log::error('Brand@searchBrands: ' . $e->getMessage(), ['exception' => $e]);
    //         return response()->json(['message' => 'Server error while searching brands'], 500);
    //     }
    // }
    public function searchBrands(Request $request)
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

        $query = Brand::select('id', 'name', 'logo', 'status')
            ->orderByDesc('id');

        if (!empty($search)) {
            $query->where('name', 'like', '%' . $search . '%');
        }

        $brands = $shouldPaginate
            ? $query->paginate($limit)
            : $query->get();

        return response()->json([
            'status' => true,
            'message' => 'Brands search completed.',
            'data' => $brands
        ]);
    } catch (Exception $e) {
        Log::error('Brand@searchBrands: ' . $e->getMessage(), ['exception' => $e]);
        return response()->json(['message' => 'Server error while searching brands'], 500);
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
                'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->only(['name', 'status']);

            if ($request->hasFile('logo')) {
                $data['logo'] = $this->uploadImage($request->file('logo'));
            }

            $brand = Brand::create($data);

            return response()->json(['message' => 'Brand created successfully', 'data' => $brand], 201);
        } catch (Exception $e) {
            Log::error('Brand@store: ' . $e->getMessage(), ['payload' => $request->all(), 'exception' => $e]);
            return response()->json(['message' => 'Server error while creating brand'], 500);
        }
    }

    public function show($id)
    {
        try {
            $brand = Brand::find($id);

            if (!$brand) {
                return response()->json(['message' => 'Brand not found'], 404);
            }

            return response()->json($brand);
        } catch (Exception $e) {
            Log::error('Brand@show: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['message' => 'Server error while fetching brand'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $brand = Brand::find($id);

            if (!$brand) {
                return response()->json(['message' => 'Brand not found'], 404);
            }

            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
                'status' => 'sometimes|nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->only(['name', 'status']);

            if ($request->hasFile('logo')) {
                $this->deleteImageIfExists($brand->logo);
                $data['logo'] = $this->uploadImage($request->file('logo'));
            }

            $brand->update($data);

            return response()->json(['message' => 'Brand updated successfully', 'data' => $brand]);
        } catch (Exception $e) {
            Log::error('Brand@update: ' . $e->getMessage(), ['id' => $id, 'payload' => $request->all(), 'exception' => $e]);
            return response()->json(['message' => 'Server error while updating brand'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $brand = Brand::find($id);

            if (!$brand) {
                return response()->json(['message' => 'Brand not found'], 404);
            }

            $this->deleteImageIfExists($brand->logo);

            $brand->delete();

            return response()->json(['message' => 'Brand deleted successfully']);
        } catch (Exception $e) {
            Log::error('Brand@destroy: ' . $e->getMessage(), ['id' => $id, 'exception' => $e]);
            return response()->json(['message' => 'Server error while deleting brand'], 500);
        }
    }
}
