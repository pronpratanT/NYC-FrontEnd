"use client";

import { useState, useEffect } from "react";
import { useTheme } from "../ThemeProvider";

// icons
import { IoTrashBinOutline } from "react-icons/io5";

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

interface SplitQTYModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedPart: Part | null;
    token: string | null;
    onSuccess?: () => void;
}

export default function SplitQTYModal({ isOpen, onClose, selectedPart, token, onSuccess }: SplitQTYModalProps) {
    const { isDarkMode } = useTheme();
    const [splitQuantities, setSplitQuantities] = useState<{ qty: number; id: number; plant: string }[]>([]);
    const [newQtyInput, setNewQtyInput] = useState("");

    // Initialize quantities when modal opens
    useEffect(() => {
        if (isOpen && selectedPart) {
            setSplitQuantities([]);
            setNewQtyInput("");
        }
    }, [isOpen, selectedPart]);

    const handleAddSplitQty = () => {
        const newQty = parseInt(newQtyInput);
        if (!newQty || newQty <= 0) {
            alert('กรุณากรอกจำนวนที่ถูกต้อง');
            return;
        }
        if (!selectedPart) return;
        const newId = Math.max(...splitQuantities.map(item => item.id), 0) + 1;
        // รองรับทั้งกรณีที่ selectedPart.plant เป็น Plant 1/Plant 2 หรือไม่มี
        const defaultPlant = selectedPart.plant === "Plant 1" || selectedPart.plant === "Plant 2" ? selectedPart.plant : "Plant 1";
        setSplitQuantities(prev => [...prev, { qty: newQty, id: newId, plant: defaultPlant }]);
        setNewQtyInput("");
    };

    const handleRemoveSplitQty = (id: number) => {
        if (splitQuantities.length <= 1) {
            alert('ต้องมีอย่างน้อย 1 รายการ');
            return;
        }
        setSplitQuantities(prev => prev.filter(item => item.id !== id));
    };

    const handlePlantChange = (id: number, plant: string) => {
        setSplitQuantities(prev => prev.map(item =>
            item.id === id ? { ...item, plant } : item
        ));
    };

    const handleConfirmSplit = async () => {
        if (!selectedPart || !token) return;
        try {
            let successCount = 0;
            let errorCount = 0;
            const errorDetails: string[] = [];
            for (const item of splitQuantities) {
                const splitData = {
                    pr_list_id: selectedPart.pr_list_id,
                    qty: item.qty,
                    plant: item.plant
                };
                console.log('Sending split data:', splitData);
                try {
                    const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pr/split-qty`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify(splitData)
                    });
                    if (response.ok) {
                        successCount++;
                    } else {
                        errorCount++;
                        const errText = await response.text();
                        errorDetails.push(`qty: ${item.qty} - ${errText}`);
                    }
                } catch (err) {
                    errorCount++;
                    errorDetails.push(`qty: ${item.qty} - ${err instanceof Error ? err.message : 'เกิดข้อผิดพลาด'}`);
                }
            }
            let message = `แบ่งจำนวนสำเร็จ ${successCount} รายการ`;
            if (errorCount > 0) {
                message += `, ล้มเหลว ${errorCount} รายการ\nรายละเอียด:\n${errorDetails.join('\n')}`;
            }
            alert(message);
            onClose();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error splitting quantity:', error);
            alert('เกิดข้อผิดพลาดในการแบ่งจำนวน');
        }
    };

    const handleClose = () => {
        onClose();
        setSplitQuantities([]);
        setNewQtyInput("");
    };

    if (!isOpen || !selectedPart) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                className={`rounded-2xl shadow-2xl border p-0 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`px-6 py-4 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                                แบ่งจำนวนรายการ
                            </h2>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                                {selectedPart.part_no} • {selectedPart.part_name}
                            </p>
                        </div>
                        <button
                            type="button"
                            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                            onClick={handleClose}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[50vh] overflow-y-auto">
                    {/* Part Info */}
                    <div className={`p-4 rounded-lg border mb-4 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                        <h4 className={`font-semibold text-sm mb-3 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                            ข้อมูลรายการ
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <span className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Part Name</span>
                                <p className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{selectedPart.part_name}</p>
                            </div>
                            <div className="space-y-1">
                                <span className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Part No</span>
                                <p className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{selectedPart.part_no}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <span className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>จำนวนเดิม</span>
                                <p className={`font-semibold text-lg ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                    {selectedPart.qty} <span className="text-sm font-normal">{selectedPart.unit}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Add new quantity */}
                    <div className={`p-4 rounded-lg border mb-4 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                        <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                            เพิ่มรายการใหม่
                        </label>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <input
                                    type="number"
                                    min="1"
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-600 text-slate-200 focus:ring-blue-500/30 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:ring-blue-500 focus:border-blue-500'}`}
                                    placeholder="กรอกจำนวน"
                                    value={newQtyInput}
                                    onChange={(e) => setNewQtyInput(e.target.value)}
                                />
                            </div>
                            <button
                                type="button"
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                                onClick={handleAddSplitQty}
                            >
                                เพิ่มรายการ
                            </button>
                        </div>
                    </div>

                    {/* Split quantities list */}
                    <div>
                        <h3 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                            รายการที่แบ่ง ({splitQuantities.length} รายการ)
                        </h3>

                        {splitQuantities.length > 0 ? (
                            <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-slate-700">
                                {/* Table Header */}
                                <div className={`grid grid-cols-12 gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-gray-100 text-gray-700 border-gray-200'} border-b`}>
                                    <div className="col-span-2 text-center">ลำดับ</div>
                                    <div className="col-span-3 text-center">จำนวน</div>
                                    <div className="col-span-4 text-center">Plant</div>
                                    <div className="col-span-3 text-center">Actions</div>
                                </div>

                                {/* Table Body */}
                                <div className="divide-y divide-gray-200 dark:divide-slate-700">
                                    {splitQuantities.map((item, index) => (
                                        <div key={item.id} className={`grid grid-cols-12 gap-4 px-4 py-3 ${isDarkMode ? 'bg-slate-900 hover:bg-slate-800' : 'bg-white hover:bg-gray-50'} transition-colors`}>
                                            {/* ลำดับ */}
                                            <div className="col-span-2 flex items-center text-center justify-center">
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                                                    {index + 1}
                                                </span>
                                            </div>

                                            {/* จำนวน */}
                                            <div className="col-span-3 flex items-center justify-center">
                                                <div className="flex flex-col">
                                                    <span className={`font-bold text-lg ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                                        {item.qty}
                                                    </span>
                                                    <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                        {selectedPart.unit}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Plant */}
                                            <div className="col-span-4 flex items-center">
                                                <select
                                                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-200 focus:ring-blue-500/30 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-700 focus:ring-blue-500 focus:border-blue-500'}`}
                                                    value={item.plant}
                                                    onChange={e => handlePlantChange(item.id, e.target.value)}
                                                >
                                                    <option value="Plant 1">Plant 1</option>
                                                    <option value="Plant 2">Plant 2</option>
                                                </select>
                                            </div>

                                            {/* การดำเนินการ */}
                                            <div className="col-span-3 flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    className={`px-3 py-1.5 rounded-lg cursor-pointer text-xs font-medium transition-colors ${isDarkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-800/50' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                                                    onClick={() => handleRemoveSplitQty(item.id)}
                                                >
                                                    <IoTrashBinOutline className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className={`text-center py-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                <p className="font-medium">ยังไม่มีรายการที่แบ่ง</p>
                                <p className="text-sm mt-1">กรอกจำนวนและกดปุ่ม &quot;เพิ่มรายการ&quot; เพื่อเริ่มต้น</p>
                            </div>
                        )}
                    </div>

                    {/* Summary */}
                    {splitQuantities.length > 0 && (
                        <div className={`mt-4 p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                            <h4 className={`font-semibold text-sm mb-3 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                                สรุปรายการทั้งหมดหลังแบ่ง
                            </h4>

                            <div className="space-y-3">
                                {/* ส่วนหัว - จำนวนรายการทั้งหมด */}
                                <div className={`p-3 rounded-lg border text-center ${isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-gray-300'}`}>
                                    <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                                        จำนวนรายการทั้งหมด
                                    </p>
                                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                        {1 + splitQuantities.length} รายการ
                                    </p>
                                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                                        (1 รายการหลัก + {splitQuantities.length} รายการแบ่ง)
                                    </p>
                                </div>

                                {/* รายการหลัก (ที่เหลือ) */}
                                <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-gray-200'}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                                                หลัก
                                            </span>
                                            <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                                รายการหลัก (เหลือ):
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`font-bold text-lg ${selectedPart.qty - splitQuantities.reduce((sum, item) => sum + item.qty, 0) >= 0
                                                ? (isDarkMode ? 'text-slate-200' : 'text-gray-900')
                                                : (isDarkMode ? 'text-red-400' : 'text-red-600')
                                                }`}>
                                                {selectedPart.qty - splitQuantities.reduce((sum, item) => sum + item.qty, 0)} {selectedPart.unit}
                                            </span>
                                            <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                                {selectedPart.plant}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* รายการที่แบ่ง */}
                                {splitQuantities.map((item, index) => (
                                    <div key={item.id} className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-600' : 'bg-white border-gray-200'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                                                    {index + 1}
                                                </span>
                                                <span className={`text-sm ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                                    รายการแบ่งที่ {index + 1}:
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`font-bold text-lg ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                                    {item.qty} {selectedPart.unit}
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded ${isDarkMode ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                                    {item.plant}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* เส้นแบ่งและสถานะ */}
                                <div className="border-t border-gray-300 dark:border-slate-600 pt-3">
                                    {/* สถานะการแบ่ง */}
                                    <div className="flex items-center justify-center">
                                        {selectedPart.qty - splitQuantities.reduce((sum, item) => sum + item.qty, 0) === 0 ? (
                                            <div className="text-center">
                                                <span className={`inline-block text-xs px-3 py-1 rounded-full ${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                                                    ✓ แบ่งครบถ้วน
                                                </span>
                                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                    รายการหลักจะถูกลบ (จำนวน 0)
                                                </p>
                                            </div>
                                        ) : selectedPart.qty - splitQuantities.reduce((sum, item) => sum + item.qty, 0) > 0 ? (
                                            <div className="text-center">
                                                <span className={`inline-block text-xs px-3 py-1 rounded-full ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                                    ✓ พร้อมแบ่ง
                                                </span>
                                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                    รายการหลักจะเหลือ {selectedPart.qty - splitQuantities.reduce((sum, item) => sum + item.qty, 0)} {selectedPart.unit}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <span className={`inline-block text-xs px-3 py-1 rounded-full ${isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700'}`}>
                                                    ⚠ เกินจำนวน
                                                </span>
                                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                                                    เกินจำนวนเดิม {Math.abs(selectedPart.qty - splitQuantities.reduce((sum, item) => sum + item.qty, 0))} {selectedPart.unit}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`px-6 py-4 border-t ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm">
                            <span className={`${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                                รายการทั้งหมด: <span className="font-medium">{splitQuantities.length}</span> รายการ
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                className={`px-4 py-2 rounded-lg border font-medium transition-colors ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                onClick={handleClose}
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="button"
                                disabled={splitQuantities.length === 0}
                                className={`px-6 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'}`}
                                onClick={handleConfirmSplit}
                            >
                                ยืนยันการแบ่ง
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
