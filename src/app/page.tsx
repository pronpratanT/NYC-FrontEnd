"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/sidebar";
import Header from "./components/header";
import { useToken } from "./context/TokenContext";

export default function Page() {
  const token = useToken();
  const router = useRouter();
  console.log("Token in Page component:", token);

  // ตรวจสอบ token เมื่อโหลดหน้า
  useEffect(() => {
    if (!token) {
      // ถ้าไม่มี token ให้ redirect ไปหน้า login
      router.replace("/login");
    }
  }, [token, router]);

  // ถ้าไม่มี token ไม่แสดงอะไร (จะ redirect อยู่แล้ว)
  if (!token) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <Header />
    </div>
  );
}