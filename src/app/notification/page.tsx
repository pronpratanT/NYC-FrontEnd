'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import "react-datepicker/dist/react-datepicker.css";
import "@/app/styles/react-datepicker-dark.css";
import "@/app/styles/react-datepicker-light.css";
import "@/app/styles/react-datepicker-orange.css";
import { useTheme } from '@/app/components/ThemeProvider';
import Sidebar from '@/app/components/sidebar';
import Header from '@/app/components/header';
import { useSidebar } from '@/app/context/SidebarContext';
import { useUser } from '@/app/context/UserContext';
import { useToken } from '@/app/context/TokenContext';

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

    const { isCollapsed } = useSidebar();
    const router = useRouter();
    const { isDarkMode } = useTheme();
    const [partNos, setPartNos] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [search, setSearch] = useState<string>("");
    const [selectedParts, setSelectedParts] = useState<string[]>([]);
    const [rowDueDates, setRowDueDates] = useState<(Date | null)[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const token = useToken();
    const [partsInfo, setPartsInfo] = useState<partData[]>([]);
    const [qtyData, setQtyData] = useState<(string | number)[]>([]);
    const [objectiveData, setObjectiveData] = useState<string[]>([]);
    const [destinationData, setDestinationData] = useState<string[]>([]);
    const [stockData, setStockData] = useState<string[]>([]);
    const [priceData, setPriceData] = useState<string[]>([]);
    const [unitData, setUnitData] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false)

    // ROOT PATH from .env
    // Removed unused variable apiUrl

    // Pagination
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;
    const totalPages = Math.ceil(selectedParts.length / rowsPerPage);
    const pagedParts = selectedParts.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    const pagedDueDates = rowDueDates.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    const pagedQty = qtyData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    const pagedObjective = objectiveData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    // Create Part No. Modal
    const [showCreatPartNo, setShowCreatPartNo] = useState(false);

    const isSelectedPartsEmpty = selectedParts.length === 0;

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

                </div>
            </main>
        </div>
    );
}