import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../ThemeProvider";

// icon
import { TiPlus } from "react-icons/ti";

// component props
import { useToken } from "@/app/context/TokenContext";
import CreatPartNo from "./CreatPartNo";

interface POModalProps {
    open: boolean;
    onClose: () => void;
    part: any;
    onSubmit: (data: { remark: string; freebieQty: number }) => void;
}

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

const POModal: React.FC<POModalProps> = ({ open, onClose, part, onSubmit }) => {
    const { isDarkMode } = useTheme();
    const [remark, setRemark] = useState("");
    // freebieQtys: { [partNo: string]: number }
    const [freebieQtys, setFreebieQtys] = useState<{ [partNo: string]: number }>({});

    const token = useToken();

    // Part No. search states
    const [search, setSearch] = useState("");
    const [partNos, setPartNos] = useState<string[]>([]);
    const [selectedParts, setSelectedParts] = useState<string[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showCreatPartNo, setShowCreatPartNo] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Search part no
    useEffect(() => {
        if (!search) {
            setPartNos([]);
            setShowDropdown(false);
            return;
        }
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/proxy/purchase/search-part-no?keyword=${encodeURIComponent(search)}`, { cache: "no-store" });
                if (!response.ok) {
                    throw new Error(`PartNo API error: HTTP ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                const arr = Array.isArray(data.data) ? data.data : [];
                setPartNos(arr);
                setShowDropdown(true);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    console.error(err.message);
                } else {
                    console.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [search]);

    // ปิด dropdown เมื่อคลิกนอก input หรือ dropdown
    useEffect(() => {
        if (!showDropdown) return;
        function handleClickOutside(event: MouseEvent) {
            if (
                inputRef.current && !inputRef.current.contains(event.target as Node) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showDropdown]);

    if (!open) return null;

    // ปิด modal เมื่อคลิก backdrop
    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    // Add free Item to DB (multi-item)
    const handleAddFreeItem = async () => {
        if (selectedParts.length === 0) {
            alert("กรุณาเลือก Part No. ที่ต้องการเพิ่มของแถม");
            return;
        }
        let successCount = 0;
        for (const partNoRaw of selectedParts) {
            // Use only the first part_no before '|'
            const partNo = partNoRaw.split('|')[0].trim();
            const qty = freebieQtys[partNoRaw] || 0;
            if (qty <= 0) continue; // skip if qty is not set or zero
            const body = {
                po_list_id: part?.po_list_id,
                part_no: partNo,
                qty,
                remark: remark.trim(),
            };
            console.log("Adding free item with data:", body);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/add-free-item`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(body),
                });
                if (!response.ok) {
                    throw new Error(`Failed to add free item: ${response.statusText}`);
                }
                const data = await response.json();
                console.log('Free item added successfully:', data);
                successCount++;
            } catch (error) {
                console.error('Error adding free item:', error);
            }
        }
        if (successCount > 0) {
            alert('บันทึกข้อมูลของแถมเรียบร้อยแล้ว');
        }
        onClose();
    };

    return (
        <>
            <style>{scrollbarStyles}</style>
            <div
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900/60 via-gray-900/40 to-slate-800/60 backdrop-blur-sm modal-backdrop"
                onClick={handleBackdropClick}
            >
                <div
                    className={`relative rounded-xl shadow-2xl border p-0 max-w-2xl w-full mx-4 overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
                    style={{ maxHeight: '90vh', minWidth: '480px' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header with professional design */}
                    <div className={`border-b p-6 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-blue-700' : 'bg-blue-600'}`}>
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>รายละเอียดสินค้า</h2>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Product Details & Additional Items</p>
                                </div>
                            </div>
                            <button
                                className={`w-8 h-8 rounded-lg transition-all duration-200 flex items-center justify-center text-lg ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-slate-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                                onClick={onClose}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                    {/* Content with scrollbar, header is fixed above */}
                    <div className="p-6 custom-scrollbar" style={{ maxHeight: 'calc(90vh - 80px)', overflowY: 'auto' }}>
                        {/* Product Information Table */}
                        <div className="mb-6">
                            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>ข้อมูลสินค้า</h3>
                            <div className={`rounded-lg border overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                <div className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
                                    <div className="grid grid-cols-3 gap-0">
                                        <div className={`px-4 py-3 text-sm font-medium ${isDarkMode ? 'text-gray-300 bg-slate-700' : 'text-gray-700 bg-gray-100'}`}>Part Number</div>
                                        <div className={`px-4 py-3 text-sm font-mono col-span-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{part?.part_no}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-0">
                                        <div className={`px-4 py-3 text-sm font-medium ${isDarkMode ? 'text-gray-300 bg-slate-700' : 'text-gray-700 bg-gray-100'}`}>Product Code</div>
                                        <div className={`px-4 py-3 text-sm font-mono col-span-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{part?.prod_code}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-0">
                                        <div className={`px-4 py-3 text-sm font-medium ${isDarkMode ? 'text-gray-300 bg-slate-700' : 'text-gray-700 bg-gray-100'}`}>ชื่อสินค้า</div>
                                        <div className={`px-4 py-3 text-sm col-span-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{part?.part_name}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-0">
                                        <div className={`px-4 py-3 text-sm font-medium ${isDarkMode ? 'text-gray-300 bg-slate-700' : 'text-gray-700 bg-gray-100'}`}>PR Number</div>
                                        <div className={`px-4 py-3 text-sm font-medium col-span-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{part?.pr_no}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-0">
                                        <div className={`px-4 py-3 text-sm font-medium ${isDarkMode ? 'text-gray-300 bg-slate-700' : 'text-gray-700 bg-gray-100'}`}>จำนวน</div>
                                        <div className={`px-4 py-3 text-sm font-semibold col-span-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{part?.qty} {part?.unit}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-0">
                                        <div className={`px-4 py-3 text-sm font-medium ${isDarkMode ? 'text-gray-300 bg-slate-700' : 'text-gray-700 bg-gray-100'}`}>ราคาต่อหน่วย</div>
                                        <div className={`px-4 py-3 text-sm font-semibold col-span-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>฿{part?.unit_price?.toLocaleString()}</div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-0">
                                        <div className={`px-4 py-3 text-sm font-medium ${isDarkMode ? 'text-gray-300 bg-slate-700' : 'text-gray-700 bg-gray-100'}`}>ส่วนลด</div>
                                        <div className={`px-4 py-3 text-sm col-span-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {part?.discount && Array.isArray(part.discount) && part.discount.length > 0 ? (
                                                <div className="flex flex-wrap gap-1">
                                                    {Array.from({ length: Math.ceil(part.discount.length / 3) }, (_, rowIdx) => (
                                                        <div key={rowIdx} className="flex gap-1">
                                                            {part.discount.slice(rowIdx * 3, rowIdx * 3 + 3).map((discount: number, i: number) => (
                                                                <span
                                                                    key={i}
                                                                    className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${isDarkMode ? 'bg-orange-900/80 text-orange-300' : 'bg-orange-100 text-orange-700'}`}
                                                                    title={`ส่วนลด: ${discount}%`}
                                                                >
                                                                    {discount}%
                                                                </span>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>ไม่มีส่วนลด</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-0">
                                        <div className={`px-4 py-3 text-sm font-medium ${isDarkMode ? 'text-gray-300 bg-slate-700' : 'text-gray-700 bg-gray-100'}`}>ราคารวม</div>
                                        <div className={`px-4 py-3 text-sm font-bold col-span-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>฿{part?.amount?.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Additional Information Form */}
                        <div className="mb-6">
                            <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>ข้อมูลเพิ่มเติม</h3>
                            {/* Part No. Search Section */}
                            <div className="mb-4">
                                {/* <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    ค้นหา Part No.
                                </label> */}
                                <div className="w-full relative">
                                    <div className="relative w-full">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            placeholder="ค้นหา/เพิ่ม Part No..."
                                            className={`px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-full shadow-sm transition-all duration-200 pr-10 ${isDarkMode ? 'border-slate-600 bg-slate-800 text-gray-100 placeholder-slate-500' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'}`}
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            onFocus={() => search && partNos.length > 0 ? setShowDropdown(true) : undefined}
                                        />
                                        <button
                                            type="button"
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-white font-bold shadow transition-all duration-150 cursor-pointer ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                            style={{ zIndex: 2 }}
                                            onClick={() => setShowCreatPartNo(true)}
                                        >
                                            <TiPlus size={16} />
                                            <span className="sr-only">เพิ่ม Part No.</span>
                                        </button>
                                        {/* Modal CreatPartNo */}
                                        {showCreatPartNo && (
                                            <div className="fixed inset-0 z-[10000] flex items-center justify-center">
                                                <CreatPartNo
                                                    onConfirm={data => {
                                                        setShowCreatPartNo(false);
                                                        // สามารถเพิ่ม logic เช่น refresh part list หรือ setSelectedParts ได้ที่นี่
                                                    }}
                                                    onCancel={() => setShowCreatPartNo(false)}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    {loading && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <div className={`animate-spin rounded-full h-5 w-5 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
                                        </div>
                                    )}
                                    {showDropdown && search && partNos.length > 0 && (
                                        <div ref={dropdownRef} className={`absolute z-[9999] w-full border rounded-lg shadow-xl mt-2 max-h-56 overflow-y-auto ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`} style={{ zIndex: 9999 }}>
                                            <div className="p-2">
                                                <div className={`text-xs px-4 py-3 border-b rounded-t-lg ${isDarkMode ? 'text-gray-300 bg-slate-700 border-slate-600' : 'text-gray-700 border-gray-200 bg-gray-50'}`}>
                                                    พบ {partNos.length} รายการ
                                                </div>
                                                {partNos.map((part, idx) => (
                                                    <div
                                                        key={part + '-' + idx}
                                                        className={`flex items-center px-4 py-3 cursor-pointer rounded-lg transition-all duration-200 ${selectedParts.includes(part) ? (isDarkMode ? 'bg-blue-900/30 border-l-4 border-blue-500 font-semibold text-blue-400' : 'bg-blue-50 border-l-4 border-blue-500 font-semibold text-blue-700') : (isDarkMode ? 'hover:bg-slate-700 text-gray-300' : 'hover:bg-gray-50 text-gray-700')}`}
                                                        onClick={() => {
                                                            if (selectedParts.includes(part)) {
                                                                setSelectedParts(selectedParts.filter(p => p !== part));
                                                            } else {
                                                                setSelectedParts([...selectedParts, part]);
                                                            }
                                                        }}
                                                    >
                                                        {selectedParts.includes(part) && (
                                                            <span className={`inline-block w-3 h-3 rounded-full mr-3 ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'}`} title="Selected"></span>
                                                        )}
                                                        <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{part}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Selected Parts List */}
                                {selectedParts.length > 0 && (
                                    <div className="mt-4">
                                        <div className={`border rounded-lg overflow-hidden ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                                            <div className={`px-4 py-3 border-b ${isDarkMode ? 'bg-slate-700 border-slate-600 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                                <h4 className="text-sm font-medium">Part No. ที่เลือก ({selectedParts.length} รายการ)</h4>
                                            </div>
                                            <div className="divide-y divide-slate-600 max-h-48 overflow-y-auto custom-scrollbar">
                                                {selectedParts.map((partNo, idx) => (
                                                    <div key={`selected-${partNo}-${idx}`} className={`p-4 ${isDarkMode ? 'divide-slate-600' : 'divide-gray-200'}`}>
                                                        <div className="flex items-center justify-between gap-4">
                                                            <div className="flex-1 min-w-0">
                                                                <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                    {partNo}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-2">
                                                                    <label className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>ของแถม:</label>
                                                                    <input
                                                                        type="number"
                                                                        min={0}
                                                                        placeholder="0"
                                                                        className={`w-20 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'border-slate-600 bg-slate-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                                                                        value={freebieQtys[partNo] || ""}
                                                                        onChange={e => {
                                                                            const val = Math.max(0, Number(e.target.value));
                                                                            setFreebieQtys(qtys => ({ ...qtys, [partNo]: val }));
                                                                        }}
                                                                    />
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedParts(selectedParts.filter(p => p !== partNo))}
                                                                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${isDarkMode ? 'text-red-400 hover:bg-red-900/30 hover:text-red-300' : 'text-red-500 hover:bg-red-50 hover:text-red-600'}`}
                                                                    title="ลบรายการ"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        หมายเหตุ
                                    </label>
                                    <textarea
                                        className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${isDarkMode ? 'border-slate-600 bg-slate-800 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                                        rows={4}
                                        value={remark}
                                        onChange={e => setRemark(e.target.value)}
                                        placeholder="กรอกหมายเหตุเพิ่มเติม..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className={`flex justify-end space-x-3 pt-4 border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                            <button
                                className={`px-6 py-2 rounded-lg border font-medium transition-colors duration-200 ${isDarkMode ? 'border-slate-600 text-gray-300 bg-slate-800 hover:bg-slate-700' : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'}`}
                                onClick={onClose}
                            >
                                ยกเลิก
                            </button>
                            <button
                                className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                onClick={handleAddFreeItem}
                            >
                                บันทึกข้อมูล
                            </button>
                        </div>
                        <div className="pt-3"></div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default POModal;
