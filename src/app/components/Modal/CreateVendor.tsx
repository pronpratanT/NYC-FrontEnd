import React, { useState } from "react";
import { useToken } from "../../context/TokenContext";
import { useTheme } from "../ThemeProvider";

// icon
import { IoInformationCircleOutline } from "react-icons/io5";
import { TbMail } from "react-icons/tb";

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #64748b #e2e8f0;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
    border-radius: 8px;
    border: 2px solid #f8fafc;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #64748b 0%, #475569 100%);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:active {
    background: linear-gradient(180deg, #475569 0%, #334155 100%);
  }
  
  .custom-scrollbar::-webkit-scrollbar-corner {
    background: #f8fafc;
  }
  
  /* Hide scrollbar arrows/buttons */
  .custom-scrollbar::-webkit-scrollbar-button {
    display: none;
  }
  
  /* Force scrollbar to always show */
  .scrollbar-always {
    overflow-y: scroll !important;
    overflow-x: auto !important;
  }
`;

interface CreateVendorProps {
    pcl_id?: number;
    onConfirm?: (data: { vendorName: string; contactName: string; taxId: string; creditTerm: string; email: string; telNo: string; faxNo: string }) => void;
    onCancel?: () => void;
}

const CreateVendor: React.FC<CreateVendorProps> = ({ pcl_id, onConfirm, onCancel }) => {
    // state สำหรับแต่ละช่อง
    const [vendorName, setVendorName] = useState("");
    const [contactName, setContactName] = useState("");
    const [taxId, setTaxId] = useState("");
    const [creditTerm, setCreditTerm] = useState("");
    // เปลี่ยนเป็น array สำหรับ multiple emails, tel numbers และ fax numbers
    const [emails, setEmails] = useState<string[]>([""]);
    const [emailErrors, setEmailErrors] = useState<string[]>([""]);
    const [telNos, setTelNos] = useState<string[]>([""]);
    const [faxNos, setFaxNos] = useState<string[]>([""]);
    // Per-field error state
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
    const token = useToken();
    const { isDarkMode } = useTheme();

    // ธีมสีม่วงสำหรับ CreateVendor
    const currentTheme = {
        header: isDarkMode
            ? 'bg-gradient-to-r from-indigo-800 via-purple-800 to-violet-900'
            : 'bg-gradient-to-r from-purple-600 to-violet-600',
        accent: isDarkMode ? 'bg-indigo-400' : 'bg-purple-500',
        focus: isDarkMode ? 'focus:ring-indigo-500' : 'focus:ring-purple-500',
        focusBorder: isDarkMode ? 'focus:border-indigo-500' : 'focus:border-purple-500',
        button: isDarkMode
            ? 'bg-gradient-to-r from-indigo-700 via-purple-700 to-violet-800 hover:from-indigo-600 hover:via-purple-600 hover:to-violet-700 focus:ring-indigo-500'
            : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 focus:ring-purple-500'
    };

    // ฟังก์ชันสำหรับจัดการ multiple emails
    const addEmail = () => {
        setEmails([...emails, ""]);
        setEmailErrors([...emailErrors, ""]);
    };

    const removeEmail = (index: number) => {
        if (emails.length > 1) {
            setEmails(emails.filter((_, i) => i !== index));
            setEmailErrors(emailErrors.filter((_, i) => i !== index));
        }
    };

    const updateEmail = (index: number, value: string) => {
        const newEmails = [...emails];
        const newErrors = [...emailErrors];

        if (value.includes(",")) {
            newErrors[index] = "ห้ามใส่เครื่องหมาย , ในอีเมล";
        } else {
            newErrors[index] = "";
        }

        newEmails[index] = value.replace(/,/g, "");
        setEmails(newEmails);
        setEmailErrors(newErrors);
    };

    // ฟังก์ชันสำหรับจัดการ multiple tel nos
    const addTelNo = () => {
        setTelNos([...telNos, ""]);
    };

    const removeTelNo = (index: number) => {
        if (telNos.length > 1) {
            setTelNos(telNos.filter((_, i) => i !== index));
        }
    };

    const updateTelNo = (index: number, value: string) => {
        const newTelNos = [...telNos];
        newTelNos[index] = value;
        setTelNos(newTelNos);
    };

    // ฟังก์ชันสำหรับจัดการ multiple fax nos
    const addFaxNo = () => {
        setFaxNos([...faxNos, ""]);
    };

    const removeFaxNo = (index: number) => {
        if (faxNos.length > 1) {
            setFaxNos(faxNos.filter((_, i) => i !== index));
        }
    };

    const updateFaxNo = (index: number, value: string) => {
        const newFaxNos = [...faxNos];
        newFaxNos[index] = value;
        setFaxNos(newFaxNos);
    };

    const handlerConfirm = async () => {
        // Validate all fields
        const errors: { [key: string]: string } = {};
        if (!vendorName.trim()) errors.vendorName = "กรุณากรอก Vendor Name";
        if (!contactName.trim()) errors.contactName = "กรุณากรอก Contact Name";
        if (!taxId.trim()) errors.taxId = "กรุณากรอก Tax ID";
        if (!creditTerm.trim()) errors.creditTerm = "กรุณากรอก Credit Term";
        if (!emails[0]?.trim()) errors.email = "กรุณากรอก Email";
        if (!telNos[0]?.trim()) errors.telNo = "กรุณากรอก Tel No.";
        if (!faxNos[0]?.trim()) errors.faxNo = "กรุณากรอก Fax No.";

        // ตรวจสอบ email errors
        const hasEmailErrors = emailErrors.some(error => error !== "");
        if (hasEmailErrors) errors.email = "กรุณาแก้ไขข้อผิดพลาดในอีเมล";

        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) return;

        const body = {
            pcl_id: pcl_id,
            vendor_name: vendorName,
            contact_name: contactName,
            tax_id: taxId,
            credit_term: creditTerm,
            email: emails.filter(e => e.trim()).join(", "),
            tel_no: telNos.filter(t => t.trim()).join(", "),
            fax_no: faxNos.filter(f => f.trim()).join(", ")
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

            const result = await response.json();
            if (response.ok || result.success || result.status === 'success') {
                if (onConfirm) onConfirm({
                    vendorName,
                    contactName,
                    taxId,
                    creditTerm,
                    email: emails.filter(e => e.trim()).join(", "),
                    telNo: telNos.filter(t => t.trim()).join(", "),
                    faxNo: faxNos.filter(f => f.trim()).join(", ")
                });
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
        <>
            <style>{scrollbarStyles}</style>
            <div
                className={`fixed inset-0 z-[99999] flex items-center justify-center backdrop-blur-md ${isDarkMode
                        ? 'bg-gradient-to-br from-gray-950/80 via-slate-900/70 to-gray-950/80'
                        : 'bg-gradient-to-br from-slate-900/70 via-gray-900/60 to-slate-800/70'
                    }`}
                onClick={e => {
                    // ถ้ากดที่พื้นหลัง (target === currentTarget) ให้ปิด modal
                    if (e.target === e.currentTarget && onCancel) onCancel();
                }}
            >
                <div
                    className={`rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden ring-1 ${isDarkMode
                            ? 'bg-gradient-to-br from-slate-900 to-slate-800 shadow-slate-900/50 border border-slate-600/50 ring-slate-700/50'
                            : 'bg-white border border-slate-200 ring-slate-200/10'
                        }`}
                    onClick={e => e.stopPropagation()} // ป้องกัน modal ถูกปิดเมื่อกดใน modal
                >
                    {/* Header */}
                    <div className={`px-6 py-4 relative overflow-hidden ${currentTheme.header}`}>
                        <div className={`absolute inset-0 bg-gradient-to-r from-transparent to-transparent opacity-50 ${isDarkMode ? 'via-white/5' : 'via-white/10'
                            }`}></div>
                        <div className="flex items-center justify-between relative z-10">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-lg backdrop-blur-sm ${isDarkMode
                                        ? 'bg-white/10 border border-white/20'
                                        : 'bg-white/20 border border-white/30'
                                    }`}>
                                    <svg className="w-6 h-6 text-white drop-shadow-sm" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white drop-shadow-sm">สร้างผู้ขายใหม่</h2>
                                    <p className={`text-sm drop-shadow-sm ${isDarkMode ? 'text-indigo-200' : 'text-purple-100'
                                        }`}>Create New Vendor</p>
                                </div>
                            </div>
                            <button
                                onClick={onCancel}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-white transition-all duration-200 hover:scale-105 ${isDarkMode
                                        ? 'bg-white/10 hover:bg-white/20 border border-white/20'
                                        : 'bg-white/20 hover:bg-white/30 border border-white/30'
                                    }`}
                            >
                                <svg className="w-5 h-5 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className={`p-6 max-h-[70vh] overflow-y-auto custom-scrollbar ${isDarkMode
                            ? 'bg-gradient-to-br from-slate-800/50 to-slate-900/50'
                            : 'bg-gradient-to-br from-slate-50 to-gray-50'
                        }`}>
                        <form className="space-y-8">
                            {/* Basic Information Section */}
                            <div>
                                <h3 className={`text-lg font-semibold mb-4 pb-2 border-b ${isDarkMode
                                        ? 'text-slate-200 border-slate-600/50'
                                        : 'text-gray-800 border-gray-300'
                                    }`}>
                                    <span className="flex items-center gap-2">
                                        <IoInformationCircleOutline className="h-5 w-5" />
                                        ข้อมูลผู้ขาย
                                    </span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className={`block text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${currentTheme.accent}`}></span>
                                            Vendor Name
                                        </label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md ${fieldErrors.vendorName
                                                    ? isDarkMode
                                                        ? 'border-red-500/70 focus:ring-red-500 focus:border-red-500 bg-slate-700/50 text-slate-100 placeholder-slate-400'
                                                        : 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 placeholder-gray-500'
                                                    : `${currentTheme.focus} ${currentTheme.focusBorder} ${isDarkMode
                                                        ? 'border-slate-600/50 bg-slate-700/50 text-slate-100 placeholder-slate-400 shadow-slate-800/20 hover:shadow-slate-700/30'
                                                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                    }`
                                                }`}
                                            value={vendorName}
                                            onChange={e => setVendorName(e.target.value)}
                                            placeholder="กรอกชื่อผู้ขาย"
                                        />
                                        {fieldErrors.vendorName && (
                                            <p className="text-xs text-red-500 mt-1">{fieldErrors.vendorName}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className={`block text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${currentTheme.accent}`}></span>
                                            Contact Name
                                        </label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md ${fieldErrors.contactName
                                                    ? isDarkMode
                                                        ? 'border-red-500/70 focus:ring-red-500 focus:border-red-500 bg-slate-700/50 text-slate-100 placeholder-slate-400'
                                                        : 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 placeholder-gray-500'
                                                    : `${currentTheme.focus} ${currentTheme.focusBorder} ${isDarkMode
                                                        ? 'border-slate-600/50 bg-slate-700/50 text-slate-100 placeholder-slate-400 shadow-slate-800/20 hover:shadow-slate-700/30'
                                                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                    }`
                                                }`}
                                            value={contactName}
                                            onChange={e => setContactName(e.target.value)}
                                            placeholder="กรอกชื่อผู้ติดต่อ"
                                        />
                                        {fieldErrors.contactName && (
                                            <p className="text-xs text-red-500 mt-1">{fieldErrors.contactName}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className={`block text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${currentTheme.accent}`}></span>
                                            Tax ID
                                        </label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md ${fieldErrors.taxId
                                                    ? isDarkMode
                                                        ? 'border-red-500/70 focus:ring-red-500 focus:border-red-500 bg-slate-700/50 text-slate-100 placeholder-slate-400'
                                                        : 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 placeholder-gray-500'
                                                    : `${currentTheme.focus} ${currentTheme.focusBorder} ${isDarkMode
                                                        ? 'border-slate-600/50 bg-slate-700/50 text-slate-100 placeholder-slate-400 shadow-slate-800/20 hover:shadow-slate-700/30'
                                                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                    }`
                                                }`}
                                            value={taxId}
                                            onChange={e => setTaxId(e.target.value)}
                                            placeholder="กรอกเลขผู้เสียภาษี"
                                        />
                                        {fieldErrors.taxId && (
                                            <p className="text-xs text-red-500 mt-1">{fieldErrors.taxId}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <label className={`block text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${currentTheme.accent}`}></span>
                                            Credit Term
                                        </label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md ${fieldErrors.creditTerm
                                                    ? isDarkMode
                                                        ? 'border-red-500/70 focus:ring-red-500 focus:border-red-500 bg-slate-700/50 text-slate-100 placeholder-slate-400'
                                                        : 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 placeholder-gray-500'
                                                    : `${currentTheme.focus} ${currentTheme.focusBorder} ${isDarkMode
                                                        ? 'border-slate-600/50 bg-slate-700/50 text-slate-100 placeholder-slate-400 shadow-slate-800/20 hover:shadow-slate-700/30'
                                                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                    }`
                                                }`}
                                            value={creditTerm}
                                            onChange={e => setCreditTerm(e.target.value)}
                                            placeholder="กรอกเครดิตเทอม"
                                        />
                                        {fieldErrors.creditTerm && (
                                            <p className="text-xs text-red-500 mt-1">{fieldErrors.creditTerm}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Contact Information Section */}
                            <div>
                                <h3 className={`text-lg font-semibold mb-4 pb-2 border-b ${isDarkMode
                                        ? 'text-slate-200 border-slate-600/50'
                                        : 'text-gray-800 border-gray-300'
                                    }`}>
                                    <span className="flex items-center gap-2">
                                        <TbMail className="h-5 w-5" />
                                        ข้อมูลติดต่อ
                                    </span>
                                </h3>
                                <div className="space-y-6">
                                    {/* Multiple Email Fields - Compact */}
                                    <div className="space-y-3">
                                        <label className={`block text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${currentTheme.accent}`}></span>
                                            Email {emails.length > 1 && <span className="text-xs opacity-70">({emails.length})</span>}
                                        </label>
                                        <div className="space-y-2">
                                            {emails.map((email, index) => (
                                                <div key={index} className="flex gap-2 items-start">
                                                    <div className="flex-1">
                                                        <input
                                                            type="email"
                                                            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md text-sm ${emailErrors[index]
                                                                    ? isDarkMode
                                                                        ? 'border-red-500/70 focus:ring-red-500 focus:border-red-500 bg-slate-700/50 text-slate-100 placeholder-slate-400'
                                                                        : 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-white text-gray-900 placeholder-gray-500'
                                                                    : `${currentTheme.focus} ${currentTheme.focusBorder} ${isDarkMode
                                                                        ? 'border-slate-600/50 bg-slate-700/50 text-slate-100 placeholder-slate-400'
                                                                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                                    }`
                                                                }`}
                                                            value={email}
                                                            onChange={e => updateEmail(index, e.target.value)}
                                                            placeholder={`อีเมล${index > 0 ? ` ${index + 1}` : ''}`}
                                                        />
                                                        {emailErrors[index] && (
                                                            <p className="text-xs text-red-500 mt-1">{emailErrors[index]}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-1 pt-1">
                                                        {index === emails.length - 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={addEmail}
                                                                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-105 ${currentTheme.button} text-white shadow-sm hover:shadow-md text-xs`}
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        {emails.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeEmail(index)}
                                                                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-105 ${isDarkMode
                                                                        ? 'bg-red-600/80 hover:bg-red-600 text-white'
                                                                        : 'bg-red-500 hover:bg-red-600 text-white'
                                                                    } shadow-sm hover:shadow-md text-xs`}
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Multiple Tel No. Fields - Compact */}
                                    <div className="space-y-3">
                                        <label className={`block text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${currentTheme.accent}`}></span>
                                            โทรศัพท์ {telNos.length > 1 && <span className="text-xs opacity-70">({telNos.length})</span>}
                                        </label>
                                        <div className="space-y-2">
                                            {telNos.map((telNo, index) => (
                                                <div key={index} className="flex gap-2 items-center">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md text-sm ${currentTheme.focus} ${currentTheme.focusBorder} ${isDarkMode
                                                                    ? 'border-slate-600/50 bg-slate-700/50 text-slate-100 placeholder-slate-400'
                                                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                                }`}
                                                            value={telNo}
                                                            onChange={e => updateTelNo(index, e.target.value)}
                                                            placeholder={`โทรศัพท์${index > 0 ? ` ${index + 1}` : ''}`}
                                                        />
                                                    </div>
                                                    <div className="flex gap-1">
                                                        {index === telNos.length - 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={addTelNo}
                                                                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-105 ${currentTheme.button} text-white shadow-sm hover:shadow-md text-xs`}
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        {telNos.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeTelNo(index)}
                                                                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-105 ${isDarkMode
                                                                        ? 'bg-red-600/80 hover:bg-red-600 text-white'
                                                                        : 'bg-red-500 hover:bg-red-600 text-white'
                                                                    } shadow-sm hover:shadow-md text-xs`}
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Multiple Fax No. Fields - Compact */}
                                    <div className="space-y-3">
                                        <label className={`block text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${currentTheme.accent}`}></span>
                                            แฟกซ์ {faxNos.length > 1 && <span className="text-xs opacity-70">({faxNos.length})</span>}
                                        </label>
                                        <div className="space-y-2">
                                            {faxNos.map((faxNo, index) => (
                                                <div key={index} className="flex gap-2 items-center">
                                                    <div className="flex-1">
                                                        <input
                                                            type="text"
                                                            className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md text-sm ${currentTheme.focus} ${currentTheme.focusBorder} ${isDarkMode
                                                                    ? 'border-slate-600/50 bg-slate-700/50 text-slate-100 placeholder-slate-400'
                                                                    : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                                }`}
                                                            value={faxNo}
                                                            onChange={e => updateFaxNo(index, e.target.value)}
                                                            placeholder={`แฟกซ์${index > 0 ? ` ${index + 1}` : ''}`}
                                                        />
                                                    </div>
                                                    <div className="flex gap-1">
                                                        {index === faxNos.length - 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={addFaxNo}
                                                                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-105 ${currentTheme.button} text-white shadow-sm hover:shadow-md text-xs`}
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                        {faxNos.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeFaxNo(index)}
                                                                className={`w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 hover:scale-105 ${isDarkMode
                                                                        ? 'bg-red-600/80 hover:bg-red-600 text-white'
                                                                        : 'bg-red-500 hover:bg-red-600 text-white'
                                                                    } shadow-sm hover:shadow-md text-xs`}
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                                                                </svg>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className={`px-6 py-4 border-t backdrop-blur-sm ${isDarkMode
                            ? 'bg-gradient-to-r from-slate-800/80 via-slate-900/60 to-slate-800/80 border-slate-700/50'
                            : 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200'
                        }`}>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                className={`px-6 py-2.5 rounded-lg border font-medium transition-all duration-200 focus:outline-none focus:ring-2 shadow-sm hover:shadow-md backdrop-blur-sm ${isDarkMode
                                        ? 'border-slate-600/50 text-slate-200 bg-slate-700/50 hover:bg-slate-600/50 focus:ring-slate-500 shadow-slate-900/20 hover:shadow-slate-800/30'
                                        : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500'
                                    }`}
                                onClick={onCancel}
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                    ยกเลิก
                                </div>
                            </button>
                            <button
                                type="button"
                                className={`px-6 py-2.5 rounded-lg text-white font-semibold transition-all duration-200 focus:outline-none focus:ring-2 shadow-lg hover:shadow-xl hover:scale-105 transform ${currentTheme.button}`}
                                onClick={handlerConfirm}
                            >
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 drop-shadow-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                    สร้างผู้ขาย
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateVendor;