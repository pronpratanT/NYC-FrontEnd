"use client";

import RejectPRModal from '../../../components/Modal/Reject_PR';
import ApprovePRModal from '../../../components/Modal/Approve_PR';
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

import { useToken } from "../../../context/TokenContext";
import { useTheme } from "../../../components/ThemeProvider";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "../../../components/sidebar";
import Header from "../../../components/header";
import PRModal from '../../../components/Modal/PRModal';

import { BsCalendar2Event } from "react-icons/bs";
import { MdOutlineGroups3 } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import { FaXmark } from "react-icons/fa6";
import { IoIosCheckmark } from "react-icons/io";
import { FaRegClock } from "react-icons/fa6";

type Part = {
    pcl_id: number;
    pr_list_id: number;
    part_no: string;
    prod_code: string;
    part_name: string;
    qty: number;
    unit: string;
    stock: number;
    objective: string;
    plant: string;
    vendor: string;
    price_per_unit: number;
    ordered: string;
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
    supervisor_reject_at: string | null;
    manager_reject_at: string | null;
    pu_operator_reject_at: string | null;
    reason_reject: string | null;
    count_ordered: number;
    pr_lists: Part[];
};

function ComparePriceContent({ token }: { token: string | null }) {
    const { isDarkMode } = useTheme();
    // Assume user info is available from context or prop
    // You may need to adjust this to your actual user context
    const { user } = useUser();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const departmentId = user?.Department?.ID;

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
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectPrNo, setRejectPrNo] = useState<string | null>(null);
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [approvePrNo, setApprovePrNo] = useState<string | null>(null);
    const [selectedParts, setSelectedParts] = useState<number[]>([]);
    const [multiApprovalModalOpen, setMultiApprovalModalOpen] = useState(false);

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

    // Check if any parts have "Compared" status
    const hasComparedParts = prData?.pr_lists?.some(part => part.ordered === 'Compared') || false;

    // Handle checkbox selection
    const handlePartSelection = (pclId: number, checked: boolean) => {
        if (checked) {
            setSelectedParts(prev => [...prev, pclId]);
        } else {
            setSelectedParts(prev => prev.filter(id => id !== pclId));
        }
    };

    // Handle select all checkbox
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            const comparedParts = prData?.pr_lists?.filter(part => part.ordered === 'Compared').map(part => part.pcl_id) || [];
            setSelectedParts(comparedParts);
        } else {
            setSelectedParts([]);
        }
    };

    // Function to refresh data after PO creation
    const handleRefreshData = async () => {
        if (!prId || !token) return;

        try {
            setError("");
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pr/request/list?pr_id=${prId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("โหลดข้อมูล PR ไม่สำเร็จ");
            const data = await response.json();
            setPrData(data.data);
            // Reset selections when data refreshes
            setSelectedParts([]);
            console.log("Refreshed PR Data:", data.data);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || "เกิดข้อผิดพลาด");
            } else {
                setError("เกิดข้อผิดพลาด");
            }
        }
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
                const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pr/request/list?pr_id=${prId}`, {
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

    const handleApproveClick = () => {
        setApprovePrNo(prData?.pr_no ?? null);
        setApproveModalOpen(true);
    };

    const handleReject = () => {
        setRejectPrNo(prData?.pr_no ?? null);
        setRejectModalOpen(true);
    };

    const handleConfirmReject = async (reason: string | null | undefined) => {
        if (!prId) {
            setError("ไม่พบ PR No");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pr/reject/${prId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ reason: reason || "" })
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `HTTP ${response.status}`);
            }
            setError("");
            window.alert("ปฏิเสธสำเร็จ");
            router.push("/services/purchase");
        } catch (err) {
            if (err instanceof Error) {
                setError(err.message || "เกิดข้อผิดพลาด");
            } else {
                setError("เกิดข้อผิดพลาด");
            }
        } finally {
            setLoading(false);
            setRejectModalOpen(false);
            setRejectPrNo(null);
        }
    };

    const handleMultiApprove = async () => {
        if (!selectedParts || selectedParts.length === 0) {
            alert('กรุณาเลือกรายการที่ต้องการอนุมัติ');
            return;
        }
        // Log selected part_no and pcl_id
        // if (prData?.pr_lists) {
        //     const selectedInfo = prData.pr_lists
        //         .filter(part => selectedParts.includes(part.pcl_id))
        //         .map(part => `part_no: ${part.part_no}, pcl_id: ${part.pcl_id}`);
        //     console.log('Selected for multi-approve:', selectedInfo);
        // }
        let successCount = 0;
        let errorCount = 0;
        const errorDetails: string[] = [];
        for (const pcl_id of selectedParts) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/approve-pcl?id=${pcl_id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                });
                if (res.ok) {
                    successCount++;
                } else {
                    errorCount++;
                    const errorText = await res.text();
                    errorDetails.push(`ID ${pcl_id}: ${errorText || 'Unknown error'}`);
                }
            } catch (err) {
                errorCount++;
                errorDetails.push(`ID ${pcl_id}: ${err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล'}`);
            }
        }
        let message = `อนุมัติสำเร็จ ${successCount} รายการ`;
        if (errorCount > 0) {
            message += `, ล้มเหลว ${errorCount} รายการ\nรายละเอียด:\n${errorDetails.join('\n')}`;
        }
        alert(message);
        setMultiApprovalModalOpen(false);
        await handleRefreshData();
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
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                                                <IoDocumentTextOutline className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                                            </div>
                                        </div>
                                        <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>หมายเลข PR</span>
                                    </div>
                                    {/* Approve / Reject Buttons */}
                                    {!(prData?.manager_approve && prData?.supervisor_approve && prData?.pu_operator_approve)
                                        && !(prData?.supervisor_reject_at || prData?.manager_reject_at || prData?.pu_operator_reject_at)
                                        && (!(prData?.manager_approve && prData?.supervisor_approve) || departmentId === 10086) && (
                                        <div className="flex items-center gap-2 relative">
                                            <div className="flex items-center">
                                                <button
                                                    type="button"
                                                    className="bg-green-400 hover:bg-green-700 text-white font-semibold w-10 h-10 rounded-lg shadow transition-all duration-200 flex items-center justify-center cursor-pointer group relative overflow-hidden approve-btn"
                                                    onClick={() => handleApproveClick()}
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
                                                    onClick={handleReject}
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
                                    {prData.supervisor_reject_at || prData.manager_reject_at || prData.pu_operator_reject_at ? (
                                        // Red - ปฏิเสธ (Rejected)
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-xs border shadow-sm ${isDarkMode ? 'bg-red-900/30 border-red-700/50 text-red-300' : 'bg-red-50 border-red-300 text-red-800'}`}>
                                            <svg className={`w-3 h-3 ${isDarkMode ? 'text-red-300' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            {prData.supervisor_reject_at ? 'หัวหน้าแผนกปฏิเสธ' : prData.manager_reject_at ? 'ผู้จัดการแผนกปฏิเสธ' : prData.pu_operator_reject_at ? 'แผนกจัดซื้อปฏิเสธ' : 'ปฏิเสธ'}
                                        </span>
                                    ) : !prData.supervisor_approve ? (
                                        // Blue - รอหัวหน้าแผนกอนุมัติ
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-xs border shadow-sm ${isDarkMode ? 'bg-blue-900/30 border-blue-700/50 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-800'}`}>
                                            <FaRegClock className={`w-3.5 h-3.5 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                                            รอหัวหน้าแผนกอนุมัติ
                                        </span>
                                    ) : !prData.manager_approve ? (
                                        // Purple - รอผู้จัดการแผนกอนุมัติ
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-xs border shadow-sm ${isDarkMode ? 'bg-purple-900/30 border-purple-700/50 text-purple-300' : 'bg-purple-50 border-purple-300 text-purple-800'}`}>
                                            <FaRegClock className={`w-3.5 h-3.5 ${isDarkMode ? 'text-purple-300' : 'text-purple-500'}`} />
                                            รอผู้จัดการแผนกอนุมัติ
                                        </span>
                                    ) : !prData.pu_operator_approve ? (
                                        // Orange - รอแผนกจัดซื้ออนุมัติ
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-xs border shadow-sm ${isDarkMode ? 'bg-orange-900/30 border-orange-700/50 text-orange-300' : 'bg-orange-50 border-orange-300 text-orange-800'}`}>
                                            <FaRegClock className={`w-3.5 h-3.5 ${isDarkMode ? 'text-orange-300 text-bold' : 'text-orange-500'}`} />
                                            รอแผนกจัดซื้ออนุมัติ
                                        </span>
                                    ) : prData.count_ordered === (prData.pr_lists?.length ?? 0) ? (
                                        // Green - Complete (เสร็จสมบูรณ์)
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-xs border shadow-sm ${isDarkMode ? 'bg-green-900/30 border-green-700/50 text-green-300' : 'bg-green-50 border-green-500 text-green-900'}`}>
                                            <svg className={`w-3 h-3 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            เสร็จสมบูรณ์
                                        </span>
                                    ) : (
                                        // Yellow/Amber - รอดำเนินการ
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-xs border shadow-sm ${isDarkMode ? 'bg-yellow-900/30 border-yellow-700/50 text-yellow-300' : 'bg-yellow-50 border-yellow-400 text-yellow-800'}`}>
                                            <FaRegClock className={`w-3.5 h-3.5 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`} />
                                            รอดำเนินการ
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* Department CARD */}
                            <div className={`rounded-2xl p-6 shadow-sm border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-emerald-900/30' : 'bg-green-100'}`}>
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-emerald-900/30' : 'bg-green-100'}`}>
                                            <MdOutlineGroups3 className={`h-6 w-6 ${isDarkMode ? 'text-emerald-400' : 'text-green-500'}`} />
                                        </div>
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
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                                            <BsCalendar2Event className={`h-6 w-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                                        </div>
                                    </div>
                                    <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>วันที่ทำ PR</span>
                                </div>
                                <div className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{new Date(prData.pr_date).toLocaleDateString('th-TH')}</div>
                                <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>เวลา: {new Date(prData.pr_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        </div>
                        {/* Part No Input and Table */}
                        <div className={`rounded-3xl shadow border overflow-visible ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-green-100'}`}>
                            <div className={`px-8 pt-6 pb-4 rounded-t-3xl overflow-visible ${isDarkMode ? 'bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50' : 'bg-gradient-to-r from-green-50 via-white to-green-100'}`}>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className={`text-xl font-bold ${isDarkMode ? 'text-emerald-400' : 'text-green-700'}`}>Purchase Requisition</span>
                                            <span className={`text-sm px-3 py-1 rounded-full shadow-sm border ${isDarkMode ? 'text-emerald-300 bg-emerald-900/30 border-emerald-600/30' : 'text-green-700 bg-green-50 border-green-200'}`}>
                                                {prData.supervisor_reject_at || prData.manager_reject_at || prData.pu_operator_reject_at
                                                    ? `${prData.pr_lists?.length ?? 0} รายการ`
                                                    : `ดำเนินการ ${prData.count_ordered} / ${prData.pr_lists?.length ?? 0} รายการ`
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {/* Multi Approval Button - Show only when parts are selected */}
                                            {selectedParts.length > 0 && (
                                                <button
                                                    type="button"
                                                    className={`rounded-lg px-6 py-2 font-semibold border focus:outline-none transition-colors duration-150 cursor-pointer hover:shadow ${isDarkMode ? 'text-sky-400 bg-sky-900/30 border-sky-600/30 hover:bg-sky-800/50' : 'text-sky-700 bg-sky-50 border-sky-300 hover:bg-sky-100'}`}
                                                    onClick={() => setMultiApprovalModalOpen(true)}
                                                >
                                                    อนุมัติหลายรายการ ({selectedParts.length})
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className={`rounded-lg px-6 py-2 font-semibold border focus:outline-none transition-colors duration-150 cursor-pointer hover:shadow ${isDarkMode ? 'text-emerald-400 bg-slate-800 border-emerald-600/30 hover:bg-slate-700' : 'text-green-700 bg-white border-green-300 hover:bg-green-50'}`}
                                                onClick={() => router.push("/services/purchase")}
                                            >
                                                เลือก PR ใหม่
                                            </button>
                                        </div>
                                    </div>

                                    {/* แสดงเหตุผลการปฏิเสธในส่วนหัวตาราง */}
                                    {(prData.supervisor_reject_at || prData.manager_reject_at || prData.pu_operator_reject_at) && prData.reason_reject && (
                                        <div className={`px-4 py-3 rounded-lg border ${isDarkMode ? 'bg-red-900/30 border-red-800/50 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                            <div className="flex items-start gap-2">
                                                <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div>
                                                    <span className={`font-semibold ${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>เหตุผลในการปฏิเสธ : </span>
                                                    <span className={isDarkMode ? 'text-red-300' : 'text-red-700'}>{prData.reason_reject}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="overflow-visible">
                                <table className="min-w-full text-sm overflow-visible">
                                    <thead className={isDarkMode ? 'bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50' : 'bg-gradient-to-r from-green-50 via-white to-green-100'}>
                                        <tr>
                                            {hasComparedParts && (
                                                <th className={`px-2 py-3 text-center font-semibold w-12 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                                    <input
                                                        type="checkbox"
                                                        className={`w-4 h-4 rounded border-2 transition-all duration-200 cursor-pointer ${isDarkMode
                                                            ? 'border-slate-500 bg-slate-700 text-sky-400 focus:ring-2 focus:ring-sky-400/50 checked:bg-sky-500 checked:border-sky-500'
                                                            : 'border-gray-300 bg-white text-sky-600 focus:ring-2 focus:ring-sky-500/50 checked:bg-sky-600 checked:border-sky-600'
                                                            }`}
                                                        checked={
                                                            prData?.pr_lists?.filter(part => part.ordered === 'Compared').length > 0 &&
                                                            prData?.pr_lists?.filter(part => part.ordered === 'Compared').every(part => selectedParts.includes(part.pcl_id))
                                                        }
                                                        onChange={(e) => handleSelectAll(e.target.checked)}
                                                    />
                                                </th>
                                            )}
                                            {prData.supervisor_approve && prData.manager_approve && prData.pu_operator_approve && (
                                                <th className={`px-2 py-3 text-center font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Status</th>
                                            )}
                                            <th className={`px-2 py-3 text-center font-semibold w-12 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Item</th>
                                            <th className={`px-2 py-3 text-left font-semibold w-32 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Part No.</th>
                                            <th className={`px-2 py-3 text-left font-semibold w-32 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Prod Code</th>
                                            <th className={`px-2 py-3 text-left font-semibold w-64 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Part Name</th>
                                            <th className={`px-2 py-3 text-left font-semibold w-32 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Objective</th>
                                            <th className={`px-2 py-3 text-center font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>QTY</th>
                                            <th className={`px-2 py-3 text-center font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>UNIT</th>
                                            {departmentId === 10086 && (
                                                <th className={`px-2 py-3 text-center font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Vendor</th>
                                            )}
                                            <th className={`px-2 py-3 text-center font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Stock</th>
                                            {departmentId === 10086 && (
                                                <th className={`px-2 py-3 text-right font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Price/Unit</th>
                                            )}
                                            <th className={`px-2 py-3 text-center font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Plant</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y transition-all duration-150 ${isDarkMode ? 'bg-slate-900/50 divide-slate-700/50 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50' : 'bg-white divide-green-100 bg-gradient-to-r from-green-50 via-white to-green-100'}`}>
                                        {pagedParts.map((part, idx) => (
                                            <tr key={part.part_no + '-row-' + ((page - 1) * rowsPerPage + idx)}
                                                className={`transition-all duration-150 ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-green-50'} ${!(prData.manager_approve && prData.supervisor_approve && user?.Department?.ID === 10086) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                                                onClick={() => {
                                                    if (prData.manager_approve && prData.supervisor_approve && user?.Department?.ID === 10086) {
                                                        handleItemClick(part);
                                                    }
                                                }}
                                            >
                                                {hasComparedParts && (
                                                    <td className={`px-2 py-3 text-center w-12`}>
                                                        <input
                                                            type="checkbox"
                                                            className={`w-4 h-4 rounded border-2 transition-all duration-200 ${part.ordered !== 'Compared'
                                                                ? 'cursor-not-allowed opacity-40 border-gray-300 bg-gray-100'
                                                                : isDarkMode
                                                                    ? 'cursor-pointer border-slate-500 bg-slate-700 text-blue-400 focus:ring-2 focus:ring-blue-400/50 checked:bg-blue-500 checked:border-blue-500 hover:border-blue-400'
                                                                    : 'cursor-pointer border-gray-300 bg-white text-blue-600 focus:ring-2 focus:ring-blue-500/50 checked:bg-blue-600 checked:border-blue-600 hover:border-blue-400'
                                                                }`}
                                                            disabled={part.ordered !== 'Compared'}
                                                            checked={selectedParts.includes(part.pcl_id)}
                                                            onChange={(e) => {
                                                                e.stopPropagation();
                                                                handlePartSelection(part.pcl_id, e.target.checked);
                                                            }}
                                                        />
                                                    </td>
                                                )}
                                                {prData.supervisor_approve && prData.manager_approve && prData.pu_operator_approve && (
                                                    <td className={`px-2 py-3 text-center w-16`}>
                                                        <div className="flex items-center justify-center">
                                                            {(() => {
                                                                switch (part.ordered) {
                                                                    case 'pending':
                                                                        return (
                                                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border min-w-[80px] justify-center bg-gradient-to-r ${isDarkMode ? 'from-yellow-900/60 via-yellow-800/50 to-yellow-900/60 border-yellow-700/60' : 'from-yellow-50 via-yellow-100 to-yellow-50 border-yellow-300'}`}>
                                                                                <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-yellow-400' : 'bg-yellow-500'}`}></div>
                                                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>waiting</span>
                                                                            </div>
                                                                        );
                                                                    case 'Compared':
                                                                        return (
                                                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border min-w-[80px] justify-center bg-gradient-to-r ${isDarkMode ? 'from-blue-900/60 via-blue-800/50 to-blue-900/60 border-blue-700/60' : 'from-blue-50 via-blue-100 to-blue-50 border-blue-300'}`}>
                                                                                <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                                                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>compared</span>
                                                                            </div>
                                                                        );
                                                                    case 'Approved':
                                                                        return (
                                                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border min-w-[80px] justify-center bg-gradient-to-r ${isDarkMode ? 'from-green-900/60 via-green-800/50 to-green-900/60 border-green-700/60' : 'from-green-50 via-green-100 to-green-50 border-green-300'}`}>
                                                                                <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-green-400' : 'bg-green-500'}`}></div>
                                                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>approved</span>
                                                                            </div>
                                                                        );
                                                                    case 'Rejected':
                                                                        return (
                                                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border min-w-[80px] justify-center bg-gradient-to-r ${isDarkMode ? 'from-red-900/60 via-red-800/50 to-red-900/60 border-red-700/60' : 'from-red-50 via-red-100 to-red-50 border-red-300'}`}>
                                                                                <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-red-400' : 'bg-red-500'}`}></div>
                                                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>rejected</span>
                                                                            </div>
                                                                        );
                                                                    case 'PO Created':
                                                                        return (
                                                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border min-w-[80px] justify-center bg-gradient-to-r ${isDarkMode ? 'from-teal-900/60 via-teal-800/50 to-teal-900/60 border-teal-700/60' : 'from-teal-50 via-teal-100 to-teal-50 border-teal-300'}`}>
                                                                                <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-teal-400' : 'bg-teal-500'}`}></div>
                                                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-teal-300' : 'text-teal-700'}`}>po created</span>
                                                                            </div>
                                                                        );
                                                                    case 'Po Approved':
                                                                        return (
                                                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border min-w-[80px] justify-center bg-gradient-to-r ${isDarkMode ? 'from-purple-900/60 via-purple-800/50 to-purple-900/60 border-purple-700/60' : 'from-purple-50 via-purple-100 to-purple-50 border-purple-300'}`}>
                                                                                <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-purple-400' : 'bg-purple-500'}`}></div>
                                                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>po approved</span>
                                                                            </div>
                                                                        );
                                                                    case 'Po Rejected':
                                                                        return (
                                                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border min-w-[80px] justify-center bg-gradient-to-r ${isDarkMode ? 'from-red-900/60 via-red-800/50 to-red-900/60 border-red-700/60' : 'from-red-50 via-red-100 to-red-50 border-red-300'}`}>
                                                                                <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-red-400' : 'bg-red-500'}`}></div>
                                                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-red-300' : 'text-red-700'}`}>po rejected</span>
                                                                            </div>
                                                                        );
                                                                    default:
                                                                        return (
                                                                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border min-w-[80px] justify-center bg-gradient-to-r ${isDarkMode ? 'from-gray-900/50 via-gray-800/40 to-gray-900/50 border-gray-700/50' : 'from-gray-50 via-gray-100 to-gray-50 border-gray-300'}`}>
                                                                                <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-gray-400' : 'bg-gray-500'}`}></div>
                                                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{part.ordered || '-'}</span>
                                                                            </div>
                                                                        );
                                                                }
                                                            })()}
                                                        </div>
                                                    </td>
                                                )}
                                                <td className={`px-2 py-3 text-center w-12 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{(page - 1) * rowsPerPage + idx + 1}</td>
                                                <td className={`px-2 py-3 font-medium w-32 text-left ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{part.part_no}</td>
                                                <td className={`px-2 py-3 font-medium w-32 text-left ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{part.prod_code}</td>
                                                <td className={`px-2 py-3 w-64 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.part_name}</td>
                                                <td className={`px-2 py-3 w-32 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.objective}</td>
                                                <td className={`px-2 py-3 w-16 text-center ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.qty}</td>
                                                <td className={`px-2 py-3 w-16 text-center ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.unit}</td>
                                                {departmentId === 10086 && (
                                                    <td className={`px-2 py-3 w-16 text-center ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.vendor}</td>
                                                )}
                                                <td className={`px-2 py-3 w-16 text-center ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.stock}</td>
                                                {departmentId === 10086 && (
                                                    <td className={`px-2 py-3 w-16 text-right ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.price_per_unit}</td>
                                                )}
                                                <td className={`px-2 py-3 w-16 text-center ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.plant}</td>
                                            </tr>
                                        ))}
                                        {/* Pagination row */}
                                        {totalRows > rowsPerPage && (
                                            <tr>
                                                <td colSpan={
                                                    (hasComparedParts ? 1 : 0) +
                                                    (prData.supervisor_approve && prData.manager_approve && prData.pu_operator_approve ? 1 : 0) +
                                                    11
                                                } className={`px-4 py-4 text-center border-t ${isDarkMode ? 'bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50 border-slate-700' : 'bg-gradient-to-r from-green-50 via-white to-green-100 border-green-100'}`}>
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
                                pr_id={prData.pr_id}
                                department={prData.dept_name}
                                prDate={prData.pr_date}
                                qty={selectedPart.qty}
                                unit={selectedPart.unit}
                                pr_list_id={selectedPart.pr_list_id}
                                pu_operator_approve={prData.pu_operator_approve}
                                onClose={() => setModalOpen(false)}
                                onSuccess={handleRefreshData}
                            />
                        )}
                        {/* Reject PR Modal */}
                        <RejectPRModal
                            open={rejectModalOpen}
                            onClose={() => { setRejectModalOpen(false); setRejectPrNo(null); }}
                            onConfirm={handleConfirmReject}
                            prNo={rejectPrNo}
                        />

                        {/* Multi Approval Modal */}
                        {multiApprovalModalOpen && prData && (
                            <div
                                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                                onClick={() => setMultiApprovalModalOpen(false)}
                            >
                                <div
                                    className={`rounded-2xl shadow-2xl border p-0 max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
                                    onClick={e => e.stopPropagation()}
                                >
                                    {/* Header */}
                                    <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                                        <div className="flex items-center justify-between">
                                            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                                                อนุมัติหลายรายการ
                                            </h2>
                                            <button
                                                type="button"
                                                className={`p-2 rounded-lg hover:bg-gray-100 ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'text-gray-500'}`}
                                                onClick={() => setMultiApprovalModalOpen(false)}
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                                        <div className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                                            รายการที่เลือกสำหรับการอนุมัติ ({selectedParts.length} รายการ)
                                        </div>

                                        <div className="space-y-3">
                                            {prData.pr_lists
                                                ?.filter(part => selectedParts.includes(part.pcl_id))
                                                .map((part, idx) => (
                                                    <div key={part.pcl_id} className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-4">
                                                                    <span className={`text-sm font-mono px-2 py-1 rounded ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>
                                                                        {idx + 1}
                                                                    </span>
                                                                    <div>
                                                                        <div className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                                                                            {part.part_no}
                                                                        </div>
                                                                        <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                                                                            {part.part_name}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                                                    จำนวน: {part.qty} {part.unit}
                                                                </div>
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                                                                    <span className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Compared</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                type="button"
                                                className={`px-4 py-2 rounded-lg border font-medium ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                                onClick={() => setMultiApprovalModalOpen(false)}
                                            >
                                                ยกเลิก
                                            </button>
                                            <button
                                                type="button"
                                                className={`px-6 py-2 rounded-lg font-medium text-white ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'}`}
                                                onClick={handleMultiApprove}
                                            >
                                                อนุมัติ ({selectedParts.length} รายการ)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={`p-8 text-center ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>กรุณาเลือก PR จากหน้าแรก</div>
                )
                }

                {/* Approve Confirmation Modal */}
                <ApprovePRModal
                    open={approveModalOpen}
                    onClose={() => setApproveModalOpen(false)}
                    onConfirm={handleApprove}
                    prNo={approvePrNo}
                />

                {/* Reject Modal */}
                <RejectPRModal
                    open={rejectModalOpen}
                    onClose={() => setRejectModalOpen(false)}
                    onConfirm={handleConfirmReject}
                    prNo={rejectPrNo}
                />
            </main >
        </div >
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
