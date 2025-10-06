"use client";

import Sidebar from "../../../components/sidebar";
import Header from "../../../components/header";
import { useTheme } from "../../../components/ThemeProvider";

export default function PurchaseOrderPage() {
    const { isDarkMode } = useTheme();

    return (
        <div className="min-h-screen">
            <Sidebar />
            <Header />
            <main
                className="mt-[7.5rem] mr-6 transition-all duration-300 relative"
                style={{ minHeight: 'calc(100vh - 3rem)', position: 'relative', marginLeft: 'calc(18rem + 55px)' }}
            >
                <div className="pl-5 pb-5 pr-5 relative z-10">
                    <div className={`rounded-3xl shadow border p-8 text-center ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-green-100'}`}>
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 mx-auto ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-10 w-10 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        
                        <h1 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>
                            Purchase Order (PO)
                        </h1>
                        
                        <p className={`text-lg mb-6 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            ระบบจัดการใบสั่งซื้อ
                        </p>
                        
                        <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm border shadow-sm ${isDarkMode ? 'bg-yellow-900/30 border-yellow-700/60 text-yellow-300' : 'bg-yellow-50 border-yellow-400 text-yellow-800'}`}>
                            <svg className={`w-5 h-5 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            กำลังพัฒนา - Coming Soon
                        </div>
                        
                        <div className={`mt-8 p-6 rounded-xl ${isDarkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-gray-50 border border-gray-200'}`}>
                            <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                คุณสมบัติที่จะมีในอนาคต:
                            </h3>
                            <ul className={`text-left space-y-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                                <li className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-emerald-400' : 'bg-emerald-500'}`}></span>
                                    จัดการใบสั่งซื้อ (Purchase Order)
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-emerald-400' : 'bg-emerald-500'}`}></span>
                                    ติดตามสถานะการสั่งซื้อ
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-emerald-400' : 'bg-emerald-500'}`}></span>
                                    จัดการข้อมูลผู้จำหน่าย
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${isDarkMode ? 'bg-emerald-400' : 'bg-emerald-500'}`}></span>
                                    รายงานการสั่งซื้อ
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}