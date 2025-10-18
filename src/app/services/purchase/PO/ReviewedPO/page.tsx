"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

//components
import { useToken } from "@/app/context/TokenContext";
import Sidebar from "@/app/components/sidebar";
import Header from "@/app/components/header";
import { useTheme } from "@/app/components/ThemeProvider";
import ApprovePOModal from "@/app/components/Modal/Approve_PO";
import POModal from "@/app/components/Modal/POModal";
import EditVendor from '@/app/components/Modal/EditVendor';
import RejectPOModal from "@/app/components/Modal/Reject_PO";

// icons
import { BsCalendar2Event } from "react-icons/bs";
import { MdAttachMoney } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import { LuBriefcaseBusiness } from "react-icons/lu";
import { HiDocumentText } from "react-icons/hi2";
import { FaRegEdit } from "react-icons/fa";

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
    po_lists: POList[];
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
    // components
    // const { user } = useUser(); // Removed unused variable
    const token = useToken();
    const { isDarkMode } = useTheme();

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
    // const [approveReason, setApproveReason] = useState(""); // Removed unused variables
    // Modal สำหรับปฏิเสธ PO
    const [showRejectModal, setShowRejectModal] = useState(false);

    // Modal สำหรับแสดงรายละเอียดสินค้า
    const [showPOModal, setShowPOModal] = useState(false);
    const [selectedPart, setSelectedPart] = useState<POList | null>(null);

    // State สำหรับ modal EditVendor
    const [showEditVendor, setShowEditVendor] = useState(false);
    const [editVendorData, setEditVendorData] = useState<VendorSelected | null>(null);

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


    // NOTE: Handler
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
            const sendPayload = {
                poId: poData?.po_id,
            }
            const sendResponse = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/send-to-vendor/${poData?.po_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(sendPayload)
            });
            if (!sendResponse.ok) throw new Error('ส่ง PO ไปยัง Vendor ไม่สำเร็จ');
            alert('อนุมัติ PO และส่งไปยัง Vendor สำเร็จ');
            setShowApproveModal(false);
            // reload PO data
            await fetchData();
        } catch {
            alert('เกิดข้อผิดพลาดในการอนุมัติ PO หรือส่งไปยัง Vendor');
        }
    };

    const handleReject = async (reason: string) => {
        const payload = {
            po_id: poData?.po_id,
            reason,
        };
        console.log("Reject payload:", payload);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/reject/${poData?.po_id}`, {
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

    if (loading) return <div className="flex items-center justify-center min-h-screen"><div className={`text-lg ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>กำลังโหลดข้อมูล...</div></div>;
    if (error) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg text-red-500">{error}</div></div>;

    return (
        <div className="min-h-screen">
            <Sidebar />
            <Header />
            <main
                className="mt-[7.5rem] mr-6 transition-all duration-300"
                style={{ minHeight: 'calc(100vh - 3rem)', position: 'relative', marginLeft: 'calc(18rem + 55px)' }}
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
                                                <div className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${!poData.issued_by ? (isDarkMode ? 'bg-gray-700 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-600 border border-gray-300') : poData.approved_by ? (isDarkMode ? 'bg-green-500/20 text-green-300 border border-green-500/30' : 'bg-green-100 text-green-700 border border-green-200') : poData.rejected_by ? (isDarkMode ? 'bg-red-500/20 text-red-200 border border-red-500/30' : 'bg-red-100 text-red-700 border border-red-200') : (isDarkMode ? 'bg-yellow-500/20 text-yellow-200 border border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border border-yellow-200')}`}>
                                                    {!poData.issued_by ? 'รอการตรวจสอบ' : poData.approved_by ? 'อนุมัติเสร็จสิ้น' : poData.rejected_by ? 'ปฏิเสธแล้ว' : 'รอดำเนินการ'}
                                                </div>
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
                                        {/* แสดงปุ่มอนุมัติ เฉพาะเมื่อยังไม่มี approved_by */}
                                        {!poData.approved_by && !poData.rejected_by && (
                                            <>
                                                <button
                                                    type="button"
                                                    className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 ${isDarkMode ? 'bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-600 hover:to-green-500 text-white' : 'bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-600 hover:to-green-600 text-white'}`}
                                                    onClick={() => setShowApproveModal(true)}
                                                >
                                                    ✔ อนุมัติ
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 ml-2 ${isDarkMode ? 'bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400 text-white' : 'bg-gradient-to-r from-red-500 to-red-400 hover:from-red-600 hover:to-red-600 text-white'}`}
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
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Two-Section Layout: Info Cards + Financial Summary */}
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            {/* Left Section - Vendor & Delivery Info (2 columns) */}
                            <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Vendor Information Card */}
                                <div className={`rounded-xl border shadow-sm hover:shadow-md transition-shadow ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
                                    <div className={`px-5 py-4 border-b flex justify-between ${isDarkMode ? 'border-slate-700/50 bg-slate-800/30' : 'border-gray-100 bg-gray-50/50'}`}>
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
                                                    className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-150 shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 border font-semibold ${isDarkMode ? 'bg-blue-500/10 border-blue-700 text-blue-400 hover:bg-blue-700/30 hover:text-white' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white'}`}
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
                                                    <FaRegEdit className="h-5 w-5" />
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
                                                    <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{poData.tel_no}</span>
                                                </div>
                                                <div className="flex items-center gap-2 pl-6 flex justify-end">
                                                    <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>แฟกซ์</span>
                                                    <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{poData.fax_no || '-'}</span>
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
                                                <span className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>{poData.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Delivery & PO Info Card */}
                                <div className={`rounded-xl border shadow-sm hover:shadow-md transition-shadow ${isDarkMode ? 'bg-slate-800/50 border-slate-700/50' : 'bg-white border-gray-200'}`}>
                                    <div className={`px-5 py-4 border-b ${isDarkMode ? 'border-slate-700/50 bg-slate-800/30' : 'border-gray-100 bg-gray-50/50'}`}>
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
                                                    {poData.delivery_date ? new Date(poData.delivery_date).toLocaleDateString('th-TH') : '-'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900/30' : 'bg-gray-50'}`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>วันที่ส่งเมล์</span>
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
                                        {poData.remark && (
                                            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-900/50 border border-amber-600/30' : 'bg-amber-50/70 border border-amber-200'}`}>
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-xs font-medium ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>หมายเหตุ</span>
                                                    <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{poData.remark}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Section - Financial Summary */}
                            <div className={`rounded-xl border shadow-sm hover:shadow-md transition-shadow ${isDarkMode ? 'bg-gradient-to-br from-green-900/20 via-slate-800/50 to-emerald-900/20 border-slate-700/50' : 'bg-gradient-to-br from-green-50 via-white to-emerald-50 border-gray-200'}`}>
                                <div className={`px-5 py-4 border-b ${isDarkMode ? 'border-slate-700/50 bg-slate-800/30' : 'border-gray-100 bg-gray-50/50'}`}>
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
                            <div className={`px-6 py-5 border-b ${isDarkMode ? 'border-slate-700/50 bg-slate-800/30' : 'border-gray-100 bg-gray-50/50'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>รายการสินค้า</h2>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isDarkMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                            {poData.po_lists?.length ?? 0} รายการ
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className={`px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg hover:scale-105 ${isDarkMode ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'}`}
                                        onClick={() => router.push("/services/purchase/PO")}
                                    >
                                        ← กลับไป PO List
                                    </button>
                                </div>
                            </div>

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
                                            <>
                                                <tr key={part.part_no + '-row-' + ((page - 1) * rowsPerPage + idx)}
                                                    className={`transition-all duration-200 ${isDarkMode ? 'bg-slate-700/80 border-l-orange-400' : 'bg-white border-l-orange-400/70'}
                                                        ${!(poData.approved_by || poData.rejected_by) ? 'cursor-pointer hover:bg-slate-600/90 hover:shadow-xl hover:shadow-orange-400/30' : 'cursor-not-allowed opacity-60'}
                                                    `}
                                                    onClick={() => {
                                                        if (!(poData.approved_by || poData.rejected_by)) {
                                                            setSelectedPart(part);
                                                            setShowPOModal(true);
                                                        }
                                                    }}
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
                                                    <td className={`px-4 py-4 text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
                                                                        <div key={rowIdx} className="flex flex-row gap-1 justify-center items-center w-full">
                                                                            {part.discount.slice(rowIdx * 3, rowIdx * 3 + 3).map((d, i) => (
                                                                                <span
                                                                                    key={i}
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
                                                        <tr key={`${part.part_no}-freebie-${item.part_no}-${i}-${idx}`} className={`${isDarkMode ? 'bg-slate-800/30' : 'bg-gray-50/80'}`}>
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
                                            </>
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
                            onClick={() => router.push("/services/purchase/PO2")}
                        >
                            กลับไปยัง PO List
                        </button>
                    </div>
                )}
            </main>

            {/* Modal สำหรับรายละเอียดสินค้าและเพิ่ม remark/ของแถม */}
            <POModal
                open={showPOModal}
                onClose={() => setShowPOModal(false)}
                part={selectedPart}
                // onSubmit={() => {
                //     setShowPOModal(false);
                // }}
                onSuccess={() => {
                    fetchData();
                }}
            />
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
                    onConfirm={() => {
                        setShowEditVendor(false);
                        if (typeof fetchData === 'function') fetchData();
                        // setActiveTab('compare'); // ถ้ามี tab ให้ใช้งาน
                    }}
                />
            )}

            {/* เพิ่มพื้นที่ว่างด้านล่าง */}
            <div className="h-10 md:h-7"></div>
        </div>
    );
}