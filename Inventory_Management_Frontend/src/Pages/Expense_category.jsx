import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiSearch, FiEdit, FiTrash2, FiPlus, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import debounce from 'lodash/debounce';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://192.168.0.231:8000/api/';

const ExpenseCategory = () => {
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpenseCategory, setNewExpenseCategory] = useState({ name: '', type: '', status: 1 });
  const [editingExpenseCategory, setEditingExpenseCategory] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [expenseCategoryToDelete, setExpenseCategoryToDelete] = useState(null);

  const fetchExpenseCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = searchTerm
        ? `expense-categories/search?search=${encodeURIComponent(searchTerm)}&limit=${itemsPerPage}&page=${currentPage}`
        : `expense-categories/paginated?limit=${itemsPerPage}&page=${currentPage}`;
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to fetch expense categories: ${response.status} ${response.statusText}`;
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
      setExpenseCategories(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.last_page || 1);
      setTotalItems(data.total || data.data.length || 0);
    } catch (err) {
      setError(`Failed to load expense categories: ${err.message}. Please try again.`);
      toast.error(`Failed to load expense categories: ${err.message}`);
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
    fetchExpenseCategories();
  }, [fetchExpenseCategories]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        setIsModalOpen(false);
        setEditingExpenseCategory(null);
        setNewExpenseCategory({ name: '', type: '', status: 1 });
        setIsDeleteModalOpen(false);
        setExpenseCategoryToDelete(null);
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

  const handleAddOrUpdateExpenseCategory = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newExpenseCategory.name.trim() || !newExpenseCategory.type.trim()) {
        toast.error('Expense category name and type are required.');
        return;
      }
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('name', newExpenseCategory.name);
        formData.append('type', newExpenseCategory.type);
        formData.append('status', newExpenseCategory.status ? '1' : '0');
        if (editingExpenseCategory) {
          formData.append('_method', 'PUT');
        }
        const url = editingExpenseCategory
          ? `${API_BASE_URL}expense-categories/${editingExpenseCategory.id}`
          : `${API_BASE_URL}expense-categories`;
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = editingExpenseCategory
            ? `Failed to update expense category: ${response.statusText}`
            : `Failed to add expense category: ${response.statusText}`;
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
        toast.success(json.message || (editingExpenseCategory ? 'Expense category updated successfully' : 'Expense category created successfully'));
        await fetchExpenseCategories();
        setIsModalOpen(false);
        setNewExpenseCategory({ name: '', type: '', status: 1 });
        setEditingExpenseCategory(null);
      } catch (err) {
        setError(`Failed to save expense category: ${err.message}. Please try again.`);
        toast.error(`Failed to save expense category: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingExpenseCategory, newExpenseCategory, fetchExpenseCategories]
  );

  const handleDeleteExpenseCategory = useCallback(async () => {
    if (!expenseCategoryToDelete) return;
    try {
      const url = `${API_BASE_URL}expense-categories/${expenseCategoryToDelete.id}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete expense category: ${response.statusText}`);
      }
      const json = await response.json();
      toast.success(json.message || 'Expense category deleted successfully');
      if (expenseCategories.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
      await fetchExpenseCategories();
    } catch (err) {
      setError(`Failed to delete expense category: ${err.message}. Please try again.`);
      toast.error(`Failed to delete expense category: ${err.message}`);
    } finally {
      setIsDeleteModalOpen(false);
      setExpenseCategoryToDelete(null);
    }
  }, [expenseCategoryToDelete, expenseCategories.length, currentPage, fetchExpenseCategories]);

  const handleOpenDeleteModal = useCallback((expenseCategory) => {
    setExpenseCategoryToDelete(expenseCategory);
    setIsDeleteModalOpen(true);
  }, []);

  const handleEditExpenseCategory = useCallback((expenseCategory) => {
    setEditingExpenseCategory(expenseCategory);
    setNewExpenseCategory({
      name: expenseCategory.name || '',
      type: expenseCategory.type || '',
      status: expenseCategory.status ? 1 : 0,
    });
    setIsModalOpen(true);
  }, []);

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  const expenseCategoryTypes = ['Fixed Cost', 'Running Cost', 'Variable Cost', 'Others Cost'];

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-900 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme="dark" />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Expense Category Management</h2>
        <button
          onClick={() => {
            setEditingExpenseCategory(null);
            setNewExpenseCategory({ name: '', type: '', status: 1 });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors w-full sm:w-auto"
        >
          <FiPlus className="mr-2" /> Add New Expense Category
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search expense categories by name..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 placeholder-gray-400 text-sm sm:text-base"
            aria-label="Search expense categories"
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
      {expenseCategories.length === 0 ? (
        <div className="text-center text-gray-300 text-sm sm:text-base">No expense categories found.</div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="block md:hidden">
              {expenseCategories.map((expenseCategory) => (
                <motion.div
                  key={expenseCategory.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-gray-700 p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="text-gray-300 font-medium">{expenseCategory.name || 'Unknown'}</div>
                      <div className="text-gray-400 text-sm">ID: {expenseCategory.id}</div>
                      <div className="text-gray-400 text-sm">Type: {expenseCategory.type || 'N/A'}</div>
                      <div
                        className={`mt-1 px-2 py-1 rounded-full text-xs inline-block ${
                          expenseCategory.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                      >
                        {expenseCategory.status ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditExpenseCategory(expenseCategory)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit ${expenseCategory.name}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(expenseCategory)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete ${expenseCategory.name}`}
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
                  <th className="p-4">Name</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenseCategories.map((expenseCategory) => (
                  <motion.tr
                    key={expenseCategory.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-gray-700 hover:bg-gray-700 transition-colors"
                  >
                    <td className="p-4 text-gray-300">{expenseCategory.id}</td>
                    <td className="p-4 text-gray-300">{expenseCategory.name || 'Unknown'}</td>
                    <td className="p-4 text-gray-300">{expenseCategory.type || 'N/A'}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          expenseCategory.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                      >
                        {expenseCategory.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 flex space-x-2">
                      <button
                        onClick={() => handleEditExpenseCategory(expenseCategory)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit ${expenseCategory.name}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(expenseCategory)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete ${expenseCategory.name}`}
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
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} expense categories
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
                setEditingExpenseCategory(null);
                setNewExpenseCategory({ name: '', type: '', status: 1 });
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
                  {editingExpenseCategory ? 'Edit Expense Category' : 'Add New Expense Category'}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingExpenseCategory(null);
                    setNewExpenseCategory({ name: '', type: '', status: 1 });
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  disabled={isSubmitting}
                  aria-label="Close modal"
                >
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleAddOrUpdateExpenseCategory} className="space-y-4">
                <div>
                  <label htmlFor="expense-category-name" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Expense Category Name
                  </label>
                  <input
                    id="expense-category-name"
                    placeholder='Enter expense category name'
                    type="text"
                    value={newExpenseCategory.name}
                    onChange={(e) => setNewExpenseCategory((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="expense-category-type" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Type
                  </label>
                  <select
                    id="expense-category-type"
                    value={newExpenseCategory.type}
                    onChange={(e) => setNewExpenseCategory((prev) => ({ ...prev, type: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="">Select Type</option>
                    {expenseCategoryTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="expense-category-status" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Status
                  </label>
                  <select
                    id="expense-category-status"
                    value={newExpenseCategory.status}
                    onChange={(e) => setNewExpenseCategory((prev) => ({ ...prev, status: Number(e.target.value) }))}
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
                      setEditingExpenseCategory(null);
                      setNewExpenseCategory({ name: '', type: '', status: 1 });
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
                    {isSubmitting ? (editingExpenseCategory ? 'Updating...' : 'Adding...') : (editingExpenseCategory ? 'Update' : 'Add')}
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
                setExpenseCategoryToDelete(null);
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
                    setExpenseCategoryToDelete(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  aria-label="Close delete modal"
                >
                  <FiX />
                </button>
              </div>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Are you sure you want to delete the expense category "{expenseCategoryToDelete?.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setExpenseCategoryToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteExpenseCategory}
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

export default ExpenseCategory;