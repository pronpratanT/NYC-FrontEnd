"use client";

import React from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

// Calendar
import { Thai } from "flatpickr/dist/l10n/th.js";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.min.css";

// components
import Sidebar from "../../../components/sidebar";
import Header from "../../../components/header";
import { useTheme } from "../../../components/ThemeProvider";
import { useToken } from "../../../context/TokenContext";
import { useUser } from "../../../context/UserContext";

// icons
import { LuCalendarFold } from "react-icons/lu";
import { MdOutlineSort, MdOutlineRemoveRedEye } from "react-icons/md";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { GoDownload } from "react-icons/go";
import { HiDocumentText } from "react-icons/hi2";

// Types
type PoDocs = {
    po: POCard;
    issued_by: string | null;
    approved_by: string | null;
    rejected_by: string | null;
}
type POCard = {
    ID: number;
    CreatedAt: string;
    UpdatedAt: string;
    DeletedAt: string | null;
    po_no: string;
    po_date: string;
    issued_by: string | null;
    approved_by: string | null;
    approved_reason: string | null;
    approved_at: string | null;
    reject_at: string | null;
    rejected_by: string | null;
    reject_reason: string | null;
    send_to_vendor_at: string | null;
    vendor_confirmed_at: string | null;
    pu_validated_at: string | null;
    edit_reason: string | null;
    edit_at: string | null;
    edit_user: string | null;
}

type Department = {
    ID: number;
    name: string;
    short_name: string;
    dep_no: string;
}

const departmentColors: { [key: string]: string } = {
    "Production": "text-blue-500",
    "Maintenance": "text-green-500",
    "Quality Control": "text-purple-500",
    "Engineering": "text-yellow-500",
    "Logistics": "text-pink-500",
    "Procurement": "text-indigo-500",
    "R&D": "text-red-500"
};

export default function PurchaseOrderPage() {
    // Theme context
    const { isDarkMode } = useTheme();

    // Router
    const router = useRouter();

    // Error and loading states
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // NOTE: Data states
    const [poCards, setPoCards] = useState<PoDocs[]>([]);
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
    // รวม POCard ทั้งหมดจากทุก PoDocs
    const allPoCards: POCard[] = poCards.map(doc => doc.po);
    let displayedPoCards = allPoCards;

    // NEWEST or OLDEST sort
    if (sortBy === 'newest') {
        displayedPoCards = [...displayedPoCards].sort((a, b) => {
            // Sort by date (po_date) descending, ถ้าเท่ากันใช้เลข PO
            const dateA = a.po_date ? new Date(a.po_date).getTime() : 0;
            const dateB = b.po_date ? new Date(b.po_date).getTime() : 0;
            if (dateB !== dateA) return dateB - dateA;
            // ถ้าวันเดียวกัน ให้ใช้เลข PO
            const extract = (po_no: string | undefined | null) => {
                if (!po_no) return 0;
                const match = po_no.match(/^([DI])(\d{2})(\d{2})(\d{3})$/i);
                if (match) {
                    return parseInt(match[2] + match[3] + match[4]);
                }
                return 0;
            };
            return extract(b.po_no) - extract(a.po_no);
        });
    } else if (sortBy === 'oldest') {
        displayedPoCards = [...displayedPoCards].sort((a, b) => {
            // Sort by date (po_date) ascending, ถ้าเท่ากันใช้เลข PO
            const dateA = a.po_date ? new Date(a.po_date).getTime() : 0;
            const dateB = b.po_date ? new Date(b.po_date).getTime() : 0;
            if (dateA !== dateB) return dateA - dateB;
            // ถ้าวันเดียวกัน ให้ใช้เลข PO
            const extract = (po_no: string | undefined | null) => {
                if (!po_no) return 0;
                const match = po_no.match(/^([DI])(\d{2})(\d{2})(\d{3})$/i);
                if (match) {
                    return parseInt(match[2] + match[3] + match[4]);
                }
                return 0;
            };
            return extract(a.po_no) - extract(b.po_no);
        });
    }
    // Status filter
    if (statusFilter) {
        displayedPoCards = displayedPoCards.filter(po => {
            if (statusFilter === 'rejected') {
                return po.rejected_by;
            } else if (statusFilter === 'processing') {
                return po.issued_by;
            } else if (statusFilter === 'complete') {
                return po.approved_by;
            }
            return true;
        });
    }

    // NOTE: Pagination states
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const totalItems = displayedPoCards.length;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const totalPages = Math.ceil((totalItems + 1) / itemsPerPage);
    // const showCreateCard = currentPage === 1;
    const itemsToShow = currentPage === 1 ? itemsPerPage : itemsPerPage; // -1 is createPR card
    const actualStartIndex = currentPage === 1 ? 0 : startIndex; // -1 because first page has create card
    const actualEndIndex = currentPage === 1 ? itemsToShow : actualStartIndex + itemsPerPage;
    const paginatedPoCards = displayedPoCards.slice(actualStartIndex, actualEndIndex);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [departmentFilter, statusFilter, search, sortBy]);

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
    {/* PO DATA */ }
    useEffect(() => {
        const fetchPoCards = async () => {
            try {
                setError(null);
                setLoading(true);

                if (!token) {
                    setError("ไม่พบ token กรุณาเข้าสู่ระบบใหม่");
                    setLoading(false);
                    return;
                }

                const responsePO = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/all`, {
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
                });

                if (responsePO.status === 401) {
                    setError("Token หมดอายุ กรุณาเข้าสู่ระบบใหม่");
                    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    router.push("/login");
                    return;
                }
                if (!responsePO.ok) {
                    throw new Error(`HTTP ${responsePO.status}: ${responsePO.statusText}`);
                }

                // ถ้ามี search ให้ใช้ API search-pr
                // if (search && search.trim() !== "") {
                //     url = `/api/proxy/purchase/search-pr?keyword=${encodeURIComponent(search)}`;
                //     fetchOptions = {
                //         ...fetchOptions,
                //         cache: "no-store",
                //         headers: {
                //             ...(fetchOptions.headers || {}),
                //             Authorization: `Bearer ${token}`,
                //             'Content-Type': 'application/json'
                //         }
                //     };
                // }

                // const response = await fetch(url, fetchOptions);
                const data = await responsePO.json();
                console.log("Fetched PO data:", data);
                let posArray = Array.isArray(data.poDocs) ? data.poDocs : [];

                //Filter by date range BEFORE setPoCards
                if (dateRange && dateRange.start && dateRange.end) {
                    posArray = posArray.filter((doc: PoDocs) => {
                        if (!doc.po.po_date) return false;
                        const poDate = new Date(doc.po.po_date);
                        const startDate = new Date(dateRange.start);
                        const endDate = new Date(dateRange.end);
                        startDate.setHours(0, 0, 0, 0);
                        endDate.setHours(23, 59, 59, 999);
                        return poDate >= startDate && poDate <= endDate;
                    });
                }
                setPoCards(posArray);
                console.log("Filtered PO cards:", posArray.length, "items");
            } catch (error: unknown) {
                console.error("Failed to fetch PO cards:", error);
                if (error instanceof Error) {
                    setError(error.message || "ไม่สามารถโหลดข้อมูล PO ได้");
                } else {
                    setError("ไม่สามารถโหลดข้อมูล PO ได้");
                }
            } finally {
                setLoading(false);
            }
        };
        if (token !== null) {
            fetchPoCards();
        }
    }, [token, router, search, dateRange]);

    {/* departments */ }
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                setError(null);
                const response = await fetch("/api/proxy/user/deps", { cache: "no-store" });
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
        /* Remove all horizontal gap and force days to fill cell for seamless range */
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
            background: #16a34a !important;
            color: #fff !important;
        }
        .flatpickr-day.inRange:not(.startRange):not(.endRange) {
            background: #9ef5bcff !important;
            color: #fff !important;
        }
        .flatpickr-day:not(.selected):not(.inRange):hover {
            background: #bbf7d0 !important;
            color: #15803d !important;
        }
        .flatpickr-day.today:not(.selected) {
            border: 1.5px solid #22c55e !important;
        }
        `;
    }
    useEffect(() => {
        if (calendarOpen) injectFlatpickrTheme();
        if (calendarOpen && dateRangeInputRef.current) {
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
                                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 bg-emerald-900/30 text-emerald-400`}
                                                            onClick={() => { setDepartmentFilter(dep.name); setDropdownOpen(false); }}
                                                        >
                                                            {dep.name} <span className={`ml-2 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}></span>
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
                                        placeholder="ค้นหา PO, ผู้จัดทำ..."
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
                                                <div className="absolute right-0 mt-2 z-40 w-[370px] rounded-2xl shadow-2xl border border-emerald-400/60 bg-white dark:bg-slate-900/95 p-6 flex flex-col items-center">
                                                    {/* <label className="form-label mb-2 flex items-center gap-2 text-base font-medium"><svg className="w-5 h-5 text-gray-500 dark:text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path d="M20 4a2 2 0 0 0-2-2h-2V1a1 1 0 0 0-2 0v1h-3V1a1 1 0 0 0-2 0v1H6V1a1 1 0 0 0-2 0v1H2a2 2 0 0 0-2 2v2h20V4ZM0 18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8H0v10Zm5-8h10a1 1 0 0 1 0 2H5a1 1 0 0 1 0-2Z"/></svg>ช่วงวันที่</label> */}
                                                    <div className="input-group flex w-full">
                                                        <input
                                                            type="text"
                                                            className="form-control flex-1 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                                            id="dateRange"
                                                            placeholder="เลือกช่วงวันที่"
                                                            ref={dateRangeInputRef}
                                                            value={dateRange?.displayText || ""}
                                                            readOnly
                                                            onFocus={() => setCalendarOpen(true)}
                                                        />
                                                        <button
                                                            className="btn btn-outline-secondary ml-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-500 hover:text-red-500"
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
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${statusFilter === 'processing' ? (isDarkMode ? 'bg-yellow-900/30 text-yellow-200' : 'bg-yellow-50 text-yellow-800') : (isDarkMode ? 'text-slate-300 hover:bg-yellow-900/20 hover:text-yellow-200' : 'text-gray-700 hover:bg-yellow-50 hover:text-yellow-800')}`}
                                            onClick={() => { setStatusFilter('processing'); }}
                                        >
                                            <span className="inline-flex items-center gap-2"><svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l2 2 4-4" /></svg>รอดำเนินการ</span>
                                        </li>
                                        <li
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${statusFilter === 'complete' ? (isDarkMode ? 'bg-green-900/30 text-green-200' : 'bg-green-50 text-green-900') : (isDarkMode ? 'text-slate-300 hover:bg-green-900/20 hover:text-green-200' : 'text-gray-700 hover:bg-green-50 hover:text-green-900')}`}
                                            onClick={() => { setStatusFilter('complete'); }}
                                        >
                                            <span className="inline-flex items-center gap-2"><svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>อนุมัติเสร็จสิ้น</span>
                                        </li>
                                        <li
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${statusFilter === 'rejected' ? (isDarkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-800') : (isDarkMode ? 'text-slate-300 hover:bg-red-900/20 hover:text-red-200' : 'text-gray-700 hover:bg-red-50 hover:text-red-800')}`}
                                            onClick={() => { setStatusFilter('rejected'); }}
                                        >
                                            <span className="inline-flex items-center gap-2"><svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>ปฏิเสธ</span>
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
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className={`border rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 shadow-sm transition-all ${isDarkMode ? 'border-slate-600 bg-slate-800 text-slate-200 focus:ring-emerald-500/30 focus:border-emerald-500' : 'border-slate-300 bg-white text-slate-700 focus:ring-emerald-200 focus:border-emerald-400'}`}
                                    >
                                        <option value={10}>10 per page</option>
                                        <option value={25}>25 per page</option>
                                        <option value={50}>50 per page</option>
                                        <option value={100}>100 per page</option>
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
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        >
                                            <IoIosArrowBack className="w-5 h-5" />
                                        </button>
                                        <button
                                            type="button"
                                            className={`p-2 disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                                            disabled={currentPage >= totalPages}
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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

                        {paginatedPoCards.map((po) => (
                            <div
                                key={po.po_no}
                                className={`relative rounded-2xl p-0 flex flex-col items-center shadow-md border w-full max-w-[270px] min-w-[180px] min-h-[320px] transition-all duration-200 hover:scale-[1.03] hover:shadow-lg cursor-pointer ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50 hover:border-emerald-500/30' : 'bg-white border-green-200 hover:border-green-400'}`}
                                onClick={() => router.push(`/services/purchase/PO/ReviewedPO?poNo=${po.po_no}`)}
                            >
                                {/* Top: Department Icon */}
                                <div className="w-full flex justify-center pt-12 pb-2">
                                    <HiDocumentText className={`h-14 w-14 ${departmentColors[po.po_no] || 'text-emerald-400'}`} />
                                </div>
                                {/* Status badge top right */}
                                <div className="absolute top-2 right-2 z-10">
                                    {!po.rejected_by && !po.issued_by && !po.approved_by ? (
                                        // ไม่มีข้อมูลอะไรเลย
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-gray-900/30 border-gray-700/60 text-gray-200' : 'bg-gray-50 border-gray-300 text-gray-800'}`}>
                                            <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                                            </svg>
                                            รอการตรวจสอบ
                                        </span>
                                    ) : po.rejected_by ? (
                                        // Red - ปฏิเสธ (Rejected)
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-red-900/30 border-red-700/60 text-red-200' : 'bg-red-50 border-red-300 text-red-800'}`}>
                                            <svg className={`w-4 h-4 ${isDarkMode ? 'text-red-200' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            ปฏิเสธ
                                        </span>
                                    ) : po.approved_by ? (
                                        // Green - อนุมัติเสร็จสิ้น
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-green-900/30 border-green-700/60 text-green-200' : 'bg-green-50 border-green-500 text-green-900'}`}>
                                            <svg className={`w-4 h-4 ${isDarkMode ? 'text-green-200' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            อนุมัติเสร็จสิ้น
                                        </span>
                                    ) : po.issued_by ? (
                                        // Yellow - รอดำเนินการ
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-yellow-900/30 border-yellow-700/60 text-yellow-200' : 'bg-yellow-50 border-yellow-400 text-yellow-800'}`}>
                                            <svg className={`w-4 h-4 ${isDarkMode ? 'text-yellow-200' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                                            </svg>
                                            รอดำเนินการ
                                        </span>
                                    ) : null}
                                </div>
                                {/* Middle: Table info */}
                                <div className="w-full px-6 pt-2">
                                    <table className="w-full text-sm mb-2">
                                        <tbody>
                                            <tr><td className={`py-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>หมายเลข PO</td><td className={`text-right font-semibold py-1 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>{po.po_no}</td></tr>
                                            {/* <tr><td className={`py-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>แผนก</td><td className={`text-right py-1 ${isDarkMode ? 'text-emerald-400' : 'text-green-700'}`}>{po.dept_name}</td></tr> */}
                                            <tr><td className={`py-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>ออกโดย</td><td className={`text-right py-1 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{poCards.find(doc => doc.po.po_no === po.po_no)?.issued_by ?? '-'}</td></tr>
                                            <tr><td className={`py-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>อนุมัติโดย</td><td className={`text-right py-1 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{poCards.find(doc => doc.po.po_no === po.po_no)?.approved_by ?? '-'}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                {/* Bottom: Actions */}
                                <div className="w-full px-6 pb-5 flex flex-col gap-2 items-center">
                                    <span className={`text-xs mb-1 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>{formatDate(po.po_date)}</span>
                                    <div className="flex w-full justify-center">
                                        <button
                                            className={`flex items-center justify-center rounded-l-lg px-4 py-2 text-lg font-medium transition ${isDarkMode ? 'text-emerald-400 bg-emerald-900/20 border border-emerald-800/50 hover:bg-emerald-800/30' : 'text-green-600 bg-green-50 border border-green-100 hover:bg-green-100'}`}
                                            onClick={(e) => { e.stopPropagation(); router.push(`/services/purchase/PO/ReviewedPO?poNo=${po.po_no}`); }}
                                        >
                                            <MdOutlineRemoveRedEye className="w-7 h-7" />
                                        </button>
                                        <button
                                            className={`flex items-center justify-center rounded-r-lg px-4 py-2 text-lg font-medium transition ${isDarkMode ? 'text-red-400 bg-red-900/20 border border-red-800/50 hover:bg-red-800/30' : 'text-red-400 bg-red-50 border border-red-100 hover:bg-red-100'}`}
                                        // onClick={async e => {
                                        //     e.stopPropagation();
                                        //     // Download PDF from API
                                        //     try {
                                        //         // 1. สร้าง PDF ก่อน
                                        //         const res = await fetch('/api/exportPDF/PO', {
                                        //             method: 'POST',
                                        //             headers: { 'Content-Type': 'application/json' },
                                        //             body: JSON.stringify({ po_no: po.po_no, download: true, token })
                                        //         });
                                        //         const result = await res.json();
                                        //         if (!res.ok || !result.success || !result.filePath) throw new Error(result.error || 'ดาวน์โหลด PDF ไม่สำเร็จ');
                                        //         // 2. ดาวน์โหลด PDF จริงจาก server
                                        //         const downloadRes = await fetch(`/api/exportPDF/PO?po_no=${po.po_no}`);
                                        //         if (!downloadRes.ok) throw new Error('ดาวน์โหลด PDF ไม่สำเร็จ');
                                        //         const blob = await downloadRes.blob();
                                        //         const url = window.URL.createObjectURL(blob);
                                        //         const a = document.createElement('a');
                                        //         a.href = url;
                                        //         a.download = `PO_${po.po_no}.pdf`;
                                        //         document.body.appendChild(a);
                                        //         a.click();
                                        //         a.remove();
                                        //         window.URL.revokeObjectURL(url);
                                        //     } catch (err) {
                                        //         alert('เกิดข้อผิดพลาดในการดาวน์โหลด PDF');
                                        //     }
                                        // }}
                                        >
                                            <GoDownload className="w-7 h-7" />
                                        </button>
                                    </div>
                                    {/* <span className={`text-xs mt-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                                        {pr.supervisor_reject_at || pr.manager_reject_at || pr.pu_operator_reject_at ? (
                                            <>ปฏิเสธ <span className={`font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>{pr.count_list} รายการ</span></>
                                        ) : (
                                            <>ดำเนินการ {pr.waiting} | <span className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-green-700'}`}>{pr.count_list} รายการ</span></>
                                        )}
                                    </span> */}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}