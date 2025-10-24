"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/sidebar";
import Header from "./components/header";
import { useToken } from "./context/TokenContext";
import { useSidebar } from "./context/SidebarContext";

export default function Page() {
  const token = useToken();
  const router = useRouter();
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

  const { isCollapsed } = useSidebar();
  // Sidebar width: 288px (expanded), 80px (collapsed), left-6 (24px)
  const sidebarWidth = isCollapsed ? 80 : 288;
  const marginLeft = sidebarWidth + 24; // px
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <Header />
      <main style={{ marginLeft, transition: 'margin-left 0.3s' }}>
        {/* Main content here, add children if needed */}
      </main>
    </div>
  );
}