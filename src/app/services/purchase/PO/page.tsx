"use client";

import React from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

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
import { useSidebar } from "../../../context/SidebarContext";

// icons
import { LuCalendarFold } from "react-icons/lu";
import { MdOutlineSort, MdOutlineRemoveRedEye } from "react-icons/md";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { GoDownload, GoSearch } from "react-icons/go";
import { HiDocumentText } from "react-icons/hi2";
import { TbLayoutList, TbLayoutCards } from "react-icons/tb";
import { SiMinutemailer } from "react-icons/si";
import { FaRegCircleQuestion } from "react-icons/fa6";
import { BsExclamationDiamond } from "react-icons/bs";
import { IoSettingsOutline } from "react-icons/io5";
import { TbProgressCheck } from "react-icons/tb";
import { TbSettingsCheck } from "react-icons/tb";
import { TbSettingsQuestion } from "react-icons/tb";

// Types
// ปรับ type ให้ตรงกับโครงสร้างใหม่
type PoCardItem = {
    po: POCard;
    issued_by: string | null;
    approved_by: string | null;
    rejected_by: string | null;
    count_list: number;
};
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
    pu_validator: string | null;
    edit_reason: string | null;
    edit_request: string | null;
    edit_response: string | null;
    edit_response_reason: string | null;
    edit_response_by: string | null;
    edit_at: string | null;
    edit_user: string | null;
    remarks: string | null;
    ext_discount: number;
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
    // อ่านค่าจาก localStorage ตอน mount
    const [isListView, setIsListView] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('poLayout');
            return saved === 'list' ? false : true;
        }
        return true;
    });
    // Sync ค่า layout กับ localStorage ทุกครั้งที่เปลี่ยน
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem('poLayout', isListView ? 'card' : 'list');
        }
    }, [isListView]);

    // Router
    const router = useRouter();
    const { user } = useUser();
    const departmentId = user?.Department?.ID;

    // Error and loading states
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // NOTE: Data states
    const [poCards, setPoCards] = useState<PoCardItem[]>([]);
    const token = useToken();
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

    // Helper to get search param from URL (client only)
    function getSearchParam(key: string) {
        if (typeof window === 'undefined') return null;
        return new URLSearchParams(window.location.search).get(key);
    }
    const pathname = usePathname();

    // NOTE: Check department access
    useEffect(() => {
        if (departmentId !== undefined && departmentId !== 10086) {
            alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
            router.replace(process.env.NEXT_PUBLIC_PURCHASE_PR_REDIRECT || "/services/purchase");
        }
    }, [departmentId, router]);

    // TODO: Card Display Logic
    // รวม POCard ทั้งหมดจากทุก PoCardItem
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

    // ANCHOR Helper function to determine PO status (matches badge display logic exactly)
    const getPOStatus = (po: POCard): string => {
        if (po.rejected_by && !po.edit_at && !po.edit_reason) {
            return 'rejected'; // ปฏิเสธ (แดง)
        } else if ((!po.pu_validated_at && !po.edit_response) || (!po.pu_validated_at && !po.edit_response && po.rejected_by)) {
            return 'waiting-validated'; // รอการตรวจสอบ (เทา)
        } else if ((po.pu_validated_at && !po.edit_at && !po.approved_by) || (po.pu_validated_at && po.edit_at && !po.approved_by) || (po.pu_validated_at && po.edit_at && !po.approved_by && po.rejected_by)) {
            return 'processing'; // รอการอนุมัติ (เหลือง)
        } else if ((po.approved_by && po.edit_at) || (po.approved_by && !po.edit_at && !po.edit_reason) || (po.approved_by && po.edit_at && po.rejected_by) && (po.approved_by && po.edit_at && po.rejected_by) && (po.approved_at && po.edit_at && po.rejected_by && !po.edit_reason)) {
            return 'complete'; // อนุมัติเสร็จสิ้น (เขียว)
        } else if (po.edit_reason && !po.edit_response) {
            return 'edit-request'; // ร้องขอการแก้ไข (ส้ม)
        } else if (po.edit_response && !po.edit_at && !po.rejected_by) {
            return 'edit-process'; // ดำเนินการแก้ไข (ส้ม)
        } else if (po.edit_at) {
            return 'edit-success'; // แก้ไขเสร็จสิ้น (ม่วง)
        } else {
            return 'waiting-validated'; // Default: รอการตรวจสอบ
        }
    };

    // NOTE: Count filtered items for pagination (like purchase page)
    const filteredPoCards = statusFilter ? displayedPoCards.filter(po => {
        const currentStatus = getPOStatus(po);
        return currentStatus === statusFilter;
    }) : displayedPoCards;

    // NOTE: Show all items but use filtered count for pagination
    const filteredCount = filteredPoCards.length;

    // NOTE: Pagination states (sync with URL)
    const [itemsPerPage, setItemsPerPage] = useState(() => {
        const urlPerPage = typeof window !== 'undefined' ? getSearchParam('perPage') : null;
        return urlPerPage && [10, 25, 50, 100].includes(Number(urlPerPage)) ? Number(urlPerPage) : 10;
    });
    const [currentPage, setCurrentPage] = useState(() => {
        const urlPage = typeof window !== 'undefined' ? getSearchParam('page') : null;
        return urlPage && Number(urlPage) > 0 ? Number(urlPage) : 1;
    });
    // Use filtered count for pagination (like purchase page)
    const [totalItems, setTotalItems] = useState(0);
    const effectiveTotalItems = statusFilter ? filteredCount : totalItems;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const totalPages = Math.ceil(effectiveTotalItems / itemsPerPage);
    
    // Show all items but paginate based on filtered count
    const paginatedPoCards = statusFilter ? 
        filteredPoCards.slice(startIndex, startIndex + itemsPerPage) : 
        displayedPoCards.slice(startIndex, startIndex + itemsPerPage);

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

                // กำหนด URL และ options สำหรับ fetch - ดึงข้อมูลทั้งหมดเพื่อให้กรองได้ครบ
                let url = `${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/all?page=1&limit=1000`;
                let fetchOptions: RequestInit = {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                };

                // ถ้ามี search ให้ใช้ API search
                if (search && search.trim() !== "") {
                    url = `${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/search?keyword=${encodeURIComponent(search)}&page=1&limit=1000`;
                    fetchOptions = {
                        ...fetchOptions,
                        headers: {
                            ...(fetchOptions.headers || {}),
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        cache: "no-store" as RequestCache
                    };
                }

                const responsePO = await fetch(url, fetchOptions);
                // const responseText = await responsePO.clone().text();

                if (responsePO.status === 401) {
                    setError("Token หมดอายุ กรุณาเข้าสู่ระบบใหม่");
                    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    router.push(process.env.NEXT_PUBLIC_LOGOUT_REDIRECT || "/login");
                    return;
                }
                if (!responsePO.ok) {
                    throw new Error(`HTTP ${responsePO.status}: ${responsePO.statusText}`);
                }

                const data = await responsePO.json();
                console.log("Fetched PO data:", data);
                // รองรับทั้ง API /all (data.poDocs.po_all) และ API /search (data.poDocs)
                let posArray = [];
                if (Array.isArray(data.poDocs?.po_all)) {
                    posArray = data.poDocs.po_all; // API /all
                } else if (Array.isArray(data.poDocs)) {
                    posArray = data.poDocs; // API /search
                }
                console.log("posArray after mapping:", posArray);

                //Filter by date range BEFORE setPoCards
                if (dateRange && dateRange.start && dateRange.end) {
                    posArray = posArray.filter((doc: PoCardItem) => {
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
                // Set totalItems - รองรับทั้ง API /all และ /search
                let totalCount = 0;
                if (data.poDocs?.amount_po) {
                    totalCount = data.poDocs.amount_po; // API /all
                } else if (Array.isArray(data.poDocs)) {
                    totalCount = data.poDocs.length; // API /search - ใช้จำนวนข้อมูลที่ได้
                } else if (data.total || data.count) {
                    totalCount = data.total || data.count; // fallback หาก API ส่ง field อื่น
                } else {
                    totalCount = posArray.length; // fallback ใช้จำนวนข้อมูลที่ได้จริง
                }
                setTotalItems(totalCount);
                console.log("Filtered PO cards:", posArray.length, "items, totalItems:", totalCount);
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
    }, [token, router, search, dateRange]); // ลบ currentPage และ itemsPerPage ออกจาก dependency เพื่อไม่ให้ fetch ใหม่ทุกครั้งที่เปลี่ยนหน้า

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
            /* Light mode: selected day, range start/end */
            .flatpickr-day.selected, .flatpickr-day.startRange, .flatpickr-day.endRange {
                background: #22c55e !important; /* light green */
                color: #fff !important;
            }
            /* Light mode: in range (not start/end) */
            .flatpickr-day.inRange:not(.startRange):not(.endRange) {
                background: #bbf7d0 !important; /* green-100 */
                color: #166534 !important; /* green-800 */
            }
            /* Light mode: hover */
            .flatpickr-day:not(.selected):not(.inRange):hover {
                background: #d1fae5 !important; /* green-50 */
                color: #059669 !important; /* green-600 */
            }
            /* Light mode: today */
            .flatpickr-day.today:not(.selected) {
                border: 1.5px solid #22c55e !important;
                background: #f0fdf4 !important; /* green-50 */
                color: #059669 !important;
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
    }, [calendarOpen, isDarkMode]);

    // TODO: PDF
    // Preview PDF: ใช้ Authorization header (Bearer token) เพื่อไม่ให้ token อยู่ใน URL
    // หมายเหตุ: GET ไม่สามารถส่ง body ที่ browser ยอมรับได้ ดังนั้นใช้ header แทน
    const previewPoPdf = async (po_no: string) => {
        // console.log("Download PDF for PO ID:", po_no);
        const pdfUrl = `${process.env.NEXT_PUBLIC_ROOT_PATH_PDF_SERVICE}/preview/${po_no}/${token}`;
        window.open(pdfUrl, '_blank');
    }

    const downloadPoPdf = (po_no: string) => {
        // console.log("Download PDF for PO ID:", po_no);
        const pdfUrl = `${process.env.NEXT_PUBLIC_ROOT_PATH_PDF_SERVICE}/download/${po_no}/${token}`;
        window.open(pdfUrl, '_blank');
    }

    const { isCollapsed } = useSidebar();

    return (
        <div className="min-h-screen">
            <Sidebar />
            <Header />
            <main
                className="mt-[7.5rem] mr-6 transition-all duration-300"
                style={{
                    minHeight: 'calc(100vh - 3rem)',
                    position: 'relative',
                    marginLeft: isCollapsed ? '9rem' : 'calc(18rem + 55px)',
                }}
            >
                <div className="pb-5 pr-5 relative z-10">
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
                            {/* NOTE: Card | List View Toggle */}
                            <button
                                type="button"
                                className={`group relative flex items-center justify-center w-12 h-12 rounded-xl transition-all cursor-pointer duration-500 overflow-hidden ${isListView
                                    ? (isDarkMode
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 hover:shadow-emerald-500/30 hover:scale-105'
                                        : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 hover:shadow-emerald-600/30 hover:scale-105')
                                    : (isDarkMode
                                        ? 'bg-slate-800/60 text-emerald-400 border border-slate-600/50 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-slate-700/60'
                                        : 'bg-white text-emerald-600 border border-gray-300 hover:text-emerald-600 hover:border-emerald-400 shadow-sm hover:shadow-md')
                                    }`}
                                onClick={() => setIsListView(v => !v)}
                                aria-label="Toggle view mode"
                            >
                                <div className="relative w-6 h-6">
                                    {/* Card View Icon */}
                                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${isListView
                                        ? 'opacity-100 scale-100 rotate-0'
                                        : 'opacity-0 scale-75 rotate-180'
                                        }`}>
                                        <TbLayoutCards className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                                    </div>

                                    {/* List View Icon */}
                                    <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out ${!isListView
                                        ? 'opacity-100 scale-100 rotate-0'
                                        : 'opacity-0 scale-75 rotate-180'
                                        }`}>
                                        <TbLayoutList className="w-6 h-6 transition-transform duration-300 group-hover:scale-110" />
                                    </div>
                                </div>
                                {/* Ripple effect */}
                                <div className={`absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity duration-200 ${isDarkMode ? 'bg-white/10' : 'bg-black/5'} rounded-xl`} />
                            </button>

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
                                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                        <GoSearch className={`w-5 h-5 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'}`} />
                                    </div>
                                    <input
                                        type="search"
                                        id="search-dropdown"
                                        className={`block pl-10 pr-3 py-3 w-full z-20 text-base font-medium border-none h-[48px] focus:outline-none ${isDarkMode ? 'text-slate-200 bg-slate-900/50 placeholder-slate-500' : 'text-gray-700 bg-white'}`}
                                        placeholder="PO, ออกโดย"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                    <div className="relative">
                                        <button
                                            type="button"
                                            className={`p-3 text-base cursor-pointer font-medium h-[48px] text-white rounded-r-xl focus:outline-none w-[48px] flex items-center justify-center ${isDarkMode ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                                            style={{ marginLeft: '-1px' }}
                                            onClick={e => {
                                                e.preventDefault();
                                                setCalendarOpen(true);
                                                setTimeout(() => {
                                                    dateRangeInputRef.current?.focus();
                                                }, 0);
                                            }}
                                        >
                                            <LuCalendarFold className="w-6 h-6 text-white transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
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
                                    className={`group flex items-center cursor-pointer justify-center h-[48px] w-[48px] rounded-xl transition-all duration-300 cursor-pointer border-2 shadow-sm hover:shadow-md ${statusSortDropdownOpen
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
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${statusFilter === 'waiting-validated' ? (isDarkMode ? 'bg-neutral-900/30 text-neutral-200' : 'bg-neutral-50 text-neutral-800') : (isDarkMode ? 'text-neutral-300 hover:bg-neutral-900/20 hover:text-neutral-200' : 'text-neutral-700 hover:bg-neutral-50 hover:text-neutral-800')}`}
                                            onClick={() => { setStatusFilter('waiting-validated'); }}
                                        >
                                            <span className="inline-flex items-center gap-2"><FaRegCircleQuestion className={`w-4 h-4 ${isDarkMode ? 'text-neutral-400' : 'text-neutral-600'}`} />รอการตรวจสอบ</span>
                                        </li>
                                        <li
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${statusFilter === 'processing' ? (isDarkMode ? 'bg-yellow-900/30 text-yellow-200' : 'bg-yellow-50 text-yellow-800') : (isDarkMode ? 'text-slate-300 hover:bg-yellow-900/20 hover:text-yellow-200' : 'text-gray-700 hover:bg-yellow-50 hover:text-yellow-800')}`}
                                            onClick={() => { setStatusFilter('processing'); }}
                                        >
                                            <span className="inline-flex items-center gap-2"><TbProgressCheck className={`w-4 h-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />รอการอนุมัติ</span>
                                        </li>
                                        <li
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${statusFilter === 'edit-request' ? (isDarkMode ? 'bg-orange-900/30 text-orange-200' : 'bg-orange-50 text-orange-800') : (isDarkMode ? 'text-slate-300 hover:bg-orange-900/20 hover:text-orange-200' : 'text-gray-700 hover:bg-orange-50 hover:text-orange-800')}`}
                                            onClick={() => { setStatusFilter('edit-request'); }}
                                        >
                                            <span className="inline-flex items-center gap-2"><TbSettingsQuestion className={`w-4 h-4 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />ร้องขอการแก้ไข</span>
                                        </li>
                                        <li
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${statusFilter === 'edit-process' ? (isDarkMode ? 'bg-rose-900/30 text-rose-200' : 'bg-rose-50 text-rose-800') : (isDarkMode ? 'text-slate-300 hover:bg-rose-900/20 hover:text-rose-200' : 'text-gray-700 hover:bg-rose-50 hover:text-rose-800')}`}
                                            onClick={() => { setStatusFilter('edit-process'); }}
                                        >
                                            <span className="inline-flex items-center gap-2"><IoSettingsOutline className={`w-4 h-4 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`} />ดำเนินการแก้ไข</span>
                                        </li>
                                        <li
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${statusFilter === 'edit-success' ? (isDarkMode ? 'bg-violet-900/30 text-violet-200' : 'bg-violet-50 text-violet-800') : (isDarkMode ? 'text-slate-300 hover:bg-violet-900/20 hover:text-violet-200' : 'text-gray-700 hover:bg-violet-50 hover:text-violet-800')}`}
                                            onClick={() => { setStatusFilter('edit-success'); }}
                                        >
                                            <span className="inline-flex items-center gap-2"><TbSettingsCheck className={`w-4 h-4 ${isDarkMode ? 'text-violet-400' : 'text-violet-600'}`} />แก้ไขเสร็จสิ้น</span>
                                        </li>
                                        <li
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${statusFilter === 'complete' ? (isDarkMode ? 'bg-green-900/30 text-green-200' : 'bg-green-50 text-green-900') : (isDarkMode ? 'text-slate-300 hover:bg-green-900/20 hover:text-green-200' : 'text-gray-700 hover:bg-green-50 hover:text-green-900')}`}
                                            onClick={() => { setStatusFilter('complete'); }}
                                        >
                                            <span className="inline-flex items-center gap-2"><svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>อนุมัติเสร็จสิ้น</span>
                                        </li>
                                        <li
                                            className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 mx-2 ${statusFilter === 'complete' ? (isDarkMode ? 'bg-green-900/30 text-green-200' : 'bg-green-50 text-green-900') : (isDarkMode ? 'text-slate-300 hover:bg-green-900/20 hover:text-green-200' : 'text-gray-700 hover:bg-green-50 hover:text-green-900')}`}
                                            onClick={() => { setStatusFilter('complete'); }}
                                        >
                                            <span className="inline-flex items-center gap-2 items-center"><SiMinutemailer className="w-4 h-4 text-green-600" />ส่ง email สำเร็จ</span>
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
                        {effectiveTotalItems > 0 && (
                            <div className={`flex items-center gap-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                {/* Page info and navigation */}
                                <div className={`flex items-center border rounded-lg shadow-sm overflow-hidden ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-white'}`}>
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
                                            className={`border-r px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 shadow-sm transition-all ${isDarkMode ? 'border-slate-600 bg-slate-800 text-slate-200 focus:ring-emerald-500/30 focus:border-emerald-500' : 'border-slate-300 bg-white text-slate-700 focus:ring-emerald-200 focus:border-emerald-400'}`}
                                        >
                                            <option value={10}>10 per page</option>
                                            <option value={25}>25 per page</option>
                                            <option value={50}>50 per page</option>
                                            {/* <option value={100}>100 per page</option> */}
                                        </select>
                                        {/* <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>รายการ</span> */}
                                    </div>

                                    <div className={`px-4 py-2 text-sm border-r font-medium ${isDarkMode ? 'text-slate-300 bg-slate-700/50 border-slate-600' : 'text-slate-600 bg-slate-50 border-slate-300'}`}>
                                        {(() => {
                                            const currentTotal = effectiveTotalItems;
                                            const startItem = currentTotal === 0 ? 0 : startIndex + 1;
                                            const endItem = Math.min(startIndex + itemsPerPage, currentTotal);
                                            return (
                                                <>
                                                    <span className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{startItem}-{endItem}</span>
                                                    {' '}จาก{' '}
                                                    <span className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{currentTotal}</span>
                                                    {statusFilter && (
                                                        <span className={`ml-2 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                                                            (กรองจาก {totalItems} รายการ)
                                                        </span>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>

                                    {/* Navigation buttons */}
                                    <div className="flex items-center">
                                        <button
                                            type="button"
                                            className={`p-2 disabled:opacity-30 disabled:cursor-not-allowed border-r cursor-pointer transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700 border-slate-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 border-slate-300'}`}
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
                                            className={`p-2 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
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

                    {/* Content Display - Cards or List View */}
                    {isListView ? (
                        /* Card View (เดิม) */
                        <div className="grid gap-x-6 gap-y-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center mt-2 mb-4">
                            {paginatedPoCards.map((po) => (
                                <div
                                    key={po.po_no}
                                    className={`relative rounded-2xl p-0 flex flex-col items-center shadow-md border w-full max-w-[270px] min-w-[180px] min-h-[320px] transition-all duration-200 hover:scale-[1.03] hover:shadow-lg cursor-pointer ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50 hover:border-emerald-500/30' : 'bg-white border-green-200 hover:border-green-400'}`}
                                    onClick={() => {
                                        const reviewedPath = process.env.NEXT_PUBLIC_PURCHASE_PO_REVIEWED_REDIRECT
                                            ? process.env.NEXT_PUBLIC_PURCHASE_PO_REVIEWED_REDIRECT.replace(':poNo', po.po_no)
                                            : `/services/purchase/PO/ReviewedPO?poNo=${po.po_no}`;
                                        router.push(reviewedPath);
                                    }}
                                >
                                    {/* Top: Department Icon */}
                                    <div className="w-full flex justify-center pt-12 pb-2">
                                        <HiDocumentText className={`h-14 w-14 ${departmentColors[po.po_no] || 'text-emerald-400'}`} />
                                    </div>
                                    {/* Status badge top right */}
                                    <div className="absolute top-2 right-2 z-10">
                                        {(po.rejected_by && !po.edit_at && !po.edit_reason) ? (
                                            // 1. ปฏิเสธ = rejected_by มีข้อมูล
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-red-900/30 border-red-700/60 text-red-200' : 'bg-red-50 border-red-300 text-red-800'}`}>
                                                <svg className={`w-4 h-4 ${isDarkMode ? 'text-red-200' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                ปฏิเสธ
                                            </span>
                                        ) : (!po.pu_validated_at && !po.edit_response) || (!po.pu_validated_at && !po.edit_response && !po.rejected_by) ? (
                                            // 0. รอการตรวจสอบ = ไม่มีข้อมูลใดๆ
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-neutral-900/30 border-neutral-700/60 text-neutral-200' : 'bg-neutral-50 border-neutral-300 text-neutral-800'}`}>
                                                {/* <svg className={`w-4 h-4 ${isDarkMode ? 'text-neutral-200' : 'text-neutral-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                                                </svg> */}
                                                <FaRegCircleQuestion className={`w-4 h-4`} />รอการตรวจสอบ
                                            </span>
                                        ) : (po.pu_validated_at && !po.edit_at && !po.approved_by) || (po.pu_validated_at && po.edit_at && !po.approved_by) || (po.pu_validated_at && po.edit_at && !po.approved_by && po.rejected_by) ? (
                                            // 2. รอดำเนินการ = issued_by มีข้อมูล
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-yellow-900/30 border-yellow-700/60 text-yellow-200' : 'bg-yellow-50 border-yellow-400 text-yellow-800'}`}>
                                                {/* <svg className={`w-4 h-4 ${isDarkMode ? 'text-yellow-200' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                                                </svg> */}
                                                <TbProgressCheck className={`w-4 h-4`} />รอการอนุมัติ
                                            </span>
                                        ) : (po.approved_by && po.edit_at) || (po.approved_by && !po.edit_at && !po.edit_reason) || (po.approved_by && po.edit_at && po.rejected_by) && (po.approved_by && po.edit_at && po.rejected_by) && (po.approved_at && po.edit_at && po.rejected_by && !po.edit_reason) ? (
                                            // 3. อนุมัติเสร็จสิ้น = approved_by มีข้อมูล
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-green-900/30 border-green-700/60 text-green-200' : 'bg-green-50 border-green-500 text-green-900'}`}>
                                                <svg className={`w-4 h-4 ${isDarkMode ? 'text-green-200' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                อนุมัติเสร็จสิ้น
                                            </span>
                                        ) : (po.edit_reason && !po.edit_response) ? (
                                            // 4. ดำเนินการแก้ไข = edit_response มีข้อมูล
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-orange-900/30 border-orange-700/60 text-orange-200' : 'bg-orange-50 border-orange-400 text-orange-800'}`}>
                                                {/* <svg className={`w-4 h-4 ${isDarkMode ? 'text-orange-200' : 'text-orange-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                                                </svg>
                                                ร้องขอการแก้ไข */}
                                                <TbSettingsQuestion className={`w-4 h-4`} />ร้องขอการแก้ไข
                                            </span>
                                        ) : (po.edit_response && !po.edit_at && !po.rejected_by) ? (
                                            // 4. ดำเนินการแก้ไข = edit_response มีข้อมูล
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-rose-900/30 border-rose-700/60 text-rose-200' : 'bg-rose-50 border-rose-400 text-rose-800'}`}>
                                                {/* <svg className={`w-4 h-4 ${isDarkMode ? 'text-orange-200' : 'text-orange-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                                                </svg> */}
                                                <IoSettingsOutline className={`w-4 h-4`} />ดำเนินการแก้ไข
                                            </span>
                                        ) : po.edit_at ? (
                                            // 5. แก้ไขเสร็จสิ้น = edit_at มีข้อมูล
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-violet-900/30 border-violet-700/60 text-violet-200' : 'bg-violet-50 border-violet-400 text-violet-800'}`}>
                                                {/* <svg className={`w-4 h-4 ${isDarkMode ? 'text-fuchsia-200' : 'text-fuchsia-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                                                </svg> */}
                                                <TbSettingsCheck className={`w-4 h-4`} />แก้ไขเสร็จสิ้น
                                            </span>
                                        ) : (
                                            // 0. รอการตรวจสอบ = ไม่มีข้อมูลใดๆ
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-gray-900/30 border-gray-700/60 text-gray-200' : 'bg-gray-50 border-gray-300 text-gray-800'}`}>
                                                {/* <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                                                </svg> */}
                                                <BsExclamationDiamond className={`w-4 h-4`} />ERROR
                                            </span>
                                        )}
                                    </div>
                                    {/* Middle: Table info */}
                                    <div className="w-full px-6 pt-2">
                                        <table className="w-full text-sm mb-2">
                                            <tbody>
                                                <tr>
                                                    <td className={`py-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>หมายเลข PO</td>
                                                    <td className={`text-right font-semibold py-1 ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>{po.po_no}</td>
                                                </tr>
                                                <tr>
                                                    <td className={`py-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>ออกโดย</td>
                                                    <td className={`text-right py-1 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}
                                                        style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                        title={poCards.find(doc => doc.po.po_no === po.po_no)?.issued_by ?? '-'}
                                                    >
                                                        {(() => {
                                                            const name = poCards.find(doc => doc.po.po_no === po.po_no)?.issued_by ?? '-';
                                                            return name && name.length > 18 ? name.slice(0, 16) + '...' : name;
                                                        })()}
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td className={`py-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>อนุมัติโดย</td>
                                                    <td className={`text-right py-1 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}
                                                        style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                                        title={poCards.find(doc => doc.po.po_no === po.po_no)?.approved_by ?? '-'}
                                                    >
                                                        {(() => {
                                                            const name = poCards.find(doc => doc.po.po_no === po.po_no)?.approved_by ?? '-';
                                                            return name && name.length > 18 ? name.slice(0, 16) + '...' : name;
                                                        })()}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    {/* Bottom: Actions */}
                                    <div className="w-full px-6 pb-5 flex flex-col gap-2 items-center">
                                        <span className={`text-xs mb-1 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>{formatDate(po.po_date)}</span>
                                        <div className="flex w-full justify-center">
                                            <button
                                                className={`flex items-center justify-center rounded-l-lg px-4 py-2 text-lg font-medium transition ${isDarkMode ? 'text-emerald-400 bg-emerald-900/20 border border-emerald-800/50 hover:bg-emerald-800/30' : 'text-green-600 bg-green-50 border border-green-100 hover:bg-green-100'}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // ทดสอบเปิดไฟล์ PDF เฉพาะ PO_D2510035.pdf
                                                    // const pdfPath = `/generated-pdf/PO_D2510035.pdf`;
                                                    // window.open(pdfPath, '_blank', 'noopener');
                                                    previewPoPdf(String(po.po_no));
                                                    //window.open(`http://192.168.2.139:5000/preview/${po.po_no}`, '_blank', 'noopener');
                                                }}
                                            >
                                                <MdOutlineRemoveRedEye className="w-7 h-7" />
                                            </button>
                                            <button
                                                className={`flex items-center justify-center rounded-r-lg px-4 py-2 text-lg font-medium transition ${isDarkMode ? 'text-red-400 bg-red-900/20 border border-red-800/50 hover:bg-red-800/30' : 'text-red-400 bg-red-50 border border-red-100 hover:bg-red-100'}`}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    // ดาวน์โหลด PDF จาก public/generated-pdf/PO_{po.po_no}.pdf
                                                    // const pdfPath = `/generated-pdf/PO_${po.po_no}.pdf`;
                                                    // const pdfPath = `/generated-pdf/PO_D2510035.pdf`;
                                                    // const a = document.createElement('a');
                                                    // a.href = pdfPath;
                                                    // // a.download = `PO_${po.po_no}.pdf`;
                                                    // a.download = `PO_D2510035.pdf`;
                                                    // document.body.appendChild(a);
                                                    // a.click();
                                                    // a.remove();
                                                    downloadPoPdf(String(po.po_no));
                                                }}
                                            >
                                                <GoDownload className="w-7 h-7" />
                                            </button>
                                        </div>
                                        <span className={`text-xs mt-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                                            {(() => {
                                                const doc = poCards.find(doc => doc.po.po_no === po.po_no);
                                                const countList = doc?.count_list ?? 0;
                                                if (po.rejected_by) {
                                                    return <>
                                                        ปฏิเสธ <span className={`font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>{countList} รายการ</span>
                                                    </>;
                                                } else if (po.approved_by) {
                                                    return <>
                                                        ดำเนินการ <span className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-green-700'}`}>{countList} รายการ</span>
                                                    </>;
                                                } else {
                                                    return <>
                                                        รอดำเนินการ <span className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-green-700'}`}>{countList} รายการ</span>
                                                    </>;
                                                }
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        /* List View (แบบตาราง) */
                        <div className="mt-2 mb-4">
                            {/* Table Header */}
                            <div className={`overflow-x-auto rounded-xl border ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} shadow-sm`}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className={`${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                        <tr>
                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>
                                                หมายเลข PO
                                            </th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>
                                                ออกโดย
                                            </th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>
                                                อนุมัติโดย
                                            </th>
                                            <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>
                                                วันที่
                                            </th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>
                                                สถานะ
                                            </th>
                                            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>
                                                การดำเนินการ
                                            </th>
                                            <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-500'}`}>
                                                PDF
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700 bg-slate-900' : 'divide-gray-200 bg-white'}`}>
                                        {paginatedPoCards.map((po) => (
                                            <tr
                                                key={po.po_no}
                                                className={`cursor-pointer transition-colors ${isDarkMode ? 'hover:bg-emerald-900/20' : 'hover:bg-emerald-50'} focus-within:bg-emerald-100`}
                                                style={{ transition: 'background 0.15s' }}
                                                onClick={() => {
                                                    const reviewedPath = process.env.NEXT_PUBLIC_PURCHASE_PO_REVIEWED_REDIRECT
                                                        ? process.env.NEXT_PUBLIC_PURCHASE_PO_REVIEWED_REDIRECT.replace(':poNo', po.po_no)
                                                        : `/services/purchase/PO/ReviewedPO?poNo=${po.po_no}`;
                                                    router.push(reviewedPath);
                                                }}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <HiDocumentText className={`h-8 w-8 mr-3 ${departmentColors[po.po_no] || 'text-emerald-400'}`} />
                                                        <div className={`text-sm font-medium ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                                                            {po.po_no}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-700'} max-w-[150px] truncate`}
                                                        title={poCards.find(doc => doc.po.po_no === po.po_no)?.issued_by ?? '-'}>
                                                        {poCards.find(doc => doc.po.po_no === po.po_no)?.issued_by ?? '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-700'} max-w-[150px] truncate`}
                                                        title={poCards.find(doc => doc.po.po_no === po.po_no)?.approved_by ?? '-'}>
                                                        {poCards.find(doc => doc.po.po_no === po.po_no)?.approved_by ?? '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`text-sm text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                        {formatDate(po.po_date)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {po.rejected_by && !po.edit_at && !po.edit_reason ? (
                                                        // 1. ปฏิเสธ = rejected_by มีข้อมูล
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'}`}>
                                                            <span className="w-2 h-2 rounded-full mr-2 inline-block" style={{ background: isDarkMode ? '#f87171' : '#dc2626' }}></span>
                                                            ปฏิเสธ
                                                        </span>
                                                    ) : (!po.pu_validated_at && !po.edit_response) || (!po.pu_validated_at && !po.edit_response && !po.rejected_by) ? (
                                                        // 0. รอการตรวจสอบ = ไม่มีข้อมูลใดๆ
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-neutral-900/30 text-neutral-200' : 'bg-neutral-100 text-neutral-800'}`}>
                                                            <span className="w-2 h-2 rounded-full mr-2 inline-block" style={{ background: isDarkMode ? '#a3a3a3' : '#525252' }}></span>
                                                            รอการตรวจสอบ
                                                        </span>
                                                    ) : (po.pu_validated_at && !po.edit_at && !po.approved_by) || (po.pu_validated_at && po.edit_at && !po.approved_by) || (po.pu_validated_at && po.edit_at && !po.approved_by && po.rejected_by) ? (
                                                        // 2. รอดำเนินการ = issued_by มีข้อมูล
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-yellow-900/30 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}`}>
                                                            <span className="w-2 h-2 rounded-full mr-2 inline-block" style={{ background: isDarkMode ? '#fde68a' : '#fbbf24' }}></span>
                                                            รอการอนุมัติ
                                                        </span>
                                                    ) : (po.approved_by && po.edit_at) || (po.approved_by && !po.edit_at && !po.edit_reason) || (po.approved_by && po.edit_at && po.rejected_by) && (po.approved_by && po.edit_at && po.rejected_by) && (po.approved_at && po.edit_at && po.rejected_by && !po.edit_reason) ? (
                                                        // 3. อนุมัติเสร็จสิ้น = approved_by มีข้อมูล
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-green-900/30 text-green-200' : 'bg-green-100 text-green-800'}`}>
                                                            <span className="w-2 h-2 rounded-full mr-2 inline-block" style={{ background: isDarkMode ? '#6ee7b7' : '#059669' }}></span>
                                                            อนุมัติเสร็จสิ้น
                                                        </span>
                                                    ) : (po.edit_reason && !po.edit_response) ? (
                                                        // 4. ดำเนินการแก้ไข = edit_response มีข้อมูล
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-orange-900/30 text-orange-200' : 'bg-orange-100 text-orange-800'}`}>
                                                            <span className="w-2 h-2 rounded-full mr-2 inline-block" style={{ background: isDarkMode ? '#fb923c' : '#ea580c' }}></span>
                                                            ร้องขอการแก้ไข
                                                        </span>
                                                    ) : (po.edit_response && !po.edit_at && !po.rejected_by) ? (
                                                        // 4. ดำเนินการแก้ไข = edit_response มีข้อมูล
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-rose-900/30 text-rose-200' : 'bg-rose-100 text-rose-800'}`}>
                                                            <span className="w-2 h-2 rounded-full mr-2 inline-block" style={{ background: isDarkMode ? '#fb7185' : '#e11d48' }}></span>
                                                            ดำเนินการแก้ไข
                                                        </span>
                                                    ) : po.edit_at ? (
                                                        // 5. แก้ไขเสร็จสิ้น = edit_at มีข้อมูล
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-violet-900/30 text-violet-200' : 'bg-violet-100 text-violet-800'}`}>
                                                            <span className="w-2 h-2 rounded-full mr-2 inline-block" style={{ background: isDarkMode ? '#c084fc' : '#9333ea' }}></span>
                                                            แก้ไขเสร็จสิ้น
                                                        </span>
                                                    ) : (
                                                        // 0. รอการตรวจสอบ = ไม่มีข้อมูลใดๆ
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-gray-900/30 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>
                                                            <span className="w-2 h-2 rounded-full mr-2 inline-block" style={{ background: isDarkMode ? '#9ca3af' : '#6b7280' }}></span>
                                                            ERROR
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                        {(() => {
                                                            const doc = poCards.find(doc => doc.po.po_no === po.po_no);
                                                            const countList = doc?.count_list ?? 0;
                                                            if (po.rejected_by) {
                                                                return <>ปฏิเสธ <span className={`font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>{countList}</span> รายการ</>;
                                                            } else if (po.approved_by) {
                                                                return <>ดำเนินการ <span className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-green-700'}`}>{countList}</span> รายการ</>;
                                                            } else {
                                                                return <>รอดำเนินการ <span className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-green-700'}`}>{countList}</span> รายการ</>;
                                                            }
                                                        })()}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex justify-center space-x-2">
                                                        <button
                                                            className={`inline-flex items-center px-3 py-2 border text-sm leading-4 font-medium rounded-md transition-colors ${isDarkMode ? 'text-emerald-400 bg-emerald-900/20 border-emerald-800/50 hover:bg-emerald-800/30' : 'text-green-600 bg-green-50 border-green-200 hover:bg-green-100'}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                previewPoPdf(String(po.po_no));
                                                            }}
                                                        >
                                                            <MdOutlineRemoveRedEye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            className={`inline-flex items-center px-3 py-2 border text-sm leading-4 font-medium rounded-md transition-colors ${isDarkMode ? 'text-red-400 bg-red-900/20 border-red-800/50 hover:bg-red-800/30' : 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100'}`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                // const pdfPath = `/generated-pdf/PO_${po.po_no}.pdf`;
                                                                // const a = document.createElement('a');
                                                                // a.href = pdfPath;
                                                                // a.download = `PO_${po.po_no}.pdf`;
                                                                // document.body.appendChild(a);
                                                                // a.click();
                                                                // a.remove();
                                                                downloadPoPdf(String(po.po_no));
                                                            }}
                                                        >
                                                            <GoDownload className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}