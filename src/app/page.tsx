"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToken } from "./context/TokenContext";
import { useSidebar } from "./context/SidebarContext";
import { useTheme } from "./components/ThemeProvider";

import Sidebar from "./components/sidebar";
import Header from "./components/header";

export default function Page() {
  const { isDarkMode } = useTheme();
  const token = useToken();
  const router = useRouter();
  const { isCollapsed } = useSidebar();
  console.log("Token in Page component:", token);

  // ตรวจสอบ token เมื่อโหลดหน้า
  useEffect(() => {
    if (!token) {
      // ถ้าไม่มี token ให้ redirect ไปหน้า login
      router.replace(process.env.NEXT_PUBLIC_LOGOUT_REDIRECT || "/login");
    }
  }, [token, router]);

  // ถ้าไม่มี token ไม่แสดงอะไร (จะ redirect อยู่แล้ว)
  if (!token) {
    return null;
  }

  // Sidebar width: 288px (expanded), 80px (collapsed), left-6 (24px)
  const sidebarWidth = isCollapsed ? 80 : 288;
  const marginLeft = sidebarWidth + 24; // px
  return (
    <div className={`flex min-h-screen ${isDarkMode ? 'from-slate-900 via-slate-800 to-slate-900' : 'from-slate-50 via-white to-slate-100'}`}>
      <Sidebar />
      <Header />
      <main
        style={{ marginLeft, transition: 'margin-left 0.3s' }}
        className="flex-1 flex items-center justify-center p-8"
      >
        <div className="text-center max-w-2xl mx-auto">
          {/* Welcome Icon */}
          <div className="mb-8 animate-bounce">
            <span className="text-8xl">👋</span>
          </div>

          {/* Welcome Text */}
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome!
          </h1>

          {/* Description */}
          <p className={`text-xl mb-8 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
            NYC Purchase System - ระบบจัดซื้อจัดจ้างสำหรับองค์กร
          </p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className={`rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="text-4xl mb-4">📋</div>
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Purchase Request</h3>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>จัดการใบขอซื้อและติดตามสถานะ</p>
            </div>

            <div className={`rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="text-4xl mb-4">🔍</div>
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Compare Price</h3>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>เปรียบเทียบราคาจากผู้ขายหลายราย</p>
            </div>

            <div className={`rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="text-4xl mb-4">📦</div>
              <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Purchase Order</h3>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>สร้างและอนุมัติใบสั่งซื้อ</p>
            </div>
          </div>

          {/* Get Started Button */}
          <div className="mt-12">
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              เริ่มต้นใช้งานโดยเลือกเมนูจากแถบด้านซ้าย
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}