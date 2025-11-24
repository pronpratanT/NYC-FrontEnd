"use client";

import React, { useEffect, useState } from "react";

// components
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import { useToken } from "../context/TokenContext";
import { useTheme } from "../components/ThemeProvider";

type Department = {
    ID: number;
    name: string;
    short_name: string;
    dep_no: string;
};

type Me = {
    ID: number;
    employee_id: string;
    DepartmentID: number;
    Department: Department;
    f_name: string;
    l_name: string;
    is_active: boolean;
    last_login: string;
    has_license: boolean;
    birth_date: string;
    UserDepartmentId: number;
};

export default function ProfilePage() {
    const token = useToken();
    const { isDarkMode } = useTheme();
    const [me, setMe] = useState<Me | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMe = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_USER_SERVICE}/api/user/me`, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': "application/json",
                    },
                });
                if (!response.ok) throw new Error("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
                const data = await response.json();
                setMe(data.data);
            } catch (err: unknown) {
                if (err && typeof err === 'object' && 'message' in err && typeof (err as { message?: unknown }).message === 'string') {
                    setError((err as { message: string }).message);
                } else {
                    setError("เกิดข้อผิดพลาด");
                }
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchMe();
    }, [token]);

    // Helpers
    const stripThaiPrefix = (raw: string | undefined | null) => {
        if (!raw) return '';
        let name = raw.trim();
        const prefixes = ['นางสาว', 'นาง', 'นาย'];
        for (const p of prefixes) {
            if (name.startsWith(p)) {
                name = name.slice(p.length).trim();
                break;
            }
        }
        return name;
    };

    function buildTags(user: Me): string[] {
        const tags: string[] = [];
        if (user.Department?.short_name) tags.push(user.Department.short_name);
        if (user.Department?.dep_no) tags.push(`DEP-${user.Department.dep_no}`);
        if (user.has_license) tags.push('Licensed');
        tags.push(`ID-${user.ID}`);
        return tags;
    }

    return (
        <div className="min-h-screen">
            <Sidebar />
            <Header />
            <main
                className="mt-[7.5rem] mr-6 transition-all duration-300"
                style={{ minHeight: 'calc(100vh - 3rem)', marginLeft: 'calc(18rem + 55px)' }}
            >
                <div className={`w-full px-10 pb-14 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {loading && (
                        <div className="flex items-center justify-center h-72">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-4"></div>
                                <p className="text-sm text-gray-500">กำลังโหลดข้อมูล...</p>
                            </div>
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                                <span className="text-red-700 text-sm font-medium">{error}</span>
                            </div>
                        </div>
                    )}

                    {me && (
                        <div className="grid gap-8 lg:grid-cols-3">
                            {/* Left Card */}
                            <aside className={`rounded-xl border shadow-sm p-8 flex flex-col items-center text-center ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                                {(() => {
                                    const first = stripThaiPrefix(me.f_name);
                                    const fi = first ? first[0] : '';
                                    const li = me.l_name ? me.l_name[0] : '';
                                    return (
                                        <>
                                            <div className={`w-44 h-44 rounded-full ring-2 mb-6 flex items-center justify-center text-6xl font-bold ${isDarkMode ? 'bg-gray-800 ring-gray-700 text-emerald-300' : 'bg-gradient-to-br from-emerald-50 to-teal-100 ring-emerald-200 text-emerald-600'} select-none`} aria-label="User initials">
                                                {fi}{li}
                                            </div>
                                            <h1 className={`text-2xl font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>{first} {me.l_name}</h1>
                                        </>
                                    );
                                })()}
                                <div className="mt-2 flex flex-col items-center gap-1">
                                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${me.has_license ? (isDarkMode ? 'bg-emerald-800/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700') : (isDarkMode ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-100 text-gray-600')}`}>{me.has_license ? 'Premium User' : 'Standard User'}</span>
                                    <span className={`text-[11px] tracking-wide ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Employee ID <span className={`font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-700'}`}>{me.employee_id}</span></span>
                                </div>
                                <div className="mt-5 flex flex-col gap-4 w-full">
                                    <div className="flex flex-wrap gap-2">
                                        <StatusPill active={me.is_active} isDarkMode={isDarkMode} />
                                        {me.has_license && <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${isDarkMode ? 'bg-teal-800/40 text-teal-300 border border-teal-700' : 'bg-teal-50 text-teal-700 border border-teal-200'}`}>Top Collaborator</span>}
                                    </div>
                                    <TagList isDark={isDarkMode} tags={buildTags(me)} />
                                </div>
                            </aside>

                            {/* Right Card */}
                            <section className={`rounded-xl border shadow-sm p-8 lg:col-span-2 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
                                <h2 className={`text-lg font-semibold mb-6 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>รายละเอียดผู้ใช้</h2>
                                <div className="grid gap-y-5 gap-x-12 md:grid-cols-2">
                                    <Detail label="แผนก" value={me.Department?.name || '-'} />
                                    <Detail label="ชื่อย่อแผนก" value={me.Department?.short_name || '-'} />
                                    <Detail label="เลขแผนก" value={me.Department?.dep_no || '-'} />
                                    <Detail label="วันเกิด" value={me.birth_date ? new Date(me.birth_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'} />
                                    <Detail label="สถานะการใช้งาน" value={me.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'} valueClass={me.is_active ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'} />
                                    <Detail label="สถานะ License" value={me.has_license ? 'มี' : 'ไม่มี'} valueClass={me.has_license ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'} />
                                </div>
                                <div className={`mt-8 pt-6 text-sm border-t ${isDarkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600'}`}>
                                    เข้าสู่ระบบล่าสุด: {me.last_login ? new Date(me.last_login).toLocaleString('th-TH', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

function Detail({ label, value, valueClass = '' }: { label: string; value: string; valueClass?: string }) {
    const baseValueClass = valueClass === '' ? 'text-emerald-700 dark:text-emerald-400' : valueClass;
    return (
        <div className="flex flex-col gap-1" aria-label={label}>
            <span className="text-[11px] font-medium tracking-wide text-gray-600 dark:text-gray-300 uppercase">{label}</span>
            <span className={`text-sm font-semibold truncate leading-relaxed ${baseValueClass}`}>{value}</span>
        </div>
    );
}

function StatusPill({ active, isDarkMode }: { active: boolean; isDarkMode: boolean }) {
    return (
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${active ? (isDarkMode ? 'bg-green-800/50 text-green-300 border border-green-700' : 'bg-green-50 text-green-700 border border-green-200') : (isDarkMode ? 'bg-red-800/40 text-red-300 border border-red-700' : 'bg-red-50 text-red-700 border border-red-200')}`}> 
            <span className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`}></span>
            {active ? 'Available' : 'Inactive'}
        </span>
    );
}

function TagList({ tags, isDark }: { tags: string[]; isDark: boolean }) {
    return (
        <div className="flex flex-wrap gap-2" aria-label="User tags">
            {tags.map(t => (
                <span key={t} className={`text-[11px] px-2 py-1 rounded-md font-medium ${isDark ? 'bg-gray-800 text-gray-300 border border-gray-700' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>#{t}</span>
            ))}
        </div>
    );
}