import React, { useState } from "react";
import { useTheme } from "../ThemeProvider";

export type RejectPRModalProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void | Promise<void>;
    prNo: string | null;
};

const RejectPRModal: React.FC<RejectPRModalProps> = ({ open, onClose, onConfirm, prNo }) => {
    const { isDarkMode } = useTheme();
    const [reason, setReason] = useState("");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [error, setError] = useState("");

    if (!open) return null;

    const handleConfirm = () => {
        // if (!reason.trim()) {
        //     setError("กรุณาระบุเหตุผลในการปฏิเสธ");
        //     return;
        // }
        setError("");
        onConfirm(reason);
        setReason("");
    };

    const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/40'}`}
            onClick={handleBackgroundClick}
        >
            <div className={`rounded-3xl shadow-2xl p-8 w-full max-w-lg relative border transition-all duration-300 animate-in fade-in-0 zoom-in-95 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 to-slate-800 shadow-rose-900/40 border-rose-600' : 'bg-white border-gray-100'}`}>
                {/* <button
                    className="absolute top-4 right-4 text-gray-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-300 text-2xl font-bold transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button> */}
                <div className="flex flex-col items-center mb-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-lg ${isDarkMode ? 'bg-gradient-to-br from-red-800/30 to-red-900/50 border-2 border-red-500/40' : 'bg-gradient-to-br from-red-100 to-red-200 border-2 border-red-300'}`}>
                        <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={`${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                        ปฏิเสธคำขอ
                    </h2>
                    <div className={`text-lg font-semibold px-3 py-1 rounded-lg mb-2 ${isDarkMode ? 'bg-slate-700/50 text-emerald-300 border border-emerald-500/30' : 'bg-gray-100 text-gray-700 border border-gray-300'}`}>
                        {prNo}
                    </div>
                    <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>กรุณาระบุเหตุผลในการปฏิเสธคำขอนี้</span>
                </div>
                <label className={`block mb-3 font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                    เหตุผลในการปฏิเสธ
                </label>
                <textarea
                    className={`w-full rounded-xl p-4 mb-3 resize-none transition-all duration-200 ${isDarkMode
                        ? 'border-2 border-slate-600 bg-slate-800/50 text-slate-200 placeholder-slate-400 focus:border-rose-500 focus:bg-slate-800 focus:ring-2 focus:ring-rose-500/30'
                        : 'border-2 border-gray-200 bg-gray-50 text-gray-700 placeholder-gray-400 focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-200'
                        } focus:outline-none`}
                    rows={4}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="กรุณาระบุเหตุผลในการปฏิเสธคำขอนี้..."
                />
                {/* {error && (
                    <div className="text-red-600 dark:text-red-300 text-sm mb-3 text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-800/50">
                        {error}
                    </div>
                )} */}
                <div className="flex justify-end gap-3 mt-8">
                    {/* <button
                        className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${isDarkMode
                            ? 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white border-2 border-slate-600 hover:border-slate-500'
                            : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-800 border-2 border-gray-300 hover:border-gray-400'
                            }`}
                        onClick={onClose}
                    >
                        ยกเลิก
                    </button> */}
                    <button
                        className={`px-8 py-3 rounded-xl font-bold shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 ${isDarkMode
                            ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white border-2 border-red-500 focus:ring-2 focus:ring-red-400/50'
                            : 'bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white border-2 border-red-400 focus:ring-2 focus:ring-red-300/50'
                            } focus:outline-none`}
                        onClick={handleConfirm}
                    >
                        ✕ ยืนยันปฏิเสธ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RejectPRModal;