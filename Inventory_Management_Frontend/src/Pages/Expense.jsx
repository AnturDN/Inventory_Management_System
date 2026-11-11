import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiSearch, FiEdit, FiTrash2, FiPlus, FiX, FiChevronLeft, FiChevronRight, FiImage } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import debounce from 'lodash/debounce';

// Data URL for a minimal broken image icon
const BROKEN_IMAGE_URL = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="2"%3E%3Crect x="3" y="3" width="18" height="18" rx="2"/%3E%3Ccircle cx="8.5" cy="8.5" r="1.5"/%3E%3Cpolyline points="21 15 16 10 5 21"/%3E%3C/svg%3E';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://192.168.0.231:8000/api/';
const API_URL = `${API_BASE_URL}expenses`;
const PAYMENT_TYPES_API_URL = `${API_BASE_URL}payment-types`;
const EXPENSE_CATEGORIES_API_URL = `${API_BASE_URL}expense-categories`;
const USERS_API_URL = `${API_BASE_URL}users`;

const Expense = () => {
  const [expenses, setExpenses] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [failedImages, setFailedImages] = useState(new Set());
  const [formData, setFormData] = useState({
    description: '',
    cost: '',
    payment_type_id: '',
    expense_category_id: '',
    user_id: '',
    status: 1,
  });

  const fetchExpenses = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = searchTerm
        ? `search?limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}&page=${currentPage}`
        : `paginated?limit=${itemsPerPage}&page=${currentPage}`;
      const url = `${API_URL}/${endpoint}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to fetch expenses: ${response.status} ${response.statusText}`;
        if (response.status === 404) {
          errorMessage = 'API endpoint not found. Please check the backend route configuration.';
        } else if (response.status === 422) {
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
      const sanitizedData = Array.isArray(data.data) ? data.data.map(expense => ({
        ...expense,
        payment_type: {
          ...expense.payment_type,
          logo: expense.payment_type?.logo && !expense.payment_type.logo.includes('via.placeholder.com') ? expense.payment_type.logo : BROKEN_IMAGE_URL,
        },
      })) : [];
      setExpenses(sanitizedData);
      setTotalPages(data.last_page || 1);
      setTotalItems(data.total || data.data.length || 0);
    } catch (err) {
      setError(`Failed to load expenses: ${err.message}. Please try again.`);
      toast.error(`Failed to load expenses: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm]);

  const fetchPaymentTypes = useCallback(async () => {
    try {
      const response = await fetch(PAYMENT_TYPES_API_URL, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to fetch payment types: ${response.status} ${response.statusText}`;
        if (response.status === 404) {
          errorMessage = 'Payment Types API endpoint not found. Please check the backend route configuration.';
        }
        throw new Error(errorMessage);
      }
      const json = await response.json();
      const paymentTypesData = Array.isArray(json) ? json : (json.status && Array.isArray(json.data) ? json.data : []);
      setPaymentTypes(paymentTypesData);
    } catch (err) {
      setError(`Failed to load payment types: ${err.message}. Please try again.`);
      toast.error(`Failed to load payment types: ${err.message}`);
    }
  }, []);

  const fetchExpenseCategories = useCallback(async () => {
    try {
      const response = await fetch(EXPENSE_CATEGORIES_API_URL, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to fetch expense categories: ${response.status} ${response.statusText}`;
        if (response.status === 404) {
          errorMessage = 'Expense Categories API endpoint not found. Please check the backend route configuration.';
        }
        throw new Error(errorMessage);
      }
      const json = await response.json();
      const expenseCategoriesData = Array.isArray(json) ? json : (json.status && Array.isArray(json.data) ? json.data : []);
      setExpenseCategories(expenseCategoriesData);
    } catch (err) {
      setError(`Failed to load expense categories: ${err.message}. Please try again.`);
      toast.error(`Failed to load expense categories: ${err.message}`);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(USERS_API_URL, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to fetch users: ${response.status} ${response.statusText}`;
        if (response.status === 404) {
          errorMessage = 'Users API endpoint not found. Please check the backend route configuration.';
        }
        throw new Error(errorMessage);
      }
      const json = await response.json();
      const usersData = Array.isArray(json) ? json : (json.status && Array.isArray(json.data) ? json.data : []);
      setUsers(usersData);
    } catch (err) {
      setError(`Failed to load users: ${err.message}. Please try again.`);
      toast.error(`Failed to load users: ${err.message}`);
    }
  }, []);

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  useEffect(() => {
    fetchExpenses();
    fetchPaymentTypes();
    fetchExpenseCategories();
    fetchUsers();
  }, [fetchExpenses, fetchPaymentTypes, fetchExpenseCategories, fetchUsers]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        setIsModalOpen(false);
        setEditingExpense(null);
        setFormData({ description: '', cost: '', payment_type_id: '', expense_category_id: '', user_id: '', status: 1 });
        setIsDeleteModalOpen(false);
        setExpenseToDelete(null);
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

  const handleImageError = useCallback((e, expenseId) => {
    if (!failedImages.has(expenseId)) {
      setFailedImages((prev) => new Set(prev).add(expenseId));
      e.target.src = BROKEN_IMAGE_URL;
    }
  }, [failedImages]);

  const handleAddOrUpdateExpense = useCallback(
    async (e) => {
      e.preventDefault();
      if (!formData.description.trim() || !formData.cost || !formData.payment_type_id || !formData.expense_category_id || !formData.user_id) {
        toast.error('Description, cost, payment type, expense category, and user are required.');
        return;
      }
      if (isNaN(formData.cost) || Number(formData.cost) <= 0) {
        toast.error('Cost must be a positive number.');
        return;
      }
      setIsSubmitting(true);
      try {
        const data = new FormData();
        data.append('description', formData.description);
        data.append('cost', formData.cost);
        data.append('payment_type_id', formData.payment_type_id);
        data.append('expense_category_id', formData.expense_category_id);
        data.append('user_id', formData.user_id);
        data.append('status', formData.status ? '1' : '0');
        if (editingExpense) {
          data.append('_method', 'PUT');
        }
        const url = editingExpense ? `${API_URL}/${editingExpense.id}` : API_URL;
        const response = await fetch(url, {
          method: 'POST',
          body: data,
        });
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = editingExpense ? `Failed to update expense: ${response.statusText}` : `Failed to add expense: ${response.statusText}`;
          if (response.status === 422) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = `Validation error: ${errorJson.errors ? Object.values(errorJson.errors).flat().join(', ') : errorJson.message}`;
            } catch (e) {
              // Non-JSON error response
            }
          } else if (response.status === 404) {
            errorMessage = 'API endpoint not found. Please check the backend route configuration.';
          }
          throw new Error(errorMessage);
        }
        const json = await response.json();
        toast.success(json.message || (editingExpense ? 'Expense updated successfully' : 'Expense created successfully'));
        await fetchExpenses();
        setIsModalOpen(false);
        setEditingExpense(null);
        setFormData({ description: '', cost: '', payment_type_id: '', expense_category_id: '', user_id: '', status: 1 });
        if (editingExpense) {
          setFailedImages((prev) => {
            const newSet = new Set(prev);
            newSet.delete(editingExpense.id);
            return newSet;
          });
        }
      } catch (err) {
        setError(`Failed to save expense: ${err.message}. Please try again.`);
        toast.error(`Failed to save expense: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingExpense, formData, fetchExpenses]
  );

  const handleDeleteExpense = useCallback(async () => {
    if (!expenseToDelete) return;
    try {
      const url = `${API_URL}/${expenseToDelete.id}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to delete expense: ${response.statusText}`;
        if (response.status === 404) {
          errorMessage = 'Expense not found or API endpoint unavailable.';
        }
        throw new Error(errorMessage);
      }
      const json = await response.json();
      toast.success(json.message || 'Expense deleted successfully');
      if (expenses.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
      await fetchExpenses();
    } catch (err) {
      setError(`Failed to delete expense: ${err.message}. Please try again.`);
      toast.error(`Failed to delete expense: ${err.message}`);
    } finally {
      setIsDeleteModalOpen(false);
      setExpenseToDelete(null);
    }
  }, [expenseToDelete, expenses.length, currentPage, fetchExpenses]);

  const handleOpenDeleteModal = useCallback((expense) => {
    setExpenseToDelete(expense);
    setIsDeleteModalOpen(true);
  }, []);

  const handleEditExpense = useCallback((expense) => {
    setEditingExpense(expense);
    setFormData({
      description: expense.description || '',
      cost: expense.cost || '',
      payment_type_id: expense.payment_type_id || '',
      expense_category_id: expense.expense_category_id || '',
      user_id: expense.user_id || '',
      status: expense.status ? 1 : 0,
    });
    setIsModalOpen(true);
    setFailedImages((prev) => {
      const newSet = new Set(prev);
      newSet.delete(expense.id);
      return newSet;
    });
  }, []);

  const toggleStatus = useCallback(
    async (id, currentStatus) => {
      try {
        const data = new FormData();
        data.append('status', currentStatus ? '0' : '1');
        data.append('_method', 'PUT');
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'POST',
          body: data,
        });
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Failed to update status: ${response.statusText}`;
          if (response.status === 404) {
            errorMessage = 'Expense not found or API endpoint unavailable.';
          }
          throw new Error(errorMessage);
        }
        const json = await response.json();
        toast.success(json.message || 'Status updated successfully');
        await fetchExpenses();
      } catch (err) {
        setError(`Failed to update status: ${err.message}. Please try again.`);
        toast.error(`Failed to update status: ${err.message}`);
      }
    },
    [fetchExpenses]
  );

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-900 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme="dark" />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Expense Management</h2>
        <button
          onClick={() => {
            setEditingExpense(null);
            setFormData({ description: '', cost: '', payment_type_id: '', expense_category_id: '', user_id: '', status: 1 });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors w-full sm:w-auto"
        >
          <FiPlus className="mr-2" /> Add New Expense
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses by description..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 placeholder-gray-400 text-sm sm:text-base"
            aria-label="Search expenses"
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
      {expenses.length === 0 ? (
        <div className="text-center text-gray-300 text-sm sm:text-base">No expenses found.</div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="block md:hidden">
              {expenses.map((expense) => (
                <motion.div
                  key={expense.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-gray-700 p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <img
                        src={failedImages.has(expense.id) ? BROKEN_IMAGE_URL : expense.payment_type?.logo || BROKEN_IMAGE_URL}
                        alt={`${expense.payment_type?.name || 'Payment Type'} logo`}
                        className="w-12 h-12 rounded-full object-cover"
                        onError={(e) => handleImageError(e, expense.id)}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-300 font-medium">{expense.description || 'Unknown'}</div>
                      <div className="text-gray-400 text-sm">ID: {expense.id}</div>
                      <div className="text-gray-400 text-sm">Cost: ${parseFloat(expense.cost).toFixed(2)}</div>
                      <div className="text-gray-400 text-sm">Payment Type: {expense.payment_type?.name || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Category: {expense.expense_category?.name || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">User: {expense.user?.name || 'N/A'}</div>
                      <div
                        className={`mt-1 px-2 py-1 rounded-full text-xs inline-block cursor-pointer ${
                          expense.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                        onClick={() => toggleStatus(expense.id, expense.status)}
                      >
                        {expense.status ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit ${expense.description}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(expense)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete ${expense.description}`}
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
                  <th className="p-4">Image</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Cost</th>
                  <th className="p-4">Payment Type</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <motion.tr
                    key={expense.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-gray-700 hover:bg-gray-700 transition-colors"
                  >
                    <td className="p-4 text-gray-300">{expense.id}</td>
                    <td className="p-4">
                      <img
                        src={failedImages.has(expense.id) ? BROKEN_IMAGE_URL : expense.payment_type?.logo || BROKEN_IMAGE_URL}
                        alt={`${expense.payment_type?.name || 'Payment Type'} logo`}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => handleImageError(e, expense.id)}
                      />
                    </td>
                    <td className="p-4 text-gray-300">{expense.description || 'Unknown'}</td>
                    <td className="p-4 text-gray-300">${parseFloat(expense.cost).toFixed(2)}</td>
                    <td className="p-4 text-gray-300">{expense.payment_type?.name || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{expense.expense_category?.name || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{expense.user?.name || 'N/A'}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs cursor-pointer ${
                          expense.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                        onClick={() => toggleStatus(expense.id, expense.status)}
                      >
                        {expense.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 flex space-x-2">
                      <button
                        onClick={() => handleEditExpense(expense)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit ${expense.description}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(expense)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete ${expense.description}`}
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
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} expenses
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
                setEditingExpense(null);
                setFormData({ description: '', cost: '', payment_type_id: '', expense_category_id: '', user_id: '', status: 1 });
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
                <h3 id="modal-title" className="text-lg sm:text-xl font-bold text-white">
                  {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingExpense(null);
                    setFormData({ description: '', cost: '', payment_type_id: '', expense_category_id: '', user_id: '', status: 1 });
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  disabled={isSubmitting}
                  aria-label="Close modal"
                >
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleAddOrUpdateExpense} className="space-y-4">
                <div>
                  <label htmlFor="expense-description" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Description
                  </label>
                  <input
                    id="expense-description"
                    placeholder='Enter description'
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    required
                    maxLength={255}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="expense-cost" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Cost
                  </label>
                  <input
                    id="expense-cost"
                    type="number"
                    placeholder='Enter cost'
                    step="0.01"
                    value={formData.cost}
                    onChange={(e) => setFormData((prev) => ({ ...prev, cost: e.target.value }))}
                    required
                    min="0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="expense-payment-type" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Payment Type
                  </label>
                  <select
                    id="expense-payment-type"
                    value={formData.payment_type_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, payment_type_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a payment type</option>
                    {paymentTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="expense-category" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Expense Category
                  </label>
                  <select
                    id="expense-category"
                    value={formData.expense_category_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expense_category_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a category</option>
                    {expenseCategories.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="expense-user" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    User
                  </label>
                  <select
                    id="expense-user"
                    value={formData.user_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, user_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="expense-status" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Status
                  </label>
                  <select
                    id="expense-status"
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: Number(e.target.value) }))}
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
                      setEditingExpense(null);
                      setFormData({ description: '', cost: '', payment_type_id: '', expense_category_id: '', user_id: '', status: 1 });
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
                    {isSubmitting ? (editingExpense ? 'Updating...' : 'Adding...') : (editingExpense ? 'Update' : 'Add')}
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
                setExpenseToDelete(null);
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
                <h3 id="delete-modal-title" className="text-lg sm:text-xl font-bold text-white">
                  Confirm Deletion
                </h3>
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setExpenseToDelete(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  aria-label="Close delete modal"
                >
                  <FiX />
                </button>
              </div>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Are you sure you want to delete the expense "{expenseToDelete?.description}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setExpenseToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteExpense}
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

export default Expense;