"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useEffect } from "react";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { GoDownload } from "react-icons/go";
import { IoDocumentTextOutline } from "react-icons/io5";
import { useTheme } from "../../components/ThemeProvider";
import Sidebar from "@/app/components/sidebar";
import Header from "@/app/components/header";
import { useToken } from "@/app/context/TokenContext";

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
}

// Icon mapping for departments with consistent IoDocumentTextOutline icon
const departmentColors: { [key: string]: string } = {
    "Production": "text-blue-500",
    "Maintenance": "text-green-500",
    "Quality Control": "text-purple-500",
    "Engineering": "text-yellow-500",
    "Logistics": "text-pink-500",
    "Procurement": "text-indigo-500",
    "R&D": "text-red-500"
};

export default function PurchasePage() {
    // ฟังก์ชันแปลงวันที่เป็น DD/MM/YYYY
    function formatDate(dateStr: string) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    }
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [departmentFilter, setDepartmentFilter] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
    const [sortBy, setSortBy] = useState("newest");
    const { isDarkMode } = useTheme();
    const [error, setError] = useState<string | null>(null);
    const [prCards, setPrCards] = useState<PRCard[]>([]);
    const [loading, setLoading] = useState(true);

    const token = useToken();

    useEffect(() => {
        const fetchPrCards = async () => {
            try {
                setError(null);

                // ตรวจสอบว่ามี token หรือไม่
                if (!token) {
                    setError("ไม่พบ token กรุณาเข้าสู่ระบบใหม่");
                    setLoading(false);
                    return;
                }

                console.log("Fetching PR cards with token:", token);
                const response = await fetch("/api/proxy/purchase/request/departments", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.status === 401) {
                    setError("Token หมดอายุ กรุณาเข้าสู่ระบบใหม่");
                    // ลบ token ที่หมดอายุ
                    document.cookie = "authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                    // Redirect ไปหน้า login
                    router.push("/login");
                    return;
                }

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                const prsArray = Array.isArray(data) ? data : data.data || [];

                setPrCards(prsArray);
                console.log("Loaded PR cards:", prsArray);

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

        if (token !== null) { // รอให้ token ถูก set ก่อน
            fetchPrCards();
        }
    }, [token, router]);

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
                        <form className="max-w-2xl w-full">
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
                                            {departmentFilter ? departmentFilter : "ทุกแผนก"}
                                        </span>
                                        <svg className={`ml-2 h-5 w-5 transition-transform duration-200 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'} ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {dropdownOpen && (
                                        <ul className={`absolute left-0 mt-2 w-full rounded-xl shadow-xl z-20 py-2 border ${isDarkMode ? 'bg-slate-900/95 border-slate-700/50 backdrop-blur-sm' : 'bg-white border-gray-200'}`}>
                                            <li
                                                className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 ${departmentFilter === '' ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-green-50 text-green-700') : (isDarkMode ? 'text-slate-300 hover:bg-slate-800/50 hover:text-emerald-400' : 'text-gray-700 hover:bg-gray-100 hover:text-green-700')}`}
                                                onClick={() => { setDepartmentFilter(''); setDropdownOpen(false); }}
                                            >
                                                ทุกแผนก
                                            </li>
                                            {/* {departmentList.map(dep => {
                                                const prCount = prList.filter(pr => pr.department === dep).length;
                                                return (
                                                    <li
                                                        key={dep}
                                                        className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 ${departmentFilter === dep ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-green-50 text-green-700') : (isDarkMode ? 'text-slate-300 hover:bg-slate-800/50 hover:text-emerald-400' : 'text-gray-700 hover:bg-gray-100 hover:text-green-700')}`}
                                                        onClick={() => { setDepartmentFilter(dep); setDropdownOpen(false); }}
                                                    >
                                                        {dep} <span className={`ml-2 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>({prCount})</span>
                                                    </li>
                                                );
                                            })} */}
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
                                        placeholder="ค้นหา PR, วันที่..."
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                        required
                                    />
                                    <button type="submit" className="p-3 text-base font-medium h-[48px] text-white bg-green-600 rounded-r-xl hover:bg-green-700 focus:ring-4 focus:outline-none focus:ring-green-300 w-[48px] flex items-center justify-center" style={{ marginLeft: '-1px' }}>
                                        <svg className="w-6 h-6 text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                            <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                                        </svg>
                                        <span className="sr-only">Search</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                        {/* Sort Dropdown - เหมือนกับ dropdown แผนก */}
                        <div className="relative" style={{ minWidth: '180px' }}>
                            <button
                                type="button"
                                className={`h-[48px] w-full flex items-center justify-between px-5 font-medium text-base focus:outline-none transition-all duration-150 rounded-xl ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}
                                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                            >
                                <h1 className={`text-md ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Sort by :&nbsp;</h1>
                                <span className={`text-md font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-600'}`}>
                                    {sortBy === "newest" ? "Newest" : "Oldest"}
                                </span>
                                <svg className={`ml-2 h-5 w-5 transition-transform duration-200 ${isDarkMode ? 'text-slate-400' : 'text-gray-400'} ${sortDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {sortDropdownOpen && (
                                <ul className={`absolute left-0 w-full rounded-xl shadow-xl z-20 py-2 border ${isDarkMode ? 'bg-slate-900/95 border-slate-700/50 backdrop-blur-sm' : 'bg-white border-gray-200'}`}>
                                    <li
                                        className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 ${sortBy === 'newest' ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-green-50 text-green-700') : (isDarkMode ? 'text-slate-300 hover:bg-slate-800/50 hover:text-emerald-400' : 'text-gray-700 hover:bg-gray-100 hover:text-green-700')}`}
                                        onClick={() => { setSortBy('newest'); setSortDropdownOpen(false); }}
                                    >
                                        Newest
                                    </li>
                                    <li
                                        className={`px-5 py-2 cursor-pointer rounded-xl transition-all duration-100 ${sortBy === 'oldest' ? (isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-green-50 text-green-700') : (isDarkMode ? 'text-slate-300 hover:bg-slate-800/50 hover:text-emerald-400' : 'text-gray-700 hover:bg-gray-100 hover:text-green-700')}`}
                                        onClick={() => { setSortBy('oldest'); setSortDropdownOpen(false); }}
                                    >
                                        Oldest
                                    </li>
                                </ul>
                            )}
                            {/* ปิด dropdown เมื่อคลิกนอก */}
                            {sortDropdownOpen && (
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setSortDropdownOpen(false)}
                                    aria-label="Close dropdown"
                                />
                            )}
                        </div>
                    </div>
                    <div className="grid gap-x-6 gap-y-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center mt-2 mb-4">
                        {/* Add New PR Card */}
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

                        {prCards.map((pr) => (
                            <div
                                key={pr.pr_no}
                                className={`relative rounded-2xl p-0 flex flex-col items-center shadow-md border w-full max-w-[270px] min-w-[180px] min-h-[320px] transition-all duration-200 hover:scale-[1.03] hover:shadow-lg cursor-pointer ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50 hover:border-emerald-500/30' : 'bg-white border-green-200 hover:border-green-400'}`}
                                onClick={() => router.push(`/services/purchase/comparePrice?${pr.id ? `id=${pr.id}` : ''}`)}
                            >
                                {/* Top: Department Icon */}
                                <div className="w-full flex justify-center pt-12 pb-2">
                                    <IoDocumentTextOutline className={`h-14 w-14 ${departmentColors[pr.pr_no] || 'text-blue-400'}`} />
                                </div>
                                {/* Status badge top right */}
                                <div className="absolute top-2 right-2 z-10">
                                    {!pr.supervisor_approved ? (
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-yellow-900/30 border-yellow-800/50 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                                            <svg className={`w-4 h-4 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l2 2 4-4" />
                                            </svg>
                                            รอหัวหน้าแผนกอนุมัติ
                                        </span>
                                    ) : !pr.manager_approved ? (
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-amber-900/30 border-amber-800/50 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                            <svg className={`w-4 h-4 ${isDarkMode ? 'text-amber-500' : 'text-amber-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l2 2 4-4" />
                                            </svg>
                                            รอผู้จัดการแผนกอนุมัติ
                                        </span>
                                    ) : !pr.pu_operator_approved ? (
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-orange-900/30 border-orange-800/50 text-orange-300' : 'bg-orange-50 border-orange-200 text-orange-700'}`}>
                                            <svg className={`w-4 h-4 ${isDarkMode ? 'text-orange-400' : 'text-orange-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l2 2 4-4" />
                                            </svg>
                                            รอแผนกจัดซื้ออนุมัติ
                                        </span>
                                    ) : (
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-green-900/30 border-green-800/50 text-green-300' : 'bg-green-50 border-green-200 text-green-700'}`}>
                                            <svg className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12l2 2 4-4" />
                                            </svg>
                                            รอดำเนินการ
                                        </span>
                                    )}
                                </div>
                                {/* Middle: Table info */}
                                <div className="w-full px-6 pt-2">
                                    <table className="w-full text-sm mb-2">
                                        <tbody>
                                            <tr><td className={`py-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>หมายเลข PR</td><td className={`text-right font-semibold py-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>{pr.pr_no}</td></tr>
                                            <tr><td className={`py-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>แผนก</td><td className={`text-right py-1 ${isDarkMode ? 'text-emerald-400' : 'text-green-700'}`}>{pr.dept_name}</td></tr>
                                            <tr><td className={`py-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>ผู้ร้องขอ</td><td className={`text-right py-1 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{pr.requester_name}</td></tr>
                                            <tr><td className={`py-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>ผู้จัดทำ</td><td className={`text-right py-1 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{pr.pu_responsible}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                                {/* Bottom: Actions */}
                                <div className="w-full px-6 pb-5 flex flex-col gap-2 items-center">
                                    <span className={`text-xs mb-1 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`}>{pr.pr_no}</span>
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
                                    <span className={`text-xs mt-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>{formatDate(pr.pr_date)} | <span className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-green-700'}`}>{pr.count_list} รายการ</span></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </div>
    );
}
