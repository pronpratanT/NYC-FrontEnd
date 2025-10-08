import React, { useState } from "react";
// If you use a global dark mode context, import and use it here
// import { useTheme } from "../../components/ThemeProvider";

export type RejectPRModalProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: () => Promise<void>;
    reason: string;
    setReason: React.Dispatch<React.SetStateAction<string>>;
    partNo: string;
};

const RejectCompare: React.FC<RejectPRModalProps> = ({ open, onClose, onConfirm, reason, setReason, partNo }) => {
    const [error, setError] = useState("");
    // partNo is now available for use in the modal/component logic

    if (!open) return null;

    const handleConfirm = async () => {
        if (!reason.trim()) {
            setError("กรุณาระบุเหตุผลในการปฏิเสธ");
            return;
        }
        setError("");
        await onConfirm();
        setReason("");
        onClose();
    };

    const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 dark:bg-black/70 backdrop-blur-sm transition-all duration-300"
            onClick={handleBackgroundClick}
        >
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl dark:shadow-slate-950/50 p-8 w-full max-w-lg relative border border-gray-100 dark:border-slate-600 transition-all duration-300 animate-in fade-in-0 zoom-in-95">
                {/* <button
                    className="absolute top-4 right-4 text-gray-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-300 text-2xl font-bold transition-colors duration-150 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center"
                    onClick={onClose}
                    aria-label="Close"
                >
                    ×
                </button> */}
                <div className="flex flex-col items-center mb-6">
                    <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-2">
                        <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-red-500 dark:text-red-400">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-1">ปฏิเสธ <span className="text-gray-700 dark:text-slate-200">{partNo}</span></h2>
                    <span className="text-sm text-gray-500 dark:text-slate-400">กรุณาระบุเหตุผลในการปฏิเสธการเปรียบเทียบ</span>
                </div>
                <label className="block mb-2 font-medium text-gray-700 dark:text-slate-200">เหตุผลในการปฏิเสธ</label>
                <textarea
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl p-3 mb-2 text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-800 transition-all duration-150"
                    rows={4}
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="กรุณาระบุเหตุผล..."
                />
                {error && (
                    <div className="text-red-600 dark:text-red-300 text-sm mb-3 text-center bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-200 dark:border-red-800/50">
                        {error}
                    </div>
                )}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        className="px-6 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-700 dark:from-red-700 dark:to-red-900 text-white font-bold shadow hover:from-red-600 hover:to-red-800 dark:hover:from-red-800 dark:hover:to-red-950 transition-all duration-150 cursor-pointer"
                        onClick={handleConfirm}
                    >
                        ยืนยัน
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RejectCompare;