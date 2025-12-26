"use client";
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

interface EditVendorProps {
    vendorData?: Partial<{
        ID: number;
        vendor_code: string;
        vendor_name: string;
        contact_name: string;
        tax_id: string;
        credit_term: string;
        email: string;
        tel: string;
        fax_no: string;
    }>;
    //onConfirm?: (data: { vendorId: number; vendorCode: string; vendorName: string; contactName: string; taxId: string; creditTerm: string; email: string; tel: string; faxNo: string; address1: string[]; address2: string[] }) => void;
    onConfirm?: (data: { vendorId: number; vendorCode: string; vendorName: string; contactName: string; taxId: string; creditTerm: string; email: string; tel: string; faxNo: string }) => void;
    onCancel?: () => void;
    source?: 'ReviewedPO' | 'PRModal'; // เพิ่ม prop สำหรับระบุแหล่งที่มา
}


const EditVendor: React.FC<EditVendorProps> = ({ vendorData, onConfirm, onCancel, source = 'ReviewedPO' }) => {
    // console.log('EditVendor received vendorData:', vendorData); // <--- log ข้อมูลที่รับเข้ามา
    // state สำหรับแต่ละช่อง (เติมค่าเริ่มต้นจาก vendorData ถ้ามี)
    const [vendorName, setVendorName] = useState(vendorData?.vendor_name || "");
    const [contactName, setContactName] = useState(vendorData?.contact_name || "");
    const [taxId, setTaxId] = useState(vendorData?.tax_id || "");
    const [creditTerm, setCreditTerm] = useState(vendorData?.credit_term || "");
    // const [city, setCity] = useState(vendorData?.city || "");
    // const [country, setCountry] = useState(vendorData?.country || "");
    // const [currencyCode, setCurrencyCode] = useState(vendorData?.currency_code || "");
    // const [zipCode, setZipCode] = useState(vendorData?.zip_code || "");
    // ฟังก์ชันแยกข้อมูลที่มี delimiter
    const parseMultipleValues = (value: string | undefined): string[] => {
        if (!value || value.trim() === "") return [""];
        // แยกโดยใช้ comma, semicolon, หรือ pipe
        const parsed = value.split(/[,;|]/).map(v => v.trim()).filter(v => v !== "");
        return parsed.length > 0 ? parsed : [""];
    };

    // เปลี่ยนเป็น array สำหรับ multiple emails, tel numbers และ fax numbers
    // const [address1, setAddress1] = useState<string>(vendorData?.address1 || "");
    // const [address2, setAddress2] = useState<string>(vendorData?.address2 || "");
    const [emails, setEmails] = useState<string[]>(parseMultipleValues(vendorData?.email));
    const [emailErrors, setEmailErrors] = useState<string[]>(parseMultipleValues(vendorData?.email).map(() => ""));
    const [telNos, setTelNos] = useState<string[]>(parseMultipleValues(vendorData?.tel));
    const [faxNos, setFaxNos] = useState<string[]>(parseMultipleValues(vendorData?.fax_no));
    const token = useToken();
    const { isDarkMode } = useTheme();

    // กำหนดสีธีมตาม source
    const themeColors = {
        ReviewedPO: {
            // ธีมสีฟ้า (blue theme)
            header: isDarkMode
                ? 'bg-gradient-to-r from-blue-800 via-indigo-800 to-blue-900'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600',
            accent: isDarkMode ? 'bg-blue-400' : 'bg-blue-500',
            focus: isDarkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-500',
            focusBorder: isDarkMode ? 'focus:border-blue-500' : 'focus:border-blue-500',
            button: isDarkMode
                ? 'bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-600 hover:via-indigo-600 hover:to-blue-700 focus:ring-blue-500'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500'
        },
        PRModal: {
            // ธีมสีม่วง (purple theme)
            header: isDarkMode
                ? 'bg-gradient-to-r from-indigo-800 via-purple-800 to-violet-900'
                : 'bg-gradient-to-r from-purple-600 to-violet-600',
            accent: isDarkMode ? 'bg-indigo-400' : 'bg-purple-500',
            focus: isDarkMode ? 'focus:ring-indigo-500' : 'focus:ring-purple-500',
            focusBorder: isDarkMode ? 'focus:border-indigo-500' : 'focus:border-purple-500',
            button: isDarkMode
                ? 'bg-gradient-to-r from-indigo-700 via-purple-700 to-violet-800 hover:from-indigo-600 hover:via-purple-600 hover:to-violet-700 focus:ring-indigo-500'
                : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 focus:ring-purple-500'
        }
    };

    const currentTheme = themeColors[source];

    // sync state with vendorData when modal opens or vendorData changes
    React.useEffect(() => {
        setVendorName(vendorData?.vendor_name || "");
        setContactName(vendorData?.contact_name || "");
        setTaxId(vendorData?.tax_id || "");
        setCreditTerm(vendorData?.credit_term || "");

        const parsedEmails = parseMultipleValues(vendorData?.email);
        const parsedTels = parseMultipleValues(vendorData?.tel);
        const parsedFaxes = parseMultipleValues(vendorData?.fax_no);

        setEmails(parsedEmails);
        setEmailErrors(parsedEmails.map(() => ""));
        setTelNos(parsedTels);
        setFaxNos(parsedFaxes);
    }, [vendorData]);

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

    // validation: ทุกช่องต้องไม่ว่าง
    // const isValid = vendorName.trim() && contactName.trim() && taxId.trim() && creditTerm.trim() && emails[0].trim() && telNos[0].trim() && faxNos[0].trim();

    const handlerConfirm = async () => {
        const body = {
            vendor_id: vendorData?.ID,
            vendor_name: vendorName,
            contact_name: contactName,
            tax_id: taxId,
            credit_term: creditTerm,
            email: emails.filter(e => e.trim()).join(", "), // รวม emails ที่ไม่ว่างด้วย comma
            tel_no: telNos.filter(t => t.trim()).join(", "), // รวม tel nos ที่ไม่ว่างด้วย comma
            fax_no: faxNos.filter(f => f.trim()).join(", ") // รวม fax nos ที่ไม่ว่างด้วย comma
        };
        // console.log("Token: ", token);
        // console.log("Submitting data:", body);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/update-vendor`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify(body)
            });

            // console.log('Response status:', response.status);
            // console.log('Response ok:', response.ok);

            const result = await response.json();
            // console.log('Response data:', result);

            // ตรวจสอบทั้ง response.ok และ result.success หรือ result.status
            if (response.ok || result.success || result.status === 'success') {
                if (onConfirm) onConfirm({
                    vendorId: vendorData?.ID ?? 0,
                    vendorCode: vendorData?.vendor_code || "",
                    vendorName,
                    contactName,
                    taxId,
                    creditTerm,
                    email: emails.filter(e => e.trim()).join(", "),
                    tel: telNos.filter(t => t.trim()).join(", "),
                    faxNo: faxNos.filter(f => f.trim()).join(", ")
                });
                alert('แก้ไข Vendor สำเร็จ');
                if (onCancel) onCancel();
            } else {
                throw new Error(result.message);
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
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-white drop-shadow-sm">แก้ไขข้อมูลผู้ขาย</h2>
                                    <p className={`text-sm drop-shadow-sm ${isDarkMode ? 'text-indigo-200' : 'text-blue-100'
                                        }`}>Edit Vendor Information</p>
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <label className={`block text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${currentTheme.accent}`}></span>
                                            Vendor Name
                                        </label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md ${currentTheme.focus} ${currentTheme.focusBorder} ${isDarkMode
                                                ? 'border-slate-600/50 bg-slate-700/50 text-slate-100 placeholder-slate-400 shadow-slate-800/20 hover:shadow-slate-700/30'
                                                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                }`}
                                            value={vendorName}
                                            onChange={e => setVendorName(e.target.value)}
                                            placeholder="ชื่อผู้ขาย"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={`block text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${currentTheme.accent}`}></span>
                                            Contact Name
                                        </label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md ${currentTheme.focus} ${currentTheme.focusBorder} ${isDarkMode
                                                ? 'border-slate-600/50 bg-slate-700/50 text-slate-100 placeholder-slate-400 shadow-slate-800/20 hover:shadow-slate-700/30'
                                                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                }`}
                                            value={contactName}
                                            onChange={e => setContactName(e.target.value)}
                                            placeholder="ชื่อผู้ติดต่อ"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={`block text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${currentTheme.accent}`}></span>
                                            Tax ID
                                        </label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md ${currentTheme.focus} ${currentTheme.focusBorder} ${isDarkMode
                                                ? 'border-slate-600/50 bg-slate-700/50 text-slate-100 placeholder-slate-400 shadow-slate-800/20 hover:shadow-slate-700/30'
                                                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                }`}
                                            value={taxId}
                                            onChange={e => setTaxId(e.target.value)}
                                            placeholder="เลขผู้เสียภาษี"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={`block text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${currentTheme.accent}`}></span>
                                            Credit Term
                                        </label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md ${currentTheme.focus} ${currentTheme.focusBorder} ${isDarkMode
                                                ? 'border-slate-600/50 bg-slate-700/50 text-slate-100 placeholder-slate-400 shadow-slate-800/20 hover:shadow-slate-700/30'
                                                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                }`}
                                            value={creditTerm}
                                            onChange={e => setCreditTerm(e.target.value)}
                                            placeholder="เครดิตเทอม"
                                        />
                                    </div>
                                    {/* <div className="space-y-2">
                                        <label className={`block text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${currentTheme.accent}`}></span>
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md ${currentTheme.focus} ${currentTheme.focusBorder} ${isDarkMode
                                                ? 'border-slate-600/50 bg-slate-700/50 text-slate-100 placeholder-slate-400 shadow-slate-800/20 hover:shadow-slate-700/30'
                                                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                }`}
                                            value={city}
                                            onChange={e => setCity(e.target.value)}
                                            placeholder="ชื่อเมือง"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={`block text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${currentTheme.accent}`}></span>
                                            Country
                                        </label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md ${currentTheme.focus} ${currentTheme.focusBorder} ${isDarkMode
                                                ? 'border-slate-600/50 bg-slate-700/50 text-slate-100 placeholder-slate-400 shadow-slate-800/20 hover:shadow-slate-700/30'
                                                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                }`}
                                            value={country}
                                            onChange={e => setCountry(e.target.value)}
                                            placeholder="ชื่อประเทศ"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={`block text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${currentTheme.accent}`}></span>
                                            Currency Code
                                        </label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md ${currentTheme.focus} ${currentTheme.focusBorder} ${isDarkMode
                                                ? 'border-slate-600/50 bg-slate-700/50 text-slate-100 placeholder-slate-400 shadow-slate-800/20 hover:shadow-slate-700/30'
                                                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                }`}
                                            value={currencyCode}
                                            onChange={e => setCurrencyCode(e.target.value)}
                                            placeholder="สกุลเงิน"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={`block text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'
                                            }`}>
                                            <span className={`w-2 h-2 rounded-full ${currentTheme.accent}`}></span>
                                            Zip Code
                                        </label>
                                        <input
                                            type="text"
                                            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md ${currentTheme.focus} ${currentTheme.focusBorder} ${isDarkMode
                                                ? 'border-slate-600/50 bg-slate-700/50 text-slate-100 placeholder-slate-400 shadow-slate-800/20 hover:shadow-slate-700/30'
                                                : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                                }`}
                                            value={zipCode}
                                            onChange={e => setZipCode(e.target.value)}
                                            placeholder="รหัสไปรษณีย์"
                                        />
                                    </div> */}
                                </div>
                                {/* <div className="space-y-2">
                                    <label className={`block text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'
                                        }`}>
                                        <span className={`w-2 h-2 rounded-full ${currentTheme.accent}`}></span>
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm hover:shadow-md ${currentTheme.focus} ${currentTheme.focusBorder} ${isDarkMode
                                            ? 'border-slate-600/50 bg-slate-700/50 text-slate-100 placeholder-slate-400 shadow-slate-800/20 hover:shadow-slate-700/30'
                                            : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                                            }`}
                                        value={address}
                                        onChange={e => setAddress(e.target.value)}
                                        placeholder="ที่อยู่"
                                    />
                                </div> */}
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
                                    บันทึกข้อมูล
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EditVendor;