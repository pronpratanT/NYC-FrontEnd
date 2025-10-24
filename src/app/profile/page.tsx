"use client";

import React, { useEffect, useState } from "react";

// components
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import { useToken } from "../context/TokenContext";

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
                console.log("Fetched user data:", data);
            } catch (err: unknown) {
                if (
                    err &&
                    typeof err === 'object' &&
                    'message' in err &&
                    typeof (err as { message?: unknown }).message === 'string'
                ) {
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

    return (
        <div className="min-h-screen">
            <Sidebar />
            <Header />
            <main
                className="mt-[7.5rem] mr-6 transition-all duration-300"
                style={{ minHeight: 'calc(100vh - 3rem)', marginLeft: 'calc(18rem + 55px)' }}
            >
                <div className="w-full max-w-6xl mx-auto px-8 py-10">
                    {/* Page Header */}
                    {/* <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">ข้อมูลส่วนตัว</h1>
                        <p className="text-gray-500">จัดการและดูข้อมูลโปรไฟล์ของคุณ</p>
                    </div> */}

                    {loading && (
                        <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                                <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-red-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                                <span className="text-red-700 font-medium">{error}</span>
                            </div>
                        </div>
                    )}

                    {me && (
                        <div className="space-y-6">
                            {/* Profile Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                {/* Header Section with gradient */}
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-10">
                                    <div className="flex items-center gap-6">
                                        <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold border-4 border-white/30 shadow-lg">
                                            {me.f_name?.[0] || ''}{me.l_name?.[0] || ''}
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-3xl font-bold text-white mb-2">
                                                {me.f_name} {me.l_name}
                                            </h2>
                                            <p className="text-blue-100 text-lg mb-3">
                                                รหัสพนักงาน: <span className="font-mono font-semibold text-white">{me.employee_id || '-'}</span>
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${me.is_active ? 'bg-green-500 text-white' : 'bg-red-500 text-white'} shadow-md`}>
                                                    {me.is_active ? '● ใช้งาน' : '● ปิดใช้งาน'}
                                                </span>
                                                <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${me.has_license ? 'bg-amber-500 text-white' : 'bg-gray-400 text-white'} shadow-md`}>
                                                    {me.has_license ? '★ มี License' : '☆ ไม่มี License'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Information Section */}
                                <div className="px-8 py-8">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        ข้อมูลทั่วไป
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        <InfoItem 
                                            label="แผนก" 
                                            value={me.Department?.name || '-'}
                                            icon={
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                            }
                                        />
                                        <InfoItem 
                                            label="ชื่อย่อแผนก" 
                                            value={me.Department?.short_name || '-'}
                                            icon={
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                </svg>
                                            }
                                        />
                                        <InfoItem 
                                            label="เลขแผนก" 
                                            value={me.Department?.dep_no || '-'}
                                            icon={
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                                </svg>
                                            }
                                        />
                                        <InfoItem 
                                            label="วันเกิด" 
                                            value={me.birth_date ? new Date(me.birth_date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                                            icon={
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            }
                                        />
                                        <InfoItem 
                                            label="สถานะการใช้งาน" 
                                            value={me.is_active ? 'ใช้งาน' : 'ปิดใช้งาน'}
                                            valueColor={me.is_active ? 'text-green-600' : 'text-red-600'}
                                            icon={
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            }
                                        />
                                        <InfoItem 
                                            label="สถานะ License" 
                                            value={me.has_license ? 'มี' : 'ไม่มี'}
                                            valueColor={me.has_license ? 'text-green-600' : 'text-gray-400'}
                                            icon={
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                                </svg>
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Activity Card */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-8 py-6 border-b border-gray-200 bg-gray-50">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        กิจกรรมล่าสุด
                                    </h3>
                                </div>
                                <div className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                            </svg>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">เข้าสู่ระบบล่าสุด</p>
                                            <p className="text-lg font-medium text-gray-900">
                                                {me.last_login ? new Date(me.last_login).toLocaleString('th-TH', { 
                                                    year: 'numeric', 
                                                    month: 'long', 
                                                    day: 'numeric', 
                                                    hour: '2-digit', 
                                                    minute: '2-digit' 
                                                }) : '-'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

// Helper Component
function InfoItem({ 
    label, 
    value, 
    valueColor = 'text-gray-900',
    icon 
}: { 
    label: string; 
    value: string; 
    valueColor?: string;
    icon?: React.ReactNode;
}) {
    return (
        <div className="bg-gray-50 rounded-lg px-5 py-4 border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all duration-200">
            <div className="flex items-center gap-2 mb-2">
                {icon && <div className="text-blue-600">{icon}</div>}
                <span className="text-sm font-medium text-gray-600">{label}</span>
            </div>
            <p className={`text-lg font-semibold ${valueColor} break-words`}>{value}</p>
        </div>
    );
}