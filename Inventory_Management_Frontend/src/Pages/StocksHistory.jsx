import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiSearch, FiTrash2, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import debounce from 'lodash/debounce';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://192.168.0.231:8000/api/';

const StockHistory = () => {
  const [stockHistories, setStockHistories] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [error, setError] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stockHistoryToDelete, setStockHistoryToDelete] = useState(null);

  const fetchStockHistories = useCallback(async () => {
    setError(null);
    try {
      const endpoint = searchTerm
        ? `stock-histories/search?search=${encodeURIComponent(searchTerm)}&limit=${itemsPerPage}&page=${currentPage}`
        : `stock-histories/paginated?limit=${itemsPerPage}&page=${currentPage}`;
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to fetch stock histories: ${response.status} ${response.statusText}`;
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
      if (!json.status || !json.data) {
        throw new Error('Invalid response format: Missing status or data');
      }
      const { data } = json;
      setStockHistories(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.last_page || 1);
      setTotalItems(data.total || data.data.length || 0);
    } catch (err) {
      setError(`Failed to load stock histories: ${err.message}. Please try again.`);
      toast.error(`Failed to load stock histories: ${err.message}`);
    }
  }, [currentPage, itemsPerPage, searchTerm]);

  const fetchDropdownData = useCallback(async (endpoint, setter, entityName) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch ${entityName}: ${response.statusText}`);
      }
      const json = await response.json();
      setter(Array.isArray(json) ? json : (json.status && Array.isArray(json.data) ? json.data : []));
    } catch (err) {
      toast.error(`Failed to fetch ${entityName}: ${err.message}`);
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
    fetchStockHistories();
  }, [fetchStockHistories]);

  useEffect(() => {
    Promise.all([
      fetchDropdownData('stocks', setStocks, 'stocks'),
      fetchDropdownData('products', setProducts, 'products'),
      fetchDropdownData('suppliers', setSuppliers, 'suppliers'),
      fetchDropdownData('warehouses', setWarehouses, 'warehouses'),
      fetchDropdownData('users', setUsers, 'users'),
    ]);
  }, [fetchDropdownData]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsDeleteModalOpen(false);
        setStockHistoryToDelete(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const handleItemsPerPageChange = useCallback((e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  }, []);

  const handleDeleteStockHistory = useCallback(async () => {
    if (!stockHistoryToDelete) return;
    try {
      const url = `${API_BASE_URL}stock-histories/${stockHistoryToDelete.id}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to delete stock history: ${response.statusText}`;
        if (response.status === 404) {
          errorMessage = 'Stock history not found or API endpoint unavailable.';
        }
        throw new Error(errorMessage);
      }
      const json = await response.json();
      toast.success(json.message || 'Stock history deleted successfully');
      if (stockHistories.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
      await fetchStockHistories();
    } catch (err) {
      setError(`Failed to delete stock history: ${err.message}. Please try again.`);
      toast.error(`Failed to delete stock history: ${err.message}`);
    } finally {
      setIsDeleteModalOpen(false);
      setStockHistoryToDelete(null);
    }
  }, [stockHistoryToDelete, stockHistories.length, currentPage, fetchStockHistories]);

  const handleOpenDeleteModal = useCallback((stockHistory) => {
    setStockHistoryToDelete(stockHistory);
    setIsDeleteModalOpen(true);
  }, []);

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-900 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme="dark" />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Stock History Management</h2>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by stock ID, product, supplier, warehouse, user, or quantity..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 placeholder-gray-400 text-sm sm:text-base"
            aria-label="Search stock histories"
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
      {stockHistories.length === 0 ? (
        <div className="text-center text-gray-300 text-sm sm:text-base">{searchTerm ? 'No stock histories match your search' : 'No stock histories available'}</div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="block md:hidden">
              {stockHistories.map((stockHistory) => (
                <motion.div
                  key={stockHistory.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-gray-700 p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="text-gray-300 font-medium">ID: {stockHistory.id}</div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenDeleteModal(stockHistory)}
                          className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                          aria-label={`Delete stock history ${stockHistory.id}`}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                    <div className="text-gray-400 text-sm">Stock ID: {stockHistory.stock_id}</div>
                    <div className="text-gray-400 text-sm">Product: {stockHistory.product?.name || 'N/A'}</div>
                    <div className="text-gray-400 text-sm">Supplier: {stockHistory.supplier?.name || 'N/A'}</div>
                    <div className="text-gray-400 text-sm">Warehouse: {stockHistory.warehouse?.name || 'N/A'}</div>
                    <div className="text-gray-400 text-sm">User: {stockHistory.user?.name || 'N/A'}</div>
                    <div className="text-gray-400 text-sm">Quantity: {stockHistory.quantity}</div>
                    <div className="text-gray-400 text-sm">Buy Price: ${stockHistory.buy_price}</div>
                    <div className="text-gray-400 text-sm">Sell Price: ${stockHistory.sell_price}</div>
                    <div className="text-gray-400 text-sm">Total: ${stockHistory.total_amount}</div>
                    <div className="text-gray-400 text-sm">Paid: ${stockHistory.paid_amount}</div>
                    <div className="text-gray-400 text-sm">Due: ${stockHistory.due_amount}</div>
                    <div
                      className={`mt-1 px-2 py-1 rounded-full text-xs inline-block ${
                        stockHistory.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                      }`}
                    >
                      {stockHistory.status ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            <table className="hidden md:table w-full">
              <thead>
                <tr className="bg-gray-700 text-gray-300 text-left">
                  <th className="p-4">ID</th>
                  <th className="p-4">Stock ID</th>
                  <th className="p-4">Product</th>
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Warehouse</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Buy Price</th>
                  <th className="p-4">Sell Price</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Paid</th>
                  <th className="p-4">Due</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stockHistories.map((stockHistory) => (
                  <motion.tr
                    key={stockHistory.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-gray-700 hover:bg-gray-700 transition-colors"
                  >
                    <td className="p-4 text-gray-300">{stockHistory.id}</td>
                    <td className="p-4 text-gray-300">{stockHistory.stock_id}</td>
                    <td className="p-4 text-gray-300">{stockHistory.product?.name || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{stockHistory.supplier?.name || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{stockHistory.warehouse?.name || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{stockHistory.user?.name || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{stockHistory.quantity}</td>
                    <td className="p-4 text-gray-300">${stockHistory.buy_price}</td>
                    <td className="p-4 text-gray-300">${stockHistory.sell_price}</td>
                    <td className="p-4 text-gray-300">${stockHistory.total_amount}</td>
                    <td className="p-4 text-gray-300">${stockHistory.paid_amount}</td>
                    <td className="p-4 text-gray-300">${stockHistory.due_amount}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          stockHistory.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                      >
                        {stockHistory.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 flex space-x-2">
                      <button
                        onClick={() => handleOpenDeleteModal(stockHistory)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete stock history ${stockHistory.id}`}
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
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} stock histories
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
        {isDeleteModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsDeleteModalOpen(false);
                setStockHistoryToDelete(null);
              }
            }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[70vh] overflow-y-auto"
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
                    setStockHistoryToDelete(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  aria-label="Close delete modal"
                >
                  <FiX />
                </button>
              </div>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Are you sure you want to delete stock history ID {stockHistoryToDelete?.id} for product "{stockHistoryToDelete?.product?.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setStockHistoryToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStockHistory}
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

export default StockHistory;