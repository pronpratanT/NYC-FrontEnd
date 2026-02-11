'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { useToken } from '../context/TokenContext';
import {
  FaSearch, FaChevronDown, FaUser, FaCog, FaSignOutAlt,
  FaBell, FaSun, FaMoon, FaUserAlt
} from 'react-icons/fa';
import { GoArrowRight } from "react-icons/go";
import { IoMdNotifications } from "react-icons/io";
import { useUser } from '../context/UserContext';
import { deleteCookie } from '../utils/cookies';
import { useSidebar } from '../context/SidebarContext';

type Notification = {
  amount_unread_notify: number;
  notify_list: Array<{
    notify_id: number;
    notify_title: string;
    notify_message: string;
    created_at: string;
    status: string;
    related: string;
  }>;
};

type NotificationResponse = {
  data: Notification;
};

function formatRelativeTime(createdAt: string): string {
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return '';

  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return `${diffSec}s ago`;

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} h ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} d ago`;
}

export default function Header() {
  const token = useToken();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const { user } = useUser();
  const router = useRouter();
  const { isCollapsed, setIsCollapsed, isMobile } = useSidebar();

  // Desktop: header pushed right by sidebar, Mobile: full-width with small margin
  const sidebarWidth = isMobile ? 0 : (isCollapsed ? 80 : 288);
  const left = isMobile ? 16 : sidebarWidth + 55; // px

  //notification data
  const [notificationsData, setNotificationsData] = useState<NotificationResponse>()

  // ฟังก์ชัน Sign Out
  const handleSignOut = () => {
    // ลบ token ออกจาก cookies
    deleteCookie('authToken');

    // Trigger event เพื่อให้ TokenContext อัพเดต
    window.dispatchEvent(new CustomEvent('tokenUpdated'));

    // ปิด dropdown menu
    setShowUserMenu(false);

    // Redirect ไปหน้า login
    router.push(process.env.NEXT_PUBLIC_LOGOUT_REDIRECT || "/login");
  };
  const unreadNotifyCount = notificationsData?.data?.amount_unread_notify ?? 0;

  const unreadNotifications = (notificationsData?.data?.notify_list ?? [])
    .filter((notification) => notification.status === 'UNREAD' || notification.status === 'unread')
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  const fetchNotifications = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/notify/history`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.ok) {
        const data: NotificationResponse = await response.json();
        setNotificationsData(data);
      } else {
        console.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchNotifications();
  }, [token]);

  useEffect(() => {
    const handleNotificationsUpdated = () => {
      if (!token) return;
      fetchNotifications();
    };

    window.addEventListener('notificationsUpdated', handleNotificationsUpdated);
    return () => {
      window.removeEventListener('notificationsUpdated', handleNotificationsUpdated);
    };
  }, [token]);

  useEffect(() => {
    console.log('Fetched notifications data:', notificationsData);
  }, [notificationsData]);
  // toggleTheme now comes from context

  const handleRelatedToPage = (relatedLink: string) => {
    if (!relatedLink) return;
    const compareBase = process.env.NEXT_PUBLIC_PURCHASE_PR_COMPARE_REDIRECT || '/services/purchase/comparePrice';
    if (!/^D|^I/.test(relatedLink)) {
      router.push(`${compareBase}?id=${relatedLink}`);
    }
    else {
      router.push(`/services/purchase/PO/ReviewedPO?poNo=${relatedLink}`);
    }
  }

  const handleReadNotification = async (notify_id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/notify/read/${notify_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        // แจ้งให้ทุกส่วนที่ฟัง event นี้ reload ข้อมูลแจ้งเตือน
        window.dispatchEvent(new CustomEvent('notificationsUpdated'));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <header
      className={`fixed top-4 sm:top-6 right-4 sm:right-6 h-16 border rounded-2xl flex items-center justify-between z-30 shadow-xl px-4 sm:px-6 transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#D4E6DA]'}`}
      style={{ left, transition: 'left 0.3s' }}
    >
      {/* Left section: mobile menu button + Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
        {/* Mobile sidebar toggle */}
        <button
          type="button"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`flex lg:hidden items-center justify-center w-9 h-9 rounded-xl border shadow-sm transition-colors duration-200 ${
            isDarkMode ? 'bg-gray-800 border-gray-700 text-slate-200 hover:bg-gray-700' : 'bg-white border-[#D4E6DA] text-gray-700 hover:bg-[#F0F8F2]'
          }`}
          aria-label="Toggle sidebar"
        >
          <span className="block w-4 h-[2px] rounded-full bg-current relative">
            <span className="absolute -top-1.5 left-0 w-4 h-[2px] rounded-full bg-current" />
            <span className="absolute top-1.5 left-0 w-3 h-[2px] rounded-full bg-current" />
          </span>
        </button>

        {/* Search Bar */}
        {/* <div className="relative group">
          <FaSearch className={`absolute left-3 top-1/2 transform -translate-y-1/2 text-base z-10 group-focus-within:text-green-600 transition-colors ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="Search anything..."
            className={`w-full pl-10 pr-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/50 transition-all duration-200 shadow-sm hover:shadow-md ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-200 placeholder-gray-500 focus:bg-gray-800' : 'bg-white border-[#D4E6DA] text-gray-700 placeholder-gray-400 focus:bg-white'}`}
          />
        </div> */}
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
            {unreadNotifyCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                {unreadNotifyCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className={`absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-xl py-3 z-50 border transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#D4E6DA]'}`}>
              <div className={`px-4 py-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-[#D4E6DA]'}`}>
                <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Notifications</h3>
                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{unreadNotifyCount} ข้อความ ที่ยังไม่ได้อ่าน</p>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {unreadNotifications.length === 0 ? (
                  <div className={`py-8 text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <IoMdNotifications className="mx-auto mb-2 text-3xl" />
                    <span>ไม่มีการแจ้งเตือนใหม่</span>
                  </div>
                ) : (
                  unreadNotifications.map((notification) => (
                    <button
                      key={notification.notify_id}
                      className={`group w-full px-4 py-3 flex items-start cursor-pointer gap-3 transition-colors border-b last:border-b-0 ${isDarkMode ? 'hover:bg-gray-800 border-gray-800' : 'hover:bg-[#F0F8F2] border-[#F0F8F2]'}`}
                      onClick={() => {
                        handleRelatedToPage(notification.related);
                        handleReadNotification(notification.notify_id);
                        setShowNotifications(false);
                      }}
                    >
                      <div className={`w-2 h-2 rounded-full mt-2 ${notification.status === 'UNREAD' || notification.status === 'unread' ? 'bg-green-500' : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`} />
                      <div className="flex-1 text-left">
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{notification.notify_title}</div>
                        <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{notification.notify_message}</div>
                        <div className='flex justify-between'>
                          <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{formatRelativeTime(notification.created_at)}</div>
                          <div className='invisible group-hover:visible'>
                            <GoArrowRight className='w-4 h-4 text-slate-500' />
                          </div>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
              <div className={`px-4 py-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-[#D4E6DA]'}`}>
                <button className={`text-xs font-medium cursor-pointer ${isDarkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'}`}
                  onClick={() => {
                    setShowNotifications(false);
                    router.push(process.env.NEXT_PUBLIC_NOTIFICATION_REDIRECT || "/notification");
                  }}
                >
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
                {user?.Department?.short_name}
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
                <button
                  className={`w-full flex items-center cursor-pointer gap-3 px-4 py-3 text-base transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-[#F0F8F2]'}`}
                  onClick={() => {
                    setShowUserMenu(false);
                    router.push(process.env.NEXT_PUBLIC_PROFILE_REDIRECT || "/profile");
                  }}
                >
                  <FaUser className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  My Profile
                </button>
                <button
                  className={`w-full flex items-center cursor-pointer gap-3 px-4 py-3 text-base transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-[#F0F8F2]'}`}
                  onClick={() => {
                    setShowUserMenu(false);
                    // router.push(process.env.NEXT_PUBLIC_SETTING_REDIRECT || "/setting");
                  }}
                >
                  <FaCog className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  Settings
                </button>
                <button
                  className={`w-full flex items-center cursor-pointer gap-3 px-4 py-3 text-base transition-colors ${isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-700 hover:bg-[#F0F8F2]'}`}
                  onClick={() => {
                    setShowUserMenu(false);
                    router.push(process.env.NEXT_PUBLIC_NOTIFICATION_REDIRECT || "/notification");
                  }}
                >
                  <FaBell className={`${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`} />
                  Notification
                </button>
              </div>
              <div className={`border-t pt-2 ${isDarkMode ? 'border-gray-700' : 'border-[#D4E6DA]'}`}>
                <button
                  onClick={handleSignOut}
                  className={`w-full flex items-center cursor-pointer gap-3 px-4 py-3 text-base transition-colors ${isDarkMode ? 'text-red-400 hover:bg-red-900/40' : 'text-red-600 hover:bg-red-50/80'}`}
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