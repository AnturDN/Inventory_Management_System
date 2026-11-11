import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiSearch, FiEdit, FiTrash2, FiPlus, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import debounce from 'lodash/debounce';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://192.168.0.231:8000/api/';

const Supplier = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    shop_name: '',
    address: '',
    contact: '',
    email: '',
    image: null,
    status: 1,
  });
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);

  const isValidUrl = useCallback((url) => {
    if (!url) return false;
    try {
      new URL(url);
      return !url.includes('via.placeholder.com') && url.startsWith(API_BASE_URL.replace('/api/', '')); // Ensure URL is from the API domain
    } catch {
      return false;
    }
  }, []);

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const endpoint = searchTerm
        ? `suppliers/search?search=${encodeURIComponent(searchTerm)}&limit=${itemsPerPage}&page=${currentPage}`
        : `suppliers/paginated?limit=${itemsPerPage}&page=${currentPage}`;
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to fetch suppliers: ${response.status} ${response.statusText}`;
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
      setSuppliers(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.last_page || 1);
      setTotalItems(data.total || data.data.length || 0);
    } catch (err) {
      setError(`Failed to load suppliers: ${err.message}. Please try again.`);
      toast.error(`Failed to load suppliers: ${err.message}`);
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
    fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        setIsModalOpen(false);
        setEditingSupplier(null);
        setNewSupplier({ name: '', shop_name: '', address: '', contact: '', email: '', image: null, status: 1 });
        setIsDeleteModalOpen(false);
        setSupplierToDelete(null);
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

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file && ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type) && file.size <= 5 * 1024 * 1024) {
      setNewSupplier((prev) => ({ ...prev, image: file }));
    } else {
      toast.error('Please upload a JPEG, PNG, JPG, or WebP image under 5MB.');
    }
  }, []);

  const handleAddOrUpdateSupplier = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newSupplier.name.trim() || !newSupplier.email.trim()) {
        toast.error('Supplier name and email are required.');
        return;
      }
      setIsSubmitting(true);
      try {
        const formData = new FormData();
        formData.append('name', newSupplier.name);
        formData.append('shop_name', newSupplier.shop_name);
        formData.append('address', newSupplier.address);
        formData.append('contact', newSupplier.contact);
        formData.append('email', newSupplier.email);
        formData.append('status', newSupplier.status ? '1' : '0');
        if (newSupplier.image instanceof File) {
          formData.append('image', newSupplier.image);
        }
        if (editingSupplier) {
          formData.append('_method', 'PUT');
        }
        const url = editingSupplier ? `${API_BASE_URL}suppliers/${editingSupplier.id}` : `${API_BASE_URL}suppliers`;
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
        });
        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = editingSupplier ? `Failed to update supplier: ${response.statusText}` : `Failed to add supplier: ${response.statusText}`;
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
        toast.success(json.message || (editingSupplier ? 'Supplier updated successfully' : 'Supplier created successfully'));
        await fetchSuppliers();
        setIsModalOpen(false);
        setNewSupplier({ name: '', shop_name: '', address: '', contact: '', email: '', image: null, status: 1 });
        setEditingSupplier(null);
      } catch (err) {
        setError(`Failed to save supplier: ${err.message}. Please try again.`);
        toast.error(`Failed to save supplier: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingSupplier, newSupplier, fetchSuppliers]
  );

  const handleDeleteSupplier = useCallback(async () => {
    if (!supplierToDelete) return;
    try {
      const url = `${API_BASE_URL}suppliers/${supplierToDelete.id}`;
      const response = await fetch(url, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete supplier: ${response.statusText}`);
      }
      const json = await response.json();
      toast.success(json.message || 'Supplier deleted successfully');
      if (suppliers.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
      await fetchSuppliers();
    } catch (err) {
      setError(`Failed to delete supplier: ${err.message}. Please try again.`);
      toast.error(`Failed to delete supplier: ${err.message}`);
    } finally {
      setIsDeleteModalOpen(false);
      setSupplierToDelete(null);
    }
  }, [supplierToDelete, suppliers.length, currentPage, fetchSuppliers]);

  const handleOpenDeleteModal = useCallback((supplier) => {
    setSupplierToDelete(supplier);
    setIsDeleteModalOpen(true);
  }, []);

  const handleEditSupplier = useCallback((supplier) => {
    setEditingSupplier(supplier);
    setNewSupplier({
      name: supplier.name || '',
      shop_name: supplier.shop_name || '',
      address: supplier.address || '',
      contact: supplier.contact || '',
      email: supplier.email || '',
      image: null,
      status: supplier.status ? 1 : 0,
    });
    setIsModalOpen(true);
  }, []);

  const getImagePreviewUrl = useCallback(() => {
    if (newSupplier.image instanceof File) {
      return URL.createObjectURL(newSupplier.image); // Prioritize local file preview
    }
    if (editingSupplier && editingSupplier.image && !newSupplier.image && isValidUrl(editingSupplier.image)) {
      return editingSupplier.image;
    }
    return null; // Use fallback UI
  }, [newSupplier.image, editingSupplier, isValidUrl]);

  const getSupplierImageUrl = useCallback((image) => {
    return image && isValidUrl(image) ? image : null;
  }, [isValidUrl]);

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, scale: 0.8, transition: { duration: 0.2 } },
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-900 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover theme="dark" />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">Supplier Management</h2>
        <button
          onClick={() => {
            setEditingSupplier(null);
            setNewSupplier({ name: '', shop_name: '', address: '', contact: '', email: '', image: null, status: 1 });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors w-full sm:w-auto"
        >
          <FiPlus className="mr-2" /> Add New Supplier
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search suppliers by name or shop..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 placeholder-gray-400 text-sm sm:text-base"
            aria-label="Search suppliers"
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
      {suppliers.length === 0 ? (
        <div className="text-center text-gray-300 text-sm sm:text-base">No suppliers found.</div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">
            <div className="block md:hidden">
              {suppliers.map((supplier) => (
                <motion.div
                  key={supplier.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-gray-700 p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getSupplierImageUrl(supplier.image) ? (
                        <img
                          src={getSupplierImageUrl(supplier.image)}
                          alt={supplier.name || 'Supplier'}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs hidden">
                        No Image
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-gray-300 font-medium">{supplier.name || 'Unknown'}</div>
                      <div className="text-gray-400 text-sm">ID: {supplier.id}</div>
                      <div className="text-gray-400 text-sm">Shop: {supplier.shop_name || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Email: {supplier.email || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Contact: {supplier.contact || 'N/A'}</div>
                      <div className="text-gray-400 text-sm">Address: {supplier.address || 'N/A'}</div>
                      <div
                        className={`mt-1 px-2 py-1 rounded-full text-xs inline-block ${
                          supplier.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                      >
                        {supplier.status ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSupplier(supplier)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit ${supplier.name}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(supplier)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete ${supplier.name}`}
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
                  <th className="p-4">Shop Name</th>
                  <th className="p-4">Address</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <motion.tr
                    key={supplier.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-gray-700 hover:bg-gray-700 transition-colors"
                  >
                    <td className="p-4 text-gray-300">{supplier.id}</td>
                    <td className="p-4">
                      {getSupplierImageUrl(supplier.image) ? (
                        <img
                          src={getSupplierImageUrl(supplier.image)}
                          alt={supplier.name || 'Supplier'}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                      <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs hidden">
                        No Image
                      </div>
                    </td>
                    <td className="p-4 text-gray-300">{supplier.name || 'Unknown'}</td>
                    <td className="p-4 text-gray-300">{supplier.shop_name || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{supplier.address || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{supplier.contact || 'N/A'}</td>
                    <td className="p-4 text-gray-300">{supplier.email || 'N/A'}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          supplier.status ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                        }`}
                      >
                        {supplier.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-4 flex space-x-2">
                      <button
                        onClick={() => handleEditSupplier(supplier)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit ${supplier.name}`}
                      >
                        <FiEdit />
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(supplier)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete ${supplier.name}`}
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
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} suppliers
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
                setEditingSupplier(null);
                setNewSupplier({ name: '', shop_name: '', address: '', contact: '', email: '', image: null, status: 1 });
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
                  {editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
                </h3>
                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingSupplier(null);
                    setNewSupplier({ name: '', shop_name: '', address: '', contact: '', email: '', image: null, status: 1 });
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  disabled={isSubmitting}
                  aria-label="Close modal"
                >
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleAddOrUpdateSupplier} className="space-y-4">
                <div>
                  <label htmlFor="supplier-name"  className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Name
                  </label>
                  <input
                    id="supplier-name"
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder='Enter Supplier Name'
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="shop-name" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Shop Name
                  </label>
                  <input
                    id="shop-name"
                    type="text"
                    value={newSupplier.shop_name}
                    placeholder='Enter Shop Name'
                    onChange={(e) => setNewSupplier((prev) => ({ ...prev, shop_name: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="address" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Address
                  </label>
                  <textarea
                    id="address"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    rows="3"
                    placeholder='Enter Address'
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="contact" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Contact
                  </label>
                  <input
                    id="contact"
                    type="text"
                    value={newSupplier.contact}
                    onChange={(e) => setNewSupplier((prev) => ({ ...prev, contact: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                    placeholder='Contact Number'
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder='Enter eamil'
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier((prev) => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="image" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Image
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
                      No Image
                    </div>
                  )}
                  <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs mb-2 hidden">
                    No Image
                  </div>
                  <input
                    id="image"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="supplier-status" className="block text-gray-300 mb-1 text-sm sm:text-base">
                    Status
                  </label>
                  <select
                    id="supplier-status"
                    value={newSupplier.status}
                    onChange={(e) => setNewSupplier((prev) => ({ ...prev, status: Number(e.target.value) }))}
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
                      setEditingSupplier(null);
                      setNewSupplier({ name: '', shop_name: '', address: '', contact: '', email: '', image: null, status: 1 });
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
                    {isSubmitting ? (editingSupplier ? 'Updating...' : 'Adding...') : (editingSupplier ? 'Update' : 'Add')}
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
                setSupplierToDelete(null);
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
                    setSupplierToDelete(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  aria-label="Close delete modal"
                >
                  <FiX />
                </button>
              </div>
              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Are you sure you want to delete the supplier "{supplierToDelete?.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSupplierToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSupplier}
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

export default Supplier;