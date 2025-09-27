import React, { useState } from "react";
import { useToken } from "../context/TokenContext";
import CreatPartNo from "./CreatPartNo";

interface CreateVendorProps {
    pcl_id?: number;
    onConfirm?: (data: { vendorCode: string; vendorName: string; contactName: string; taxId: string; creditTerm: string; email: string; telNo: string; faxNo: string }) => void;
    onCancel?: () => void;
}

const CreateVendor: React.FC<CreateVendorProps> = ({ pcl_id, onConfirm, onCancel }) => {
    // state สำหรับแต่ละช่อง
    const [vendorCode, setVendorCode] = useState("");
    const [vendorName, setVendorName] = useState("");
    const [contactName, setContactName] = useState("");
    const [taxId, setTaxId] = useState("");
    const [creditTerm, setCreditTerm] = useState("");
    const [email, setEmail] = useState("");
    const [telNo, setTelNo] = useState("");
    const [faxNo, setFaxNo] = useState("");
    const token = useToken();

    // validation: ทุกช่องต้องไม่ว่าง
    const isValid = vendorCode.trim() && vendorName.trim() && contactName.trim() && taxId.trim() && creditTerm.trim() && email.trim() && telNo.trim() && faxNo.trim();

    const handlerConfirm = async () => {
        const body = {
            pcl_id: pcl_id,
            vendor_code: vendorCode,
            vendor_name: vendorName,
            contact_name: contactName,
            tax_id: taxId,
            credit_term: creditTerm,
            email: email,
            tel_no: telNo,
            fax_no: faxNo
        };
        console.log("Token: ", token);
        console.log("Submitting data:", body);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/create-new-vendor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(body)
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            const result = await response.json();
            console.log('Response data:', result);

            // ตรวจสอบทั้ง response.ok และ result.success หรือ result.status
            if (response.ok || result.success || result.status === 'success') {
                if (onConfirm) onConfirm({ vendorCode, vendorName, contactName, taxId, creditTerm, email, telNo, faxNo });
                alert('สร้าง Vendor สำเร็จ');
                if (onCancel) onCancel();
            } else {
                throw new Error(result.message || 'Failed to add inventory');
            }
        } catch (err: unknown) {
            console.error('Error:', err);
            const message = err instanceof Error ? err.message : String(err);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + message);
        }
    }

    return (
        <div
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={e => {
                // ถ้ากดที่พื้นหลัง (target === currentTarget) ให้ปิด modal
                if (e.target === e.currentTarget && onCancel) onCancel();
            }}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl p-8 w-full max-w-md mx-auto border border-purple-300 dark:border-purple-700 flex flex-col gap-6"
                onClick={e => e.stopPropagation()} // ป้องกัน modal ถูกปิดเมื่อกดใน modal
            >
                <div className="flex items-center gap-3 mb-2">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <svg className="w-6 h-6 text-purple-500 dark:text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2a4 4 0 014-4h2m4 4v2a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4h2a4 4 0 014 4v2" /></svg>
                    </span>
                    <h2 className="text-xl font-bold text-purple-700 dark:text-purple-400">สร้าง Vendor.</h2>
                </div>
                <form className="grid grid-cols-1 gap-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-slate-400">Vendor Code</label>
                            <input
                                type="text"
                                className="w-full border-0 border-b border-purple-300 dark:border-purple-600 bg-transparent px-0 py-1 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-base dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-slate-500 transition-all"
                                value={vendorCode}
                                onChange={e => setVendorCode(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-slate-400">Vendor Name</label>
                            <input
                                type="text"
                                className="w-full border-0 border-b border-purple-300 dark:border-purple-600 bg-transparent px-0 py-1 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-base dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-slate-500 transition-all"
                                value={vendorName}
                                onChange={e => setVendorName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-slate-400">Contact Name</label>
                            <input
                                type="text"
                                className="w-full border-0 border-b border-purple-300 dark:border-purple-600 bg-transparent px-0 py-1 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-base dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-slate-500 transition-all"
                                value={contactName}
                                onChange={e => setContactName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-slate-400">Tax ID</label>
                            <input
                                type="text"
                                className="w-full border-0 border-b border-purple-300 dark:border-purple-600 bg-transparent px-0 py-1 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-base dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-slate-500 transition-all"
                                value={taxId}
                                onChange={e => setTaxId(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-slate-400">Credit Term</label>
                            <input
                                type="text"
                                className="w-full border-0 border-b border-purple-300 dark:border-purple-600 bg-transparent px-0 py-1 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-base dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-slate-500 transition-all"
                                value={creditTerm}
                                onChange={e => setCreditTerm(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-slate-400">Email</label>
                            <input
                                type="text"
                                className="w-full border-0 border-b border-purple-300 dark:border-purple-600 bg-transparent px-0 py-1 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-base dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-slate-500 transition-all"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-slate-400">Tel No.</label>
                            <input
                                type="text"
                                className="w-full border-0 border-b border-purple-300 dark:border-purple-600 bg-transparent px-0 py-1 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-base dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-slate-500 transition-all"
                                value={telNo}
                                onChange={e => setTelNo(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-slate-400">Fax No.</label>
                            <input
                                type="text"
                                className="w-full border-0 border-b border-purple-300 dark:border-purple-600 bg-transparent px-0 py-1 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 text-base dark:text-slate-200 placeholder:text-gray-300 dark:placeholder:text-slate-500 transition-all"
                                value={faxNo}
                                onChange={e => setFaxNo(e.target.value)}
                            />
                        </div>
                    </div>
                </form>
                <div className="flex gap-2 justify-center mt-2">
                    <button
                        type="button"
                        className="px-5 py-1 rounded-lg font-semibold bg-purple-500 hover:bg-purple-600 text-white transition-all duration-150 text-sm shadow-none"
                        onClick={handlerConfirm}
                        disabled={!isValid}
                    >
                        บันทึก
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateVendor;