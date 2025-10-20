"use client";
import { useEffect, useState } from "react";

type User = {
    employee_id: string;
    f_name?: string;
    l_name?: string;
    user_dep?: string;
    email?: string;
    Department?: {
        name?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
};

type Department = {
    ID: number;
    name: string;
    short_name: string;
};

type Service = {
    id: number,
    service_name: string;
    description: string;
}

export default function Page() {
    const [users, setUsers] = useState<User[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    // const positions = [
    //     "ระบบการจัดการเครื่องจักร",
    //     "ระบบการจัดการรถยนต์ NYC",
    //     "ระบบแจ้งงาน ECONS",
    //     "ระบบแจ้งงาน IT Support",
    //     "ระบบแจ้งซ่อมบำรุง",
    //     "ระบบตรวจสอบมาตรฐานการผลิต",
    //     "โปรแกรม FeetCard",
    //     "โปรแกรม N.Y.C. Server Information System",
    //     "โปรแกรมตรวจสอบมาตรฐานการ Packing",
    //     "โปรแกรมระบบจัดซื้อ",
    //     "เมนูเชื่อมโยงแอปพลิเคชัน",
    //     "Website Emerald Greenfield",
    //     "Download Youtube video",
    //     "IT Service API",
    //     "คู่มือระบบ OT",
    //     "คู่มือระบบงานแผนการผลิต",
    // ];
    const [departmentServices, setDepartmentServices] = useState<{
        [key: number]: string;
    }>({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [resUsers, resDeps, resServices] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_USER_SERVICE}/api/user`, { cache: "no-store" }),
                    fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_USER_SERVICE}/api/user/deps`, { cache: "no-store" }),
                    fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_ADMIN_SERVICE}/api/admin/services`, { cache: "no-store" }),
                ]);

                if (!resUsers.ok) {
                    throw new Error(
                        `User API error: HTTP ${resUsers.status} ${resUsers.statusText}`
                    );
                }
                if (!resDeps.ok) {
                    throw new Error(
                        `Deps API error: HTTP ${resDeps.status} ${resDeps.statusText}`
                    );
                }
                if (!resServices.ok) {
                    throw new Error(
                        `Services API error: HTTP ${resServices.status} ${resServices.statusText}`
                    )
                }

                const dataUsers = await resUsers.json();
                const dataDeps = await resDeps.json();
                const dataServices = await resServices.json();

                const usersArray = Array.isArray(dataUsers)
                    ? dataUsers
                    : dataUsers.data || [];
                const depsArray = Array.isArray(dataDeps)
                    ? dataDeps
                    : dataDeps.data || [];
                const servicesArray = Array.isArray(dataServices)
                    ? dataServices
                    : dataServices.data || [];

                setUsers(usersArray);
                setDepartments(depsArray);
                setServices(servicesArray);

                // console.log("Users:", usersArray);
                console.log("Departments:", depsArray);
                console.log("Service : ", servicesArray);
            } catch (err: unknown) {
                let errorMessage = "เกิดข้อผิดพลาดในการดึงข้อมูล";
                if (err instanceof Error) {
                    errorMessage = err.message || errorMessage;
                    console.error("Failed to fetch data:", err);
                } else {
                    console.error("Failed to fetch data:", err);
                }
                setError(errorMessage);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleServiceChange = (deptId: number, service: string) => {
        setDepartmentServices((prev) => ({
            ...prev,
            [deptId]: service,
        }));
    };

    //POST
    const handleSave = async () => {
        try {
            for (const dept of departments) {
                const service = departmentServices[dept.ID];
                if (!service) {
                    console.log(`ข้าม department ${dept.name} เพราะยังไม่ได้เลือกสิทธิการใช้งาน`);
                    continue;
                }

                const payload = {
                    department_id: dept.ID,
                    service_id: Number(service), // ✅ แปลงเป็น number
                };

                console.log("Posting:", payload);

                const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_ADMIN_SERVICE}/api/admin/add-department-service`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status} - ${res.statusText}`);
                }
            }

            alert("บันทึกข้อมูลเรียบร้อยแล้ว ✅");
        } catch (err) {
            console.error("Failed to save:", err);
            alert("เกิดข้อผิดพลาดในการบันทึก ❌");
        }
    };


    // นับจำนวนพนักงานในแต่ละแผนก
    const getDepartmentUserCount = (deptName: string) => {
        return users.filter(
            (user) =>
                user.user_dep === deptName || user.Department?.name === deptName
        ).length;
    };

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                {/* Action Section */}
                {!error && !loading && departments.length > 0 && (
                    <div className="mb-6 flex gap-4 items-center">
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 rounded-lg shadow transition-colors duration-150 flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                        >
                            <svg
                                className="h-4 w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                            บันทึก
                        </button>
                    </div>
                )}

                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-green-600 to-purple-700 px-6 py-4">
                        <h1 className="text-2xl font-bold text-white">กำหนดสิทธิแผนก</h1>
                        <p className="text-blue-100 mt-1">
                            {loading
                                ? "กำลังโหลดข้อมูล..."
                                : error
                                    ? "เกิดข้อผิดพลาดในการดึงข้อมูล"
                                    : `พบข้อมูลแผนก ${departments.length} แผนกทั้งหมด`}
                        </p>
                    </div>

                    {/* Loading */}
                    {loading && (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">กำลังโหลดข้อมูล...</span>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <svg
                                        className="h-5 w-5 text-red-400"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">
                                        <strong>เกิดข้อผิดพลาด:</strong> {error}
                                    </p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                                    >
                                        รีเฟรชหน้า
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Table */}
                    {!error && !loading && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full border-collapse bg-white rounded-lg shadow-md">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="px-6 py-3 text-sm font-medium text-gray-600 text-center w-1/6">
                                            รหัสแผนก
                                        </th>
                                        <th className="px-6 py-3 text-sm font-medium text-gray-600 text-center w-1/3">
                                            ชื่อแผนก
                                        </th>
                                        <th className="px-6 py-3 text-sm font-medium text-gray-600 text-center w-1/6">
                                            จำนวนพนักงาน
                                        </th>
                                        <th className="px-6 py-3 text-sm font-medium text-gray-600 text-center w-1/3">
                                            สิทธิการใช้งาน
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 text-center">
                                    {departments.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={4}
                                                className="px-6 py-12 text-center text-gray-500"
                                            >
                                                ไม่มีข้อมูลแผนก
                                            </td>
                                        </tr>
                                    ) : (
                                        departments.map((dept) => (
                                            <tr
                                                key={dept.ID}
                                                className="hover:bg-gray-50 transition-colors duration-150"
                                            >
                                                <td className="px-6 py-4">{dept.short_name}</td>
                                                <td className="px-6 py-4">{dept.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                        {getDepartmentUserCount(dept.name)} คน
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <select
                                                        value={departmentServices[dept.ID] || ""}
                                                        onChange={(e) =>
                                                            handleServiceChange(dept.ID, e.target.value)
                                                        }
                                                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white w-full"
                                                    >
                                                        <option value="" disabled>
                                                            เลือกระบบ
                                                        </option>
                                                        {services.map((service) => (
                                                            <option key={service.id} value={service.id}>
                                                                {service.service_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Footer */}
                    {!error && !loading && departments.length > 0 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    แสดง{" "}
                                    <span className="font-medium">{departments.length}</span>{" "}
                                    แผนกทั้งหมด
                                </div>
                                <div className="text-xs text-gray-500">
                                    อัปเดตล่าสุด: {new Date().toLocaleString("th-TH")}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
