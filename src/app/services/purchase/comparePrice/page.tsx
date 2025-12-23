
"use client";
import React from "react";

import RejectPRModal from '../../../components/Modal/Reject_PR';
import ApprovePRModal from '../../../components/Modal/Approve_PR';
import SplitQTYModal from '../../../components/Modal/SplitQTY';
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

import { useToken } from "../../../context/TokenContext";
import { useTheme } from "../../../components/ThemeProvider";
import { useUser } from "@/app/context/UserContext";
import { useSidebar } from "../../../context/SidebarContext";
import Sidebar from "../../../components/sidebar";
import Header from "../../../components/header";

import PRModal from '../../../components/Modal/PRModal';
import GroupPRModal from "@/app/components/Modal/Group_PR";
import FreeItemsModal from "@/app/components/Modal/Free_Item_Modal";

import { BsCalendar2Event } from "react-icons/bs";
import { MdOutlineGroups3 } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import { FaXmark } from "react-icons/fa6";
import { LuSquareSplitHorizontal } from 'react-icons/lu';
import { IoIosCheckmark } from "react-icons/io";
import { FaRegClock } from "react-icons/fa6";
import { GoGift } from "react-icons/go";
import { SlOptionsVertical } from "react-icons/sl";
import { LuUngroup } from "react-icons/lu";
import { LuGroup } from "react-icons/lu";
import { FiFolder } from "react-icons/fi";
import { TbProgressCheck } from "react-icons/tb";
import { LuNotebookPen } from "react-icons/lu";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { GoDownload } from "react-icons/go";

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

type Data = {
    id: number;
    group_name: string;
    pr_id: number;
    note: Note[];
    list: List[];
}

type Note = {
    id: number;
    note: string;
}

type List = {
    id: number;
    member_id: number;
    pcl_id: number;
    part_no: string;
    prod_code: string;
    part_name: string;
    objective: string;
    qty: number;
    unit: string;
    vendor: string;
    stock: number;
    price_per_unit: number;
    plant: string;
    status: string;
    free_item: FreeItems[];
}

type FreeItems = {
    free_item_id: number;
    pcl_id: number;
    part_no: string;
    prod_code: string;
    part_name: string;
    qty: number;
    remark: string;
}

function ComparePriceContent({ token }: { token: string | null }) {
    const { isDarkMode } = useTheme();
    // Assume user info is available from context or prop
    // You may need to adjust this to your actual user context
    const { user } = useUser();

    const departmentId = user?.Department?.ID;

    const searchParams = useSearchParams();
    const prId = searchParams.get("id");
    const router = useRouter();
    const { isCollapsed } = useSidebar();

    // const selectedPR = prList.find(pr => pr.code === prCode);
    // const selectedParts = selectedPR?.parts || [];

    // const [modalOpen, setModalOpen] = useState(false);
    // const [modalPart, setModalPart] = useState<Part | null>(null);
    const [data, setData] = useState<Data[] | null>([]);
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
    // Group PR Modal state
    const [groupPRModalOpen, setGroupPRModalOpen] = useState(false);

    // Free item modal state
    const [freeItemModalOpen, setFreeItemModalOpen] = useState(false);
    const [selectedFreeItemPart, setSelectedFreeItemPart] = useState<List | null>(null);

    // dropdown open
    const [openDropdown, setOpenDropdown] = useState<number | null>(null);

    // Split QTY Modal states
    const [splitModalOpen, setSplitModalOpen] = useState(false);
    const [selectedSplitPart, setSelectedSplitPart] = useState<Part | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;
    // Flatten all parts from all groups for pagination
    const allParts = Array.isArray(data)
        ? data
            .filter(group => Array.isArray(group.list))
            .flatMap(group => group.list.map(item => ({ ...item, group })))
        : [];
    const totalRows = allParts.length;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    const pagedParts = allParts.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    // --- Hydration-safe date formatting (must be before any return/conditional) ---
    // Removed unused formattedDate and formattedTime state to resolve ESLint warnings

    // Convert List to Part for modal usage
    const handleItemClick = (part: List & { group: Data }) => {
        setSelectedPartNo(part.part_no);
        setSelectedPart({
            pcl_id: part.pcl_id,
            pr_list_id: part.id, // Map List.id to pr_list_id
            part_no: part.part_no,
            prod_code: part.prod_code,
            part_name: part.part_name,
            qty: part.qty,
            unit: part.unit,
            stock: part.stock,
            objective: part.objective,
            plant: part.plant,
            vendor: part.vendor,
            price_per_unit: part.price_per_unit,
            ordered: part.status // Map status to ordered
        });
        setModalOpen(true);
    };

    // Use grouped data only
    const hasActionableParts = allParts.some(part => part.status === 'Compared' || part.status === 'pending' || part.status === 'Rejected' || part.status === 'Po Rejected' || part.status === 'Recheck') && (prData?.manager_approve && prData?.supervisor_approve && user?.Department?.ID === 10086) && !(prData?.supervisor_reject_at || prData?.manager_reject_at || prData?.pu_operator_reject_at);

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
            const comparedParts = allParts.filter(part => part.status === 'Compared').map(part => part.pcl_id);
            setSelectedParts(comparedParts);
        } else {
            setSelectedParts([]);
        }
    };

    // Ref for dropdown to detect outside click
    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<{ [key: number]: HTMLButtonElement | null }>({});
    const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        if (openDropdown !== null && buttonRef.current[openDropdown]) {
            const button = buttonRef.current[openDropdown];
            if (button) {
                const rect = button.getBoundingClientRect();
                setDropdownPosition({
                    top: rect.top + window.scrollY,
                    left: rect.right + window.scrollX + 8
                });
            }
        } else {
            setDropdownPosition(null);
        }
    }, [openDropdown]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setOpenDropdown(null); // ฟังก์ชันนี้ต้องปิด dropdown
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    // Function to refresh data after PO creation
    // const handleRefreshData = async () => {
    //     if (!prId || !token) return;

    //     try {
    //         setError("");
    //         const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pr/request/list?pr_id=${prId}`, {
    //             headers: { Authorization: `Bearer ${token}` }
    //         });
    //         if (!response.ok) throw new Error("โหลดข้อมูล PR ไม่สำเร็จ");
    //         const data = await response.json();
    //         // Custom sort: group by part_no, preserve first appearance order
    //         if (data.data && Array.isArray(data.data.pr_lists)) {
    //             const prLists = data.data.pr_lists;
    //             const partNoFirstIndex = new Map();
    //             prLists.forEach((item: any, idx: number) => {
    //                 if (!partNoFirstIndex.has(item.part_no)) {
    //                     partNoFirstIndex.set(item.part_no, idx);
    //                 }
    //             });
    //             prLists.sort((a: any, b: any) => {
    //                 const aIdx = partNoFirstIndex.get(a.part_no);
    //                 const bIdx = partNoFirstIndex.get(b.part_no);
    //                 if (a.part_no === b.part_no) {
    //                     return 0;
    //                 }
    //                 return aIdx - bIdx;
    //             });
    //         }
    //         setPrData(data.data);
    //         // Reset selections when data refreshes
    //         setSelectedParts([]);
    //         // console.log("Refreshed PR Data:", data.data);
    //     } catch (err: unknown) {
    //         if (err instanceof Error) {
    //             setError(err.message || "เกิดข้อผิดพลาด");
    //         } else {
    //             setError("เกิดข้อผิดพลาด");
    //         }
    //     }
    // };

    const handleRefreshData = async () => {
        if (!prId || !token) return;

        try {
            setError("");
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group?prId=${prId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) {
                if (response.status === 401) {
                    setError("ไม่ได้รับอนุญาต กรุณา login ใหม่ หรือขอสิทธิ์การเข้าถึง");
                } else {
                    setError(`เกิดข้อผิดพลาด (${response.status}): ไม่สามารถดึงข้อมูลกลุ่มได้`);
                }
                setData([]);
                return;
            }
            const result = await response.json();
            console.log("Fetched groups data:", result);
            // ปรับให้รองรับโครงสร้างข้อมูลที่แตกต่างกัน
            const groups = result.data || result.groups || result || [];
            if (!Array.isArray(groups)) {
                setError("ข้อมูลกลุ่มไม่ถูกต้อง");
                setData([]);
            } else {
                setData(groups);
            }
        } catch (error) {
            setError("Error fetching groups");
            setData([]);
            console.error("Error fetching groups:", error);
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

                // Fetch PR data
                const prRes = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pr/request/list?pr_id=${prId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!prRes.ok) throw new Error("โหลดข้อมูล PR ไม่สำเร็จ");
                const prJson = await prRes.json();
                if (prJson.data && Array.isArray(prJson.data.pr_lists)) {
                    const prLists = prJson.data.pr_lists;
                    const partNoFirstIndex = new Map();
                    prLists.forEach((item: List, idx: number) => {
                        if (!partNoFirstIndex.has(item.part_no)) {
                            partNoFirstIndex.set(item.part_no, idx);
                        }
                    });
                    prLists.sort((a: List, b: List) => {
                        const aIdx = partNoFirstIndex.get(a.part_no);
                        const bIdx = partNoFirstIndex.get(b.part_no);
                        if (a.part_no === b.part_no) return 0;
                        return aIdx - bIdx;
                    });
                }
                setPrData(prJson.data);

                // Fetch group data
                const groupRes = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group?prId=${prId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!groupRes.ok) throw new Error("Failed to fetch groups");
                const groupJson = await groupRes.json();
                console.log("Fetched groups data:", groupJson);
                setData(groupJson.data || groupJson.groups || groupJson || []);
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
            router.push(process.env.NEXT_PUBLIC_PURCHASE_PR_REDIRECT || "/services/purchase");
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
            router.push(process.env.NEXT_PUBLIC_PURCHASE_PR_REDIRECT || "/services/purchase");
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
        // console.log('User ID for approval:', user?.ID);
        const errorDetails: string[] = [];
        for (const pcl_id of selectedParts) {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/approve-pcl?id=${pcl_id}&approvalId=${user?.ID}`, {
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
        setSelectedParts([]);
        setMultiApprovalModalOpen(false);
        await handleRefreshData();
    }

    // Split QTY Modal functions
    // --- Dropdown stick logic ---
    useEffect(() => {
        if (openDropdown == null) return;
        function updateDropdownPos() {
            if (openDropdown == null) return;
            const btn = buttonRef.current[openDropdown];
            if (btn) {
                const rect = btn.getBoundingClientRect();
                setDropdownPosition({
                    top: rect.top,
                    left: rect.right + 8
                });
            }
        }
        window.addEventListener('scroll', updateDropdownPos, true);
        window.addEventListener('resize', updateDropdownPos);
        updateDropdownPos();
        return () => {
            window.removeEventListener('scroll', updateDropdownPos, true);
            window.removeEventListener('resize', updateDropdownPos);
        };
    }, [openDropdown]);
    // Ensure portal only renders on client
    const [isClient, setIsClient] = useState(false);
    useEffect(() => { setIsClient(true); }, []);
    const handleSplitQtyClick = (part: List & { group: Data }) => {
        // Convert to Part format for modal
        const partForModal: Part = {
            pcl_id: part.pcl_id,
            pr_list_id: part.id,
            part_no: part.part_no,
            prod_code: part.prod_code,
            part_name: part.part_name,
            qty: part.qty,
            unit: part.unit,
            stock: part.stock,
            objective: part.objective,
            plant: part.plant,
            vendor: part.vendor,
            price_per_unit: part.price_per_unit,
            ordered: part.status
        };
        setSelectedSplitPart(partForModal);
        setSplitModalOpen(true);
    };

    const handleSplitQtySuccess = async () => {
        await handleRefreshData(); // Refresh data after successful split
    };

    // TODO: PDF
    // Preview PDF: ใช้ Authorization header (Bearer token) เพื่อไม่ให้ token อยู่ใน URL
    // หมายเหตุ: GET ไม่สามารถส่ง body ที่ browser ยอมรับได้ ดังนั้นใช้ header แทน
    const previewPrPdf = async (pr_id: number) => {
        console.log('previewPrPdf called for PR:', pr_id);
        if (!token) {
            alert('ไม่พบ token กรุณาเข้าสู่ระบบใหม่');
            return;
        }
        const endpointType = departmentId === 10086 ? 'indirect' : 'direct';
        const previewUrl = `${process.env.NEXT_PUBLIC_ROOT_PATH_PDF_SERVICE}/preview_pdf_pr/${pr_id}/${endpointType}`;
        try {
            const res = await fetch(previewUrl, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const objectUrl = URL.createObjectURL(blob);
            window.open(objectUrl, '_blank', 'noopener');
            setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
        } catch (err) {
            console.error('previewPrPdf error:', err);
            // Fallback (เปิดแบบมี token ใน URL หาก backend ยังไม่รองรับ Authorization)
            // window.open(`${process.env.NEXT_PUBLIC_ROOT_PATH_PDF_SERVICE}/preview-pr/${pr_no}/${endpointType}?token=${token}`, '_blank');
        }
    }

    // Download PDF: ใช้ Authorization header + Blob เพื่อไม่ให้ token อยู่ใน URL
    const downloadPrPdf = async (pr_id: number, pr_no: string) => {
        if (!token) {
            alert('ไม่พบ token กรุณาเข้าสู่ระบบใหม่');
            return;
        }
        const endpointType = departmentId === 10086 ? 'indirect' : 'direct';
        const previewUrl = `${process.env.NEXT_PUBLIC_ROOT_PATH_PDF_SERVICE}/preview-pr/${pr_id}/${endpointType}`;
        try {
            const res = await fetch(previewUrl, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                if (res.status === 401) alert('Token หมดอายุ กรุณาเข้าสู่ระบบใหม่');
                throw new Error(`HTTP ${res.status}`);
            }
            const blob = await res.blob();
            // สร้างลิงก์ดาวน์โหลดชั่วคราว
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `PR_${pr_no}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (err) {
            console.error('downloadPrPdf error:', err);
            // Fallback: ถ้า backend ยังไม่รองรับ header ใช้แบบเดิม (token ใน URL)
            // window.open(`${process.env.NEXT_PUBLIC_ROOT_PATH_PDF_SERVICE}/download/${pr_id}/${token}`, '_blank', 'noopener');
        }
    }

    if (loading) return <div>กำลังโหลดข้อมูล...</div>;
    if (error) return <div style={{ color: "red" }}>{error}</div>;
    if (!Array.isArray(data)) return <div style={{ color: "red" }}>ไม่พบข้อมูลกลุ่มหรือข้อมูลผิดรูปแบบ</div>;

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
                                            <TbProgressCheck className={`w-4 h-4 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`} />
                                            รอหัวหน้าแผนกอนุมัติ
                                        </span>
                                    ) : !prData.manager_approve ? (
                                        // Purple - รอผู้จัดการแผนกอนุมัติ
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-xs border shadow-sm ${isDarkMode ? 'bg-purple-900/30 border-purple-700/50 text-purple-300' : 'bg-purple-50 border-purple-300 text-purple-800'}`}>
                                            <TbProgressCheck className={`w-4 h-4 ${isDarkMode ? 'text-purple-300' : 'text-purple-500'}`} />
                                            รอผู้จัดการแผนกอนุมัติ
                                        </span>
                                    ) : !prData.pu_operator_approve ? (
                                        // Orange - รอแผนกจัดซื้ออนุมัติ
                                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full font-semibold text-xs border shadow-sm ${isDarkMode ? 'bg-orange-900/30 border-orange-700/50 text-orange-300' : 'bg-orange-50 border-orange-300 text-orange-800'}`}>
                                            <TbProgressCheck className={`w-4 h-4 ${isDarkMode ? 'text-orange-300 text-bold' : 'text-orange-500'}`} />
                                            รอแผนกจัดซื้ออนุมัติ
                                        </span>
                                    ) : prData.count_ordered === allParts.length ? (
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
                                                    ? `${allParts.length} รายการ`
                                                    : `ดำเนินการ ${prData.count_ordered} / ${allParts.length} รายการ`
                                                }
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {/* Multi Approval Button - Show only when parts are selected */}
                                            {selectedParts.length > 0 && allParts.some(part => part.status === 'Compared') && (
                                                <button
                                                    type="button"
                                                    className={`rounded-lg px-6 py-2 font-semibold border focus:outline-none transition-colors duration-150 cursor-pointer hover:shadow ${isDarkMode ? 'text-sky-400 bg-sky-900/30 border-sky-600/30 hover:bg-sky-800/50' : 'text-sky-700 bg-sky-50 border-sky-300 hover:bg-sky-100'}`}
                                                    onClick={() => setMultiApprovalModalOpen(true)}
                                                >
                                                    อนุมัติ({allParts.filter(part => part.status === 'Compared' && selectedParts.includes(part.pcl_id)).length})รายการ
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                className={`group relative rounded-lg px-6 py-2 font-semibold border focus:outline-none transition-colors duration-150 cursor-pointer hover:shadow ${isDarkMode ? 'text-emerald-400 bg-slate-800 border-emerald-600/30 hover:bg-slate-700' : 'text-green-700 bg-white border-green-300 hover:bg-green-50'}`}
                                                onClick={() => setGroupPRModalOpen(true)}
                                            >
                                                <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 opacity-100 group-hover:opacity-0">
                                                    <LuUngroup className="w-7 h-7" />
                                                </span>
                                                <span className="absolute inset-0 flex items-center justify-center transition-opacity duration-200 opacity-0 group-hover:opacity-100">
                                                    <LuGroup className="w-7 h-7" />
                                                </span>
                                                <span className="invisible">
                                                    <LuUngroup className="w-7 h-7" />
                                                </span>
                                            </button>
                                            {/* Group PR Modal */}
                                            <GroupPRModal
                                                open={groupPRModalOpen}
                                                onClose={() => {
                                                    setGroupPRModalOpen(false);
                                                    handleRefreshData();
                                                }}
                                                pr_id={prId ?? ''}
                                                pr_no={prData?.pr_no ?? ''}
                                                onSuccess={handleRefreshData}
                                            />
                                            <div className="flex w-full justify-center">
                                                <button
                                                    className={`flex items-center justify-center rounded-l-lg px-4 py-2 text-lg font-medium transition ${isDarkMode ? 'text-emerald-400 bg-emerald-900/20 border border-emerald-800/50 hover:bg-emerald-800/30' : 'text-green-600 bg-green-50 border border-green-100 hover:bg-green-100'}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        previewPrPdf(Number(prId));
                                                    }}
                                                >
                                                    <MdOutlineRemoveRedEye className="w-7 h-7" />
                                                </button>
                                                <button
                                                    className={`flex items-center justify-center rounded-r-lg px-4 py-2 text-lg font-medium transition ${isDarkMode ? 'text-red-400 bg-red-900/20 border border-red-800/50 hover:bg-red-800/30' : 'text-red-400 bg-red-50 border border-red-100 hover:bg-red-100'}`}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        downloadPrPdf(Number(prId), prData.pr_no);
                                                    }}
                                                >
                                                    <GoDownload className="w-7 h-7" />
                                                </button>
                                            </div>
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
                            <div className="overflow-x-auto shadow-lg backdrop-blur-sm">
                                <table className="w-full text-sm table-auto">
                                    <thead className={isDarkMode ? 'bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50' : 'bg-gradient-to-r from-green-50 via-white to-green-100'}>
                                        <tr>
                                            {/* Show action column only if there are actionable items (Compared, pending, Rejected) */}
                                            {hasActionableParts && (
                                                <th className={`px-1 py-3 text-center font-semibold w-12 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                                    {/* Header: show select all only if there is at least one Compared row */}
                                                    {allParts.some(part => part.status === 'Compared') ? (
                                                        <input
                                                            type="checkbox"
                                                            className={`w-4 h-4 rounded border-2 transition-all duration-200 cursor-pointer ${isDarkMode
                                                                ? 'border-slate-500 bg-slate-700 text-sky-400 focus:ring-2 focus:ring-sky-400/50 checked:bg-sky-500 checked:border-sky-500'
                                                                : 'border-gray-300 bg-white text-sky-600 focus:ring-2 focus:ring-sky-500/50 checked:bg-sky-600 checked:border-sky-600'
                                                                }`}
                                                            checked={
                                                                allParts.filter(part => part.status === 'Compared').length > 0 &&
                                                                allParts.filter(part => part.status === 'Compared').every(part => selectedParts.includes(part.pcl_id))
                                                            }
                                                            onChange={(e) => handleSelectAll(e.target.checked)}
                                                        />
                                                    ) : null}
                                                </th>
                                            )}
                                            {prData.supervisor_approve && prData.manager_approve && prData.pu_operator_approve && (
                                                <th className={`px-2 py-3 text-center font-semibold w-26 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Status</th>
                                            )}
                                            <th className={`px-2 py-3 text-center font-semibold w-12 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Item</th>
                                            <th className={`px-2 py-3 text-left font-semibold w-40 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Part No.</th>
                                            <th className={`px-2 py-3 text-left font-semibold w-40 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Prod Code</th>
                                            <th className={`px-2 py-3 text-left font-semibold w-64 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Part Name</th>
                                            <th className={`px-2 py-3 text-left font-semibold w-48 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Objective</th>
                                            <th className={`px-2 py-3 text-center font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>QTY</th>
                                            <th className={`px-2 py-3 text-center font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>UNIT</th>
                                            {(departmentId === 10086 && prData.manager_approve && prData.supervisor_approve && user?.Department?.ID === 10086) && (
                                                <th className={`px-2 py-3 text-center font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Vendor</th>
                                            )}
                                            <th className={`px-2 py-3 text-center font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Stock</th>
                                            {departmentId === 10086 && prData.manager_approve && prData.supervisor_approve && user?.Department?.ID === 10086 && (
                                                <th className={`px-2 py-3 text-right font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Price/Unit</th>
                                            )}
                                            <th className={`px-2 py-3 text-center font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Plant</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y divide-opacity-30 transition-all duration-200 ${isDarkMode ? 'bg-slate-800/20 divide-slate-700/30' : 'bg-white/80 divide-gray-200/40'}`}>
                                        {/* Render group header and notes before each group's list */}
                                        {(() => {
                                            const groupIndexes: { [groupId: number]: number } = {};
                                            pagedParts.forEach((item, idx) => {
                                                if (groupIndexes[item.group.id] === undefined) {
                                                    groupIndexes[item.group.id] = idx;
                                                }
                                            });

                                            return pagedParts.map((part, idx) => {
                                                const isFirstInGroup = groupIndexes[part.group.id] === idx;
                                                // Find if this is the last item in the group
                                                const isLastInGroup = (() => {
                                                    for (let j = idx + 1; j < pagedParts.length; j++) {
                                                        if (pagedParts[j].group.id === part.group.id) return false;
                                                    }
                                                    return true;
                                                })();

                                                const rows = [];

                                                if (isFirstInGroup) {
                                                    rows.push(
                                                        <tr key={`group-header-${part.group.id}`}
                                                            className={`shadow-sm ${isDarkMode ? 'bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50' : 'bg-gradient-to-r from-green-50 via-white to-green-100 backdrop-blur-sm'}`}
                                                        >
                                                            <td colSpan={
                                                                (hasActionableParts ? 1 : 0) +
                                                                (prData?.supervisor_approve && prData?.manager_approve && prData?.pu_operator_approve ? 1 : 0) +
                                                                12
                                                            } className="py-2.5 px-6 font-bold text-base align-middle">
                                                                <div className="flex items-center gap-2 px-2 py-0.5">
                                                                    <span className={`flex items-center justify-center w-6 h-6 rounded-full shadow-sm ${isDarkMode ? 'bg-blue-900/30' : 'bg-green-100'}`}>
                                                                        <FiFolder className={`w-3.5 h-3.5 ${isDarkMode ? 'text-blue-200' : 'text-green-600'}`} />
                                                                    </span>
                                                                    <span className={`font-bold text-[1.08rem] tracking-wide ${isDarkMode ? 'text-blue-300' : 'text-green-700'}`}>{part.group.group_name}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                rows.push(
                                                    <tr key={part.part_no + '-row-' + ((page - 1) * rowsPerPage + idx)}
                                                        className={`transition-all duration-300 group border-b border-opacity-20 ${!(prData.manager_approve && prData.supervisor_approve && user?.Department?.ID === 10086)
                                                            ? 'cursor-not-allowed opacity-50'
                                                            : 'cursor-pointer hover:shadow-md'
                                                            } ${isDarkMode
                                                                ? 'bg-slate-800/20 hover:bg-slate-700/40 hover:shadow-slate-900/20 border-slate-700/30'
                                                                : 'bg-white/70 hover:bg-green-100/50 hover:shadow-green-900/10 border-gray-200/50'
                                                            }`}
                                                        onClick={() => {
                                                            if (prData.manager_approve && prData.supervisor_approve && user?.Department?.ID === 10086) {
                                                                handleItemClick(part);
                                                            }
                                                        }}
                                                    >
                                                        {/* Show action cell only if there are actionable items (Compared, pending, Rejected) */}
                                                        {hasActionableParts && (
                                                            <td className={`px-1 py-3 text-center w-12`}>
                                                                {part.status === 'Compared' ? (
                                                                    <input
                                                                        type="checkbox"
                                                                        className={`w-4 h-4 rounded border-2 transition-all duration-200 ${isDarkMode
                                                                            ? 'cursor-pointer border-slate-500 bg-slate-700 text-blue-400 focus:ring-2 focus:ring-blue-400/50 checked:bg-blue-500 checked-border-blue-500 hover:border-blue-400'
                                                                            : 'cursor-pointer border-gray-300 bg-white text-blue-600 focus:ring-2 focus:ring-blue-500/50 checked:bg-blue-600 checked-border-blue-600 hover:border-blue-400'
                                                                            }`}
                                                                        checked={selectedParts.includes(part.pcl_id)}
                                                                        onClick={e => e.stopPropagation()}
                                                                        onChange={(e) => {
                                                                            handlePartSelection(part.pcl_id, e.target.checked);
                                                                        }}
                                                                    />
                                                                ) : (part.status === 'pending' || part.status === 'Rejected' || part.status === 'Po Rejected' || part.status === 'Recheck') ? (
                                                                    <div className="relative inline-block">
                                                                        <button
                                                                            ref={el => { buttonRef.current[part.pcl_id] = el; }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setOpenDropdown(openDropdown === part.pcl_id ? null : part.pcl_id);
                                                                            }}
                                                                            className={`p-2 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${isDarkMode
                                                                                ? 'hover:bg-gray-600 border-gray-600'
                                                                                : 'hover:bg-slate-100 border-slate-200'
                                                                                }`}
                                                                            type="button"
                                                                        >
                                                                            <SlOptionsVertical size={18} className={`${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                                                                        </button>
                                                                        {isClient && openDropdown !== null && openDropdown === part.pcl_id && dropdownPosition &&
                                                                            createPortal(
                                                                                <div
                                                                                    ref={dropdownRef}
                                                                                    className={`fixed border-2 rounded-xl shadow-xl z-[9999] min-w-[160px] ${isDarkMode
                                                                                        ? 'bg-gray-700 border-gray-600'
                                                                                        : 'bg-white border-slate-200'
                                                                                        }`}
                                                                                    style={{
                                                                                        top: dropdownPosition.top,
                                                                                        left: dropdownPosition.left
                                                                                    }}
                                                                                    onClick={(e) => e.stopPropagation()}
                                                                                >
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            handleSplitQtyClick(part);
                                                                                            setOpenDropdown(null);
                                                                                        }}
                                                                                        className={`w-full text-left px-5 py-3 text-sm flex items-center gap-3 cursor-pointer transition-all duration-200 font-medium rounded-t-xl ${isDarkMode
                                                                                            ? 'text-gray-300 hover:bg-blue-900/30'
                                                                                            : 'text-slate-700 hover:bg-blue-50'
                                                                                            }`}
                                                                                    >
                                                                                        <LuSquareSplitHorizontal size={18} className={isDarkMode ? 'text-blue-400' : 'text-blue-600'} /> แบ่งจำนวน
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setSelectedFreeItemPart(part);
                                                                                            setFreeItemModalOpen(true);
                                                                                            setOpenDropdown(null);
                                                                                        }}
                                                                                        className={`w-full text-left px-5 py-3 text-sm flex items-center gap-3 cursor-pointer transition-all duration-200 font-medium rounded-b-xl ${isDarkMode
                                                                                            ? 'text-gray-300 hover:bg-emerald-900/30'
                                                                                            : 'text-slate-700 hover:bg-emerald-50'
                                                                                            }`}
                                                                                    >
                                                                                        <GoGift size={18} className={isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} /> ของแถม
                                                                                    </button>
                                                                                </div>,
                                                                                document.body
                                                                            )
                                                                        }
                                                                    </div>
                                                                ) : null}
                                                            </td>
                                                        )}
                                                        {prData.supervisor_approve && prData.manager_approve && prData.pu_operator_approve && (
                                                            <td className={`px-2 py-3 text-center w-26`}>
                                                                <div className="flex items-center justify-center">
                                                                    {(() => {
                                                                        switch (part.status) {
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
                                                                            case 'Recheck':
                                                                                return (
                                                                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border min-w-[80px] justify-center bg-gradient-to-r ${isDarkMode ? 'from-orange-900/60 via-orange-800/50 to-orange-900/60 border-orange-700/60' : 'from-orange-50 via-orange-100 to-orange-50 border-orange-300'}`}>
                                                                                        <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-orange-400' : 'bg-orange-500'}`}></div>
                                                                                        <span className={`text-xs font-medium ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>recheck</span>
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
                                                                            case 'Po Updated':
                                                                                return (
                                                                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border min-w-[80px] justify-center bg-gradient-to-r ${isDarkMode ? 'from-fuchsia-900/60 via-fuchsia-800/50 to-fuchsia-900/60 border-fuchsia-700/60' : 'from-fuchsia-50 via-fuchsia-100 to-fuchsia-50 border-fuchsia-300'}`}>
                                                                                        <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-fuchsia-400' : 'bg-fuchsia-500'}`}></div>
                                                                                        <span className={`text-xs font-medium ${isDarkMode ? 'text-fuchsia-300' : 'text-fuchsia-700'}`}>po updated</span>
                                                                                    </div>
                                                                                );
                                                                            default:
                                                                                return (
                                                                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border min-w-[80px] justify-center bg-gradient-to-r ${isDarkMode ? 'from-gray-900/50 via-gray-800/40 to-gray-900/50 border-gray-700/50' : 'from-gray-50 via-gray-100 to-gray-50 border-gray-300'}`}>
                                                                                        <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-gray-400' : 'bg-gray-500'}`}></div>
                                                                                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{part.status || '-'}</span>
                                                                                    </div>
                                                                                );
                                                                        }
                                                                    })()}
                                                                </div>
                                                            </td>
                                                        )}
                                                        <td className={`px-3 py-4 text-center w-12 align-middle ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-200 ${isDarkMode ? 'bg-slate-700/40 text-slate-200 group-hover:bg-slate-600/50' : 'bg-gray-100 text-gray-700 group-hover:bg-gray-200'}`}>
                                                                {(page - 1) * rowsPerPage + idx + 1}
                                                            </span>
                                                        </td>
                                                        <td className={`px-3 py-4 font-mono font-semibold w-40 text-left align-middle ${isDarkMode ? 'text-slate-100' : 'text-gray-800'}`}>
                                                            <div className="flex items-center gap-2">
                                                                <span className="tracking-wide">{part.part_no}</span>
                                                            </div>
                                                        </td>
                                                        <td className={`px-3 py-4 font-mono font-medium w-40 text-left align-middle ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                                            <span className="tracking-wide">{part.prod_code}</span>
                                                        </td>
                                                        <td className={`px-3 py-4 w-64 align-middle ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                                            <div className="font-medium leading-relaxed">{part.part_name}</div>
                                                        </td>
                                                        <td className={`px-3 py-4 w-48 align-middle ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                                            <div className="text-sm leading-relaxed">{part.objective}</div>
                                                        </td>
                                                        <td className={`px-3 py-4 w-16 text-center align-middle ${isDarkMode ? 'text-slate-100' : 'text-gray-800'}`}>
                                                            <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-md text-sm font-bold transition-all duration-200 ${isDarkMode ? 'bg-slate-700/30 border border-slate-600/50 group-hover:bg-slate-600/40' : 'bg-gray-50 border border-gray-200 group-hover:bg-gray-100'}`}>
                                                                {part.qty}
                                                            </span>
                                                        </td>
                                                        <td className={`px-3 py-4 w-16 text-center align-middle font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                                            <span className="text-sm font-semibold">{part.unit}</span>
                                                        </td>
                                                        {(departmentId === 10086 && prData.manager_approve && prData.supervisor_approve && user?.Department?.ID === 10086) && (
                                                            <td className={`px-3 py-4 w-16 text-center align-middle font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                                                <div className="text-sm font-semibold">{part.vendor}</div>
                                                            </td>
                                                        )}
                                                        <td className={`px-3 py-4 w-16 text-center align-middle ${isDarkMode ? 'text-slate-100' : 'text-gray-800'}`}>
                                                            <span className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-md text-sm font-bold transition-all duration-200 ${part.stock > 0
                                                                ? isDarkMode
                                                                    ? 'bg-green-900/30 text-green-400 border border-green-700/50'
                                                                    : 'bg-green-50 text-green-700 border border-green-200'
                                                                : isDarkMode
                                                                    ? 'bg-red-900/30 text-red-400 border border-red-700/50'
                                                                    : 'bg-red-50 text-red-700 border-red-200'
                                                                }`}>
                                                                {part.stock}
                                                            </span>
                                                        </td>
                                                        {(departmentId === 10086 && prData.manager_approve && prData.supervisor_approve && user?.Department?.ID === 10086) && (
                                                            <td className={`px-3 py-4 w-16 text-right align-middle font-mono font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                                                <div className="text-sm">{part.price_per_unit}</div>
                                                            </td>
                                                        )}
                                                        <td className={`px-3 py-4 w-16 text-center align-middle font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                                            <span className="text-sm font-semibold">{part.plant === 'Plant 1' ? 'P1' : part.plant === 'Plant 2' ? 'P2' : part.plant}</span>
                                                        </td>
                                                    </tr>
                                                );
                                                // Show free_item rows after this part if any
                                                if (Array.isArray(part.free_item) && part.free_item.length > 0) {
                                                    part.free_item.forEach((item, i) => {
                                                        rows.push(
                                                            <tr key={`${part.part_no}-freebie-${item.part_no || ''}-${i}-${idx}`} className={`${isDarkMode ? 'bg-slate-800/30' : 'bg-gray-50/80'}`}>
                                                                {/* Add empty action cell only if hasActionableParts is true */}
                                                                {hasActionableParts && (
                                                                    <td className={`px-4 py-2 text-right text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}></td>
                                                                )}
                                                                <td className={`px-4 py-2 text-right text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}></td>
                                                                {/* Add empty status cell only if status column is visible */}
                                                                {prData?.supervisor_approve && prData?.manager_approve && prData?.pu_operator_approve && (
                                                                    <td className={`px-4 py-2 text-center text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-slate-700/70 text-slate-300' : 'bg-slate-200 text-slate-600'}`}>
                                                                            <GoGift className="w-4.5 h-4.5" />
                                                                        </span>
                                                                    </td>
                                                                )}
                                                                <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                    {(() => {
                                                                        // แยก part_no จาก format: part_no|part_name|prod_code
                                                                        if (item.part_no && item.part_no.includes('|')) {
                                                                            return item.part_no.split('|')[0];
                                                                        }
                                                                        return item.part_no || '-';
                                                                    })()}
                                                                </td>
                                                                <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                    {(() => {
                                                                        // แยก prod_code จาก format: part_no|part_name|prod_code
                                                                        if (item.part_no && item.part_no.includes('|')) {
                                                                            const parts = item.part_no.split('|');
                                                                            return parts[2] || '-';
                                                                        }
                                                                        return item.prod_code || '-';
                                                                    })()}
                                                                </td>
                                                                <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                    <div className="flex flex-col gap-0.5">
                                                                        <div>
                                                                            {(() => {
                                                                                // แยก part_name จาก format: part_no|part_name|prod_code
                                                                                if (item.part_no && item.part_no.includes('|')) {
                                                                                    const parts = item.part_no.split('|');
                                                                                    return parts[1] || '-';
                                                                                }
                                                                                return item.part_name || '-';
                                                                            })()}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className={`px-4 py-2 text-left text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>* หมายเหตุ : {item.remark}</td>
                                                                <td className={`px-4 py-2 text-center text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                                                    {(()=> {
                                                                        if (item.qty === 0) return '-';
                                                                        return item.qty;
                                                                    })()}
                                                                </td>
                                                                <td className={`px-4 py-2 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                    {(()=> {
                                                                        if (item.qty === 0) return '-';
                                                                        return part.unit;
                                                                    })()}
                                                                </td>
                                                                {/* Add empty vendor cell only if vendor column is visible */}
                                                                {(departmentId === 10086 && prData?.manager_approve && prData?.supervisor_approve && user?.Department?.ID === 10086) && (
                                                                    <td className={`px-4 py-2 text-right text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}></td>
                                                                )}
                                                                <td className={`px-4 py-2 text-right text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}></td>
                                                                {(departmentId === 10086 && prData?.manager_approve && prData?.supervisor_approve && user?.Department?.ID === 10086) && (
                                                                    <td className={`px-4 py-2 text-right text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}></td>
                                                                )}
                                                                <td className={`px-4 py-2 text-right text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}></td>
                                                            </tr>
                                                        );
                                                    });
                                                }

                                                // Add group note row after the last item in the group
                                                if (isLastInGroup && part.group.note && part.group.note.length > 0) {
                                                    rows.push(
                                                        <tr key={`group-note-${part.group.id}`}
                                                            className={`${isDarkMode ? 'border-b-1 border-blue-500/50 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50' : 'bg-gradient-to-r from-green-50 via-white to-green-100 backdrop-blur-sm'}`}
                                                        >
                                                            <td colSpan={
                                                                (hasActionableParts ? 1 : 0) +
                                                                (prData?.supervisor_approve && prData?.manager_approve && prData?.pu_operator_approve ? 1 : 0) +
                                                                12
                                                            } className={`px-8.5 py-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                                                <div className="flex items-center gap-2">
                                                                    <LuNotebookPen className="w-5 h-5 text-yellow-500" />
                                                                    <span className="font-medium">หมายเหตุ : {part.group.note.map(n => n.note).join(', ')}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                }

                                                return rows;
                                            });
                                        })()}
                                        {/* Pagination row */}
                                        {totalRows > rowsPerPage && (
                                            <tr>
                                                <td colSpan={
                                                    (hasActionableParts ? 1 : 0) +
                                                    (prData.supervisor_approve && prData.manager_approve && prData.pu_operator_approve ? 1 : 0) +
                                                    12
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

                        {/* Multi Approval Modal (grouped by group) */}
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
                                            รายการที่เลือกสำหรับการอนุมัติ ({allParts.filter(part => part.status === 'Compared' && selectedParts.includes(part.pcl_id)).length} รายการ)
                                        </div>

                                        {/* Group selected parts by group */}
                                        <div className="space-y-6">
                                            {(() => {
                                                // Build a map: groupId -> { group, items: [] }
                                                const grouped: { [groupId: number]: { group: Data, items: typeof allParts } } = {};
                                                allParts.filter(part => selectedParts.includes(part.pcl_id)).forEach(part => {
                                                    if (!grouped[part.group.id]) {
                                                        grouped[part.group.id] = { group: part.group, items: [] };
                                                    }
                                                    grouped[part.group.id].items.push(part);
                                                });
                                                return Object.values(grouped).map(({ group, items }) => (
                                                    <div key={group.id} className="mb-2">
                                                        <div className={`flex items-center gap-2 mb-2 px-2 py-1 rounded-lg font-bold text-base ${isDarkMode ? 'bg-blue-900/30 text-blue-200' : 'bg-green-100 text-green-700'}`}>
                                                            <FiFolder className="w-4 h-4" />
                                                            <span>{group.group_name}</span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {items.map((part, idx) => (
                                                                <div key={part.pcl_id} className={`p-4 rounded-lg border flex items-center justify-between ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-4">
                                                                            <span className={`text-sm font-mono px-2 py-1 rounded ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-700'}`}>{idx + 1}</span>
                                                                            <div>
                                                                                <div className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{part.part_no}</div>
                                                                                <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{part.part_name}</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>จำนวน: {part.qty} {part.unit}</div>
                                                                        <div className="flex items-center gap-1.5 mt-1">
                                                                            <div className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-500'}`}></div>
                                                                            <span className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Compared</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
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
                                                อนุมัติ ({allParts.filter(part => part.status === 'Compared' && selectedParts.includes(part.pcl_id)).length} รายการ)
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

                {/* Split QTY Modal */}
                <SplitQTYModal
                    isOpen={splitModalOpen}
                    onClose={() => setSplitModalOpen(false)}
                    selectedPart={selectedSplitPart}
                    token={token}
                    onSuccess={handleSplitQtySuccess}
                />
                {/* Free Item Modal */}
                <FreeItemsModal
                    open={freeItemModalOpen}
                    onClose={() => setFreeItemModalOpen(false)}
                    part={selectedFreeItemPart}
                    // data={selectedFreeItemPart}
                    onSuccess={handleRefreshData}
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
