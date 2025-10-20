"use client";
import { useEffect, useState } from "react";

export default function Page() {
  const [departments, setDepartments] = useState([]);
  const [selectedDep, setSelectedDep] = useState("all");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [userPositions, setUserPositions] = useState({});
  const [userWorkStatus, setUserWorkStatus] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [resUsers, resDeps] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_USER_SERVICE}/api/user`, { cache: "no-store" }),
          fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_USER_SERVICE}/api/user/deps`, { cache: "no-store" }),
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

        // กำหนดสถานะเริ่มต้นของ userWorkStatus ตาม is_active
        const initialWorkStatus = {};
        usersArray.forEach(user => {
          if (user.employee_id) {
            initialWorkStatus[user.employee_id] = user.is_active ? "ยังทำงาน" : "ลาออก";
          }
        });
        setUserWorkStatus(initialWorkStatus);

        console.log("Users:", usersArray);
        console.log("Departments:", depsArray);

      } catch (err) {
        const errorMessage = err && err.message ? err.message : "เกิดข้อผิดพลาดในการดึงข้อมูล";
        setError(errorMessage);
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter users based on selected department
  const filteredUsers = selectedDep === "all"
    ? users
    : users.filter(user => user.user_dep === selectedDep || user.Department?.name === selectedDep);

  // Handle position assignment
  const handlePositionChange = (userId, position) => {
    setUserPositions(prev => ({ ...prev, [userId]: position }));
  };

  // Handle work status change
  // แก้ไข dropdown ให้เปลี่ยนเฉพาะคนที่เลือก
  const handleWorkStatusChange = (userId, status) => {
    setUserWorkStatus(prev => ({ ...prev, [userId]: status }));
  };

  // เพิ่มฟังก์ชัน reset สถานะทุกคนเป็น "ยังทำงาน"
  const handleResetStatus = () => {
    // รีเซ็ตสถานะทุกคนใน users (ไม่ใช่แค่ filteredUsers)
    const resetStatus = {};
    users.forEach(user => {
      if (user.employee_id) {
        resetStatus[user.employee_id] = "ยังทำงาน";
      }
    });
    setUserWorkStatus(resetStatus);
  };

  // Check if there are users with work status assigned
  const hasWorkStatusAssigned = Object.keys(userWorkStatus).some(userId => userWorkStatus[userId]);

  // Save function
  const handleSave = async () => {
    try {
      // ส่งเฉพาะคนที่มีการเปลี่ยนแปลงสถานะ
      const updateArray = [];
      users.forEach(user => {
        const status = userWorkStatus[user.employee_id];
        if (typeof status === 'undefined') return;
        // Convert status to boolean: "ยังทำงาน" = true, "ลาออก" = false
        const isActive = status === "ยังทำงาน";
        // เปรียบเทียบกับค่าเดิมในฐานข้อมูล
        if (user.is_active === isActive) return; // ข้ามถ้าไม่มีการเปลี่ยนแปลง
        const userIdValue = user.id || user.ID || user.user_id || user.employee_id;
        if (!userIdValue) return;
        updateArray.push({
          user_id: Number(userIdValue),
          is_active: isActive,
        });
      });

      if (updateArray.length === 0) {
        alert("ไม่มีการเปลี่ยนแปลงสถานะพนักงาน");
        return;
      }
      console.log("Prepared user status updates:", updateArray);

      // Group updates by is_active so we can send minimal requests to backend
      const activeIds = updateArray.filter(u => u.is_active).map(u => u.user_id);
      const inactiveIds = updateArray.filter(u => !u.is_active).map(u => u.user_id);

      const requests = [];

      if (activeIds.length > 0) {
        requests.push(fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_USER_SERVICE}/api/user/UpdateIsActive`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_ids: activeIds, is_active: true }),
        }));
      }

      if (inactiveIds.length > 0) {
        requests.push(fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_USER_SERVICE}/api/user/UpdateIsActive`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_ids: inactiveIds, is_active: false }),
        }));
      }

      const responses = await Promise.all(requests);

      // Check responses
      for (const res of responses) {
        if (!res.ok) {
          let errorMessage = `Failed to update users: HTTP ${res.status} - ${res.statusText}`;
          try {
            const errorData = await res.json();
            if (errorData?.error || errorData?.message) {
              errorMessage += `\n${errorData.error || errorData.message}`;
            }
          } catch (parseError) {
            console.log("Could not parse error response");
          }
          alert(errorMessage);
          return;
        }
      }

      // Success
      alert(`บันทึกข้อมูลสำเร็จ ✅\nอัปเดตสถานะพนักงาน ${updateArray.length} คน`);

    } catch (err) {
      console.error("Failed to save:", err);

      // Show more detailed error message
      let errorMsg = "เกิดข้อผิดพลาดในการบันทึก ❌";
      if (err?.message) {
        errorMsg += `\n\nรายละเอียด: ${err.message}`;
      }

      alert(errorMsg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <main className="container mx-auto px-6 py-8">

        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            จัดการสถานะพนักงาน
          </h1>
          <p className="text-gray-600 text-lg">ระบบจัดการข้อมูลและสถานะการทำงานของพนักงาน</p>
        </div>

        {/* Action Section */}
        {!error && !loading && users.length > 0 && (
          <div className="mb-6 flex flex-col gap-2">
            <div className="flex gap-4 items-center">
              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={!hasWorkStatusAssigned}
                className={`inline-flex items-center px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105
        ${!hasWorkStatusAssigned
                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white hover:shadow-xl"}
      `}
              >
                <svg
                  className="h-5 w-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                บันทึกสถานะการทำงาน
              </button>

              {/* Reset button */}
              {/* <button
              onClick={handleResetStatus}
              className="inline-flex items-center px-6 py-3 rounded-xl font-semibold shadow-lg transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-gray-400 to-blue-400 text-white ml-2"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6" />
              </svg>
              รีเซ็ตสถานะเป็นยังทำงาน
            </button> */}

              {/* Department filter dropdown */}
              <select
                value={selectedDep}
                onChange={(e) => setSelectedDep(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
              >
                <option value="all">-- เลือกทุกแผนก --</option>
                {departments.map((dep) => (
                  <option key={dep.ID} value={dep.name}>
                    {dep.name}
                  </option>
                ))}
              </select>

              {filteredUsers.length > 0 && (
                <span className="text-sm text-gray-600 bg-blue-50 px-3 py-1 rounded-full">
                  {selectedDep === "all"
                    ? `พนักงานทั้งหมด: ${filteredUsers.length} คน`
                    : `พนักงานในแผนก ${selectedDep}: ${filteredUsers.length} คน`}
                </span>
              )}

              {!hasWorkStatusAssigned && (
                <p className="text-sm text-orange-600">
                  ⚠️ กรุณาเลือกสถานะการทำงานสำหรับพนักงานอย่างน้อย 1 คน
                </p>
              )}

              {hasWorkStatusAssigned && (
                <p className="text-sm text-green-600">
                  ✅ พร้อมบันทึกสถานะการทำงานสำหรับ {Object.keys(userWorkStatus).filter(userId => userWorkStatus[userId]).length} คน
                </p>
              )}
            </div>
          </div>
        )}

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">ข้อมูลพนักงาน</h2>
                <p className="text-blue-100 text-lg">
                  {loading ?
                    'กำลังโหลดข้อมูล...' :
                    error ?
                      'เกิดข้อผิดพลาดในการดึงข้อมูล' :
                      selectedDep === "all" ?
                        `พบข้อมูลพนักงาน ${users.length} คนทั้งหมด` :
                        `แสดงพนักงานแผนก ${selectedDep} จำนวน ${filteredUsers.length} คน`
                  }
                </p>
              </div>
              <div className="hidden md:block">
                <svg className="w-16 h-16 text-white/50" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            {/* Statistics */}
            {/* สถิติการแก้ไข */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* จำนวนที่แก้ไขแล้ว */}
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">แก้ไขแล้ว</p>
                    <p className="text-2xl font-bold text-white">
                      {users.filter(user => {
                        const status = userWorkStatus[user.employee_id];
                        if (typeof status === 'undefined') return false;
                        const isActive = status === "ยังทำงาน";
                        return user.is_active !== isActive;
                      }).length}
                    </p>
                  </div>
                  <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-2-7a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              {/* ยังทำงาน */}
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">ยังทำงาน</p>
                    <p className="text-2xl font-bold text-white">
                      {Object.values(userWorkStatus).filter(status => status === 'ยังทำงาน').length}
                    </p>
                  </div>
                  <svg className="w-8 h-8 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              {/* ลาออก */}
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 border border-white/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-100">ลาออกแล้ว</p>
                    <p className="text-2xl font-bold text-white">
                      {Object.values(userWorkStatus).filter(status => status === 'ลาออก').length}
                    </p>
                  </div>
                  <svg className="w-8 h-8 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
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
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                        <span>รหัสพนักงาน</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                        </svg>
                        <span>ชื่อ-นามสกุล</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
                        </svg>
                        <span>แผนก</span>
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>สถานะการทำงาน</span>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                            <path d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.713-3.714M14 40v-4c0-1.313.253-2.566.713-3.714m0 0A10.003 10.003 0 0124 26c4.21 0 7.813 2.602 9.288 6.286M30 14a6 6 0 11-12 0 6 6 0 0112 0zm12 6a4 4 0 11-8 0 4 4 0 018 0zm-28 0a4 4 0 11-8 0 4 4 0 018 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">
                            {selectedDep === "all" ? "ไม่มีข้อมูลพนักงาน" : "ไม่มีพนักงานในแผนกนี้"}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500">
                            {selectedDep === "all" ?
                              "ยังไม่มีข้อมูลพนักงานในระบบ" :
                              `ไม่พบข้อมูลพนักงานในแผนก ${selectedDep}`
                            }
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user, index) => (
                      <tr
                        key={user.employee_id || index}
                        className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border-b border-gray-100"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg">
                              <span className="text-sm font-bold text-white">
                                {user.employee_id || (index + 1).toString().padStart(3, '0')}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {[user.f_name, user.l_name]
                              .filter(Boolean)
                              .join(' ') || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-3 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 shadow-sm">
                            {user.user_dep || user.Department?.name || 'ไม่ระบุ'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={userWorkStatus[user.employee_id] || ""}
                            onChange={(e) => handleWorkStatusChange(user.employee_id, e.target.value)}
                            className="text-sm border border-gray-200 rounded-xl px-4 py-2 bg-white/80 backdrop-blur-sm shadow-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                          >
                            <option value="">-- เลือกสถานะ --</option>
                            <option value="ยังทำงาน">ยังทำงาน</option>
                            <option value="ลาออก">ลาออก</option>
                          </select>
                          {userWorkStatus[user.employee_id] === "ยังทำงาน" && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              ยังทำงาน
                            </span>
                          )}
                          {userWorkStatus[user.employee_id] === "ลาออก" && (
                            <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                              ลาออก
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!error && !loading && filteredUsers.length > 0 && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {selectedDep === "all" ? (
                    <>แสดง <span className="font-medium">{users.length}</span> รายการทั้งหมด</>
                  ) : (
                    <>
                      แสดง <span className="font-medium">{filteredUsers.length}</span> รายการ
                      จากทั้งหมด <span className="font-medium">{users.length}</span> รายการ
                      ในแผนก <span className="font-medium">{selectedDep}</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  อัปเดตล่าสุด: {new Date().toLocaleString('th-TH')}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}