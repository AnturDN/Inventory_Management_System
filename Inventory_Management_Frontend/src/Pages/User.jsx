import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiMail,
} from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import debounce from "lodash/debounce";

const API_BASE_URL =
  import.meta.env.VITE_BASE_URL || "http://192.168.0.103:8000/api/";
const API_URL = `${API_BASE_URL}users`;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role_id: "", // Changed from role to role_id
    status: 1,
  });

  // Role options
  const roleOptions = [
    { id: 1, name: "User" },
    { id: 2, name: "Admin" },
    { id: 3, name: "Manager" },
  ];

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = searchTerm
        ? `search?limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}&page=${currentPage}`
        : `paginated?limit=${itemsPerPage}&page=${currentPage}`;
      const url = `${API_URL}/${endpoint}`;
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.statusText}`);
      }
      const json = await response.json();
      if (!json.status || !json.data) {
        throw new Error("Invalid response format");
      }
      const { data } = json;
      setUsers(data.data || []);
      setTotalPages(data.last_page || 1);
      setTotalItems(data.total || 0);
    } catch (err) {
      setError(`Failed to load users: ${err.message}`);
      toast.error(`Failed to load users: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm]);

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 300),
    [],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && !isSubmitting) {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData({
          name: "",
          email: "",
          password: "",
          role_id: "",
          status: 1,
        });
        setIsDeleteModalOpen(false);
        setUserToDelete(null);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isSubmitting]);

  const handlePageChange = useCallback(
    (page) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages],
  );

  const handleItemsPerPageChange = useCallback((e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  }, []);

  // Add or Update User
  const handleAddOrUpdateUser = useCallback(
    async (e) => {
      e.preventDefault();

      // Validation
      if (
        !formData.name.trim() ||
        !formData.email.trim() ||
        (!editingUser && !formData.password)
      ) {
        toast.error("Name, email, and password are required.");
        return;
      }
      if (!formData.email.includes("@")) {
        toast.error("Please enter a valid email address.");
        return;
      }
      if (!formData.role_id) {
        toast.error("Please select a role.");
        return;
      }

      setIsSubmitting(true);
      try {
        const data = new FormData();
        data.append("name", formData.name);
        data.append("email", formData.email);
        if (formData.password) {
          data.append("password", formData.password);
        }
        data.append("role_id", formData.role_id); // Changed from role to role_id
        data.append("status", formData.status ? "1" : "0");

        if (editingUser) {
          data.append("_method", "PUT");
        }

        const url = editingUser ? `${API_URL}/${editingUser.id}` : API_URL;
        const response = await fetch(url, {
          method: "POST",
          body: data,
        });

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = editingUser
            ? "Failed to update user"
            : "Failed to add user";
          if (response.status === 422) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = `Validation error: ${errorJson.errors ? Object.values(errorJson.errors).flat().join(", ") : errorJson.message}`;
            } catch (e) {}
          }
          throw new Error(errorMessage);
        }

        const json = await response.json();
        toast.success(
          json.message ||
            (editingUser
              ? "User updated successfully"
              : "User created successfully"),
        );
        await fetchUsers();
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData({
          name: "",
          email: "",
          password: "",
          role_id: "",
          status: 1,
        });
      } catch (err) {
        setError(`Failed to save user: ${err.message}`);
        toast.error(`Failed to save user: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingUser, formData, fetchUsers],
  );

  // Delete User
  const handleDeleteUser = useCallback(async () => {
    if (!userToDelete) return;
    try {
      const response = await fetch(`${API_URL}/${userToDelete.id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete user: ${response.statusText}`);
      }
      const json = await response.json();
      toast.success(json.message || "User deleted successfully");
      if (users.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
      await fetchUsers();
    } catch (err) {
      setError(`Failed to delete user: ${err.message}`);
      toast.error(`Failed to delete user: ${err.message}`);
    } finally {
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  }, [userToDelete, users.length, currentPage, fetchUsers]);

  const handleOpenDeleteModal = useCallback((user) => {
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  }, []);

  const handleEditUser = useCallback((user) => {
    setEditingUser(user);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      password: "",
      role_id: user.role_id || "",
      status: user.status ? 1 : 0,
    });
    setIsModalOpen(true);
  }, []);

  const toggleStatus = useCallback(
    async (id, currentStatus) => {
      try {
        const data = new FormData();
        data.append("status", currentStatus ? "0" : "1");
        data.append("_method", "PUT");
        const response = await fetch(`${API_URL}/${id}`, {
          method: "POST",
          body: data,
        });
        if (!response.ok) {
          throw new Error(`Failed to update status: ${response.statusText}`);
        }
        const json = await response.json();
        toast.success(json.message || "Status updated successfully");
        await fetchUsers();
      } catch (err) {
        setError(`Failed to update status: ${err.message}`);
        toast.error(`Failed to update status: ${err.message}`);
      }
    },
    [fetchUsers],
  );

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-900 min-h-screen">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
          User Management
        </h2>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({
              name: "",
              email: "",
              password: "",
              role_id: "",
              status: 1,
            });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors w-full sm:w-auto"
        >
          <FiPlus className="mr-2" /> Add New User
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 placeholder-gray-400 text-sm sm:text-base"
            aria-label="Search users"
          />
        </div>
        <div className="flex items-center">
          <label className="text-gray-400 mr-2 text-sm sm:text-base">
            Items per page:
          </label>
          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
            aria-label="Items per page"
          >
            {[5, 10, 20, 50].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/30 text-red-400 rounded-lg text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Users Table */}
      {isLoading ? (
        <div className="text-center text-gray-300 text-sm sm:text-base">
          Loading...
        </div>
      ) : users.length === 0 ? (
        <div className="text-center text-gray-300 text-sm sm:text-base">
          No users found.
        </div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            {/* Mobile View */}
            <div className="block md:hidden">
              {users.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-gray-700 p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
                        <FiUser className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-300 font-medium">
                        {user.name || "Unknown"}
                      </div>
                      <div className="text-gray-400 text-sm flex items-center gap-1">
                        <FiMail size={12} /> {user.email || "N/A"}
                      </div>
                      <div className="text-gray-400 text-sm">
                        Role:{" "}
                        <span className="capitalize">
                          {user.role?.role_name ||
                            user.role?.name ||
                            user.role ||
                            "N/A"}
                        </span>
                      </div>
                      <div
                        className={`mt-1 px-2 py-1 rounded-full text-xs inline-block cursor-pointer ${
                          user.status
                            ? "bg-green-900/30 text-green-400"
                            : "bg-red-900/30 text-red-400"
                        }`}
                        onClick={() => toggleStatus(user.id, user.status)}
                      >
                        {user.status ? "Active" : "Inactive"}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit ${user.name}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(user)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete ${user.name}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Desktop Table View */}
            <table className="hidden md:table w-full">
              <thead>
                <tr className="bg-gray-700 text-gray-300 text-left">
                  <th className="p-4">ID</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-gray-700 hover:bg-gray-700 transition-colors"
                  >
                    <td className="p-4 text-gray-300">{user.id}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center">
                          <FiUser className="text-white text-sm" />
                        </div>
                        <span className="text-gray-300">
                          {user.name || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">{user.email || "N/A"}</td>
                    <td className="p-4 text-gray-300 capitalize">
                      {user.role?.role_name ||
                        user.role?.name ||
                        user.role ||
                        "N/A"}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs cursor-pointer ${
                          user.status
                            ? "bg-green-900/30 text-green-400"
                            : "bg-red-900/30 text-red-400"
                        }`}
                        onClick={() => toggleStatus(user.id, user.status)}
                      >
                        {user.status ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-4 flex space-x-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit ${user.name}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(user)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete ${user.name}`}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-4">
            <p className="text-gray-400 text-sm sm:text-base">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}{" "}
              users
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
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2),
                )
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                      currentPage === page
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
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

      {/* Add/Edit User Modal */}
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
                setEditingUser(null);
                setFormData({
                  name: "",
                  email: "",
                  password: "",
                  role_id: "",
                  status: 1,
                });
              }
            }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="modal-title"
            >
              <div className="flex justify-between items-center mb-4">
                <h3
                  id="modal-title"
                  className="text-lg sm:text-xl font-bold text-white"
                >
                  {editingUser ? "Edit User" : "Add New User"}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingUser(null);
                    setFormData({
                      name: "",
                      email: "",
                      password: "",
                      role_id: "",
                      status: 1,
                    });
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  disabled={isSubmitting}
                  aria-label="Close modal"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={handleAddOrUpdateUser} className="space-y-4">
                <div>
                  <label
                    htmlFor="user-name"
                    className="block text-gray-300 mb-1 text-sm sm:text-base"
                  >
                    Name
                  </label>
                  <input
                    id="user-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                    placeholder="Enter full name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="user-email"
                    className="block text-gray-300 mb-1 text-sm sm:text-base"
                  >
                    Email
                  </label>
                  <input
                    id="user-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                    placeholder="Enter email address"
                  />
                </div>

                <div>
                  <label
                    htmlFor="user-password"
                    className="block text-gray-300 mb-1 text-sm sm:text-base"
                  >
                    {editingUser
                      ? "Password (leave blank to keep current)"
                      : "Password"}
                  </label>
                  <input
                    id="user-password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    required={!editingUser}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                    placeholder="Enter password"
                  />
                </div>

                <div>
                  <label
                    htmlFor="user-role"
                    className="block text-gray-300 mb-1 text-sm sm:text-base"
                  >
                    Role
                  </label>
                  <select
                    id="user-role"
                    value={formData.role_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        role_id: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a role</option>
                    {roleOptions.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="user-status"
                    className="block text-gray-300 mb-1 text-sm sm:text-base"
                  >
                    Status
                  </label>
                  <select
                    id="user-status"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: Number(e.target.value),
                      }))
                    }
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
                      setEditingUser(null);
                      setFormData({
                        name: "",
                        email: "",
                        password: "",
                        role_id: "",
                        status: 1,
                      });
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-lg text-white text-sm sm:text-base ${
                      isSubmitting
                        ? "bg-indigo-400 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? editingUser
                        ? "Updating..."
                        : "Adding..."
                      : editingUser
                        ? "Update"
                        : "Add"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
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
                setUserToDelete(null);
              }
            }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-xs sm:max-w-sm"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="delete-modal-title"
            >
              <div className="flex justify-between items-center mb-4">
                <h3
                  id="delete-modal-title"
                  className="text-lg sm:text-xl font-bold text-white"
                >
                  Confirm Deletion
                </h3>
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setUserToDelete(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  aria-label="Close delete modal"
                >
                  <FiX />
                </button>
              </div>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Are you sure you want to delete the user "{userToDelete?.name}"?
                This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setUserToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
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

export default UserManagement;
