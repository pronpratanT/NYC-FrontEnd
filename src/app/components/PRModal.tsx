import React, { JSX } from "react";
import { useEffect, useState, useRef } from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { useToken } from "../context/TokenContext";
import { TiPlus } from "react-icons/ti";
import { useTheme } from "./ThemeProvider";
import CreateVendor from "./CreateVendor";


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
  pcl_id: number;
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
  vendor_id: number;
  vendor_name: string;
  vendor_code: string;
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

type VendorSelected = {
  ID: number;
  vendor_code: string;
  vendor_name: string;
  tax_id: string | null;
  credit_term: string;
  tel_no: string;
  fax_no: string;
  contact_person: string;
  email: string;
}

const PRModal: React.FC<PRModalProps> = ({ partNo, prNumber, department, prDate, qty, unit, pr_list_id, onClose }) => {
  // Log ข้อมูลที่ส่งเข้ามา
  // console.log("PRModal Props:", {
  //   partNo,
  //   prNumber,
  //   department,
  //   prDate,
  //   qty,
  //   unit
  // });

  // Tab state
  const [activeTab, setActiveTab] = useState("purchase");
  const [compareData, setCompareData] = useState<PartNo | null>(null);
  const [loading, setLoading] = useState(true);
  // loading สำหรับ vendor dropdown เท่านั้น
  const [vendorLoading, setVendorLoading] = useState(false);
  const [error, setError] = useState("");
  const token = useToken();
  const { isDarkMode } = useTheme();
  const [purchasePage, setPurchasePage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  // เก็บข้อมูลประวัติการซื้อสุดท้าย
  const [latestInventoryItem, setLatestInventoryItem] = useState<InventoryItem | null>(null);

  //search vendor
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);

  // State for selected vendor details
  const [selectedVendorDetail, setSelectedVendorDetail] = useState<VendorSelected | null>(null);
  // State for extra vendors in compare table
  const [extraCompareVendors, setExtraCompareVendors] = useState<CompareData[]>([]);

  //create vendor modal
  const [showCreateVendor, setShowCreateVendor] = useState(false);

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

  // ปิด dropdown เมื่อคลิกนอก input หรือ dropdown
  useEffect(() => {
    if (!showDropdown) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  {/* Search vendor Dropdown */ }
  useEffect(() => {
    if (!search) {
      setVendors([]);
      setShowDropdown(false);
      return;
    }
    const fetchData = async () => {
      try {
        setVendorLoading(true);
        const response = await fetch(`/api/proxy/purchase/search-vendor?keyword=${encodeURIComponent(search)}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Vendor API error: HTTP ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        let arr: string[] = [];
        if (Array.isArray(data)) {
          arr = data;
        } else if (data && Array.isArray(data.data)) {
          arr = data.data;
        } else {
          arr = [];
        }
        setVendors(arr);
        setShowDropdown(true);
      } catch (err: unknown) {
        if (err instanceof Error) {
          console.error(err.message);
        } else {
          console.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
        }
      } finally {
        setVendorLoading(false);
      }
    };
    fetchData();
  }, [search]);

  {/* input vendor selected to table */ }
  // Fetch vendor detail when a vendor is selected and add to compare table if not present
  useEffect(() => {
    if (selectedVendors.length === 0) {
      setSelectedVendorDetail(null);
      return;
    }
    // Only fetch for the last selected vendor
    const vendorCode = selectedVendors[selectedVendors.length - 1];
    if (!vendorCode) return;

    function formatPartForFetch(part: string) {
      const vendorCode = part.indexOf(' |');
      return vendorCode !== -1 ? part.slice(0, vendorCode) : part;
    }

    const fetchVendorDetail = async () => {
      const formattedVendorCode = formatPartForFetch(vendorCode);
      try {
        const res = await fetch(`http://127.0.0.1:6100/api/purchase/vendors?vendorCode=${encodeURIComponent(formattedVendorCode)}`);
        if (!res.ok) throw new Error('ไม่พบข้อมูล Vendor');
        const data = await res.json();
        // Support both array and object response
        const vendorData = Array.isArray(data) ? data[0] : (data.data ? data.data : data);
        setSelectedVendorDetail(vendorData as VendorSelected);
        // Add to compare table if not already present
        if (vendorData && vendorData.vendor_code) {
          setExtraCompareVendors(prev => {
            // Prevent duplicate vendor_code
            if (prev.some(v => v.vendor_code === vendorData.vendor_code)) return prev;
            // Map VendorSelected to CompareData (fill with '-')
            const newCompare: CompareData = {
              vendor_id: vendorData.vendor_id || vendorData.ID,
              vendor_name: vendorData.vendor_name,
              vendor_code: vendorData.vendor_code,
              tel: vendorData.tel_no || '-',
              credit_term: vendorData.credit_term || '-',
              price: 0,
              discount: 0,
              due_date: '-',
            };
            return [...prev, newCompare];
          });
        }
        console.log("Fetched vendor detail:", vendorData);
      } catch (e) {
        setSelectedVendorDetail(null);
      }
    };
    fetchVendorDetail();
  }, [selectedVendors]);

  //handleSubmit
  const handleSubmit = async () => {
    if (!pr_list_id) {
      alert('ไม่พบข้อมูล PR List ID');
      return;
    }
    if (!token) {
      alert('กรุณาเข้าสู่ระบบก่อน');
      return;
    }

    // เตรียม payload โดยใช้ pcl_id จาก compareData ถ้ามี ไม่เช่นนั้นใช้ pr_list_id จาก props
    const payload = {
      pcl_id: compareData?.pcl_id,
      vendor_selected: selectedRowData?.selectedVendor?.vendor_id || null,
      reason_choose: selectedReason,
      new_qty: qty,
    };

    console.log("Submitting payload:", payload);

    try {
      const res = await fetch('http://127.0.0.1:6100/api/purchase/send-pcl-to-approve', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'บันทึกข้อมูลไม่สำเร็จ');
      }
      alert('บันทึกข้อมูลเรียบร้อยแล้ว');
      if (onClose) onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล');
      console.error(err);
    }
  }

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900/60 via-gray-900/40 to-slate-800/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className={`backdrop-blur-md rounded-3xl shadow-2xl border p-0 max-w-7xl w-full mx-4 overflow-hidden ${isDarkMode ? 'bg-slate-900/95 border-slate-700/60' : 'bg-white/95 border-white/20'}`}
          style={{ maxHeight: '90vh', height: '90vh' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className={`bg-gradient-to-r border-b ${isDarkMode ? 'from-slate-800/80 to-slate-900/80 border-slate-700' : 'from-slate-50 to-blue-50 border-slate-200'}`}>
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Simple title */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/40' : 'bg-blue-100'}`}>
                      <svg className={`w-5 h-5 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                      เปรียบเทียบราคาสินค้า
                    </h2>
                  </div>

                  {/* Clean Product Info Cards */}
                  <div className="flex flex-wrap gap-3">
                    <div className={`rounded-lg px-4 py-2 border shadow-sm ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center space-x-2">
                        <div className={`p-1 rounded ${isDarkMode ? 'bg-blue-900/40' : 'bg-blue-50'}`}>
                          <svg className={`w-3 h-3 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                          </svg>
                        </div>
                        <div>
                          <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Part No</span>
                          <div className={`font-semibold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{partNo}</div>
                        </div>
                      </div>
                    </div>

                    {/* {prNumber && (
                      <div className={`rounded-lg px-4 py-2 border shadow-sm ${isDarkMode ? 'bg-slate-800/60 border-purple-700/50' : 'bg-white border-purple-200'}`}>
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
                      <div className={`rounded-lg px-4 py-2 border shadow-sm ${isDarkMode ? 'bg-slate-800/60 border-green-700/50' : 'bg-white border-green-200'}`}>
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
                      <div className={`rounded-lg px-4 py-2 border shadow-sm ${isDarkMode ? 'bg-slate-800/60 border-indigo-700/50' : 'bg-white border-indigo-200'}`}>
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
                      <div className={`rounded-lg px-4 py-2 border shadow-sm ${isDarkMode ? 'bg-slate-800/60 border-orange-700/50' : 'bg-white border-orange-200'}`}>
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
                        <div className={`rounded-lg px-4 py-2 border shadow-sm ${isDarkMode ? 'bg-slate-800/60 border-emerald-700/50' : 'bg-white border-emerald-200'}`}>
                          <div className="flex items-center space-x-2">
                            <div className={`p-1 rounded ${isDarkMode ? 'bg-emerald-900/40' : 'bg-emerald-50'}`}>
                              <svg className={`w-3 h-3 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                              </svg>
                            </div>
                            <div>
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>รหัสสินค้า</span>
                              <div className={`font-semibold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{compareData.part_inventory_and_pr[0].prod_code}</div>
                            </div>
                          </div>
                        </div>
                      )}

                    {compareData?.part_inventory_and_pr?.[0]?.prod_detail &&
                      compareData.part_inventory_and_pr.every(item => item.prod_detail === compareData.part_inventory_and_pr[0].prod_detail) && (
                        <div className={`rounded-lg px-4 py-2 border shadow-sm max-w-sm ${isDarkMode ? 'bg-slate-800/60 border-amber-700/50' : 'bg-white border-amber-200'}`}>
                          <div className="flex items-center space-x-2">
                            <div className={`p-1 rounded ${isDarkMode ? 'bg-amber-900/40' : 'bg-amber-50'}`}>
                              <svg className={`w-3 h-3 ${isDarkMode ? 'text-amber-300' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m-1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>รายละเอียด</span>
                              <div className={`font-semibold text-sm truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{compareData.part_inventory_and_pr[0].prod_detail}</div>
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
          <div className={`bg-gradient-to-r px-8 py-2 border-b ${isDarkMode ? 'from-slate-800/60 via-slate-900/60 to-slate-800/60 border-slate-700/60' : 'from-slate-50 via-white to-slate-50 border-slate-200/60'}`}>
            <nav className="flex space-x-1">
              <button type="button" onClick={() => setActiveTab('purchase')}
                className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 relative ${activeTab === 'purchase'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200/50 transform scale-105'
                  : isDarkMode
                    ? 'text-slate-300 hover:text-emerald-400 hover:bg-emerald-900/30 hover:shadow-md'
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
                  : isDarkMode
                    ? 'text-slate-300 hover:text-purple-400 hover:bg-purple-900/30 hover:shadow-md'
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
                  : isDarkMode
                    ? 'text-slate-300 hover:text-amber-400 hover:bg-amber-900/30 hover:shadow-md'
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
          <div className={`flex-1 bg-gradient-to-br overflow-hidden ${isDarkMode ? 'from-slate-900/60 via-slate-800/40 to-slate-900/60' : 'from-white/60 via-slate-50/40 to-gray-50/60'}`}>
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
                <div className={`backdrop-blur-sm rounded-2xl shadow-xl border overflow-hidden flex-1 flex flex-col ${isDarkMode ? 'bg-slate-800/90 border-slate-700/60' : 'bg-white/90 border-white/40'}`}>
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
                  <div className={`bg-gradient-to-r border-b ${isDarkMode ? 'from-emerald-900/60 via-teal-900/50 to-emerald-900/60 border-emerald-700/50' : 'from-emerald-50/90 via-teal-50/70 to-emerald-50/90 border-emerald-200/50'}`} style={{ paddingRight: '12px' }}>
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
                          <th className={`px-3 py-3 text-center font-bold text-xs uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>#</th>
                          <th className={`px-3 py-3 text-center font-bold text-xs uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>วันที่</th>
                          <th className={`px-3 py-3 text-center font-bold text-xs uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>ผู้ขอซื้อ</th>
                          <th className={`px-3 py-3 text-center font-bold text-xs uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>PR เลขที่</th>
                          <th className={`px-3 py-3 text-center font-bold text-xs uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>จำนวน</th>
                          <th className={`px-3 py-3 text-center font-bold text-xs uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>หน่วย</th>
                          <th className={`px-3 py-3 text-center font-bold text-xs uppercase tracking-wide border-r ${isDarkMode ? 'text-slate-200 border-gray-600' : 'text-slate-800 border-gray-200'}`}>PO.NO.</th>
                          <th className={`px-3 py-3 text-center font-bold text-xs uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>ผู้ขาย</th>
                          <th className={`px-3 py-3 text-center font-bold text-xs uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>ราคา</th>
                          <th className={`px-3 py-3 text-center font-bold text-xs uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>ส่วนลด</th>
                          <th className={`px-3 py-3 text-center font-bold text-xs uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>วันที่เทียบ</th>
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
                      <tbody className={`backdrop-blur-sm ${isDarkMode ? 'bg-slate-800/95' : 'bg-white/95'}`}>
                        {(() => {
                          // Flatten all purchase rows for pagination
                          const allRows: React.ReactElement[] = [];
                          if (compareData?.part_inventory_and_pr) {
                            compareData.part_inventory_and_pr.forEach((item, idx) => {
                              const rp = item.recent_purchase;
                              const renderPurchaseRow = (purchase: Partial<RecentPurchase>, key: string): JSX.Element => (
                                <tr key={key} className={`border-b ${isDarkMode ? 'border-slate-700/60' : 'border-slate-100/60'}`}>
                                  <td className={`px-3 py-4 text-center text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{idx + 1}</td>
                                  <td className={`px-4 py-4 text-sm text-center font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                                    {item.date_compare ? new Date(item.date_compare).toLocaleDateString('th-TH', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit'
                                    }) : '-'}
                                  </td>
                                  <td className="px-4 py-4 text-center">
                                    <span className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r border shadow-sm ${isDarkMode ? 'from-blue-900/80 to-indigo-900/80 text-blue-300 border-blue-700/60' : 'from-blue-100/80 to-indigo-100/80 text-blue-800 border-blue-200/60'}`}>
                                      {item.dept_request}
                                    </span>
                                  </td>
                                  <td className={`px-4 py-4 font-bold text-sm text-center ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{item.pr_no}</td>
                                  <td className={`px-4 py-4 font-bold text-sm text-right pr-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{item.qty}</td>
                                  <td className={`px-4 py-4 text-sm text-center font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{item.unit}</td>
                                  <td className={`px-4 py-4 text-center border-r ${isDarkMode ? 'border-slate-700' : 'border-black-200'}`}>
                                    {item.po_no ? (
                                      <span className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r shadow-sm ${isDarkMode ? 'from-green-900/80 to-emerald-900/80 text-green-300' : 'from-green-100/80 to-emerald-100/80 text-green-800'}`}>
                                        {item.po_no}
                                      </span>
                                    ) : (
                                      <span className={`inline-flex px-3 py-1.5 rounded-xl text-xs font-medium border ${isDarkMode ? 'bg-gray-800/80 text-gray-400 border-gray-600/60' : 'bg-gray-100/80 text-gray-600 border-gray-200/60'}`}>รออนุมัติ</span>
                                    )}
                                  </td>
                                  <td className={`px-4 py-4 text-sm text-center font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{purchase.vendor_name || '-'}</td>
                                  <td className={`px-4 py-4 text-sm text-center font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{purchase.price ? `${purchase.price.toLocaleString()}` : '-'} ฿</td>
                                  <td className={`px-4 py-4 text-sm text-center font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{purchase.discount ?? '-'}%</td>
                                  <td className={`px-4 py-4 text-sm text-center font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{purchase.date ? new Date(purchase.date).toLocaleDateString('th-TH', {
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
                  <div className={`flex justify-end items-center py-3 px-4 border-t ${isDarkMode ? 'border-slate-700 bg-slate-800/90' : 'border-slate-200 bg-white'}`}>
                    {/* Left side - Rows per page dropdown */}
                    <div className="flex items-center space-x-2 text-sm text-slate-500 pr-2">
                      <select
                        value={rowsPerPage}
                        onChange={(e) => {
                          setRowsPerPage(Number(e.target.value));
                          setPurchasePage(1);
                        }}
                        className={`border rounded px-3 py-1.5 text-sm focus:outline-none shadow-sm ${isDarkMode ? 'border-slate-600 bg-slate-800 text-slate-200 focus:border-slate-500' : 'border-slate-300 bg-white text-slate-700 focus:border-slate-400'}`}
                      >
                        <option value={10}>10 per page</option>
                        <option value={25}>25 per page</option>
                        <option value={50}>50 per page</option>
                        <option value={100}>100 per page</option>
                      </select>
                    </div>

                    {/* Right side - Combined pagination info and navigation */}
                    <div className={`flex items-center border rounded shadow-sm overflow-hidden ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-white'}`}>
                      {/* Page info */}
                      <div className={`px-3 py-1.5 text-sm border-r ${isDarkMode ? 'text-slate-300 bg-slate-700 border-slate-600' : 'text-slate-600 bg-slate-50 border-slate-300'}`}>
                        {(() => {
                          const startRow = totalPurchaseRows === 0 ? 0 : ((purchasePage - 1) * rowsPerPage + 1);
                          const endRow = Math.min(purchasePage * rowsPerPage, totalPurchaseRows);
                          return (
                            <>
                              <span className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{startRow}-{endRow}</span> of {totalPurchaseRows}
                            </>
                          );
                        })()}
                      </div>

                      {/* Navigation buttons */}
                      <div className="flex items-center">
                        <button
                          type="button"
                          className={`p-2 disabled:opacity-30 disabled:cursor-not-allowed border-r ${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-600 border-slate-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-slate-300'}`}
                          disabled={purchasePage === 1}
                          onClick={() => setPurchasePage(p => Math.max(1, p - 1))}
                        >
                          <IoIosArrowBack className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className={`p-2 disabled:opacity-30 disabled:cursor-not-allowed ${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
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
                <div className={`backdrop-blur-sm rounded-2xl shadow-xl border overflow-hidden flex-1 flex flex-col ${isDarkMode ? 'bg-slate-800/90 border-slate-700/60' : 'bg-white/90 border-white/40'}`} style={{ minHeight: 0 }}>
                  {/* Header Section - Fixed, no scroll */}
                  <div className="bg-gradient-to-r from-purple-500 to-violet-600 text-white border-b border-purple-200/50" style={{ paddingRight: '12px' }}>
                    <table className="text-sm table-fixed" style={{ width: '100%' }}>
                      <colgroup>
                        <col style={{ width: '50px' }} />
                        <col style={{ width: '50px' }} />
                        <col style={{ width: '180px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '120px' }} />
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-center">#</th>
                          <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-center">ID</th>
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
                  <div className="flex-1 min-h-0 custom-scrollbar scrollbar-always overflow-y-auto">
                    <table className="text-sm table-fixed" style={{ width: '100%' }}>
                      <colgroup>
                        <col style={{ width: '50px' }} />
                        <col style={{ width: '50px' }} />
                        <col style={{ width: '180px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '80px' }} />
                        <col style={{ width: '120px' }} />
                      </colgroup>
                      <tbody className={`${isDarkMode ? 'bg-slate-800/95' : 'bg-white/95'}`}>
                        {(() => {
                          let allCompareData: CompareData[] = [];
                          if (compareData?.compare_vendors && Array.isArray(compareData.compare_vendors)) {
                            allCompareData = [...compareData.compare_vendors];
                          }
                          if (extraCompareVendors.length > 0) {
                            extraCompareVendors.forEach(v => {
                              if (!allCompareData.some(cv => cv.vendor_code === v.vendor_code)) {
                                allCompareData.push(v);
                              }
                            });
                          }
                          const sortedCompareData = allCompareData.sort((a, b) => (a.price || 0) - (b.price || 0));
                          const startIdx = (purchasePage - 1) * rowsPerPage;
                          const pagedRows = sortedCompareData.slice(startIdx, startIdx + rowsPerPage);
                          return pagedRows.length > 0 ? pagedRows.map((vendor, index) => (
                            <tr
                              key={index}
                              className={`border-b cursor-pointer transition-colors ${isDarkMode ? 'border-slate-700 hover:bg-purple-900/30' : 'border-slate-100 hover:bg-purple-50/50'}`}
                              onClick={() => handleCompareRowClick(vendor)}
                            >
                              <td className={`px-4 py-3 text-sm text-center ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{startIdx + index + 1}</td>
                              <td className={`px-4 py-3 text-sm text-center font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{vendor.vendor_code}</td>
                              <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{vendor.vendor_name}</td>
                              <td className={`px-4 py-3 text-sm text-left ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{vendor.tel}</td>
                              <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{vendor.credit_term}</td>
                              <td className={`px-4 py-3 text-sm font-bold text-right pr-5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                {vendor.price.toLocaleString()} ฿
                              </td>
                              <td className={`px-4 py-3 text-sm text-center ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{(vendor.discount ?? 0)}%</td>
                              <td className={`px-4 py-3 text-sm text-center ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                {vendor.due_date ? new Date(vendor.due_date).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                }) : '-'}
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={8} className={`px-4 py-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                ไม่มีข้อมูลผู้ขายในขณะนี้
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination controls - Outside scrollable area */}
                  <div className={`flex items-center py-2 px-4 border-t shrink-0 ${isDarkMode ? 'border-slate-700 bg-slate-800/90' : 'border-slate-200 bg-white'}`}>
                    {/* ปุ่มเพิ่ม Vendor ซ้ายสุด */}
                    <div className="w-full md:w-96 relative">
                      <div className="relative w-full">
                        {/* Dropdown ด้านบน input */}
                        {showDropdown && search && vendors.length > 0 && (
                          <div ref={dropdownRef} className={`absolute z-[9999] w-full border rounded-xl shadow-lg mb-2 max-h-56 overflow-y-auto bottom-full ${isDarkMode ? 'bg-slate-900/95 border-slate-700/50 backdrop-blur-sm' : 'bg-white border-purple-200'}`} style={{ zIndex: 9999 }}>
                            <div className="p-2">
                              <div className={`text-xs px-4 py-3 border-b rounded-t-lg ${isDarkMode ? 'text-slate-400 bg-slate-800/50 border-slate-700/50' : 'text-purple-700 border-purple-200 bg-purple-100'}`}>
                                พบ {vendors.length} รายการ
                              </div>
                              {vendors.map((vendor, idx) => (
                                <div
                                  key={vendor + '-' + idx}
                                  className={`flex items-center px-4 py-3 cursor-pointer rounded-lg transition-all duration-200 ${selectedVendors.includes(vendor) ? (isDarkMode ? 'bg-slate-700/50 border-l-4 border-purple-500 font-semibold text-purple-300' : 'bg-purple-100 border-l-4 border-purple-500 font-semibold text-purple-800') : (isDarkMode ? 'hover:bg-slate-800/50 text-slate-300' : 'hover:bg-purple-50')}`}
                                  onClick={() => {
                                    if (selectedVendors.includes(vendor)) {
                                      setSelectedVendors(selectedVendors.filter(p => p !== vendor));
                                    } else {
                                      setSelectedVendors([...selectedVendors, vendor]);
                                    }
                                  }}
                                >
                                  {selectedVendors.includes(vendor) && (
                                    <span className={`inline-block w-3 h-3 rounded-full mr-3 ${isDarkMode ? 'bg-purple-400' : 'bg-purple-500'}`} title="Selected"></span>
                                  )}
                                  <span className={`${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{vendor}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <input
                          ref={inputRef}
                          type="text"
                          placeholder="ค้นหา/เพิ่ม Vendor..."
                          className={`px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 text-sm w-full shadow-sm transition-all duration-200 pr-10 ${isDarkMode ? 'border-slate-600 focus:ring-purple-500/30 bg-slate-800/50 text-slate-200 placeholder-slate-500' : 'border-purple-300 focus:ring-purple-200 bg-white'}`}
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          onFocus={() => search && vendors.length > 0 ? setShowDropdown(true) : undefined}
                        />
                        <button
                          type="button"
                          className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-white font-bold shadow transition-all duration-150 cursor-pointer ${isDarkMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-purple-500 hover:bg-purple-600'}`}
                          style={{ zIndex: 2 }}
                          onClick={() => setShowCreateVendor(true)}
                        >
                          <TiPlus size={16} />
                          <span className="sr-only">เพิ่ม Vendor.</span>
                        </button>
                        {vendorLoading && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className={`animate-spin rounded-full h-5 w-5 border-b-2 ${isDarkMode ? 'border-purple-400' : 'border-purple-400'}`}></div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* ส่วนอื่นๆ ขวาสุด */}
                    <div className="flex items-center ml-auto">
                      {/* Dropdown เลือกจำนวนแถว */}
                      <div className="flex items-center space-x-2 text-sm text-slate-500 pr-2">
                        <select
                          value={rowsPerPage}
                          onChange={(e) => {
                            setRowsPerPage(Number(e.target.value));
                            setPurchasePage(1);
                          }}
                          className={`border rounded px-3 py-1.5 text-sm focus:outline-none shadow-sm ${isDarkMode ? 'border-slate-600 bg-slate-800 text-slate-200 focus:border-slate-500' : 'border-slate-300 bg-white text-slate-700 focus:border-slate-400'}`}
                        >
                          <option value={10}>10 per page</option>
                          <option value={25}>25 per page</option>
                          <option value={50}>50 per page</option>
                          <option value={100}>100 per page</option>
                        </select>
                      </div>
                      {/* Pagination info และปุ่มเลื่อนหน้า */}
                      <div className={`flex items-center border rounded shadow-sm overflow-hidden ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-white'}`}>
                        <div className={`px-3 py-1.5 text-sm border-r ${isDarkMode ? 'text-slate-300 bg-slate-700 border-slate-600' : 'text-slate-600 bg-slate-50 border-slate-300'}`}>
                          {(() => {
                            let allCompareData: CompareData[] = [];
                            if (compareData?.compare_vendors && Array.isArray(compareData.compare_vendors)) {
                              allCompareData = [...compareData.compare_vendors];
                            }
                            if (extraCompareVendors.length > 0) {
                              extraCompareVendors.forEach(v => {
                                if (!allCompareData.some(cv => cv.vendor_code === v.vendor_code)) {
                                  allCompareData.push(v);
                                }
                              });
                            }
                            const totalRows = allCompareData.length;
                            const startRow = totalRows === 0 ? 0 : ((purchasePage - 1) * rowsPerPage + 1);
                            const endRow = Math.min(purchasePage * rowsPerPage, totalRows);
                            return (
                              <>
                                <span className="text-purple-500 font-bold">{startRow}-{endRow}</span> of {totalRows}
                              </>
                            );
                          })()}
                        </div>
                        <div className="flex items-center">
                          <button
                            type="button"
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={purchasePage === 1}
                            onClick={() => setPurchasePage(p => Math.max(1, p - 1))}
                          >
                            <IoIosArrowBack className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className={`p-2 disabled:opacity-30 disabled:cursor-not-allowed ${isDarkMode ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
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
                <div className={`mb-6 text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  ไม่พบข้อมูลเปรียบเทียบผู้ขายสำหรับ Part No: {partNo}
                </div>
              )}
              {!loading && !error && activeTab === 'summary' && (
                <div className={`backdrop-blur-sm rounded-2xl shadow-xl border overflow-hidden flex-1 p-6 ${isDarkMode ? 'bg-slate-800/90 border-slate-700/60' : 'bg-white/90 border-white/40'}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>ผลสรุปข้อมูลที่เลือก</h3>

                  {selectedRowData ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* ข้อมูลการขอซื้อล่าสุด */}
                        <div className={`bg-gradient-to-r p-4 rounded-lg border ${isDarkMode ? 'from-emerald-900/50 to-teal-900/50 border-emerald-700/60' : 'from-emerald-50 to-teal-50 border-emerald-200/60'}`}>
                          <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>ข้อมูลการขอซื้อ</h4>
                          <div className={`space-y-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            <div><span className="font-medium">วันที่ทำ PR:</span> {prDate ? new Date(prDate).toLocaleDateString('th-TH') : (prDate ? new Date(prDate).toLocaleDateString('th-TH') : '-')}</div>
                            <div><span className="font-medium">แผนกผู้ขอ:</span> {department || '-'}</div>
                            <div><span className="font-medium">เลขที่ PR:</span> {prNumber || '-'}</div>
                            <div><span className="font-medium">จำนวนที่ขอซื้อ:</span> {qty || '-'} {unit || ''}</div>
                          </div>
                        </div>

                        {/* ข้อมูลผู้ขายที่เลือก */}
                        {selectedRowData.selectedVendor && (
                          <div className={`bg-gradient-to-r p-4 rounded-lg border ${isDarkMode ? 'from-purple-900/50 to-violet-900/50 border-purple-700/60' : 'from-purple-50 to-violet-50 border-purple-200/60'}`}>
                            <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>ข้อมูลผู้ขายที่เลือก</h4>
                            <div className={`space-y-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              <div><span className="font-medium">ชื่อผู้ขาย:</span> {selectedRowData.selectedVendor.vendor_name || '-'}</div>
                              <div><span className="font-medium">เบอร์โทร:</span> {selectedRowData.selectedVendor.tel || '-'}</div>
                              <div><span className="font-medium">เครดิต:</span> {selectedRowData.selectedVendor.credit_term || '-'}</div>
                              <div><span className="font-medium">ราคา:</span> {selectedRowData.selectedVendor.price ? `฿${selectedRowData.selectedVendor.price.toLocaleString()}` : '-'}</div>
                              <div><span className="font-medium">ส่วนลด:</span> {selectedRowData.selectedVendor.discount ? `${selectedRowData.selectedVendor.discount}%` : '0%'}</div>
                              {/* <div><span className="font-medium">วันที่ส่งมอบ:</span> {selectedRowData.selectedVendor.due_date ? new Date(selectedRowData.selectedVendor.due_date).toLocaleDateString('th-TH') : '-'}</div> */}
                            </div>
                          </div>
                        )}

                        {/* ข้อมูลสรุป */}
                        <div className={`bg-gradient-to-r p-4 rounded-lg border ${isDarkMode ? 'from-orange-900/50 to-amber-900/50 border-orange-700/60' : 'from-orange-50 to-amber-50 border-orange-200/60'}`}>
                          <h4 className={`font-semibold mb-3 ${isDarkMode ? 'text-orange-400' : 'text-orange-700'}`}>ผลสรุป</h4>
                          {compareData ? (
                            <div className={`space-y-2 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              <div>
                                <span className="font-medium">ผู้ร้องขอ:</span>
                                <span className={`ml-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{compareData.requester_name || 'ไม่ระบุ'}</span>
                              </div>

                              <div>
                                <span className="font-medium">ผู้จัดทำ:</span>
                                <span className={`ml-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{compareData.pu_responsible || 'ไม่ระบุ'}</span>
                              </div>
                            </div>
                          ) : (
                            <div className={`text-sm p-3 rounded border ${isDarkMode ? 'text-orange-400 bg-orange-900/30 border-orange-700/50' : 'text-orange-600 bg-orange-100/50 border-orange-200'}`}>
                              <div className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m-1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>ไม่มีข้อมูลรายชื่อผู้เกี่ยวข้อง</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ช่องเหตุผลการเลือก */}
                      <div className={`bg-gradient-to-br p-6 rounded-2xl border shadow-lg ${isDarkMode ? 'from-indigo-900/40 via-slate-800 to-purple-900/40 border-indigo-700/50' : 'from-indigo-50 via-white to-purple-50 border-indigo-200/50'}`}>
                        <div className="flex items-center space-x-3 mb-4">
                          <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-indigo-900/50' : 'bg-indigo-100'}`}>
                            <svg className={`w-5 h-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <h4 className={`text-lg font-bold ${isDarkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>เหตุผลในการเลือกผู้ขาย</h4>
                        </div>

                        {/* Dropdown สำหรับเลือกเหตุผล */}
                        <div className="mb-4">
                          <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
                            เลือกเหตุผลหลัก
                          </label>
                          <select
                            value={selectedReason}
                            onChange={(e) => setSelectedReason(e.target.value)}
                            className={`w-full p-4 border-2 rounded-xl focus:outline-none focus:ring-4 text-sm font-medium transition-all duration-200 appearance-none cursor-pointer ${isDarkMode ? 'border-indigo-600 bg-slate-800 text-slate-200 focus:border-indigo-400 focus:ring-indigo-900/30' : 'border-indigo-200 bg-white text-slate-700 focus:border-indigo-500 focus:ring-indigo-100'}`}
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236366f1' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                              backgroundPosition: 'right 1rem center',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: '1.5em 1.5em'
                            }}
                          >
                            <option value="">-- กรุณาเลือกเหตุผลในการเลือกผู้ขาย --</option>
                            <option value="1">1. ราคาถูก มีสินค้าส่งมอบได้เลย</option>
                            <option value="2">2. ราคาแพงกว่า แต่มีสินค้าส่งมอบและรอไม่ได้</option>
                            <option value="3">3. มีผู้ขาย / ผู้ผลิตรายเดียว</option>
                            <option value="4">4. ราคาแพงกว่า คุณภาพดีกว่า</option>
                            <option value="5">5. ราคาเท่ากัน มีเครดิตยาวกว่า</option>
                            <option value="6">6. ราคาแพงกว่า แต่ส่งให้ ไม่ต้องไปรับ</option>
                            <option value="7">7. ราคาเท่ากัน ส่งเร็วกว่า (ส่งถึงที่)</option>
                            <option value="8">8. ราคาแพงกว่า แต่เป็นชุดเดียวกัน แยกสั่งไม่ได้</option>
                            <option value="9">9. ราคาเท่ากัน แบ่งสั่ง</option>
                            <option value="10">10. ต้องการด่วน รอเทียบราคาไม่ได้</option>
                          </select>
                        </div>

                        {/* Textarea สำหรับ "อื่นๆ" */}
                        {selectedReason === "อื่นๆ" && (
                          <div className={`p-4 bg-gradient-to-r rounded-xl border ${isDarkMode ? 'from-indigo-900/40 to-purple-900/40 border-indigo-700/50' : 'from-indigo-50 to-purple-50 border-indigo-200'}`}>
                            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
                              กรุณาระบุเหตุผลเพิ่มเติม
                            </label>
                            <textarea
                              className={`w-full min-h-[100px] p-4 border-2 rounded-xl resize-none focus:outline-none focus:ring-4 text-sm transition-all duration-200 ${isDarkMode ? 'border-indigo-600 bg-slate-800 text-slate-200 focus:border-indigo-400 focus:ring-indigo-900/30' : 'border-indigo-200 bg-white text-slate-700 focus:border-indigo-500 focus:ring-indigo-100'}`}
                              placeholder="โปรดระบุเหตุผลในการเลือกผู้ขายรายนี้อย่างละเอียด..."
                              rows={4}
                            />
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className={`flex justify-end space-x-3 mt-6 pt-4 border-t ${isDarkMode ? 'border-indigo-700/50' : 'border-indigo-200'}`}>
                          <button
                            type="button"
                            className={`px-6 py-2.5 border-2 rounded-xl transition-all duration-200 text-sm font-semibold ${isDarkMode ? 'bg-slate-800 text-indigo-400 border-indigo-600 hover:bg-slate-700 hover:border-indigo-500' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300'}`}
                            onClick={() => setSelectedReason("")}
                          >
                            ล้างการเลือก
                          </button>
                          <button
                            type="button"
                            className={`px-6 py-2.5 bg-gradient-to-r text-white rounded-xl transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${isDarkMode ? 'from-indigo-700 to-purple-800 hover:from-indigo-800 hover:to-purple-900' : 'from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'}`}
                            disabled={!selectedReason}
                            onClick={() => handleSubmit()}
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
                    <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
    {/* CreateVendor Modal */}
    {showCreateVendor && (
      <CreateVendor pcl_id={compareData?.pcl_id} onCancel={() => setShowCreateVendor(false)} />
    )}
    </>
  );
};

export default PRModal;