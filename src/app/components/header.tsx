'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import {
  FaSearch, FaChevronDown, FaUser, FaCog, FaSignOutAlt,
  FaBell, FaSun, FaMoon, FaUserAlt 
} from 'react-icons/fa';
import { useUser } from '../context/UserContext';
import { deleteCookie } from '../utils/cookies';

export default function Header() {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const { user } = useUser();
  const router = useRouter();

  // ฟังก์ชัน Sign Out
  const handleSignOut = () => {
    // ลบ token ออกจาก cookies
    deleteCookie('authToken');
    
    // Trigger event เพื่อให้ TokenContext อัพเดต
    window.dispatchEvent(new CustomEvent('tokenUpdated'));
    
    // ปิด dropdown menu
    setShowUserMenu(false);
    
    // Redirect ไปหน้า login
    router.push('/login');
  };
  // Mock notifications data
  const notifications = [
    { id: 1, title: 'System Update', message: 'New features available', time: '5m ago', unread: true },
    { id: 2, title: 'User Registration', message: 'New user joined the system', time: '15m ago', unread: true },
    { id: 3, title: 'Backup Complete', message: 'Daily backup successfully completed', time: '1h ago', unread: false },
    { id: 4, title: 'Security Alert', message: 'Failed login attempts detected', time: '2h ago', unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  // toggleTheme now comes from context

  return (
    <header className={`fixed top-6 left-85 right-6 h-16 border rounded-2xl flex items-center justify-between z-30 shadow-xl px-6 transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#D4E6DA]'}`}>
      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-base z-10 group-focus-within:text-green-600 transition-colors ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Search anything..."
            className={`w-full pl-10 pr-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 transition-all duration-200 shadow-sm hover:shadow-md ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500 focus:bg-gray-800' : 'bg-white border-[#D4E6DA] text-gray-700 placeholder-gray-400 focus:bg-white'}`}
          />
        </div>
      </div>

      {/* Action Buttons & User Menu */}
      <div className="flex items-center gap-3">
        {/* Dark/Light Mode Toggle */}
        <button
          onClick={toggleTheme}
          className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-[#D4E6DA] hover:bg-[#F0F8F2]'}`}
        >
          <div className="relative">
            {isDarkMode ? (
              <FaMoon className="text-indigo-400 text-base transition-all duration-200" />
            ) : (
              <FaSun className="text-amber-500 text-base transition-all duration-200" />
            )}
          </div>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-200 shadow-sm hover:shadow-md ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-[#D4E6DA] hover:bg-[#F0F8F2]'}`}
          >
            <FaBell className={`text-base group-hover:text-gray-800 transition-colors ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className={`absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-xl py-3 z-50 border transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#D4E6DA]'}`}>
              <div className={`px-4 py-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-[#D4E6DA]'}`}>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Notifications</h3>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{unreadCount} unread messages</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    className={`w-full px-4 py-3 flex items-start gap-3 transition-colors border-b last:border-b-0 ${isDarkMode ? 'hover:bg-gray-800 border-gray-800' : 'hover:bg-[#F0F8F2] border-[#F0F8F2]'}`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${notification.unread ? 'bg-green-500' : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                    <div className="flex-1 text-left">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{notification.title}</div>
                      <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{notification.message}</div>
                      <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{notification.time}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div className={`px-4 py-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-[#D4E6DA]'}`}>
                <button className={`text-xs font-medium ${isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'}`}>
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-[#D4E6DA] hover:bg-[#F0F8F2]'}`}
          >
            {/* User Avatar */}
            <div className="relative">
              <div className="w-9 h-9 rounded-xl overflow-hidden bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-sm text-white font-semibold text-sm">
                <FaUserAlt />
              </div>
              {/* Online Status */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
            </div>

            {/* User Info */}
            <div className="flex flex-col items-start text-left">
              <span className={`text-sm font-semibold transition-colors ${isDarkMode ? 'text-gray-200 group-hover:text-gray-100' : 'text-gray-800 group-hover:text-gray-900'}`}>
                {user?.employee_id}
              </span>
              <span className={`text-xs transition-colors ${isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-500 group-hover:text-gray-600'}`}>
                Admin
              </span>
            </div>

            {/* Dropdown Icon */}
            <FaChevronDown className={`text-xs transition-all duration-200 ${isDarkMode ? 'text-gray-400 group-hover:text-gray-300' : 'text-gray-400 group-hover:text-gray-600'} ${showUserMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className={`absolute right-0 top-full mt-2 w-56 rounded-2xl shadow-xl py-3 z-50 border transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#D4E6DA]'}`}>
              <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-[#D4E6DA]'}`}>
                <div className={`text-base font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{user?.f_name && user?.l_name ? `${user.f_name} ${user.l_name}` : 'ไม่พบข้อมูลผู้ใช้'}</div>
                <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>แผนก : {user?.Department?.name}</div>
              </div>
              <div className="py-2">
                <button className={`w-full flex items-center gap-3 px-4 py-3 text-base transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-[#F0F8F2]'}`}>
                  <FaUser className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  My Profile
                </button>
                <button className={`w-full flex items-center gap-3 px-4 py-3 text-base transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-[#F0F8F2]'}`}>
                  <FaCog className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  Settings
                </button>
                <button className={`w-full flex items-center gap-3 px-4 py-3 text-base transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-[#F0F8F2]'}`}>
                  <FaBell className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  Notification
                </button>
              </div>
              <div className={`border-t pt-2 ${isDarkMode ? 'border-gray-700' : 'border-[#D4E6DA]'}`}>
                <button 
                  onClick={handleSignOut}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-base transition-colors ${isDarkMode ? 'text-red-400 hover:bg-red-900/40' : 'text-red-600 hover:bg-red-50/80'}`}
                >
                  <FaSignOutAlt className="text-red-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click Outside to Close Dropdowns */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
}