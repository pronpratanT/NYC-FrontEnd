// app/user/[department]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type User = {
  employee_id: string;
  f_name?: string;
  l_name?: string;
  user_dep?: string;
  email?: string;
  Department?: {
    name: string;
  };
  [key: string]: unknown;
};

type Department = {
  ID: number;
  name: string;
  short_name: string;
}

interface AuthState {
  isAuthenticated: boolean;
  departmentId?: number;
  departmentName?: string;
  tokenId?: string;
  isLoading: boolean;
  error?: string;
}

// ฟังก์ชันสำหรับ decode ชื่อแผนก
const decodeDepartmentName = (encoded: string): string => {
  try {
    let decoded = encoded;
    let previousDecoded = '';

    while (decoded !== previousDecoded) {
      previousDecoded = decoded;
      try {
        decoded = decodeURIComponent(decoded);
      } catch {
        break;
      }
    }

    return decoded;
  } catch (error) {
    console.error('Failed to decode department name:', error);
    return encoded;
  }
};

export default function DepartmentPage() {
  const params = useParams();
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDep, setSelectedDep] = useState<string>("");
  // Removed unused variable originalEncodedDep
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [departmentNotFound, setDepartmentNotFound] = useState<boolean>(false);

  // Token authentication states
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true
  });
  const [tokenInput, setTokenInput] = useState<string>("");
  const [tokenError, setTokenError] = useState<string>("");

  const positions = ['เจ้าหน้าที่', 'หัวหน้า', 'ผู้จัดการ', 'ผู้อำนวยการ', 'ประธาน'];
  const [userPositions, setUserPositions] = useState<{ [key: string]: string }>({});

  // ดึงชื่อแผนกจาก URL parameter และทำการ decode
  useEffect(() => {
    if (params?.department) {
      const departmentParam = Array.isArray(params.department)
        ? params.department[0]
        : params.department;

      // Removed unused setOriginalEncodedDep
      const decodedDepartment = decodeDepartmentName(departmentParam);
      setSelectedDep(decodedDepartment);

      console.log('Encoded Department from URL:', departmentParam);
      console.log('Decoded Department:', decodedDepartment);
    }
  }, [params]);

  // ตรวจสอบ session token ที่มีอยู่แล้ว
  useEffect(() => {
    const checkExistingAuth = () => {
      const savedAuth = sessionStorage.getItem('department_auth');
      if (savedAuth) {
        try {
          const parsedAuth = JSON.parse(savedAuth);
          if (parsedAuth.departmentName === selectedDep) {
            setAuthState({
              isAuthenticated: true,
              departmentId: parsedAuth.departmentId,
              departmentName: parsedAuth.departmentName,
              tokenId: parsedAuth.tokenId,
              isLoading: false
            });
            return;
          }
        } catch (error) {
          console.error('Failed to parse saved auth:', error);
          sessionStorage.removeItem('department_auth');
        }
      }

      setAuthState(prev => ({ ...prev, isLoading: false }));
    };

    if (selectedDep) {
      checkExistingAuth();
    }
  }, [selectedDep]);

  // ฟังก์ชันตรวจสอบ token
  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTokenError("");
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/auth/verify-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: tokenInput.trim() })
      });

      const data = await response.json();

      if (data.success && data.valid) {
        // ตรวจสอบว่า token นี้สำหรับแผนกที่ถูกต้องหรือไม่
        if (data.departmentName !== selectedDep) {
          setTokenError(`Token นี้สำหรับแผนก "${data.departmentName}" ไม่ใช่ "${selectedDep}"`);
          setAuthState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        // บันทึก auth state
        const authData = {
          departmentId: data.departmentId,
          departmentName: data.departmentName,
          tokenId: data.tokenId,
          authenticatedAt: new Date().toISOString()
        };

        sessionStorage.setItem('department_auth', JSON.stringify(authData));

        setAuthState({
          isAuthenticated: true,
          departmentId: data.departmentId,
          departmentName: data.departmentName,
          tokenId: data.tokenId,
          isLoading: false
        });

        setTokenInput("");

      } else {
        setTokenError(data.error || 'Token ไม่ถูกต้องหรือถูกใช้งานแล้ว');
        setAuthState(prev => ({ ...prev, isLoading: false }));
      }

    } catch (error: unknown) {
      console.error('Token verification failed:', error);
      setTokenError('เกิดข้อผิดพลาดในการตรวจสอบ token');
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // ฟังก์ชัน logout
  const handleLogout = () => {
    sessionStorage.removeItem('department_auth');
    setAuthState({
      isAuthenticated: false,
      isLoading: false
    });
    setTokenInput("");
    setTokenError("");
  };

  // ดึงข้อมูลผู้ใช้และแผนก (เฉพาะเมื่อ authenticated แล้ว)
  useEffect(() => {
    const fetchData = async () => {
      if (!authState.isAuthenticated) return;

      try {
        setLoading(true);
        setError(null);
        setDepartmentNotFound(false);

        const [resUsers, resDeps] = await Promise.all([
          fetch("/api/proxy/user", { cache: "no-store" }),
          fetch("/api/proxy/user/deps", { cache: "no-store" }),
        ]);

        if (!resUsers.ok) {
          throw new Error(`User API error: HTTP ${resUsers.status} ${resUsers.statusText}`);
        }
        if (!resDeps.ok) {
          throw new Error(`Deps API error: HTTP ${resDeps.status} ${resDeps.statusText}`);
        }

        const dataUsers = await resUsers.json();
        const dataDeps = await resDeps.json();

        const usersArray = Array.isArray(dataUsers) ? dataUsers : dataUsers.data || [];
        const depsArray = Array.isArray(dataDeps) ? dataDeps : dataDeps.data || [];

        setUsers(usersArray);
        setDepartments(depsArray);

        if (selectedDep) {
          const departmentExists = depsArray.some((dep: Department) => dep.name === selectedDep);
          if (!departmentExists) {
            console.warn('Department not found:', selectedDep);
            setDepartmentNotFound(true);
          }
        }

        console.log("Users:", usersArray);
        console.log("Departments:", depsArray);
        console.log("Selected Department:", selectedDep);

      } catch (err) {
        const errorMessage = (err instanceof Error && err.message) ? err.message : "เกิดข้อผิดพลาดในการดึงข้อมูล";
        setError(errorMessage);
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedDep, authState.isAuthenticated]);

  // กรองข้อมูลพนักงานตามแผนกที่เลือก
  const filteredUsers = users.filter((user) => {
    const inDepartment = user.user_dep === selectedDep || (user.Department && user.Department.name === selectedDep);
    return inDepartment && user.is_active === true;
  });

  const handlePositionChange = (userId: string, position: string) => {
    setUserPositions(prev => ({
      ...prev,
      [userId]: position
    }));
  };

  // ฟังก์ชันบันทึกข้อมูล
  const handleSave = async () => {
    if (!selectedDep || selectedDep === "all") {
      alert("กรุณาเลือกแผนกก่อนบันทึก");
      return;
    }

    try {
      const currentDepartment = departments.find(d => d.name === selectedDep);
      if (!currentDepartment) {
        alert("ไม่พบข้อมูลแผนก");
        return;
      }

      let savedCount = 0;

      for (const user of filteredUsers) {
        const role = userPositions[user.employee_id];
        if (!role) {
          console.log(`ข้าม user ${user.employee_id} เพราะยังไม่ได้เลือกตำแหน่ง`);
          continue;
        }

        const payload = {
          user_id: Number(user.employee_id),
          department_id: currentDepartment.ID,
          role_in_department: role,
        };

        console.log("Posting:", payload);

        const res = await fetch('/api/proxy/admin/add-role-department', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status} - ${errorText}`);
        }

        savedCount++;
      }

      if (savedCount > 0) {
        alert(`บันทึกข้อมูลเรียบร้อยแล้ว ✅ (บันทึก ${savedCount} รายการ)`);
      } else {
        alert("ไม่มีข้อมูลที่จะบันทึก กรุณาเลือกตำแหน่งสำหรับพนักงานอย่างน้อย 1 คน");
      }

    } catch (err) {
      console.error("Failed to save:", err);
      const message = (err instanceof Error && err.message) ? err.message : "ไม่ทราบสาเหตุ";
      alert(`เกิดข้อผิดพลาดในการบันทึก: ${message} ❌`);
    }
  };

  // กลับไปหน้าเลือกแผนก
  const goBackToSelection = () => {
    router.push('/user');
  };

  // แสดงหน้า Token Authentication
  if (!authState.isAuthenticated) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-700 px-6 py-4">
                <h1 className="text-xl font-bold text-white">🔐 การยืนยันตัวตน</h1>
                <p className="text-blue-100 mt-1 text-sm">แผนก: {selectedDep}</p>
              </div>

              <div className="p-6">
                <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-400">
                  <div className="flex">
                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        <strong>จำเป็นต้องมี Token เพื่อเข้าถึงข้อมูลแผนก</strong>
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Token จะใช้งานได้เพียงครั้งเดียวและจำกัดเฉพาะแผนกนี้เท่านั้น
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleTokenSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
                      กรุณาใส่ Access Token:
                    </label>
                    <input
                      id="token"
                      type="text"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
                      disabled={authState.isLoading}
                      required
                    />
                  </div>

                  {tokenError && (
                    <div className="bg-red-50 border-l-4 border-red-400 p-3">
                      <div className="flex">
                        <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div className="ml-3">
                          <p className="text-sm text-red-800">{tokenError}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={authState.isLoading || !tokenInput.trim()}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {authState.isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        กำลังตรวจสอบ...
                      </>
                    ) : (
                      '🔓 ยืนยันตัวตน'
                    )}
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={goBackToSelection}
                    className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
                  >
                    ← กลับไปเลือกแผนก
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // แสดง Loading
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">กำลังโหลดข้อมูล...</p>
        </div>
      </main>
    );
  }

  // แสดง Error
  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-6 rounded-lg shadow-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            ลองใหม่
          </button>
        </div>
      </main>
    );
  }

  // แสดงเมื่อไม่พบแผนก
  if (departmentNotFound) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-6 rounded-lg shadow-md">
          <div className="text-yellow-500 text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">ไม่พบแผนก</h2>
          <p className="text-gray-600 mb-4">
            ไม่พบแผนก <strong>&quot;{selectedDep}&quot;</strong> ในระบบ
          </p>
          <button
            onClick={goBackToSelection}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            กลับไปเลือกแผนก
          </button>
        </div>
      </main>
    );
  }

  // หน้าจัดการข้อมูลพนักงาน
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="bg-gradient-to-r from-green-600 to-blue-700 px-6 py-4 rounded-t-lg">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  🏢 จัดการข้อมูลพนักงาน
                </h1>
                <p className="text-green-100 mt-1">
                  แผนก: <span className="font-semibold">{selectedDep}</span>
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleLogout}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm flex items-center"
                >
                  🔒 ออกจากระบบ
                </button>
                {/* <button
                  onClick={goBackToSelection}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm"
                >
                  ← กลับ
                </button> */}
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">พนักงานทั้งหมด</p>
                <p className="text-2xl font-bold text-blue-800">{filteredUsers.length}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">ได้รับมอบหมายตำแหน่ง</p>
                <p className="text-2xl font-bold text-green-800">
                  {Object.keys(userPositions).filter(key => userPositions[key]).length}
                </p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600">รอการมอบหมาย</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {filteredUsers.length - Object.keys(userPositions).filter(key => userPositions[key]).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              ไม่พบพนักงานในแผนกนี้
            </h3>
            <p className="text-gray-600">
              แผนก <strong>&quot;{selectedDep}&quot;</strong> ยังไม่มีพนักงาน
            </p>
          </div>
        ) : (
          <>
            {/* ตาราง */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        รหัสพนักงาน
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ชื่อ-นามสกุล
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ตำแหน่งในแผนก
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        สถานะ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user, index) => (
                      <tr key={user.employee_id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.employee_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {user.f_name} {user.l_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={userPositions[user.employee_id] || ""}
                            onChange={(e) => handlePositionChange(user.employee_id, e.target.value)}
                            className="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">-- เลือกตำแหน่ง --</option>
                            {positions.map((position) => (
                              <option key={position} value={position}>
                                {position}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {userPositions[user.employee_id] ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✅ ได้รับมอบหมาย
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              ⏳ รอการมอบหมาย
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ปุ่มบันทึก */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={handleSave}
                disabled={Object.keys(userPositions).filter(key => userPositions[key]).length === 0}
                className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                💾 บันทึกข้อมูลทั้งหมด
                {Object.keys(userPositions).filter(key => userPositions[key]).length > 0 && (
                  <span className="ml-2 bg-white text-green-600 px-2 py-1 rounded-full text-xs">
                    {Object.keys(userPositions).filter(key => userPositions[key]).length}
                  </span>
                )}
              </button>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>🔐 เซสชันนี้ได้รับการรับรองแล้ว | Token ID: {authState.tokenId?.slice(-8)}</p>
        </div>
      </div>
    </main>
  );
}