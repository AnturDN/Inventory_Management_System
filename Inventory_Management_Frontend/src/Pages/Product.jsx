
import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiSearch,
  FiEdit,
  FiTrash2,
  FiPlus,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiImage
} from 'react-icons/fi';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import debounce from 'lodash/debounce';

const API_BASE_URL = import.meta.env.VITE_BASE_URL || 'http://192.168.0.231:8000/api/';
const PRODUCTS_API_URL = `${API_BASE_URL}products`;
const CATEGORIES_API_URL = `${API_BASE_URL}categories`;
const BRANDS_API_URL = `${API_BASE_URL}brands`;
const USERS_API_URL = `${API_BASE_URL}users`;

// In-memory cache for static data
const cache = {
  categories: null,
  brands: null,
  users: null,
};

// Initial form data
const initialFormData = {
  name: '',
  description: '',
  quantity: '',
  category_id: '',
  brand_id: '',
  user_id: '',
  image: null,
  status: true,
};

const fetchWithBackoff = async (url, options = {}, retries = 3, backoff = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Accept: 'application/json',
        },
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
          ? parseInt(response.headers.get('Retry-After')) * 1000
          : backoff * Math.pow(2, i);

        await new Promise(resolve => setTimeout(resolve, retryAfter));
        continue;
      }

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error: ${response.status} ${response.statusText}`;

        if (response.status === 422) {
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = `Validation error: ${
              errorJson.errors
                ? Object.values(errorJson.errors).flat().join(', ')
                : errorJson.message
            }`;
          } catch (e) {
            // Non-JSON error response
          }
        } else if (response.status === 404) {
          errorMessage = 'API endpoint not found. Please check the backend route configuration.';
        } else if (response.status === 500) {
          errorMessage = 'Server error. Please try again later.';
        }

        throw new Error(errorMessage);
      }

      return await response.json();

    } catch (error) {
      if (i === retries - 1) throw error;
    }
  }
};

const Product = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [users, setUsers] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const [formData, setFormData] = useState(initialFormData);
  const [imagePreview, setImagePreview] = useState(null);

  const isValidUrl = useCallback((url) => {
    if (!url) return false;

    try {
      new URL(url);
      return url.startsWith(API_BASE_URL.replace('/api/', ''));
    } catch {
      return false;
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: itemsPerPage,
        page: currentPage,
      });

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const endpoint = searchTerm ? 'search' : 'paginated';
      const url = `${PRODUCTS_API_URL}/${endpoint}?${params.toString()}`;

      const json = await fetchWithBackoff(url);

      if (!json.status || !json.data) {
        throw new Error('Invalid response format: Missing status or data');
      }

      const { data } = json;

      setProducts(Array.isArray(data.data) ? data.data : []);
      setTotalPages(data.last_page || 1);
      setTotalItems(data.total || data.data.length || 0);

    } catch (err) {
      setError(`Failed to load products: ${err.message}. Please try again.`);
      toast.error(`Failed to load products: ${err.message}`);
    }
  }, [currentPage, itemsPerPage, searchTerm]);

  const fetchCategories = useCallback(async () => {
    if (cache.categories) {
      setCategories(cache.categories);
      return;
    }

    try {
      const json = await fetchWithBackoff(CATEGORIES_API_URL);

      const data = Array.isArray(json)
        ? json
        : (json.status && Array.isArray(json.data) ? json.data : []);

      cache.categories = data;
      setCategories(data);

    } catch (err) {
      toast.error(`Failed to fetch categories: ${err.message}`);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    if (cache.brands) {
      setBrands(cache.brands);
      return;
    }

    try {
      const json = await fetchWithBackoff(BRANDS_API_URL);

      const data = Array.isArray(json)
        ? json
        : (json.status && Array.isArray(json.data) ? json.data : []);

      cache.brands = data;
      setBrands(data);

    } catch (err) {
      toast.error(`Failed to fetch brands: ${err.message}`);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (cache.users) {
      setUsers(cache.users);
      return;
    }

    try {
      const json = await fetchWithBackoff(USERS_API_URL);

      const data = Array.isArray(json)
        ? json
        : (json.status && Array.isArray(json.data) ? json.data : []);

      cache.users = data;
      setUsers(data);

    } catch (err) {
      toast.error(`Failed to fetch users: ${err.message}`);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchProducts(),
      fetchCategories(),
      fetchBrands(),
      fetchUsers(),
    ]);
  }, [fetchProducts, fetchCategories, fetchBrands, fetchUsers]);

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchTerm(value);
      setCurrentPage(1);
    }, 300),
    []
  );

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isSubmitting) {
        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData({ ...initialFormData });
        setImagePreview(null);
        setIsDeleteModalOpen(false);
        setProductToDelete(null);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => window.removeEventListener('keydown', handleEscape);
  }, [isSubmitting]);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];

    if (file) {
      if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
        toast.error('Image must be JPEG, PNG, JPG, or WebP.');
        return;
      }

      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB.');
        return;
      }

      setFormData((prev) => ({
        ...prev,
        image: file,
      }));

      const reader = new FileReader();

      reader.onloadend = () => {
        setImagePreview(reader.result);
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

  // Add or Update Product
  const handleAddOrUpdateProduct = useCallback(
    async (e) => {
      e.preventDefault();

      if (
        !formData.name.trim() ||
        formData.quantity === '' ||
        !formData.category_id ||
        !formData.brand_id ||
        !formData.user_id
      ) {
        toast.error('Name, quantity, category, brand, and user are required.');
        return;
      }

      const quantity = Number(formData.quantity);

      if (!Number.isInteger(quantity) || quantity < 0) {
        toast.error('Quantity must be a whole number and cannot be negative.');
        return;
      }

      setIsSubmitting(true);

      try {
        const data = new FormData();

        data.append('name', formData.name);
        data.append('quantity', quantity);

        if (formData.description.trim()) {
          data.append('description', formData.description);
        }

        data.append('category_id', formData.category_id);
        data.append('brand_id', formData.brand_id);
        data.append('user_id', formData.user_id);
        data.append('status', formData.status ? '1' : '0');

        if (formData.image instanceof File) {
          data.append('image', formData.image);
        }

        if (editingProduct) {
          data.append('_method', 'PUT');
        }

        const url = editingProduct
          ? `${PRODUCTS_API_URL}/${editingProduct.id}`
          : PRODUCTS_API_URL;

        const json = await fetchWithBackoff(url, {
          method: 'POST',
          body: data,
        });

        toast.success(
          json.message ||
          (editingProduct
            ? 'Product updated successfully'
            : 'Product created successfully')
        );

        cache.categories = null;
        cache.brands = null;
        cache.users = null;

        await fetchAllData();

        setIsModalOpen(false);
        setEditingProduct(null);
        setFormData({ ...initialFormData });
        setImagePreview(null);

      } catch (err) {
        setError(`Failed to save product: ${err.message}. Please try again.`);
        toast.error(`Failed to save product: ${err.message}`);

      } finally {
        setIsSubmitting(false);
      }
    },
    [editingProduct, formData, fetchAllData]
  );

  // Delete Product
  const handleDeleteProduct = useCallback(async () => {
    if (!productToDelete) return;

    try {
      const url = `${PRODUCTS_API_URL}/${productToDelete.id}`;

      const json = await fetchWithBackoff(url, {
        method: 'DELETE',
      });

      toast.success(json.message || 'Product deleted successfully');

      if (products.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }

      cache.categories = null;
      cache.brands = null;
      cache.users = null;

      await fetchAllData();

    } catch (err) {
      setError(`Failed to delete product: ${err.message}. Please try again.`);
      toast.error(`Failed to delete product: ${err.message}`);

    } finally {
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    }
  }, [productToDelete, products.length, currentPage, fetchAllData]);

  const handleOpenDeleteModal = useCallback((product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  }, []);

  // Edit Product
  const handleEditProduct = useCallback((product) => {
    setEditingProduct(product);

    setFormData({
      name: product.name || '',
      description: product.description || '',
      quantity: product.quantity ?? 0,
      category_id: product.category_id || '',
      brand_id: product.brand_id || '',
      user_id: product.user_id || '',
      image: null,
      status: product.status,
    });

    setImagePreview(isValidUrl(product.image) ? product.image : null);
    setIsModalOpen(true);
  }, [isValidUrl]);

  // Toggle Product Status
  const toggleStatus = useCallback(
    async (id, currentStatus) => {
      try {
        const data = new FormData();

        data.append('status', currentStatus ? '0' : '1');
        data.append('_method', 'PUT');

        const json = await fetchWithBackoff(`${PRODUCTS_API_URL}/${id}`, {
          method: 'POST',
          body: data,
        });

        toast.success(json.message || 'Status updated successfully');

        cache.categories = null;
        cache.brands = null;
        cache.users = null;

        await fetchAllData();

      } catch (err) {
        setError(`Failed to update status: ${err.message}. Please try again.`);
        toast.error(`Failed to update status: ${err.message}`);
      }
    },
    [fetchAllData]
  );

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.2 },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.2 },
    },
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-gray-900 min-h-screen">

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
          Product Management
        </h2>

        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({ ...initialFormData });
            setImagePreview(null);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white transition-colors w-full sm:w-auto"
        >
          <FiPlus className="mr-2" /> Add New Product
        </button>
      </div>

      {/* Search and Pagination Settings */}
      <div className="flex flex-col sm:flex-row sm:items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-full sm:max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />

          <input
            type="text"
            placeholder="Search by name or description..."
            onChange={(e) => debouncedSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 placeholder-gray-400 text-sm sm:text-base"
            aria-label="Search products"
          />
        </div>

        <div className="flex items-center">
          <label className="text-gray-400 mr-2 text-sm sm:text-base">
            Items per page:
          </label>

          <select
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
            aria-label="Items per page"
          >
            {[5, 10, 20, 50].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-900/30 text-red-400 rounded-lg text-sm sm:text-base">
          {error}
          {' '}
          <button onClick={fetchAllData} className="underline">
            Retry
          </button>
        </div>
      )}

      {/* Product List */}
      {products.length === 0 ? (
        <div className="text-center text-gray-300 text-sm sm:text-base">
          {searchTerm ? 'No products match your search' : 'No products available'}
        </div>
      ) : (
        <>
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 overflow-hidden">

            {/* Mobile View */}
            <div className="block md:hidden">
              {products.map((product) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-t border-gray-700 p-4 hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-start gap-4">

                    <div className="flex-shrink-0">
                      {isValidUrl(product.image) ? (
                        <img
                          src={product.image}
                          alt={`Product ${product.name}`}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs">
                          <FiImage className="w-6 h-6" />
                        </div>
                      )}

                      <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs hidden">
                        <FiImage className="w-6 h-6" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="text-gray-300 font-medium">
                        ID: {product.id}
                      </div>

                      <div className="text-gray-400 text-sm">
                        Name: {product.name || 'N/A'}
                      </div>

                      <div className="text-gray-400 text-sm">
                        Description: {product.description || 'N/A'}
                      </div>

                      <div className="text-gray-400 text-sm">
                        Quantity: {product.quantity ?? 0}
                      </div>

                      <div className="text-gray-400 text-sm">
                        Category: {product.category?.name || 'N/A'}
                      </div>

                      <div className="text-gray-400 text-sm">
                        Brand: {product.brand?.name || 'N/A'}
                      </div>

                      <div className="text-gray-400 text-sm">
                        User: {product.user?.name || 'N/A'}
                      </div>

                      <div
                        className={`mt-2 px-2 py-1 rounded-full text-xs inline-block cursor-pointer ${
                          product.status
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-red-900/30 text-red-400'
                        }`}
                        onClick={() => toggleStatus(product.id, product.status)}
                      >
                        {product.status ? 'Active' : 'Inactive'}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit product ${product.id}`}
                      >
                        <FiEdit />
                      </button>

                      <button
                        onClick={() => handleOpenDeleteModal(product)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete product ${product.id}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>

                  </div>
                </motion.div>
              ))}
            </div>

            {/* Desktop View */}
            <table className="hidden md:table w-full">
              <thead>
                <tr className="bg-gray-700 text-gray-300 text-left">
                  <th className="p-4">ID</th>
                  <th className="p-4">Image</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Brand</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>

              <tbody>
                {products.map((product) => (
                  <motion.tr
                    key={product.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-t border-gray-700 hover:bg-gray-700 transition-colors"
                  >
                    <td className="p-4 text-gray-300">
                      {product.id}
                    </td>

                    <td className="p-4">
                      {isValidUrl(product.image) ? (
                        <img
                          src={product.image}
                          alt={`Product ${product.name}`}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs">
                          <FiImage className="w-6 h-6" />
                        </div>
                      )}

                      <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs hidden">
                        <FiImage className="w-6 h-6" />
                      </div>
                    </td>

                    <td className="p-4 text-gray-300">
                      {product.name || 'N/A'}
                    </td>

                    <td className="p-4 text-gray-300">
                      {product.description || 'N/A'}
                    </td>

                    <td className="p-4 text-gray-300">
                      {product.quantity ?? 0}
                    </td>

                    <td className="p-4 text-gray-300">
                      {product.category?.name || 'N/A'}
                    </td>

                    <td className="p-4 text-gray-300">
                      {product.brand?.name || 'N/A'}
                    </td>

                    <td className="p-4 text-gray-300">
                      {product.user?.name || 'N/A'}
                    </td>

                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs cursor-pointer ${
                          product.status
                            ? 'bg-green-900/30 text-green-400'
                            : 'bg-red-900/30 text-red-400'
                        }`}
                        onClick={() => toggleStatus(product.id, product.status)}
                      >
                        {product.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="p-4 flex space-x-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Edit product ${product.id}`}
                      >
                        <FiEdit />
                      </button>

                      <button
                        onClick={() => handleOpenDeleteModal(product)}
                        className="p-2 rounded-full hover:bg-gray-600 text-gray-300"
                        aria-label={`Delete product ${product.id}`}
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 gap-4">
            <p className="text-gray-400 text-sm sm:text-base">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} products
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
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 2 && page <= currentPage + 2)
                )
                .map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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

      {/* Add/Edit Product Modal */}
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
                setEditingProduct(null);
                setFormData({ ...initialFormData });
                setImagePreview(null);
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
                <h3
                  id="modal-title"
                  className="text-lg sm:text-xl font-bold text-white"
                >
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>

                <button
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProduct(null);
                    setFormData({ ...initialFormData });
                    setImagePreview(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  disabled={isSubmitting}
                  aria-label="Close modal"
                >
                  <FiX />
                </button>
              </div>

              <form
                onSubmit={handleAddOrUpdateProduct}
                className="space-y-4"
              >

                {/* Product Name */}
                <div>
                  <label
                    htmlFor="product-name"
                    className="block text-gray-300 mb-1 text-sm sm:text-base"
                  >
                    Name
                  </label>

                  <input
                    id="product-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    required
                    maxLength={255}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                    placeholder="Enter product name"
                  />
                </div>

                {/* Product Description */}
                <div>
                  <label
                    htmlFor="product-description"
                    className="block text-gray-300 mb-1 text-sm sm:text-base"
                  >
                    Description (Optional)
                  </label>

                  <textarea
                    id="product-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    rows="4"
                    disabled={isSubmitting}
                    placeholder="Enter description"
                  />
                </div>

                {/* Product Quantity */}
                <div>
                  <label
                    htmlFor="product-quantity"
                    className="block text-gray-300 mb-1 text-sm sm:text-base"
                  >
                    Quantity
                  </label>

                  <input
                    id="product-quantity"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                    placeholder="Enter product quantity"
                  />
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="product-category"
                    className="block text-gray-300 mb-1 text-sm sm:text-base"
                  >
                    Category
                  </label>

                  <select
                    id="product-category"
                    value={formData.category_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        category_id: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a category</option>

                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name || `Category ${category.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Brand */}
                <div>
                  <label
                    htmlFor="product-brand"
                    className="block text-gray-300 mb-1 text-sm sm:text-base"
                  >
                    Brand
                  </label>

                  <select
                    id="product-brand"
                    value={formData.brand_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        brand_id: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a brand</option>

                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name || `Brand ${brand.id}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* User */}
                <div>
                  <label
                    htmlFor="product-user"
                    className="block text-gray-300 mb-1 text-sm sm:text-base"
                  >
                    User
                  </label>

                  <select
                    id="product-user"
                    value={formData.user_id}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        user_id: e.target.value,
                      }))
                    }
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

                {/* Product Image */}
                <div>
                  <label
                    htmlFor="product-image"
                    className="block text-gray-300 mb-1 text-sm sm:text-base"
                  >
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
                      <FiImage className="w-6 h-6" />
                    </div>
                  )}

                  <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-xs mb-2 hidden">
                    <FiImage className="w-6 h-6" />
                  </div>

                  <input
                    id="product-image"
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    onChange={handleImageChange}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Product Status */}
                <div>
                  <label
                    htmlFor="product-status"
                    className="block text-gray-300 mb-1 text-sm sm:text-base"
                  >
                    Status
                  </label>

                  <select
                    id="product-status"
                    value={formData.status ? '1' : '0'}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value === '1',
                      }))
                    }
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-100 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>

                {/* Buttons */}
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingProduct(null);
                      setFormData({ ...initialFormData });
                      setImagePreview(null);
                    }}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-lg text-white text-sm sm:text-base ${
                      isSubmitting
                        ? 'bg-indigo-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? (editingProduct ? 'Updating...' : 'Adding...')
                      : (editingProduct ? 'Update' : 'Add')}
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
                setProductToDelete(null);
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
                <h3
                  id="delete-modal-title"
                  className="text-lg sm:text-xl font-bold text-white"
                >
                  Confirm Deletion
                </h3>

                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setProductToDelete(null);
                  }}
                  className="p-2 rounded-full hover:bg-gray-700 text-gray-300"
                  aria-label="Close delete modal"
                >
                  <FiX />
                </button>
              </div>

              <p className="text-gray-300 mb-4 text-sm sm:text-base">
                Are you sure you want to delete product ID{' '}
                {productToDelete?.id} ({productToDelete?.name})?
                This action cannot be undone.
              </p>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setProductToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-gray-300 text-sm sm:text-base"
                >
                  Cancel
                </button>

                <button
                  onClick={handleDeleteProduct}
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

export default Product;
