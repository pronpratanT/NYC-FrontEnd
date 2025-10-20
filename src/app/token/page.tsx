// app/admin/tokens/page.tsx
"use client";
import { useEffect, useState } from "react";

type Department = {
  ID: number;
  name: string;
  short_name: string;
}

type GeneratedToken = {
  token: string;
  tokenId: string;
  departmentId: number;
  departmentName: string;
  expiresAt: string;
}

type ActiveToken = {
  key: string;
  departmentId: number;
  departmentName: string;
  tokenId: string;
  generatedAt: number;
  expiresAt: number;
  isUsed: boolean;
  usedAt?: string;
  createdAt: string;
}

export default function AdminTokensPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [generatedToken, setGeneratedToken] = useState<GeneratedToken | null>(null);
  const [activeTokens, setActiveTokens] = useState<ActiveToken[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [copySuccess, setCopySuccess] = useState<string>("");

  // ดึงข้อมูลแผนก
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_USER_SERVICE}/api/user/deps`, { cache: "no-store" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        const depsArray = Array.isArray(data) ? data : data.data || [];
        setDepartments(depsArray);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(`ไม่สามารถดึงข้อมูลแผนกได้: ${err.message}`);
        } else {
          setError('ไม่สามารถดึงข้อมูลแผนกได้');
        }
      }
    };

    fetchDepartments();
    fetchActiveTokens();
  }, []);

  // ดึงรายการ token ที่ active
  const fetchActiveTokens = async () => {
    try {
      const response = await fetch("/api/admin/tokens");
      if (response.ok) {
        const data = await response.json();
        setActiveTokens(data.tokens || []);
      }
    } catch (err) {
      console.error("Failed to fetch active tokens:", err);
    }
  };

  // Generate token
  const handleGenerateToken = async () => {
    if (!selectedDepartment) {
      setError("กรุณาเลือกแผนกก่อน");
      return;
    }

    const dept = departments.find(d => d.ID.toString() === selectedDepartment);
    if (!dept) {
      setError("ไม่พบข้อมูลแผนก");
      return;
    }

    setLoading(true);
    setError("");
    setGeneratedToken(null);

    try {
      const response = await fetch("/api/auth/generate-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: dept.ID,
          departmentName: dept.name
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setGeneratedToken(data);
      
      // Refresh active tokens list
      fetchActiveTokens();
      
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(`ไม่สามารถสร้าง token ได้: ${err.message}`);
      } else {
        setError('ไม่สามารถสร้าง token ได้');
      }
    } finally {
      setLoading(false);
    }
  };

  // Copy token to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setCopySuccess("คัดลอกแล้ว!");
      } else {
        // Fallback สำหรับ browser ที่ไม่รองรับ clipboard API
        const textarea = document.createElement("textarea");
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand("copy");
          setCopySuccess("คัดลอกแล้ว!");
        } catch {
          setCopySuccess("ไม่สามารถคัดลอกได้");
        }
        document.body.removeChild(textarea);
      }
      setTimeout(() => setCopySuccess(""), 2000);
    } catch (err: unknown) {
      console.error("Clipboard error:", err);
      setCopySuccess("ไม่สามารถคัดลอกได้");
      setTimeout(() => setCopySuccess(""), 2000);
    }
  };

  // Revoke token
  const handleRevokeToken = async (tokenId: string) => {
    if (!confirm("ต้องการยกเลิก token นี้หรือไม่?")) return;

    try {
      const response = await fetch("/api/admin/revoke-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId })
      });

      if (response.ok) {
        alert("ยกเลิก token เรียบร้อย");
        fetchActiveTokens();
      } else {
        const errorData = await response.json();
        alert(`เกิดข้อผิดพลาด: ${errorData.error}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`เกิดข้อผิดพลาด: ${err.message}`);
      } else {
        alert('เกิดข้อผิดพลาด');
      }
    }
  };

  // Cleanup expired tokens
  const handleCleanupExpired = async () => {
    if (!confirm("ต้องการล้าง token ที่หมดอายุหรือไม่?")) return;

    try {
      const response = await fetch("/api/admin/tokens", { method: "DELETE" });
      if (response.ok) {
  let data: unknown = {};
        try {
          data = await response.json();
        } catch {
          // ถ้า response ไม่มี body หรือไม่ใช่ JSON
          data = {};
        }
        let cleanedCount = 0;
        if (typeof data === 'object' && data !== null && 'cleanedCount' in data) {
          cleanedCount = (data as { cleanedCount?: number }).cleanedCount ?? 0;
        }
        alert(`ล้างข้อมูลเรียบร้อย (${cleanedCount} token)`);
        fetchActiveTokens();
      } else {
  let errorData: unknown = {};
        try {
          errorData = await response.json();
        } catch {
          errorData = {};
        }
        let errorMsg = 'Unknown error';
        if (typeof errorData === 'object' && errorData !== null && 'error' in errorData) {
          errorMsg = (errorData as { error?: string }).error ?? 'Unknown error';
        }
        alert(`เกิดข้อผิดพลาด: ${errorMsg}`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(`เกิดข้อผิดพลาด: ${err.message}`);
      } else {
        alert('เกิดข้อผิดพลาด');
      }
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 rounded-t-lg">
            <h1 className="text-2xl font-bold text-white">
              🔑 จัดการ Access Tokens
            </h1>
            <p className="text-purple-100 mt-1">
              สร้างและจัดการ token สำหรับเข้าถึงข้อมูลแผนก
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Active Tokens</p>
                <p className="text-2xl font-bold text-blue-800">
                  {activeTokens.filter(t => !t.isUsed).length}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Used Tokens</p>
                <p className="text-2xl font-bold text-green-800">
                  {activeTokens.filter(t => t.isUsed).length}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600">Total Tokens</p>
                <p className="text-2xl font-bold text-red-800">{activeTokens.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Token Generator */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4 rounded-t-lg">
              <h2 className="text-lg font-bold text-white">🔧 สร้าง Token ใหม่</h2>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    เลือกแผนก:
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={loading}
                  >
                    <option value="">-- เลือกแผนก --</option>
                    {departments.map((dept) => (
                      <option key={dept.ID} value={dept.ID}>
                        {dept.name} ({dept.short_name})
                      </option>
                    ))}
                  </select>
                </div>

                {error && (
                  <div className="bg-red-50 border-l-4 border-red-400 p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleGenerateToken}
                  disabled={loading || !selectedDepartment}
                  className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      กำลังสร้าง...
                    </>
                  ) : (
                    '🔑 สร้าง Access Token'
                  )}
                </button>
              </div>

              {/* Generated Token Display */}
              {generatedToken && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-3">✅ Token สร้างเรียบร้อยแล้ว!</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-green-600 mb-1">แผนก:</p>
                      <p className="font-mono text-sm bg-white p-2 rounded border">
                        {generatedToken.departmentName}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-green-600 mb-1">Token ID:</p>
                      <p className="font-mono text-sm bg-white p-2 rounded border">
                        {generatedToken.tokenId}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-green-600 mb-1">หมดอายุ:</p>
                      <p className="font-mono text-sm bg-white p-2 rounded border">
                        {new Date(generatedToken.expiresAt).toLocaleString('th-TH')}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-green-600">Access Token:</p>
                        <button
                          onClick={() => copyToClipboard(generatedToken.token)}
                          className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                          type="button"
                        >
                          📋 คัดลอก
                        </button>
                      </div>
                      <div className="bg-white p-2 rounded border max-h-32 overflow-y-auto">
                        <p className="font-mono text-xs break-all text-gray-800">
                          {generatedToken.token}
                        </p>
                      </div>
                    </div>

                    {copySuccess && (
                      <p className="text-sm text-green-600 text-center">{copySuccess}</p>
                    )}
                  </div>

                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-xs text-yellow-700">
                      <strong>⚠️ คำเตือน:</strong> Token นี้ใช้งานได้เพียงครั้งเดียวและหมดอายุใน 24 ชั่วโมง 
                      กรุณาเก็บรักษาไว้อย่างปลอดภัย
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Tokens List */}
          <div className="bg-white rounded-lg shadow-md">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4 rounded-t-lg flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">📋 Tokens ที่ใช้งานได้</h2>
              <button
                onClick={handleCleanupExpired}
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
              >
                🗑️ ล้าง Expired
              </button>
            </div>

            <div className="p-6">
              {activeTokens.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📝</div>
                  <p>ยังไม่มี token ในระบบ</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {activeTokens
                    .sort((a, b) => b.generatedAt - a.generatedAt)
                    .map((token) => (
                      <div
                        key={token.tokenId}
                        className={`p-4 rounded-lg border-2 ${
                          token.isUsed 
                            ? 'bg-gray-50 border-gray-200' 
                            : 'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-semibold text-gray-800">
                              {token.departmentName}
                            </h4>
                            <p className="text-xs text-gray-500">
                              ID: {token.tokenId}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {token.isUsed ? (
                              <span className="bg-gray-500 text-white px-2 py-1 rounded text-xs">
                                ✅ ใช้แล้ว
                              </span>
                            ) : (
                              <>
                                <span className="bg-green-500 text-white px-2 py-1 rounded text-xs">
                                  🟢 Active
                                </span>
                                <button
                                  onClick={() => handleRevokeToken(token.tokenId)}
                                  className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs"
                                >
                                  ❌ ยกเลิก
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">สร้างเมื่อ:</span><br/>
                            {new Date(token.generatedAt).toLocaleString('th-TH')}
                          </div>
                          <div>
                            <span className="font-medium">หมดอายุ:</span><br/>
                            {new Date(token.expiresAt).toLocaleString('th-TH')}
                          </div>
                          {token.usedAt && (
                            <div className="col-span-2">
                              <span className="font-medium">ใช้เมื่อ:</span><br/>
                              {new Date(token.usedAt).toLocaleString('th-TH')}
                            </div>
                          )}
                        </div>

                        {/* Expiry warning */}
                        {!token.isUsed && Date.now() > token.expiresAt - (2 * 60 * 60 * 1000) && (
                          <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
                            <p className="text-xs text-yellow-700">
                              ⚠️ Token นี้จะหมดอายุเร็วๆ นี้!
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}