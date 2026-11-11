// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiHome, 
  FiBox, 
  FiTruck, 
  FiUsers, 
  FiSettings, 
  FiPieChart,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiPackage
} from 'react-icons/fi';
import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ onToggleCollapse }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  const handleToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onToggleCollapse(newCollapsedState);
    if (newCollapsedState) setIsInventoryOpen(false); // Close dropdown when collapsing
  };

  const variants = {
    open: { width: 280 },
    collapsed: { width: 80 }
  };

  const linkVariants = {
    open: { opacity: 1, x: 0 },
    collapsed: { opacity: 0, x: -20 }
  };

  const dropdownVariants = {
    open: { 
      height: 'auto', 
      opacity: 1, 
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    closed: { 
      height: 0, 
      opacity: 0, 
      transition: { duration: 0.3, ease: 'easeIn' }
    }
  };

  const navItems = [
    { name: "Dashboard", icon: <FiHome size={20} />, path: "/" },
    { 
      name: "Inventory", 
      icon: <FiBox size={20} />, 
      subItems: [
        { name: "Category", icon: <FiPackage size={16} />, path: "/category" },
        { name: "Brand", icon: <FiPackage size={16} />, path: "/brand" },
        { name: "Warehouse", icon: <FiPackage size={16} />, path: "/warehouse" },
        { name: "Role", icon: <FiPackage size={16} />, path: "/role" },
        { name: "Payment", icon: <FiPackage size={16} />, path: "/payment" },
        { name: "Supplier", icon: <FiPackage size={16} />, path: "/supplier" },
        { name: "Customer", icon: <FiPackage size={16} />, path: "/customer" },
        { name: "User", icon: <FiPackage size={16} />, path: "/user" },
        { name: "ExpensesCategory", icon: <FiPackage size={16} />, path: "/expensescategory" },
        { name: "Expenses", icon: <FiPackage size={16} />, path: "/expenses" },
        { name: "Product", icon: <FiPackage size={16} />, path: "/product" },
        { name: "Stocks", icon: <FiPackage size={16} />, path: "/stock" },
        { name: "StocksHistory", icon: <FiPackage size={16} />, path: "/stockshistory" },
        { name: "RetailCustomer", icon: <FiPackage size={16} />, path: "/retailcustomer" },
        { name: "Sell", icon: <FiPackage size={16} />, path: "/sell" },
        { name: "SellItem", icon: <FiPackage size={16} />, path: "/sellitem" },
        { name: "Transactions", icon: <FiPackage size={16} />, path: "/transactions" },
        { name: "Investment", icon: <FiPackage size={16} />, path: "/investment" },
      ]
    },
    { name: "Suppliers", icon: <FiTruck size={20} />, path: "/suppliers" },
    { name: "Customers", icon: <FiUsers size={20} />, path: "/customers" },
    { name: "Reports", icon: <FiPieChart size={20} />, },
    { name: "Settings", icon: <FiSettings size={20} />,  }
  ];

  return (
    <motion.div
      initial={false}
      animate={isCollapsed ? "collapsed" : "open"}
      variants={variants}
      className={`fixed top-0 left-0 h-screen bg-gray-800 shadow-lg z-40 overflow-hidden border-r border-gray-700`}
    >
      <div className="flex flex-col h-full">
        {/* Collapse Button */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-white">
              Inventory<span className="text-indigo-400">Pro</span>
            </h1>
          )}
          <button 
            onClick={handleToggle}
            className="p-2 rounded-md hover:bg-gray-700 text-gray-300"
          >
            {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-2">
          {navItems.map((item) => (
            <div key={item.name}>
              {item.subItems ? (
                <>
                  <button
                    onClick={() => !isCollapsed && setIsInventoryOpen(!isInventoryOpen)}
                    className={`flex items-center p-3 rounded-lg my-1 w-full text-left transition-colors ${
                      isInventoryOpen && !isCollapsed
                        ? 'bg-indigo-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
                    <motion.span 
                      variants={linkVariants}
                      animate={isCollapsed ? "collapsed" : "open"}
                      className="flex-1 whitespace-nowrap"
                    >
                      {item.name}
                    </motion.span>
                    {!isCollapsed && (
                      <FiChevronDown 
                        className={`transition-transform ${isInventoryOpen ? 'rotate-180' : ''}`}
                      />
                    )}
                  </button>
                  <AnimatePresence>
                    {!isCollapsed && isInventoryOpen && (
                      <motion.div
                        variants={dropdownVariants}
                        initial="closed"
                        animate="open"
                        exit="closed"
                        className="ml-6 overflow-hidden"
                      >
                        {item.subItems.map((subItem) => (
                          <NavLink
                            key={subItem.name}
                            to={subItem.path}
                            className={({ isActive }) => 
                              `flex items-center p-2 pl-4 rounded-lg my-1 transition-colors ${
                                isActive 
                                  ? 'bg-indigo-800 text-white' 
                                  : 'text-gray-400 hover:bg-gray-600'
                              }`
                            }
                          >
                            <span className="mr-2">{subItem.icon}</span>
                            <span className="text-sm whitespace-nowrap">{subItem.name}</span>
                          </NavLink>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) => 
                    `flex items-center p-3 rounded-lg my-1 transition-colors ${
                      isActive 
                        ? 'bg-indigo-900 text-white' 
                        : 'text-gray-300 hover:bg-gray-700'
                    }`
                  }
                >
                  <span className="mr-3">{item.icon}</span>
                  <motion.span 
                    variants={linkVariants}
                    animate={isCollapsed ? "collapsed" : "open"}
                    className="whitespace-nowrap"
                  >
                    {item.name}
                  </motion.span>
                </NavLink>
              )}
            </div>
          ))}
        </nav>
      </div>
    </motion.div>
  );
};

export default Sidebar;