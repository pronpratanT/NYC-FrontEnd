// app/user/page.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FcKindle } from "react-icons/fc";

type Department = {
  ID: number;
  name: string;
  short_name: string;
}

// ฟังก์ชันสำหรับ encode ชื่อแผนก - ปรับปรุงให้รองรับตัวอักษรพิเศษ
const encodeDepartmentName = (name: string): string => {
  // ใช้ encodeURIComponent แล้วเพิ่มการ encode ตัวอักษรพิเศษที่อาจทำให้เกิดปัญหา
  return encodeURIComponent(name).replace(/[!'()*]/g, (c) => {
    return '%' + c.charCodeAt(0).toString(16).toUpperCase();
  });
};

export default function UserHomePage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setError(null);
        const response = await fetch("/api/proxy/user/deps", { cache: "no-store" });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const depsArray = Array.isArray(data) ? data : data.data || [];
        
        setDepartments(depsArray);
        console.log("Loaded departments:", depsArray);
        
      } catch (error: unknown) {
        console.error("Failed to fetch departments:", error);
        if (error instanceof Error) {
          setError(error.message || "ไม่สามารถโหลดข้อมูลแผนกได้");
        } else {
          setError("ไม่สามารถโหลดข้อมูลแผนกได้");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  // ฟังก์ชันสำหรับคัดลอก URL ที่ encode แล้ว พร้อม fallback
  const copyDepartmentURL = (deptName: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const encodedName = encodeDepartmentName(deptName);
    const url = `${window.location.origin}/user/${encodedName}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        alert(`คัดลอกลิงค์แผนก "${deptName}" เรียบร้อยแล้ว`);
      }).catch((err) => {
        console.error('Clipboard API error:', err);
        fallbackCopyTextToClipboard(url, deptName);
      });
    } else {
      fallbackCopyTextToClipboard(url, deptName);
    }
  };

  // ฟังก์ชัน fallback สำหรับคัดลอกข้อความ
  function fallbackCopyTextToClipboard(text: string, deptName: string) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        alert(`คัดลอกลิงค์แผนก "${deptName}" เรียบร้อยแล้ว`);
      } else {
        alert('ไม่สามารถคัดลอกลิงค์ได้');
      }
    } catch (err) {
      console.error('Fallback copy error:', err);
      alert('ไม่สามารถคัดลอกลิงค์ได้');
    }
    document.body.removeChild(textArea);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-blue-700 px-6 py-4">
              <h1 className="text-2xl font-bold text-white">เลือกแผนก</h1>
              <p className="text-blue-100 mt-1">กำลังโหลดข้อมูลแผนก...</p>
            </div>
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3">กำลังโหลดข้อมูล...</span>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-4">
              <h1 className="text-2xl font-bold text-white">เกิดข้อผิดพลาด</h1>
            </div>
            <div className="p-6">
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      ไม่สามารถโหลดข้อมูลแผนกได้
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      {error}
                    </div>
                    <div className="mt-4">
                      <button
                        onClick={() => window.location.reload()}
                        className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                      >
                        ลองใหม่
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-blue-700 px-6 py-4">
            <h1 className="text-2xl font-bold text-white">เลือกแผนก</h1>
            <p className="text-blue-100 mt-1">เลือกแผนกที่ต้องการกำหนดตำแหน่งพนักงาน</p>
          </div>

          <div className="p-6">
            {/* คำอธิบายเกี่ยวกับ URL Encoding */}
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400">
              <span className="inline-flex items-center">
                <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-yellow-800 text-sm font-medium">
                  <strong>เกี่ยวกับ URL:</strong> ชื่อแผนกจะถูก encode ใน URL เพื่อรองรับตัวอักษรพิเศษและภาษาไทย 
                    คุณสามารถคัดลอกลิงก์โดยคลิกที่ปุ่ม <FcKindle className="inline-block align-middle text-yellow-500" style={{fontSize: '1.2em'}} /> หรือพิมพ์ชื่อแผนกใน URL โดยตรง
                </span>
              </span>
            </div>

            {/* ปุ่มดูทุกแผนก */}
            <div className="mb-6">
              <Link
                href="/user/all"
                className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                ดูพนักงานทุกแผนก
              </Link>
            </div>

            {/* รายการแผนก */}
            {departments.length === 0 ? (
              <div className="text-center py-8">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M8 14v20c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252M8 14c0 4.418 7.163 8 16 8s16-3.582 16-8M8 14c0-4.418 7.163-8 16-8s16 3.582 16 8m0 0v14m-16-4c0 4.418 7.163 8 16 8 1.381 0 2.721-.087 4-.252" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">ไม่มีข้อมูลแผนก</h3>
                <p className="mt-1 text-sm text-gray-500">ระบบยังไม่มีข้อมูลแผนกให้แสดง</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {departments.map((dept) => {
                  const encodedName = encodeDepartmentName(dept.name);
                  return (
                    <div
                      key={dept.ID}
                      className="relative group border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
                    >
                      <Link
                        href={`/user/${encodedName}`}
                        className="block p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                              {dept.short_name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {dept.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              ID: {dept.ID}
                            </p>
                          </div>
                          <svg className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
                      
                      {/* ปุ่มคัดลอก URL */}
                      <button
                        onClick={(e) => copyDepartmentURL(dept.name, e)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-blue-500 bg-white hover:bg-gray-50 rounded shadow-sm border"
                        title={`คัดลอกลิงค์แผนก ${dept.name}`}
                      >
                        <FcKindle className="inline-block align-middle text-yellow-500" style={{fontSize: '1.2em'}} />
                      </button>
                      
                      {/* แสดง encoded URL ในเมื่อ hover */}
                      <div className="absolute bottom-full left-0 right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div className="bg-black text-white text-xs rounded px-2 py-1 shadow-lg">
                          /user/<span className="font-mono">{encodedName}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ข้อมูลสถิติ */}
            {departments.length > 0 && (
              <div className="mt-8 bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div>
                    พบแผนกทั้งหมด <span className="font-medium text-gray-900">{departments.length}</span> แผนก
                  </div>
                  <div>
                    อัปเดตล่าสุด: {new Date().toLocaleString('th-TH')}
                  </div>
                </div>
              </div>
            )}

            {/* คำแนะนำการใช้งาน */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">💡 คำแนะนำ:</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• คลิกที่แผนกเพื่อเข้าไปกำหนดตำแหน่งพนักงาน</li>
                <li>• คลิก <FcKindle className="inline-block align-middle text-yellow-500" style={{fontSize: '1.2em'}} /> เพื่อคัดลอกลิงค์ของแผนกนั้น</li>
                <li>• คุณสามารถพิมพ์ชื่อแผนกใน URL โดยตรงได้ เช่น <code className="bg-blue-100 px-1 rounded">/user/แผนกบัญชี</code></li>
                <li>• ระบบจะ encode ชื่อแผนกให้อัตโนมัติเพื่อรองรับตัวอักษรพิเศษ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}