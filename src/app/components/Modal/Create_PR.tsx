import React from "react";
import { useTheme } from "../ThemeProvider";

import { LuX, LuFileText, LuFilePlus2 } from 'react-icons/lu';
import { HiCheckCircle } from 'react-icons/hi2';
import { SiMinutemailer } from 'react-icons/si';

export type CreatePRModalProps = {
    open: boolean;
    onClose: () => void;
    onConfirm: (mode: "draft" | "submitted") => void | Promise<void>;
};

const CreatePRModal: React.FC<CreatePRModalProps> = ({ open, onClose, onConfirm }) => {
    const { isDarkMode } = useTheme();

    const [selectedMode, setSelectedMode] = React.useState<"draft" | "submitted" | null>(null);

    if (!open) return null;

    const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const handleConfirm = () => {
        if (!selectedMode) {
            alert("กรุณาเลือกรูปแบบการสร้างใบ PR");
            return;
        }

        onConfirm(selectedMode);
        onClose();
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm transition-all duration-300 ${isDarkMode ? 'bg-black/80' : 'bg-black/40'}`}
            onClick={handleBackgroundClick}
        >
            <div className={`rounded-2xl shadow-2xl p-6 w-full max-w-md relative border transition-all duration-300 animate-in fade-in-0 zoom-in-95 ${isDarkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-emerald-900/50 border-slate-700' : 'bg-white border-gray-200 shadow-gray-300/30'}`}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 p-2 rounded-lg transition-all duration-200 cursor-pointer ${isDarkMode ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                >
                    <LuX className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center mb-8">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg transition-all ${isDarkMode ? 'bg-gradient-to-br from-emerald-600/20 to-emerald-700/30 border border-emerald-500/30' : 'bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200'}`}>
                        <LuFilePlus2 className={`w-7 h-7 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                    <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-slate-100' : 'text-gray-900'}`}>
                        เลือกรูปแบบการสร้าง PR
                    </h2>
                    <p className={`text-sm text-center max-w-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                        เลือกว่าต้องการบันทึกเป็นฉบับร่างหรือส่งเพื่ออนุมัติทันที
                    </p>
                </div>

                <div className="space-y-3 mb-6">
                    <div className="grid grid-cols-2 gap-3">
                        <label
                            className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 group ${
                                selectedMode === "draft"
                                    ? isDarkMode
                                        ? "border-yellow-500/80 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 shadow-lg shadow-yellow-500/20"
                                        : "border-yellow-500 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-md shadow-yellow-200"
                                    : isDarkMode
                                        ? "border-slate-600 hover:border-yellow-500/50 hover:bg-slate-800/40"
                                        : "border-gray-200 hover:border-yellow-400/60 hover:bg-yellow-50/30"
                            }`}
                        >
                            <input
                                type="radio"
                                name="pr-mode"
                                className="sr-only"
                                checked={selectedMode === "draft"}
                                onChange={() => setSelectedMode("draft")}
                            />
                            {selectedMode === "draft" && (
                                <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-md ${
                                    isDarkMode ? 'bg-yellow-500 text-slate-900' : 'bg-yellow-500 text-white'
                                }`}>
                                    <HiCheckCircle className="w-5 h-5" />
                                </div>
                            )}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                selectedMode === "draft"
                                    ? isDarkMode
                                        ? "bg-yellow-500/20 border border-yellow-500/30"
                                        : "bg-yellow-100 border border-yellow-300"
                                    : isDarkMode
                                        ? "bg-slate-700/50 border border-slate-600 group-hover:bg-yellow-500/10"
                                        : "bg-gray-100 border border-gray-200 group-hover:bg-yellow-50"
                            }`}>
                                <LuFileText
                                    className={`w-6 h-6 transition-colors ${
                                        selectedMode === "draft"
                                            ? isDarkMode
                                                ? "text-yellow-400"
                                                : "text-yellow-600"
                                            : isDarkMode
                                                ? "text-slate-400 group-hover:text-yellow-400"
                                                : "text-gray-400 group-hover:text-yellow-500"
                                    }`}
                                />
                            </div>
                            <div className="text-center">
                                <span
                                    className={`text-sm font-semibold block ${
                                        selectedMode === "draft"
                                            ? isDarkMode
                                                ? "text-yellow-300"
                                                : "text-yellow-700"
                                            : isDarkMode
                                                ? "text-slate-200 group-hover:text-yellow-300"
                                                : "text-gray-700 group-hover:text-yellow-600"
                                    }`}
                                >
                                    ร่างใบ PR
                                </span>
                                <span className={`text-xs mt-1 block ${
                                    selectedMode === "draft"
                                        ? isDarkMode ? "text-yellow-400/70" : "text-yellow-600/70"
                                        : isDarkMode ? "text-slate-400" : "text-gray-500"
                                }`}>
                                    บันทึกฉบับร่าง
                                </span>
                            </div>
                        </label>

                        <label
                            className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 group ${
                                selectedMode === "submitted"
                                    ? isDarkMode
                                        ? "border-emerald-500/80 bg-gradient-to-br from-emerald-500/10 to-green-600/5 shadow-lg shadow-emerald-500/20"
                                        : "border-emerald-500 bg-gradient-to-br from-emerald-50 to-green-50 shadow-md shadow-emerald-200"
                                    : isDarkMode
                                        ? "border-slate-600 hover:border-emerald-500/50 hover:bg-slate-800/40"
                                        : "border-gray-200 hover:border-emerald-400/60 hover:bg-emerald-50/30"
                            }`}
                        >
                            <input
                                type="radio"
                                name="pr-mode"
                                className="sr-only"
                                checked={selectedMode === "submitted"}
                                onChange={() => setSelectedMode("submitted")}
                            />
                            {selectedMode === "submitted" && (
                                <div className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center shadow-md ${
                                    isDarkMode ? 'bg-emerald-500 text-slate-900' : 'bg-emerald-500 text-white'
                                }`}>
                                    <HiCheckCircle className="w-5 h-5" />
                                </div>
                            )}
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                                selectedMode === "submitted"
                                    ? isDarkMode
                                        ? "bg-emerald-500/20 border border-emerald-500/30"
                                        : "bg-emerald-100 border border-emerald-300"
                                    : isDarkMode
                                        ? "bg-slate-700/50 border border-slate-600 group-hover:bg-emerald-500/10"
                                        : "bg-gray-100 border border-gray-200 group-hover:bg-emerald-50"
                            }`}>
                                <LuFilePlus2
                                    className={`w-6 h-6 transition-colors ${
                                        selectedMode === "submitted"
                                            ? isDarkMode
                                                ? "text-emerald-400"
                                                : "text-emerald-600"
                                            : isDarkMode
                                                ? "text-slate-400 group-hover:text-emerald-400"
                                                : "text-gray-400 group-hover:text-emerald-500"
                                    }`}
                                />
                            </div>
                            <div className="text-center">
                                <span
                                    className={`text-sm font-semibold block ${
                                        selectedMode === "submitted"
                                            ? isDarkMode
                                                ? "text-emerald-300"
                                                : "text-emerald-700"
                                            : isDarkMode
                                                ? "text-slate-200 group-hover:text-emerald-300"
                                                : "text-gray-700 group-hover:text-emerald-600"
                                    }`}
                                >
                                    สร้างใบ PR
                                </span>
                                <span className={`text-xs mt-1 block ${
                                    selectedMode === "submitted"
                                        ? isDarkMode ? "text-emerald-400/70" : "text-emerald-600/70"
                                        : isDarkMode ? "text-slate-400" : "text-gray-500"
                                }`}>
                                    ส่งเพื่ออนุมัติ
                                </span>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        type="button"
                        className={`flex-1 px-5 py-3 rounded-xl font-semibold transition-all duration-200 cursor-pointer ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-2 border-slate-700 hover:border-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-200 hover:border-gray-300'}`}
                        onClick={onClose}
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        disabled={!selectedMode}
                        className={`flex-1 px-5 py-3 rounded-xl font-semibold transition-all duration-200 transform active:scale-95 cursor-pointer ${
                            selectedMode
                                ? isDarkMode
                                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40'
                                    : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-md shadow-emerald-300/50 hover:shadow-lg hover:shadow-emerald-400/60'
                                : isDarkMode
                                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-50'
                        }`}
                        onClick={handleConfirm}
                    >
                        ยืนยันการสร้าง
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreatePRModal;