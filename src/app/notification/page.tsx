'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

// components
import { useTheme } from '@/app/components/ThemeProvider';
import Sidebar from '@/app/components/sidebar';
import Header from '@/app/components/header';
import { useUser } from '@/app/context/UserContext';
import { useToken } from '@/app/context/TokenContext';

// css
import './notification.css';

// context
import { useSidebar } from '@/app/context/SidebarContext';

// icons
import { IoMdNotifications } from "react-icons/io";
import { GoArrowRight } from "react-icons/go";
import { GoCheckCircleFill } from "react-icons/go";
import { GoXCircleFill } from "react-icons/go";
import { GoClockFill } from "react-icons/go";
import { GoAlertFill } from "react-icons/go";
import { IoAlertCircle } from "react-icons/io5";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { IoIosCloseCircle } from "react-icons/io";
import { FaShoppingCart } from 'react-icons/fa';

// hero ui
import { Tabs, Tab, Card, CardBody } from "@heroui/react";

type partData = {
    part_no: string | null;
    part_name: string | null;
    prod_code: string | null;
    qty: number | null;
    unit: string | null;
    vendor: string | null;
    stock: number | null;
    price_per_unit: number | null;
}

type Notification = {
    amount_unread_notify: number;
    notify_list: Array<{
        notify_id: number;
        notify_title: string;
        notify_message: string;
        created_at: string;
        status: string;
        link?: string;
    }>;
};

type NotificationResponse = {
    data: Notification;
};

// ตัวช่วย type สำหรับรายการแจ้งเตือนเดี่ยว ๆ
type NotificationItem = Notification['notify_list'][number];

export default function NotificationPage() {
    const { isCollapsed } = useSidebar();
    const { isDarkMode } = useTheme();
    const token = useToken();
    const router = useRouter();

    // Selected notification state (หนึ่งรายการจาก notify_list)
    const [notificationsData, setNotificationsData] = useState<NotificationResponse>()
    const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

    // Check Role from User Context
    const { user } = useUser();
    // ดึง permissions ของ service = 2 จากโครงสร้างใหม่ user.role
    const rawRole = user?.role;
    let permissions: import("@/app/context/UserContext").Permission[] = [];
    if (Array.isArray(rawRole)) {
        permissions = rawRole.flatMap((r: import("@/app/context/UserContext").Role) => r?.permissions ?? []);
    }
    const permission = permissions.find(
        (p: import("@/app/context/UserContext").Permission) => p && Number(p.service) === 2
    );
    // ดึงสิทธิ์เฉพาะ department ตาม Department.ID ของ user
    const department = permission?.departments?.find?.(
        (d: import("@/app/context/UserContext").Departments) => d && d.department === user?.Department?.ID
    );
    const roles: string[] = department?.roles ?? [];
    const roleNames: string[] = department?.roles_name ?? [];
    // roleID = ค่า role ที่เป็นตัวเลขมากที่สุดใน roles (เช่น ["2","4"] -> 4)
    const numericRoles = roles
        .map(r => parseInt(r, 10))
        .filter(n => !Number.isNaN(n));
    const roleID = numericRoles.length > 0
        ? Math.max(...numericRoles)
        : undefined;
    // serviceID แปลงเป็น number เช่นกัน
    const serviceID = permission
        ? (typeof permission.service === "string" ? parseInt(permission.service, 10) : permission.service)
        : undefined;
    const departmentId = user?.Department?.ID;
    console.log("User Role ID:", roleID, "Service ID:", serviceID, "Department ID:", departmentId);

    // Filter notifications by tab
    const getFilteredNotifications = (tabId: string) => {
        if (tabId === 'all') return notificationsData?.data.notify_list ?? [];
        if (tabId === 'read') return notificationsData?.data.notify_list.filter(n => n.status === 'read') ?? [];
        if (tabId === 'unread') return notificationsData?.data.notify_list.filter(n => n.status === 'unread') ?? [];
        return notificationsData?.data.notify_list ?? [];
    };

    // Format datetime (absolute)
    const formatDateTime = (datetime: string) => {
        const date = new Date(datetime);
        return date.toLocaleString('th-TH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Relative time ("Just now", "5 minutes ago", ...)
    const formatRelativeTime = (datetime: string) => {
        const date = new Date(datetime);
        const diffMs = Date.now() - date.getTime();
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 60) return 'Just now';
        if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
        if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
        return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    };

    //tabs state
    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'read', label: 'Read' },
        { id: 'unread', label: 'Unread' },
    ];

    //NOTE notification data
    //notification data
    useEffect(() => {
        const fetchNotifications = async () => {
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

        fetchNotifications();
    }, []);

    return (
        <div className="min-h-screen relative">
            <Sidebar />
            <Header />
            {/* Main Content */}
            <main
                className="mt-[7.5rem] mr-6 transition-all duration-300"
                style={{
                    minHeight: 'calc(100vh - 3rem)',
                    position: 'relative',
                    marginLeft: isCollapsed ? '9rem' : 'calc(18rem + 55px)',
                }}
            >
                <div className="max-w-none w-full space-y-8 mb-6 relative z-10">
                    {/* Notifications Header */}
                    <div className="flex items-center space-x-3">
                        <div>
                            <IoMdNotifications className="inline w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold inline text-white">Notifications</h1>
                            <h1 className='text-md'>ติดตามข่าวสารล่าสุดเกี่ยวกับกิจกรรมของคุณอยู่เสมอ</h1>
                        </div>
                    </div>
                    {/* Tab All / Unread */}
                    <div>
                        <Tabs
                            aria-label="Dynamic tabs"
                            items={tabs}
                            variant="solid"
                            color="primary"
                            classNames={{
                                base: "notification-tabs bg-[#232326] rounded-xl p-1 w-fit",
                                tabList: "gap-1 w-full relative rounded-lg p-0 bg-transparent",
                                cursor: "bg-[#35353a] outline-offset-[-2px] rounded-lg",
                                tab: "px-6 py-2 h-10",
                                tabContent: "group-data-[selected=true]:text-white text-gray-400 font-medium"
                            }}
                        >
                            {(item) => {
                                const notifications = getFilteredNotifications(item.id);
                                return (
                                    <Tab key={item.id} title={item.label}>
                                        <div className="grid grid-cols-12 gap-6 mt-6">
                                            {/* Left Side - Notification List */}
                                            <div className="col-span-12 md:col-span-5">
                                                <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
                                                    <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-slate-700/50 bg-slate-800/30' : 'border-gray-200 bg-gray-50'}`}>
                                                        <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                                            Notifications ({notifications.length})
                                                        </h2>
                                                    </div>
                                                    <div className="max-h-[600px] overflow-y-auto">
                                                        {notifications.length > 0 ? (
                                                            notifications.map((notification) => (
                                                                <div
                                                                    key={notification.notify_id}
                                                                    onClick={() => setSelectedNotification(notification)}
                                                                    className={`px-6 py-4 border-b cursor-pointer transition-all duration-200 ${selectedNotification?.notify_id === notification.notify_id
                                                                        ? isDarkMode
                                                                            ? 'bg-blue-900/30 border-blue-700/50'
                                                                            : 'bg-blue-50 border-blue-200'
                                                                        : isDarkMode
                                                                            ? 'border-slate-700/30 hover:bg-slate-800/40'
                                                                            : 'border-gray-100 hover:bg-gray-50'
                                                                        }`}
                                                                >
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <div className="flex flex-1 items-center justify-between min-w-0">
                                                                                    <div className="flex items-center min-w-0 flex-1">
                                                                                        {notification.status === 'unread' && (
                                                                                            <span className={`w-2 h-2 rounded-full flex-shrink-0 mr-2 ${isDarkMode ? 'bg-green-500' : 'bg-green-500'}`}></span>
                                                                                        )}
                                                                                        <span className="truncate">{notification.notify_title}</span>
                                                                                    </div>
                                                                                    {notification.notify_title === 'ระบบจัดซื้อ' && (
                                                                                        <FaShoppingCart className={`inline w-4 h-4 ml-2 ${isDarkMode ? 'text-green-500' : 'text-green-600'}`} />
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <div className='flex items-center gap-2 mb-1'>
                                                                                    {notification.notify_message.includes('มีการอนุมัติ') && (
                                                                                        <IoIosCheckmarkCircle className={`inline w-4 h-4 ml-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                                                                    )}
                                                                            </div>
                                                                            <p className={`text-xs line-clamp-2 mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                                                                                {notification.notify_message}
                                                                            </p>
                                                                            <div className="flex items-center justify-between mt-1">
                                                                                <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                                                                                    {formatRelativeTime(notification.created_at)}
                                                                                </span>
                                                                                <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                                                                                    {formatDateTime(notification.created_at)}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <div className={`px-6 py-12 text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                <p>No notifications</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Side - Notification Detail */}
                                            <div className="col-span-12 md:col-span-7">
                                                <div className={`rounded-2xl border overflow-hidden min-h-[400px] ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
                                                    {selectedNotification ? (
                                                        <div>
                                                            <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-slate-700/50 bg-slate-800/30' : 'border-gray-200 bg-gray-50'}`}>
                                                                <div className="flex items-center justify-between">
                                                                    <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                                                        Notification Detail
                                                                    </h2>
                                                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${selectedNotification.status === 'unread'
                                                                        ? isDarkMode
                                                                            ? 'bg-green-900/30 text-green-300 border border-green-700/50'
                                                                            : 'bg-green-50 text-green-700 border border-green-200'
                                                                        : isDarkMode
                                                                            ? 'bg-gray-700/30 text-gray-400 border border-gray-600/50'
                                                                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                                                                        }`}>
                                                                        {selectedNotification.status === 'unread' ? 'Unread' : 'Read'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="px-6 py-6 space-y-4">
                                                                <div>
                                                                    <label className={`text-sm font-medium block mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                                                                        หัวข้อ
                                                                    </label>
                                                                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                                                        {selectedNotification.notify_title}
                                                                    </h3>
                                                                </div>
                                                                <div>
                                                                    <label className={`text-sm font-medium block mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                                                                        ข้อความ
                                                                    </label>
                                                                    <p className={`text-base leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                                                        {selectedNotification.notify_message}
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <label className={`text-sm font-medium block mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                                                                        วันที่และเวลา
                                                                    </label>
                                                                    <p className={`text-base ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                                                        {formatDateTime(selectedNotification.created_at)}
                                                                    </p>
                                                                </div>
                                                                {selectedNotification.link && (
                                                                    <div className="pt-4">
                                                                        <button
                                                                            onClick={() => router.push(selectedNotification.link!)}
                                                                            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${isDarkMode
                                                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                                                                                }`}
                                                                        >
                                                                            ดูรายละเอียด
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={`flex items-center justify-center h-full min-h-[400px] ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                            <div className="text-center">
                                                                <IoMdNotifications className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                                                <p className="text-lg">เลือกการแจ้งเตือนเพื่อดูรายละเอียด</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Tab>
                                );
                            }}
                        </Tabs>
                    </div>
                </div>
            </main>
        </div>
    );
}