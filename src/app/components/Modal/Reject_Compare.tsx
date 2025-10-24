import React, { useState } from "react";
import { useTheme } from "../ThemeProvider";

export type RejectPRModalProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    reason: string;
    setReason: React.Dispatch<React.SetStateAction<string>>;
};

const RejectCompare: React.FC<RejectPRModalProps> = ({ open, onClose, onConfirm, reason, setReason }) => {
    const { isDarkMode } = useTheme();
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    if (!open) return null;

    const handleConfirm = async () => {
        setError("");
        setIsLoading(true);
        
        try {
            await onConfirm();
            setReason("");
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการปฏิเสธ");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setError("");
        setReason("");
        onClose();
    };

    const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleCancel();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm transition-all duration-300"
            onClick={handleBackgroundClick}
        >
            <div 
                className={`w-full max-w-md mx-4 relative transform transition-all duration-300 scale-100 ${
                    isDarkMode 
                        ? 'bg-slate-900/95 border border-slate-700/60' 
                        : 'bg-white/95 border border-white/40'
                } backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div className={`px-8 py-6 ${
                    isDarkMode 
                        ? 'bg-gradient-to-r from-red-900/60 to-rose-900/60 border-b border-red-800/50' 
                        : 'bg-gradient-to-r from-red-50/80 to-rose-50/80 border-b border-red-200/60'
                }`}>
                    <div className="flex items-center justify-center space-x-3">
                        <div className={`p-3 rounded-full ${
                            isDarkMode ? 'bg-red-900/50' : 'bg-red-100'
                        }`}>
                            <svg 
                                className={`w-6 h-6 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="2" 
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                                />
                            </svg>
                        </div>
                        <div className="text-center">
                            <h2 className={`text-xl font-bold ${
                                isDarkMode ? 'text-red-400' : 'text-red-600'
                            }`}>
                                ปฏิเสธการเปรียบเทียบราคา
                            </h2>
                            {/* <p className={`text-sm mt-1 ${
                                isDarkMode ? 'text-slate-300' : 'text-slate-600'
                            }`}>
                                Part No: <span className="font-semibold">{partNo}</span>
                            </p> */}
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-6 space-y-4">
                    <div>
                        <label className={`block text-sm font-semibold mb-2 ${
                            isDarkMode ? 'text-slate-200' : 'text-slate-700'
                        }`}>
                            เหตุผลในการปฏิเสธ <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>(ไม่บังคับ)</span>
                        </label>
                        <textarea
                            className={`w-full rounded-lg border focus:outline-none focus:ring-2 transition-all duration-200 resize-none ${
                                isDarkMode 
                                    ? 'bg-slate-800/50 border-slate-600 text-slate-200 placeholder-slate-400 focus:ring-red-500/30 focus:border-red-500' 
                                    : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-500 focus:ring-red-200 focus:border-red-400'
                            } p-3`}
                            rows={4}
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            placeholder="กรุณาระบุเหตุผลในการปฏิเสธการเปรียบเทียบราคา..."
                            disabled={isLoading}
                        />
                    </div>

                    {error && (
                        <div className={`p-3 rounded-lg border ${
                            isDarkMode 
                                ? 'bg-red-900/30 border-red-700/50 text-red-300' 
                                : 'bg-red-50 border-red-200 text-red-700'
                        }`}>
                            <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className={`px-8 py-6 border-t ${
                    isDarkMode ? 'border-slate-700/60 bg-slate-800/30' : 'border-slate-200/60 bg-slate-50/50'
                }`}>
                    <div className="flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isLoading}
                            className={`px-5 py-2.5 rounded-lg font-semibold text-sm border transition-all duration-200 ${
                                isDarkMode
                                    ? 'bg-slate-700/50 border-slate-600 text-slate-300 hover:bg-slate-600/50 hover:border-slate-500'
                                    : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400'
                            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="button"
                            onClick={handleConfirm}
                            disabled={isLoading}
                            className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center space-x-2 ${
                                isLoading
                                    ? 'bg-slate-400 cursor-not-allowed text-white'
                                    : isDarkMode
                                        ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg hover:shadow-red-500/25'
                                        : 'bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white shadow-lg hover:shadow-red-500/25'
                            }`}
                        >
                            {isLoading && (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            )}
                            <span>{isLoading ? 'กำลังดำเนินการ...' : 'ยืนยันปฏิเสธ'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RejectCompare;