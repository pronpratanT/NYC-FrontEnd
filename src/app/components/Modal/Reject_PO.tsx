"use client";
import React, { useState } from "react";
import { HiExclamationTriangle, HiXMark } from "react-icons/hi2";
import { useTheme } from "../ThemeProvider";

interface RejectPOModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    poNo: string | null;
}

const RejectPOModal: React.FC<RejectPOModalProps> = ({ open, onClose, onConfirm, poNo }) => {
    const { isDarkMode } = useTheme();
    const [reason, setReason] = useState("");
    const [error, setError] = useState("");

    const handleConfirm = () => {
        // if (!reason.trim()) {
        //     setError("กรุณากรอกเหตุผลในการปฏิเสธ");
        //     return;
        // }
        onConfirm(reason);
        setReason("");
        setError("");
        onClose();
    };

    const handleCancel = () => {
        setReason("");
        setError("");
        onClose();
    };

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={handleCancel}
            aria-modal="true"
            role="dialog"
        >
            <div
                className={`rounded-2xl shadow-2xl w-full max-w-lg p-0 relative transform transition-all duration-300 scale-100 ${isDarkMode ? 'bg-slate-800 border border-slate-700/50' : 'bg-white'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`relative rounded-t-2xl p-6 text-white ${isDarkMode ? 'bg-gradient-to-r from-red-600 to-rose-600' : 'bg-gradient-to-r from-red-500 to-rose-500'}`}>
                    <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-white/15 border border-white/20' : 'bg-white/20'}`}>
                            <HiExclamationTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">ปฏิเสธ PO</h2>
                            <p className={`text-sm ${isDarkMode ? 'text-red-200/80' : 'text-red-100'}`}>PO #{poNo}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleCancel}
                        className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 ${isDarkMode ? 'bg-white/10 hover:bg-white/20 border border-white/20' : 'bg-white/20 hover:bg-white/30'}`}
                    >
                        <HiXMark className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className={`p-6 rounded-b-2xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                    <div className="mb-6">
                        <label className={`block mb-3 text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                            เหตุผลในการปฏิเสธ <span className={`${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>*</span>
                        </label>
                        <textarea
                            className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${isDarkMode ? 'bg-slate-900/50 text-slate-100 border-slate-600/50 focus:ring-red-400/30 focus:border-red-400/50 placeholder-slate-400' : 'bg-white text-gray-900 border-gray-300 focus:ring-red-400/50 focus:border-red-400 placeholder-gray-500'}`}
                            rows={4}
                            value={reason}
                            onChange={e => {
                                setReason(e.target.value);
                                if (error) setError("");
                            }}
                            placeholder="กรุณาระบุเหตุผลในการปฏิเสธ PO นี้..."
                        />
                        {error && (
                            <div className={`flex items-center gap-2 mt-3 text-sm p-3 rounded-lg border ${isDarkMode ? 'text-red-400 bg-red-900/20 border-red-800/50' : 'text-red-600 bg-red-50 border-red-200'}`}>
                                <HiExclamationTriangle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3">
                        <button
                            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 border ${isDarkMode ? 'bg-slate-700/50 border-slate-600 text-slate-200 hover:bg-slate-600/50 hover:border-slate-500' : 'bg-gray-100 border-gray-200 text-gray-700 hover:bg-gray-200 hover:border-gray-300'}`}
                            onClick={handleCancel}
                        >
                            ยกเลิก
                        </button>
                        <button
                            className={`px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 flex items-center gap-2 shadow-lg ${isDarkMode ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 hover:shadow-red-600/25' : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 hover:shadow-red-500/25'}`}
                            onClick={handleConfirm}
                        >
                            <HiExclamationTriangle className="w-5 h-5" />
                            ปฏิเสธ PO
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RejectPOModal;
