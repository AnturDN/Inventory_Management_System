
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import { FiSearch, FiEdit, FiTrash2, FiPlus, FiX, FiChevronLeft, FiChevronRight, FiArrowRight } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import debounce from 'lodash/debounce';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://192.168.0.231:8000/api/';
const API_URL = `${API_BASE_URL}transactions`;
const STOCKS_API_URL = `${API_BASE_URL}stocks`;
const EXPENSES_API_URL = `${API_BASE_URL}expenses`;
const PAYMENT_TYPES_API_URL = `${API_BASE_URL}payment-types`;
const USERS_API_URL = `${API_BASE_URL}users`;
const INVESTMENTS_API_URL = `${API_BASE_URL}investments`;

const Transaction = () => {
  const [transactions, setTransactions] = useState({
    data: [],
    current_page: 1,
    total: 0,
    per_page: 10,
    from: 0,
    to: 0,
    last_page: 1,
  });
  const [stocks, setStocks] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [formData, setFormData] = useState({
    type: 'In',
    stock_id: '',
    expense_id: '',
    investment_id: '',
    payment_type_id: '',
    others: '',
    comments: '',
    amount: '',
    user_id: '',
    status: 1,
  });
  const [transferFormData, setTransferFormData] = useState({
    user_id: '',
    out: { payment_type_id: '' },
    to: { payment_type_id: '' },
    shared: { amount: '', status: 1 },
  });

  // Fetch transactions (paginated or search-based)
  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = searchTerm
        ? `${API_URL}/search?limit=${itemsPerPage}&search=${encodeURIComponent(searchTerm)}&page=${transactions.current_page}`
        : `${API_URL}/paginated?limit=${itemsPerPage}&page=${transactions.current_page}`;
      const response = await axios.get(endpoint, {
        headers: { Accept: 'application/json' },
      });
      if (response.data.status && response.data.data) {
        setTransactions(response.data.data);
      } else {
        throw new Error('Invalid response format for transactions');
      }
    } catch (err) {
      const errorMessage = err.response?.status === 404
        ? 'API endpoint not found. Please check the backend route configuration.'
        : err.response?.data?.message || `Failed to fetch transactions: ${err.message}`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [transactions.current_page, itemsPerPage, searchTerm]);

  // Fetch dropdown data
  const fetchStocks = useCallback(async () => {
    try {
      const response = await axios.get(STOCKS_API_URL, { headers: { Accept: 'application/json' } });
      setStocks(Array.isArray(response.data) ? response.data : response.data.status && Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      toast.error(err.response?.status === 404 ? 'Stocks API endpoint not found.' : err.response?.data?.message || 'Failed to fetch stocks');
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    try {
      const response = await axios.get(EXPENSES_API_URL, { headers: { Accept: 'application/json' } });
      setExpenses(Array.isArray(response.data) ? response.data : response.data.status && Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      toast.error(err.response?.status === 404 ? 'Expenses API endpoint not found.' : err.response?.data?.message || 'Failed to fetch expenses');
    }
  }, []);

  const fetchPaymentTypes = useCallback(async () => {
    try {
      const response = await axios.get(PAYMENT_TYPES_API_URL, { headers: { Accept: 'application/json' } });
      setPaymentTypes(Array.isArray(response.data) ? response.data : response.data.status && Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      toast.error(err.response?.status === 404 ? 'Payment Types API endpoint not found.' : err.response?.data?.message || 'Failed to fetch payment types');
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const response = await axios.get(USERS_API_URL, { headers: { Accept: 'application/json' } });
      setUsers(Array.isArray(response.data) ? response.data : response.data.status && Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      toast.error(err.response?.status === 404 ? 'Users API endpoint not found.' : err.response?.data?.message || 'Failed to fetch users');
    }
  }, []);

  const fetchInvestments = useCallback(async () => {
    try {
      const response = await axios.get(INVESTMENTS_API_URL, { headers: { Accept: 'application/json' } });
      setInvestments(Array.isArray(response.data) ? response.data : response.data.status && Array.isArray(response.data.data) ? response.data.data : []);
    } catch (err) {
      toast.error(err.response?.status === 404 ? 'Investments API endpoint not found.' : err.response?.data?.message || 'Failed to fetch investments');
    }
  }, []);

  // Debounced search handler
  const debouncedSearch = useCallback(debounce((value) => {
    setSearchTerm(value);
    setTransactions((prev) => ({ ...prev, current_page: 1 }));
  }, 300), []);

  // Fetch data on mount
  useEffect(() => {
    fetchTransactions();
    fetchStocks();
    fetchExpenses();
    fetchPaymentTypes();
    fetchUsers();
    fetchInvestments();
  }, [fetchTransactions, fetchStocks, fetchExpenses, fetchPaymentTypes, fetchUsers, fetchInvestments]);

  // Handle Escape key for closing modals
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        setIsModalOpen(false);
        setIsTransferModalOpen(false);
        setEditingTransaction(null);
        setFormData({ type: 'In', stock_id: '', expense_id: '', investment_id: '', payment_type_id: '', others: '', comments: '', amount: '', user_id: '', status: 1 });
        setTransferFormData({
          user_id: '',
          out: { payment_type_id: '' },
          to: { payment_type_id: '' },
          shared: { amount: '', status: 1 },
        });
        setIsDeleteModalOpen(false);
        setTransactionToDelete(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isSubmitting]);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= transactions.last_page) {
      setTransactions((prev) => ({ ...prev, current_page: page }));
    }
  }, [transactions.last_page]);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((e) => {
    const value = Number(e.target.value);
    setItemsPerPage(value);
    setTransactions((prev) => ({ ...prev, current_page: 1 }));
  }, []);

  // Handle add/edit transaction
  const handleAddOrUpdateTransaction = useCallback(async (e) => {
    e.preventDefault();
    if (!formData.type || !formData.amount || !formData.user_id) {
      toast.error('Type, amount, and user are required.');
      return;
    }
    if (Number(formData.amount) <= 0) {
      toast.error('Amount must be greater than 0.');
      return;
    }
    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append('type', formData.type);
      data.append('stock_id', formData.stock_id || '');
      data.append('expense_id', formData.expense_id || '');
      data.append('investment_id', formData.investment_id || '');
      data.append('payment_type_id', formData.payment_type_id || '');
      data.append('others', formData.others || '');
      data.append('comments', formData.comments || '');
      data.append('amount', formData.amount);
      data.append('user_id', formData.user_id);
      data.append('status', formData.status ? '1' : '0');

      const response = editingTransaction
        ? await axios.post(`${API_URL}/${editingTransaction.id}`, data, { headers: { 'Content-Type': 'multipart/form-data' }, params: { _method: 'PUT' } })
        : await axios.post(API_URL, data, { headers: { 'Content-Type': 'multipart/form-data' } });

      toast.success(response.data.message || (editingTransaction ? 'Transaction updated successfully' : 'Transaction created successfully'));
      await fetchTransactions();
      setIsModalOpen(false);
      setEditingTransaction(null);
      setFormData({ type: 'In', stock_id: '', expense_id: '', investment_id: '', payment_type_id: '', others: '', comments: '', amount: '', user_id: '', status: 1 });
    } catch (err) {
      const errorMessage = err.response?.status === 422
        ? Object.values(err.response.data.errors || {}).flat().join(', ') || 'Validation failed'
        : err.response?.status === 404
        ? 'API endpoint not found.'
        : err.response?.data?.message || 'Operation failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [editingTransaction, formData, fetchTransactions]);

  // Handle transfer fund
  const handleTransferFund = useCallback(async (e) => {
    e.preventDefault();
    const { user_id, out, to, shared } = transferFormData;
    if (!shared.amount || !user_id || !out.payment_type_id || !to.payment_type_id) {
      toast.error('Amount, user, and both payment types are required.');
      return;
    }
    if (Number(shared.amount) <= 0) {
      toast.error('Amount must be greater than 0.');
      return;
    }
    if (out.payment_type_id === to.payment_type_id) {
      toast.error('Source and destination payment types must be different.');
      return;
    }
    setIsSubmitting(true);
    try {
      const transferReference = `TRANSFER-${Date.now()}`;
      const outData = new FormData();
      outData.append('type', 'Out');
      outData.append('payment_type_id', out.payment_type_id);
      outData.append('amount', shared.amount);
      outData.append('user_id', user_id);
      outData.append('status', shared.status ? '1' : '0');
      outData.append('comments', `Transfer Out (Ref: ${transferReference})`);

      const toData = new FormData();
      toData.append('type', 'In');
      toData.append('payment_type_id', to.payment_type_id);
      toData.append('amount', shared.amount);
      toData.append('user_id', user_id);
      toData.append('status', shared.status ? '1' : '0');
      toData.append('comments', `Transfer In (Ref: ${transferReference})`);

      await Promise.all([
        axios.post(API_URL, outData, { headers: { 'Content-Type': 'multipart/form-data' } }),
        axios.post(API_URL, toData, { headers: { 'Content-Type': 'multipart/form-data' } }),
      ]);

      toast.success('Transfer completed successfully');
      await fetchTransactions();
      setIsTransferModalOpen(false);
      setTransferFormData({
        user_id: '',
        out: { payment_type_id: '' },
        to: { payment_type_id: '' },
        shared: { amount: '', status: 1 },
      });
    } catch (err) {
      const errorMessage = err.response?.status === 422
        ? Object.values(err.response.data.errors || {}).flat().join(', ') || 'Validation failed'
        : err.response?.status === 404
        ? 'API endpoint not found.'
        : err.response?.data?.message || 'Transfer failed';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [transferFormData, fetchTransactions]);

  // Handle delete transaction
  const handleDeleteTransaction = useCallback(async () => {
    if (!transactionToDelete) return;
    try {
      const response = await axios.delete(`${API_URL}/${transactionToDelete.id}`);
      toast.success(response.data.message || 'Transaction deleted successfully');
      if (transactions.data.length === 1 && transactions.current_page > 1) {
        setTransactions((prev) => ({ ...prev, current_page: prev.current_page - 1 }));
      }
      await fetchTransactions();
    } catch (err) {
      const errorMessage = err.response?.status === 404
        ? 'Transaction not found or API endpoint unavailable.'
        : err.response?.data?.message || 'Failed to delete transaction';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleteModalOpen(false);
      setTransactionToDelete(null);
    }
  }, [transactionToDelete, transactions.data.length, transactions.current_page, fetchTransactions]);

  // Handle edit transaction
  const handleEditTransaction = useCallback((transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type || 'In',
      stock_id: transaction.stock_id || '',
      expense_id: transaction.expense_id || '',
      investment_id: transaction.investment_id || '',
      payment_type_id: transaction.payment_type_id || '',
      others: transaction.others || '',
      comments: transaction.comments || '',
      amount: transaction.amount || '',
      user_id: transaction.user_id || '',
      status: transaction.status ? 1 : 0,
    });
    setIsModalOpen(true);
  }, []);

  // Handle status toggle
  const toggleStatus = useCallback(async (id, currentStatus) => {
    try {
      const data = new FormData();
      data.append('status', currentStatus ? '0' : '1');
      data.append('_method', 'PUT');
      const response = await axios.post(`${API_URL}/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(response.data.message || 'Status updated successfully');
      await fetchTransactions();
    } catch (err) {
      const errorMessage = err.response?.status === 404
        ? 'Transaction not found or API endpoint unavailable.'
        : err.response?.data?.message || 'Failed to update status';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  }, [fetchTransactions]);

  // Modal variants for animation
  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-900 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme="dark" />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Transaction Management</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => {
              setEditingTransaction(null);
              setFormData({ type: 'In', stock_id: '', expense_id: '', investment_id: '', payment_type_id: '', others: '', comments: '', amount: '', user_id: '', status: 1 });
              setIsModalOpen(true);
            }}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors w-full sm:w-auto"
          >
            <FiPlus className="mr-2" /> Add New Transaction
          </button>
          <button
            onClick={() => {
              setTransferFormData({
                user_id: '',
                out: { payment_type_id: '' },
                to: { payment_type_id: '' },
                shared: { amount: '', status: 1 },
              });
              setIsTransferModalOpen(true);
            }}
            className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white transition-colors w-full sm:w-auto"
          >
            <FiArrowRight className="mr-2" /> Transfer Funds
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search transactions by type, others, or comments..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 placeholder-gray-400 text-sm sm:text-base"
            aria-label="Search transactions"
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
        <div className="mb-4 p-4 bg-red-900/30 text-red-400 rounded-lg text-sm sm:text-base">{error}</div>
      )}

      {isLoading ? (
        <div className="text-center text-gray-300 text-sm sm:text-base">Loading transactions...</div>
      ) : transactions.data.length === 0 ? (
        <div className="text-center text-gray-300 text-sm sm:text-base">{searchTerm ? 'No transactions match your search' : 'No transactions available'}</div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            {/* Mobile view: Card layout */}
            <div className="block md:hidden">
              {transactions.data.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-gray-700 p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="text-gray-300 font-medium">Transaction ID: {transaction.id}</div>
                      <div className="text-gray-400 text-sm">Type: {transaction.type}</div>
                      <div className="text-gray-400 text-sm">Stock: {transaction.stock?.id || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Expense ID: {transaction.expense_id || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Investment ID: {transaction.investment_id || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Payment Type: {transaction.payment_type?.name || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Others: {transaction.others || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Comments: {transaction.comments || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Amount: ${transaction.amount}</div>
                      <div className="text-gray-400 text-sm">User: {transaction.user?.name || 'N/A'}</div>
                      <div
                        className={`mt-1 px-2 py-1 rounded-full text-xs inline-block cursor-pointer ${
                          transaction.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                        onClick={() => toggleStatus(transaction.id, transaction.status)}
                      >
                        {transaction.status ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit transaction ${transaction.id}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => setTransactionToDelete(transaction) && setIsDeleteModalOpen(true)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete transaction ${transaction.id}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop view: Table layout */}
            <table className="hidden md:table w-full">
              <thead>
                <tr className="bg-gray-700 text-gray-300 text-left">
                  <th className="p-4">ID</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Stock ID</th>
                  <th className="p-4">Expense ID</th>
                  <th className="p-4">Investment ID</th>
                  <th className="p-4">Payment Type</th>
                  <th className="p-4">Others</th>
                  <th className="p-4">Comments</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.data.map((transaction) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-gray-700 hover:bg-gray-700 transition-colors"
                  >
                    <td className="p-4 text-gray-300">{transaction.id}</td>
                    <td className="p-4 text-gray-300">{transaction.type}</td>
                    <td className="p-4 text-gray-300">{transaction.stock?.id || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{transaction.expense_id || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{transaction.investment_id || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{transaction.payment_type?.name || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{transaction.others || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{transaction.comments || 'N/A'}</td>
                    <td className="p-4 text-gray-300">${transaction.amount}</td>
                    <td className="p-4 text-gray-300">{transaction.user?.name || 'N/A'}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs cursor-pointer ${
                          transaction.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                        onClick={() => toggleStatus(transaction.id, transaction.status)}
                      >
                        {transaction.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 flex space-x-2">
                      <button
                        onClick={() => handleEditTransaction(transaction)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit transaction ${transaction.id}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => setTransactionToDelete(transaction) && setIsDeleteModalOpen(true)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete transaction ${transaction.id}`}
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
              Showing {transactions.from || 0} to {transactions.to || 0} of {transactions.total || 0} transactions
            </p>
            <div className="flex justify-center sm:justify-end space-x-2">
              <button
                onClick={() => handlePageChange(transactions.current_page - 1)}
                disabled={transactions.current_page === 1}
                className="p-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-50 hover:bg-gray-600"
                aria-label="Previous page"
              >
                <FiChevronLeft />
              </button>
              {Array.from({ length: transactions.last_page }, (_, i) => i + 1)
                .filter((page) => page === 1 || page === transactions.last_page || (page >= transactions.current_page - 2 && page <= transactions.current_page + 2))
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                      transactions.current_page === page ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                    aria-label={`Page ${page}`}
                  >
                    {page}
                  </button>
                ))}
              <button
                onClick={() => handlePageChange(transactions.current_page + 1)}
                disabled={transactions.current_page === transactions.last_page}
                className="p-2 rounded-lg bg-gray-700 text-gray-300 disabled:opacity-50 hover:bg-gray-600"
                aria-label="Next page"
              >
                <FiChevronRight />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Add/Edit Transaction Modal */}
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
                setEditingTransaction(null);
                setFormData({ type: 'In', stock_id: '', expense_id: '', investment_id: '', payment_type_id: '', others: '', comments: '', amount: '', user_id: '', status: 1 });
              }
            }}
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
                  {editingTransaction ? 'Edit Transaction' : 'Add New Transaction'}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTransaction(null);
                    setFormData({ type: 'In', stock_id: '', expense_id: '', investment_id: '', payment_type_id: '', others: '', comments: '', amount: '', user_id: '', status: 1 });
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  disabled={isSubmitting}
                  aria-label="Close modal"
                >
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleAddOrUpdateTransaction} className="space-y-4">
                <div>
                  <label htmlFor="transaction-type" className="block text-gray-300 mb-1 text-sm sm:text-base">Type</label>
                  <select
                    id="transaction-type"
                    value={formData.type}
                    onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="In">In</option>
                    <option value="Out">Out</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="transaction-stock" className="block text-gray-300 mb-1 text-sm sm:text-base">Stock (Optional)</label>
                  <select
                    id="transaction-stock"
                    value={formData.stock_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, stock_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a stock</option>
                    {stocks.map((stock) => (
                      <option key={stock.id} value={stock.id}>Stock (ID: {stock.id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="transaction-expense" className="block text-gray-300 mb-1 text-sm sm:text-base">Expense (Optional)</label>
                  <select
                    id="transaction-expense"
                    value={formData.expense_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expense_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="">Select an expense</option>
                    {expenses.map((expense) => (
                      <option key={expense.id} value={expense.id}>{expense.description} </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="transaction-investment" className="block text-gray-300 mb-1 text-sm sm:text-base">Investment (Optional)</label>
                  <select
                    id="transaction-investment"
                    value={formData.investment_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, investment_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="">Select an investment</option>
                    {investments.map((investment) => (
                      <option key={investment.id} value={investment.id}>Investment </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="transaction-payment-type" className="block text-gray-300 mb-1 text-sm sm:text-base">Payment Type (Optional)</label>
                  <select
                    id="transaction-payment-type"
                    value={formData.payment_type_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, payment_type_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a payment type</option>
                    {paymentTypes.map((paymentType) => (
                      <option key={paymentType.id} value={paymentType.id}>{paymentType.name} </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="transaction-others" className="block text-gray-300 mb-1 text-sm sm:text-base">Others (Optional)</label>
                  <input
                    id="transaction-others"
                    type="text"
                    placeholder='others'
                    value={formData.others}
                    onChange={(e) => setFormData((prev) => ({ ...prev, others: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="transaction-comments" className="block text-gray-300 mb-1 text-sm sm:text-base">Comments (Optional)</label>
                  <textarea
                    id="transaction-comments"
                    value={formData.comments}
                    placeholder='Enter comment'
                    onChange={(e) => setFormData((prev) => ({ ...prev, comments: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    rows="4"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="transaction-amount" className="block text-gray-300 mb-1 text-sm sm:text-base">Amount</label>
                  <input
                    id="transaction-amount"
                    placeholder='Enter amount'
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                    min="0.01"
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="transaction-user" className="block text-gray-300 mb-1 text-sm sm:text-base">User</label>
                  <select
                    id="transaction-user"
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
                  <label htmlFor="transaction-status" className="block text-gray-300 mb-1 text-sm sm:text-base">Status</label>
                  <select
                    id="transaction-status"
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
                      setEditingTransaction(null);
                      setFormData({ type: 'In', stock_id: '', expense_id: '', investment_id: '', payment_type_id: '', others: '', comments: '', amount: '', user_id: '', status: 1 });
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg text-white text-sm sm:text-base ${isSubmitting ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (editingTransaction ? 'Updating...' : 'Adding...') : (editingTransaction ? 'Update' : 'Add')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transfer Funds Modal */}
      <AnimatePresence>
        {isTransferModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isSubmitting) {
                setIsTransferModalOpen(false);
                setTransferFormData({
                  user_id: '',
                  out: { payment_type_id: '' },
                  to: { payment_type_id: '' },
                  shared: { amount: '', status: 1 },
                });
              }
            }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-[80vw] md:max-w-[600px] max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="transfer-modal-title"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 id="transfer-modal-title" className="text-lg sm:text-xl font-bold text-white">Transfer Funds</h3>
                <button
                  onClick={() => {
                    setIsTransferModalOpen(false);
                    setTransferFormData({
                      user_id: '',
                      out: { payment_type_id: '' },
                      to: { payment_type_id: '' },
                      shared: { amount: '', status: 1 },
                    });
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  disabled={isSubmitting}
                  aria-label="Close transfer modal"
                >
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleTransferFund} className="space-y-6">
                <div>
              
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="transfer-user" className="block text-gray-300 mb-1 text-sm sm:text-base">User</label>
                      <select
                        id="transfer-user"
                        value={transferFormData.user_id}
                        onChange={(e) => setTransferFormData((prev) => ({ ...prev, user_id: e.target.value }))}
                        required
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                        disabled={isSubmitting}
                      >
                        <option value="">Select a user</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>{user.name} </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Source (Out) Transaction */}
                  <div>
                    <h4 className="text-gray-300 font-semibold mb-2">Source (Out)</h4>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="transfer-out-payment-type" className="block text-gray-300 mb-1 text-sm sm:text-base">Payment Type</label>
                        <select
                          id="transfer-out-payment-type"
                          value={transferFormData.out.payment_type_id}
                          onChange={(e) => setTransferFormData((prev) => ({ ...prev, out: { payment_type_id: e.target.value } }))}
                          required
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                          disabled={isSubmitting}
                        >
                          <option value="">Select a payment type</option>
                          {paymentTypes.map((paymentType) => (
                            <option key={paymentType.id} value={paymentType.id}>{paymentType.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  {/* Destination (In) Transaction */}
                  <div>
                    <h4 className="text-gray-300 font-semibold mb-2">Destination</h4>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="transfer-to-payment-type" className="block text-gray-300 mb-1 text-sm sm:text-base">Payment Type</label>
                        <select
                          id="transfer-to-payment-type"
                          value={transferFormData.to.payment_type_id}
                          onChange={(e) => setTransferFormData((prev) => ({ ...prev, to: { payment_type_id: e.target.value } }))}
                          required
                          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                          disabled={isSubmitting}
                        >
                          <option value="">Select a payment type</option>
                          {paymentTypes.map((paymentType) => (
                            <option key={paymentType.id} value={paymentType.id}>{paymentType.name} </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Shared Fields */}
                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-gray-300 font-semibold mb-2">Shared Details</h4>
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="transfer-amount" className="block text-gray-300 mb-1 text-sm sm:text-base">Amount</label>
                      <input
                        id="transfer-amount"
                        type="number"
                        placeholder='Enter amount'
                        step="0.01"
                        value={transferFormData.shared.amount}
                        onChange={(e) => setTransferFormData((prev) => ({ ...prev, shared: { ...prev.shared, amount: e.target.value } }))}
                        required
                        min="0.01"
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label htmlFor="transfer-status" className="block text-gray-300 mb-1 text-sm sm:text-base">Status</label>
                      <select
                        id="transfer-status"
                        value={transferFormData.shared.status}
                        onChange={(e) => setTransferFormData((prev) => ({ ...prev, shared: { ...prev.shared, status: Number(e.target.value) } }))}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                        disabled={isSubmitting}
                      >
                        <option value={1}>Active</option>
                        <option value={0}>Inactive</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTransferModalOpen(false);
                      setTransferFormData({
                        user_id: '',
                        out: { payment_type_id: '' },
                        to: { payment_type_id: '' },
                        shared: { amount: '', status: 1 },
                      });
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-lg text-white text-sm sm:text-base ${isSubmitting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Transferring...' : 'Transfer'}
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
                setTransactionToDelete(null);
              }
            }}
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-[80vw] md:max-w-[600px] max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="delete-modal-title"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 id="delete-modal-title" className="text-lg sm:text-xl font-bold text-white">Confirm Deletion</h3>
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setTransactionToDelete(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  aria-label="Close delete modal"
                >
                  <FiX />
                </button>
              </div>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Are you sure you want to delete transaction ID {transactionToDelete?.id} ({transactionToDelete?.type})? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setTransactionToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteTransaction}
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

export default Transaction;