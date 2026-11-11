<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Exception;

class UserController extends Controller
{
    public function index()
    {
        try {
            $users = User::with('role')
                ->select('id', 'name', 'email', 'gender', 'contact', 'image', 'status', 'role_id')
                ->orderByDesc('id')
                ->get();

            return response()->json($users);
        } catch (Exception $e) {
            Log::error('User@index: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching users'], 500);
        }
    }

    public function getAllUsers(Request $request)
    {
        try {
            $validated = $request->validate([
                'limit' => 'integer|min:1|max:100',
            ]);
            $limit = $validated['limit'] ?? 10;

            $users = User::with('role')
                ->select('id', 'name', 'email', 'gender', 'contact', 'image', 'status', 'role_id')
                ->orderByDesc('id')
                ->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Users fetched successfully.',
                'data' => $users,
            ]);
        } catch (Exception $e) {
            Log::error('User@getAllUsers: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching paginated users'], 500);
        }
    }

    public function searchUsers(Request $request)
    {
        try {
            $validated = $request->validate([
                'search' => 'nullable|string|max:255',
                'limit' => 'integer|min:1|max:100',
            ]);
            $search = $validated['search'] ?? null;
            $limit = $validated['limit'] ?? 10;

            $query = User::with('role')
                ->select('id', 'name', 'email', 'gender', 'contact', 'image', 'status', 'role_id')
                ->orderByDesc('id');

            if ($search) {
                $query->where('name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%')
                    ->orWhere('contact', 'like', '%' . $search . '%');
            }

            $users = $query->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Users search completed.',
                'data' => $users,
            ]);
        } catch (Exception $e) {
            Log::error('User@searchUsers: ' . $e->getMessage());
            return response()->json(['message' => 'Server error during user search'], 500);
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
                'email' => 'required|email|unique:users,email',
                'password' => 'required|string|min:6',
                'gender' => 'nullable|in:male,female,other',
                'contact' => 'nullable|string|max:20',
                'role_id' => 'required|exists:roles,id',
                'status' => 'nullable|boolean',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->except(['image']);
            $data['password'] = Hash::make($data['password']);

            if ($request->hasFile('image')) {
                $folder = public_path('images/user');
                if (!File::exists($folder)) File::makeDirectory($folder, 0755, true);

                $file = $request->file('image');
                $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move($folder, $filename);

                $data['image'] = url('images/user/' . $filename);
            }

            $user = User::create($data);

            return response()->json(['message' => 'User created successfully', 'data' => $user], 201);
        } catch (Exception $e) {
            Log::error('User@store: ' . $e->getMessage());
            return response()->json(['message' => 'Server error creating user'], 500);
        }
    }

    public function show($id)
    {
        try {
            $user = User::with('role')->find($id);
            if (!$user) {
                return response()->json(['message' => 'User not found'], 404);
            }
            return response()->json($user);
        } catch (Exception $e) {
            Log::error('User@show: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching user'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $user = User::find($id);
            if (!$user) {
                return response()->json(['message' => 'User not found'], 404);
            }

            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:users,email,' . $user->id,
                'password' => 'sometimes|nullable|string|min:6',
                'gender' => 'nullable|in:male,female,other',
                'contact' => 'nullable|string|max:20',
                'role_id' => 'nullable|exists:roles,id',
                'status' => 'nullable|boolean',
                'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $data = $request->except(['image', 'password']);

            if ($request->filled('password')) {
                $data['password'] = Hash::make($request->password);
            }

            if ($request->hasFile('image')) {
                $folder = public_path('images/user');
                if (!File::exists($folder)) File::makeDirectory($folder, 0755, true);

                // Delete old image
                if ($user->image) {
                    $oldImagePath = public_path(parse_url($user->image, PHP_URL_PATH));
                    if (File::exists($oldImagePath)) File::delete($oldImagePath);
                }

                $file = $request->file('image');
                $filename = uniqid() . '_' . time() . '.' . $file->getClientOriginalExtension();
                $file->move($folder, $filename);
                $data['image'] = url('images/user/' . $filename);
            }

            $user->update($data);

            return response()->json(['message' => 'User updated successfully', 'data' => $user]);
        } catch (Exception $e) {
            Log::error('User@update: ' . $e->getMessage());
            return response()->json(['message' => 'Server error updating user'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $user = User::find($id);
            if (!$user) {
                return response()->json(['message' => 'User not found'], 404);
            }

            // Delete image
            if ($user->image) {
                $oldImagePath = public_path(parse_url($user->image, PHP_URL_PATH));
                if (File::exists($oldImagePath)) File::delete($oldImagePath);
            }

            $user->delete();

            return response()->json(['message' => 'User deleted successfully']);
        } catch (Exception $e) {
            Log::error('User@destroy: ' . $e->getMessage());
            return response()->json(['message' => 'Server error deleting user'], 500);
        }
    }
}
