import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiSearch, FiEdit, FiTrash2, FiPlus, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import debounce from 'lodash/debounce';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://192.168.0.231:8000/api/';

const Role = () => {
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRole, setNewRole] = useState({ role_name: '', permissions: [], status: 1 });
  const [editingRole, setEditingRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState(null);

  const availablePermissions = ['create', 'edit', 'view', 'delete', 'export', 'import'];

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = searchTerm
        ? `roles/search?search=${encodeURIComponent(searchTerm)}&limit=${itemsPerPage}&page=${currentPage}`
        : `roles/paginated?limit=${itemsPerPage}&page=${currentPage}`;
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to fetch roles: ${response.status} ${response.statusText}`;
        if (response.status === 422) {
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = `Validation error: ${errorJson.errors ? Object.values(errorJson.errors).flat().join(', ') : errorJson.message}`;
          } catch (e) {
            // Non-JSON error response
          }
        }
        throw new Error(errorMessage);
      }
      const json = await response.json();
      if (!json.status || !json.data) {
        throw new Error('Invalid response format: Missing status or data');
      }
      const { data } = json;
      setRoles(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.last_page || 1);
      setTotalItems(data.total || data.data.length || 0);
    } catch (err) {
      setError(`Failed to load roles: ${err.message}. Please try again.`);
      toast.error(`Failed to load roles: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm]);

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        setIsModalOpen(false);
        setEditingRole(null);
        setNewRole({ role_name: '', permissions: [], status: 1 });
        setIsDeleteModalOpen(false);
        setRoleToDelete(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isSubmitting]);

  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const handleItemsPerPageChange = useCallback((e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  }, []);

  const handlePermissionsChange = useCallback((permission) => {
    setNewRole((prev) => {
      const updatedPermissions = prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission];
      return { ...prev, permissions: updatedPermissions };
    });
  }, []);

  const handleAddOrUpdateRole = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newRole.role_name.trim()) {
        toast.error('Role name is required.');
        return;
      }
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('role_name', newRole.role_name);
        formData.append('permissions', newRole.permissions.join(','));
        formData.append('status', newRole.status ? '1' : '0');
        if (editingRole) {
          formData.append('_method', 'PUT');
        }
        const url = editingRole ? `${API_BASE_URL}roles/${editingRole.id}` : `${API_BASE_URL}roles`;
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = editingRole ? `Failed to update role: ${response.statusText}` : `Failed to add role: ${response.statusText}`;
          if (response.status === 422) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = `Validation error: ${errorJson.errors ? Object.values(errorJson.errors).flat().join(', ') : errorJson.message}`;
            } catch (e) {
              // Non-JSON error response
            }
          }
          throw new Error(errorMessage);
        }
        const json = await response.json();
        toast.success(json.message || (editingRole ? 'Role updated successfully' : 'Role created successfully'));
        await fetchRoles();
        setIsModalOpen(false);
        setNewRole({ role_name: '', permissions: [], status: 1 });
        setEditingRole(null);
      } catch (err) {
        setError(`Failed to save role: ${err.message}. Please try again.`);
        toast.error(`Failed to save role: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingRole, newRole, fetchRoles]
  );

  const handleDeleteRole = useCallback(async () => {
    if (!roleToDelete) return;
    try {
      const url = `${API_BASE_URL}roles/${roleToDelete.id}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete role: ${response.statusText}`);
      }
      const json = await response.json();
      toast.success(json.message || 'Role deleted successfully');
      if (roles.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
      await fetchRoles();
    } catch (err) {
      setError(`Failed to delete role: ${err.message}. Please try again.`);
      toast.error(`Failed to delete role: ${err.message}`);
    } finally {
      setIsDeleteModalOpen(false);
      setRoleToDelete(null);
    }
  }, [roleToDelete, roles.length, currentPage, fetchRoles]);

  const handleOpenDeleteModal = useCallback((role) => {
    setRoleToDelete(role);
    setIsDeleteModalOpen(true);
  }, []);

  const handleEditRole = useCallback((role) => {
    setEditingRole(role);
    setNewRole({
      role_name: role.role_name || '',
      permissions: role.permissions ? role.permissions.split(',') : [],
      status: role.status ? 1 : 0,
    });
    setIsModalOpen(true);
  }, []);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-900 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme="dark" />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Role Management</h2>
        <button
          onClick={() => {
            setEditingRole(null);
            setNewRole({ role_name: '', permissions: [], status: 1 });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors w-full sm:w-auto"
        >
          <FiPlus className="mr-2" /> Add New Role
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search roles by name..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 placeholder-gray-400 text-sm sm:text-base"
            aria-label="Search roles"
          />
        </div>
        <div className="flex items-center">
          <label className="text-gray-400 mr-2 text-sm sm:text-base">Items per page:</label>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
            aria-label="Items per page"
          >
            {[5, 10, 20, 50].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </div>
      </div>
      {error && (
        <div className="mb-4 p-4 bg-red-900/30 text-red-400 rounded-lg text-sm sm:text-base">
          {error}
        </div>
      )}
      {roles.length === 0 ? (
        <div className="text-center text-gray-300 text-sm sm:text-base">No roles found.</div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="block md:hidden">
              {roles.map((role) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-gray-700 p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="text-gray-300 font-medium">{role.role_name || 'Unknown'}</div>
                      <div className="text-gray-400 text-sm">ID: {role.id}</div>
                      <div className="text-gray-400 text-sm">Permissions: {role.permissions || 'None'}</div>
                      <div
                        className={`mt-1 px-2 py-1 rounded-full text-xs inline-block ${
                          role.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                      >
                        {role.status ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit ${role.role_name}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(role)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete ${role.role_name}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <table className="hidden md:table w-full">
              <thead>
                <tr className="bg-gray-700 text-gray-300 text-left">
                  <th className="p-4">ID</th>
                  <th className="p-4">Role Name</th>
                  <th className="p-4">Permissions</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <motion.tr
                    key={role.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-gray-700 hover:bg-gray-700 transition-colors"
                  >
                    <td className="p-4 text-gray-300">{role.id}</td>
                    <td className="p-4 text-gray-300">{role.role_name || 'Unknown'}</td>
                    <td className="p-4 text-gray-300">{role.permissions || 'None'}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          role.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                      >
                        {role.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 flex space-x-2">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit ${role.role_name}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(role)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete ${role.role_name}`}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-4">
            <p className="text-gray-400 text-sm sm:text-base">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} roles
            </p>
            <div className="flex justify-center sm:justify-end space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-50 hover:bg-gray-600"
                aria-label="Previous page"
              >
                <FiChevronLeft />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2))
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                      currentPage === page ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    aria-label={`Page ${page}`}
                  >
                    {page}
                  </button>
                ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-50 hover:bg-gray-600"
                aria-label="Next page"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </>
      )}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSubmitting) {
                setIsModalOpen(false);
                setEditingRole(null);
                setNewRole({ role_name: '', permissions: [], status: 1 });
              }
            }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="modal-title"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 id="modal-title" className="text-lg sm:text-xl font-bold text-white">
                  {editingRole ? 'Edit Role' : 'Add New Role'}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingRole(null);
                    setNewRole({ role_name: '', permissions: [], status: 1 });
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  disabled={isSubmitting}
                  aria-label="Close modal"
                >
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleAddOrUpdateRole} className="space-y-4">
                <div>
                  <label htmlFor="role-name" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Role Name
                  </label>
                  <input
                    id="role-name"
                    type="text"
                    placeholder='Enter role name'
                    value={newRole.role_name}
                    onChange={(e) => setNewRole((prev) => ({ ...prev, role_name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 text-sm sm:text-base">Permissions</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto bg-gray-700 border border-gray-600 rounded-lg p-3">
                    {availablePermissions.map((permission) => (
                      <label key={permission} className="flex items-center space-x-2 text-gray-100 text-sm sm:text-base">
                        <input
                          type="checkbox"
                          value={permission}
                          checked={newRole.permissions.includes(permission)}
                          onChange={() => handlePermissionsChange(permission)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded bg-gray-800"
                          disabled={isSubmitting}
                        />
                        <span>{permission.charAt(0).toUpperCase() + permission.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label htmlFor="role-status" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Status
                  </label>
                  <select
                    id="role-status"
                    value={newRole.status}
                    onChange={(e) => setNewRole((prev) => ({ ...prev, status: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Inactive</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingRole(null);
                      setNewRole({ role_name: '', permissions: [], status: 1 });
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-lg text-white text-sm sm:text-base ${
                      isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (editingRole ? 'Updating...' : 'Adding...') : (editingRole ? 'Update' : 'Add')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsDeleteModalOpen(false);
                setRoleToDelete(null);
              }
            }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="delete-modal-title"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 id="delete-modal-title" className="text-lg sm:text-xl font-bold text-white">
                  Confirm Deletion
                </h3>
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setRoleToDelete(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  aria-label="Close delete modal"
                >
                  <FiX />
                </button>
              </div>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Are you sure you want to delete the role "{roleToDelete?.role_name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setRoleToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRole}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm sm:text-base"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Role;