"use client";

import Sidebar from "../../../components/sidebar";
import Header from "../../../components/header";
import PRModal from '../../../components/PRModal';
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useToken } from "../../../context/TokenContext";

type Part = {
    pr_list_id: number;
    part_no: string;
    part_name: string;
    qty: number;
    unit: string;
    stock: number;
    vendor: string;
    price_per_unit: number;
};

// เปลี่ยน type PRs เป็น object
type PRs = {
    pr_id: number;
    pr_no: string;
    pr_date: string;
    dept_name: string;
    dept_short: string;
    dept_id: number;
    pr_lists: Part[];
};

function ComparePriceContent({ token }: { token: string | null }) {
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
                <div className="px-8 pt-8 pb-2">
                    <ol className="flex items-center w-full text-sm font-medium text-center sm:text-base">
                        {/* Step 1: Select PR */}
                        <li className="flex items-center gap-2">
                            <span className={`flex items-center justify-center w-7 h-7 rounded-full border-2 ${prData ? 'bg-green-100 border-green-500 text-green-700' : 'bg-gray-100 border-gray-300 text-gray-400'}`}>
                                {prData ? (
                                    <svg className="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                        <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 10l4 4 6-8" />
                                    </svg>
                                ) : (
                                    <span className="font-bold">1</span>
                                )}
                            </span>
                            <span className={`ml-2 ${prData ? 'text-green-700 font-semibold' : 'text-gray-400 font-medium'}`}>Select PR</span>
                        </li>
                        <span className="flex-1 h-1 bg-gray-200 mx-4 block"></span>
                        {/* Step 2: Compare Price */}
                        <li className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full border-2 bg-gray-100 border-gray-300 text-gray-400">
                                <span className="font-bold">2</span>
                            </span>
                            <span className="ml-2 text-gray-400 font-medium">Compare Price</span>
                        </li>
                        <span className="flex-1 h-1 bg-gray-200 mx-4 block"></span>
                        {/* Step 3: Confirmation */}
                        <li className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-7 h-7 rounded-full border-2 bg-gray-100 border-gray-300 text-gray-400">
                                <span className="font-bold">3</span>
                            </span>
                            <span className="ml-2 text-gray-400 font-medium">Confirmation</span>
                        </li>
                    </ol>
                </div>

                {/* Content: Show PR info and table only if prData exists */}
                {prData ? (
                    <div className="max-w-none w-full space-y-8 mb-2 pt-8">
                        {/* Modern PR Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </div>
                                    <span className="font-semibold text-gray-700">หมายเลข PR</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900 mb-1">{prData.pr_no}</div>
                                <div className="text-xs text-gray-400">สถานะ: รอดำเนินการ</div>
                            </div>
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v4a1 1 0 001 1h3m10-5h-3a1 1 0 00-1 1v4a1 1 0 001 1h3m-10 4h10" />
                                        </svg>
                                    </div>
                                    <span className="font-semibold text-gray-700">แผนก/หน่วยงาน</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900 mb-1">{prData.dept_name}</div>
                                <div className="text-xs text-gray-400">รหัสแผนก: {prData.dept_short}</div>
                            </div>
                            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <span className="font-semibold text-gray-700">วันที่ทำ PR</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900 mb-1">{new Date(prData.pr_date).toLocaleDateString('th-TH')}</div>
                                <div className="text-xs text-gray-400">เวลา: {new Date(prData.pr_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        </div>
                        {/* Part No Input and Table */}
                        <div className="bg-white rounded-3xl shadow border border-green-100 overflow-visible ">
                            <div className="px-8 pt-6 pb-4 flex items-center justify-between bg-gradient-to-r from-green-50 via-white to-green-100 rounded-t-3xl overflow-visible">
                                <div className="flex items-center gap-3">
                                    <span className="text-xl font-bold text-green-700">Purchase Requisition</span>
                                    <span className="text-sm text-green-700 bg-green-50 px-3 py-1 rounded-full shadow-sm border border-green-200">{} รายการ</span>
                            </div>
                            <button
                                type="button"
                                className="text-green-700 bg-white rounded-lg px-6 py-2 font-semibold border border-green-300 focus:outline-none transition-colors duration-150 hover:bg-green-50 cursor-pointer hover:shadow"
                                onClick={() => router.push("/services/purchase")}
                            >
                                เลือก PR ใหม่
                            </button>
                        </div>
                        <div className="overflow-visible">
                            <table className="min-w-full text-sm overflow-visible">
                                <thead className="bg-gradient-to-r from-green-50 via-white to-green-100">
                                    <tr>
                                        <th className="px-2 py-3 text-center font-semibold text-gray-700 w-12">Item</th>
                                        <th className="px-2 py-3 text-center font-semibold text-gray-700 w-32">Part No.</th>
                                        <th className="px-2 py-3 text-center font-semibold text-gray-700 w-64">Part Name</th>
                                        <th className="px-2 py-3 text-center font-semibold text-gray-700 w-16">QTY</th>
                                        <th className="px-2 py-3 text-center font-semibold text-gray-700 w-20">UNIT</th>
                                        <th className="px-2 py-3 text-center font-semibold text-gray-700 w-24">Vendor</th>
                                        <th className="px-2 py-3 text-center font-semibold text-gray-700 w-16">Stock</th>
                                        <th className="px-2 py-3 text-center font-semibold text-gray-700 w-24">Price/Unit</th>
                                    </tr>
                                </thead>
                                <tbody className={`bg-white divide-y divide-green-100 bg-gradient-to-r from-green-50 via-white to-green-100 dark:bg-gray-900 dark:divide-gray-700 dark:bg-gradient-to-r dark:from-gray-800 dark:via-gray-900 dark:to-gray-800`}>
                                    {(prData?.pr_lists ?? []).map((part, idx) => (
                                        <tr key={part.part_no + '-row-' + idx} className="hover:bg-green-50 dark:hover:bg-gray-800 transition-all duration-150 cursor-pointer" onClick={() => handleItemClick(part)}>
                                            <td className="px-2 py-3 text-center w-12 dark:text-gray-200">{idx + 1}</td>
                                            <td className="px-2 py-3 font-medium text-gray-800 w-32 text-center dark:text-gray-200">{part.part_no}</td>
                                            <td className="px-2 py-3 w-64 dark:text-gray-200">{part.part_name}</td>
                                            <td className="px-2 py-3 w-16 text-center dark:text-gray-200">{part.qty}</td>
                                            <td className="px-2 py-3 w-20 text-center dark:text-gray-200">{part.unit}</td>
                                            <td className="px-2 py-3 w-24 text-center dark:text-gray-200">{part.vendor}</td>
                                            <td className="px-2 py-3 w-16 text-center dark:text-gray-200">{part.stock}</td>
                                            <td className="px-2 py-3 w-24 text-right pr-15 dark:text-gray-200">{part.price_per_unit}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
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
                <div className="p-8 text-center text-gray-400">กรุณาเลือก PR จากหน้าแรก</div>
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
