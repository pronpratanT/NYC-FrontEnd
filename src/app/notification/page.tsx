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

export default function NotificationPage() {
    const { isCollapsed } = useSidebar();
    const { isDarkMode } = useTheme();
    const token = useToken();

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

    //tabs state
    const tabs = [
        { id: 'all', label: 'All Notifications', content: 'All Notifications Content' },
        { id: 'unread', label: 'Unread Notifications', content: 'Unread Notifications Content' },
    ];

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
                            {(item) => (
                                <Tab
                                    key={item.id}
                                    title={item.label}
                                >
                                    <Card>
                                        <CardBody>{item.content}</CardBody>
                                    </Card>
                                </Tab>
                            )}
                        </Tabs>
                    </div>
                </div>
            </main>
        </div>
    );
}