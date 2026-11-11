
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiSearch, FiEdit, FiTrash2, FiPlus, FiX, FiChevronLeft, FiChevronRight, FiImage, FiMinusCircle } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import debounce from 'lodash/debounce';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://192.168.0.109:8000/api/';
const API_URL = `${API_BASE_URL}sells`;
const USERS_API_URL = `${API_BASE_URL}users`;
const CUSTOMERS_API_URL = `${API_BASE_URL}customers`;
const RETAIL_CUSTOMERS_API_URL = `${API_BASE_URL}retail-customers`;
const PAYMENT_TYPES_API_URL = `${API_BASE_URL}payment-types`;

const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return !url.includes('via.placeholder.com') && url.startsWith(API_BASE_URL.replace('/api/', ''));
  } catch {
    return false;
  }
};

const Sell = () => {
  const [sells, setSells] = useState([]);
  const [users, setUsers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [retailCustomers, setRetailCustomers] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSell, setNewSell] = useState({
    total_amount: '',
    paid_amount: '',
    due_amount: '',
    total_profit: '',
    discount: '',
    net_profit: '',
    user_id: '',
    customer_id: '',
    retail_customer_id: '',
    image: null,
    status: 1,
    transactions: [{ payment_type_id: '', amount: '' }],
  });
  const [editingSell, setEditingSell] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [sellToDelete, setSellToDelete] = useState(null);

  // Calculate paid_amount from transactions
  const calculatePaidAmount = useCallback(() => {
    const total = newSell.transactions.reduce((sum, txn) => {
      const amount = Number(txn.amount) || 0;
      return sum + amount;
    }, 0);
    return total.toFixed(2);
  }, [newSell.transactions]);

  const fetchSells = useCallback(async () => {
    setError(null);
    try {
      const endpoint = searchTerm
        ? `search?search=${encodeURIComponent(searchTerm)}&limit=${itemsPerPage}&page=${currentPage}`
        : `paginated?limit=${itemsPerPage}&page=${currentPage}`;
      const url = `${API_URL}/${endpoint}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to fetch sells: ${response.status} ${response.statusText}`;
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
      setSells(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.last_page || 1);
      setTotalItems(data.total || data.data.length || 0);
    } catch (err) {
      setError(`Failed to load sells: ${err.message}. Please try again.`);
      toast.error(`Failed to load sells: ${err.message}`);
    }
  }, [currentPage, itemsPerPage, searchTerm]);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await fetch(USERS_API_URL, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
      }
      const json = await response.json();
      setUsers(Array.isArray(json) ? json : (json.status && Array.isArray(json.data) ? json.data : []));
    } catch (err) {
      toast.error(`Failed to fetch users: ${err.message}`);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    try {
      const response = await fetch(CUSTOMERS_API_URL, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch customers: ${response.status} ${response.statusText}`);
      }
      const json = await response.json();
      setCustomers(Array.isArray(json) ? json : (json.status && Array.isArray(json.data) ? json.data : []));
    } catch (err) {
      toast.error(`Failed to fetch customers: ${err.message}`);
    }
  }, []);

  const fetchRetailCustomers = useCallback(async () => {
    try {
      const response = await fetch(RETAIL_CUSTOMERS_API_URL, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch retail customers: ${response.status} ${response.statusText}`);
      }
      const json = await response.json();
      setRetailCustomers(Array.isArray(json) ? json : (json.status && Array.isArray(json.data) ? json.data : []));
    } catch (err) {
      toast.error(`Failed to fetch retail customers: ${err.message}`);
    }
  }, []);

  const fetchPaymentTypes = useCallback(async () => {
    try {
      const response = await fetch(PAYMENT_TYPES_API_URL, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch payment types: ${response.status} ${response.statusText}`);
      }
      const json = await response.json();
      setPaymentTypes(Array.isArray(json) ? json : (json.status && Array.isArray(json.data) ? json.data : []));
    } catch (err) {
      toast.error(`Failed to fetch payment types: ${err.message}`);
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
    fetchSells();
    fetchUsers();
    fetchCustomers();
    fetchRetailCustomers();
    fetchPaymentTypes();
  }, [fetchSells, fetchUsers, fetchCustomers, fetchRetailCustomers, fetchPaymentTypes]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        setIsModalOpen(false);
        setEditingSell(null);
        setNewSell({
          total_amount: '',
          paid_amount: '',
          due_amount: '',
          total_profit: '',
          discount: '',
          net_profit: '',
          user_id: '',
          customer_id: '',
          retail_customer_id: '',
          image: null,
          status: 1,
          transactions: [{ payment_type_id: '', amount: '' }],
        });
        setIsDeleteModalOpen(false);
        setSellToDelete(null);
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

  const handleImageUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (file && ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type) && file.size <= 2 * 1024 * 1024) {
      setNewSell((prev) => ({ ...prev, image: file }));
    } else {
      toast.error('Please upload a JPEG, PNG, JPG, or WebP image under 2MB.');
    }
  }, []);

  const handleAddTransaction = useCallback(() => {
    setNewSell((prev) => ({
      ...prev,
      transactions: [...prev.transactions, { payment_type_id: '', amount: '' }],
    }));
  }, []);

  const handleRemoveTransaction = useCallback((index) => {
    setNewSell((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((_, i) => i !== index),
    }));
  }, []);

  const handleTransactionChange = useCallback((index, field, value) => {
    setNewSell((prev) => {
      const updatedTransactions = [...prev.transactions];
      updatedTransactions[index] = { ...updatedTransactions[index], [field]: value };
      return { ...prev, transactions: updatedTransactions };
    });
  }, []);

  const handleAddOrUpdateSell = useCallback(
    async (e) => {
      e.preventDefault();
      // Client-side validation
      if (!newSell.total_amount || !newSell.user_id || !newSell.customer_id || !newSell.retail_customer_id) {
        toast.error('Total amount, user, customer, and retail customer are required.');
        return;
      }
      if (Number(newSell.total_amount) < 0) {
        toast.error('Total amount cannot be negative.');
        return;
      }
      if (newSell.discount && Number(newSell.discount) < 0) {
        toast.error('Discount cannot be negative.');
        return;
      }
      if (newSell.total_profit && Number(newSell.total_profit) < 0) {
        toast.error('Total profit cannot be negative.');
        return;
      }
      if (newSell.net_profit && Number(newSell.net_profit) < 0) {
        toast.error('Net profit cannot be negative.');
        return;
      }
      // Validate transactions
      if (newSell.transactions.length === 0) {
        toast.error('At least one transaction is required.');
        return;
      }
      for (let i = 0; i < newSell.transactions.length; i++) {
        const txn = newSell.transactions[i];
        if (!txn.payment_type_id || !txn.amount) {
          toast.error(`Transaction ${i + 1}: Payment type and amount are required.`);
          return;
        }
        if (Number(txn.amount) <= 0) {
          toast.error(`Transaction ${i + 1}: Amount must be greater than 0.`);
          return;
        }
      }
      const calculatedPaidAmount = calculatePaidAmount();
      if (Number(calculatedPaidAmount) > Number(newSell.total_amount)) {
        toast.error('Paid amount cannot exceed total amount.');
        return;
      }
      if (Number(calculatedPaidAmount) !== Number(newSell.paid_amount)) {
        setNewSell((prev) => ({ ...prev, paid_amount: calculatedPaidAmount }));
        toast.info('Paid amount updated to match sum of transaction amounts.');
      }

      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('total_amount', newSell.total_amount);
        formData.append('paid_amount', calculatedPaidAmount);
        formData.append('due_amount', (Number(newSell.total_amount) - Number(calculatedPaidAmount)).toFixed(2));
        formData.append('total_profit', newSell.total_profit || '0.00');
        formData.append('discount', newSell.discount || '0.00');
        formData.append('net_profit', newSell.net_profit || '0.00');
        formData.append('user_id', newSell.user_id);
        formData.append('customer_id', newSell.customer_id);
        formData.append('retail_customer_id', newSell.retail_customer_id);
        formData.append('status', newSell.status ? '1' : '0');
        if (newSell.image instanceof File) {
          formData.append('image', newSell.image);
        }
        // Append transactions
        newSell.transactions.forEach((txn, index) => {
          formData.append(`transactions[${index}][payment_type_id]`, txn.payment_type_id);
          formData.append(`transactions[${index}][amount]`, txn.amount);
        });
        if (editingSell) {
          formData.append('_method', 'PUT');
        }
        const url = editingSell ? `${API_URL}/${editingSell.id}` : API_URL;
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = editingSell ? `Failed to update sell: ${response.statusText}` : `Failed to add sell: ${response.statusText}`;
          if (response.status === 422) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = `Validation error: ${errorJson.errors ? Object.values(errorJson.errors).flat().join(', ') : errorJson.message}`;
            } catch (e) {
              // Non-JSON error response
            }
          } else if (response.status === 404) {
            errorMessage = 'Sell not found or API endpoint unavailable.';
          } else if (response.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          throw new Error(errorMessage);
        }
        const json = await response.json();
        toast.success(json.message || (editingSell ? 'Sell updated successfully' : 'Sell created successfully'));
        await fetchSells();
        setIsModalOpen(false);
        setNewSell({
          total_amount: '',
          paid_amount: '',
          due_amount: '',
          total_profit: '',
          discount: '',
          net_profit: '',
          user_id: '',
          customer_id: '',
          retail_customer_id: '',
          image: null,
          status: 1,
          transactions: [{ payment_type_id: '', amount: '' }],
        });
        setEditingSell(null);
      } catch (err) {
        setError(`Failed to save sell: ${err.message}. Please try again.`);
        toast.error(`Failed to save sell: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingSell, newSell, fetchSells, calculatePaidAmount]
  );

  const handleDeleteSell = useCallback(async () => {
    if (!sellToDelete) return;
    try {
      const url = `${API_URL}/${sellToDelete.id}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to delete sell: ${response.statusText}`;
        if (response.status === 404) {
          errorMessage = 'Sell not found or API endpoint unavailable.';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }
        throw new Error(errorMessage);
      }
      const json = await response.json();
      toast.success(json.message || 'Sell deleted successfully');
      if (sells.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
      await fetchSells();
    } catch (err) {
      setError(`Failed to delete sell: ${err.message}. Please try again.`);
      toast.error(`Failed to delete sell: ${err.message}`);
    } finally {
      setIsDeleteModalOpen(false);
      setSellToDelete(null);
    }
  }, [sellToDelete, sells.length, currentPage, fetchSells]);

  const handleOpenDeleteModal = useCallback((sell) => {
    setSellToDelete(sell);
    setIsDeleteModalOpen(true);
  }, []);

  const handleEditSell = useCallback((sell) => {
    setEditingSell(sell);
    setNewSell({
      total_amount: sell.total_amount || '',
      paid_amount: sell.paid_amount || '',
      due_amount: sell.due_amount || '',
      total_profit: sell.total_profit || '',
      discount: sell.discount || '',
      net_profit: sell.net_profit || '',
      user_id: sell.user_id || '',
      customer_id: sell.customer_id || '',
      retail_customer_id: sell.retail_customer_id || '',
      image: null,
      status: sell.status ? 1 : 0,
      transactions: sell.transactions?.length > 0 ? sell.transactions : [{ payment_type_id: '', amount: '' }],
    });
  }, []);

  const toggleStatus = useCallback(
    async (id, currentStatus) => {
      try {
        const formData = new FormData();
        formData.append('status', currentStatus ? '0' : '1');
        formData.append('_method', 'PUT');
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = `Failed to update status: ${response.statusText}`;
          if (response.status === 404) {
            errorMessage = 'Sell not found or API endpoint unavailable.';
          } else if (response.status === 500) {
            errorMessage = 'Server error. Please try again later.';
          }
          throw new Error(errorMessage);
        }
        const json = await response.json();
        toast.success(json.message || 'Status updated successfully');
        await fetchSells();
      } catch (err) {
        setError(`Failed to update status: ${err.message}. Please try again.`);
        toast.error(`Failed to update status: ${err.message}`);
      }
    },
    [fetchSells]
  );

  const getImagePreviewUrl = useCallback(() => {
    if (newSell.image instanceof File) {
      return URL.createObjectURL(newSell.image);
    }
    if (editingSell && editingSell.image && !newSell.image && isValidUrl(editingSell.image)) {
      return editingSell.image;
    }
    return null;
  }, [newSell.image, editingSell]);

  const getSellImageUrl = useCallback((image) => {
    return image && isValidUrl(image) ? image : null;
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
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Sell Management</h2>
        <button
          onClick={() => {
            setEditingSell(null);
            setNewSell({
              total_amount: '',
              paid_amount: '',
              due_amount: '',
              total_profit: '',
              discount: '',
              net_profit: '',
              user_id: '',
              customer_id: '',
              retail_customer_id: '',
              image: null,
              status: 1,
              transactions: [{ payment_type_id: '', amount: '' }],
            });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors w-full sm:w-auto"
        >
          <FiPlus className="mr-2" /> Add New Sell
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search sells by customer, retail customer, or user name..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 placeholder-gray-400 text-sm sm:text-base"
            aria-label="Search sells"
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
      {sells.length === 0 ? (
        <div className="text-center text-gray-300 text-sm sm:text-base">{searchTerm ? 'No sells match your search' : 'No sells available'}</div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="block md:hidden">
              {sells.map((sell) => (
                <motion.div
                  key={sell.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-gray-700 p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getSellImageUrl(sell.image) ? (
                        <img
                          src={getSellImageUrl(sell.image)}
                          alt={`Sell ${sell.id}`}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs">
                          <FiImage className="w-5 h-5" />
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs hidden">
                        <FiImage className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-300 font-medium">Sell ID: {sell.id}</div>
                      <div className="text-gray-400 text-sm">Total Amount: ${sell.total_amount}</div>
                      <div className="text-gray-400 text-sm">Paid Amount: ${sell.paid_amount}</div>
                      <div className="text-gray-400 text-sm">Due Amount: ${sell.due_amount}</div>
                      <div className="text-gray-400 text-sm">Total Profit: ${sell.total_profit}</div>
                      <div className="text-gray-400 text-sm">Discount: ${sell.discount}</div>
                      <div className="text-gray-400 text-sm">Net Profit: ${sell.net_profit}</div>
                      <div className="text-gray-400 text-sm">User: {sell.user?.name || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Customer: {sell.customer?.name || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Retail Customer: {sell.retail_customer?.name || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">
                        Transactions:{' '}
                        {sell.transactions?.length > 0
                          ? sell.transactions.map((txn) => (
                              <span key={txn.id} className="block">
                                {paymentTypes.find((pt) => pt.id === txn.payment_type_id)?.name || 'Unknown'}: ${txn.amount}
                              </span>
                            ))
                          : 'None'}
                      </div>
                      <div
                        className={`mt-1 px-2 py-1 rounded-full text-xs inline-block cursor-pointer ${
                          sell.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                        onClick={() => toggleStatus(sell.id, sell.status)}
                      >
                        {sell.status ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSell(sell)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit sell ${sell.id}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(sell)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete sell ${sell.id}`}
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
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Paid Amount</th>
                  <th className="p-4">Due Amount</th>
                  <th className="p-4">Total Profit</th>
                  <th className="p-4">Discount</th>
                  <th className="p-4">Net Profit</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Retail Customer</th>
                  <th className="p-4">Transactions</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sells.map((sell) => (
                  <motion.tr
                    key={sell.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-gray-700 hover:bg-gray-700 transition-colors"
                  >
                    <td className="p-4 text-gray-300">{sell.id}</td>
                    <td className="p-4">
                      {getSellImageUrl(sell.image) ? (
                        <img
                          src={getSellImageUrl(sell.image)}
                          alt={`Sell ${sell.id}`}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs">
                          <FiImage className="w-5 h-5" />
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs hidden">
                        <FiImage className="w-5 h-5" />
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">${sell.total_amount}</td>
                    <td className="p-4 text-gray-300">${sell.paid_amount}</td>
                    <td className="p-4 text-gray-300">${sell.due_amount}</td>
                    <td className="p-4 text-gray-300">${sell.total_profit}</td>
                    <td className="p-4 text-gray-300">${sell.discount}</td>
                    <td className="p-4 text-gray-300">${sell.net_profit}</td>
                    <td className="p-4 text-gray-300">{sell.user?.name || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{sell.customer?.name || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{sell.retail_customer?.name || 'N/A'}</td>
                    <td className="p-4 text-gray-300">
                      {sell.transactions?.length > 0
                        ? sell.transactions.map((txn) => (
                            <span key={txn.id} className="block">
                              {paymentTypes.find((pt) => pt.id === txn.payment_type_id)?.name || 'Unknown'}: ${txn.amount}
                            </span>
                          ))
                        : 'None'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs cursor-pointer ${
                          sell.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                        onClick={() => toggleStatus(sell.id, sell.status)}
                      >
                        {sell.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 flex space-x-2">
                      <button
                        onClick={() => handleEditSell(sell)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit sell ${sell.id}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(sell)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete sell ${sell.id}`}
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
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} sells
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
                setEditingSell(null);
                setNewSell({
                  total_amount: '',
                  paid_amount: '',
                  due_amount: '',
                  total_profit: '',
                  discount: '',
                  net_profit: '',
                  user_id: '',
                  customer_id: '',
                  retail_customer_id: '',
                  image: null,
                  status: 1,
                  transactions: [{ payment_type_id: '', amount: '' }],
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
                  {editingSell ? 'Edit Sell' : 'Add New Sell'}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSell(null);
                    setNewSell({
                      total_amount: '',
                      paid_amount: '',
                      due_amount: '',
                      total_profit: '',
                      discount: '',
                      net_profit: '',
                      user_id: '',
                      customer_id: '',
                      retail_customer_id: '',
                      image: null,
                      status: 1,
                      transactions: [{ payment_type_id: '', amount: '' }],
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
                  <label htmlFor="sell-total-amount" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Total Amount
                  </label>
                  <input
                    id="sell-total-amount"
                    type="number"
                    step="0.01"
                    placeholder='Enter total amount'
                    value={newSell.total_amount}
                    onChange={(e) => setNewSell((prev) => ({ ...prev, total_amount: e.target.value }))}
                    required
                    min="0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="sell-paid-amount" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Paid Amount (Calculated from Transactions)
                  </label>
                  <p className="text-gray-100 text-sm sm:text-base">${calculatePaidAmount()}</p>
                  <input
                    id="sell-paid-amount"
                    type="hidden"
                    placeholder='Enter paid amount'
                    value={newSell.paid_amount}
                    className="hidden"
                  />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 text-sm sm:text-base">Due Amount</label>
                  <p className="text-gray-100 text-sm sm:text-base">
                    ${(newSell.total_amount && newSell.transactions.length > 0 ? (Number(newSell.total_amount) - Number(calculatePaidAmount())).toFixed(2) : '0.00')}
                  </p>
                </div>
                <div>
                  <label htmlFor="sell-total-profit" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Total Profit (optional)
                  </label>
                  <input
                    id="sell-total-profit"
                    type="number"
                    placeholder='Enter total profit'
                    step="0.01"
                    value={newSell.total_profit}
                    onChange={(e) => setNewSell((prev) => ({ ...prev, total_profit: e.target.value }))}
                    min="0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="sell-discount" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Discount (optional)
                  </label>
                  <input
                    id="sell-discount"
                    type="number"
                    step="0.01"
                    placeholder='Enter discount'
                    value={newSell.discount}
                    onChange={(e) => setNewSell((prev) => ({ ...prev, discount: e.target.value }))}
                    min="0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="sell-net-profit" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Net Profit (optional)
                  </label>
                  <input
                    id="sell-net-profit"
                    type="number"
                    placeholder='Enter net profit'
                    step="0.01"
                    value={newSell.net_profit}
                    onChange={(e) => setNewSell((prev) => ({ ...prev, net_profit: e.target.value }))}
                    min="0"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="sell-user" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    User
                  </label>
                  <select
                    id="sell-user"
                    value={newSell.user_id}
                    onChange={(e) => setNewSell((prev) => ({ ...prev, user_id: e.target.value }))}
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
                  <label htmlFor="sell-customer" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Customer
                  </label>
                  <select
                    id="sell-customer"
                    value={newSell.customer_id}
                    onChange={(e) => setNewSell((prev) => ({ ...prev, customer_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>{customer.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="sell-retail-customer" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Retail Customer
                  </label>
                  <select
                    id="sell-retail-customer"
                    value={newSell.retail_customer_id}
                    onChange={(e) => setNewSell((prev) => ({ ...prev, retail_customer_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a retail customer</option>
                    {retailCustomers.map((retailCustomer) => (
                      <option key={retailCustomer.id} value={retailCustomer.id}>{retailCustomer.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 text-sm sm:text-base">Transactions</label>
                  {newSell.transactions.map((txn, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-2 mb-2 items-start sm:items-center">
                      <select
                        value={txn.payment_type_id}
                        onChange={(e) => handleTransactionChange(index, 'payment_type_id', e.target.value)}
                        required
                        className="w-full sm:w-1/2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
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
                        value={txn.amount}
                        onChange={(e) => handleTransactionChange(index, 'amount', e.target.value)}
                        required
                        min="0"
                        placeholder="Amount"
                        className="w-full sm:w-1/2 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                        disabled={isSubmitting}
                      />
                      {newSell.transactions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTransaction(index)}
                          className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                          disabled={isSubmitting}
                          aria-label={`Remove transaction ${index + 1}`}
                        >
                          <FiMinusCircle />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddTransaction}
                    className="flex items-center px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-sm sm:text-base mt-2"
                    disabled={isSubmitting}
                  >
                    <FiPlus className="mr-1" /> Add Transaction
                  </button>
                </div>
                <div>
                  <label htmlFor="sell-image" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Image (optional)
                  </label>
                  {getImagePreviewUrl() ? (
                    <img
                      src={getImagePreviewUrl()}
                      alt="Image preview"
                      className="w-12 h-12 rounded-full object-cover mb-2"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs mb-2">
                      <FiImage className="w-5 h-5" />
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs mb-2 hidden">
                    <FiImage className="w-5 h-5" />
                  </div>
                  <input
                    id="sell-image"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={handleImageUpload}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="sell-status" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Status
                  </label>
                  <select
                    id="sell-status"
                    value={newSell.status}
                    onChange={(e) => setNewSell((prev) => ({ ...prev, status: Number(e.target.value) }))}
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
                      setEditingSell(null);
                      setNewSell({
                        total_amount: '',
                        paid_amount: '',
                        due_amount: '',
                        total_profit: '',
                        discount: '',
                        net_profit: '',
                        user_id: '',
                        customer_id: '',
                        retail_customer_id: '',
                        image: null,
                        status: 1,
                        transactions: [{ payment_type_id: '', amount: '' }],
                      });
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddOrUpdateSell}
                    className={`px-4 py-2 rounded-lg text-white text-sm sm:text-base ${
                      isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (editingSell ? 'Updating...' : 'Adding...') : (editingSell ? 'Update' : 'Add')}
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
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsDeleteModalOpen(false);
                setSellToDelete(null);
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
                    setSellToDelete(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  aria-label="Close delete modal"
                >
                  <FiX />
                </button>
              </div>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Are you sure you want to delete sell ID {sellToDelete?.id} for customer "{sellToDelete?.customer?.name || 'N/A'}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSellToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSell}
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

export default Sell;
