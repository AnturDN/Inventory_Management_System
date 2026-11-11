import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiSearch, FiEdit, FiTrash2, FiPlus, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import debounce from 'lodash/debounce';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://192.168.0.231:8000/api/';
const API_URL = `${API_BASE_URL}investments`;
const PAYMENT_TYPES_API_URL = `${API_BASE_URL}payment-types`;
const USERS_API_URL = `${API_BASE_URL}users`;

const Investment = () => {
  const [investments, setInvestments] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    payment_type_id: '',
    amount: '',
    description: '',
    user_id: '',
    image: null,
    deed_image: null,
    status: true,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [deedImagePreview, setDeedImagePreview] = useState(null);

  const isValidUrl = useCallback((url) => {
    if (!url) return false;
    try {
      new URL(url);
      return url.startsWith(API_BASE_URL.replace('/api/', '')); // Ensure URL is from the API domain
    } catch {
      return false;
    }
  }, []);

  const fetchInvestments = useCallback(async () => {
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: itemsPerPage,
        page: currentPage,
      });
      if (searchTerm) params.append('search', searchTerm);
      const endpoint = searchTerm ? 'investments/search' : 'investments/paginated';
      const url = `${API_BASE_URL}${endpoint}?${params.toString()}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to fetch investments: ${response.status} ${response.statusText}`;
        if (response.status === 422) {
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = `Validation error: ${errorJson.errors ? Object.values(errorJson.errors).flat().join(', ') : errorJson.message}`;
          } catch (e) {
            // Non-JSON error response
          }
        } else if (response.status === 404) {
          errorMessage = 'API endpoint not found. Please check the backend route configuration.';
        } else if (response.status === 500) {
          errorMessage = 'Server error fetching investments. Please try again later.';
        }
        throw new Error(errorMessage);
      }
      const json = await response.json();
      if (!json.status || !json.data) {
        throw new Error('Invalid response format: Missing status or data');
      }
      const { data } = json;
      setInvestments(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.last_page || 1);
      setTotalItems(data.total || data.data.length || 0);
    } catch (err) {
      setError(`Failed to load investments: ${err.message}. Please try again.`);
      toast.error(`Failed to load investments: ${err.message}`);
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
      setPaymentTypes(Array.isArray(json) ? json : (json.status && Array.isArray(json.data) ? json.data : []));
    } catch (err) {
      toast.error(`Failed to fetch payment types: ${err.message}`);
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
      setUsers(Array.isArray(json) ? json : (json.status && Array.isArray(json.data) ? json.data : []));
    } catch (err) {
      toast.error(`Failed to fetch users: ${err.message}`);
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
    fetchInvestments();
    fetchPaymentTypes();
    fetchUsers();
  }, [fetchInvestments, fetchPaymentTypes, fetchUsers]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        setIsModalOpen(false);
        setEditingInvestment(null);
        setFormData({
          name: '',
          payment_type_id: '',
          amount: '',
          description: '',
          user_id: '',
          image: null,
          deed_image: null,
          status: true,
        });
        setImagePreview(null);
        setDeedImagePreview(null);
        setIsDeleteModalOpen(false);
        setInvestmentToDelete(null);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isSubmitting]);

  const handleImageChange = useCallback((e, type) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        toast.error(`${type === 'image' ? 'Image' : 'Deed Image'} must be JPEG, PNG, JPG, or WebP.`);
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        toast.error(`${type === 'image' ? 'Image' : 'Deed Image'} size must be less than 2MB.`);
        return;
      }
      setFormData((prev) => ({ ...prev, [type]: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'image') {
          setImagePreview(reader.result);
        } else {
          setDeedImagePreview(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
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

  const handleAddOrUpdateInvestment = useCallback(
    async (e) => {
      e.preventDefault();
      if (!formData.name.trim() || !formData.payment_type_id || !formData.amount || !formData.user_id) {
        toast.error('Name, payment type, amount, and user are required.');
        return;
      }
      if (Number(formData.amount) <= 0) {
        toast.error('Amount must be greater than 0.');
        return;
      }
      setIsSubmitting(true);
      try {
        const data = new FormData();
        data.append('name', formData.name);
        data.append('payment_type_id', formData.payment_type_id);
        data.append('amount', formData.amount);
        if (formData.description) data.append('description', formData.description);
        data.append('user_id', formData.user_id);
        data.append('status', formData.status ? '1' : '0');
        if (formData.image instanceof File) data.append('image', formData.image);
        if (formData.deed_image instanceof File) data.append('deed_image', formData.deed_image);
        if (editingInvestment) data.append('_method', 'PUT');
        const url = editingInvestment ? `${API_URL}/${editingInvestment.id}` : API_URL;
        const response = await fetch(url, {
          method: 'POST',
          body: data,
        });
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = editingInvestment ? `Failed to update investment: ${response.statusText}` : `Failed to add investment: ${response.statusText}`;
          if (response.status === 422) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = `Validation error: ${errorJson.errors ? Object.values(errorJson.errors).flat().join(', ') : errorJson.message}`;
            } catch (e) {
              // Non-JSON error response
            }
          } else if (response.status === 404) {
            errorMessage = 'Investment or related resource not found.';
          } else if (response.status === 500) {
            errorMessage = editingInvestment ? 'Server error updating investment.' : 'Server error creating investment.';
          }
          throw new Error(errorMessage);
        }
        const json = await response.json();
        toast.success(json.message || (editingInvestment ? 'Investment updated successfully' : 'Investment created successfully'));
        await fetchInvestments();
        setIsModalOpen(false);
        setEditingInvestment(null);
        setFormData({
          name: '',
          payment_type_id: '',
          amount: '',
          description: '',
          user_id: '',
          image: null,
          deed_image: null,
          status: true,
        });
        setImagePreview(null);
        setDeedImagePreview(null);
      } catch (err) {
        setError(`Failed to save investment: ${err.message}. Please try again.`);
        toast.error(`Failed to save investment: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingInvestment, formData, fetchInvestments]
  );

  const handleDeleteInvestment = useCallback(async () => {
    if (!investmentToDelete) return;
    try {
      const url = `${API_URL}/${investmentToDelete.id}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to delete investment: ${response.statusText}`;
        if (response.status === 404) {
          errorMessage = 'Investment not found.';
        } else if (response.status === 500) {
          errorMessage = 'Server error deleting investment.';
        }
        throw new Error(errorMessage);
      }
      const json = await response.json();
      toast.success(json.message || 'Investment deleted successfully');
      if (investments.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
      await fetchInvestments();
    } catch (err) {
      setError(`Failed to delete investment: ${err.message}. Please try again.`);
      toast.error(`Failed to delete investment: ${err.message}`);
    } finally {
      setIsDeleteModalOpen(false);
      setInvestmentToDelete(null);
    }
  }, [investmentToDelete, investments.length, currentPage, fetchInvestments]);

  const handleOpenDeleteModal = useCallback((investment) => {
    setInvestmentToDelete(investment);
    setIsDeleteModalOpen(true);
  }, []);

  const handleEditInvestment = useCallback((investment) => {
    setEditingInvestment(investment);
    setFormData({
      name: investment.name || '',
      payment_type_id: investment.payment_type_id || '',
      amount: investment.amount || '',
      description: investment.description || '',
      user_id: investment.user_id || '',
      image: null,
      deed_image: null,
      status: investment.status,
    });
    setImagePreview(isValidUrl(investment.image) ? investment.image : null);
    setDeedImagePreview(isValidUrl(investment.deed_image) ? investment.deed_image : null);
    setIsModalOpen(true);
  }, [isValidUrl]);

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
            errorMessage = 'Investment not found.';
          } else if (response.status === 422) {
            try {
              const errorJson = JSON.parse(errorText);
              errorMessage = `Validation error: ${errorJson.errors ? Object.values(errorJson.errors).flat().join(', ') : errorJson.message}`;
            } catch (e) {
              // Non-JSON error response
            }
          } else if (response.status === 500) {
            errorMessage = 'Server error updating status.';
          }
          throw new Error(errorMessage);
        }
        const json = await response.json();
        toast.success(json.message || 'Status updated successfully');
        await fetchInvestments();
      } catch (err) {
        setError(`Failed to update status: ${err.message}. Please try again.`);
        toast.error(`Failed to update status: ${err.message}`);
      }
    },
    [fetchInvestments]
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
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Investment Management</h2>
        <button
          onClick={() => {
            setEditingInvestment(null);
            setFormData({
              name: '',
              payment_type_id: '',
              amount: '',
              description: '',
              user_id: '',
              image: null,
              deed_image: null,
              status: true,
            });
            setImagePreview(null);
            setDeedImagePreview(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors w-full sm:w-auto"
        >
          <FiPlus className="mr-2" /> Add New Investment
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, amount, or description..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 placeholder-gray-400 text-sm sm:text-base"
            aria-label="Search investments"
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
      {investments.length === 0 ? (
        <div className="text-center text-gray-300 text-sm sm:text-base">{searchTerm ? 'No investments match your search' : 'No investments available'}</div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="block md:hidden">
              {investments.map((investment) => (
                <motion.div
                  key={investment.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-gray-700 p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="text-gray-300 font-medium">Investment ID: {investment.id}</div>
                      <div className="text-gray-400 text-sm">Name: {investment.name || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Payment Type: {investment.paymentType?.name || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Amount: ${Number(investment.amount).toFixed(2)}</div>
                      <div className="text-gray-400 text-sm">Description: {investment.description || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">User: {investment.user?.name || 'N/A'} (ID: {investment.user_id})</div>
                      <div className="text-gray-400 text-sm mt-2">
                        Image:{' '}
                        {isValidUrl(investment.image) ? (
                          <img
                            src={investment.image}
                            alt={`Investment ${investment.id} image`}
                            className="w-16 h-16 object-cover rounded-lg mt-1"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-600 flex items-center justify-center text-gray-400 text-xs mt-1">
                            No Image
                          </div>
                        )}
                        <div className="w-16 h-16 rounded-lg bg-gray-600 flex items-center justify-center text-gray-400 text-xs mt-1 hidden">
                          No Image
                        </div>
                      </div>
                      <div className="text-gray-400 text-sm mt-2">
                        Deed Image:{' '}
                        {isValidUrl(investment.deed_image) ? (
                          <img
                            src={investment.deed_image}
                            alt={`Investment ${investment.id} deed image`}
                            className="w-16 h-16 object-cover rounded-lg mt-1"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-gray-600 flex items-center justify-center text-gray-400 text-xs mt-1">
                            No Image
                          </div>
                        )}
                        <div className="w-16 h-16 rounded-lg bg-gray-600 flex items-center justify-center text-gray-400 text-xs mt-1 hidden">
                          No Image
                        </div>
                      </div>
                      <div
                        className={`mt-2 px-2 py-1 rounded-full text-xs inline-block cursor-pointer ${
                          investment.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                        onClick={() => toggleStatus(investment.id, investment.status)}
                      >
                        {investment.status ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditInvestment(investment)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit investment ${investment.id}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(investment)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete investment ${investment.id}`}
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
                  <th className="p-4">Payment Type</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Image</th>
                  <th className="p-4">Deed Image</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {investments.map((investment) => (
                  <motion.tr
                    key={investment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-gray-700 hover:bg-gray-700 transition-colors"
                  >
                    <td className="p-4 text-gray-300">{investment.id}</td>
                    <td className="p-4 text-gray-300">{investment.name || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{investment.paymentType?.name || 'N/A'}</td>
                    <td className="p-4 text-gray-300">${Number(investment.amount).toFixed(2)}</td>
                    <td className="p-4 text-gray-300">{investment.description || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{investment.user?.name || 'N/A'} (ID: {investment.user_id})</td>
                    <td className="p-4">
                      {isValidUrl(investment.image) ? (
                        <img
                          src={investment.image}
                          alt={`Investment ${investment.id} image`}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-600 flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                      <div className="w-16 h-16 rounded-lg bg-gray-600 flex items-center justify-center text-gray-400 text-xs hidden">
                        No Image
                      </div>
                    </td>
                    <td className="p-4">
                      {isValidUrl(investment.deed_image) ? (
                        <img
                          src={investment.deed_image}
                          alt={`Investment ${investment.id} deed image`}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-gray-600 flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                      <div className="w-16 h-16 rounded-lg bg-gray-600 flex items-center justify-center text-gray-400 text-xs hidden">
                        No Image
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs cursor-pointer ${
                          investment.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                        onClick={() => toggleStatus(investment.id, investment.status)}
                      >
                        {investment.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 flex space-x-2">
                      <button
                        onClick={() => handleEditInvestment(investment)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit investment ${investment.id}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(investment)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete investment ${investment.id}`}
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
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} investments
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
                setEditingInvestment(null);
                setFormData({
                  name: '',
                  payment_type_id: '',
                  amount: '',
                  description: '',
                  user_id: '',
                  image: null,
                  deed_image: null,
                  status: true,
                });
                setImagePreview(null);
                setDeedImagePreview(null);
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
                  {editingInvestment ? 'Edit Investment' : 'Add New Investment'}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingInvestment(null);
                    setFormData({
                      name: '',
                      payment_type_id: '',
                      amount: '',
                      description: '',
                      user_id: '',
                      image: null,
                      deed_image: null,
                      status: true,
                    });
                    setImagePreview(null);
                    setDeedImagePreview(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  disabled={isSubmitting}
                  aria-label="Close modal"
                >
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleAddOrUpdateInvestment} className="space-y-4">
                <div>
                  <label htmlFor="investment-name" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Name
                  </label>
                  <input
                    id="investment-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    maxLength={255}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                    placeholder="Enter investment name"
                  />
                </div>
                <div>
                  <label htmlFor="investment-payment-type" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Payment Type
                  </label>
                  <select
                    id="investment-payment-type"
                    value={formData.payment_type_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, payment_type_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a payment type</option>
                    {paymentTypes.map((paymentType) => (
                      <option key={paymentType.id} value={paymentType.id}>
                        {paymentType.name || `Type ${paymentType.id}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="investment-amount" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Amount
                  </label>
                  <input
                    id="investment-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                    placeholder="Enter amount"
                  />
                </div>
                <div>
                  <label htmlFor="investment-description" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Description (Optional)
                  </label>
                  <textarea
                    id="investment-description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    rows="4"
                    disabled={isSubmitting}
                    placeholder="Enter description"
                  />
                </div>
                <div>
                  <label htmlFor="investment-user" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    User
                  </label>
                  <select
                    id="investment-user"
                    value={formData.user_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, user_id: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a user</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name || user.email || `User ${user.id}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="investment-image" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Image (Optional, max 2MB)
                  </label>
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Image preview"
                      className="w-12 h-12 rounded-full object-cover mb-2"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs mb-2">
                      No Image
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs mb-2 hidden">
                    No Image
                  </div>
                  <input
                    id="investment-image"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={(e) => handleImageChange(e, 'image')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="investment-deed-image" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Deed Image (Optional, max 2MB)
                  </label>
                  {deedImagePreview ? (
                    <img
                      src={deedImagePreview}
                      alt="Deed image preview"
                      className="w-12 h-12 rounded-full object-cover mb-2"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs mb-2">
                      No Image
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs mb-2 hidden">
                    No Image
                  </div>
                  <input
                    id="investment-deed-image"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={(e) => handleImageChange(e, 'deed_image')}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="investment-status" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Status
                  </label>
                  <select
                    id="investment-status"
                    value={formData.status ? '1' : '0'}
                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value === '1' }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingInvestment(null);
                      setFormData({
                        name: '',
                        payment_type_id: '',
                        amount: '',
                        description: '',
                        user_id: '',
                        image: null,
                        deed_image: null,
                        status: true,
                      });
                      setImagePreview(null);
                      setDeedImagePreview(null);
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
                    {isSubmitting ? (editingInvestment ? 'Updating...' : 'Adding...') : (editingInvestment ? 'Update' : 'Add')}
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
                setInvestmentToDelete(null);
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
                    setInvestmentToDelete(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  aria-label="Close delete modal"
                >
                  <FiX />
                </button>
              </div>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Are you sure you want to delete investment ID {investmentToDelete?.id} ({investmentToDelete?.name})? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setInvestmentToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteInvestment}
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

export default Investment;