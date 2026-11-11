import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiSearch, FiEdit, FiTrash2, FiPlus, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import debounce from 'lodash/debounce';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://192.168.0.231:8000/api/';
const API_URL = `${API_BASE_URL}sell-items`;
const PRODUCTS_API_URL = `${API_BASE_URL}products`;
const STOCKS_API_URL = `${API_BASE_URL}stocks`;
const SELLS_API_URL = `${API_BASE_URL}sells`;

// Utility function for exponential backoff
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SellItem = () => {
  const [sellItems, setSellItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [sells, setSells] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSellItem, setNewSellItem] = useState({
    product_id: '',
    stock_id: '',
    sell_id: '',
    quantity: '',
    selling_price: '',
    total_profit: '',
    status: 1,
  });
  const [editingSellItem, setEditingSellItem] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sellItemToDelete, setSellItemToDelete] = useState(null);

  const fetchWithBackoff = async (url, options, retries = 3, backoff = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.status === 429) {
          if (i === retries - 1) throw new Error('Too many requests after retries');
          await sleep(backoff * Math.pow(2, i));
          continue;
        }
        return response;
      } catch (err) {
        if (i === retries - 1) throw err;
        await sleep(backoff * Math.pow(2, i));
      }
    }
  };

  const fetchSellItems = useCallback(async () => {
    setError(null);
    try {
      const endpoint = searchTerm
        ? `sell-items/search?search=${encodeURIComponent(searchTerm)}&limit=${itemsPerPage}&page=${currentPage}`
        : `sell-items/paginated?limit=${itemsPerPage}&page=${currentPage}`;
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetchWithBackoff(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to fetch sell items: ${response.status} ${response.statusText}`;
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
      setSellItems(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.last_page || 1);
      setTotalItems(data.total || data.data.length || 0);
    } catch (err) {
      setError(`Failed to load sell items: ${err.message}. Please try again.`);
      toast.error(`Failed to load sell items: ${err.message}`);
    }
  }, [currentPage, itemsPerPage, searchTerm]);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetchWithBackoff(PRODUCTS_API_URL, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to fetch products: ${response.status} ${response.statusText}`;
        if (response.status === 404) {
          errorMessage = 'Products API endpoint not found. Please check the backend route configuration.';
        }
        throw new Error(errorMessage);
      }
      const json = await response.json();
      setProducts(Array.isArray(json) ? json : (json.status && Array.isArray(json.data) ? json.data : []));
    } catch (err) {
      toast.error(`Failed to fetch products: ${err.message}`);
    }
  }, []);

  const fetchStocks = useCallback(async () => {
    try {
      const response = await fetchWithBackoff(STOCKS_API_URL, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to fetch stocks: ${response.status} ${response.statusText}`;
        if (response.status === 404) {
          errorMessage = 'Stocks API endpoint not found. Please check the backend route configuration.';
        }
        throw new Error(errorMessage);
      }
      const json = await response.json();
      setStocks(Array.isArray(json) ? json : (json.status && Array.isArray(json.data) ? json.data : []));
    } catch (err) {
      toast.error(`Failed to fetch stocks: ${err.message}`);
    }
  }, []);

  const fetchSells = useCallback(
    debounce(async () => {
      try {
        const response = await fetchWithBackoff(SELLS_API_URL, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Failed to fetch sells: ${response.status} ${response.statusText}`;
          if (response.status === 404) {
            errorMessage = 'Sells API endpoint not found. Please check the backend route configuration.';
          }
          throw new Error(errorMessage);
        }
        const json = await response.json();
        setSells(Array.isArray(json) ? json : (json.status && Array.isArray(json.data) ? json.data : []));
      } catch (err) {
        toast.error(`Failed to fetch sells: ${err.message}`);
      }
    }, 1000),
    []
  );

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  useEffect(() => {
    fetchSellItems();
    fetchProducts();
    fetchStocks();
    fetchSells();
    return () => fetchSells.cancel(); // Cleanup debounce on unmount
  }, [fetchSellItems, fetchProducts, fetchStocks, fetchSells]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        setIsModalOpen(false);
        setEditingSellItem(null);
        setNewSellItem({
          product_id: '',
          stock_id: '',
          sell_id: '',
          quantity: '',
          selling_price: '',
          total_profit: '',
          status: 1,
        });
        setIsDeleteModalOpen(false);
        setSellItemToDelete(null);
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

  const handleAddOrUpdateSellItem = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newSellItem.product_id || !newSellItem.stock_id || !newSellItem.sell_id || !newSellItem.quantity || !newSellItem.selling_price) {
        toast.error('Product, stock, sell, quantity, and selling price are required.');
        return;
      }
      if (Number(newSellItem.quantity) <= 0) {
        toast.error('Quantity must be greater than 0.');
        return;
      }
      if (Number(newSellItem.selling_price) < 0) {
        toast.error('Selling price cannot be negative.');
        return;
      }
      if (newSellItem.total_profit && Number(newSellItem.total_profit) < 0) {
        toast.error('Total profit cannot be negative.');
        return;
      }
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('product_id', newSellItem.product_id);
        formData.append('stock_id', newSellItem.stock_id);
        formData.append('sell_id', newSellItem.sell_id);
        formData.append('quantity', newSellItem.quantity);
        formData.append('selling_price', newSellItem.selling_price);
        formData.append('total', (Number(newSellItem.quantity) * Number(newSellItem.selling_price)).toFixed(2));
        formData.append('profit', newSellItem.total_profit || '0.00');
        formData.append('status', newSellItem.status ? '1' : '0');
        if (editingSellItem) {
          formData.append('_method', 'PUT');
        }
        const url = editingSellItem ? `${API_URL}/${editingSellItem.id}` : API_URL;
        const response = await fetchWithBackoff(url, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = editingSellItem ? `Failed to update sell item: ${response.statusText}` : `Failed to add sell item: ${response.statusText}`;
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
        toast.success(json.message || (editingSellItem ? 'Sell item updated successfully' : 'Sell item created successfully'));
        await fetchSellItems();
        setIsModalOpen(false);
        setNewSellItem({
          product_id: '',
          stock_id: '',
          sell_id: '',
          quantity: '',
          selling_price: '',
          total_profit: '',
          status: 1,
        });
        setEditingSellItem(null);
      } catch (err) {
        setError(`Failed to save sell item: ${err.message}. Please try again.`);
        toast.error(`Failed to save sell item: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingSellItem, newSellItem, fetchSellItems]
  );

  const handleDeleteSellItem = useCallback(async () => {
    if (!sellItemToDelete) return;
    try {
      const url = `${API_URL}/${sellItemToDelete.id}`;
      const response = await fetchWithBackoff(url, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to delete sell item: ${response.statusText}`;
        if (response.status === 404) {
          errorMessage = 'Sell item not found or API endpoint unavailable.';
        }
        throw new Error(errorMessage);
      }
      const json = await response.json();
      toast.success(json.message || 'Sell item deleted successfully');
      if (sellItems.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
      await fetchSellItems();
    } catch (err) {
      setError(`Failed to delete sell item: ${err.message}. Please try again.`);
      toast.error(`Failed to delete sell item: ${err.message}`);
    } finally {
      setIsDeleteModalOpen(false);
      setSellItemToDelete(null);
    }
  }, [sellItemToDelete, sellItems.length, currentPage, fetchSellItems]);

  const handleOpenDeleteModal = useCallback((sellItem) => {
    setSellItemToDelete(sellItem);
    setIsDeleteModalOpen(true);
  }, []);

  const handleEditSellItem = useCallback((sellItem) => {
    setEditingSellItem(sellItem);
    setNewSellItem({
      product_id: sellItem.product_id || '',
      stock_id: sellItem.stock_id || '',
      sell_id: sellItem.sell_id || '',
      quantity: sellItem.quantity || '',
      selling_price: sellItem.selling_price || '',
      total_profit: sellItem.profit || '',
      status: sellItem.status ? 1 : 0,
    });
    setIsModalOpen(true);
  }, []);

  const toggleStatus = useCallback(
    async (id, currentStatus) => {
      try {
        const formData = new FormData();
        formData.append('status', currentStatus ? '0' : '1');
        formData.append('_method', 'PUT');
        const response = await fetchWithBackoff(`${API_URL}/${id}`, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Failed to update status: ${response.statusText}`;
          if (response.status === 404) {
            errorMessage = 'Sell item not found or API endpoint unavailable.';
          }
          throw new Error(errorMessage);
        }
        const json = await response.json();
        toast.success(json.message || 'Status updated successfully');
        await fetchSellItems();
      } catch (err) {
        setError(`Failed to update status: ${err.message}. Please try again.`);
        toast.error(`Failed to update status: ${err.message}`);
      }
    },
    [fetchSellItems]
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
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Sell Item Management</h2>
        <button
          onClick={() => {
            setEditingSellItem(null);
            setNewSellItem({
              product_id: '',
              stock_id: '',
              sell_id: '',
              quantity: '',
              selling_price: '',
              total_profit: '',
              status: 1,
            });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors w-full sm:w-auto"
        >
          <FiPlus className="mr-2" /> Add New Sell Item
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search sell items by product name, sell ID, or stock ID..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 placeholder-gray-400 text-sm sm:text-base"
            aria-label="Search sell items"
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
      {sellItems.length === 0 ? (
        <div className="text-center text-gray-300 text-sm sm:text-base">{searchTerm ? 'No sell items match your search' : 'No sell items available'}</div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="block md:hidden">
              {sellItems.map((sellItem) => (
                <motion.div
                  key={sellItem.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-gray-700 p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="text-gray-300 font-medium">Sell Item ID: {sellItem.id}</div>
                      <div className="text-gray-400 text-sm">Product: {sellItem.product?.name || 'N/A'} (ID: {sellItem.product_id})</div>
                      <div className="text-gray-400 text-sm">Description: {sellItem.product?.description || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Quantity: {sellItem.quantity}</div>
                      <div className="text-gray-400 text-sm">Selling Price: ${sellItem.selling_price}</div>
                      <div className="text-gray-400 text-sm">Total: ${sellItem.total}</div>
                      <div className="text-gray-400 text-sm">Total Profit: ${sellItem.profit}</div>
                      <div className="text-gray-400 text-sm">Sell ID: {sellItem.sell_id}</div>
                      <div className="text-gray-400 text-sm">Stock ID: {sellItem.stock_id}</div>
                      <div
                        className={`mt-1 px-2 py-1 rounded-full text-xs inline-block cursor-pointer ${
                          sellItem.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                        onClick={() => toggleStatus(sellItem.id, sellItem.status)}
                      >
                        {sellItem.status ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSellItem(sellItem)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit sell item ${sellItem.id}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(sellItem)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete sell item ${sellItem.id}`}
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
                  <th className="p-4">Product</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Selling Price</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Total Profit</th>
                  <th className="p-4">Sell ID</th>
                  <th className="p-4">Stock ID</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellItems.map((sellItem) => (
                  <motion.tr
                    key={sellItem.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-gray-700 hover:bg-gray-700 transition-colors"
                  >
                    <td className="p-4 text-gray-300">{sellItem.id}</td>
                    <td className="p-4 text-gray-300">{sellItem.product?.name || 'N/A'} (ID: {sellItem.product_id})</td>
                    <td className="p-4 text-gray-300">{sellItem.product?.description || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{sellItem.quantity}</td>
                    <td className="p-4 text-gray-300">${sellItem.selling_price}</td>
                    <td className="p-4 text-gray-300">${sellItem.total}</td>
                    <td className="p-4 text-gray-300">${sellItem.profit}</td>
                    <td className="p-4 text-gray-300">{sellItem.sell_id}</td>
                    <td className="p-4 text-gray-300">{sellItem.stock_id}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs cursor-pointer ${
                          sellItem.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                        onClick={() => toggleStatus(sellItem.id, sellItem.status)}
                      >
                        {sellItem.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 flex space-x-2">
                      <button
                        onClick={() => handleEditSellItem(sellItem)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit sell item ${sellItem.id}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(sellItem)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete sell item ${sellItem.id}`}
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
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} sell items
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
                setEditingSellItem(null);
                setNewSellItem({
                  product_id: '',
                  stock_id: '',
                  sell_id: '',
                  quantity: '',
                  selling_price: '',
                  total_profit: '',
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
              className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="modal-title"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 id="modal-title" className="text-lg sm:text-xl font-bold text-white">
                  {editingSellItem ? 'Edit Sell Item' : 'Add New Sell Item'}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSellItem(null);
                    setNewSellItem({
                      product_id: '',
                      stock_id: '',
                      sell_id: '',
                      quantity: '',
                      selling_price: '',
                      total_profit: '',
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
              <form onSubmit={handleAddOrUpdateSellItem} className="space-y-4">
                <div>
                  <label htmlFor="sell-item-product" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Product
                  </label>
                  <select
                    id="sell-item-product"
                    value={newSellItem.product_id}
                    onChange={(e) => setNewSellItem((prev) => ({ ...prev, product_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name} (ID: {product.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="sell-item-stock" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Stock
                  </label>
                  <select
                    id="sell-item-stock"
                    value={newSellItem.stock_id}
                    onChange={(e) => setNewSellItem((prev) => ({ ...prev, stock_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a stock</option>
                    {stocks.map((stock) => (
                      <option key={stock.id} value={stock.id}>Stock ID: {stock.id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="sell-item-sell" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Sell
                  </label>
                  <select
                    id="sell-item-sell"
                    value={newSellItem.sell_id}
                    onChange={(e) => setNewSellItem((prev) => ({ ...prev, sell_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a sell</option>
                    {sells.map((sell) => (
                      <option key={sell.id} value={sell.id}>Sell ID: {sell.id}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="sell-item-quantity" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Quantity
                  </label>
                  <input
                    id="sell-item-quantity"
                    type="number"
                    value={newSellItem.quantity}
                    placeholder='Enter quantity'
                    onChange={(e) => setNewSellItem((prev) => ({ ...prev, quantity: e.target.value }))}
                    required
                    min="1"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="sell-item-selling-price" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Selling Price
                  </label>
                  <input
                    id="sell-item-selling-price"
                    type="number"
                    step="0.01"
                    placeholder='Enter selling price'
                    value={newSellItem.selling_price}
                    onChange={(e) => setNewSellItem((prev) => ({ ...prev, selling_price: e.target.value }))}
                    required
                    min="0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 text-sm sm:text-base">Total</label>
                  <p className="text-gray-100 text-sm sm:text-base">
                    ${(newSellItem.quantity && newSellItem.selling_price ? (Number(newSellItem.quantity) * Number(newSellItem.selling_price)).toFixed(2) : '0.00')}
                  </p>
                </div>
                <div>
                  <label htmlFor="sell-item-total-profit" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Total Profit (optional)
                  </label>
                  <input
                    id="sell-item-total-profit"
                    placeholder='Enter total profit'
                    type="number"
                    step="0.01"
                    value={newSellItem.total_profit}
                    onChange={(e) => setNewSellItem((prev) => ({ ...prev, total_profit: e.target.value }))}
                    min="0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="sell-item-status" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Status
                  </label>
                  <select
                    id="sell-item-status"
                    value={newSellItem.status}
                    onChange={(e) => setNewSellItem((prev) => ({ ...prev, status: Number(e.target.value) }))}
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
                      setEditingSellItem(null);
                      setNewSellItem({
                        product_id: '',
                        stock_id: '',
                        sell_id: '',
                        quantity: '',
                        selling_price: '',
                        total_profit: '',
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
                      isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (editingSellItem ? 'Updating...' : 'Adding...') : (editingSellItem ? 'Update' : 'Add')}
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
                setSellItemToDelete(null);
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
                    setSellItemToDelete(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  aria-label="Close delete modal"
                >
                  <FiX />
                </button>
              </div>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Are you sure you want to delete sell item ID {sellItemToDelete?.id} for product "{sellItemToDelete?.product?.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSellItemToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSellItem}
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

export default SellItem;