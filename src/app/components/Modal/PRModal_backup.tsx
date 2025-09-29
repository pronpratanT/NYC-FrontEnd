import React from "react";
import { useEffect, useState } from "react";

export type PartNo = {
  part_no: string;
  choose_vendor: string | null;
  reason_choose: string | null;
  part_inventory_and_pr: InventoryItem[];
};

type InventoryItem = {
  pr_list_id: number;
  prod_code: string;
  prod_detail: string;
  dept_request: string;
  pr_no: string;
  date_compare: string;
  qty: number;
  unit: string;
  po_no: string;
  recent_purchase: RecentPurchase | RecentPurchase[];
  compare_vendors: CompareData[];
};

type RecentPurchase = {
  vendor_id: number;
  vendor_name: string;
  price: number;
  discount: number;
  date: string;
}

type CompareData = {
  vendor_name: string;
  tel: string;
  credit_term: string;
  price: number;
  discount: number;
  due_date: string;
};

type PRModalProps = {
  partNo: string;
  onClose: () => void;
};

const PRModal: React.FC<PRModalProps> = ({ partNo, onClose }) => {
  // Tab state
  const [activeTab, setActiveTab] = useState("purchase");
  const [compareData, setCompareData] = useState<PartNo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Pagination state for purchase details
  const [purchasePage, setPurchasePage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    if (!partNo) {
      setError("ไม่พบ Part Number");
      setLoading(false);
      return;
    }
    
    const fetchCompareData = async () => {
      try {
        setError("");
        setLoading(true);
        
        // Get token from sessionStorage
        const token = typeof window !== "undefined" ? sessionStorage.getItem("authToken") : null;
        if (!token) throw new Error("กรุณาเข้าสู่ระบบก่อน");
        
        // Fetch price comparison data
        const response = await fetch(`/api/purchase/pc/compare/list?part_no=${partNo}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log("Part No:", partNo);
        console.log("Response status:", response.status);
        
        if (!response.ok) throw new Error("โหลดข้อมูลเปรียบเทียบราคาไม่สำเร็จ");
        
        const data = await response.json();
        console.log("Raw API Response:", data);
        console.log("Data structure:", {
          hasData: !!data,
          dataKeys: Object.keys(data || {}),
          dataData: data?.data,
          directData: data,
          isArray: Array.isArray(data),
          isArrayData: Array.isArray(data?.data)
        });
        console.log("Response Data:", data);
        
        // Extract data from the response
        const compareData = data?.data || data;
        
        setCompareData(compareData);
        console.log("Compare Data after processing:", compareData);
        console.log("CompareData fields:", compareData ? Object.keys(compareData) : 'No compareData');
        
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "เกิดข้อผิดพลาด");
        } else {
          setError("เกิดข้อผิดพลาด");
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchCompareData();
  }, [partNo]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900/60 via-gray-900/40 to-slate-800/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-0 max-w-7xl w-full mx-4 overflow-hidden flex flex-col"
        style={{ height: '85vh', minHeight: '700px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="px-8 py-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50"></div>
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-4 text-white drop-shadow-sm">
                เปรียบเทียบราคาสินค้า
              </h2>
              
              {/* Product Info Tags */}
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 border border-white/30">
                  <span className="text-white/80 text-xs font-medium uppercase tracking-wide">Part No</span>
                  <div className="text-white font-bold text-sm mt-0.5">{partNo}</div>
                </div>
                
                {compareData?.part_inventory_and_pr?.[0]?.prod_code && 
                 compareData.part_inventory_and_pr.every(item => item.prod_code === compareData.part_inventory_and_pr[0].prod_code) && (
                  <div className="bg-emerald-500/30 backdrop-blur-sm rounded-full px-4 py-2 border border-emerald-400/40">
                    <span className="text-emerald-100 text-xs font-medium uppercase tracking-wide">รหัสสินค้า</span>
                    <div className="text-white font-bold text-sm mt-0.5">{compareData.part_inventory_and_pr[0].prod_code}</div>
                  </div>
                )}
                
                {compareData?.part_inventory_and_pr?.[0]?.prod_detail && 
                 compareData.part_inventory_and_pr.every(item => item.prod_detail === compareData.part_inventory_and_pr[0].prod_detail) && (
                  <div className="bg-amber-500/30 backdrop-blur-sm rounded-full px-4 py-2 border border-amber-400/40 max-w-md">
                    <span className="text-amber-100 text-xs font-medium uppercase tracking-wide">รายละเอียด</span>
                    <div className="text-white font-bold text-sm mt-0.5 truncate">{compareData.part_inventory_and_pr[0].prod_detail}</div>
                  </div>
                )}
              </div>
            </div>
            
            <button
              type="button"
              className="text-white/80 hover:text-white hover:bg-white/20 w-12 h-12 rounded-full inline-flex justify-center items-center transition-all duration-200 backdrop-blur-sm border border-white/20"
              onClick={onClose}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-8 py-2 border-b border-slate-200/60">
          <nav className="flex space-x-1">
            <button type="button" onClick={() => setActiveTab('purchase')}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative ${
                activeTab === 'purchase' 
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200/50 transform scale-105' 
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/80 hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-current opacity-75"></span>
                <span>รายละเอียดการขอซื้อ</span>
              </div>
            </button>
            
            <button type="button" onClick={() => setActiveTab('history')}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative ${
                activeTab === 'history' 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-200/50 transform scale-105' 
                  : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/80 hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-current opacity-75"></span>
                <span>ประวัติการซื้อเดิม</span>
              </div>
            </button>
            
            <button type="button" onClick={() => setActiveTab('compare')}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative ${
                activeTab === 'compare' 
                  ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-200/50 transform scale-105' 
                  : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50/80 hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-current opacity-75"></span>
                <span>เปรียบเทียบราคา</span>
              </div>
            </button>
            
            <button type="button" onClick={() => setActiveTab('summary')}
              className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative ${
                activeTab === 'summary' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-200/50 transform scale-105' 
                  : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50/80 hover:shadow-md'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-current opacity-75"></span>
                <span>ผลสรุป</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Modal body */}
        <div className="flex-1 bg-gradient-to-br from-white/60 via-slate-50/40 to-gray-50/60 overflow-hidden">
          <div className="p-6 h-full flex flex-col">
            {loading && (
              <div className="text-center py-12">
                <div className="inline-flex flex-col items-center space-y-3">
                  <div className="relative">
                    <div className="animate-spin rounded-full h-8 w-8 border-3 border-slate-200 border-t-emerald-500"></div>
                    <div className="animate-ping absolute inset-0 rounded-full h-8 w-8 border-emerald-400 opacity-20"></div>
                  </div>
                  <span className="text-sm text-slate-700 font-medium">กำลังโหลดข้อมูล...</span>
                </div>
              </div>
            )}
            
            {error && (
              <div className="bg-gradient-to-r from-red-50/80 via-rose-50/60 to-red-50/80 border border-red-200/60 rounded-2xl p-6 text-center shadow-sm">
                <div className="text-red-700 font-semibold">{error}</div>
              </div>
            )}

            {/* Tab Content - Purchase Details */}
            {!loading && !error && compareData && activeTab === 'purchase' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 overflow-hidden flex-1 flex flex-col">
                <div className="overflow-x-auto flex-1">
                  <table className="min-w-full text-sm table-fixed h-full">
                    <thead className="sticky top-0 z-10">
                      <tr className="bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 border-b border-emerald-200/50 backdrop-blur-sm">
                        <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide w-24">วันที่</th>
                        <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide w-28">ผู้ขอซื้อ</th>
                        <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide w-24">PR เลขที่</th>
                        <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide w-20">จำนวน</th>
                        <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide w-16">หน่วย</th>
                        <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide w-24">PO.NO.</th>
                        <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide w-32">ผู้ขาย</th>
                        <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide w-24">ราคา</th>
                        <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide w-20">ส่วนลด</th>
                        <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide w-24">วันที่เทียบ</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/95 backdrop-blur-sm">
                      {(() => {
                        // Flatten all purchase rows for pagination
                        const allRows: React.ReactElement[] = [];
                        if (compareData?.part_inventory_and_pr) {
                          compareData.part_inventory_and_pr.forEach((item, idx) => {
                            const rp = item.recent_purchase;
                            const renderPurchaseRow = (purchase: Partial<RecentPurchase>, key: string) => (
                              <tr key={key} className="hover:bg-gradient-to-r hover:from-emerald-50/30 hover:to-teal-50/30 border-b border-slate-100/60 transition-all duration-200">
                                <td className="px-3 py-3 text-slate-700 text-xs text-center font-medium">
                                  {item.date_compare ? new Date(item.date_compare).toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                  }) : '-'}
                                </td>
                                <td className="px-3 py-3">
                                  <span className="inline-flex px-2 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-100/80 to-indigo-100/80 text-blue-800 border border-blue-200/60 shadow-sm">
                                    {item.dept_request}
                                  </span>
                                </td>
                                <td className="px-3 py-3 font-bold text-emerald-700 text-xs text-center">{item.pr_no}</td>
                                <td className="px-3 py-3 font-bold text-slate-800 text-xs text-right">{item.qty}</td>
                                <td className="px-3 py-3 text-slate-600 text-xs text-center font-medium">{item.unit}</td>
                                <td className="px-3 py-3">
                                  {item.po_no ? (
                                    <span className="inline-flex px-2 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-green-100/80 to-emerald-100/80 text-green-800 border border-green-200/60 shadow-sm">
                                      {item.po_no}
                                    </span>
                                  ) : (
                                    <span className="inline-flex px-2 py-1 rounded-lg text-xs font-medium bg-gray-100/80 text-gray-600 border border-gray-200/60">รออนุมัติ</span>
                                  )}
                                </td>
                                <td className="px-3 py-3 text-slate-600 text-xs text-center font-medium">{purchase.vendor_name || '-'}</td>
                                <td className="px-3 py-3 text-slate-600 text-xs text-center font-medium">{purchase.price ? `฿${purchase.price.toLocaleString()}` : '-'}</td>
                                <td className="px-3 py-3 text-slate-600 text-xs text-center font-medium">{purchase.discount ?? '-'}</td>
                                <td className="px-3 py-3 text-slate-600 text-xs text-center font-medium">{purchase.date ? new Date(purchase.date).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                }) : '-'}</td>
                              </tr>
                            );
                            if (Array.isArray(rp)) {
                              if (rp.length > 0) {
                                rp.forEach((purchase, i) => allRows.push(renderPurchaseRow(purchase, `${idx}-${i}`)));
                              } else {
                                allRows.push(renderPurchaseRow({}, `${idx}-empty`));
                              }
                            } else if (rp && typeof rp === 'object') {
                              allRows.push(renderPurchaseRow(rp, `${idx}-single`));
                            } else {
                              allRows.push(renderPurchaseRow({}, `${idx}-empty`));
                            }
                          });
                        }
                        
                        // Pagination logic
                        const startIdx = (purchasePage - 1) * rowsPerPage;
                        const pagedRows = allRows.slice(startIdx, startIdx + rowsPerPage);
                        
                        return pagedRows.length > 0 ? pagedRows : (
                          <tr>
                            <td colSpan={10} className="px-4 py-12 text-center">
                              <div className="text-slate-600 font-semibold">ไม่พบข้อมูลการขอซื้อ</div>
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination controls for purchase tab */}
                <div className="flex justify-center items-center py-3 border-t border-slate-200/40 bg-gradient-to-r from-white/80 via-slate-50/60 to-white/80 backdrop-blur-sm">
                  <button
                    type="button"
                    className="px-4 py-2 mx-2 rounded-lg bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-slate-200 hover:to-slate-300 transition-all duration-200 shadow-sm text-sm"
                    disabled={purchasePage === 1}
                    onClick={() => setPurchasePage(p => Math.max(1, p - 1))}
                  >
                    ← หน้าก่อนหน้า
                  </button>
                  <div className="mx-3 px-3 py-2 bg-white/80 rounded-lg border border-slate-200/60 shadow-sm">
                    <span className="text-slate-600 font-medium text-sm">หน้า {purchasePage}</span>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 mx-2 rounded-lg bg-gradient-to-r from-slate-100 to-slate-200 text-slate-700 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:from-slate-200 hover:to-slate-300 transition-all duration-200 shadow-sm text-sm"
                    disabled={(() => {
                      let totalRows = 0;
                      if (compareData?.part_inventory_and_pr) {
                        compareData.part_inventory_and_pr.forEach((item) => {
                          const rp = item.recent_purchase;
                          if (Array.isArray(rp)) {
                            totalRows += rp.length > 0 ? rp.length : 1;
                          } else {
                            totalRows += 1;
                          }
                        });
                      }
                      return (purchasePage * rowsPerPage) >= totalRows;
                    })()}
                    onClick={() => setPurchasePage(p => p + 1)}
                  >
                    หน้าถัดไป →
                  </button>
                </div>
              </div>
            )}

            {/* Empty state when no data */}
            {!loading && !error && !compareData && activeTab === 'purchase' && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 p-8 text-center">
                <div className="text-slate-500 font-medium text-sm">ไม่พบข้อมูลสำหรับ Part No: 
                  <span className="text-slate-700 ml-1">{partNo}</span>
                </div>
              </div>
            )}

            {/* Tab Content - Purchase History */}
            {!loading && !error && compareData && activeTab === 'history' && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-blue-50/80 border-b border-blue-200/50">
                        <th className="px-4 py-4 text-center font-bold text-slate-800 text-xs uppercase tracking-wide">ผู้ขาย</th>
                        <th className="px-4 py-4 text-center font-bold text-slate-800 text-xs uppercase tracking-wide">ราคา</th>
                        <th className="px-4 py-4 text-center font-bold text-slate-800 text-xs uppercase tracking-wide">ส่วนลด %</th>
                        <th className="px-4 py-4 text-center font-bold text-slate-800 text-xs uppercase tracking-wide">วันที่เทียบ</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white/95 backdrop-blur-sm">
                        {(() => {
                          // Debug log for API data
                          console.log('DEBUG: part_inventory_and_pr', compareData?.part_inventory_and_pr);
                          if (compareData?.part_inventory_and_pr && Array.isArray(compareData.part_inventory_and_pr)) {
                            compareData.part_inventory_and_pr.forEach((item, idx) => {
                              console.log(`DEBUG: item[${idx}].recent_purchase`, item.recent_purchase);
                            });
                          }
                          const rows: React.ReactElement[] = [];
                          if (compareData?.part_inventory_and_pr && Array.isArray(compareData.part_inventory_and_pr)) {
                            compareData.part_inventory_and_pr.forEach((item, idx) => {
                              const rp = item.recent_purchase;
                              if (Array.isArray(rp)) {
                                rp.forEach((purchase, purchaseIdx) => {
                                  if (purchase && typeof purchase === 'object') {
                                    rows.push(
                                      <tr key={`${idx}-${purchaseIdx}`} className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 border-b border-slate-100/60 transition-all duration-200">
                                        <td className="px-4 py-4 text-slate-700 text-sm font-medium">
                                          {purchase.vendor_name || '-'}
                                        </td>
                                        <td className="px-4 py-4 font-bold text-slate-800 text-sm text-right">
                                          {purchase.price ? `฿${purchase.price.toLocaleString()}` : '-'}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                          {purchase.discount ? (
                                            <span className="inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-100/80 to-amber-100/80 text-orange-800 border border-orange-200/60 shadow-sm">
                                              {purchase.discount}%
                                            </span>
                                          ) : (
                                            <span className="text-slate-400">-</span>
                                          )}
                                        </td>
                                        <td className="px-4 py-4 text-slate-700 text-sm text-center font-medium">
                                          {purchase.date ? new Date(purchase.date).toLocaleDateString('th-TH', {
                                            year: 'numeric',
                                            month: '2-digit',
                                            day: '2-digit'
                                          }) : '-'}
                                        </td>
                                      </tr>
                                    );
                                  }
                                });
                              } else if (rp && typeof rp === 'object') {
                                rows.push(
                                  <tr key={`${idx}-single`} className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-indigo-50/30 border-b border-slate-100/60 transition-all duration-200">
                                    <td className="px-4 py-4 text-slate-700 text-sm font-medium">
                                      {rp.vendor_name || '-'}
                                    </td>
                                    <td className="px-4 py-4 font-bold text-slate-800 text-sm text-right">
                                      {rp.price ? `฿${rp.price.toLocaleString()}` : '-'}
                                    </td>
                                    <td className="px-4 py-4 text-center">
                                      {rp.discount ? (
                                        <span className="inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-orange-100/80 to-amber-100/80 text-orange-800 border border-orange-200/60 shadow-sm">
                                          {rp.discount}%
                                        </span>
                                      ) : (
                                        <span className="text-slate-400">-</span>
                                      )}
                                    </td>
                                    <td className="px-4 py-4 text-slate-700 text-sm text-center font-medium">
                                      {rp.date ? new Date(rp.date).toLocaleDateString('th-TH', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit'
                                      }) : '-'}
                                    </td>
                                  </tr>
                                );
                              }
                            });
                          }
                          return rows.length > 0 ? rows : (
                            <tr>
                              <td colSpan={4} className="px-4 py-12 text-center">
                                <div className="text-slate-600 font-semibold">ไม่พบประวัติการซื้อเดิม</div>
                              </td>
                            </tr>
                          );
                        })()}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Show empty state for history tab */}
            {!loading && !error && !compareData && activeTab === 'history' && (
              <div className="mb-6 text-center py-8 text-gray-500">
                ไม่พบประวัติการซื้อสำหรับ Part No: {partNo}
              </div>
            )}
            
            {!loading && !error && compareData && activeTab === 'compare' && (
              <div className="mb-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left text-gray-700 border-separate border-spacing-0">
                    <colgroup>
                      <col style={{width: '120px'}} />
                      <col style={{width: '90px'}} />
                      <col style={{width: '70px'}} />
                      <col style={{width: '80px'}} />
                      <col style={{width: '60px'}} />
                      <col style={{width: '80px'}} />
                    </colgroup>
                    <thead>
                      <tr className="bg-green-50">
                        <th className="px-2 py-2 font-semibold text-green-700 border-b border-green-200">Vendor</th>
                        <th className="px-2 py-2 font-semibold text-green-700 border-b border-green-200">Tel.</th>
                        <th className="px-2 py-2 font-semibold text-green-700 border-b border-green-200">เครดิต</th>
                        <th className="px-2 py-2 font-semibold text-green-700 border-b border-green-200">ราคา</th>
                        <th className="px-2 py-2 font-semibold text-green-700 border-b border-green-200">ลด%</th>
                        <th className="px-2 py-2 font-semibold text-green-700 border-b border-green-200">ส่งมอบ</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td colSpan={6} className="px-2 py-4 text-center text-gray-500">ไม่มีข้อมูลผู้ขายในขณะนี้</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Show empty state for compare tab */}
            {!loading && !error && !compareData && activeTab === 'compare' && (
              <div className="mb-6 text-center py-8 text-gray-500">
                ไม่พบข้อมูลเปรียบเทียบผู้ขายสำหรับ Part No: {partNo}
              </div>
            )}
            
            {!loading && !error && compareData && activeTab === 'summary' && (
              <div className="mb-6">
                <div className="text-center py-8 text-gray-500">
                  ฟังก์ชันสรุปผลยังไม่พร้อมใช้งาน
                </div>
              </div>
            )}
            
            <div className="flex justify-end border-t border-slate-200/40 pt-4 pb-4 bg-gradient-to-r from-white/80 via-slate-50/60 to-white/80 backdrop-blur-sm">
              <button
                type="button"
                className="px-8 py-3 text-sm font-bold text-white bg-gradient-to-r from-slate-700 via-gray-700 to-slate-800 hover:from-slate-800 hover:via-gray-800 hover:to-slate-900 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                onClick={onClose}
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PRModal;