"use client";

import React from 'react';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// context
import { useUser } from "@/app/context/UserContext";

//components
import { useToken } from "@/app/context/TokenContext";
import Sidebar from "@/app/components/sidebar";
import Header from "@/app/components/header";
import { useSidebar } from '@/app/context/SidebarContext';
import { useTheme } from "@/app/components/ThemeProvider";
import ApprovePOModal from "@/app/components/Modal/Approve_PO";
import EditVendor from '@/app/components/Modal/EditVendor';
import RejectPOModal from "@/app/components/Modal/Reject_PO";
import SendMailModal from "@/app/components/Modal/SendMailModal";
import RequestEditPOModal from "@/app/components/Modal/Request_Edit_PO";
import ResponseEditPOModal from "@/app/components/Modal/Response_Edit_PO";
import PuValidatedModal from '@/app/components/Modal/Pu_validated';

// icons
import { BsCalendar2Event } from "react-icons/bs";
import { MdAttachMoney } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import { LuBriefcaseBusiness } from "react-icons/lu";
import { HiDocumentText } from "react-icons/hi2";
import { LuMail } from "react-icons/lu";
import { RiMailSendLine } from "react-icons/ri";
import { MdOutlineEdit } from "react-icons/md";
import { BiQuestionMark } from "react-icons/bi";
import { FaRegCircleQuestion } from "react-icons/fa6";
import { BsExclamationDiamond } from "react-icons/bs";
import { IoSettingsOutline } from "react-icons/io5";
import { TbProgressCheck } from "react-icons/tb";
import { TbSettingsCheck } from "react-icons/tb";
import { TbSettingsQuestion } from "react-icons/tb";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { GoDownload } from "react-icons/go";

type ReviewedPO = {
    po_id: number;
    po_no: string;
    po_date: string;
    dept_request: string;
    delivery_place: string;
    delivery_date: string;
    mail_out_date: string;
    sub_total: number;
    ext_discount: number;
    vat: number;
    total_minus_discount: number;
    total: number;
    vendor_id: number;
    vendor_code: string;
    vendor_name: string;
    addr1: string;
    addr2: string;
    city: string;
    country: string;
    cur_code: string;
    zip: string;
    tax_id: string;
    tel_no: string;
    fax_no: string;
    credit_term: string;
    contact_name: string;
    email: string;
    remark: string;
    issued_by: string;
    approved_by: string;
    rejected_by: string;
    edit_reason: string;
    po_lists: POList[];
    token: string;
    edited_at: string;
    edited_res: string;
    pu_validated: string;
    validated_by: string;
    edit_request: string;
    reject_reason: string;
    pcl_id?: number;
};

type POList = {
    po_list_id: number;
    part_no: string;
    part_name: string;
    prod_code: string;
    pr_no: string;
    qty: number;
    unit: string;
    unit_price: number;
    discount: [];
    cal_discount: number;
    amount: number;
    deli_date: string;
    free_item: FreeItems[]
}

type FreeItems = {
    po_list_id: number;
    part_no: string;
    part_name?: string;
    prod_code?: string;
    qty: number;
    remark: string;
}

type VendorSelected = {
    ID: number;
    vendor_code: string;
    vendor_name: string;
    tax_id: string | null;
    credit_term: string;
    tel_no: string;
    fax_no: string;
    contact_person: string;
    email: string;
}

// Type สำหรับ vendor ที่เลือก
// type VendorSelected = { ... } // เพิ่ม type ตามที่ใช้งานจริง

export default function ReviewedPOPage() {
    const [showRequestEditModal, setShowRequestEditModal] = useState(false);
    const [showResponseEditModal, setShowResponseEditModal] = useState(false);
    // components
    // const { user } = useUser(); // Removed unused variable
    const token = useToken();
    const { isDarkMode } = useTheme();

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

    // Get PO No from URL (SSR-safe, Next.js App Router)
    const [poNo, setPoNo] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const router = useRouter();

    // Data state
    const [poData, setPoData] = useState<ReviewedPO | null>(null);

    // Pagination
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;
    const totalRows = poData?.po_lists?.length || 0;
    const totalPages = Math.ceil(totalRows / rowsPerPage);
    const pagedParts = poData?.po_lists?.slice((page - 1) * rowsPerPage, page * rowsPerPage) || [];

    // Modal สำหรับอนุมัติ PO
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showPuValidatedModal, setShowPuValidatedModal] = useState(false);
    // const [approveReason, setApproveReason] = useState(""); // Removed unused variables
    // Modal สำหรับปฏิเสธ PO
    const [showRejectModal, setShowRejectModal] = useState(false);

    // Modal สำหรับแสดงรายละเอียดสินค้า
    // const [showPOModal, setShowPOModal] = useState(false);
    // const [selectedPart, setSelectedPart] = useState<POList | null>(null);

    // State สำหรับ modal EditVendor
    const [showEditVendor, setShowEditVendor] = useState(false);
    const [editVendorData, setEditVendorData] = useState<VendorSelected | null>(null);

    // State สำหรับ modal SendMail
    const [showSendMailModal, setShowSendMailModal] = useState(false);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const params = new URLSearchParams(window.location.search);
            setPoNo(params.get("id") || params.get("poNo"));
        }
    }, []);

    // Fetch PO Data
    // fetchData function for reload
    const fetchData = async () => {
        if (!poNo) {
            setError("ไม่พบ PO ID");
            setLoading(false);
            return;
        }
        try {
            setError("");
            setLoading(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/doc?poNo=${poNo}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("โหลดข้อมูล PO ไม่สำเร็จ");
            const data = await response.json();
            if (data.poDoc) {
                const poInfo = data.poDoc;
                if (!poInfo.po_lists) {
                    poInfo.po_lists = [];
                }
                setPoData(poInfo);
            } else {
                setError("ไม่พบข้อมูล PO ใน response");
            }
        } catch {
            setError("เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [poNo, token]);

    // NOTE: Check department access
    useEffect(() => {
        if (departmentId !== undefined && departmentId !== 10086) {
            alert('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
            router.replace(process.env.NEXT_PUBLIC_PURCHASE_PR_REDIRECT || "/services/purchase");
        }
    }, [departmentId, router]);


    // NOTE: Handler
    const handleValidated = async (reason: string) => {
        const payload = {
            po_id: poData?.po_id,
            reason,
        };
        console.log("Validated payload:", payload);
        try {
            // Step 1: Approve PO
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/validate-by-pu`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error("ออก PO ไม่สำเร็จ");
            await response.json();
            //Step 2: Send PO to vendor

            // const sendResponse = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/send-to-vendor/${poData?.po_id}`, {
            //     method: 'PUT',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         Authorization: `Bearer ${token}`
            //     },
            //     body: JSON.stringify(sendPayload)
            // });
            // if (!sendResponse.ok) throw new Error('ส่ง PO ไปยัง Vendor ไม่สำเร็จ');
            alert('ออก PO สำเร็จ');
            setShowPuValidatedModal(false);
            // reload PO data
            await fetchData();
        } catch {
            alert('เกิดข้อผิดพลาดในการออก PO');
        }
    };

    const handleApprove = async (reason: string) => {
        const payload = {
            po_id: poData?.po_id,
            reason,
        };
        console.log("Approve payload:", payload);
        try {
            // Step 1: Approve PO
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/approve/${poData?.po_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error("อนุมัติ PO ไม่สำเร็จ");
            await response.json();
            //Step 2: Send PO to vendor

            // const sendResponse = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/send-to-vendor/${poData?.po_id}`, {
            //     method: 'PUT',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         Authorization: `Bearer ${token}`
            //     },
            //     body: JSON.stringify(sendPayload)
            // });
            // if (!sendResponse.ok) throw new Error('ส่ง PO ไปยัง Vendor ไม่สำเร็จ');
            alert('อนุมัติ PO สำเร็จ');
            setShowApproveModal(false);
            // reload PO data
            await fetchData();
        } catch {
            alert('เกิดข้อผิดพลาดในการอนุมัติ PO');
        }
    };

    const handleReject = async (reason: string) => {
        const payload = {
            po_id: poData?.po_id,
            reason,
        };
        console.log("Reject payload:", payload);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/reject`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error("ปฏิเสธ PO ไม่สำเร็จ");
            await response.json();
            alert('ปฏิเสธ PO สำเร็จ');
            //setShowRejectModal(false);
            // reload PO data
            await fetchData();
        } catch {
            alert('เกิดข้อผิดพลาดในการปฏิเสธ PO');
        }
    };

    const handleSendMail = async (sendMail: boolean) => {
        if (!sendMail) {
            // ถ้าเลือกไม่ส่งเมล แค่บันทึกข้อมูล
            alert('บันทึกข้อมูลเรียบร้อย');
            return;
        }

        // try {
        //     const payload = {
        //         po_id: poData?.po_id,

        //     };

        //     const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/send-mail/${poData?.po_id}`, {
        //         method: 'PUT',
        //         headers: {
        //             'Content-Type': 'application/json',
        //             Authorization: `Bearer ${token}`
        //         },
        //         body: JSON.stringify(payload)
        //     });

        //     if (!response.ok) throw new Error('ส่งอีเมลไม่สำเร็จ');



        //     // reload PO data
        //     await fetchData();
        // } catch (error) {
        //     alert('เกิดข้อผิดพลาดในการส่งอีเมล');
        //     console.error('Send mail error:', error);
        // }
    };

    // TODO: PDF
    // Preview PDF: ใช้ Authorization header (Bearer token) เพื่อไม่ให้ token อยู่ใน URL
    // หมายเหตุ: GET ไม่สามารถส่ง body ที่ browser ยอมรับได้ ดังนั้นใช้ header แทน
    const previewPoPdf = async (po_no: string) => {
        if (!token) {
            alert('ไม่พบ token กรุณาเข้าสู่ระบบใหม่');
            return;
        }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PDF_SERVICE}/preview_pdf/${po_no}`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener');
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (err) {
            console.error('previewPoPdf error:', err);
            // Fallback
            // window.open(`${process.env.NEXT_PUBLIC_ROOT_PATH_PDF_SERVICE}/preview/${po_no}?token=${token}`, '_blank');
        }
    }

    // Download PDF: ใช้ Authorization header + Blob เพื่อไม่ให้ token อยู่ใน URL
    const downloadPoPdf = async (po_no: string) => {
        if (!token) {
            alert('ไม่พบ token กรุณาเข้าสู่ระบบใหม่');
            return;
        }
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PDF_SERVICE}/generate_pdf/${po_no}`, {
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
            a.download = `PO_${po_no}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 60000);
        } catch (err) {
            console.error('downloadPoPdf error:', err);
            // Fallback: ถ้า backend ยังไม่รองรับ header ใช้แบบเดิม (token ใน URL)
            // window.open(`${process.env.NEXT_PUBLIC_ROOT_PATH_PDF_SERVICE}/download/${po_no}/${token}`, '_blank', 'noopener');
        }
    }

    const { isCollapsed } = useSidebar();
    if (loading) return <div className="flex items-center justify-center min-h-screen"><div className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>กำลังโหลดข้อมูล...</div></div>;
    if (error) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg text-red-500">{error}</div></div>;
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
                {poData ? (
                    <div className="max-w-none w-full space-y-6">
                        {/* Modern Header Section with Gradient */}
                        <div className={`relative overflow-hidden rounded-2xl border ${isDarkMode ? 'bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-green-900/20 border-green-700/30' : 'bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 border-green-200/50'}`}>
                            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
                            <div className="relative p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-lg ${isDarkMode ? 'bg-gradient-to-br from-green-600 to-emerald-700' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
                                            <HiDocumentText className="h-8 w-8 text-white" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    PO #{poData.po_no}
                                                </h1>
                                                {(poData.rejected_by && !poData.edited_at && !poData.edit_reason) ? (
                                                    // 1. ปฏิเสธ = rejected_by มีข้อมูล
                                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-red-900/30 border-red-700/60 text-red-200' : 'bg-red-50 border-red-300 text-red-800'}`}>
                                                        <svg className={`w-4 h-4 ${isDarkMode ? 'text-red-200' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                        ปฏิเสธ
                                                    </span>
                                                ) : (!poData.pu_validated && !poData.edited_res) || (!poData.pu_validated && !poData.edited_res && poData.rejected_by) ? (
                                                    // 0. รอการตรวจสอบ = ไม่มีข้อมูลใดๆ
                                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-neutral-900/30 border-neutral-700/60 text-neutral-200' : 'bg-neutral-50 border-neutral-300 text-neutral-800'}`}>
                                                        {/* <svg className={`w-4 h-4 ${isDarkMode ? 'text-neutral-200' : 'text-neutral-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                                                        </svg> */}
                                                        <FaRegCircleQuestion className={`w-4 h-4`} />รอการตรวจสอบ
                                                    </span>
                                                ) : (poData.pu_validated && !poData.edited_at && !poData.approved_by) || (poData.pu_validated && poData.edited_at && !poData.approved_by) || (poData.pu_validated && poData.edited_at && !poData.approved_by && poData.rejected_by) ? (
                                                    // 2. รอดำเนินการ = pu_validated มีข้อมูล
                                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-yellow-900/30 border-yellow-700/60 text-yellow-200' : 'bg-yellow-50 border-yellow-400 text-yellow-800'}`}>
                                                        {/* <svg className={`w-4 h-4 ${isDarkMode ? 'text-yellow-200' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                                                        </svg> */}
                                                        <TbProgressCheck className={`w-4 h-4`} />รอการอนุมัติ
                                                    </span>
                                                ) : (poData.approved_by && poData.edited_at) || (poData.approved_by && !poData.edited_at && !poData.edit_reason) || (poData.approved_by && poData.edited_at && poData.rejected_by) && (poData.approved_by && poData.edited_at && poData.rejected_by && !poData.edit_reason) ? (
                                                    // 3. อนุมัติเสร็จสิ้น = approved_by มีข้อมูล
                                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-green-900/30 border-green-700/60 text-green-200' : 'bg-green-50 border-green-500 text-green-900'}`}>
                                                        <svg className={`w-4 h-4 ${isDarkMode ? 'text-green-200' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                        อนุมัติเสร็จสิ้น
                                                    </span>
                                                ) : (poData.edit_reason && !poData.edited_res) ? (
                                                    // 4. ดำเนินการแก้ไข = edited_res มีข้อมูล
                                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-orange-900/30 border-orange-700/60 text-orange-200' : 'bg-orange-50 border-orange-400 text-orange-800'}`}>
                                                        {/* <svg className={`w-4 h-4 ${isDarkMode ? 'text-orange-200' : 'text-orange-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                                                        </svg> */}
                                                        <TbSettingsQuestion className={`w-4 h-4`} />ร้องขอการแก้ไข
                                                    </span>
                                                ) : (poData.edited_res && !poData.edited_at && !poData.rejected_by) ? (
                                                    // 4. ดำเนินการแก้ไข = edited_res มีข้อมูล
                                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm ${isDarkMode ? 'bg-rose-900/30 border-rose-700/60 text-rose-200' : 'bg-rose-50 border-rose-400 text-rose-800'}`}>
                                                        {/* <svg className={`w-4 h-4 ${isDarkMode ? 'text-orange-200' : 'text-orange-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
                                                        </svg> */}
                                                        <IoSettingsOutline className={`w-4 h-4`} />ดำเนินการแก้ไข
                                                    </span>
                                                ) : poData.edited_at ? (
                                                    // 5. แก้ไขเสร็จสิ้น = edited_at มีข้อมูล
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
                                            <div className={`flex items-center gap-4 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                                <div className="flex items-center gap-2">
                                                    <BsCalendar2Event className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                                    <span>{new Date(poData.po_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                </div>
                                                <div className={`w-1 h-1 rounded-full ${isDarkMode ? 'bg-slate-600' : 'bg-gray-400'}`}></div>
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{poData.po_lists?.length || 0}</span>
                                                    <span>รายการสินค้า</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        {/* 1. แสดงปุ่ม ออก PO และ ยกเลิก เมื่อ pu_validated ไม่มีข้อมูล หรือ เมื่อแก้ไขเสร็จแล้ว (edited_at มีข้อมูล) */}
                                        {roleID === 4 && (!poData.pu_validated && !poData.edited_at && !poData.edited_res && !poData.rejected_by) || (!poData.pu_validated && poData.edited_at && poData.edited_res) || (!poData.pu_validated && poData.edited_at && !poData.edited_res && poData.rejected_by) ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className={`px-6 py-2.5 rounded-lg cursor-pointer font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 ${isDarkMode ? 'bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-600 hover:to-green-500 text-white' : 'bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-600 text-white'}`}
                                                    onClick={() => setShowPuValidatedModal(true)}
                                                >
                                                    ออก PO
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`px-6 py-2.5 rounded-lg cursor-pointer font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 ml-2 ${isDarkMode ? 'bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 text-white' : 'bg-gradient-to-r from-red-500 to-red-400 hover:from-red-600 hover:to-red-600 text-white'}`}
                                                    onClick={() => setShowRejectModal(true)}
                                                >
                                                    ยกเลิก
                                                </button>
                                                <PuValidatedModal
                                                    open={showPuValidatedModal}
                                                    onClose={() => setShowPuValidatedModal(false)}
                                                    onConfirm={(reason) => handleValidated(reason)}
                                                    poNo={poNo}
                                                />
                                                <RejectPOModal
                                                    open={showRejectModal}
                                                    onClose={() => setShowRejectModal(false)}
                                                    onConfirm={(reason) => handleReject(reason)}
                                                    poNo={poNo}
                                                />
                                            </>
                                        ) : null}

                                        {/* 2. แสดงปุ่ม อนุมัติ และ ปฏิเสธ เมื่อ pu_validated มีข้อมูลแต่ยังไม่ได้อนุมัติหรือปฏิเสธ */}
                                        {roleID === 5 && (poData.pu_validated && !poData.approved_by) ? (
                                            <>
                                                <button
                                                    type="button"
                                                    className={`px-6 py-2.5 rounded-lg cursor-pointer font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 ${isDarkMode ? 'bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-600 hover:to-green-500 text-white' : 'bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-600 text-white'}`}
                                                    onClick={() => setShowApproveModal(true)}
                                                >
                                                    ✔ อนุมัติ
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`px-6 py-2.5 rounded-lg cursor-pointer font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 ml-2 ${isDarkMode ? 'bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 text-white' : 'bg-gradient-to-r from-red-500 to-red-400 hover:from-red-600 hover:to-red-600 text-white'}`}
                                                    onClick={() => setShowRejectModal(true)}
                                                >
                                                    ✖ ปฏิเสธ
                                                </button>
                                                <ApprovePOModal
                                                    open={showApproveModal}
                                                    onClose={() => setShowApproveModal(false)}
                                                    onConfirm={(reason) => handleApprove(reason)}
                                                    poNo={poNo}
                                                />
                                                <RejectPOModal
                                                    open={showRejectModal}
                                                    onClose={() => setShowRejectModal(false)}
                                                    onConfirm={(reason) => handleReject(reason)}
                                                    poNo={poNo}
                                                />
                                            </>
                                        ) : null}

                                        {/* 3. แสดงปุ่ม ส่งอีเมล และ ขอแก้ไข/อนุมัติการแก้ไข หลังจากอนุมัติแล้ว */}
                                        {((poData.approved_by && !poData.rejected_by) || (poData.approved_by && poData.rejected_by)) ? (
                                            <div className="flex items-center gap-3 ml-3">
                                                {/* Send Mail Button - แสดงเฉพาะเมื่อยังไม่ได้ส่งเมลและยังไม่มี edited_res */}
                                                {!poData.mail_out_date ? (
                                                    <div className="relative group">
                                                        <button
                                                            type="button"
                                                            className={`relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform group hover:scale-105 flex items-center gap-2 overflow-hidden
                                                                ${isDarkMode
                                                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg hover:shadow-emerald-500/25 hover:from-emerald-500 hover:to-teal-500'
                                                                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-emerald-500/30 hover:from-emerald-600 hover:to-teal-600'}
                                                            `}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowSendMailModal(true);
                                                            }}
                                                        >
                                                            {/* Animated background overlay */}
                                                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>

                                                            {/* Icon */}
                                                            <div className="relative z-10 flex items-center justify-center w-5 h-5">
                                                                <span className="relative w-6 h-6 flex items-center justify-center">
                                                                    {/* Default icon */}
                                                                    <LuMail className="h-5 w-5 transition-all duration-300 group-hover:-rotate-12 group-hover:scale-125 absolute inset-0 opacity-100 group-hover:opacity-0 z-10" />
                                                                    {/* Hover icon */}
                                                                    <RiMailSendLine className="h-5 w-5 transition-all duration-300 absolute inset-0 opacity-0 group-hover:opacity-100 group-hover:-rotate-12 group-hover:scale-125 z-10" />
                                                                </span>
                                                            </div>

                                                            {/* Text */}
                                                            <span className="relative z-10 text-sm font-semibold">ส่งอีเมล</span>

                                                            {/* Pulse effect */}
                                                            <div className="absolute inset-0 rounded-xl bg-emerald-400 opacity-0 group-hover:opacity-20 group-hover:animate-ping transition-opacity duration-300"></div>
                                                        </button>

                                                        {/* Status indicator */}
                                                        <div className={`absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 ${isDarkMode ? 'border-slate-800 bg-orange-400' : 'border-white bg-orange-500'}`}>
                                                            <div className="w-full h-full rounded-full bg-current animate-pulse"></div>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                {/* Request Edit Button หรือ Response Edit Button */}
                                                {roleID === 5 && poData.edit_reason && !poData.edited_res && (
                                                    <div className="relative group">
                                                        <button
                                                            type="button"
                                                            className={`relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform group hover:scale-105 flex items-center gap-2 overflow-hidden
                                                                ${isDarkMode
                                                                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg hover:shadow-amber-500/25 hover:from-amber-500 hover:to-orange-500'
                                                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-amber-500/30 hover:from-amber-600 hover:to-orange-600'}
                                                            `}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowResponseEditModal(true);
                                                            }}
                                                        >
                                                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                                            <div className="relative z-10 flex items-center justify-center w-5 h-5">
                                                                <BiQuestionMark className="h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                                                            </div>
                                                            <span className="relative z-10 text-sm font-semibold">อนุมัติการแก้ไข</span>
                                                            <div className="absolute inset-0 rounded-xl bg-amber-400 opacity-0 group-hover:opacity-20 group-hover:animate-ping transition-opacity duration-300"></div>
                                                        </button>
                                                    </div>
                                                )}
                                                {roleID === 4 && (!poData.edit_reason || poData.edited_res) && (
                                                    <div className="relative group">
                                                        <button
                                                            type="button"
                                                            className={`relative px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform group hover:scale-105 flex items-center gap-2 overflow-hidden
                                                                ${isDarkMode
                                                                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg hover:shadow-amber-500/25 hover:from-amber-500 hover:to-orange-500'
                                                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg hover:shadow-amber-500/30 hover:from-amber-600 hover:to-orange-600'}
                                                            `}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setShowRequestEditModal(true);
                                                            }}
                                                        >
                                                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                                            <div className="relative z-10 flex items-center justify-center w-5 h-5">
                                                                <BiQuestionMark className="h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
                                                            </div>
                                                            <span className="relative z-10 text-sm font-semibold">ขอแก้ไข</span>
                                                            <div className="absolute inset-0 rounded-xl bg-amber-400 opacity-0 group-hover:opacity-20 group-hover:animate-ping transition-opacity duration-300"></div>
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>

                                </div>
                            </div>
                        </div>

                        {!poData.edited_at && (poData.edit_reason ? (
                            <div className={`px-4 py-3 mb-3 ml-5 mr-5 rounded-lg border ${isDarkMode ? 'bg-yellow-900/30 border-yellow-800/50 text-yellow-200' : 'bg-yellow-50 border-yellow-200 text-yellow-700'}`}>
                                <div className="flex items-start gap-2">
                                    <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <span className={`font-semibold ${isDarkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>เหตุผลในการขอแก้ไข : </span>
                                        <span className={isDarkMode ? 'text-yellow-100' : 'text-yellow-700'}>{poData.edit_reason}</span>
                                    </div>
                                </div>
                            </div>
                        ) : null)}

                        {poData.reject_reason && !poData.edited_at && poData.edited_res && (poData.reject_reason ? (
                            <div className={`px-4 py-3 mb-3 ml-5 mr-5 rounded-lg border ${isDarkMode ? 'bg-red-900/30 border-red-800/50 text-red-200' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                <div className="flex items-start gap-2">
                                    <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <span className={`font-semibold ${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>เหตุผลในการปฏิเสธ : </span>
                                        <span className={isDarkMode ? 'text-red-100' : 'text-red-700'}>{poData.reject_reason}</span>
                                    </div>
                                </div>
                            </div>
                        ) : null)}

                        {/* Two-Section Layout: Info Cards + Financial Summary */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            {/* Left Section - Vendor & Delivery Info (2 columns) */}
                            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Vendor Information Card */}
                                <div className={`rounded-xl border shadow-sm hover:shadow-md transition-shadow ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
                                    <div className={`px-5 py-4 border-b flex justify-between rounded-t-2xl ${isDarkMode ? 'border-slate-700/50 bg-slate-800/30' : 'border-gray-100 bg-gray-50/50'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                                                <LuBriefcaseBusiness className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                            </div>
                                            <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>ข้อมูลผู้ขาย</h3>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {/* Hide edit vendor button if status is approved or rejected */}
                                            {!(poData.approved_by || poData.rejected_by) && (
                                                <button
                                                    type="button"
                                                    className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer focus:outline-none
                                                        ${isDarkMode ? 'bg-sky-900 text-sky-200 hover:bg-sky-800' : 'bg-sky-100 text-sky-700 hover:bg-sky-200'}
                                                    `}
                                                    style={{ boxShadow: 'none', border: 'none', padding: 0 }}
                                                    title="แก้ไขข้อมูลผู้ขาย"
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        setEditVendorData({
                                                            ID: poData.vendor_id,
                                                            vendor_code: poData.vendor_code,
                                                            vendor_name: poData.vendor_name,
                                                            tax_id: poData.tax_id ?? null,
                                                            credit_term: poData.credit_term,
                                                            tel_no: poData.tel_no,
                                                            fax_no: poData.fax_no ?? '',
                                                            contact_person: poData.contact_name ?? '',
                                                            email: poData.email ?? '',
                                                        });
                                                        setShowEditVendor(true);
                                                    }}
                                                >
                                                    <MdOutlineEdit className="h-5 w-5" />
                                                    <span className="sr-only">Edit Vendor Information</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-5 space-y-3">
                                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900/50 border border-blue-600/30' : 'bg-blue-50/70 border border-blue-200'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>ผู้ขาย</span>
                                                <span className={`text-sm font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>{poData.vendor_code} | {poData.vendor_name}</span>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900/30' : 'bg-gray-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>เลขผู้เสียภาษี</span>
                                                <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{poData.tax_id}</span>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900/30' : 'bg-gray-50'}`}>
                                            <div className="grid grid-cols-2 gap-0">
                                                <div className="flex items-center gap-2 pr-6 border-r-2 border-dashed border-gray-300 dark:border-slate-700">
                                                    <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>โทรศัพท์</span>
                                                    <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{
                                                        poData.tel_no && typeof poData.tel_no === 'string' && poData.tel_no.includes(',')
                                                            ? poData.tel_no.split(',').map((item, idx) => (
                                                                <span key={`tel-${idx}`} className="block">{item.trim()}</span>
                                                            ))
                                                            : poData.tel_no
                                                    }</span>
                                                </div>
                                                <div className="flex items-center gap-2 pl-6 flex justify-end">
                                                    <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>แฟกซ์</span>
                                                    <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{
                                                        poData.fax_no && typeof poData.fax_no === 'string' && poData.fax_no.includes(',')
                                                            ? poData.fax_no.split(',').map((item, idx) => (
                                                                <span key={`fax-${idx}`} className="block">{item.trim()}</span>
                                                            ))
                                                            : (poData.fax_no || '-')
                                                    }</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900/30' : 'bg-gray-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>ผู้ติดต่อ</span>
                                                <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{poData.contact_name}</span>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900/50 border border-emerald-600/30' : 'bg-emerald-50/70 border border-emerald-200'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>เครดิตเทอม</span>
                                                <span className={`text-sm font-medium ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>{poData.credit_term}</span>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900/30' : 'bg-gray-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>อีเมล</span>
                                                <span className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>{
                                                    poData.email && typeof poData.email === 'string' && poData.email.includes(',')
                                                        ? poData.email.split(',').map((item, idx) => (
                                                            <span key={`email-${idx}`} className="block">{item.trim()}</span>
                                                        ))
                                                        : poData.email
                                                }</span>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900/30' : 'bg-gray-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>ที่อยู่</span>
                                                <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                                    {poData.addr1}
                                                    {poData.addr2 && (
                                                        <span className="inline-flex items-center gap-1 ml-2 relative group">
                                                            <span
                                                                className={`px-2 py-0.5 rounded text-xs font-medium cursor-help transition-all duration-200 ${isDarkMode ? 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/50' : 'bg-gray-200/60 text-gray-600 border border-gray-300/40 hover:bg-gray-300/60 hover:border-gray-400/50'}`}
                                                            >
                                                                +1
                                                            </span>
                                                            {/* Tooltip */}
                                                            <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50 shadow-lg ${isDarkMode ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-gray-800 text-white'}`}>
                                                                {poData.addr2}
                                                                <span className={`absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent ${isDarkMode ? 'border-t-slate-700' : 'border-t-gray-800'}`}></span>
                                                            </span>
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Delivery & PO Info Card */}
                                <div className={`rounded-xl border shadow-sm hover:shadow-md transition-shadow ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
                                    <div className={`px-5 py-4 border-b rounded-t-2xl ${isDarkMode ? 'border-slate-700/50 bg-slate-800/30' : 'border-gray-100 bg-gray-50/50'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-orange-500/10' : 'bg-orange-50'}`}>
                                                <IoDocumentTextOutline className={`h-5 w-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                                            </div>
                                            <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>ข้อมูลจัดส่ง & PO</h3>
                                        </div>
                                    </div>
                                    <div className="p-5 space-y-3">
                                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900/50 border border-orange-600/30' : 'bg-orange-50/70 border border-orange-200'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>สถานที่จัดส่ง</span>
                                                <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{poData.delivery_place}</span>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900/30' : 'bg-gray-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>วันที่จัดส่ง</span>
                                                <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                                    {(() => {
                                                        if (!poData.po_lists || poData.po_lists.length === 0) return '-';
                                                        const latestDeliDate = poData.po_lists
                                                            .filter(item => item.deli_date)
                                                            .map(item => new Date(item.deli_date))
                                                            .sort((a, b) => b.getTime() - a.getTime())[0];
                                                        return latestDeliDate ? latestDeliDate.toLocaleDateString('th-TH') : '-';
                                                    })()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900/30' : 'bg-gray-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>วันที่ส่งเมล</span>
                                                <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                                    {poData.mail_out_date ? new Date(poData.mail_out_date).toLocaleDateString('th-TH') : '-'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900/30' : 'bg-gray-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>แผนกผู้ขอ</span>
                                                <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{poData.dept_request}</span>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900/30' : 'bg-gray-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>ผู้จัดทำ</span>
                                                <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{poData.issued_by || '-'}</span>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900/30' : 'bg-gray-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>ผู้อนุมัติ</span>
                                                <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{poData.approved_by || '-'}</span>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900/50 border border-amber-600/30' : 'bg-amber-50/70 border border-amber-200'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>หมายเหตุ</span>
                                                <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{poData.remark}</span>
                                            </div>
                                        </div>
                                        {/* {poData.remark && (
                                            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900/50 border border-amber-600/30' : 'bg-amber-50/70 border border-amber-200'}`}>
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-medium ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>หมายเหตุ</span>
                                                    <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{poData.remark}</span>
                                                </div>
                                            </div>
                                        )} */}
                                    </div>
                                </div>
                            </div>

                            {/* Right Section - Financial Summary */}
                            <div className={`rounded-xl border shadow-sm hover:shadow-md transition-shadow ${isDarkMode ? 'bg-gradient-to-br from-green-900/20 via-slate-800/50 to-emerald-900/20 border-slate-700/50' : 'bg-gradient-to-br from-green-50 via-white to-emerald-50 border-gray-200'}`}>
                                <div className={`px-5 py-4 border-b rounded-t-2xl ${isDarkMode ? 'border-slate-700/50 bg-slate-800/30' : 'border-gray-100 bg-gray-50/50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-green-500/10' : 'bg-green-50'}`}>
                                            <MdAttachMoney className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                        </div>
                                        <h3 className={`font-semibold text-lg ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>สรุปการเงิน</h3>
                                    </div>
                                </div>

                                <div className="p-5 space-y-5">
                                    {/* Grand Total Display */}
                                    <div className={`text-center p-6 rounded-xl ${isDarkMode ? 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20' : 'bg-gradient-to-br from-green-100 to-emerald-100 border border-green-200'}`}>
                                        <p className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>ยอดรวมสุทธิ</p>
                                        <p className={`text-4xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                                            ฿{(poData.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>

                                    {/* Breakdown */}
                                    <div className={`space-y-3 p-4 rounded-xl ${isDarkMode ? 'bg-slate-900/50' : 'bg-white/70'}`}>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>รวมรายการ</span>
                                            <span className={`text-sm font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                                {(poData.sub_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>ส่วนลดท้ายบิล</span>
                                            <span className={`text-sm font-bold ${isDarkMode ? 'text-red-300' : 'text-red-600'}`}>
                                                - {(poData.ext_discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>ราคาหลังหักส่วนลด</span>
                                            <span className={`text-sm font-bold ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                                                {(poData.total_minus_discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>VAT 7%</span>
                                            <span className={`text-sm font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                                                + {(poData.vat || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                        <div className={`border-t pt-3 mt-2 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                                            <div className="flex justify-between items-center">
                                                <span className={`font-bold ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>รวมสุทธิ</span>
                                                <span className={`text-lg font-bold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                                                    {(poData.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Modern Table Section */}
                        <div className={`rounded-2xl overflow-hidden border shadow-md ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
                            <div className={`px-6 py-5 ${isDarkMode ? 'border-slate-700/50 bg-slate-800/30' : 'border-gray-100 bg-gray-50/50'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>รายการสินค้า</h2>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isDarkMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                            {poData.po_lists?.length ?? 0} รายการ
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex gap-0">
                                            <button
                                                className={`flex items-center cursor-pointer justify-center rounded-l-lg px-4 py-2 text-lg font-medium transition ${isDarkMode ? 'text-emerald-400 bg-emerald-900/20 border border-emerald-800/50 hover:bg-emerald-800/30' : 'text-green-600 bg-green-50 border border-green-100 hover:bg-green-100'}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    previewPoPdf(String(poData.po_no));
                                                }}
                                            >
                                                <MdOutlineRemoveRedEye className="w-7 h-7" />
                                            </button>
                                            <button
                                                className={`flex items-center cursor-pointer justify-center rounded-r-lg px-4 py-2 text-lg font-medium transition ${isDarkMode ? 'text-red-400 bg-red-900/20 border border-red-800/50 hover:bg-red-800/30' : 'text-red-400 bg-red-50 border border-red-100 hover:bg-red-100'}`}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                    downloadPoPdf(String(poData.po_no));
                                                }}
                                            >
                                                <GoDownload className="w-7 h-7" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* แสดงเหตุผลการปฏิเสธในส่วนหัวตาราง */}
                            {/* <div className={`px-4 py-3 mb-3 ml-5 mr-5 rounded-lg border ${isDarkMode ? 'bg-red-900/30 border-red-800/50 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                <div className="flex items-start gap-2">
                                    <svg className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <span className={`font-semibold ${isDarkMode ? 'text-red-200' : 'text-red-800'}`}>เหตุผลในการปฏิเสธ : </span>
                                        <span className={isDarkMode ? 'text-red-300' : 'text-red-700'}>{poData.reason_reject}</span>
                                    </div>
                                </div>
                            </div> */}

                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead className={isDarkMode ? 'bg-slate-900/50' : 'bg-gray-50'}>
                                        <tr>
                                            <th className={`px-4 py-4 text-center text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>#</th>
                                            <th className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Part No.</th>
                                            <th className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Product Code</th>
                                            <th className={`px-4 py-4 text-left text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Part Name</th>
                                            <th className={`px-4 py-4 text-center text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>PR/SO</th>
                                            <th className={`px-4 py-4 text-center text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>จำนวน</th>
                                            <th className={`px-4 py-4 text-center text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>หน่วย</th>
                                            <th className={`px-4 py-4 text-right text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>ราคา/หน่วย</th>
                                            <th className={`px-4 py-4 text-center text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>ส่วนลด</th>
                                            <th className={`px-4 py-4 text-right text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>รวม</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700/50' : 'divide-gray-200'}`}>
                                        {pagedParts.map((part, idx) => (
                                            <React.Fragment key={part.part_no + '-frag-' + ((page - 1) * rowsPerPage + idx)}>
                                                <tr key={part.part_no + '-row-' + ((page - 1) * rowsPerPage + idx)}
                                                    className={`transition-all duration-200 ${isDarkMode ? 'bg-slate-900/50  border-l-orange-400' : 'bg-white border-l-orange-400/70'}
                                                        ${!(poData.approved_by || poData.rejected_by) ? (isDarkMode ? 'hover:bg-slate-800/90 hover:shadow-md hover:shadow-sky-400/30' : 'hover:bg-teal-100/50 hover:shadow-md hover:shadow-sky-400/30') : 'cursor-not-allowed opacity-60'}
                                                    `}
                                                // className={`transition-all duration-200 ${isDarkMode ? 'bg-slate-700/80 border-l-orange-400' : 'bg-white border-l-orange-400/70'}
                                                //     ${!(poData.approved_by || poData.rejected_by) ? (isDarkMode ? 'cursor-pointer hover:bg-slate-600/90 hover:shadow-xl hover:shadow-orange-400/30' : 'cursor-pointer hover:bg-amber-100 hover:shadow-xl hover:shadow-orange-200/30') : 'cursor-not-allowed opacity-60'}
                                                // `}
                                                // onClick={() => {
                                                //     if (!(poData.approved_by || poData.rejected_by)) {
                                                //         setSelectedPart(part);
                                                //         setShowPOModal(true);
                                                //     }
                                                // }}
                                                >
                                                    <td className={`px-4 py-4 text-center text-sm font-bold ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`}>
                                                        {(page - 1) * rowsPerPage + idx + 1}
                                                    </td>
                                                    <td className={`px-4 py-4 text-sm font-bold ${isDarkMode ? 'text-orange-300' : 'text-orange-700'}`}>
                                                        {part.part_no}
                                                    </td>
                                                    <td className={`px-4 py-4 text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {part.prod_code}
                                                    </td>
                                                    <td className={`px-4 py-4 text-sm font-semi ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {part.part_name}
                                                    </td>
                                                    <td className={`px-4 py-4 text-center text-sm font-bold ${isDarkMode ? 'text-sky-300' : 'text-sky-700'}`}>
                                                        {part.pr_no}
                                                    </td>
                                                    <td className={`px-4 py-4 text-center text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        {part.qty}
                                                    </td>
                                                    <td className={`px-4 py-4 text-center text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                                        {part.unit}
                                                    </td>
                                                    <td className={`px-4 py-4 text-right text-sm font-bold ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                                                        ฿{part.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                    <td className={`px-4 py-4 text-center text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                                                        {Array.isArray(part.discount) && part.discount.length ? (
                                                            <div
                                                                className={`inline-block px-1 py-2 rounded-lg border shadow-sm group relative ${isDarkMode ? 'bg-yellow-950/60 border-yellow-900' : 'bg-yellow-50 border-yellow-200'}`}
                                                                style={{ maxWidth: '100%', overflow: 'hidden', wordBreak: 'break-word', overflowWrap: 'break-word', cursor: 'pointer' }}
                                                            >
                                                                <div className="flex flex-col gap-1 justify-center items-center w-full">
                                                                    {Array.from({ length: Math.ceil(part.discount.length / 3) }, (_, rowIdx) => (
                                                                        <div key={`discount-row-${rowIdx}`} className="flex flex-row gap-1 justify-center items-center w-full">
                                                                            {part.discount.slice(rowIdx * 3, rowIdx * 3 + 3).map((d, i) => (
                                                                                <span
                                                                                    key={`discount-${rowIdx}-${i}`}
                                                                                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shadow-sm flex-shrink-0 ${isDarkMode ? 'bg-yellow-900/80 text-yellow-300' : 'bg-yellow-100 text-yellow-700'}`}
                                                                                    style={{ minWidth: '1.75rem', minHeight: '1.75rem' }}
                                                                                >
                                                                                    {d}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                {/* Tooltip ส่วนลดทั้งหมด */}
                                                                <div
                                                                    className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-10 opacity-0 group-hover:opacity-100 pointer-events-none bg-black/90 text-white text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg transition-opacity duration-200"
                                                                >
                                                                    {part.discount.map(d => `${d}%`).join(', ')}
                                                                </div>
                                                            </div>
                                                        ) : (part.discount ? `${part.discount}` : '-')}
                                                    </td>
                                                    <td className={`px-4 py-4 text-right text-sm font-bold ${isDarkMode ? 'text-green-200' : 'text-green-700'}`}>
                                                        ฿{part.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                                {/* Freebie items rows */}
                                                {Array.isArray(part.free_item) && part.free_item.length > 0 && (
                                                    part.free_item.map((item, i) => (
                                                        <tr key={`${part.part_no}-freebie-${item.part_no || ''}-${i}-${idx}`} className={`${isDarkMode ? 'bg-slate-800/30' : 'bg-gray-50/80'}`}>
                                                            <td className={`px-4 py-2 text-center text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-slate-700/70 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
                                                                    ของแถม
                                                                </span>
                                                            </td>
                                                            <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                                                {(() => {
                                                                    // แยก part_no จาก format: part_no|part_name|prod_code
                                                                    if (item.part_no && item.part_no.includes('|')) {
                                                                        return item.part_no.split('|')[0];
                                                                    }
                                                                    return item.part_no;
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
                                                            <td className={`px-4 py-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
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
                                                                    {item.remark && (
                                                                        <div className={`text-xs italic leading-tight ${isDarkMode ? 'text-slate-400/80' : 'text-gray-500/80'}`}>
                                                                            หมายเหตุ: {item.remark}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className={`px-4 py-2 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>

                                                            </td>
                                                            <td className={`px-4 py-2 text-center text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                                                                {item.qty}
                                                            </td>
                                                            <td className={`px-4 py-2 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                                {part.unit}
                                                            </td>
                                                            <td className={`px-4 py-2 text-right text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>

                                                            </td>
                                                            <td className={`px-4 py-2 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>

                                                            </td>
                                                            <td className={`px-4 py-2 text-right text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>

                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalRows > rowsPerPage && (
                                <div className={`px-6 py-4 border-t ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                                            แสดง {(page - 1) * rowsPerPage + 1} - {Math.min(page * rowsPerPage, totalRows)} จาก {totalRows} รายการ
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-150 ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'} ${isDarkMode ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-white text-gray-700 border border-gray-300'}`}
                                                onClick={() => page > 1 && setPage(page - 1)}
                                                disabled={page === 1}
                                            >
                                                ← ก่อนหน้า
                                            </button>
                                            <span className={`px-4 py-2 font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                                {page} / {totalPages}
                                            </span>
                                            <button
                                                type="button"
                                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-150 ${page === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'} ${isDarkMode ? 'bg-slate-700 text-slate-200 border border-slate-600' : 'bg-white text-gray-700 border border-gray-300'}`}
                                                onClick={() => page < totalPages && setPage(page + 1)}
                                                disabled={page === totalPages}
                                            >
                                                ถัดไป →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                            ไม่พบข้อมูล PO ที่ระบุ
                        </div>
                        <button
                            type="button"
                            className={`rounded-lg px-6 py-2 font-semibold border focus:outline-none transition-colors duration-150 cursor-pointer hover:shadow ${isDarkMode ? 'text-emerald-400 bg-slate-800 border-emerald-600/30 hover:bg-slate-700' : 'text-green-700 bg-white border-green-300 hover:bg-green-50'}`}
                            onClick={() => router.push(process.env.NEXT_PUBLIC_PURCHASE_PO_LIST_REDIRECT || "/services/purchase/PO")}
                        >
                            กลับไปยัง PO List
                        </button>
                    </div>
                )}
            </main>

            {showEditVendor && (
                <EditVendor
                    vendorData={editVendorData ? {
                        ...editVendorData,
                        tax_id: editVendorData.tax_id ?? undefined,
                        fax_no: editVendorData.fax_no ?? undefined,
                        email: editVendorData.email ?? undefined,
                        tel: editVendorData.tel_no ?? undefined,
                        contact_name: editVendorData.contact_person ?? undefined,
                    } : undefined}
                    source="ReviewedPO"
                    onCancel={() => setShowEditVendor(false)}
                    onConfirm={async () => {
                        setShowEditVendor(false);
                        if (typeof fetchData === 'function') await fetchData();
                        // setActiveTab('compare'); // ถ้ามี tab ให้ใช้งาน
                    }}
                />
            )}

            {/* Modal Components - วางไว้นอก container */}

            {showRequestEditModal && (
                <RequestEditPOModal
                    open={showRequestEditModal}
                    onClose={async () => {
                        setShowRequestEditModal(false);
                        await fetchData();
                    }}
                    poNo={poData?.po_no}
                />
            )}
            {showResponseEditModal && (
                <ResponseEditPOModal
                    open={showResponseEditModal}
                    onClose={async () => {
                        setShowResponseEditModal(false);
                        await fetchData();
                    }}
                    poNo={poData?.po_no}
                />
            )}

            {/* Send Mail Modal */}
            <SendMailModal
                open={showSendMailModal}
                onClose={() => setShowSendMailModal(false)}
                onConfirm={handleSendMail}
                poNo={poNo || ''}
            />

            {/* เพิ่มพื้นที่ว่างด้านล่าง */}
            <div className="h-10 md:h-7"></div>
        </div>
    );
}