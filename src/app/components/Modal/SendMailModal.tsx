'use client';

import React, { useState } from 'react';
import { useTheme } from '../ThemeProvider';
import { LuX, LuFileText } from 'react-icons/lu';
import { SiMinutemailer } from 'react-icons/si';

interface SendMailModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: (sendMail: boolean, documentLanguage?: 'thai' | 'english') => void;
    poNo: string;
}

export default function SendMailModal({ open, onClose, onConfirm, poNo }: SendMailModalProps) {
    const { isDarkMode } = useTheme();
    const [sendMail, setSendMail] = useState<boolean>(true);
    const [documentLanguage, setDocumentLanguage] = useState<'thai' | 'english'>('thai');

    const handleConfirm = () => {
        onConfirm(sendMail, sendMail ? documentLanguage : undefined);
        onClose();
        // Reset state
        setSendMail(true);
        setDocumentLanguage('thai');
    };

    const handleClose = () => {
        onClose();
        // Reset state
        setSendMail(true);
        setDocumentLanguage('thai');
    };

    if (!open) return null;

    const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center backdrop-blur-sm"
            onClick={handleBackgroundClick}
        >
            <div className={`relative rounded-2xl max-w-md w-full p-6 shadow-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}> 
                {/* Close button */}
                <button
                    type="button"
                    className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    onClick={handleClose}
                >
                    <LuX className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                            <SiMinutemailer className={`w-6 h-6 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        </div>
                        <div>
                            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                ส่งอีเมล PO
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                PO #{poNo}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {/* Send Mail Option */}
                    <div>
                        <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                            ต้องการส่งอีเมลหรือไม่?
                        </h4>
                        <div className="space-y-2">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="sendMail"
                                    checked={sendMail === true}
                                    onChange={() => setSendMail(true)}
                                    className={`w-4 h-4 ${isDarkMode ? 'text-emerald-500 bg-slate-700 border-slate-600' : 'text-emerald-600 bg-white border-gray-300'} focus:ring-emerald-500`}
                                />
                                <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                    ส่งอีเมล
                                </span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="radio"
                                    name="sendMail"
                                    checked={sendMail === false}
                                    onChange={() => setSendMail(false)}
                                    className={`w-4 h-4 ${isDarkMode ? 'text-emerald-500 bg-slate-700 border-slate-600' : 'text-emerald-600 bg-white border-gray-300'} focus:ring-emerald-500`}
                                />
                                <span className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                    ไม่ส่งอีเมล
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* Document Language Option - Show only if sending mail */}
                    {sendMail && (
                        <div className="space-y-3">
                            <h4 className={`text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-gray-700'}`}>
                                เลือกภาษาเอกสาร
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${documentLanguage === 'thai'
                                    ? (isDarkMode ? 'border-emerald-500 bg-emerald-500/10' : 'border-emerald-500 bg-emerald-50')
                                    : (isDarkMode ? 'border-slate-600 bg-slate-700/30 hover:border-slate-500' : 'border-gray-200 bg-gray-50 hover:border-gray-300')
                                    }`}>
                                    <input
                                        type="radio"
                                        name="documentLanguage"
                                        value="thai"
                                        checked={documentLanguage === 'thai'}
                                        onChange={() => setDocumentLanguage('thai')}
                                        className="sr-only"
                                    />
                                    <LuFileText className={`w-6 h-6 ${documentLanguage === 'thai'
                                        ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600')
                                        : (isDarkMode ? 'text-slate-400' : 'text-gray-400')
                                        }`} />
                                    <span className={`text-sm font-medium ${documentLanguage === 'thai'
                                        ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600')
                                        : (isDarkMode ? 'text-slate-300' : 'text-gray-600')
                                        }`}>
                                        ภาษาไทย
                                    </span>
                                </label>

                                <label className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${documentLanguage === 'english'
                                    ? (isDarkMode ? 'border-emerald-500 bg-emerald-500/10' : 'border-emerald-500 bg-emerald-50')
                                    : (isDarkMode ? 'border-slate-600 bg-slate-700/30 hover:border-slate-500' : 'border-gray-200 bg-gray-50 hover:border-gray-300')
                                    }`}>
                                    <input
                                        type="radio"
                                        name="documentLanguage"
                                        value="english"
                                        checked={documentLanguage === 'english'}
                                        onChange={() => setDocumentLanguage('english')}
                                        className="sr-only"
                                    />
                                    <LuFileText className={`w-6 h-6 ${documentLanguage === 'english'
                                        ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600')
                                        : (isDarkMode ? 'text-slate-400' : 'text-gray-400')
                                        }`} />
                                    <span className={`text-sm font-medium ${documentLanguage === 'english'
                                        ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-600')
                                        : (isDarkMode ? 'text-slate-300' : 'text-gray-600')
                                        }`}>
                                        English
                                    </span>
                                </label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-8">
                    <button
                        type="button"
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600 border border-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'}`}
                        onClick={handleClose}
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 shadow-md hover:shadow-lg ${isDarkMode ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white' : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white'}`}
                        onClick={handleConfirm}
                    >
                        {sendMail ? 'ส่งอีเมล' : 'บันทึก'}
                    </button>
                </div>
            </div>
        </div>
    );
}