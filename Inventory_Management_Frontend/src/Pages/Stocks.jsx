import { useState, useEffect, useCallback, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiSearch, FiEdit, FiTrash2, FiPlus, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import debounce from 'lodash/debounce';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://192.168.0.164:8000/api/';
const API_URL = `${API_BASE_URL}stocks`;
const PRODUCTS_API_URL = `${API_BASE_URL}products`;
const SUPPLIERS_API_URL = `${API_BASE_URL}suppliers`;
const WAREHOUSES_API_URL = `${API_BASE_URL}warehouses`;
const USERS_API_URL = `${API_BASE_URL}users`;
const PAYMENT_TYPES_API_URL = `${API_BASE_URL}payment-types`;

// In-memory cache for static data
const cache = {
  products: null,
  suppliers: null,
  warehouses: null,
  users: null,
  paymentTypes: null,
};

const fetchWithBackoff = async (url, options = {}, retries = 3, backoff = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...options.headers, Accept: 'application/json' },
      });
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After') ? parseInt(response.headers.get('Retry-After')) * 1000 : backoff * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, retryAfter));
        continue;
      }
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error: ${response.status} ${response.statusText}`;
        if (response.status === 422) {
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = `Validation error: ${errorJson.message || Object.values(errorJson.errors).flat().join(', ')}`;
          } catch (e) {
            // Non-JSON error response
          }
        } else if (response.status === 404) {
          errorMessage = 'API endpoint not found.';
        } else if (response.status === 500) {
          errorMessage = 'Internal server error.';
        }
        throw new Error(errorMessage);
      }
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
};

const Stock = () => {
  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [users, setUsers] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState(null);

  const [formData, setFormData] = useState({
    product_id: '',
    supplier_id: '',
    warehouse_id: '',
    user_id: '',
    transactions: [{ payment_type_id: '', amount: '' }],
    quantity: '',
    buy_price: '',
    sell_price: '',
    stock_date: '',
    status: 0,
  });

  const calculateAmounts = useCallback(() => {
    const total_amount = formData.quantity && formData.buy_price 
      ? (Number(formData.quantity) * Number(formData.buy_price)).toFixed(2) 
      : '0.00';
    const paid_amount = formData.transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0).toFixed(2);
    const due_amount = (Number(total_amount) - Number(paid_amount)).toFixed(2);
    return { total_amount, paid_amount, due_amount };
  }, [formData.quantity, formData.buy_price, formData.transactions]);

  const formatCurrency = (value) => Number(value).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  const formatDate = (date) => (date ? new Date(date).toISOString().split('T')[0] : '');

  const getPaymentTypeNames = useCallback((transactions) => {
    if (!transactions || transactions.length === 0) return 'N/A';
    const paymentTypeNames = transactions
      .map((tx) => {
        const paymentType = paymentTypes.find((pt) => pt.id.toString() === tx.payment_type_id.toString());
        return paymentType ? paymentType.name : null;
      })
      .filter((name) => name)
      .join(', ');
    return paymentTypeNames || 'N/A';
  }, [paymentTypes]);

  const fetchStocks = useCallback(async () => {
    setError(null);
    try {
      const endpoint = searchTerm 
        ? `search?search=${encodeURIComponent(searchTerm)}&limit=${itemsPerPage}&page=${currentPage}` 
        : `paginated?limit=${itemsPerPage}&page=${currentPage}`;
      const json = await fetchWithBackoff(`${API_URL}/${endpoint}`);
      if (!json.status || !json.data) throw new Error('Invalid response format');
      const { data } = json;
      setStocks(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.last_page || 1);
      setTotalItems(data.total || 0);
    } catch (err) {
      setError(`Failed to load stocks: ${err.message}. Please try again.`);
      toast.error(`Failed to load stocks: ${err.message}`);
    }
  }, [currentPage, itemsPerPage, searchTerm]);

  const fetchStaticData = useCallback(async () => {
    try {
      const endpoints = [
        { url: PRODUCTS_API_URL, setter: setProducts, cacheKey: 'products', entity: 'products' },
        { url: SUPPLIERS_API_URL, setter: setSuppliers, cacheKey: 'suppliers', entity: 'suppliers' },
        { url: WAREHOUSES_API_URL, setter: setWarehouses, cacheKey: 'warehouses', entity: 'warehouses' },
        { url: USERS_API_URL, setter: setUsers, cacheKey: 'users', entity: 'users' },
        { url: PAYMENT_TYPES_API_URL, setter: setPaymentTypes, cacheKey: 'paymentTypes', entity: 'payment types' },
      ];

      const promises = endpoints.map(async ({ url, setter, cacheKey, entity }) => {
        if (cache[cacheKey]) {
          setter(cache[cacheKey]);
          return;
        }
        try {
          const json = await fetchWithBackoff(url);
          const data = Array.isArray(json) ? json : (json.status && Array.isArray(json.data) ? json.data : []);
          cache[cacheKey] = data;
          setter(data);
        } catch (err) {
          toast.error(`Failed to fetch ${entity}: ${err.message}`);
        }
      });

      await Promise.all(promises);
    } catch (err) {
      setError(`Failed to load static data: ${err.message}. Please try again.`);
      toast.error(`Failed to load static data: ${err.message}`);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    await Promise.all([fetchStocks(), fetchStaticData()]);
  }, [fetchStocks, fetchStaticData]);

  const debouncedSearch = useMemo(() => debounce((value) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, 300), []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        setIsModalOpen(false);
        setEditingStock(null);
        setFormData({
          product_id: '',
          supplier_id: '',
          warehouse_id: '',
          user_id: '',
          transactions: [{ payment_type_id: '', amount: '' }],
          quantity: '',
          buy_price: '',
          sell_price: '',
          stock_date: '',
          status: 0,
        });
        setIsDeleteModalOpen(false);
        setStockToDelete(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isSubmitting]);

  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  }, [totalPages]);

  const handleItemsPerPageChange = useCallback((e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  }, []);

  const handleAddTransaction = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      transactions: [...prev.transactions, { payment_type_id: '', amount: '' }],
    }));
  }, []);

  const handleRemoveTransaction = useCallback((index) => {
    setFormData((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((_, i) => i !== index),
    }));
  }, []);

  const handleTransactionChange = useCallback((index, field, value) => {
    setFormData((prev) => {
      const newTransactions = [...prev.transactions];
      newTransactions[index] = { ...newTransactions[index], [field]: value };
      return { ...prev, transactions: newTransactions };
    });
  }, []);

  const handleAddOrUpdateStock = useCallback(async (e) => {
    e.preventDefault();
    const { total_amount, paid_amount, due_amount } = calculateAmounts();

    if (!formData.product_id || !formData.supplier_id || !formData.warehouse_id || !formData.user_id || !formData.quantity || !formData.buy_price || !formData.stock_date) {
      toast.error('All required fields must be filled.');
      return;
    }
    if (Number(formData.quantity) <= 0) {
      toast.error('Quantity must be greater than zero.');
      return;
    }
    if (Number(formData.buy_price) < 0) {
      toast.error('Buy price cannot be negative.');
      return;
    }
    if (Number(formData.sell_price) < 0) {
      toast.error('Sell price cannot be negative.');
      return;
    }
    if (formData.transactions.some((tx) => Number(tx.amount) < 0)) {
      toast.error('Transaction amounts cannot be negative.');
      return;
    }
    if (!formData.transactions.some((tx) => tx.payment_type_id && Number(tx.amount) > 0)) {
      toast.error('At least one transaction with a valid payment type and positive amount is required.');
      return;
    }
    if (Number(paid_amount) > Number(total_amount)) {
      toast.error('Sum of transaction amounts cannot exceed the total amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        product_id: formData.product_id,
        supplier_id: formData.supplier_id,
        warehouse_id: formData.warehouse_id,
        user_id: formData.user_id,
        quantity: Math.floor(Number(formData.quantity)),
        buy_price: Number(formData.buy_price).toFixed(2),
        sell_price: formData.sell_price ? Number(formData.sell_price).toFixed(2) : Number(formData.buy_price).toFixed(2),
        total_amount,
        paid_amount,
        due_amount,
        stock_date: formData.stock_date,
        status: formData.status ? 1 : 0,
        transactions: formData.transactions
          .filter((tx) => tx.payment_type_id && Number(tx.amount) > 0)
          .map((tx) => ({
            payment_type_id: tx.payment_type_id,
            amount: Number(tx.amount).toFixed(2),
          })),
      };

      const url = editingStock ? `${API_URL}/${editingStock.id}?_method=PUT` : API_URL;
      const json = await fetchWithBackoff(url, {
        method: 'POST', // Use POST for both create and update due to Laravel's _method handling
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      toast.success(json.message || (editingStock ? 'Stock updated successfully' : 'Stock created successfully'));
      // Invalidate cache for related data
      cache.products = null;
      cache.suppliers = null;
      cache.warehouses = null;
      cache.users = null;
      cache.paymentTypes = null;
      await fetchAllData();
      setIsModalOpen(false);
      setEditingStock(null);
      setFormData({
        product_id: '',
        supplier_id: '',
        warehouse_id: '',
        user_id: '',
        transactions: [{ payment_type_id: '', amount: '' }],
        quantity: '',
        buy_price: '',
        sell_price: '',
        stock_date: '',
        status: 0,
      });
    } catch (err) {
      setError(`Failed to save stock: ${err.message}. Please try again.`);
      toast.error(`Failed to save stock: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingStock, formData, calculateAmounts, fetchAllData]);

  const handleDeleteStock = useCallback(async () => {
    if (!stockToDelete) return;
    try {
      const json = await fetchWithBackoff(`${API_URL}/${stockToDelete.id}`, { method: 'DELETE' });
      toast.success(json.message || 'Stock deleted successfully');
      if (stocks.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
      cache.products = null;
      cache.suppliers = null;
      cache.warehouses = null;
      cache.users = null;
      cache.paymentTypes = null;
      await fetchAllData();
    } catch (err) {
      setError(`Failed to delete stock: ${err.message}. Please try again.`);
      toast.error(`Failed to delete stock: ${err.message}`);
    } finally {
      setIsDeleteModalOpen(false);
      setStockToDelete(null);
    }
  }, [stockToDelete, stocks.length, currentPage, fetchAllData]);

  const handleEditStock = useCallback((stock) => {
    setEditingStock(stock);
    setFormData({
      product_id: stock.product_id || '',
      supplier_id: stock.supplier_id || '',
      warehouse_id: stock.warehouse_id || '',
      user_id: stock.user_id || '',
      transactions: stock.transactions?.length > 0
        ? stock.transactions.map((tx) => ({
            payment_type_id: tx.payment_type_id.toString(),
            amount: Number(tx.amount).toString(),
          }))
        : [{ payment_type_id: '', amount: '' }],
      quantity: stock.quantity?.toString() || '',
      buy_price: stock.buy_price?.toString() || '',
      sell_price: stock.sell_price?.toString() || '',
      stock_date: formatDate(stock.stock_date) || '',
      status: stock.status ? 1 : 0,
    });
    setIsModalOpen(true);
  }, []);

  const toggleStatus = useCallback(async (id, currentStatus) => {
    try {
      const json = await fetchWithBackoff(`${API_URL}/${id}?_method=PUT`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: currentStatus ? 0 : 1 }),
      });
      toast.success(json.message || 'Status updated successfully');
      cache.products = null;
      cache.suppliers = null;
      cache.warehouses = null;
      cache.users = null;
      cache.paymentTypes = null;
      await fetchAllData();
    } catch (err) {
      setError(`Failed to update status: ${err.message}. Please try again.`);
      toast.error(`Failed to update status: ${err.message}`);
    }
  }, [fetchAllData]);

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-900 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme="dark" />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Stock Management</h2>
        <button
          onClick={() => {
            setEditingStock(null);
            setFormData({
              product_id: '',
              supplier_id: '',
              warehouse_id: '',
              user_id: '',
              transactions: [{ payment_type_id: '', amount: '' }],
              quantity: '',
              buy_price: '',
              sell_price: '',
              stock_date: '',
              status: 0,
            });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors w-full sm:w-auto"
        >
          <FiPlus className="mr-2" /> Add New Stock
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by product or supplier name..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 placeholder-gray-400 text-sm sm:text-base"
            aria-label="Search stocks"
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
          {error} <button onClick={fetchAllData} className="underline">Retry</button>
        </div>
      )}
      {stocks.length === 0 ? (
        <div className="text-center text-gray-300 text-sm sm:text-base">{searchTerm ? 'No stocks match your search' : 'No stocks available'}</div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="block md:hidden">
              {stocks.map((stock) => (
                <motion.div
                  key={stock.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-gray-700 p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="text-gray-300 font-medium">Stock ID: {stock.id}</div>
                      <div className="text-gray-400 text-sm">Product: {stock.product?.name || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Supplier: {stock.supplier?.name || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Warehouse: {stock.warehouse?.name || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">User: {stock.user?.name || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Payment Type: {getPaymentTypeNames(stock.transactions)}</div>
                      <div className="text-gray-400 text-sm">Stock Date: {formatDate(stock.stock_date) || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Quantity: {stock.quantity.toLocaleString()}</div>
                      <div className="text-gray-400 text-sm">Buy Price: {formatCurrency(stock.buy_price)}</div>
                      <div className="text-gray-400 text-sm">Sell Price: {formatCurrency(stock.sell_price)}</div>
                      <div className="text-gray-400 text-sm">Total Amount: {formatCurrency(stock.total_amount)}</div>
                      <div className="text-gray-400 text-sm">Paid Amount: {formatCurrency(stock.paid_amount)}</div>
                      <div className="text-gray-400 text-sm">Due Amount: {formatCurrency(stock.due_amount)}</div>
                      <div
                        className={`mt-2 px-2 py-1 rounded-full text-xs inline-block cursor-pointer ${
                          stock.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                        onClick={() => toggleStatus(stock.id, stock.status)}
                      >
                        {stock.status ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditStock(stock)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit stock ${stock.id}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => {
                          setStockToDelete(stock);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete stock ${stock.id}`}
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
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Warehouse</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Payment Type</th>
                  <th className="p-4">Stock Date</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Buy Price</th>
                  <th className="p-4">Sell Price</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Paid Amount</th>
                  <th className="p-4">Due Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <motion.tr
                    key={stock.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-gray-700 hover:bg-gray-700 transition-colors"
                  >
                    <td className="p-4 text-gray-300">{stock.id}</td>
                    <td className="p-4 text-gray-300">{stock.product?.name || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{stock.supplier?.name || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{stock.warehouse?.name || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{stock.user?.name || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{getPaymentTypeNames(stock.transactions)}</td>
                    <td className="p-4 text-gray-300">{formatDate(stock.stock_date) || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{stock.quantity.toLocaleString()}</td>
                    <td className="p-4 text-gray-300">{formatCurrency(stock.buy_price)}</td>
                    <td className="p-4 text-gray-300">{formatCurrency(stock.sell_price)}</td>
                    <td className="p-4 text-gray-300">{formatCurrency(stock.total_amount)}</td>
                    <td className="p-4 text-gray-300">{formatCurrency(stock.paid_amount)}</td>
                    <td className="p-4 text-gray-300">{formatCurrency(stock.due_amount)}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs cursor-pointer ${
                          stock.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                        onClick={() => toggleStatus(stock.id, stock.status)}
                      >
                        {stock.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 flex space-x-2">
                      <button
                        onClick={() => handleEditStock(stock)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit stock ${stock.id}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => {
                          setStockToDelete(stock);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete stock ${stock.id}`}
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
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} stocks
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
            onClick={(e) => e.target === e.currentTarget && !isSubmitting && setIsModalOpen(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-[80vw] md:max-w-[600px] max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="modal-title"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 id="modal-title" className="text-lg sm:text-xl font-bold text-white">
                  {editingStock ? 'Edit Stock' : 'Add New Stock'}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingStock(null);
                    setFormData({
                      product_id: '',
                      supplier_id: '',
                      warehouse_id: '',
                      user_id: '',
                      transactions: [{ payment_type_id: '', amount: '' }],
                      quantity: '',
                      buy_price: '',
                      sell_price: '',
                      stock_date: '',
                      status: 0,
                    });
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  disabled={isSubmitting}
                  aria-label="Close modal"
                >
                  <FiX />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="stock-product" className="block text-gray-300 mb-1 text-sm sm:text-base">Product</label>
                  <select
                    id="stock-product"
                    value={formData.product_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, product_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>{product.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="stock-supplier" className="block text-gray-300 mb-1 text-sm sm:text-base">Supplier</label>
                  <select
                    id="stock-supplier"
                    value={formData.supplier_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, supplier_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a supplier</option>
                    {suppliers.map((supplier) => (
                      <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="stock-warehouse" className="block text-gray-300 mb-1 text-sm sm:text-base">Warehouse</label>
                  <select
                    id="stock-warehouse"
                    value={formData.warehouse_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, warehouse_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>{warehouse.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="stock-user" className="block text-gray-300 mb-1 text-sm sm:text-base">User</label>
                  <select
                    id="stock-user"
                    value={formData.user_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, user_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 text-sm sm:text-base">Transactions</label>
                  {formData.transactions.map((tx, index) => (
                    <div key={index} className="flex items-center gap-2 mb-2">
                      <select
                        value={tx.payment_type_id}
                        onChange={(e) => handleTransactionChange(index, 'payment_type_id', e.target.value)}
                        required
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100"
                        disabled={isSubmitting}
                      >
                        <option value="">Select payment type</option>
                        {paymentTypes.map((paymentType) => (
                          <option key={paymentType.id} value={paymentType.id}>{paymentType.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        value={tx.amount}
                        onChange={(e) => handleTransactionChange(index, 'amount', e.target.value)}
                        placeholder="0.00"
                        min="0"
                        required
                        className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100"
                        disabled={isSubmitting}
                      />
                      {formData.transactions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTransaction(index)}
                          className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                          disabled={isSubmitting}
                        >
                          <FiX />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddTransaction}
                    className="mt-2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm"
                    disabled={isSubmitting}
                  >
                    Add Transaction
                  </button>
                </div>
                <div>
                  <label htmlFor="stock-date" className="block text-gray-300 mb-1 text-sm sm:text-base">Stock Date</label>
                  <input
                    id="stock-date"
                    type="date"
                    value={formData.stock_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, stock_date: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="stock-quantity" className="block text-gray-300 mb-1 text-sm sm:text-base">Quantity</label>
                  <input
                    id="stock-quantity"
                    type="number"
                    placeholder="Enter quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                    required
                    min="1"
                    step="1"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="stock-buy-price" className="block text-gray-300 mb-1 text-sm sm:text-base">Buy Price (per unit)</label>
                  <input
                    id="stock-buy-price"
                    type="number"
                    step="0.01"
                    placeholder="Enter buy price"
                    value={formData.buy_price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, buy_price: e.target.value }))}
                    required
                    min="0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="stock-sell-price" className="block text-gray-300 mb-1 text-sm sm:text-base">Sell Price (per unit)</label>
                  <input
                    id="stock-sell-price"
                    type="number"
                    placeholder="Enter sell price"
                    step="0.01"
                    value={formData.sell_price}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sell_price: e.target.value }))}
                    required
                    min="0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 text-sm sm:text-base">Total Amount</label>
                  <p className="text-gray-100">{formatCurrency(calculateAmounts().total_amount)}</p>
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 text-sm sm:text-base">Paid Amount</label>
                  <p className="text-gray-100">{formatCurrency(calculateAmounts().paid_amount)}</p>
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 text-sm sm:text-base">Due Amount</label>
                  <p className="text-gray-100">{formatCurrency(calculateAmounts().due_amount)}</p>
                </div>
                <div>
                  <label htmlFor="stock-status" className="block text-gray-300 mb-1 text-sm sm:text-base">Status</label>
                  <select
                    id="stock-status"
                    value={formData.status}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: Number(e.target.value) }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100"
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
                      setEditingStock(null);
                      setFormData({
                        product_id: '',
                        supplier_id: '',
                        warehouse_id: '',
                        user_id: '',
                        transactions: [{ payment_type_id: '', amount: '' }],
                        quantity: '',
                        buy_price: '',
                        sell_price: '',
                        stock_date: '',
                        status: 0,
                      });
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddOrUpdateStock}
                    className={`px-4 py-2 rounded-lg text-white ${
                      isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (editingStock ? 'Updating...' : 'Adding...') : (editingStock ? 'Update' : 'Add')}
                  </button>
                </div>
              </div>
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
            onClick={(e) => e.target === e.currentTarget && setIsDeleteModalOpen(false)}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-[80vw] md:max-w-[600px]"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="delete-modal-title"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 id="delete-modal-title" className="text-lg sm:text-xl font-bold text-white">Confirm Deletion</h3>
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  aria-label="Close delete modal"
                >
                  <FiX />
                </button>
              </div>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Are you sure you want to delete stock ID {stockToDelete?.id} for product "{stockToDelete?.product?.name || 'N/A'}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStock}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white"
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

export default Stock;