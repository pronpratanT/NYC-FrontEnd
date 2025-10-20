"use client";

import React from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

// Calendar
import { Thai } from "flatpickr/dist/l10n/th.js";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

// components
import Sidebar from "../../components/sidebar";
import Header from "../../components/header";
import { useTheme } from "../../components/ThemeProvider";
import { useToken } from "../../context/TokenContext";
import { useUser } from "../../context/UserContext";

// icons
import { LuCalendarFold } from "react-icons/lu";
import { MdOutlineSort, MdOutlineRemoveRedEye } from "react-icons/md";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { GoDownload } from "react-icons/go";
import { FaRegClock } from "react-icons/fa6";
import { HiDocumentText } from "react-icons/hi2";

type PRCard = {
    id: number;
    pr_no: string;
    pr_date: string;
    dept_name: string;
    dept_short_name: string;
    count_list: number;
    supervisor_id: string;
    manager_id: string;
    pu_responsible_id: string;
    supervisor_name: string;
    manager_name: string;
    pu_responsible: string;
    requester_name: string
    manager_approved: boolean;
    supervisor_approved: boolean;
    pu_operator_approved: boolean;
    supervisor_reject_at: string | null;
    manager_reject_at: string | null;
    pu_operator_reject_at: string | null;
    reason_rejected: string | null;
    waiting: number;
}

type Department = {
    ID: number;
    name: string;
    short_name: string;
    dep_no: string;
}

// Icon mapping for departments with consistent IoDocumentTextOutline icon
const departmentColors: { [key: string]: string } = {
    "NYC": "text-slate-500",
    "บุคคล": "text-sky-500",
    "บัญชี": "text-emerald-500",
    "จัดซื้อ": "text-indigo-500",
    "พัฒนาระบบ": "text-cyan-500",
    "การตลาด": "text-pink-500",
    "ฉีด": "text-orange-500",
    "ตกแต่ง นับบรรจุ": "text-teal-500",
    "ประกอบ": "text-blue-500",
    "งานโลหะ": "text-gray-500",
    "พ่นสี สกรีน": "text-rose-500",
    "คุณภาพ": "text-purple-500",
    "คลังสินค้า": "text-yellow-500",
    "แม่พิมพ์": "text-lime-500",
    "ซ่อมบำรุง": "text-green-500",
    "วิศวกรรมโครงการ": "text-amber-500",
    "ประกอบเครื่องใช้ไฟฟ้า": "text-blue-400",
    "IT-p2": "text-cyan-600",
    "ฝ่ายผลิต": "text-blue-700"
};

export default function PurchasePage() {
    // Theme context
    const { isDarkMode } = useTheme();

    // Router
    const router = useRouter();
    // Helper to get search param from URL (client only)
    function getSearchParam(key: string) {
        if (typeof window === 'undefined') return null;
        return new URLSearchParams(window.location.search).get(key);
    }
    const pathname = usePathname();

    // Error and loading states
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // NOTE: Data states
    const [prCards, setPrCards] = useState<PRCard[]>([]);
    const token = useToken();
    const { user } = useUser();
    const departmentId = user?.Department?.ID;
    const [departments, setDepartments] = useState<Department[]>([]);

    // NOTE: Search and filter states
    const [search, setSearch] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [dateRange, setDateRange] = useState<{ start: string; end: string; displayText: string } | null>(null);
    const [departmentFilter, setDepartmentFilter] = useState("");
    const dateRangeInputRef = useRef<HTMLInputElement>(null);
    // Sort states
    const [statusSortDropdownOpen, setStatusSortDropdownOpen] = useState(false);
    const [sortBy, setSortBy] = useState("newest");
    const [statusFilter, setStatusFilter] = useState<string>("");

    // TODO: Card Display Logic
    // Filtered and searched PR cards
    let displayedPrCards = prCards;
    if (departmentFilter) {
        displayedPrCards = displayedPrCards.filter(pr => pr.dept_name === departmentFilter);
    }
    // Status filter Cards
    if (statusFilter) {
        displayedPrCards = displayedPrCards.filter(pr => {
            if (statusFilter === 'rejected') {
                return pr.supervisor_reject_at || pr.manager_reject_at || pr.pu_operator_reject_at;
            } else if (statusFilter === 'supervisor') {
                return !pr.supervisor_approved && !pr.supervisor_reject_at && !pr.manager_reject_at && !pr.pu_operator_reject_at;
            } else if (statusFilter === 'manager') {
                return pr.supervisor_approved && !pr.manager_approved && !pr.supervisor_reject_at && !pr.manager_reject_at && !pr.pu_operator_reject_at;
            } else if (statusFilter === 'pu') {
                return pr.supervisor_approved && pr.manager_approved && !pr.pu_operator_approved && !pr.supervisor_reject_at && !pr.manager_reject_at && !pr.pu_operator_reject_at;
            } else if (statusFilter === 'processing') {
                return pr.supervisor_approved && pr.manager_approved && pr.pu_operator_approved && pr.waiting !== pr.count_list && !pr.supervisor_reject_at && !pr.manager_reject_at && !pr.pu_operator_reject_at;
            } else if (statusFilter === 'complete') {
                return pr.supervisor_approved && pr.manager_approved && pr.pu_operator_approved && pr.waiting === pr.count_list && !pr.supervisor_reject_at && !pr.manager_reject_at && !pr.pu_operator_reject_at;
            }
            return true;
        });
    }
    // Search filter Cards
    if (search && search.trim() !== "") {
        const lower = search.trim().toLowerCase();
        displayedPrCards = displayedPrCards.filter(pr =>
            (pr.pr_no && pr.pr_no.toLowerCase().includes(lower)) ||
            (pr.requester_name && pr.requester_name.toLowerCase().includes(lower)) ||
            (pr.pu_responsible && pr.pu_responsible.toLowerCase().includes(lower))
        );
    }
    // NEWEST or OLDEST sort
    if (sortBy === 'newest') {
        displayedPrCards = [...displayedPrCards].sort((a, b) => {
            // Sort by PR number descending (newest first) for format PR25A###
            const extract = (pr_no: string) => {
                const match = pr_no.match(/^PR(\d{2})A(\d{3})$/i);
                if (match) {
                    // Combine year and number for sorting, e.g. 25 + 001 => 25001
                    return parseInt(match[1] + match[2]);
                }
                return 0;
            };
            return extract(b.pr_no) - extract(a.pr_no);
        });
    } else if (sortBy === 'oldest') {
        displayedPrCards = [...displayedPrCards].sort((a, b) => {
            // Sort by PR number ascending (oldest first) for format PR25A###
            const extract = (pr_no: string) => {
                const match = pr_no.match(/^PR(\d{2})A(\d{3})$/i);
                if (match) {
                    return parseInt(match[1] + match[2]);
                }
                return 0;
            };
            return extract(a.pr_no) - extract(b.pr_no);
        });
    }

    // NOTE: Pagination states (sync with URL)
    const [itemsPerPage, setItemsPerPage] = useState(() => {
        const urlPerPage = typeof window !== 'undefined' ? getSearchParam('perPage') : null;
        return urlPerPage && [10, 25, 50, 100].includes(Number(urlPerPage)) ? Number(urlPerPage) : 10;
    });
    const [currentPage, setCurrentPage] = useState(() => {
        const urlPage = typeof window !== 'undefined' ? getSearchParam('page') : null;
        return urlPage && Number(urlPage) > 0 ? Number(urlPage) : 1;
    });
    const totalItems = displayedPrCards.length;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const totalPages = Math.ceil((totalItems + 1) / itemsPerPage);
    const showCreateCard = currentPage === 1;
    const itemsToShow = currentPage === 1 ? itemsPerPage - 1 : itemsPerPage; // -1 is createPR card
    const actualStartIndex = currentPage === 1 ? 0 : startIndex - 1; // -1 because first page has create card
    const actualEndIndex = currentPage === 1 ? itemsToShow : actualStartIndex + itemsPerPage;
    const paginatedPrCards = displayedPrCards.slice(actualStartIndex, actualEndIndex);
    // Function to update URL parameters
    const updateUrlParams = React.useCallback((newPage?: number, newPerPage?: number) => {
        const params = new URLSearchParams(window.location.search);
        if (newPage !== undefined) {
            if (newPage === 1) {
                params.delete('page');
            } else {
                params.set('page', newPage.toString());
            }
        }
        if (newPerPage !== undefined) {
            if (newPerPage === 10) {
                params.delete('perPage');
            } else {
                params.set('perPage', newPerPage.toString());
            }
        }
        const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.replace(newUrl, { scroll: false });
    }, [pathname, router]);

    // Reset to page 1 when filters change and update URL
    // Reset to page 1 only if filters actually change, not on every mount/navigation
    const prevFilters = useRef({ departmentFilter, statusFilter, search, sortBy, itemsPerPage });
    useEffect(() => {
        const prev = prevFilters.current;
        // Only reset if any filter (not page) actually changed
        if (
            prev.departmentFilter !== departmentFilter ||
            prev.statusFilter !== statusFilter ||
            prev.search !== search ||
            prev.sortBy !== sortBy ||
            prev.itemsPerPage !== itemsPerPage
        ) {
            setCurrentPage(1);
            updateUrlParams(1, itemsPerPage);
        }
        prevFilters.current = { departmentFilter, statusFilter, search, sortBy, itemsPerPage };
    }, [departmentFilter, statusFilter, search, sortBy, itemsPerPage, updateUrlParams]);

    // Sync state with URL params only on mount or true URL change
    useEffect(() => {
        const urlPage = getSearchParam('page');
        const urlPerPage = getSearchParam('perPage');
        const newPage = urlPage && Number(urlPage) > 0 ? Number(urlPage) : 1;
        const newPerPage = urlPerPage && [10, 25, 50, 100].includes(Number(urlPerPage)) ? Number(urlPerPage) : 10;
        setCurrentPage(newPage);
        setItemsPerPage(newPerPage);
    }, [pathname]);

    // Format ISO date to DD/MM/YYYY
    function formatISOToDisplay(iso: string) {
        const d = new Date(iso);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // Format date string to DD/MM/YYYY or return original if invalid
    function formatDate(dateStr: string) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // TODO: Handler
    // Handle closing calendar popup
    function handleCloseCalendar() {
        if (dateRange && dateRange.start && !dateRange.end) {
            setDateRange({
                start: dateRange.start,
                end: dateRange.start,
                displayText: formatISOToDisplay(dateRange.start)
            });
        }
        setCalendarOpen(false);
    }

    // TODO: GET Data
    {/* PR data */ }
    useEffect(() => {
        const fetchPrCards = async () => {
            try {
                setError(null);
                setLoading(true);

                if (!token) {
                    setError("ไม่พบ token กรุณาเข้าสู่ระบบใหม่");
                    setLoading(false);
                    return;
                }

                let url = `${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pr/request/departments`;
                let fetchOptions: RequestInit = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                };

                // ถ้ามี search ให้ใช้ API search-pr
                if (search && search.trim() !== "") {
                    url = `${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/search-pr?keyword=${encodeURIComponent(search)}`;
                    fetchOptions = {
                        ...fetchOptions,
                        cache: "no-store",
                        headers: {
                            ...(fetchOptions.headers || {}),
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    };
                }

                const response = await fetch(url, fetchOptions);
                if (response.status === 401) {
                    setError("Token หมดอายุ กรุณาเข้าสู่ระบบใหม่");
                    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    router.push("/login");
                    return;
                }
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                let prsArray = Array.isArray(data) ? data : data.data || [];

                // Filter by date range
                if (dateRange && dateRange.start && dateRange.end) {
                    prsArray = prsArray.filter((pr: PRCard) => {
                        if (!pr.pr_date) return false;
                        // แปลง pr_date เป็น Date object
                        // ถ้า pr_date เป็น ISO format (YYYY-MM-DD)
                        const prDate = new Date(pr.pr_date);
                        // แปลง dateRange.start และ dateRange.end จาก YYYY-MM-DD เป็น Date
                        const startDate = new Date(dateRange.start);
                        const endDate = new Date(dateRange.end);
                        // ตั้งเวลาให้ครอบคลุมทั้งวัน
                        startDate.setHours(0, 0, 0, 0);
                        endDate.setHours(23, 59, 59, 999);
                        // เปรียบเทียบ
                        return prDate >= startDate && prDate <= endDate;
                    });
                }
                setPrCards(prsArray);
                console.log("Filtered PR cards:", prsArray.length, "items");
            } catch (error: unknown) {
                console.error("Failed to fetch PR cards:", error);
                if (error instanceof Error) {
                    setError(error.message || "ไม่สามารถโหลดข้อมูล PR ได้");
                } else {
                    setError("ไม่สามารถโหลดข้อมูล PR ได้");
                }
            } finally {
                setLoading(false);
            }
        };
        if (token !== null) {
            fetchPrCards();
        }
    }, [token, router, search, dateRange]);

    {/* departments */ }
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                setError(null);
                const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_USER_SERVICE}/api/user/deps`, { cache: "no-store" });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                const data = await response.json();
                const depsArray = Array.isArray(data) ? data : data.data || [];

                setDepartments(depsArray);
                console.log("Loaded departments:", depsArray);

            } catch (error: unknown) {
                console.error("Failed to fetch departments:", error);
                if (error instanceof Error) {
                    setError(error.message || "ไม่สามารถโหลดข้อมูลแผนกได้");
                } else {
                    setError("ไม่สามารถโหลดข้อมูลแผนกได้");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchDepartments();
    }, []);

    // ANCHOR Calendar customization
    function injectFlatpickrTheme() {
        let style = document.getElementById('flatpickr-green-theme');
        if (!style) {
            style = document.createElement('style');
            style.id = 'flatpickr-green-theme';
            document.head.appendChild(style);
        }
        style.innerHTML = `
            .flatpickr-day {
                margin: 0 !important;
                gap: 0 !important;
                border: none !important;
                box-shadow: none !important;
                padding-left: 0 !important;
                padding-right: 0 !important;
                width: 100% !important;
                min-width: 0 !important;
                max-width: none !important;
                display: flex !important;
                align-items: center;
                justify-content: center;
            }
            .flatpickr-days .dayContainer {
                gap: 0 !important;
                padding: 0 !important;
            }
            .flatpickr-day.selected, .flatpickr-day.startRange, .flatpickr-day.endRange {
                background: #059669 !important;
                color: #fff !important;
            }
            .flatpickr-day.inRange:not(.startRange):not(.endRange) {
                background: #134e4a !important;
                color: #a7f3d0 !important;
            }
            .flatpickr-day:not(.selected):not(.inRange):hover {
                background: #334155 !important;
                color: #22d3ee !important;
            }
            .flatpickr-day.today:not(.selected) {
                border: 1.5px solid #22c55e !important;
            }
            /* Dark mode styles for flatpickr calendar */
            .flatpickr-calendar.dark-mode,
            body.dark .flatpickr-calendar {
                background: #0f172a !important;
                color: #e2e8f0 !important;
                border: 1px solid #334155 !important;
            }
            .flatpickr-calendar.dark-mode .flatpickr-months,
            body.dark .flatpickr-months {
                background: #0f172a !important;
                color: #e2e8f0 !important;
            }
            .flatpickr-calendar.dark-mode .flatpickr-weekdays,
            body.dark .flatpickr-weekdays {
                background: #0f172a !important;
                color: #34d399 !important;
            }
            .flatpickr-calendar.dark-mode .flatpickr-weekday,
            body.dark .flatpickr-weekday {
                color: #e2e8f0 !important;
            }
            .flatpickr-calendar.dark-mode .flatpickr-day,
            body.dark .flatpickr-day {
                background: #0f172a !important;
                color: #e2e8f0 !important;
            }
            .flatpickr-calendar.dark-mode .flatpickr-day.selected,
            body.dark .flatpickr-day.selected {
                background: #059669 !important;
                color: #fff !important;
            }
            .flatpickr-calendar.dark-mode .flatpickr-day.inRange:not(.startRange):not(.endRange),
            body.dark .flatpickr-day.inRange:not(.startRange):not(.endRange) {
                background: #134e4a !important;
                color: #a7f3d0 !important;
            }
            .flatpickr-calendar.dark-mode .flatpickr-day.today:not(.selected),
            body.dark .flatpickr-day.today:not(.selected) {
                border: 1.5px solid #22c55e !important;
            }
            .flatpickr-calendar.dark-mode .flatpickr-day:hover,
            body.dark .flatpickr-day:hover {
                background: #334155 !important;
                color: #34d399 !important;
            }
            /* Month dropdown dark mode */
            .flatpickr-calendar.dark-mode .flatpickr-monthDropdown-months,
            body.dark .flatpickr-monthDropdown-months {
                background: #1e293b !important;
                color: #e2e8f0 !important;
            }
            .flatpickr-calendar.dark-mode .flatpickr-monthDropdown-month,
            body.dark .flatpickr-monthDropdown-month {
                background: #1e293b !important;
                color: #e2e8f0 !important;
            }
            .flatpickr-calendar.dark-mode .flatpickr-current-month,
            body.dark .flatpickr-current-month {
                background: #0f172a !important;
                color: #e2e8f0 !important;
            }
            /* Weekday header (อา - ส) dark mode */
            .flatpickr-calendar.dark-mode .flatpickr-weekdays,
            body.dark .flatpickr-weekdays {
                color: #34d399 !important;
            }
            .flatpickr-calendar.dark-mode .flatpickr-weekday,
            body.dark .flatpickr-weekday {
                color: #e2e8f0 !important;
            }
            /* Arrow buttons dark mode */
            .flatpickr-calendar.dark-mode .flatpickr-prev-month,
            .flatpickr-calendar.dark-mode .flatpickr-next-month,
            body.dark .flatpickr-prev-month,
            body.dark .flatpickr-next-month {
                color: #e2e8f0 !important;
                fill: #e2e8f0 !important;
            }
        `;
    }

    useEffect(() => {
        if (calendarOpen) injectFlatpickrTheme();
        if (calendarOpen && dateRangeInputRef.current) {
            // Patch: force dark mode on flatpickr calendar
            setTimeout(() => {
                const calendars = document.querySelectorAll('.flatpickr-calendar');
                calendars.forEach(cal => {
                    if (isDarkMode) {
                        cal.classList.add('dark-mode');
                    } else {
                        cal.classList.remove('dark-mode');
                    }
                });
            }, 10);
            const options: Record<string, unknown> = {
                mode: "range",
                dateFormat: "d/m/Y",
                locale: {
                    ...Thai,
                    firstDayOfWeek: 0 // Sunday
                },
                rangeSeparator: " ถึง ",
                defaultDate: dateRange && dateRange.start && dateRange.end
                    ? [dateRange.start, dateRange.end]
                    : undefined,
                onChange: (selectedDates: Date[], dateStr: string) => {
                    setDateRange({
                        start: selectedDates[0] ? selectedDates[0].toISOString() : "",
                        end: selectedDates[1] ? selectedDates[1].toISOString() : "",
                        displayText: dateStr
                    });
                },
                onMonthChange: () => {
                    setTimeout(hideExtraCalendarRow, 0);
                },
                onReady: () => {
                    setTimeout(hideExtraCalendarRow, 0);
                }
            };
            const fp = flatpickr(dateRangeInputRef.current as HTMLInputElement, options);
            // Hide extra calendar row if needed
            function hideExtraCalendarRow() {
                const calendar = fp.calendarContainer;
                if (!calendar) return;
                const weeks = calendar.querySelectorAll('.flatpickr-days .dayContainer');
                if (!weeks.length) return;
                // flatpickr uses a single .dayContainer with 42 day elements (6 rows x 7 days)
                const days = calendar.querySelectorAll('.flatpickr-day');
                if (days.length !== 42) return;
                // Find the last row (days 36-41)
                const lastRow = Array.from(days).slice(35, 42);
                // If all days in lastRow are from next month, hide them
                const allNextMonth = lastRow.every(day => day.classList.contains('nextMonthDay'));
                // Remove previous hiding if any
                lastRow.forEach(day => {
                    (day as HTMLElement).style.display = '';
                });
                if (allNextMonth) {
                    lastRow.forEach(day => {
                        (day as HTMLElement).style.display = 'none';
                    });
                }
            }
            setTimeout(hideExtraCalendarRow, 0);

            // Patch: when closing calendar, if only one date is selected, treat as range (start = end)
            return () => {
                fp.destroy();
            };
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [calendarOpen]);

    return (
        <div className="min-h-screen">
            <Sidebar />
            <Header />
            <main
                className="mt-[7.5rem] mr-6 transition-all duration-300 relative"
                style={{ minHeight: 'calc(100vh - 3rem)', position: 'relative', marginLeft: 'calc(18rem + 55px)' }}
            >
                <div className="pl-5 pb-5 pr-5 relative z-10">
                    {/* Loading and error display */}
                    {loading && (
                        <div className="mb-4 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mr-3"></div>
                            <span className="text-green-700">กำลังโหลดข้อมูล PR...</span>
                        </div>
                    )}
                    {error && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-400 p-4">
                            <span className="text-red-800 font-medium">{error}</span>
                        </div>
                    )}
                    {/* <h1 className="text-2xl font-bold text-green-700 mb-4">รายการ PR สำหรับเปรียบเทียบราคา</h1> */}
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                        <form className="max-w-2xl w-full flex items-center gap-3">
                            <div className={`flex w-full group focus-within:ring-2 focus-within:ring-emerald-500/30 border rounded-xl ${isDarkMode ? 'border-slate-700/50 bg-slate-900/50' : 'border-gray-300 bg-white'}`}>
                                {/* Custom Dropdown */}
                                <div className="relative" style={{ minWidth: '180px' }}>
                                    <button
                                        type="button"
                                        className={`h-[48px] w-full flex items-center justify-between px-5 font-medium text-base focus:outline-none transition-all duration-150 rounded-l-xl ${isDarkMode ? 'text-slate-300 border-slate-700/50 bg-slate-900/50' : 'text-gray-700 border-gray-100 bg-white'} ${dropdownOpen ? (isDarkMode ? 'bg-slate-800/70' : 'bg-gray-100') : ''}`}
                                        onClick={() => setDropdownOpen(!dropdownOpen)}
                                        style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                                    >
                                        <span>
                                            {departmentId === 10086
                                                ? (departmentFilter ? departmentFilter : "ทุกแผนก")
                                                : (departmentFilter ? departmentFilter : (departments.find(dep => dep.ID === departmentId)?.name || ""))
                                            }
                                        </span>
                                        <svg className={`ml-2 h-5 w-5 transition-transform duration-200 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'} ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {dropdownOpen && (
                                        <ul className={`absolute left-0 mt-2 w-full rounded-xl shadow-xl z-20 py-2 border max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-400/60 scrollbar-track-transparent ${isDarkMode ? 'bg-slate-900/95 border-slate-700/50 backdrop-blur-sm' : 'bg-white border-gray-200'}`}
                                            style={{ scrollbarWidth: 'thin', scrollbarColor: '#34d39933 transparent' }}>
                                            {departmentId === 10086 ? (
                                                <>
                                                    <li
                                                        className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 ${!departmentFilter ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-green-50 text-green-700') : (isDarkMode ? 'text-slate-300 hover:bg-slate-800/50 hover:text-emerald-400' : 'text-gray-700 hover:bg-gray-100 hover:text-green-700')}`}
                                                        onClick={() => { setDepartmentFilter(''); setDropdownOpen(false); }}
                                                    >
                                                        ทุกแผนก
                                                    </li>
                                                    {departments
                                                        .filter(dep => ![
                                                            'Tenพนักงานรักษาความปลอดภัย',
                                                            'นักศึกษาฝึกงาน',
                                                            'ลาออก',
                                                            'COPพนักงานรักษาความปลอดภัย',
                                                            'SKY รักษาความปลอดภัย'
                                                        ].includes(dep.name) &&
                                                            !['Ten', 'intern', 'COP', 'SKY', ''].includes(dep.short_name))
                                                        .map(dep => (
                                                            <li
                                                                key={dep.ID}
                                                                className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 ${departmentFilter === dep.name ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-green-50 text-green-700') : (isDarkMode ? 'text-slate-300 hover:bg-slate-800/50 hover:text-emerald-400' : 'text-gray-700 hover:bg-gray-100 hover:text-green-700')}`}
                                                                onClick={() => { setDepartmentFilter(dep.name); setDropdownOpen(false); }}
                                                            >
                                                                {dep.name} <span className={`ml-2 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}></span>
                                                            </li>
                                                        ))}
                                                </>
                                            ) : (
                                                departments
                                                    .filter(dep => dep.ID === departmentId)
                                                    .map(dep => (
                                                        <li
                                                            key={dep.ID}
                                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 bg-emerald-900/30 text-emerald-400 flex items-center justify-between`}
                                                            onClick={() => { setDepartmentFilter(dep.name); setDropdownOpen(false); }}
                                                        >
                                                            <span>{dep.name}</span>
                                                            <span className="ml-2 flex items-center">
                                                                <span
                                                                    className="inline-block w-3 h-3 rounded-full border"
                                                                    style={{ backgroundColor: departmentColors[dep.name] || '#38bdf8', borderColor: isDarkMode ? '#334155' : '#e5e7eb' }}
                                                                ></span>
                                                            </span>
                                                        </li>
                                                    ))
                                            )}
                                        </ul>
                                    )}
                                    {/* ปิด dropdown เมื่อคลิกนอก */}
                                    {dropdownOpen && (
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setDropdownOpen(false)}
                                            aria-label="Close dropdown"
                                        />
                                    )}
                                </div>
                                {/* Search Input */}
                                <div className="relative w-full flex">
                                    <input
                                        type="search"
                                        id="search-dropdown"
                                        className={`block p-3 w-full z-20 text-base font-medium border-none h-[48px] focus:outline-none ${isDarkMode ? 'text-slate-200 bg-slate-900/50 placeholder-slate-500' : 'text-gray-700 bg-white'}`}
                                        placeholder="ค้นหา PR, ผู้จัดทำ..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                    <div className="relative">
                                        <button
                                            type="button"
                                            className="p-3 text-base font-medium h-[48px] text-white bg-green-600 rounded-r-xl hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 w-[48px] flex items-center justify-center"
                                            style={{ marginLeft: '-1px' }}
                                            onClick={e => {
                                                e.preventDefault();
                                                setCalendarOpen(true);
                                                setTimeout(() => {
                                                    dateRangeInputRef.current?.focus();
                                                }, 0);
                                            }}
                                        >
                                            <LuCalendarFold className="w-6 h-6 text-white" aria-hidden="true" />
                                            <span className="sr-only">Search</span>
                                        </button>
                                        {calendarOpen && (
                                            <>
                                                {/* Backdrop for outside click */}
                                                <div
                                                    className="fixed inset-0 z-30"
                                                    onClick={() => handleCloseCalendar()}
                                                    aria-label="Close calendar popup"
                                                    tabIndex={-1}
                                                    style={{ background: 'transparent' }}
                                                />
                                                <div
                                                    className={`absolute right-0 mt-2 z-40 w-[370px] rounded-2xl shadow-2xl border border-emerald-400/60 p-6 flex flex-col items-center ${isDarkMode ? 'bg-slate-900/95 border-slate-700/60' : 'bg-white'}`}
                                                    style={isDarkMode ? { boxShadow: '0 8px 32px 0 rgba(34,197,94,0.15)', borderColor: '#059669' } : {}}
                                                >
                                                    {/* <label className="form-label mb-2 flex items-center gap-2 text-base font-medium"><svg className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/></svg>ช่วงวันที่</label> */}
                                                    <div className="input-group flex w-full">
                                                        <input
                                                            type="text"
                                                            className={`form-control flex-1 border text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-50 border-gray-300 text-gray-900'}`}
                                                            id="dateRange"
                                                            placeholder="เลือกช่วงวันที่"
                                                            ref={dateRangeInputRef}
                                                            value={dateRange?.displayText || ""}
                                                            readOnly
                                                            onFocus={() => setCalendarOpen(true)}
                                                        />
                                                        <button
                                                            className={`btn btn-outline-secondary ml-2 px-3 py-2 rounded-lg border ${isDarkMode ? 'border-gray-600 text-gray-400 hover:text-red-400' : 'border-gray-300 text-gray-500 hover:text-red-500'}`}
                                                            type="button"
                                                            id="clearDateBtn"
                                                            onClick={() => setDateRange(null)}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <button
                                    type="button"
                                    className={`group flex items-center justify-center h-[48px] w-[48px] rounded-xl transition-all duration-300 cursor-pointer border-2 shadow-sm hover:shadow-md ${statusSortDropdownOpen
                                        ? (isDarkMode
                                            ? 'bg-emerald-900/40 border-emerald-600/60 text-emerald-400 shadow-emerald-500/20'
                                            : 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-emerald-200/50')
                                        : (isDarkMode
                                            ? 'bg-slate-800/50 border-slate-600/50 text-emerald-400 hover:bg-emerald-900/30 hover:border-emerald-600/40'
                                            : 'bg-white border-slate-300 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-400')
                                        }`}
                                    aria-label="Filter by status"
                                    onClick={() => setStatusSortDropdownOpen(!statusSortDropdownOpen)}
                                >
                                    <MdOutlineSort className={`w-6 h-6 pointer-events-none transition-transform duration-300 ${statusSortDropdownOpen ? 'rotate-180' : 'group-hover:scale-110'}`} />
                                </button>
                                {statusSortDropdownOpen && (
                                    <ul className={`absolute right-0 mt-2 w-64 rounded-xl shadow-xl z-50 py-2 border max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-400/60 scrollbar-track-transparent ${isDarkMode ? 'bg-slate-900/95 border-slate-700/50 backdrop-blur-sm' : 'bg-white border-gray-200'}`}
                                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#34d39933 transparent' }}>
                                        {/* Sort Section */}
                                        <div className={`px-3 py-2 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                            เรียงลำดับ
                                        </div>
                                        <li
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${sortBy === 'newest' ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-green-50 text-green-700') : (isDarkMode ? 'text-slate-300 hover:bg-slate-800/50 hover:text-emerald-400' : 'text-gray-700 hover:bg-gray-100 hover:text-green-700')}`}
                                            onClick={() => { setSortBy('newest'); }}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                                </svg>
                                                ใหม่ไปเก่า
                                            </span>
                                        </li>
                                        <li
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${sortBy === 'oldest' ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-green-50 text-green-700') : (isDarkMode ? 'text-slate-300 hover:bg-slate-800/50 hover:text-emerald-400' : 'text-gray-700 hover:bg-gray-100 hover:text-green-700')}`}
                                            onClick={() => { setSortBy('oldest'); }}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                                </svg>
                                                เก่าไปใหม่
                                            </span>
                                        </li>

                                        {/* Divider */}
                                        <div className={`my-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}></div>

                                        {/* Status Filter Section */}
                                        <div className={`px-3 py-2 text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                            กรองตามสถานะ
                                        </div>
                                        <li
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${statusFilter === '' ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-green-50 text-green-700') : (isDarkMode ? 'text-slate-300 hover:bg-slate-800/50 hover:text-emerald-400' : 'text-gray-700 hover:bg-gray-100 hover:text-green-700')}`}
                                            onClick={() => { setStatusFilter(''); }}
                                        >
                                            ทุกสถานะ
                                        </li>
                                        <li
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${statusFilter === 'supervisor' ? (isDarkMode ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-50 text-blue-800') : (isDarkMode ? 'text-slate-300 hover:bg-blue-900/20 hover:text-blue-200' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-800')}`}
                                            onClick={() => { setStatusFilter('supervisor'); }}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <FaRegClock className={`w-3.5 h-3.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />รอหัวหน้าแผนกอนุมัติ</span>
                                        </li>
                                        <li
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${statusFilter === 'manager' ? (isDarkMode ? 'bg-purple-900/30 text-purple-200' : 'bg-purple-50 text-purple-800') : (isDarkMode ? 'text-slate-300 hover:bg-purple-900/20 hover:text-purple-200' : 'text-gray-700 hover:bg-purple-50 hover:text-purple-800')}`}
                                            onClick={() => { setStatusFilter('manager'); }}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <FaRegClock className={`w-3.5 h-3.5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />รอผู้จัดการแผนกอนุมัติ</span>
                                        </li>
                                        <li
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${statusFilter === 'pu' ? (isDarkMode ? 'bg-orange-900/30 text-orange-200' : 'bg-orange-50 text-orange-800') : (isDarkMode ? 'text-slate-300 hover:bg-orange-900/20 hover:text-orange-200' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-800')}`}
                                            onClick={() => { setStatusFilter('pu'); }}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <FaRegClock className={`w-3.5 h-3.5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />รอแผนกจัดซื้ออนุมัติ</span>
                                        </li>
                                        <li
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${statusFilter === 'processing' ? (isDarkMode ? 'bg-yellow-900/30 text-yellow-200' : 'bg-yellow-50 text-yellow-800') : (isDarkMode ? 'text-slate-300 hover:bg-yellow-900/20 hover:text-yellow-200' : 'text-gray-700 hover:bg-yellow-50 hover:text-yellow-800')}`}
                                            onClick={() => { setStatusFilter('processing'); }}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <FaRegClock className={`w-3.5 h-3.5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />รอดำเนินการ</span>
                                        </li>
                                        <li
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${statusFilter === 'complete' ? (isDarkMode ? 'bg-green-900/30 text-green-200' : 'bg-green-50 text-green-900') : (isDarkMode ? 'text-slate-300 hover:bg-green-900/20 hover:text-green-200' : 'text-gray-700 hover:bg-green-50 hover:text-green-900')}`}
                                            onClick={() => { setStatusFilter('complete'); }}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>เสร็จสมบูรณ์</span>
                                        </li>
                                        <li
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${statusFilter === 'rejected' ? (isDarkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-800') : (isDarkMode ? 'text-slate-300 hover:bg-red-900/20 hover:text-red-200' : 'text-gray-700 hover:bg-red-50 hover:text-red-800')}`}
                                            onClick={() => { setStatusFilter('rejected'); }}
                                        >
                                            <span className="inline-flex items-center gap-2">
                                                <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>ปฏิเสธ</span>
                                        </li>
                                    </ul>
                                )}
                                {/* ปิด dropdown เมื่อคลิกนอก */}
                                {statusSortDropdownOpen && (
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={() => setStatusSortDropdownOpen(false)}
                                        aria-label="Close status dropdown"
                                    />
                                )}
                            </div>
                        </form>

                        {/* Pagination Controls - Top */}
                        {totalItems > 0 && (
                            <div className={`flex items-center gap-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                {/* Items per page dropdown */}
                                <div className="flex items-center space-x-2">
                                    {/* <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>แสดง</span> */}
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            const newPerPage = Number(e.target.value);
                                            setItemsPerPage(newPerPage);
                                            setCurrentPage(1);
                                            updateUrlParams(1, newPerPage);
                                        }}
                                        className={`border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 shadow-sm transition-all ${isDarkMode ? 'border-slate-600 bg-slate-800 text-slate-200 focus:ring-emerald-500/30 focus:border-emerald-500' : 'border-slate-300 bg-white text-slate-700 focus:ring-emerald-200 focus:border-emerald-400'}`}
                                    >
                                        <option value={10}>10 per page</option>
                                        <option value={25}>25 per page</option>
                                        <option value={50}>50 per page</option>
                                        {/* <option value={100}>100 per page</option> */}
                                    </select>
                                    {/* <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>รายการ</span> */}
                                </div>

                                {/* Page info and navigation */}
                                <div className={`flex items-center border rounded-lg shadow-sm overflow-hidden ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-white'}`}>
                                    <div className={`px-4 py-2 text-sm border-r font-medium ${isDarkMode ? 'text-slate-300 bg-slate-700/50 border-slate-600' : 'text-slate-600 bg-slate-50 border-slate-300'}`}>
                                        {(() => {
                                            const totalItemsWithCreate = totalItems + 1; // Include "Create PR" card
                                            const startItem = totalItemsWithCreate === 1 ? 0 : (currentPage === 1 ? 1 : startIndex + 1);
                                            const endItem = currentPage === 1 ? Math.min(itemsPerPage, totalItemsWithCreate) : Math.min(startIndex + itemsPerPage, totalItemsWithCreate);
                                            return (
                                                <>
                                                    <span className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{startItem}-{endItem}</span>
                                                    {' '}จาก{' '}
                                                    <span className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{totalItemsWithCreate}</span>
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* Navigation buttons */}
                                    <div className="flex items-center">
                                        <button
                                            type="button"
                                            className={`p-2 disabled:opacity-30 disabled:cursor-not-allowed border-r transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700 border-slate-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-slate-300'}`}
                                            disabled={currentPage === 1}
                                            onClick={() => {
                                                const newPage = Math.max(1, currentPage - 1);
                                                setCurrentPage(newPage);
                                                updateUrlParams(newPage, itemsPerPage);
                                            }}
                                        >
                                            <IoIosArrowBack className="w-5 h-5" />
                                        </button>
                                        <button
                                            type="button"
                                            className={`p-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                            disabled={currentPage >= totalPages}
                                            onClick={() => {
                                                const newPage = Math.min(totalPages, currentPage + 1);
                                                setCurrentPage(newPage);
                                                updateUrlParams(newPage, itemsPerPage);
                                            }}
                                        >
                                            <IoIosArrowForward className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Page numbers */}
                                <div className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                    หน้า <span className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{currentPage}</span> / <span className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{totalPages}</span>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="grid gap-x-6 gap-y-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center mt-2 mb-4">
                        {/* Add New PR Card - Show only on first page */}
                        {showCreateCard && (
                            <div
                                className={`relative rounded-2xl p-0 flex flex-col items-center justify-center shadow-md border-2 border-dashed w-full max-w-[270px] min-w-[180px] min-h-[320px] transition-all duration-200 hover:scale-[1.03] hover:shadow-lg cursor-pointer group ${isDarkMode ? 'bg-slate-900/50 border-slate-600/50 hover:border-emerald-500/50 hover:bg-slate-800/60' : 'bg-white border-green-300 hover:border-green-500 hover:bg-gradient-to-br hover:from-green-50 hover:to-green-100'}`}
                                onClick={() => router.push('/services/purchase/createPR')}
                            >
                                {/* Plus Icon */}
                                <div className="flex flex-col items-center justify-center h-full">
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-colors duration-200 ${isDarkMode ? 'bg-emerald-900/40 group-hover:bg-emerald-800/50' : 'bg-green-200 group-hover:bg-green-300'}`}>
                                        <svg className={`w-12 h-12 ${isDarkMode ? 'text-emerald-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                        </svg>
                                    </div>
                                    <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-emerald-400' : 'text-green-700'}`}>สร้าง PR ใหม่</h3>
                                    <p className={`text-sm text-center px-4 ${isDarkMode ? 'text-slate-400' : 'text-green-600'}`}>คลิกเพื่อสร้างใบขอซื้อใหม่</p>
                                </div>
                            </div>
                        )}

                        {paginatedPrCards.map((pr) => (
                            <div
                                key={pr.pr_no}
                                className={`relative rounded-2xl p-0 flex flex-col items-center shadow-md border w-full max-w-[270px] min-w-[180px] min-h-[320px] transition-all duration-200 hover:scale-[1.03] hover:shadow-lg cursor-pointer ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50 hover:border-emerald-500/30' : 'bg-white border-green-200 hover:border-green-400'}`}
                                onClick={() => router.push(`/services/purchase/comparePrice?${pr.id ? `id=${pr.id}` : ''}`)}
                            >
                                {/* Top: Department Icon */}
                                <div className="w-full flex justify-center pt-12 pb-2">
                                    <HiDocumentText className={`h-14 w-14 ${departmentColors[pr.pr_no] || 'text-blue-400'}`} />
                                </div>
                                {/* Status badge top right */}
                                <div className="absolute top-2 right-2 z-10">
                                    {pr.supervisor_reject_at || pr.manager_reject_at || pr.pu_operator_reject_at ? (
                                        // Red - ปฏิเสธ (Rejected)
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-red-900/30 border-red-700/60 text-red-200' : 'bg-red-50 border-red-300 text-red-800'}`}>
                                            <svg className={`w-4 h-4 ${isDarkMode ? 'text-red-200' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            {pr.supervisor_reject_at ? 'หัวหน้าแผนกปฏิเสธ' : pr.manager_reject_at ? 'ผู้จัดการแผนกปฏิเสธ' : pr.pu_operator_reject_at ? 'แผนกจัดซื้อปฏิเสธ' : 'ปฏิเสธ'}
                                        </span>
                                    ) : !pr.supervisor_approved ? (
                                        // Blue - รอหัวหน้าแผนกอนุมัติ
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-blue-900/30 border-blue-700/60 text-blue-200' : 'bg-blue-50 border-blue-300 text-blue-800'}`}>
                                            <svg className={`w-4 h-4 ${isDarkMode ? 'text-blue-200' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            รอหัวหน้าแผนกอนุมัติ
                                        </span>
                                    ) : !pr.manager_approved ? (
                                        // Purple - รอผู้จัดการแผนกอนุมัติ
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-purple-900/30 border-purple-700/60 text-purple-200' : 'bg-purple-50 border-purple-300 text-purple-800'}`}>
                                            <svg className={`w-4 h-4 ${isDarkMode ? 'text-purple-200' : 'text-purple-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            รอผู้จัดการแผนกอนุมัติ
                                        </span>
                                    ) : !pr.pu_operator_approved ? (
                                        // Orange - รอแผนกจัดซื้ออนุมัติ
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-orange-900/30 border-orange-700/60 text-orange-200' : 'bg-orange-50 border-orange-300 text-orange-800'}`}>
                                            <svg className={`w-4 h-4 ${isDarkMode ? 'text-orange-200' : 'text-orange-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            รอแผนกจัดซื้ออนุมัติ
                                        </span>
                                    ) : pr.waiting === 0 ? (
                                        // Green - Complete (เสร็จสมบูรณ์)
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-green-900/30 border-green-700/60 text-green-200' : 'bg-green-50 border-green-500 text-green-900'}`}>
                                            <svg className={`w-4 h-4 ${isDarkMode ? 'text-green-200' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            เสร็จสมบูรณ์
                                        </span>
                                    ) : (
                                        // Yellow/Amber - รอดำเนินการ
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-yellow-900/30 border-yellow-700/60 text-yellow-200' : 'bg-yellow-50 border-yellow-400 text-yellow-800'}`}>
                                            <svg className={`w-4 h-4 ${isDarkMode ? 'text-yellow-200' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            รอดำเนินการ
                                        </span>
                                    )}
                                </div>
                                {/* Middle: Table info */}
                                <div className="w-full px-6 pt-2">
                                    <table className="w-full text-sm mb-2">
                                        <tbody>
                                            <tr><td className={`py-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>หมายเลข PR</td><td className={`text-right font-semibold py-1 ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>{pr.pr_no}</td></tr>
                                            <tr><td className={`py-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>แผนก</td><td className={`text-right py-1 ${isDarkMode ? 'text-emerald-400' : 'text-green-700'}`}>{pr.dept_name}</td></tr>
                                            <tr>
                                                <td className={`py-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>ผู้ร้องขอ</td>
                                                <td className={`text-right py-1 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}
                                                    style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                    title={pr.requester_name}
                                                >
                                                    {pr.requester_name && pr.requester_name.length > 18
                                                        ? pr.requester_name.slice(0, 16) + '...'
                                                        : pr.requester_name}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className={`py-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>ผู้จัดทำ</td>
                                                <td className={`text-right py-1 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}
                                                    style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                    title={pr.pu_responsible}
                                                >
                                                    {pr.pu_responsible && pr.pu_responsible.length > 18
                                                        ? pr.pu_responsible.slice(0, 16) + '...'
                                                        : pr.pu_responsible}
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                {/* Bottom: Actions */}
                                <div className="w-full px-6 pb-5 flex flex-col gap-2 items-center">
                                    <span className={`text-xs mb-1 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>{formatDate(pr.pr_date)}</span>
                                    <div className="flex w-full justify-center">
                                        <button
                                            className={`flex items-center justify-center rounded-l-lg px-4 py-2 text-lg font-medium transition ${isDarkMode ? 'text-emerald-400 bg-emerald-900/20 border border-emerald-800/50 hover:bg-emerald-800/30' : 'text-green-600 bg-green-50 border border-green-100 hover:bg-green-100'}`}
                                            onClick={(e) => { e.stopPropagation(); router.push(`/services/purchase/comparePrice?pr=${pr.id}`); }}
                                        >
                                            <MdOutlineRemoveRedEye className="w-7 h-7" />
                                        </button>
                                        <button
                                            className={`flex items-center justify-center rounded-r-lg px-4 py-2 text-lg font-medium transition ${isDarkMode ? 'text-red-400 bg-red-900/20 border border-red-800/50 hover:bg-red-800/30' : 'text-red-400 bg-red-50 border border-red-100 hover:bg-red-100'}`}
                                            onClick={e => { e.stopPropagation(); }}
                                        >
                                            <GoDownload className="w-7 h-7" />
                                        </button>
                                    </div>
                                    <span className={`text-xs mt-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                                        {pr.supervisor_reject_at || pr.manager_reject_at || pr.pu_operator_reject_at ? (
                                            <>ปฏิเสธ <span className={`font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>{pr.count_list} รายการ</span></>
                                        ) : (
                                            <>ดำเนินการ <span className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{pr.count_list - pr.waiting}</span> | <span className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-green-700'}`}>{pr.count_list} รายการ</span></>
                                        )}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
