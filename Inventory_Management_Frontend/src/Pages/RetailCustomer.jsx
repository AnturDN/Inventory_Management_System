import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiSearch, FiEdit, FiTrash2, FiPlus, FiX, FiChevronLeft, FiChevronRight, FiImage } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import debounce from 'lodash/debounce';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://192.168.0.231:8000/api/';
const API_URL = `${API_BASE_URL}retail-customers`;
const USERS_API_URL = `${API_BASE_URL}users`;

const isValidUrl = (url) => {
  if (!url) return false;
  try {
    new URL(url);
    return !url.includes('via.placeholder.com') && url.startsWith(API_BASE_URL.replace('/api/', '')); // Ensure URL is from the API domain
  } catch {
    return false;
  }
};

const RetailCustomer = () => {
  const [customers, setCustomers] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    email: '',
    password: '',
    contact: '',
    address: '',
    user_id: '',
    image: null,
    status: 1,
  });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);

  const fetchCustomers = useCallback(async () => {
    setError(null);
    try {
      const endpoint = searchTerm
        ? `retail-customers/search?search=${encodeURIComponent(searchTerm)}&limit=${itemsPerPage}&page=${currentPage}`
        : `retail-customers/paginated?limit=${itemsPerPage}&page=${currentPage}`;
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to fetch customers: ${response.status} ${response.statusText}`;
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
      setCustomers(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.last_page || 1);
      setTotalItems(data.total || data.data.length || 0);
    } catch (err) {
      setError(`Failed to load customers: ${err.message}. Please try again.`);
      toast.error(`Failed to load customers: ${err.message}`);
    }
  }, [currentPage, itemsPerPage, searchTerm]);

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
    fetchCustomers();
    fetchUsers();
  }, [fetchCustomers, fetchUsers]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        setIsModalOpen(false);
        setEditingCustomer(null);
        setNewCustomer({ name: '', email: '', password: '', contact: '', address: '', user_id: '', image: null, status: 1 });
        setIsDeleteModalOpen(false);
        setCustomerToDelete(null);
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
      setNewCustomer((prev) => ({ ...prev, image: file }));
    } else {
      toast.error('Please upload a JPEG, PNG, JPG, or WebP image under 2MB.');
    }
  }, []);

  const handleAddOrUpdateCustomer = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newCustomer.name.trim() || !newCustomer.email || !newCustomer.user_id) {
        toast.error('Name, email, and user are required.');
        return;
      }
      if (!editingCustomer && !newCustomer.password) {
        toast.error('Password is required for new customers.');
        return;
      }
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('name', newCustomer.name);
        formData.append('email', newCustomer.email);
        if (newCustomer.password) formData.append('password', newCustomer.password);
        formData.append('contact', newCustomer.contact || '');
        formData.append('address', newCustomer.address || '');
        formData.append('user_id', newCustomer.user_id);
        formData.append('status', newCustomer.status ? '1' : '0');
        if (newCustomer.image instanceof File) {
          formData.append('image', newCustomer.image);
        }
        if (editingCustomer) {
          formData.append('_method', 'PUT');
        }
        const url = editingCustomer ? `${API_URL}/${editingCustomer.id}` : API_URL;
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = editingCustomer ? `Failed to update customer: ${response.statusText}` : `Failed to add customer: ${response.statusText}`;
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
        toast.success(json.message || (editingCustomer ? 'Customer updated successfully' : 'Customer created successfully'));
        await fetchCustomers();
        setIsModalOpen(false);
        setNewCustomer({ name: '', email: '', password: '', contact: '', address: '', user_id: '', image: null, status: 1 });
        setEditingCustomer(null);
      } catch (err) {
        setError(`Failed to save customer: ${err.message}. Please try again.`);
        toast.error(`Failed to save customer: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingCustomer, newCustomer, fetchCustomers]
  );

  const handleDeleteCustomer = useCallback(async () => {
    if (!customerToDelete) return;
    try {
      const url = `${API_URL}/${customerToDelete.id}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to delete customer: ${response.statusText}`;
        if (response.status === 404) {
          errorMessage = 'Customer not found or API endpoint unavailable.';
        }
        throw new Error(errorMessage);
      }
      const json = await response.json();
      toast.success(json.message || 'Customer deleted successfully');
      if (customers.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
      await fetchCustomers();
    } catch (err) {
      setError(`Failed to delete customer: ${err.message}. Please try again.`);
      toast.error(`Failed to delete customer: ${err.message}`);
    } finally {
      setIsDeleteModalOpen(false);
      setCustomerToDelete(null);
    }
  }, [customerToDelete, customers.length, currentPage, fetchCustomers]);

  const handleOpenDeleteModal = useCallback((customer) => {
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  }, []);

  const handleEditCustomer = useCallback((customer) => {
    setEditingCustomer(customer);
    setNewCustomer({
      name: customer.name || '',
      email: customer.email || '',
      password: '',
      contact: customer.contact || '',
      address: customer.address || '',
      user_id: customer.user_id || '',
      image: null,
      status: customer.status ? 1 : 0,
    });
    setIsModalOpen(true);
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
            errorMessage = 'Customer not found or API endpoint unavailable.';
          }
          throw new Error(errorMessage);
        }
        const json = await response.json();
        toast.success(json.message || 'Status updated successfully');
        await fetchCustomers();
      } catch (err) {
        setError(`Failed to update status: ${err.message}. Please try again.`);
        toast.error(`Failed to update status: ${err.message}`);
      }
    },
    [fetchCustomers]
  );

  const getImagePreviewUrl = useCallback(() => {
    if (newCustomer.image instanceof File) {
      return URL.createObjectURL(newCustomer.image);
    }
    if (editingCustomer && editingCustomer.image && !newCustomer.image && isValidUrl(editingCustomer.image)) {
      return editingCustomer.image;
    }
    return null;
  }, [newCustomer.image, editingCustomer]);

  const getCustomerImageUrl = useCallback((image) => {
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
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Retail Customer Management</h2>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setNewCustomer({ name: '', email: '', password: '', contact: '', address: '', user_id: '', image: null, status: 1 });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors w-full sm:w-auto"
        >
          <FiPlus className="mr-2" /> Add New Customer
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search customers by name, email, contact, or address..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 placeholder-gray-400 text-sm sm:text-base"
            aria-label="Search customers"
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
      {customers.length === 0 ? (
        <div className="text-center text-gray-300 text-sm sm:text-base">{searchTerm ? 'No customers match your search' : 'No customers available'}</div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="block md:hidden">
              {customers.map((customer) => (
                <motion.div
                  key={customer.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-gray-700 p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getCustomerImageUrl(customer.image) ? (
                        <img
                          src={getCustomerImageUrl(customer.image)}
                          alt={customer.name || 'Customer'}
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
                      <div className="text-gray-300 font-medium">{customer.name || 'Unknown'}</div>
                      <div className="text-gray-400 text-sm">ID: {customer.id}</div>
                      <div className="text-gray-400 text-sm">Email: {customer.email || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Contact: {customer.contact || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Address: {customer.address || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">User: {customer.user?.name || 'N/A'} (ID: {customer.user_id})</div>
                      <div
                        className={`mt-1 px-2 py-1 rounded-full text-xs inline-block cursor-pointer ${
                          customer.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                        onClick={() => toggleStatus(customer.id, customer.status)}
                      >
                        {customer.status ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditCustomer(customer)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit customer ${customer.name}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(customer)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete customer ${customer.name}`}
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
                  <th className="p-4">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Address</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-gray-700 hover:bg-gray-700 transition-colors"
                  >
                    <td className="p-4 text-gray-300">{customer.id}</td>
                    <td className="p-4">
                      {getCustomerImageUrl(customer.image) ? (
                        <img
                          src={getCustomerImageUrl(customer.image)}
                          alt={customer.name || 'Customer'}
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
                    <td className="p-4 text-gray-300">{customer.name || 'Unknown'}</td>
                    <td className="p-4 text-gray-300">{customer.email || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{customer.contact || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{customer.address || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{customer.user?.name || 'N/A'} (ID: {customer.user_id})</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs cursor-pointer ${
                          customer.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                        onClick={() => toggleStatus(customer.id, customer.status)}
                      >
                        {customer.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 flex space-x-2">
                      <button
                        onClick={() => handleEditCustomer(customer)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit customer ${customer.name}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(customer)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete customer ${customer.name}`}
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
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} customers
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
                setEditingCustomer(null);
                setNewCustomer({ name: '', email: '', password: '', contact: '', address: '', user_id: '', image: null, status: 1 });
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
                  {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingCustomer(null);
                    setNewCustomer({ name: '', email: '', password: '', contact: '', address: '', user_id: '', image: null, status: 1 });
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  disabled={isSubmitting}
                  aria-label="Close modal"
                >
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleAddOrUpdateCustomer} className="space-y-4">
                <div>
                  <label htmlFor="customer-name" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Name
                  </label>
                  <input
                    id="customer-name"
                    type="text"
                    placeholder='Enter name'
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    maxLength={255}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="customer-email" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Email
                  </label>
                  <input
                    id="customer-email"
                    placeholder='Enter email'
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer((prev) => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="customer-password" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Password {editingCustomer ? '(optional)' : ''}
                  </label>
                  <input
                    id="customer-password"
                    placeholder='Enter password'
                    type="password"
                    value={newCustomer.password}
                    onChange={(e) => setNewCustomer((prev) => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="customer-contact" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Contact (optional)
                  </label>
                  <input
                    id="customer-contact"
                    placeholder='Enter contact'
                    type="text"
                    value={newCustomer.contact}
                    onChange={(e) => setNewCustomer((prev) => ({ ...prev, contact: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="customer-address" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Address (optional)
                  </label>
                  <input
                    id="customer-address"
                    placeholder='Enter address'
                    type="text"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="customer-user" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    User
                  </label>
                  <select
                    id="customer-user"
                    value={newCustomer.user_id}
                    onChange={(e) => setNewCustomer((prev) => ({ ...prev, user_id: e.target.value }))}
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
                  <label htmlFor="customer-image" className="block text-gray-300 mb-1 text-sm sm:text-base">
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
                    id="customer-image"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={handleImageUpload}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="customer-status" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Status
                  </label>
                  <select
                    id="customer-status"
                    value={newCustomer.status}
                    onChange={(e) => setNewCustomer((prev) => ({ ...prev, status: Number(e.target.value) }))}
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
                      setEditingCustomer(null);
                      setNewCustomer({ name: '', email: '', password: '', contact: '', address: '', user_id: '', image: null, status: 1 });
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
                    {isSubmitting ? (editingCustomer ? 'Updating...' : 'Adding...') : (editingCustomer ? 'Update' : 'Add')}
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
                setCustomerToDelete(null);
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
                    setCustomerToDelete(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  aria-label="Close delete modal"
                >
                  <FiX />
                </button>
              </div>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Are you sure you want to delete the customer "{customerToDelete?.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setCustomerToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCustomer}
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

export default RetailCustomer;