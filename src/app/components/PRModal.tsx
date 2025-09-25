import React, { JSX } from "react";
import { useEffect, useState } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useToken } from "../context/TokenContext";
import { TiPlus } from "react-icons/ti";


// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #64748b #e2e8f0;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f8fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
    border-radius: 8px;
    border: 2px solid #f8fafc;
    box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #64748b 0%, #475569 100%);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:active {
    background: linear-gradient(180deg, #475569 0%, #334155 100%);
  }
  
  .custom-scrollbar::-webkit-scrollbar-corner {
    background: #f8fafc;
  }
  
  /* Hide scrollbar arrows/buttons */
  .custom-scrollbar::-webkit-scrollbar-button {
    display: none;
  }
  
  /* Force scrollbar to always show */
  .scrollbar-always {
    overflow-y: scroll !important;
    overflow-x: auto !important;
  }
`;

export type PartNo = {
  length: number;
  part_no: string;
  choose_vendor: string | null;
  reason_choose: string | null;
  requester_name: string;
  dept_request: string;
  pu_responsible: string;
  part_inventory_and_pr: InventoryItem[];
  compare_vendors: CompareData[];
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
  recent_purchase: RecentPurchase[];
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

export type PRModalProps = {
  partNo: string;
  prNumber?: string;
  department?: string;
  prDate?: string;
  qty?: number;
  unit?: string;
  pr_list_id?: number;
  onClose: () => void;
};

const PRModal: React.FC<PRModalProps> = ({ partNo, prNumber, department, prDate, qty, unit, pr_list_id, onClose }) => {
  // Log ข้อมูลที่ส่งเข้ามา
  console.log("PRModal Props:", {
    partNo,
    prNumber,
    department,
    prDate,
    qty,
    unit
  });

  // Tab state
  const [activeTab, setActiveTab] = useState("purchase");
  const [compareData, setCompareData] = useState<PartNo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = useToken();
  const [purchasePage, setPurchasePage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  // เก็บข้อมูลประวัติการซื้อสุดท้าย
  const [latestInventoryItem, setLatestInventoryItem] = useState<InventoryItem | null>(null);

  // Define type for selected row data
  type SelectedRowData = Omit<InventoryItem, 'qty' | 'unit'> & {
    selectedVendor: CompareData;
    previousPurchase: RecentPurchase | null;
    prNumber?: string;
    department?: string;
    prDate?: string;
    qty?: number;
    unit?: string;
  };

  // เก็บข้อมูลที่เลือกสำหรับแสดงใน tab ผลสรุป
  const [selectedRowData, setSelectedRowData] = useState<SelectedRowData | null>(null);
  // เก็บข้อมูลประวัติการซื้อเดิม (รองสุดท้าย)
  const [previousPurchaseHistory, setPreviousPurchaseHistory] = useState<RecentPurchase | null>(null);
  // เก็บเหตุผลการเลือก
  const [selectedReason, setSelectedReason] = useState<string>("");

  // เมื่อโหลด compareData แล้ว ให้ดึงข้อมูลล่าสุดมาเก็บ
  useEffect(() => {
    if (compareData?.part_inventory_and_pr) {
      // เรียงข้อมูลตาม pr_list_id จากมากไปน้อย (รายการล่าสุดก่อน)
      const sortedItems = [...compareData.part_inventory_and_pr].sort((a, b) => b.pr_list_id - a.pr_list_id);

      // ข้อมูลล่าสุด (index 0)
      setLatestInventoryItem(sortedItems.length > 0 ? sortedItems[0] : null);

      // หาประวัติการซื้อเดิม โดยนำจำนวนทั้งหมดลบ 1
      const totalCount = sortedItems.length;
      if (totalCount > 1) {
        const previousIndex = totalCount - 1; // ลบ 1 จากจำนวนทั้งหมด
        const previousItem = sortedItems[previousIndex];
        // console.log("Previous item:", previousItem);

        // เก็บ recent_purchase ของรายการก่อนหน้า
        if (previousItem.recent_purchase && Array.isArray(previousItem.recent_purchase) && previousItem.recent_purchase.length > 0) {
          setPreviousPurchaseHistory(previousItem.recent_purchase[0]);
          // console.log("Found previous purchase from index:", previousIndex, previousItem.recent_purchase[0]);
        } else {
          setPreviousPurchaseHistory(null);
          // console.log("No recent_purchase data in previous item at index:", previousIndex);
        }
      } else {
        setPreviousPurchaseHistory(null);
        // console.log("Not enough items for previous purchase history. Total count:", totalCount);
      }

      // console.log("Total items:", totalCount, "Latest item:", sortedItems[0]);

    } else {
      setLatestInventoryItem(null);
      setPreviousPurchaseHistory(null);
    }
  }, [compareData]);

  // Precompute total number of purchase rows for pagination controls
  const totalPurchaseRows = React.useMemo(() => {
    if (!compareData?.part_inventory_and_pr) return 0;
    let count = 0;
    compareData.part_inventory_and_pr.forEach(item => {
      const rp = item.recent_purchase;
      if (Array.isArray(rp)) {
        // if array but empty, we still render a single "empty" row for that inventory item
        count += rp.length > 0 ? rp.length : 1;
      } else if (rp && typeof rp === 'object') {
        count += 1;
      } else {
        count += 1;
      }
    });
    return count;
  }, [compareData]);

  // ฟังก์ชันจัดการการคลิกแถวในตารางเปรียบเทียบราคา
  const handleCompareRowClick = (vendor: CompareData) => {
    if (!latestInventoryItem) return; // ตรวจสอบว่ามีข้อมูลล่าสุดหรือไม่

    setSelectedRowData({
      ...latestInventoryItem, // ใช้ข้อมูลการขอซื้อล่าสุด
      selectedVendor: vendor, // เก็บข้อมูลผู้ขายที่เลือก
      previousPurchase: previousPurchaseHistory, // ใช้ประวัติการซื้อเดิม (รองสุดท้าย)
      // เพิ่มข้อมูลที่ส่งมาจาก parent component
      prNumber: prNumber,
      department: department,
      prDate: prDate,
      qty: qty,
      unit: unit
    });
    setActiveTab('summary'); // เปลี่ยนไป tab ผลสรุป
  };

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
        console.log("Fetching compare data for partNo:", partNo, "pr_list_id:", pr_list_id);
        if (!token) throw new Error("กรุณาเข้าสู่ระบบก่อน");

        // Fetch price comparison data
        const response = await fetch(`/api/purchase/pc/compare/list?part_no=${partNo}&pr_list_id=${pr_list_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) throw new Error("โหลดข้อมูลเปรียบเทียบราคาไม่สำเร็จ");

        const data = await response.json();
        // console.log("Data structure:", {
        //   hasData: !!data,
        //   dataKeys: Object.keys(data || {}),
        //   dataData: data?.data,
        //   directData: data,
        //   isArray: Array.isArray(data),
        //   isArrayData: Array.isArray(data?.data)
        // });

        // Extract data from the response
        const compareData = data?.data || data;

        setCompareData(compareData);

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
  }, [partNo, pr_list_id, token]);

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-900/60 via-gray-900/40 to-slate-800/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 p-0 max-w-7xl w-full mx-4 overflow-hidden"
          style={{ maxHeight: '90vh', height: '90vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 border-b border-slate-200">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Simple title */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold text-slate-800">
                      เปรียบเทียบราคาสินค้า
                    </h2>
                  </div>

                  {/* Clean Product Info Cards */}
                  <div className="flex flex-wrap gap-3">
                    <div className="bg-white rounded-lg px-4 py-2 border border-slate-200 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="p-1 bg-blue-50 rounded">
                          <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                        </div>
                        <div>
                          <span className="text-slate-500 text-xs font-medium">Part No</span>
                          <div className="text-slate-800 font-semibold text-sm">{partNo}</div>
                        </div>
                      </div>
                    </div>

                    {/* {prNumber && (
                      <div className="bg-white rounded-lg px-4 py-2 border border-purple-200 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="p-1 bg-purple-50 rounded">
                            <svg className="w-3 h-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-slate-500 text-xs font-medium">PR เลขที่</span>
                            <div className="text-slate-800 font-semibold text-sm">{prNumber}</div>
                          </div>
                        </div>
                      </div>
                    )} */}

                    {/* {department && (
                      <div className="bg-white rounded-lg px-4 py-2 border border-green-200 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="p-1 bg-green-50 rounded">
                            <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-slate-500 text-xs font-medium">แผนก</span>
                            <div className="text-slate-800 font-semibold text-sm">{department}</div>
                          </div>
                        </div>
                      </div>
                    )} */}

                    {/* {prDate && (
                      <div className="bg-white rounded-lg px-4 py-2 border border-indigo-200 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="p-1 bg-indigo-50 rounded">
                            <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-slate-500 text-xs font-medium">วันที่ทำ PR</span>
                            <div className="text-slate-800 font-semibold text-sm">{new Date(prDate).toLocaleDateString('th-TH')}</div>
                          </div>
                        </div>
                      </div>
                    )} */}

                    {/* {qty && unit && (
                      <div className="bg-white rounded-lg px-4 py-2 border border-orange-200 shadow-sm">
                        <div className="flex items-center space-x-2">
                          <div className="p-1 bg-orange-50 rounded">
                            <svg className="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-slate-500 text-xs font-medium">จำนวน</span>
                            <div className="text-slate-800 font-semibold text-sm">{qty} {unit}</div>
                          </div>
                        </div>
                      </div>
                    )} */}

                    {compareData?.part_inventory_and_pr?.[0]?.prod_code &&
                      compareData.part_inventory_and_pr.every(item => item.prod_code === compareData.part_inventory_and_pr[0].prod_code) && (
                        <div className="bg-white rounded-lg px-4 py-2 border border-emerald-200 shadow-sm">
                          <div className="flex items-center space-x-2">
                            <div className="p-1 bg-emerald-50 rounded">
                              <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <div>
                              <span className="text-slate-500 text-xs font-medium">รหัสสินค้า</span>
                              <div className="text-slate-800 font-semibold text-sm">{compareData.part_inventory_and_pr[0].prod_code}</div>
                            </div>
                          </div>
                        </div>
                      )}

                    {compareData?.part_inventory_and_pr?.[0]?.prod_detail &&
                      compareData.part_inventory_and_pr.every(item => item.prod_detail === compareData.part_inventory_and_pr[0].prod_detail) && (
                        <div className="bg-white rounded-lg px-4 py-2 border border-amber-200 shadow-sm max-w-sm">
                          <div className="flex items-center space-x-2">
                            <div className="p-1 bg-amber-50 rounded">
                              <svg className="w-3 h-3 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-slate-500 text-xs font-medium">รายละเอียด</span>
                              <div className="text-slate-800 font-semibold text-sm truncate">{compareData.part_inventory_and_pr[0].prod_detail}</div>
                            </div>
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 px-8 py-2 border-b border-slate-200/60">
            <nav className="flex space-x-1">
              <button type="button" onClick={() => setActiveTab('purchase')}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative ${activeTab === 'purchase'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200/50 transform scale-105'
                  : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/80 hover:shadow-md'
                  }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-current opacity-75"></span>
                  <span>ประวัติการซื้อและข้อมูล PR</span>
                </div>
              </button>

              <button type="button" onClick={() => setActiveTab('compare')}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative ${activeTab === 'compare'
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
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative ${activeTab === 'summary'
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
            <div className="p-6 flex flex-col custom-scrollbar overflow-y-auto" style={{ height: 'calc(90vh - 200px)', minHeight: '500px' }}>
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
                  {/* Header - Fixed, no scroll */}
                  {/* Main category headers - with full background */}
                  <div className="bg-gradient-to-r from-emerald-500 to-teal-600" style={{ paddingRight: '12px' }}>
                    <table className="text-sm table-fixed" style={{ width: '100%' }}>
                      <colgroup>
                        <col style={{ width: '50px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '110px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '70px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '180px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '100px' }} />
                      </colgroup>
                      <thead>
                        <tr className="text-white">
                          <th className="px-3 py-2 text-center font-bold text-xs border-r border-white/30" colSpan={7}>
                            รายละเอียดการขอซื้อ
                          </th>
                          <th className="px-3 py-2 text-center font-bold text-xs" colSpan={4}>
                            ประวัติการซื้อเดิม
                          </th>
                        </tr>
                      </thead>
                    </table>
                  </div>

                  {/* Detail headers - with full background */}
                  <div className="bg-gradient-to-r from-emerald-50/90 via-teal-50/70 to-emerald-50/90 border-b border-emerald-200/50" style={{ paddingRight: '12px' }}>
                    <table className="text-sm table-fixed" style={{ width: '100%' }}>
                      <colgroup>
                        <col style={{ width: '50px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '110px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '70px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '180px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '100px' }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide">#</th>
                          <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide">วันที่</th>
                          <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide">ผู้ขอซื้อ</th>
                          <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide">PR เลขที่</th>
                          <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide">จำนวน</th>
                          <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide">หน่วย</th>
                          <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide border-r border-gray-200">PO.NO.</th>
                          <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide">ผู้ขาย</th>
                          <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide">ราคา</th>
                          <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide">ส่วนลด</th>
                          <th className="px-3 py-3 text-center font-bold text-slate-800 text-xs uppercase tracking-wide">วันที่เทียบ</th>
                        </tr>
                      </thead>
                    </table>
                  </div>

                  {/* Scrollable tbody area */}
                  <div className="flex-1 custom-scrollbar scrollbar-always overflow-y-auto" style={{ maxHeight: 'calc(100vh - 480px)' }}>
                    <table className="text-sm table-fixed" style={{ width: '100%' }}>
                      <colgroup>
                        <col style={{ width: '50px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '110px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '70px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '180px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '100px' }} />
                      </colgroup>
                      <tbody className="bg-white/95 backdrop-blur-sm">
                        {(() => {
                          // Flatten all purchase rows for pagination
                          const allRows: React.ReactElement[] = [];
                          if (compareData?.part_inventory_and_pr) {
                            compareData.part_inventory_and_pr.forEach((item, idx) => {
                              const rp = item.recent_purchase;
                              const renderPurchaseRow = (purchase: Partial<RecentPurchase>, key: string): JSX.Element => (
                                <tr key={key} className="border-b border-slate-100/60">
                                  <td className="px-3 py-4 text-center text-slate-600 text-sm font-medium">{idx + 1}</td>
                                  <td className="px-4 py-4 text-slate-700 text-sm text-center font-medium">
                                    {item.date_compare ? new Date(item.date_compare).toLocaleDateString('th-TH', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit'
                                    }) : '-'}
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <span className="inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-100/80 to-indigo-100/80 text-blue-800 border border-blue-200/60 shadow-sm">
                                      {item.dept_request}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 font-bold text-emerald-700 text-sm text-center">{item.pr_no}</td>
                                  <td className="px-4 py-4 font-bold text-slate-800 text-sm text-right pr-4">{item.qty}</td>
                                  <td className="px-4 py-4 text-slate-600 text-sm text-center font-medium">{item.unit}</td>
                                  <td className="px-4 py-4 text-center border-r border-black-200">
                                    {item.po_no ? (
                                      <span className="inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-green-100/80 to-emerald-100/80 text-green-800 shadow-sm">
                                        {item.po_no}
                                      </span>
                                    ) : (
                                      <span className="inline-flex px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-100/80 text-gray-600 border border-gray-200/60">รออนุมัติ</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-4 text-slate-600 text-sm text-center font-medium">{purchase.vendor_name || '-'}</td>
                                  <td className="px-4 py-4 text-slate-600 text-sm text-center font-medium">{purchase.price ? `${purchase.price.toLocaleString()}` : '-'} ฿</td>
                                  <td className="px-4 py-4 text-slate-600 text-sm text-center font-medium">{purchase.discount ?? '-'}%</td>
                                  <td className="px-4 py-4 text-slate-600 text-sm text-center font-medium">{purchase.date ? new Date(purchase.date).toLocaleDateString('th-TH', {
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
                              <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                                ไม่มีข้อมูลในหน้านี้
                              </td>
                            </tr>
                          )
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination controls - Outside scrollable area */}
                  <div className="flex justify-end items-center py-2 px-4 border-t border-slate-200 bg-white">
                    {/* Left side - Rows per page dropdown */}
                    <div className="flex items-center space-x-2 text-sm text-slate-500 pr-2">
                      <select
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setPurchasePage(1);
                        }}
                        className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-slate-400 shadow-sm"
                      >
                        <option value={10}>10 per page</option>
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                      </select>
                    </div>

                    {/* Right side - Combined pagination info and navigation */}
                    <div className="flex items-center border border-slate-300 rounded shadow-sm bg-white overflow-hidden">
                      {/* Page info */}
                      <div className="px-3 py-1.5 text-sm text-slate-600 bg-slate-50 border-r border-slate-300">
                        {(() => {
                          const startRow = totalPurchaseRows === 0 ? 0 : ((purchasePage - 1) * rowsPerPage + 1);
                          const endRow = Math.min(purchasePage * rowsPerPage, totalPurchaseRows);
                          return (
                            <>
                              <span className="text-emerald-700 font-bold">{startRow}-{endRow}</span> of {totalPurchaseRows}
                            </>
                          );
                        })()}
                      </div>

                      {/* Navigation buttons */}
                      <div className="flex items-center">
                        <button
                          type="button"
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed border-r border-slate-300"
                          disabled={purchasePage === 1}
                          onClick={() => setPurchasePage(p => Math.max(1, p - 1))}
                        >
                          <IoIosArrowBack className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={compareData?.part_inventory_and_pr && ((purchasePage * rowsPerPage) >= totalPurchaseRows)}
                          onClick={() => setPurchasePage(p => p + 1)}
                        >
                          <IoIosArrowForward className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!loading && !error && compareData && activeTab === 'compare' && (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 overflow-hidden flex-1 flex flex-col">
                  {/* Header Section - Fixed, no scroll */}
                  <div className="bg-gradient-to-r from-purple-500 to-violet-600 text-white border-b border-emerald-200/50" style={{ paddingRight: '12px' }}>
                    <table className="text-sm table-fixed" style={{ width: '100%' }}>
                      <colgroup>
                        <col style={{ width: '50px' }} />
                        <col style={{ width: '180px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '120px' }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-center">#</th>
                          <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-center">Vendor</th>
                          <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-center">Tel.</th>
                          <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-center">เครดิต</th>
                          <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-center">ราคา</th>
                          <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-center">ลด%</th>
                          <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-center">ส่งมอบ</th>
                        </tr>
                      </thead>
                    </table>
                  </div>
                  {/* Scrollable tbody area */}
                  <div className="flex-1 custom-scrollbar scrollbar-always overflow-y-auto" style={{ maxHeight: 'calc(100vh - 480px)' }}>
                    <table className="text-sm table-fixed" style={{ width: '100%' }}>
                      <colgroup>
                        <col style={{ width: '50px' }} />
                        <col style={{ width: '180px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '120px' }} />
                      </colgroup>
                      <tbody className="bg-white/95">
                        {(() => {
                          // กรองข้อมูลเหมือนกับตารางประวัติการซื้อ
                          const allCompareData: CompareData[] = [];
                          if (compareData?.compare_vendors && Array.isArray(compareData.compare_vendors)) {
                            allCompareData.push(...compareData.compare_vendors);
                          }
                          // Pagination logic
                          // เรียงข้อมูลตามราคาจากน้อยไปมาก
                          const sortedCompareData = allCompareData.sort((a, b) => (a.price || 0) - (b.price || 0));
                          // Pagination logic
                          const startIdx = (purchasePage - 1) * rowsPerPage;
                          const pagedRows = sortedCompareData.slice(startIdx, startIdx + rowsPerPage);
                          // หาราคาที่ถูกที่สุด
                          // const lowestPrice = sortedCompareData.length > 0 ? sortedCompareData[0]?.price : null;
                          return pagedRows.length > 0 ? pagedRows.map((vendor, index) => (
                            <tr
                              key={index}
                              className="border-b border-slate-100 hover:bg-purple-50/50 cursor-pointer transition-colors"
                              onClick={() => handleCompareRowClick(vendor)}
                            >
                              <td className="px-4 py-3 text-sm text-slate-600 text-center">{startIdx + index + 1}</td>
                              <td className="px-4 py-3 text-sm font-medium text-slate-800">{vendor.vendor_name}</td>
                              <td className="px-4 py-3 text-sm text-slate-600 text-left">{vendor.tel}</td>
                              <td className="px-4 py-3 text-sm text-slate-600">{vendor.credit_term}</td>
                              <td className="px-4 py-3 text-sm font-bold text-emerald-700 text-right pr-5">
                                {vendor.price.toLocaleString()} ฿
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600 text-center">{vendor.discount}%</td>
                              <td className="px-4 py-3 text-sm text-slate-600 text-center">
                                {vendor.due_date ? new Date(vendor.due_date).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                }) : '-'}
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                                ไม่มีข้อมูลผู้ขายในขณะนี้
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination controls - Outside scrollable area */}
                  <div className="flex items-center py-2 px-4 border-t border-slate-200 bg-white">
                    {/* ปุ่มเพิ่ม Vendor ซ้ายสุด */}
                    <div>
                      <button
                        type="button"
                        className="px-3 py-1.5 h-10 text-sm rounded font-semibold shadow bg-gradient-to-r from-purple-500 to-violet-600 hover:bg-purple-600 text-white transition-all duration-150 flex items-center"
                        style={{ minHeight: '40px', height: '40px' }}
                        onClick={() => { /* TODO: Add vendor logic here */ }}
                      >
                        <TiPlus size={16} />&nbsp;ผู้เสนอราคา
                      </button>
                    </div>
                    {/* ส่วนอื่นๆ ขวาสุด */}
                    <div className="flex items-center space-x-4 ml-auto">
                      {/* Dropdown เลือกจำนวนแถว */}
                      <div className="flex items-center space-x-2 text-sm text-slate-500 pr-2">
                        <select
                          value={rowsPerPage}
                          onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setPurchasePage(1);
                          }}
                          className="border border-slate-300 rounded px-3 py-1.5 text-sm bg-white focus:outline-none focus:border-slate-400 shadow-sm"
                        >
                          <option value={10}>10 per page</option>
                          <option value={25}>25 per page</option>
                          <option value={50}>50 per page</option>
                          <option value={100}>100 per page</option>
                        </select>
                      </div>
                      {/* Pagination info และปุ่มเลื่อนหน้า */}
                      <div className="flex items-center border border-slate-300 rounded shadow-sm bg-white overflow-hidden">
                        <div className="px-3 py-1.5 text-sm text-slate-600 bg-slate-50 border-r border-slate-300">
                          {(() => {
                            const allCompareData: CompareData[] = Array.isArray(compareData?.compare_vendors)
                              ? [...compareData.compare_vendors]
                              : [];
                            const totalRows = allCompareData.length;
                            const startRow = totalRows === 0 ? 0 : ((purchasePage - 1) * rowsPerPage + 1);
                            const endRow = Math.min(purchasePage * rowsPerPage, totalRows);
                            return (
                              <>
                                <span className="text-purple-700 font-bold">{startRow}-{endRow}</span> of {totalRows}
                              </>
                            );
                          })()}
                        </div>
                        <div className="flex items-center">
                          <button
                            type="button"
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={(purchasePage * rowsPerPage >= totalPurchaseRows)}
                            onClick={() => setPurchasePage(p => p + 1)}
                          >
                            <IoIosArrowForward className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={
                              !Array.isArray(compareData?.compare_vendors) ||
                              (purchasePage * rowsPerPage >= compareData.compare_vendors.length)
                            }
                            onClick={() => setPurchasePage(p => p + 1)}
                          >
                            <IoIosArrowForward className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Show empty state for compare tab */}
              {!loading && !error && !compareData && activeTab === 'compare' && (
                <div className="mb-6 text-center py-8 text-gray-500">
                  ไม่พบข้อมูลเปรียบเทียบผู้ขายสำหรับ Part No: {partNo}
                </div>
              )}
              {!loading && !error && activeTab === 'summary' && (
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/40 overflow-hidden flex-1 p-6">
                  <h3 className="text-lg font-semibold text-slate-800 mb-4">ผลสรุปข้อมูลที่เลือก</h3>

                  {selectedRowData ? (
                    <div className="space-y-6">
                      {/* Grid แสดงข้อมูล 3 หมวด */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* ข้อมูลการขอซื้อล่าสุด */}
                        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200/60">
                          <h4 className="font-semibold text-emerald-700 mb-3">ข้อมูลการขอซื้อ</h4>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">วันที่ทำ PR:</span> {prDate ? new Date(prDate).toLocaleDateString('th-TH') : (prDate ? new Date(prDate).toLocaleDateString('th-TH') : '-')}</div>
                            <div><span className="font-medium">แผนกผู้ขอ:</span> {department || '-'}</div>
                            <div><span className="font-medium">เลขที่ PR:</span> {prNumber || '-'}</div>
                            <div><span className="font-medium">จำนวนที่ขอซื้อ:</span> {qty || '-'} {unit || ''}</div>
                          </div>
                        </div>

                        {/* ข้อมูลผู้ขายที่เลือก */}
                        {selectedRowData.selectedVendor && (
                          <div className="bg-gradient-to-r from-purple-50 to-violet-50 p-4 rounded-lg border border-purple-200/60">
                            <h4 className="font-semibold text-purple-700 mb-3">ข้อมูลผู้ขายที่เลือก</h4>
                            <div className="space-y-2 text-sm">
                              <div><span className="font-medium">ชื่อผู้ขาย:</span> {selectedRowData.selectedVendor.vendor_name || '-'}</div>
                              <div><span className="font-medium">เบอร์โทร:</span> {selectedRowData.selectedVendor.tel || '-'}</div>
                              <div><span className="font-medium">เครดิต:</span> {selectedRowData.selectedVendor.credit_term || '-'}</div>
                              <div><span className="font-medium">ราคา:</span> {selectedRowData.selectedVendor.price ? `฿${selectedRowData.selectedVendor.price.toLocaleString()}` : '-'}</div>
                              <div><span className="font-medium">ส่วนลด:</span> {selectedRowData.selectedVendor.discount ? `${selectedRowData.selectedVendor.discount}%` : '-'}</div>
                              {/* <div><span className="font-medium">วันที่ส่งมอบ:</span> {selectedRowData.selectedVendor.due_date ? new Date(selectedRowData.selectedVendor.due_date).toLocaleDateString('th-TH') : '-'}</div> */}
                            </div>
                          </div>
                        )}

                        {/* ข้อมูลสรุป */}
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200/60">
                          <h4 className="font-semibold text-orange-700 mb-3">ผลสรุป</h4>
                          {compareData ? (
                            <div className="space-y-2 text-sm">
                              <div>
                                <span className="font-medium">ผู้ร้องขอ:</span>
                                <span className="ml-2 text-gray-700">{compareData.requester_name || 'ไม่ระบุ'}</span>
                              </div>

                              <div>
                                <span className="font-medium">ผู้จัดทำ:</span>
                                <span className="ml-2 text-gray-700">{compareData.pu_responsible || 'ไม่ระบุ'}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-sm text-orange-600 bg-orange-100/50 p-3 rounded border border-orange-200">
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>ไม่มีข้อมูลรายชื่อผู้เกี่ยวข้อง</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ช่องเหตุผลการเลือก */}
                      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 rounded-2xl border border-indigo-200/50 shadow-lg">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="p-2 bg-indigo-100 rounded-xl">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-bold text-indigo-800">เหตุผลในการเลือกผู้ขาย</h4>
                        </div>

                        {/* Dropdown สำหรับเลือกเหตุผล */}
                        <div className="mb-4">
                          <label className="block text-sm font-semibold text-indigo-800 mb-2">
                            เลือกเหตุผลหลัก
                          </label>
                          <select
                            value={selectedReason}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className="w-full p-4 border-2 border-indigo-200 rounded-xl bg-white focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 text-sm font-medium transition-all duration-200 appearance-none cursor-pointer"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236366f1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                              backgroundPosition: 'right 1rem center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: '1.5em 1.5em'
                            }}
                          >
                            <option value="">-- กรุณาเลือกเหตุผลในการเลือกผู้ขาย --</option>
                            <option value="1">ราคาถูก มีสินค้าส่งมอบได้เลย</option>
                            <option value="2">ราคาแพงกว่า แต่มีสินค้าส่งมอบและรอไม่ได้</option>
                            <option value="3">มีผู้ขาย / ผู้ผลิตรายเดียว</option>
                            <option value="4">ราคาแพงกว่า คุณภาพดีกว่า</option>
                            <option value="5">ราคาเท่ากัน มีเครดิตยาวกว่า</option>
                            <option value="6">ราคาแพงกว่า แต่ส่งให้ ไม่ต้องไปรับ</option>
                            <option value="7">ราคาเท่ากัน ส่งเร็วกว่า (ส่งถึงที่)</option>
                            <option value="8">ราคาแพงกว่า แต่เป็นชุดเดียวกัน แยกสั่งไม่ได้</option>
                            <option value="9">ราคาเท่ากัน แบ่งสั่ง</option>
                            <option value="10">ต้องการด่วน รอเทียบราคาไม่ได้</option>
                          </select>
                        </div>

                        {/* Textarea สำหรับ "อื่นๆ" */}
                        {selectedReason === "อื่นๆ" && (
                          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-200">
                            <label className="block text-sm font-semibold text-indigo-800 mb-2">
                              กรุณาระบุเหตุผลเพิ่มเติม
                            </label>
                            <textarea
                              className="w-full min-h-[100px] p-4 border-2 border-indigo-200 rounded-xl resize-none focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 text-sm transition-all duration-200"
                              placeholder="โปรดระบุเหตุผลในการเลือกผู้ขายรายนี้อย่างละเอียด..."
                              rows={4}
                            />
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-indigo-200">
                          <button
                            type="button"
                            className="px-6 py-2.5 bg-white text-indigo-600 border-2 border-indigo-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 text-sm font-semibold"
                            onClick={() => setSelectedReason("")}
                          >
                            ล้างการเลือก
                          </button>
                          <button
                            type="button"
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={!selectedReason}
                            onClick={() => {
                              // ที่นี่สามารถเพิ่มการบันทึกข้อมูลได้
                              console.log('บันทึกเหตุผล:', selectedReason);
                              console.log('ข้อมูลที่เลือก:', selectedRowData);
                            }}
                          >
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                              <span>บันทึกเหตุผล</span>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-6xl mb-4">📊</div>
                      <p>กรุณาคลิกที่แถวข้อมูลในตารางเปรียบเทียบราคาเพื่อดูผลสรุป</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PRModal;