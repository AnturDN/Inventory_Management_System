// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import { FiBox, FiTruck, FiDollarSign, FiShoppingCart, FiCreditCard } from 'react-icons/fi';

const Home = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div 
          className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700"
          whileHover={{ y: -5 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 font-medium">Total Products</h3>
            <div className="p-3 rounded-lg bg-indigo-900/30 text-indigo-400">
              <FiBox size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-bold text-white">1,248</h2>
            <p className="text-sm text-indigo-400 mt-1">+12% from last month</p>
          </div>
        </motion.div>

        <motion.div 
          className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700"
          whileHover={{ y: -5 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 font-medium">Low Stock</h3>
            <div className="p-3 rounded-lg bg-amber-900/30 text-amber-400">
              <FiBox size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-bold text-white">42</h2>
            <p className="text-sm text-amber-400 mt-1">Need restocking</p>
          </div>
        </motion.div>

        <motion.div 
          className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700"
          whileHover={{ y: -5 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 font-medium">Active Suppliers</h3>
            <div className="p-3 rounded-lg bg-emerald-900/30 text-emerald-400">
              <FiTruck size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-bold text-white">28</h2>
            <p className="text-sm text-emerald-400 mt-1">+2 new this month</p>
          </div>
        </motion.div>

        <motion.div 
          className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700"
          whileHover={{ y: -5 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 font-medium">Total Transactions</h3>
            <div className="p-3 rounded-lg bg-purple-900/30 text-purple-400">
              <FiDollarSign size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-bold text-white">3,456</h2>
            <p className="text-sm text-purple-400 mt-1">+8% from last month</p>
          </div>
        </motion.div>

        <motion.div 
          className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700"
          whileHover={{ y: -5 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 font-medium">Total Sales</h3>
            <div className="p-3 rounded-lg bg-green-900/30 text-green-400">
              <FiShoppingCart size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-bold text-white">$12,789</h2>
            <p className="text-sm text-green-400 mt-1">+15% from last month</p>
          </div>
        </motion.div>

        <motion.div 
          className="bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-700"
          whileHover={{ y: -5 }}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-gray-400 font-medium">Total Expenses</h3>
            <div className="p-3 rounded-lg bg-red-900/30 text-red-400">
              <FiCreditCard size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h2 className="text-3xl font-bold text-white">$4,321</h2>
            <p className="text-sm text-red-400 mt-1">+5% from last month</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;