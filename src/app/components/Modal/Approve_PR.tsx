import React from "react";
import { useTheme } from "../ThemeProvider";

export type ApprovePRModalProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    prNo: string | null;
};

const ApprovePRModal: React.FC<ApprovePRModalProps> = ({ open, onClose, onConfirm, prNo }) => {
    const { isDarkMode } = useTheme();

    if (!open) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
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
            <div className={`rounded-3xl shadow-2xl p-8 w-full max-w-lg relative border transition-all duration-300 animate-in fade-in-0 zoom-in-95 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 to-slate-800 shadow-emerald-900/40 border-emerald-600' : 'bg-white border-gray-100'}`}>
                <div className="flex flex-col items-center mb-6">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-lg ${isDarkMode ? 'bg-gradient-to-br from-emerald-800/30 to-emerald-900/50 border-2 border-emerald-500/40' : 'bg-gradient-to-br from-emerald-100 to-emerald-200 border-2 border-emerald-300'}`}>
                        <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" className={`${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        ยืนยันการอนุมัติ
                    </h2>
                    <div className={`text-lg font-semibold px-3 py-1 rounded-lg mb-2 ${isDarkMode ? 'bg-slate-700/50 text-emerald-300 border border-emerald-500/30' : 'bg-gray-100 text-gray-700 border border-gray-300'}`}>
                        {prNo}
                    </div>
                    <span className={`text-sm text-center ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                        คุณต้องการอนุมัติคำขอนี้หรือไม่?<br />
                        <span className={`font-medium ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                            กรุณาตรวจสอบข้อมูลให้ครบถ้วนก่อนยืนยัน
                        </span>
                    </span>
                </div>

                <div className="flex justify-center gap-3 mt-8">
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
                            ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white border-2 border-emerald-500 focus:ring-2 focus:ring-emerald-400/50' 
                            : 'bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white border-2 border-emerald-400 focus:ring-2 focus:ring-emerald-300/50'
                        } focus:outline-none`}
                        onClick={handleConfirm}
                    >
                        ✓ ยืนยันอนุมัติ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ApprovePRModal;