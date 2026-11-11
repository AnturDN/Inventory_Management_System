import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, 
  FiBell, 
  FiUser,
  FiLogIn, 
  FiLogOut,
  FiChevronDown,
  FiSettings
} from 'react-icons/fi';

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profilePicture, setProfilePicture] = useState(null);
  const userDropdownRef = useRef(null);
  const notificationsRef = useRef(null);

  const notifications = [
    { id: 1, text: 'Low stock alert', time: '10 min ago', read: false },
    { id: 2, text: 'New order received', time: '1 hour ago', read: true }
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfilePictureUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a JPEG or PNG image.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert('Image size should not exceed 2MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setProfilePicture(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-gray-800 text-gray-100 shadow-lg border-b border-gray-700 w-full">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Search bar - now always visible */}
          <div className="flex-1 max-w-full sm:max-w-md lg:max-w-lg">
            <div className="relative">
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center space-x-3 sm:space-x-4 ml-3 sm:ml-4">
            <div className="relative" ref={notificationsRef}>
              <button 
                className="p-2 rounded-full hover:bg-gray-700 relative transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                onClick={() => setShowNotifications(!showNotifications)}
                aria-label={`Notifications (${unreadCount} unread)`}
              >
                <FiBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-gray-800"></span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-72 sm:w-80 bg-gray-700 rounded-lg shadow-xl border border-gray-600 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto"
                  >
                    <div className="p-3 border-b border-gray-600">
                      <h3 className="font-medium text-sm sm:text-base">Notifications ({unreadCount})</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map(notification => (
                        <div 
                          key={notification.id}
                          className={`p-3 border-b border-gray-600 ${!notification.read ? 'bg-gray-800' : 'hover:bg-gray-600'}`}
                        >
                          <p className="text-sm">{notification.text}</p>
                          <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="relative" ref={userDropdownRef}>
              {isLoggedIn ? (
                <>
                  <button 
                    className="flex items-center space-x-2 py-1 pl-1 pr-2 rounded-full hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    aria-label="User menu"
                    aria-expanded={showUserDropdown}
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 flex items-center justify-center overflow-hidden">
                      {profilePicture ? (
                        <img 
                          src={profilePicture} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FiUser className="text-white text-sm" />
                      )}
                    </div>
                    <span className="font-medium hidden sm:inline">Admin</span>
                    <FiChevronDown className={`transition-transform ${showUserDropdown ? 'rotate-180' : ''} hidden sm:block`} />
                  </button>
                  <AnimatePresence>
                    {showUserDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-gray-700 rounded-lg shadow-xl border border-gray-600 z-50"
                      >
                        <div className="py-1">
                          <label className="flex items-center px-4 py-2 text-sm hover:bg-gray-600 cursor-pointer">
                            <input
                              type="file"
                              accept="image/jpeg,image/png"
                              onChange={handleProfilePictureUpload}
                              className="hidden"
                            />
                            <FiUser className="mr-2" /> Upload Profile Picture
                          </label>
                          <a href="#" className="flex items-center px-4 py-2 text-sm hover:bg-gray-600">
                            <FiUser className="mr-2" /> Profile
                          </a>
                          <a href="#" className="flex items-center px-4 py-2 text-sm hover:bg-gray-600">
                            <FiSettings className="mr-2" /> Settings
                          </a>
                          <button 
                            onClick={() => setIsLoggedIn(false)}
                            className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-600 border-t border-gray-600"
                          >
                            <FiLogOut className="mr-2" /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              ) : (
                <button 
                  onClick={() => setIsLoggedIn(true)}
                  className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors text-sm sm:text-base"
                >
                  <FiLogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;