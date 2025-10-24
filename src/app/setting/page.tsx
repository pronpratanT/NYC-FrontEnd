"use client";

import React, { useEffect, useState } from "react";

// components
import { useTheme } from "../components/ThemeProvider";
import Sidebar from "../components/sidebar";
import Header from "../components/header";

export default function SettingsPage() {
    const { isDarkMode, toggleTheme } = useTheme();
    // Display scale (zoom)
    const [scale, setScale] = useState<number>(typeof window !== 'undefined' && localStorage.getItem('displayScale') ? Number(localStorage.getItem('displayScale')) : 1);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            document.documentElement.style.setProperty('--user-zoom', String(scale));
            localStorage.setItem('displayScale', String(scale));
        }
    }, [scale]);

        return (
            <div className="min-h-screen from-blue-50 via-white to-emerald-50">
                <Sidebar />
                <Header />
                <main
                    className="mt-[7.5rem] mr-6 transition-all duration-300"
                    style={{ minHeight: 'calc(100vh - 3rem)', marginLeft: 'calc(18rem + 55px)' }}
                >
                    <div className="w-full max-w-3xl mx-auto px-4 py-12">
                        <div className="mb-10 text-center">
                            <h1 className="text-4xl font-extrabold text-emerald-700 mb-2 tracking-tight">ตั้งค่าระบบ</h1>
                            <p className="text-gray-500 text-lg">ปรับแต่งประสบการณ์การใช้งานของคุณ</p>
                        </div>

                        <div className="grid gap-8">
                            {/* Display Scale Setting */}
                            <section className="rounded-2xl shadow bg-white border border-blue-100/60 p-7 flex items-center gap-6">
                                <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center bg-blue-50">
                                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 12h8M12 8v8"/></svg>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-blue-700 mb-1">ขนาดการแสดงผล (Scale)</h2>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min={0.8}
                                            max={1.5}
                                            step={0.01}
                                            value={scale}
                                            onChange={e => setScale(Number(e.target.value))}
                                            className="w-48 accent-blue-500"
                                        />
                                        <span className="ml-2 text-lg font-semibold">{Math.round(scale * 100)}%</span>
                                    </div>
                                    <div className="text-gray-500 text-xs mt-1">ปรับขนาดการแสดงผลของหน้าจอให้เหมาะสมกับสายตา</div>
                                </div>
                            </section>

                            {/* Theme Setting */}
                            <section className="rounded-2xl shadow bg-white border border-emerald-100/60 p-7 flex items-center gap-6">
                                <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center bg-emerald-50">
                                    <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-emerald-700 mb-1">ธีม</h2>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-gray-700">โหมด:</span>
                                        <button
                                            type="button"
                                            className={`px-5 py-2 rounded-lg font-semibold border transition-colors duration-200 shadow-sm ${isDarkMode ? 'bg-gray-900 text-white border-gray-700' : 'bg-gray-100 text-gray-900 border-gray-300'}`}
                                            onClick={toggleTheme}
                                        >
                                            {isDarkMode ? 'Dark' : 'Light'}
                                        </button>
                                    </div>
                                    <div className="text-gray-500 text-xs mt-1">เลือกโหมดแสงสว่างที่เหมาะกับคุณ</div>
                                </div>
                            </section>

                            {/* Other settings placeholder */}
                            <section className="rounded-2xl shadow bg-white border border-gray-100/60 p-7 flex items-center gap-6">
                                <div className="flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center bg-gray-50">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/></svg>
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-lg font-bold text-gray-700 mb-1">การตั้งค่าอื่น ๆ</h2>
                                    <ul className="list-disc ml-6 text-gray-700 space-y-2 text-sm">
                                        <li>ตั้งค่าการแจ้งเตือน (Notification) <span className="text-xs text-gray-400">(เร็ว ๆ นี้)</span></li>
                                        <li>ตั้งค่าภาษา <span className="text-xs text-gray-400">(เร็ว ๆ นี้)</span></li>
                                        <li>ตั้งค่าความเป็นส่วนตัว <span className="text-xs text-gray-400">(เร็ว ๆ นี้)</span></li>
                                    </ul>
                                </div>
                            </section>
                        </div>
                    </div>
                </main>
            </div>
        );
}