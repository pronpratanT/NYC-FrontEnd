"use client";

import Sidebar from "../../../components/sidebar";
import Header from "../../../components/header";
import PRModal from '../../../components/Modal/PRModal';
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useToken } from "../../../context/TokenContext";
import { useTheme } from "../../../components/ThemeProvider";
import { IoIosCheckmark } from "react-icons/io";
import { FaXmark } from "react-icons/fa6";

type Part = {
    pr_list_id: number;
    part_no: string;
    part_name: string;
    qty: number;
    unit: string;
    stock: number;
    vendor: string;
    price_per_unit: number;
    ordered: boolean;
};

// เปลี่ยน type PRs เป็น object
type PRs = {
    pr_id: number;
    pr_no: string;
    pr_date: string;
    dept_name: string;
    dept_short: string;
    dept_id: number;
    manager_approve: boolean;
    supervisor_approve: boolean;
    pu_operator_approve: boolean;
    count_ordered: number;
    pr_lists: Part[];
};

function ComparePriceContent({ token }: { token: string | null }) {
    const { isDarkMode } = useTheme();
    const searchParams = useSearchParams();
    const prId = searchParams.get("id");
    const router = useRouter();

    // const selectedPR = prList.find(pr => pr.code === prCode);
    // const selectedParts = selectedPR?.parts || [];

    // const [modalOpen, setModalOpen] = useState(false);
    // const [modalPart, setModalPart] = useState<Part | null>(null);
    const [prData, setPrData] = useState<PRs | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedPartNo, setSelectedPartNo] = useState<string>("");
    const [selectedPart, setSelectedPart] = useState<Part | null>(null);

        // Pagination
        const [page, setPage] = useState(1);
        const rowsPerPage = 10;
        const totalRows = prData?.pr_lists?.length || 0;
        const totalPages = Math.ceil(totalRows / rowsPerPage);
        const pagedParts = prData?.pr_lists?.slice((page - 1) * rowsPerPage, page * rowsPerPage) || [];

    const handleItemClick = (part: Part) => {
        setSelectedPartNo(part.part_no);
        setSelectedPart(part);
        setModalOpen(true);
        console.log("Selected part_no:", part.part_no);
        console.log("Selected part data:", part);
        console.log("PR Data:", prData);
    };

    useEffect(() => {
        if (!prId) {
            setError("ไม่พบ PR ID");
            setLoading(false);
            return;
        }
        const fetchData = async () => {
            try {
                setError("");
                setLoading(true);
                if (!token) throw new Error("กรุณาเข้าสู่ระบบก่อน");
                // fetch ข้อมูล PR พร้อม header Authorization
                const response = await fetch(`/api/purchase/pr/request/list?pr_id=${prId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("PRID: ", prId);
                console.log("Response status:", response.status);
                if (!response.ok) throw new Error("โหลดข้อมูล PR ไม่สำเร็จ");
                const data = await response.json();
                setPrData(data.data);
                console.log("Fetched PR Data: ", data.data);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message || "เกิดข้อผิดพลาด");
                } else {
                    setError("เกิดข้อผิดพลาด");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [prId, token]);

    const handleApprove = async () => {
        if (!prId) {
            setError("ไม่พบ PR ID");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pr/approve/${prId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`);
            }
            setError("");
            window.alert("อนุมัติสำเร็จ");
            router.push("/services/purchase");
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message || "เกิดข้อผิดพลาด");
            } else {
                setError("เกิดข้อผิดพลาด");
            }
        } finally {
            setLoading(false);
        }
    }

    if (loading) return <div>กำลังโหลดข้อมูล...</div>;
    if (error) return <div style={{ color: "red" }}>{error}</div>;

    return (
        <div className="min-h-screen">
            <Sidebar />
            <Header />
            <main
                className="mt-[7.5rem] mr-6 transition-all duration-300"
                style={{ minHeight: 'calc(100vh - 3rem)', position: 'relative', marginLeft: 'calc(18rem + 55px)' }}
            >
                {/* Stepper */}
                {/* <div className="px-8 pt-8 pb-2">
                    <ol className="flex items-center w-full text-sm font-medium text-center sm:text-base">

                        <li className="flex items-center gap-2">
                            <span className={`flex items-center justify-center w-7 h-7 rounded-full border-2 ${prData ? `bg-green-100 border-green-500 text-green-700 ${isDarkMode ? 'dark:bg-green-900 dark:border-green-400 dark:text-green-300' : ''}` : `bg-gray-100 border-gray-300 text-gray-400 ${isDarkMode ? 'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400' : ''}`}`}>
                                {prData ? (
                                    <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                        <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 10l4 4 6-8" />
                                    </svg>
                                ) : (
                                    <span className="font-bold">1</span>
                                )}
                            </span>
                            <span className={`ml-2 ${prData ? `text-green-700 font-semibold ${isDarkMode ? 'dark:text-green-300' : ''}` : `text-gray-400 font-medium ${isDarkMode ? 'dark:text-gray-400' : ''}`}`}>Select PR</span>
                        </li>
                        <span className={`flex-1 h-1 mx-4 block ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></span>

                        <li className="flex items-center gap-2">
                            <span className={`flex items-center justify-center w-7 h-7 rounded-full border-2 bg-gray-100 border-gray-300 text-gray-400 ${isDarkMode ? 'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400' : ''}`}>
                                <span className="font-bold">2</span>
                            </span>
                            <span className={`ml-2 text-gray-400 font-medium ${isDarkMode ? 'dark:text-gray-400' : ''}`}>Compare Price</span>
                        </li>
                        <span className={`flex-1 h-1 mx-4 block ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></span>

                        <li className="flex items-center gap-2">
                            <span className={`flex items-center justify-center w-7 h-7 rounded-full border-2 bg-gray-100 border-gray-300 text-gray-400 ${isDarkMode ? 'dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400' : ''}`}>
                                <span className="font-bold">3</span>
                            </span>
                            <span className={`ml-2 text-gray-400 font-medium ${isDarkMode ? 'dark:text-gray-400' : ''}`}>Confirmation</span>
                        </li>
                    </ol>
                </div> */}

                {/* Content: Show PR info and table only if prData exists */}
                {prData ? (
                    <div className="max-w-none w-full space-y-8 mb-2">
                        {/* Modern PR Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* PR CARD */}
                            <div className={`rounded-2xl p-6 shadow-sm border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center gap-3 mb-2 justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>หมายเลข PR</span>
                                    </div>
                                    {/* Approve / Reject Buttons */}
                                    {!(prData?.manager_approve && prData?.supervisor_approve && prData?.pu_operator_approve) && (
                                        <div className="flex items-center gap-2 relative">
                                            <div className="flex items-center">
                                                <button
                                                    type="button"
                                                    className="bg-green-400 hover:bg-green-700 text-white font-semibold w-10 h-10 rounded-lg shadow transition-all duration-200 flex items-center justify-center cursor-pointer group relative overflow-hidden approve-btn"
                                                    onClick={() => handleApprove()}
                                                    style={{ width: '40px', height: '40px', zIndex: 2 }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.width = '112px';
                                                        const rejectBtn = e.currentTarget.parentElement?.querySelector('.reject-btn');
                                                        if (rejectBtn && rejectBtn instanceof HTMLElement) rejectBtn.style.opacity = '0';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.width = '40px';
                                                        const rejectBtn = e.currentTarget.parentElement?.querySelector('.reject-btn');
                                                        if (rejectBtn && rejectBtn instanceof HTMLElement) rejectBtn.style.opacity = '1';
                                                    }}
                                                >
                                                    <span className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center w-full h-full transition-opacity duration-200 group-hover:opacity-0">
                                                        <IoIosCheckmark size={40} />
                                                    </span>
                                                    <span className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center w-full h-full opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-base font-bold tracking-wide">
                                                        Approve
                                                    </span>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="bg-red-400 hover:bg-red-700 text-white font-semibold w-10 h-10 rounded-lg shadow transition-all duration-200 flex items-center justify-center cursor-pointer group relative overflow-hidden reject-btn"
                                                    onClick={() => alert('ปฏิเสธ PR นี้')}
                                                    style={{ width: '40px', height: '40px', marginLeft: '8px', zIndex: 1 }}
                                                    onMouseEnter={e => {
                                                        e.currentTarget.style.width = '112px';
                                                        const approveBtn = e.currentTarget.parentElement?.querySelector('.approve-btn');
                                                        if (approveBtn && approveBtn instanceof HTMLElement) approveBtn.style.opacity = '0';
                                                    }}
                                                    onMouseLeave={e => {
                                                        e.currentTarget.style.width = '40px';
                                                        const approveBtn = e.currentTarget.parentElement?.querySelector('.approve-btn');
                                                        if (approveBtn && approveBtn instanceof HTMLElement) approveBtn.style.opacity = '1';
                                                    }}
                                                >
                                                    <span className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center w-full h-full transition-opacity duration-200 group-hover:opacity-0">
                                                        <FaXmark size={20} />
                                                    </span>
                                                    <span className="absolute left-0 right-0 top-0 bottom-0 flex items-center justify-center w-full h-full opacity-0 transition-opacity duration-200 group-hover:opacity-100 text-base font-bold tracking-wide">
                                                        Reject
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{prData.pr_no}</div>
                                <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                    สถานะ : {' '}
                                    {!prData.supervisor_approve && (
                                        <span className={`font-semibold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>รอหัวหน้าแผนกอนุมัติ</span>
                                    )}
                                    {prData.supervisor_approve && !prData.manager_approve && (
                                        <span className={`font-semibold ${isDarkMode ? 'text-orange-300' : 'text-orange-500'}`}>รอผู้จัดการแผนกอนุมัติ</span>
                                    )}
                                    {prData.supervisor_approve && prData.manager_approve && !prData.pu_operator_approve && (
                                        <span className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>รอแผนกจัดซื้ออนุมัติ</span>
                                    )}
                                    {prData.supervisor_approve && prData.manager_approve && prData.pu_operator_approve && (
                                        <span className={`font-semibold ${isDarkMode ? 'text-green-300' : 'text-green-600'}`}>รอดำเนินการ</span>
                                    )}
                                </div>
                            </div>
                            {/* Department CARD */}
                            <div className={`rounded-2xl p-6 shadow-sm border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-emerald-900/30' : 'bg-green-100'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isDarkMode ? 'text-emerald-400' : 'text-green-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v4a1 1 0 001 1h3m10-5h-3a1 1 0 00-1 1v4a1 1 0 001 1h3m-10 4h10" />
                                        </svg>
                                    </div>
                                    <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>แผนก/หน่วยงาน</span>
                                </div>
                                <div className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{prData.dept_name}</div>
                                <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>รหัสแผนก : {prData.dept_short}</div>
                            </div>
                            {/* Date CARD */}
                            <div className={`rounded-2xl p-6 shadow-sm border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>วันที่ทำ PR</span>
                                </div>
                                <div className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{new Date(prData.pr_date).toLocaleDateString('th-TH')}</div>
                                <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>เวลา: {new Date(prData.pr_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        </div>
                        {/* Part No Input and Table */}
                        <div className={`rounded-3xl shadow border overflow-visible ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-green-100'}`}>
                            <div className={`px-8 pt-6 pb-4 flex items-center justify-between rounded-t-3xl overflow-visible ${isDarkMode ? 'bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50' : 'bg-gradient-to-r from-green-50 via-white to-green-100'}`}>
                                <div className="flex items-center gap-3">
                                                <span className={`text-xl font-bold ${isDarkMode ? 'text-emerald-400' : 'text-green-700'}`}>Purchase Requisition</span>
                                                <span className={`text-sm px-3 py-1 rounded-full shadow-sm border ${isDarkMode ? 'text-emerald-300 bg-emerald-900/30 border-emerald-600/30' : 'text-green-700 bg-green-50 border-green-200'}`}>
                                                    อนุมัติ {prData.count_ordered} / {prData.pr_lists?.length ?? 0} รายการ
                                                </span>
                                </div>
                                <button
                                    type="button"
                                    className={`rounded-lg px-6 py-2 font-semibold border focus:outline-none transition-colors duration-150 cursor-pointer hover:shadow ${isDarkMode ? 'text-emerald-400 bg-slate-800 border-emerald-600/30 hover:bg-slate-700' : 'text-green-700 bg-white border-green-300 hover:bg-green-50'}`}
                                    onClick={() => router.push("/services/purchase")}
                                >
                                    เลือก PR ใหม่
                                </button>
                            </div>
                            <div className="overflow-visible">
                                <table className="min-w-full text-sm overflow-visible">
                                    <thead className={isDarkMode ? 'bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50' : 'bg-gradient-to-r from-green-50 via-white to-green-100'}>
                                        <tr>
                                            {prData.supervisor_approve && prData.manager_approve && prData.pu_operator_approve && (
                                                <th className={`px-2 py-3 text-center font-semibold w-20 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Status</th>
                                            )}
                                            <th className={`px-2 py-3 text-center font-semibold w-12 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Item</th>
                                            <th className={`px-2 py-3 text-center font-semibold w-32 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Part No.</th>
                                            <th className={`px-2 py-3 text-center font-semibold w-64 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Part Name</th>
                                            <th className={`px-2 py-3 text-center font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>QTY</th>
                                            <th className={`px-2 py-3 text-center font-semibold w-20 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>UNIT</th>
                                            <th className={`px-2 py-3 text-center font-semibold w-24 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Vendor</th>
                                            <th className={`px-2 py-3 text-center font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Stock</th>
                                            <th className={`px-2 py-3 text-center font-semibold w-24 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Price/Unit</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y transition-all duration-150 ${isDarkMode ? 'bg-slate-900/50 divide-slate-700/50 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50' : 'bg-white divide-green-100 bg-gradient-to-r from-green-50 via-white to-green-100'}`}>
                                        {pagedParts.map((part, idx) => (
                                            <tr key={part.part_no + '-row-' + ((page - 1) * rowsPerPage + idx)} className={`transition-all duration-150 cursor-pointer ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-green-50'}`} onClick={() => handleItemClick(part)}>
                                                {prData.supervisor_approve && prData.manager_approve && prData.pu_operator_approve && (
                                                    <td className={`px-2 py-3 text-center w-20`}>
                                                        <div className="flex items-center justify-center">
                                                            {part.ordered ? (
                                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700/50">
                                                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                                                    <span className="text-xs font-medium text-green-700 dark:text-green-300">approved</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700/50">
                                                                    <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                                                                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">waiting</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                )}
                                                <td className={`px-2 py-3 text-center w-12 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{(page - 1) * rowsPerPage + idx + 1}</td>
                                                <td className={`px-2 py-3 font-medium w-32 text-left ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{part.part_no}</td>
                                                <td className={`px-2 py-3 w-64 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.part_name}</td>
                                                <td className={`px-2 py-3 w-16 text-center ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.qty}</td>
                                                <td className={`px-2 py-3 w-20 text-center ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.unit}</td>
                                                <td className={`px-2 py-3 w-24 text-center ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.vendor}</td>
                                                <td className={`px-2 py-3 w-16 text-center ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.stock}</td>
                                                <td className={`px-2 py-3 w-24 text-right pr-15 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.price_per_unit}</td>
                                            </tr>
                                        ))}
                                        {/* Pagination row */}
                                        {totalRows > rowsPerPage && (
                                            <tr>
                                                <td colSpan={prData.supervisor_approve && prData.manager_approve && prData.pu_operator_approve ? 9 : 8} className={`px-4 py-4 text-center border-t ${isDarkMode ? 'bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50 border-slate-700' : 'bg-gradient-to-r from-green-50 via-white to-green-100 border-green-100'}`}>
                                                    <div className="inline-flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            className={`px-3 py-1 rounded-lg border transition-all duration-150 ${isDarkMode ? 'border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700/50' : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'} ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            onClick={() => page > 1 && setPage(page - 1)}
                                                            disabled={page === 1}
                                                        >ก่อนหน้า</button>
                                                        <span className={`mx-2 font-medium ${isDarkMode ? 'text-slate-200' : 'text-green-700'}`}>หน้า {page} / {totalPages}</span>
                                                        <button
                                                            type="button"
                                                            className={`px-3 py-1 rounded-lg border transition-all duration-150 ${isDarkMode ? 'border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700/50' : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'} ${page === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            onClick={() => page < totalPages && setPage(page + 1)}
                                                            disabled={page === totalPages}
                                                        >ถัดไป</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Extra space at the bottom */}
                            <div className={`pb-6 rounded-b-3xl ${isDarkMode ? 'bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50' : 'bg-gradient-to-r from-green-50 via-white to-green-100'}`}></div>
                        </div>

                        {/* PRModal for price comparison */}
                        {modalOpen && selectedPartNo && selectedPart && prData && (
                            <PRModal
                                partNo={selectedPartNo}
                                prNumber={prData.pr_no}
                                department={prData.dept_name}
                                prDate={prData.pr_date}
                                qty={selectedPart.qty}
                                unit={selectedPart.unit}
                                pr_list_id={selectedPart.pr_list_id}
                                onClose={() => setModalOpen(false)}
                            />
                        )}
                    </div>
                ) : (
                    <div className={`p-8 text-center ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>กรุณาเลือก PR จากหน้าแรก</div>
                )}
            </main>
        </div>
    );
}

export default function ComparePricePage() {
    const token = useToken();
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ComparePriceContent token={token} />
        </Suspense>
    );
}
