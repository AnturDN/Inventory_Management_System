<?php

namespace App\Http\Controllers\Api;

use App\Models\Role;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Exception;

class RoleController extends Controller
{
    public function index()
    {
        try {
            $roles = Role::select('id', 'role_name', 'permissions', 'status')
                ->orderByDesc('id')
                ->get();

            return response()->json($roles);
        } catch (Exception $e) {
            Log::error('Role@index: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching roles'], 500);
        }
    }

    public function getAllRoles(Request $request)
    {
        try {
            $validated = $request->validate([
                'limit' => 'integer|min:1|max:100',
            ]);
            $limit = $validated['limit'] ?? 10;

            $roles = Role::select('id', 'role_name', 'permissions', 'status')
                ->orderByDesc('id')
                ->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Roles fetched successfully.',
                'data' => $roles,
            ]);
        } catch (Exception $e) {
            Log::error('Role@getAllRoles: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching paginated roles'], 500);
        }
    }

    public function searchRoles(Request $request)
    {
        try {
            $validated = $request->validate([
                'search' => 'nullable|string|max:255',
                'limit' => 'integer|min:1|max:100',
            ]);

            $search = $validated['search'] ?? null;
            $limit = $validated['limit'] ?? 10;

            $query = Role::select('id', 'role_name', 'permissions', 'status')
                ->orderByDesc('id');

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('role_name', 'like', '%' . $search . '%')
                      ->orWhere('permissions', 'like', '%' . $search . '%');
                });
            }

            $roles = $query->paginate($limit);

            return response()->json([
                'status' => true,
                'message' => 'Role search completed.',
                'data' => $roles,
            ]);
        } catch (Exception $e) {
            Log::error('Role@searchRoles: ' . $e->getMessage());
            return response()->json(['message' => 'Server error during role search'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'role_name' => 'required|string|max:255',
                'permissions' => 'required|string',
                'status' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $role = Role::create($request->only(['role_name', 'permissions', 'status']));

            return response()->json(['message' => 'Role created successfully', 'data' => $role], 201);
        } catch (Exception $e) {
            Log::error('Role@store: ' . $e->getMessage());
            return response()->json(['message' => 'Server error creating role'], 500);
        }
    }

    public function show($id)
    {
        try {
            $role = Role::find($id);
            if (!$role) {
                return response()->json(['message' => 'Role not found'], 404);
            }
            return response()->json($role);
        } catch (Exception $e) {
            Log::error('Role@show: ' . $e->getMessage());
            return response()->json(['message' => 'Server error fetching role'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $role = Role::find($id);
            if (!$role) {
                return response()->json(['message' => 'Role not found'], 404);
            }

            if (isset($request['status'])) {
                $request['status'] = filter_var($request['status'], FILTER_VALIDATE_BOOLEAN);
            }

            $validator = Validator::make($request->all(), [
                'role_name' => 'sometimes|required|string|max:255',
                'permissions' => 'sometimes|required|string',
                'status' => 'sometimes|nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json(['errors' => $validator->errors()], 422);
            }

            $role->update($request->only(['role_name', 'permissions', 'status']));

            return response()->json(['message' => 'Role updated successfully', 'data' => $role]);
        } catch (Exception $e) {
            Log::error('Role@update: ' . $e->getMessage());
            return response()->json(['message' => 'Server error updating role'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $role = Role::find($id);
            if (!$role) {
                return response()->json(['message' => 'Role not found'], 404);
            }

            $role->delete();

            return response()->json(['message' => 'Role deleted successfully']);
        } catch (Exception $e) {
            Log::error('Role@destroy: ' . $e->getMessage());
            return response()->json(['message' => 'Server error deleting role'], 500);
        }
    }
}
