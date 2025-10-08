"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";

//components
import { useToken } from "@/app/context/TokenContext";
import { useUser } from "@/app/context/UserContext";
import Sidebar from "@/app/components/sidebar";
import Header from "@/app/components/header";
import { useTheme } from "@/app/components/ThemeProvider";

// icons
import { BsCalendar2Event } from "react-icons/bs";
import { MdOutlineGroups3 } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import { FaXmark } from "react-icons/fa6";
import { IoIosCheckmark } from "react-icons/io";

type ReviewedPO = {
    po_no: string;
    po_date: string;
    dept_request: string;
    delivery_place: string;
    delivery_date: string;
    mail_out_date: string;
    sub_total: number;
    exit_discount: number;
    total: number;
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
    po_lists: POList[];
};

type POList = {
    part_no: string;
    part_name: string;
    prod_code: string;
    pr_no: string;
    qty: number;
    unit: string;
    unit_price: number;
    discount: number;
    amount: number;
}

export default function ReviewedPOPage() {
    // components
    const { user } = useUser();
    const token = useToken();
    const { isDarkMode } = useTheme();

    // Get PO No from URL
    const searchParams = useSearchParams();
    const poNo = searchParams.get("id") || searchParams.get("poNo");

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



    // TODO: Fetch PO Data
    useEffect(() => {
        if (!poNo) {
            setError("ไม่พบ PO ID");
            setLoading(false);
            return;
        }
        const fetchData = async () => {
            try {
                setError("");
                setLoading(true);
                const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/doc?poNo=${poNo}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) throw new Error("โหลดข้อมูล PO ไม่สำเร็จ");
                const data = await response.json();

                // ข้อมูลอยู่ใน field poDoc ตาม API response
                if (data.poDoc) {
                    // ถ้าไม่มี po_lists ให้สร้าง empty array
                    const poInfo = data.poDoc;
                    if (!poInfo.po_lists) {
                        poInfo.po_lists = [];
                    }
                    setPoData(poInfo);
                } else {
                    setError("ไม่พบข้อมูล PO ใน response");
                }
            } catch (err: unknown) {
                setError("เกิดข้อผิดพลาด");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [poNo, token]);

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
                {
                    poData ? (
                        <div className={`max-w-none w-full space-y-4 p-4 rounded-2xl ${isDarkMode ? 'bg-slate-900/20' : 'bg-gray-50/50'}`}>
                            {/* Compact Header Section */}
                            <div className={`flex items-center justify-between p-4 rounded-xl ${isDarkMode ? 'bg-gradient-to-r from-green-900/20 to-emerald-900/10' : 'bg-gradient-to-r from-green-50 to-emerald-50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-green-900/40' : 'bg-green-100'}`}>
                                        <IoDocumentTextOutline className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                    </div>
                                    <div>
                                        <h1 className={`text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>Purchase Order #{poData.po_no}</h1>
                                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                                            {new Date(poData.po_date).toLocaleDateString('th-TH')} • {poData.po_lists?.length || 0} รายการ
                                        </p>
                                    </div>
                                </div>
                                <div className={`px-3 py-1 rounded-full border text-sm font-medium ${isDarkMode ? 'bg-green-900/30 border-green-700/40 text-green-300' : 'bg-green-100 border-green-200 text-green-700'}`}>
                                    Active PO
                                </div>
                            </div>

                            {/* Balanced 3-Column Layout - Reduced spacing & better organization */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                {/* Left Column - PO Summary & Delivery */}
                                <div className="space-y-4">
                                    {/* PO Basic Info - Compact */}
                                    <div className={`rounded-lg p-3 border ${isDarkMode ? 'bg-slate-900/60 border-green-700/30' : 'bg-white border-green-200'}`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <BsCalendar2Event className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                                            <h3 className={`font-semibold text-md ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>สรุปข้อมูล PO</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className={`p-2 rounded text-center ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>วันที่ออกใบ PO</p>
                                                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-800'}`}>{new Date(poData.po_date).toLocaleDateString('th-TH')}</p>
                                                </div>
                                                <div className={`p-2 rounded text-center ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>จำนวนรายการ</p>
                                                    <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-800'}`}>{poData.po_lists?.length || 0}</p>
                                                </div>
                                            </div>
                                            <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>แผนกผู้ขอ</p>
                                                <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-800'}`}>{poData.dept_request}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>ผู้จัดทำ</p>
                                                    <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-100' : 'text-gray-800'}`}>{poData.issued_by || '-'}</p>
                                                </div>
                                                <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>ผู้อนุมัติ</p>
                                                    <p className={`text-sm font-medium ${isDarkMode ? 'text-slate-100' : 'text-gray-800'}`}>{poData.approved_by || '-'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Delivery Information */}
                                    <div className={`rounded-lg p-3 border ${isDarkMode ? 'bg-slate-900/60 border-orange-700/30' : 'bg-white border-orange-200'}`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <svg className={`h-4 w-4 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <h3 className={`font-semibold text-md ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>ข้อมูลจัดส่ง</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>สถานที่จัดส่ง</p>
                                                <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{poData.delivery_place}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>วันที่จัดส่ง</p>
                                                    <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                                        {poData.delivery_date ? new Date(poData.delivery_date).toLocaleDateString('th-TH') : '-'}
                                                    </p>
                                                </div>
                                                <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>วันที่ส่งเมล์</p>
                                                    <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                                        {poData.mail_out_date ? new Date(poData.mail_out_date).toLocaleDateString('th-TH') : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                            {poData.remark && (
                                                <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>หมายเหตุ</p>
                                                    <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{poData.remark}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Center Column - Vendor Information */}
                                <div className={`rounded-lg p-3 border ${isDarkMode ? 'bg-slate-900/60 border-blue-700/30' : 'bg-white border-blue-200'}`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <MdOutlineGroups3 className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                                        <h3 className={`font-semibold text-md ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>ข้อมูลผู้ขาย</h3>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>รหัสผู้ขาย</p>
                                                <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{poData.vendor_code}</p>
                                            </div>
                                            <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>โทรศัพท์</p>
                                                <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{poData.tel_no}</p>
                                            </div>
                                        </div>

                                        <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>ชื่อผู้ขาย</p>
                                            <p className={`text-sm font-semibold ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>{poData.vendor_name}</p>
                                        </div>

                                        <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>เลขประจำตัวผู้เสียภาษี</p>
                                            <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{poData.tax_id}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>ผู้ติดต่อ</p>
                                                <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{poData.contact_name}</p>
                                            </div>
                                            <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>เครดิต</p>
                                                <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{poData.credit_term}</p>
                                            </div>
                                        </div>

                                        <div className={`p-2 rounded ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'} mb-1`}>อีเมล</p>
                                            <p className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{poData.email}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column - Total Amount Calculation */}
                                <div className={`rounded-lg p-3 border ${isDarkMode ? 'bg-slate-900/60 border-green-700/30' : 'bg-white border-green-200'}`}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <svg className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                        </svg>
                                        <h3 className={`font-semibold text-md ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>ยอดรวมสุทธิ</h3>
                                    </div>
                                    
                                    <div className="text-center mb-3">
                                        <p className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{(() => {
                                            const sumAmount = poData.po_lists?.reduce((acc, item) => acc + (item.amount || 0), 0) || 0;
                                            const discount = poData.exit_discount || 0;
                                            const afterDiscount = sumAmount - discount;
                                            const vat = afterDiscount * 0.07;
                                            const totalAmount = afterDiscount + vat;
                                            return `฿${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                        })()}</p>
                                    </div>
                                    
                                    <div className={`space-y-1 p-3 rounded ${isDarkMode ? 'bg-slate-900/50' : 'bg-white/70'}`}>
                                        <div className={`flex justify-between text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                            <span>รวมรายการ (Σ)</span>
                                            <span className={`font-semibold ${isDarkMode ? 'text-emerald-300' : 'text-green-700'}`}>฿{poData.po_lists?.reduce((acc, item) => acc + (item.amount || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className={`flex justify-between text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                            <span>ส่วนลด</span>
                                            <span className={`font-semibold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>- ฿{(poData.exit_discount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                        <div className={`flex justify-between text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                            <span>VAT 7%</span>
                                            <span className={`font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>+ ฿{(() => {
                                                const sumAmount = poData.po_lists?.reduce((acc, item) => acc + (item.amount || 0), 0) || 0;
                                                const discount = poData.exit_discount || 0;
                                                const afterDiscount = sumAmount - discount;
                                                return (afterDiscount * 0.07).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                            })()}</span>
                                        </div>
                                        <hr className={`my-1 ${isDarkMode ? 'border-slate-600' : 'border-gray-300'}`} />
                                        <div className={`flex justify-between font-bold text-sm ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                                            <span>ยอดรวมสุทธิ</span>
                                            <span>{(() => {
                                                const sumAmount = poData.po_lists?.reduce((acc, item) => acc + (item.amount || 0), 0) || 0;
                                                const discount = poData.exit_discount || 0;
                                                const afterDiscount = sumAmount - discount;
                                                const vat = afterDiscount * 0.07;
                                                const totalAmount = afterDiscount + vat;
                                                return `฿${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                            })()}</span>
                                        </div>
                                    </div>

                                    {/* Additional Stats */}
                                    <div className="grid grid-cols-2 gap-1 mt-3">
                                        <div className={`p-2 rounded text-center ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>รายการ</p>
                                            <p className={`text-sm font-bold ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>{poData.po_lists?.length || 0}</p>
                                        </div>
                                        {/* <div className={`p-2 rounded text-center ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>เฉลี่ย</p>
                                            <p className={`text-xs font-bold ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>
                                                ฿{poData.po_lists?.length ? ((poData.po_lists?.reduce((acc, item) => acc + (item.amount || 0), 0) || 0) / poData.po_lists.length).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : '0'}
                                            </p>
                                        </div> */}
                                        <div className={`p-2 rounded text-center ${isDarkMode ? 'bg-slate-800/40' : 'bg-gray-50'}`}>
                                            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>หน่วย</p>
                                            <p className={`text-sm font-bold ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>{poData.po_lists?.reduce((acc, item) => acc + (item.qty || 0), 0) || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>



                            {/* // ANCHOR Table */}
                            <div className={`rounded-3xl shadow border overflow-visible ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-green-100'}`}>
                                <div className={`px-8 pt-6 pb-4 rounded-t-3xl overflow-visible ${isDarkMode ? 'bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50' : 'bg-gradient-to-r from-green-50 via-white to-green-100'}`}>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className={`text-xl font-bold ${isDarkMode ? 'text-emerald-400' : 'text-green-700'}`}>Purchase Ordered</span>
                                                <span className={`text-sm px-3 py-1 rounded-full shadow-sm border ${isDarkMode ? 'text-emerald-300 bg-emerald-900/30 border-emerald-600/30' : 'text-green-700 bg-green-50 border-green-200'}`}>
                                                    {poData.po_lists?.length ?? 0} รายการ
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                className={`rounded-lg px-6 py-2 font-semibold border focus:outline-none transition-colors duration-150 cursor-pointer hover:shadow ${isDarkMode ? 'text-emerald-400 bg-slate-800 border-emerald-600/30 hover:bg-slate-700' : 'text-green-700 bg-white border-green-300 hover:bg-green-50'}`}
                                                onClick={() => router.push("/services/purchase/PO2")}
                                            >
                                                เลือก PO ใหม่
                                            </button>
                                        </div>

                                        {/* แสดงเหตุผลการปฏิเสธในส่วนหัวตาราง */}
                                        {/* {(prData.supervisor_reject_at || prData.manager_reject_at || prData.pu_operator_reject_at) && prData.reason_reject && (
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
                                        )} */}
                                    </div>
                                </div>
                                <div className="overflow-visible">
                                    <table className="min-w-full text-sm overflow-visible">
                                        <thead className={isDarkMode ? 'bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50' : 'bg-gradient-to-r from-green-50 via-white to-green-100'}>
                                            <tr>
                                                {/* {prData.supervisor_approve && prData.manager_approve && prData.pu_operator_approve && (
                                                    <th className={`px-2 py-3 text-center font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Status</th>
                                                )} */}
                                                <th className={`px-2 py-3 text-center font-semibold w-12 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Item</th>
                                                <th className={`px-2 py-3 text-center font-semibold w-32 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Part No.</th>
                                                <th className={`px-2 py-3 text-center font-semibold w-64 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Part Name</th>
                                                <th className={`px-2 py-3 text-center font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>QTY</th>
                                                <th className={`px-2 py-3 text-center font-semibold w-20 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>UNIT</th>
                                                <th className={`px-2 py-3 text-center font-semibold w-24 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Unit Price</th>
                                                <th className={`px-2 py-3 text-center font-semibold w-24 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Discount</th>
                                                <th className={`px-2 py-3 text-center font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y transition-all duration-150 ${isDarkMode ? 'bg-slate-900/50 divide-slate-700/50 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50' : 'bg-white divide-green-100 bg-gradient-to-r from-green-50 via-white to-green-100'}`}>
                                            {pagedParts.map((part, idx) => (
                                                <tr key={part.part_no + '-row-' + ((page - 1) * rowsPerPage + idx)}
                                                    className={`transition-all duration-150 ${isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-green-50'}`}
                                                // onClick={() => {
                                                //     if (prData.manager_approve && prData.supervisor_approve && user?.Department?.ID === 10086) {
                                                //         handleItemClick(part);
                                                //     }
                                                // }}
                                                >
                                                    {/* {prData.supervisor_approve && prData.manager_approve && prData.pu_operator_approve && (
                                                        <td className={`px-2 py-3 text-center w-16`}>
                                                            <div className="flex items-center justify-center">
                                                                {part.ordered ? (
                                                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border min-w-[85px] justify-center ${isDarkMode ? 'bg-green-900/30 border-green-700/50' : 'bg-green-100 border-green-300'}`}>
                                                                        <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-green-400' : 'bg-green-500'}`}></div>
                                                                        <span className={`text-xs font-medium ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>approved</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border min-w-[85px] justify-center ${isDarkMode ? 'bg-yellow-900/30 border-yellow-700/50' : 'bg-yellow-100 border-yellow-300'}`}>
                                                                        <div className={`w-2 h-2 rounded-full animate-pulse ${isDarkMode ? 'bg-yellow-400' : 'bg-yellow-500'}`}></div>
                                                                        <span className={`text-xs font-medium ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>waiting</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                    )} */}
                                                    <td className={`px-2 py-3 text-center w-12 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{(page - 1) * rowsPerPage + idx + 1}</td>
                                                    <td className={`px-2 py-3 font-medium w-32 text-left ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{part.part_no}</td>
                                                    <td className={`px-2 py-3 w-64 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.part_name}</td>
                                                    <td className={`px-2 py-3 w-16 text-center ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.qty}</td>
                                                    <td className={`px-2 py-3 w-20 text-center ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.unit}</td>
                                                    <td className={`px-2 py-3 w-24 text-right pr-15 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.unit_price}</td>
                                                    <td className={`px-2 py-3 w-16 text-center ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.discount}</td>
                                                    <td className={`px-2 py-3 w-24 text-right pr-15 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>{part.amount}</td>
                                                </tr>
                                            ))}
                                            {/* Pagination row */}
                                            {totalRows > rowsPerPage && (
                                                <tr>
                                                    <td className={`px-4 py-4 text-center border-t ${isDarkMode ? 'bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50 border-slate-700' : 'bg-gradient-to-r from-green-50 via-white to-green-100 border-green-100'}`}>
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
                    )
                }
            </main>
        </div>
    );
}