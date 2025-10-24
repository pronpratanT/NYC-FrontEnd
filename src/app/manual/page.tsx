"use client";

import React from "react";
import { useSidebar } from "../context/SidebarContext";

// components
import Sidebar from "../components/sidebar";
import Header from "../components/header";
export default function ManualPage() {
    const { isCollapsed } = useSidebar();
    const sidebarWidth = isCollapsed ? 80 : 288;
    const marginLeft = sidebarWidth + 24; // px
    return (
        <div className="min-h-screen bg-gray-50 relative">
            {/* <AnimatedBackground /> */}
            <Sidebar />
            <Header />
            <main
                className="mt-[7.5rem] mr-6 transition-all duration-300 relative flex justify-center items-start"
                style={{ minHeight: 'calc(100vh - 3rem)', position: 'relative', marginLeft }}
            >
                <div className="relative z-10 w-full max-w-3xl mx-auto">
                    <div className="bg-white/90 rounded-2xl shadow-xl p-8 border border-gray-200">
                        <h1 className="text-4xl font-extrabold mb-8 text-green-700 text-center drop-shadow">คู่มือการใช้งานระบบ NYC Purchase</h1>
                        <div className="space-y-8">
                            <section>
                                <h2 className="text-lg font-bold mb-3 text-green-800 flex items-center gap-2"><span className="inline-block w-6 h-6 bg-green-100 rounded-full text-green-700 text-center font-bold">1</span> เข้าสู่ระบบ</h2>
                                <ul className="list-disc ml-8 text-gray-700 text-base">
                                    <li>กรอกชื่อผู้ใช้และรหัสผ่านที่ได้รับจากผู้ดูแลระบบ</li>
                                    <li>คลิกปุ่ม &quot;เข้าสู่ระบบ&quot; เพื่อเข้าสู่หน้าหลัก</li>
                                </ul>
                            </section>
                            <section>
                                <h2 className="text-lg font-bold mb-3 text-green-800 flex items-center gap-2"><span className="inline-block w-6 h-6 bg-green-100 rounded-full text-green-700 text-center font-bold">2</span> การสร้างใบขอซื้อ (PR)</h2>
                                <ul className="list-disc ml-8 text-gray-700 text-base">
                                    <li>ไปที่เมนู &quot;ใบขอซื้อ&quot;</li>
                                    <li>คลิกปุ่ม &quot;สร้าง PR ใหม่&quot;</li>
                                    <li>กรอกข้อมูลสินค้า/บริการที่ต้องการขอซื้อ</li>
                                    <li>ตรวจสอบข้อมูลและคลิก &quot;บันทึก&quot;</li>
                                </ul>
                            </section>
                            <section>
                                <h2 className="text-lg font-bold mb-3 text-green-800 flex items-center gap-2"><span className="inline-block w-6 h-6 bg-green-100 rounded-full text-green-700 text-center font-bold">3</span> การอนุมัติ/ปฏิเสธ PR</h2>
                                <ul className="list-disc ml-8 text-gray-700 text-base">
                                    <li>ไปที่เมนู &quot;รายการ PR&quot;</li>
                                    <li>เลือก PR ที่ต้องการอนุมัติหรือปฏิเสธ</li>
                                    <li>คลิกปุ่ม &quot;อนุมัติ&quot; หรือ &quot;ปฏิเสธ&quot; และระบุเหตุผล (ถ้ามี)</li>
                                </ul>
                            </section>
                            <section>
                                <h2 className="text-lg font-bold mb-3 text-green-800 flex items-center gap-2"><span className="inline-block w-6 h-6 bg-green-100 rounded-full text-green-700 text-center font-bold">4</span> การสร้างใบสั่งซื้อ (PO)</h2>
                                <ul className="list-disc ml-8 text-gray-700 text-base">
                                    <li>ไปที่เมนู &quot;ใบสั่งซื้อ&quot;</li>
                                    <li>คลิกปุ่ม &quot;สร้าง PO ใหม่&quot;</li>
                                    <li>เลือก PR ที่ได้รับการอนุมัติ</li>
                                    <li>กรอกข้อมูล PO และคลิก &quot;บันทึก&quot;</li>
                                </ul>
                            </section>
                            <section>
                                <h2 className="text-lg font-bold mb-3 text-green-800 flex items-center gap-2"><span className="inline-block w-6 h-6 bg-green-100 rounded-full text-green-700 text-center font-bold">5</span> การดาวน์โหลดเอกสาร</h2>
                                <ul className="list-disc ml-8 text-gray-700 text-base">
                                    <li>ในหน้ารายการ PR หรือ PO คลิกไอคอน &quot;ดาวน์โหลด&quot; เพื่อรับไฟล์ PDF</li>
                                </ul>
                            </section>
                            <section>
                                <h2 className="text-lg font-bold mb-3 text-green-800 flex items-center gap-2"><span className="inline-block w-6 h-6 bg-green-100 rounded-full text-green-700 text-center font-bold">6</span> ติดต่อผู้ดูแลระบบ</h2>
                                <ul className="list-disc ml-8 text-gray-700 text-base">
                                    <li>หากพบปัญหาในการใช้งาน สามารถติดต่อผู้ดูแลระบบได้ที่อีเมล support@nyc.co.th หรือเบอร์โทรศัพท์ 02-xxx-xxxx</li>
                                </ul>
                            </section>
                        </div>
                        <div className="mt-10 text-gray-500 text-sm text-center">ปรับปรุงล่าสุด: 11 ตุลาคม 2025</div>
                    </div>
                </div>
            </main>
        </div>
    );
}