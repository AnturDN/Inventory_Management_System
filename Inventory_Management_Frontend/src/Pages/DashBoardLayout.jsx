import { useState } from "react";
import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";
import Sidebar from "../Component/Sidebar";
import Header from "../Component/Header";

const DashboardLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Apply padding based on sidebar state
  const mainContentPadding = isSidebarCollapsed ? "pl-[80px]" : "pl-[280px]";

  return (
    <div className="min-h-screen w-full bg-gray-800 flex">
      {/* Sidebar with built-in hamburger menu */}
      <Sidebar onToggleCollapse={setIsSidebarCollapsed} />
      
      {/* Main content area */}
      <div className={`flex-1 flex flex-col ${mainContentPadding} transition-all duration-300`}>
        <Header />
        
        {/* Scrollable content area */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="bg-gray-800 rounded-xl shadow-sm border border-gray-700 h-full flex flex-col">
            {/* Outlet with internal scrolling */}
            <div className="flex-1 overflow-y-auto p-4">
              <Outlet />
            </div>
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardLayout;