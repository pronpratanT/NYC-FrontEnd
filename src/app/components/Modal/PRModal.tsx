'use client';

import React, { JSX } from "react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';

// theme
import "@/app/styles/react-datepicker-orange.css";

// components
import { useToken } from "../../context/TokenContext";
import { useUser } from '../../context/UserContext';
import { useTheme } from "../ThemeProvider";
import { useToast } from "../toast/Notify";

// heroui
import { Tooltip } from "@heroui/react";
import { Select, SelectSection, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";

// calendar
import '@/app/styles/react-datepicker-dark.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// modal
import ChartsModal from "./Charts";
import CreateVendor from "./CreateVendor";
import EditVendor from "./EditVendor";
import RejectCompare from "./Reject_Compare";

// icons
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { IoTrashBinOutline } from "react-icons/io5";
import { CiEdit } from "react-icons/ci";
import { FaRegCalendarAlt } from "react-icons/fa";
import { TiPlus } from "react-icons/ti";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { GoDownload } from "react-icons/go";
import { CiCircleInfo } from "react-icons/ci";
import { FaSave } from "react-icons/fa";
import { SlOptionsVertical } from "react-icons/sl";
import { LuNotebookPen } from "react-icons/lu";
import { GiCancel } from "react-icons/gi";

export type PartNo = {
  length: number;
  pcl_id: number;
  part_no: string;
  choose_vendor: number | null;
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
  choose_vendor: number | null;
  recent_purchase: RecentPurchase[];
  status: string | null;
  reason_choose: string | null;
};

type RecentPurchase = {
  vendor_id: number;
  vendor_name: string;
  price: number | null;
  price_for_approve: number | null;
  discount: number[];
  date: string;
  due_date: string;
}

type CompareData = {
  compare_id: number;
  vendor_id: number;
  vendor_name: string;
  vendor_code: string;
  email: string | null;
  tax_id: string | null;
  fax_no: string | null;
  contact_name: string;
  tel: string;
  credit_term: string;
  price: number;
  remark: string | null;
  discount: number[];
  due_date: string;
  date_shipped: string;
};

type SelectedToPOGen = {
  pr_list_id: number;
  part_no: string;
  part_name: string;
  prod_code: string;
  pcl_id: number;
  plant: string;
  vendor: string;
  due_date: string;
  date_shipped: string;
  group_id?: number;
  status?: string;
}

export type PRModalProps = {
  partNo: string;
  prNumber?: string;
  pr_id?: number;
  department?: string;
  prDate?: string;
  qty?: number;
  unit?: string;
  pr_list_id?: number;
  pu_operator_approve?: boolean;
  onClose: () => void;
  onSuccess?: () => Promise<void> | void;
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
  // address1: string;
  // address2: string;
  // city: string;
  // country: string;
  // currency_code: string;
  // zip_code: string;
}

// --- Add type for editedPrices to support rawPrice ---
type EditedPrice = {
  compare_id: number;
  price?: number;
  discounts?: number[];
  date_ship?: string | null;
  rawPrice?: string;
};

type PriceCompareHistory = {
  ID: number;
  price: number;
  content: string;
  PuOperatorID: number;
  PricecompareId: number;
  VendorId: number;
}

type FreeItemHistory = {
  free_item_id: number;
  pcl_id: number;
  part_no: string;
  prod_code: string;
  part_name: string;
  qty: number;
  remark: string;
  pr_list_id: number;
}

// Type for price history items used in compare price history logic
export interface PriceHistoryItem {
  price?: number | string;
  vendor_price?: number | string;
  value?: number | string;
  vendor_id?: string | number;
  vendorId?: string | number;
  [key: string]: unknown;
}

const PRModal: React.FC<PRModalProps> = ({ partNo, prNumber, department, prDate, qty, unit, pr_list_id, pr_id, onClose, onSuccess }) => {
  const { showToast, showPDFToast, setPDFToastSuccess, setPDFToastError } = useToast();
  // Move hoveredPoint and mouseX state to top-level
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [mouseX, setMouseX] = useState<number | null>(null);
  // Dropdown state for vendor actions
  const [isClient, setIsClient] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<Record<number, HTMLButtonElement | null>>({});
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  // Note state for vendor
  const [editingNote, setEditingNote] = useState<number | null>(null); // compare_id of vendor being edited
  const [vendorNotes, setVendorNotes] = useState<Record<number, string>>({}); // { compare_id: note_text }
  // --- State for editing qty in summary tab ---
  const [editingQty, setEditingQty] = useState(false);
  const [qtyValue, setQtyValue] = useState(() => {
    // ดึงข้อมูล qty จาก compareData ที่ตรงกับ pr_list_id หรือใช้ qty จาก props
    return qty !== undefined ? qty.toString() : '';
  });
  // console.log("PRModal rendered with props:", { partNo, prNumber, pr_list_id });

  const router = useRouter();
  // Check Role from User Context
  const { user } = useUser();
  // ดึง permissions ของ service = 2 จากโครงสร้างใหม่ user.role
  const rawRole = user?.role;
  let permissions: import("@/app/context/UserContext").Permission[] = [];
  if (Array.isArray(rawRole)) {
    permissions = rawRole.flatMap((r: import("@/app/context/UserContext").Role) => r?.permissions ?? []);
  }
  const permission = permissions.find(
    (p: import("@/app/context/UserContext").Permission) => p && Number(p.service) === 2
  );
  // ดึงสิทธิ์เฉพาะ department ตาม Department.ID ของ user
  const departmentid = permission?.departments?.find?.(
    (d: import("@/app/context/UserContext").Departments) => d && d.department === user?.Department?.ID
  );
  const roles: string[] = departmentid?.roles ?? [];
  const roleNames: string[] = departmentid?.roles_name ?? [];
  // roleID = ค่า role ที่เป็นตัวเลขมากที่สุดใน roles (เช่น ["2","4"] -> 4)
  const numericRoles = roles
    .map(r => parseInt(r, 10))
    .filter(n => !Number.isNaN(n));
  const roleID = numericRoles.length > 0
    ? Math.max(...numericRoles)
    : undefined;
  // serviceID แปลงเป็น number เช่นกัน
  const serviceID = permission
    ? (typeof permission.service === "string" ? parseInt(permission.service, 10) : permission.service)
    : undefined;
  const departmentId = user?.Department?.ID;
  console.log("User Role ID:", roleID, "Service ID:", serviceID, "Department ID:", departmentId);

  // State สำหรับรายการที่เลือกใน Approved Dropdown
  const [selectedApprovedItems, setSelectedApprovedItems] = useState<{ pr_list_id: number; part_no: string; part_name: string; prod_code: string }[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  // Charts modal visibility
  const [showChartsModal, setShowChartsModal] = useState(false);

  // Tab state
  const [activeTab, setActiveTab] = useState("purchase");

  // State สำหรับเก็บข้อมูลปัจจุบันที่กำลังแสดง (อาจต่างจาก props)
  const [currentPartNo, setCurrentPartNo] = useState(partNo);
  const [currentPrListId, setCurrentPrListId] = useState(pr_list_id);

  // State สำหรับ tab รายละเอียดการขอซื้อหลายรายการ
  const [multipleOrderDetails, setMultipleOrderDetails] = useState<Array<{
    pr_list_id: number;
    part_no: string;
    part_name: string;
    prod_code: string;
    purchaseType: 'D' | 'I' | undefined;
    group_id?: number;
    status?: string;
  }>>([]);
  // console.log("multipleOrderDetails:", multipleOrderDetails);
  const [purchaseType, setPurchaseType] = useState<'D' | 'I' | undefined>(undefined);
  const [remark, setRemark] = useState<string>("");
  const [lastDiscount, setLastDiscount] = useState<number | null>(null);
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
  // qty
  // เพิ่ม state สำหรับ qtyHistory
  type QtyHistoryItem = { qty: number };
  const [qtyHistory, setQtyHistory] = useState<QtyHistoryItem[]>([]);
  // ...existing code...
  // อัปเดต qtyValue จาก qtyHistory ล่าสุดเมื่อ qtyHistory เปลี่ยน
  useEffect(() => {
    if (Array.isArray(qtyHistory) && qtyHistory.length > 0) {
      setQtyValue(qtyHistory[qtyHistory.length - 1]?.qty?.toString() || '');
    }
  }, [qtyHistory]);

  //search vendor
  // เช็คสถานะ PR เพื่อ disabled ช่อง search และปุ่มเพิ่ม Vendor
  const prItem = compareData?.part_inventory_and_pr?.find(item => item.pr_no === prNumber && item.pr_list_id === pr_list_id);
  const isVendorInputDisabled = (() => {
    if (!prItem || !prItem.status) return false;
    const status = prItem.status.trim().toLowerCase();
    // อนุญาตให้ค้นหา/เพิ่ม vendor เฉพาะสถานะ pending, po rejected, rejected หรือยังไม่มี status
    if (status === 'pending' || status === 'po rejected' || status === 'rejected') return false;
    // อื่นๆ disabled
    return [
      'pending approval',
      'approved',
      'compared',
      'po created',
      'po approved',
      'po updated',
      'ordered'
    ].includes(status);
  })();
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState<string>("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [vendors, setVendors] = useState<string[]>([]);

  // State for selected vendor details
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedVendorDetail, setSelectedVendorDetail] = useState<VendorSelected | null>(null);
  const [isInsertingVendor, setIsInsertingVendor] = useState(false);
  // State for extra vendors in compare table
  const [extraCompareVendors, setExtraCompareVendors] = useState<CompareData[]>([]);

  //create vendor modal
  const [showCreateVendor, setShowCreateVendor] = useState(false);

  // edit vendor modal
  const [showEditVendor, setShowEditVendor] = useState(false);
  const [editVendorData, setEditVendorData] = useState<VendorSelected | null>(null);

  // selectedPartNo to open PO - Changed to array to support multiple items
  const [selectedToPO, setSelectedToPO] = useState<SelectedToPOGen[]>([]);
  // Add state for dropdown toggle
  const [showSelectedToPODropdown, setShowSelectedToPODropdown] = useState(false);

  // State for delivery date
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(null);

  // ตรวจสอบว่ามี PR ที่ตรงกับ prNumber และยังไม่มี po_no หรือไม่
  const latestNoPO = React.useMemo(() => {
    if (!compareData?.part_inventory_and_pr) return false;
    // หา PR ที่ตรงกับ prNumber และยังไม่มี po_no
    const matchingPR = compareData.part_inventory_and_pr.find(item => item.pr_no === prNumber && !item.po_no);
    return !!matchingPR;
  }, [compareData, prNumber]);


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
  const [customReason, setCustomReason] = useState<string>("");
  const [priceCompareHistory, setPriceCompareHistory] = useState<PriceCompareHistory[]>([]);
  const [freeItemHistory, setFreeItemHistory] = useState<FreeItemHistory[]>([]);
  // Track whether price history fetch finished to avoid autosave before data arrives
  const [priceHistoryLoaded, setPriceHistoryLoaded] = useState(false);

  // State to track which vendor is being edited (by vendor_code)
  // Removed: editingVendorCode (unused)

  // State to track edited prices (support price and discounts array)
  const [editedPrices, setEditedPrices] = useState<EditedPrice[]>([]);
  // Cache latest saved prices per vendor to prevent duplicate saves before history refetches
  const lastSavedPricesRef = useRef<Record<number, number>>({});

  // Set isClient to true after mount (for createPortal)
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        openDropdown !== null &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current[openDropdown] &&
        !buttonRef.current[openDropdown]!.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown]);

  // เมื่อโหลด compareData แล้ว ให้ดึงข้อมูลล่าสุดมาเก็บ
  useEffect(() => {
    if (compareData?.part_inventory_and_pr) {
      // เรียงข้อมูลตาม pr_list_id จากมากไปน้อย (รายการล่าสุดก่อน)
      const sortedItems = [...compareData.part_inventory_and_pr].sort((a, b) => b.pr_list_id - a.pr_list_id);

      // ข้อมูลล่าสุดที่ตรงกับ pr_list_id
      const currentItem = sortedItems.find(item => item.pr_list_id === pr_list_id);
      setLatestInventoryItem(currentItem || (sortedItems.length > 0 ? sortedItems[0] : null));

      // อัปเดต qtyValue จากข้อมูลที่ตรงกับ pr_list_id หรือใช้ qty จาก props
      if (currentItem && currentItem.qty !== undefined) {
        setQtyValue(currentItem.qty.toString());
      } else if (qty !== undefined) {
        setQtyValue(qty.toString());
      }

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

      // ถ้ามี po_no สำหรับ prNumber และ pr_list_id ให้แสดงผลสรุปทันที
      const prWithPO = sortedItems.find(item => item.pr_no === prNumber && item.po_no && item.pr_list_id === pr_list_id);
      if (prWithPO && compareData?.compare_vendors) {
        // Auto switch to completed summary tab
        // setActiveTab('completed-summary');
      }

      // console.log("Total items:", totalCount, "Latest item:", sortedItems[0]);

    } else {
      setLatestInventoryItem(null);
      setPreviousPurchaseHistory(null);
    }
  }, [compareData, prNumber, department, prDate, qty, unit]);

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
  // ฟังก์ชันดึงข้อมูลเปรียบเทียบราคา รองรับ parameter
  const fetchCompareData = async (fetchPartNo?: string, fetchPrListId?: number) => {
    setError("");
    setLoading(true);
    try {
      const partNoToUse = fetchPartNo ?? currentPartNo ?? partNo;
      const prListIdToUse = fetchPrListId ?? currentPrListId ?? pr_list_id;
      console.log("Fetching compare data for partNo:", partNoToUse, "pr_list_id:", prListIdToUse);
      console.log("Current states - currentPartNo:", currentPartNo, "currentPrListId:", currentPrListId);

      if (!token) throw new Error("กรุณาเข้าสู่ระบบก่อน");

      const apiUrl = `${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pc/compare/list?part_no=${partNoToUse}&pr_list_id=${prListIdToUse}`;
      console.log("API URL:", apiUrl);

      const response = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        console.error("API Error:", response.status, response.statusText);
        throw new Error(`โหลดข้อมูลเปรียบเทียบราคาไม่สำเร็จ (${response.status})`);
      }

      const data = await response.json();
      console.log("API Response:", data);

      const compareData = data?.data || data;
      console.log("Setting compareData:", {
        part_no: compareData?.part_no,
        part_inventory_count: compareData?.part_inventory_and_pr?.length || 0,
        vendors_count: compareData?.compare_vendors?.length || 0
      });

      setCompareData(compareData);

      // อัพเดท latestInventoryItem สำหรับรายการที่เลือกปัจจุบัน
      if (compareData?.part_inventory_and_pr && prListIdToUse) {
        const currentItem = compareData.part_inventory_and_pr.find((item: { pr_list_id: number; }) => item.pr_list_id === prListIdToUse);
        if (currentItem) {
          console.log("Updating latestInventoryItem:", currentItem);
          setLatestInventoryItem(currentItem);
        }
      }

      // Return ข้อมูลที่ fetch มาเพื่อให้ caller สามารถใช้ได้ทันที
      return { compareData, prListIdToUse };
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!partNo) {
      setError("ไม่พบ Part Number");
      setLoading(false);
      return;
    }
    // console.log("1.Fetching compare data for partNo:", partNo, "pr_list_id:", pr_list_id);
    fetchCompareData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partNo, pr_list_id, token]);
  const handleApprovedDropdownSelect = (item: SelectedToPOGen) => {
    if (!item.part_no || !item.pr_list_id) return;
    console.log('=== Switching to new item data ===');
    console.log('From:', { partNo: currentPartNo, pr_list_id: currentPrListId });
    console.log('To:', { part_no: item.part_no, pr_list_id: item.pr_list_id });

    // อัพเดต state ปัจจุบัน
    setCurrentPartNo(item.part_no);
    setCurrentPrListId(item.pr_list_id);

    // เปลี่ยน tab เป็น purchase เพื่อแสดงข้อมูลใหม่
    setActiveTab('purchase');

    // Reset selected row data เมื่อเปลี่ยนรายการ
    setSelectedRowData(null);

    fetchCompareData(item.part_no, item.pr_list_id);
    setShowSelectedToPODropdown(false);
  };

  // ฟังก์ชันจัดการการเลือกรายการใน multiple order tab เพื่อ fetch ข้อมูลใหม่
  const handleMultipleOrderItemSelect = async (selectedItem: { part_no: string; pr_list_id: number }) => {
    console.log('Selecting item - part_no:', selectedItem.part_no, 'pr_list_id:', selectedItem.pr_list_id);
    if (!selectedItem.part_no || !selectedItem.pr_list_id) return;

    // อัพเดต current state เพื่อให้ปุ่มเป็น Active
    setCurrentPartNo(selectedItem.part_no);
    setCurrentPrListId(selectedItem.pr_list_id);

    // Reset selected row data
    setSelectedRowData(null);

    // Fetch ข้อมูลใหม่และรับผลลัพธ์กลับมา
    const fetchResult = await fetchCompareData(selectedItem.part_no, selectedItem.pr_list_id);

    if (fetchResult) {
      const { compareData: newCompareData } = fetchResult;

      // ตรวจสอบว่ารายการที่เลือกมี PO หรือไม่จากข้อมูลใหม่
      // ใช้ selectedItem.pr_list_id โดยตรงเพื่อความแม่นยำ
      // console.log('Debug - all part_inventory_and_pr:', newCompareData?.part_inventory_and_pr?.map(item => ({
      //   pr_list_id: item.pr_list_id,
      //   part_no: item.part_no,
      //   po_no: item.po_no
      // })));

      const prItem = newCompareData?.part_inventory_and_pr?.find(
        (pr: { pr_list_id: number; }) => pr.pr_list_id === selectedItem.pr_list_id
      );

      console.log('Debug - selectedItem:', selectedItem);
      console.log('Debug - found prItem:', prItem);
      console.log('Debug - PO status:', prItem ? 'Has PO: ' + prItem.po_no : 'No PO found for this pr_list_id');

      // เลือก tab ที่เหมาะสมตามสถานะ PO
      // ตรวจสอบว่ามี PO หรือไม่ (รวมถึงค่าว่าง null, undefined, หรือ string ว่าง)
      const hasPO = prItem && prItem.po_no && typeof prItem.po_no === 'string' && prItem.po_no.trim() !== '';

      if (hasPO) {
        console.log('Item has PO (' + prItem.po_no + '), going to completed-summary tab (รายละเอียดการสั่งซื้อ)');
        setActiveTab('completed-summary');
      } else {
        console.log('Item has no PO, going to approve tab (อนุมัติ)');
        setActiveTab('completed-summary');
      }
    } else {
      // ถ้า fetch ไม่สำเร็จ ให้ไปที่ approve เป็นค่าเริ่มต้น
      console.log('Fetch failed, going to approve tab');
      setActiveTab('completed-summary');
    }
  };

  // ฟังก์ชันจัดการการคลิกแถวในตารางเปรียบเทียบราคา
  const handleCompareRowClick = (vendor: CompareData) => {
    if (!latestInventoryItem) {
      // ถ้าไม่มีข้อมูลล่าสุด แสดงว่าเป็นรายการขอซื้อใหม่
      setSelectedRowData({
        selectedVendor: vendor,
        previousPurchase: null,
        prNumber: prNumber,
        department: department,
        prDate: prDate,
        qty: qty,
        unit: unit
      } as SelectedRowData);
      setActiveTab('summary');
      return;
    }

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
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/search-vendor?keyword=${encodeURIComponent(search)}`, {
          cache: "no-store",
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });
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
  }, [search, token]);

  {/* input vendor selected to table */ }
  useEffect(() => {
    if (selectedVendors.length === 0) {
      setSelectedVendorDetail(null);
      return;
    }
    // Only fetch for the last selected vendor
    const vendorCode = selectedVendors[selectedVendors.length - 1];
    if (!vendorCode || isInsertingVendor) return;

    function formatPartForFetch(part: string) {
      const vendorCode = part.indexOf(' |');
      return vendorCode !== -1 ? part.slice(0, vendorCode) : part;
    }

    const fetchVendorDetail = async () => {
      const formattedVendorCode = formatPartForFetch(vendorCode);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/vendors?vendorCode=${encodeURIComponent(formattedVendorCode)}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });
        if (!res.ok) throw new Error('ไม่พบข้อมูล Vendor');
        const data = await res.json();
        const vendorData = Array.isArray(data) ? data[0] : (data.data ? data.data : data);
        setSelectedVendorDetail(vendorData as VendorSelected);
        if (vendorData && vendorData.vendor_code && compareData) {
          // ตรวจสอบ vendor_id ซ้ำใน compare_vendors ก่อนเพิ่ม (เฉพาะเมื่อเพิ่ม vendor ใหม่เท่านั้น)
          const vendorId = vendorData.ID;
          const exists = compareData.compare_vendors?.some(v => v.vendor_id === vendorId);
          if (exists) {
            // ไม่แสดง alert เมื่อเป็นการอัปเดตหลังจากลบ vendor
            console.warn('มี vendor อยู่ในตารางแล้ว ไม่สามารถเพิ่มซ้ำได้');
            // ลบ vendor ออกจาก selectedVendors เพื่อป้องกันการเลือกซ้ำ
            setSelectedVendors(prev => prev.filter(v => v !== vendorCode));
            return;
          }
          try {
            setIsInsertingVendor(true);
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/insert-vendor-for-compare`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ vendor_id: vendorId, pcl_id: compareData.pcl_id })
            });
            if (!response.ok) {
              const data = await response.json().catch(() => ({}));
              throw new Error(data.message || 'บันทึกข้อมูลไม่สำเร็จ');
            }
            // รีโหลดข้อมูล vendor ในตารางทันทีหลัง POST
            if (typeof fetchCompareData === 'function') {
              await fetchCompareData();
            }
            // ล้าง selectedVendors หลังจาก insert สำเร็จ
            setSelectedVendors([]);
          } catch (e) {
            console.error("Error inserting vendor for compare:", e);
            // ลบ vendor ออกจาก selectedVendors หากเกิดข้อผิดพลาด
            setSelectedVendors(prev => prev.filter(v => v !== vendorCode));
          } finally {
            setIsInsertingVendor(false);
          }
        }
      } catch {
        setSelectedVendorDetail(null);
      }
    };
    fetchVendorDetail();
  }, [selectedVendors, pr_id, prNumber, pr_list_id, fetchCompareData, token, isInsertingVendor]);

  // ANCHOR fetch approved compare data
  // Fetch approved compare data only if status is Approved
  useEffect(() => {
    const prIdValue = typeof pr_id !== 'undefined' ? pr_id : undefined;
    if (!prIdValue) return;
    // Only fetch if status is Approved for current pr_list_id
    const currentPRItem = compareData?.part_inventory_and_pr?.find(item => item.pr_no === prNumber && item.pr_list_id === pr_list_id);
    if (currentPRItem?.status === 'Approved') {
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/group?prId=${prIdValue}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch approved compare data');
          return res.json();
        })
        .then(data => {
          // console.log("Raw approved compare data:", data);
          // Handle array response from API
          if (Array.isArray(data) && data.length > 0) {
            const approvedDataArray: SelectedToPOGen[] = [];

            // Process grouped data structure
            data.forEach(group => {
              // console.log("Processing group:", group.group_name, "with", group.list?.length || 0, "items");
              // Skip "Ungrouped" entries
              if (group.group_name === "Ungrouped" || !group.list) {
                console.log("Skipping ungrouped or empty group:", group.group_name);
                return;
              }

              // Process items in group.list
              if (Array.isArray(group.list)) {
                group.list.forEach((item: { id: number; part_no: string; part_name: string; prod_code: string; pcl_id: number; plant: string; vendor: string; status: string; }) => {
                  // console.log("Processing item in group", group.id, ":", item);
                  approvedDataArray.push({
                    pr_list_id: item.id || 0, // Using member_id as pr_list_id
                    part_no: item.part_no || '',
                    part_name: item.part_name || '',
                    prod_code: item.prod_code || '',
                    pcl_id: item.pcl_id || 0,
                    plant: item.plant || '',
                    vendor: item.vendor || '',
                    due_date: '',
                    date_shipped: '',
                    group_id: group.id, // Add group ID to track which group this item belongs to
                    status: item.status || '' // Add status from API response
                  });
                });
              }
            });
            // console.log("Processed approved data array:", approvedDataArray);
            setSelectedToPO(approvedDataArray);
          } else if (data && typeof data === 'object' && !Array.isArray(data)) {
            // Handle single object response (fallback)
            const approvedData: SelectedToPOGen = {
              pr_list_id: data.pr_list_id || pr_list_id || 0,
              part_no: data.part_no || partNo || '',
              part_name: data.part_name || '',
              prod_code: data.prod_code || '',
              pcl_id: data.pcl_id || 0,
              plant: data.plant || '',
              vendor: data.vendor || '',
              due_date: data.due_date || '',
              date_shipped: data.date_shipped || '',
              group_id: data.group_id || 0, // Add group ID from data
              status: data.status || '' // Add status from data
            };
            // console.log("Processed single approved data:", approvedData);
            setSelectedToPO([approvedData]);
          } else {
            // console.warn("Invalid approved compare data structure:", data);
            setSelectedToPO([]);
          }
          setError("");
        })
        .catch(err => {
          // console.error("Error fetching approved compare data:", err);
          setError(err.message || 'เกิดข้อผิดพลาด');
        })
        .finally(() => setLoading(false));
    }
  }, [pr_id, prItem?.status, pr_list_id, partNo, token, compareData?.part_inventory_and_pr, prNumber]);

  // Handler to open EditVendor modal with vendor data
  const handleEditVendor = (vendor: VendorSelected) => {
    // console.log("Editing vendor:", vendor);
    setEditVendorData(vendor);
    setShowEditVendor(true);
  };

  const handleDeleteVendor = async (vendor: CompareData) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/remove-vendor-from-clv?clvId=${vendor.compare_id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'ลบผู้ขายไม่สำเร็จ');
      }
      // Remove from selectedVendors if present
      setSelectedVendors(prev => prev.filter(v => {
        const vendorCode = v.split(' |')[0];
        return vendorCode !== vendor.vendor_code;
      }));
      // Reload compare data after delete
      if (typeof fetchCompareData === 'function') {
        await fetchCompareData();
      }
      alert('ลบผู้ขายเรียบร้อยแล้ว');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการลบผู้ขาย');
      console.error(err);
    }
  }

  //handleSubmit REASON CHOOSE
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
    const reasonToSend = selectedReason === '11' ? customReason : selectedReason;
    // Use qtyValue (edited) if available, fallback to qty
    const payload = {
      pcl_id: compareData?.pcl_id,
      vendor_selected: selectedRowData?.selectedVendor?.vendor_id || null,
      reason_choose: reasonToSend,
      new_qty: qtyValue !== '' ? Number(qtyValue) : qty,
    };

    // สร้าง array edited_prices[] โดยรวมทุก vendor แต่ date_ship จะอยู่เฉพาะ vendor ที่เลือก
    const allVendors = compareData?.compare_vendors || [];
    const selectedVendorId = selectedRowData?.selectedVendor?.compare_id;
    const edited_prices = allVendors.map(vendor => {
      const edited = editedPrices.find(item => item.compare_id === vendor.compare_id);
      const isSelectedVendor = vendor.compare_id === selectedVendorId;
      let date_ship: string | null | undefined = null;
      // Always include existing date_ship if present
      if (edited?.date_ship !== undefined && edited?.date_ship !== null) {
        date_ship = edited.date_ship;
      } else if (vendor.due_date !== undefined && vendor.due_date !== null) {
        date_ship = vendor.due_date;
      } else {
        date_ship = null;
      }
      // If selected vendor and deliveryDate is chosen, override date_ship
      if (isSelectedVendor && deliveryDate) {
        date_ship = typeof deliveryDate === 'string' ? deliveryDate : deliveryDate?.toISOString();
      }
      return {
        clv_id: vendor.compare_id,
        price: edited?.price !== undefined && edited?.price !== null ? Number(edited.price) : (vendor.price !== undefined && vendor.price !== null ? Number(vendor.price) : 0),
        discount: edited?.discounts !== undefined && edited?.discounts !== null ? edited.discounts : (vendor.discount !== undefined && vendor.discount !== null ? vendor.discount : [0]),
        ...(date_ship ? { date_ship } : {})
      };
    });

    // ตรวจสอบราคาทุก vendor
    const missingPrice = edited_prices.some(item => !item.price || item.price === 0);
    if (missingPrice) {
      alert('กรุณากรอกราคาสินค้าทุกแถวก่อนบันทึก');
      return;
    }

    // console.log("Submitting payload:", payload);
    // console.log("Edited prices:", edited_prices);

    try {
      // PUT edited_prices to /edit-price-in-clv if there are any edited prices
      if (edited_prices.length > 0) {
        const editRes = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/edit-price-in-clv`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ edited_prices })
        });
        if (!editRes.ok) {
          const data = await editRes.json().catch(() => ({}));
          throw new Error(data.message || 'แก้ไขราคาผู้ขายไม่สำเร็จ');
        }
      }
      // PUT payload to /send-pcl-to-approve
      const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/send-pcl-to-approve`, {
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
      if (onSuccess) await onSuccess();
      router.refresh();
      if (onClose) onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล');
      console.error(err);
    }
  }

  const handleApproveSubmit = async () => {
    // console.log("Approving PCL ID:", compareData?.pcl_id);
    // console.log("User ID:", user?.ID);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/approve-pcl?id=${compareData?.pcl_id}&approvalId=${user?.ID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'บันทึกข้อมูลไม่สำเร็จ');
      }
      alert('บันทึกข้อมูลเรียบร้อยแล้ว');
      if (onSuccess) await onSuccess();
      router.refresh();
      if (onClose) onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล');
      console.error(err);
    }
  }

  const handleSubmitPOCreate = async () => {
    const poCreate = {
      material_type: purchaseType,
      remark: remark,
      ext_discount: lastDiscount,
      po_list: [
        {
          pcl_id: compareData?.pcl_id,
        }
      ]
    };
    const po_no = compareData?.part_inventory_and_pr?.find(item => item.pr_no === prNumber && item.pr_list_id === pr_list_id)?.po_no || '';
    const editPO = {
      po_no: po_no,
      material_type: purchaseType,
      remark: remark,
      ext_discount: lastDiscount,
      po_list: [
        {
          pcl_id: compareData?.pcl_id,
        }
      ]
    };
    try {
      let url = `${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/create`;
      let body = poCreate;
      if (po_no) {
        url = `${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/repeat-or-new`;
        body = editPO;
      }
      // console.log("Creating PO with data:", body, "URL:", url);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'บันทึกข้อมูลไม่สำเร็จ');
      }
      alert('บันทึกข้อมูลเรียบร้อยแล้ว');
      // รีโหลด comparePrice page
      if (onSuccess) await onSuccess();
      router.refresh();
      if (onClose) onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล');
      console.error(err);
    }
  }

  const handleSubmitPOCreateMultiplePart = async () => {
    // ดึง pcl_id และ material_type จาก multipleOrderDetails ที่ถูกเลือก
    let selectedMaterialType: 'D' | 'I' | undefined = purchaseType;
    let selectedPclIds: { pcl_id: number | undefined }[] = [];
    if (multipleOrderDetails.length > 0) {
      selectedMaterialType = multipleOrderDetails[0]?.purchaseType;
      selectedPclIds = multipleOrderDetails.map(item => {
        const found = selectedToPO.find(sel => sel.pr_list_id === item.pr_list_id);
        return { pcl_id: found?.pcl_id };
      });
    } else if (selectedToPO.length > 0) {
      // fallback: single item selected
      selectedPclIds = selectedToPO.map(sel => ({ pcl_id: sel.pcl_id }));
    }

    // ตรวจสอบว่ามี po_no หรือไม่ใน multipleOrderDetails
    const po_no = multipleOrderDetails.length > 0
      ? (() => {
        const firstItem = multipleOrderDetails[0];
        const prItem = compareData?.part_inventory_and_pr?.find(pr => pr.pr_list_id === firstItem.pr_list_id);
        return prItem?.po_no || '';
      })()
      : '';

    const poCreate = {
      material_type: selectedMaterialType,
      remark: remark,
      ext_discount: lastDiscount,
      po_list: selectedPclIds
    };

    const editPO = {
      po_no: po_no,
      remark: remark,
      ext_discount: lastDiscount,
      po_list: selectedPclIds
    };

    try {
      let url = `${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/create`;
      let body: typeof poCreate | typeof editPO = poCreate;

      if (po_no) {
        url = `${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/po/repeat-or-new`;
        body = editPO;
      }

      console.log("Creating/Editing PO with data:", body, "URL:", url);

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'บันทึกข้อมูลไม่สำเร็จ');
      }
      alert('บันทึกข้อมูลเรียบร้อยแล้ว');
      // รีโหลด comparePrice page
      if (onSuccess) await onSuccess();
      router.refresh();
      if (onClose) onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล');
      console.error(err);
    }
  }

  // Modal state for reject reason
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const handleRejectCompare = () => {
    setShowRejectModal(true);
  };

  const handleConfirmRejectCompare = async () => {
    const reasonToSend = rejectReason || "";
    // console.log("Rejecting PCL ID:", compareData?.pcl_id, "with reason:", reasonToSend);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/reject-pcl?pclId=${compareData?.pcl_id}&reason=${encodeURIComponent(reasonToSend)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'บันทึกข้อมูลไม่สำเร็จ');
      }
      alert('บันทึกข้อมูลเรียบร้อยแล้ว');
      setShowRejectModal(false);
      setRejectReason("");
      if (onSuccess) await onSuccess();
      router.refresh();
      if (onClose) onClose();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการส่งข้อมูล');
      console.error(err);
    }
  }


  // ฟังก์ชันสำหรับจัดการการเลือก checkbox ใน Approved Dropdown
  const handleApprovedCheckboxChange = (item: { pr_list_id: number; part_no: string; part_name: string; prod_code: string }, checked: boolean) => {
    setSelectedApprovedItems(prev => {
      if (checked) {
        // เพิ่มถ้ายังไม่มี
        if (!prev.some(sel => sel.pr_list_id === item.pr_list_id && sel.part_no === item.part_no && sel.part_name === item.part_name && sel.prod_code === item.prod_code)) {
          return [...prev, item];
        }
        return prev;
      } else {
        // ลบออก
        return prev.filter(sel => !(sel.pr_list_id === item.pr_list_id && sel.part_no === item.part_no));
      }
    });
  };
  // ฟังก์ชันสำหรับการกดปุ่ม "ใช้รายการที่เลือก" ใน Approved Dropdown
  const handleApprovedDropdownSelectMultiple = () => {
    if (!selectedApprovedItems || selectedApprovedItems.length === 0) return;

    // เตรียมข้อมูลสำหรับ tab หลายรายการโดยดึงข้อมูลจาก selectedToPO
    const multipleItems = selectedApprovedItems.map(item => {
      // หาข้อมูลเพิ่มเติมจาก selectedToPO
      const fullItem = selectedToPO.find(tpo =>
        tpo.pr_list_id === item.pr_list_id &&
        tpo.part_no === item.part_no
      );

      return {
        pr_list_id: item.pr_list_id,
        part_no: item.part_no,
        part_name: item.part_name,
        prod_code: item.prod_code,
        purchaseType: undefined as 'D' | 'I' | undefined,
        group_id: fullItem?.group_id,
        status: fullItem?.status
      };
    });

    setMultipleOrderDetails(multipleItems);
    setActiveTab('multiple-order');
    setShowSelectedToPODropdown(false);
  };

  // ฟังก์ชันสำหรับดึงข้อมูลแถวผู้ขายทั้งหมด (รวม extra vendors)
  const getCompareRows = () => {
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
    // เรียงราคาจากน้อยไปมาก โดยใช้ราคาจาก editedPrices ถ้ามี หรือราคาเดิม
    return allCompareData.sort((a, b) => {
      const priceA = editedPrices.find(p => p.compare_id === a.compare_id)?.price ?? a.price ?? 0;
      const priceB = editedPrices.find(p => p.compare_id === b.compare_id)?.price ?? b.price ?? 0;
      return priceA - priceB;
    });
  };

  // sort เฉพาะตอน blur input เท่านั้น (ต้องอยู่ใน map loop เพื่อรู้ vendor ที่ blur)
  const handlePriceBlur = () => {
    // sort ข้อมูลใหม่หลังจากแก้ไขเสร็จ
    if (compareData && compareData.compare_vendors) {
      compareData.compare_vendors = [...compareData.compare_vendors].sort((a, b) => (a.price || 0) - (b.price || 0));
      setCompareData({ ...compareData });
    }
    if (extraCompareVendors.length > 0) {
      setExtraCompareVendors(prev => [...prev].sort((a, b) => (a.price || 0) - (b.price || 0)));
    }
  };

  // Handle delivery date change
  const handleDeliveryDateChange = (date: Date | null) => {
    setDeliveryDate(date);
  };

  // Sort compare_vendors ascending by price ทุกครั้งที่ compareData เปลี่ยนหรือเปิด tab compare (แต่ต้องป้องกัน loop)
  useEffect(() => {
    if (activeTab === 'compare' && compareData && compareData.compare_vendors) {
      // ตรวจสอบก่อนว่าข้อมูลยังไม่ได้ sort จริง ๆ
      const sorted = [...compareData.compare_vendors].sort((a, b) => (a.price || 0) - (b.price || 0));
      const isSorted = compareData.compare_vendors.every((v, i) => v.vendor_code === sorted[i]?.vendor_code);
      if (!isSorted) {
        setCompareData({ ...compareData, compare_vendors: sorted });
      }
    }
    if (activeTab === 'compare' && extraCompareVendors.length > 0) {
      const sorted = [...extraCompareVendors].sort((a, b) => (a.price || 0) - (b.price || 0));
      const isSorted = extraCompareVendors.every((v, i) => v.vendor_code === sorted[i]?.vendor_code);
      if (!isSorted) {
        setExtraCompareVendors(sorted);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, compareData]);

  useEffect(() => {
    // console.log('prNumber:', prNumber);
    // console.log('part_inventory_and_pr:', compareData?.part_inventory_and_pr);
  }, [prNumber, compareData]);

  //TODO GET PRICE COMPARE HISTORY
  useEffect(() => {
    // Only run when tab is 'compare' and have vendors
    if (activeTab !== 'compare' || !compareData?.pcl_id || !Array.isArray(compareData?.compare_vendors) || compareData.compare_vendors.length === 0) {
      setPriceCompareHistory([]);
      setPriceHistoryLoaded(false);
      return;
    }
    let isCancelled = false;
    setPriceHistoryLoaded(false);
    const fetchAllHistories = async () => {
      try {
        const allHistories: PriceCompareHistory[] = [];
        for (const vendor of compareData.compare_vendors) {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pc/price-histories?pricecompareId=${compareData.pcl_id}&vendorId=${vendor.vendor_id}`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            if (!res.ok) {
              console.error('Failed to fetch for vendor', vendor.vendor_id, res.status, res.statusText);
              continue;
            }
            const data = await res.json();
            // API returns array of history items, tag each with vendor_id
            if (Array.isArray(data)) {
              data.forEach((item: PriceCompareHistory) => {
                allHistories.push({ ...item, VendorId: vendor.vendor_id });
              });
            }
          } catch (err) {
            console.error('Error fetching for vendor', vendor.vendor_id, err);
          }
        }
        if (!isCancelled) {
          setPriceCompareHistory(allHistories);
          setPriceHistoryLoaded(true);
        }
        console.log('Fetched priceCompareHistory:', allHistories);
      } catch (err) {
        console.error('Error fetching price compare history:', err);
        if (!isCancelled) {
          setPriceCompareHistory([]);
          setPriceHistoryLoaded(true);
        }
      }
    };
    fetchAllHistories();
    return () => { isCancelled = true; };
  }, [activeTab, compareData?.pcl_id, compareData?.compare_vendors, token]);

  // Log priceCompareHistory whenever it changes
  useEffect(() => {
    console.log('priceCompareHistory state changed:', priceCompareHistory);
  }, [priceCompareHistory]);

  //TODO Save compare price for ALL vendors in the table
  // Helper: get latest saved price for a vendor from priceCompareHistory
  const getLatestVendorPrice = (vendorId: number) => {
    const histories = Array.isArray(priceCompareHistory)
      ? priceCompareHistory.filter((h: PriceCompareHistory) =>
        (h.VendorId === vendorId)
      )
      : [];
    const pendingLatest = lastSavedPricesRef.current[vendorId];
    let latestFromHistory: number | null = null;

    if (histories.length > 0) {
      // Sort by ID descending to get the most recent
      const sorted = [...histories].sort((a, b) => {
        if (a.ID && b.ID) return b.ID - a.ID;
        return 0;
      });

      const latest = sorted[0] as PriceCompareHistory;
      const latestPrice = latest.price;
      const num = Number(latestPrice);
      latestFromHistory = isNaN(num) ? null : num;
    }

    const finalLatest = pendingLatest !== undefined ? pendingLatest : latestFromHistory;
    console.log('\u000f09 getLatestVendorPrice for vendor', vendorId, ': histories =', histories, 'pendingLatest =', pendingLatest, 'finalLatest =', finalLatest);
    return finalLatest ?? null;
  };
  // Auto save compare prices when in 'compare' tab, no negotiation history, and all vendors have price
  const autoSaveRef = useRef(false);
  useEffect(() => {
    if (activeTab === 'compare' && compareData && priceHistoryLoaded) {
      // If any history exists for any vendor, do NOT autosave
      const hasAnyHistory = Array.isArray(priceCompareHistory) && priceCompareHistory.length > 0;
      const hasAtLeastOneValidPrice = Array.isArray(compareData.compare_vendors) && compareData.compare_vendors.length > 0 && compareData.compare_vendors.some(v => v.price !== undefined && v.price !== null && !isNaN(Number(v.price)) && Number(v.price) > 0);
      if (!hasAnyHistory && hasAtLeastOneValidPrice && !autoSaveRef.current) {
        autoSaveRef.current = true;
        saveValidComparePrices().finally(() => {
          setTimeout(() => { autoSaveRef.current = false; }, 1000);
        });
      }
    } else {
      autoSaveRef.current = false;
    }
  }, [activeTab, compareData, priceHistoryLoaded, priceCompareHistory]);

  // Button handler to save all compare prices
  const saveAllComparePrices = async () => {
    if (isSaving) {
      alert('ระบบกำลังบันทึกราคาสินค้าอยู่ กรุณารอสักครู่');
      return;
    }
    if (!compareData || !Array.isArray(compareData.compare_vendors) || compareData.compare_vendors.length === 0) {
      alert('ไม่พบรายการผู้ขายสำหรับบันทึก');
      return;
    }
    // Build payloads from editedPrices fallback to vendor.price
    let payloads = compareData.compare_vendors.map(vendor => {
      const edited = editedPrices.find(p => p.compare_id === vendor.compare_id);
      return {
        price: edited?.price ?? vendor.price ?? '',
        // content: '',
        pricecompare_id: compareData?.pcl_id,
        vendor_id: vendor.vendor_id,
      };
    });

    // Validate: ensure no empty/zero price
    const hasMissing = payloads.some(p => p.price == null || Number(p.price) === 0);
    if (hasMissing) {
      alert('กรุณากรอกราคาให้ครบทุกรายการก่อนบันทึก');
      return;
    }

    // Skip vendors where new price equals latest saved price
    payloads = payloads.filter(p => {
      const latest = getLatestVendorPrice(p.vendor_id as number);
      const nextPrice = Number(p.price);
      const shouldSave = latest === null || latest !== nextPrice;
      console.log('🔄 Vendor', p.vendor_id, '- Latest:', latest, 'Next:', nextPrice, 'Should save:', shouldSave);
      return shouldSave;
    });
    if (payloads.length === 0) {
      alert('ราคาที่จะบันทึกตรงกับราคาล่าสุดทั้งหมด จึงไม่บันทึกซ้ำ');
      return;
    }
    console.log('✅ Filtered payloads to save:', payloads);
    console.log('Saving compare prices payloads:', payloads);
    setIsSaving(true);
    try {
      // Loop and send each payload separately
      for (const payload of payloads) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pc/price-history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          const numericPrice = Number(payload.price);
          if (!isNaN(numericPrice) && payload.vendor_id != null) {
            lastSavedPricesRef.current[payload.vendor_id as number] = numericPrice;
          }
        } catch (err) {
          console.error('Error saving compare price:', err);
          alert('เกิดข้อผิดพลาดในการบันทึกราคาสินค้า');
          return;
        }
      }
      alert('บันทึกราคาสินค้าทุกรายการเรียบร้อยแล้ว');
      // Reload compare list and price histories so charts and remarks reflect latest
      if (typeof fetchCompareData === 'function') {
        await fetchCompareData();
      }
      // Re-fetch price histories used by chart tooltips
      try {
        // reuse the same logic as in useEffect; wrap in local function if needed
        // Only run when have vendors and pcl_id
        if (compareData?.pcl_id && Array.isArray(compareData?.compare_vendors) && compareData.compare_vendors.length > 0) {
          const allHistories: PriceCompareHistory[] = [];
          for (const vendor of compareData.compare_vendors) {
            try {
              const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pc/price-histories?pricecompareId=${compareData.pcl_id}&vendorId=${vendor.vendor_id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (!res.ok) continue;
              const data = await res.json();
              if (Array.isArray(data)) {
                data.forEach((item: PriceCompareHistory) => {
                  allHistories.push({ ...item, VendorId: vendor.vendor_id });
                });
              }
            } catch (err) {
              console.error('Error refetching history for vendor', vendor.vendor_id, err);
            }
          }
          setPriceCompareHistory(allHistories);
        }
      } catch (err) {
        console.error('Error reloading price histories:', err);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Save compare prices for vendors with valid price only (skip missing/zero). Used by autosave.
  const saveValidComparePrices = async () => {
    if (isSaving) {
      // ถ้ากำลังบันทึกอยู่แล้ว (จากปุ่มกด) ให้ข้าม autosave รอบนี้
      return;
    }
    if (!compareData || !Array.isArray(compareData.compare_vendors) || compareData.compare_vendors.length === 0) {
      return;
    }
    let payloads = compareData.compare_vendors
      .map(vendor => {
        const edited = editedPrices.find(p => p.compare_id === vendor.compare_id);
        const priceValue = edited?.price ?? vendor.price ?? '';
        return {
          price: priceValue,
          pricecompare_id: compareData?.pcl_id,
          vendor_id: vendor.vendor_id,
        };
      })
      .filter(p => p.price != null && !isNaN(Number(p.price)) && Number(p.price) > 0);

    // Skip vendors where new price equals latest saved price
    payloads = payloads.filter(p => {
      const latest = getLatestVendorPrice(p.vendor_id as number);
      const nextPrice = Number(p.price);
      return latest === null || latest !== nextPrice;
    });

    if (payloads.length === 0) {
      return;
    }

    setIsSaving(true);
    try {
      for (const payload of payloads) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pc/price-history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
          const numericPrice = Number(payload.price);
          if (!isNaN(numericPrice) && payload.vendor_id != null) {
            lastSavedPricesRef.current[payload.vendor_id as number] = numericPrice;
          }
        } catch (err) {
          console.error('Error autosaving compare price:', err);
          // For autosave, skip alert; continue with remaining vendors
        }
      }

      // Refresh compare data and histories to reflect saved entries
      if (typeof fetchCompareData === 'function') {
        await fetchCompareData();
      }
      try {
        if (compareData?.pcl_id && Array.isArray(compareData?.compare_vendors) && compareData.compare_vendors.length > 0) {
          const allHistories: PriceCompareHistory[] = [];
          for (const vendor of compareData.compare_vendors) {
            try {
              const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pc/price-histories?pricecompareId=${compareData.pcl_id}&vendorId=${vendor.vendor_id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (!res.ok) continue;
              const data = await res.json();
              if (Array.isArray(data)) {
                data.forEach((item: PriceCompareHistory) => {
                  allHistories.push({ ...item, VendorId: vendor.vendor_id });
                });
              }
            } catch (err) {
              console.error('Error refetching history for vendor', vendor.vendor_id, err);
            }
          }
          setPriceCompareHistory(allHistories);
        }
      } catch (err) {
        console.error('Error reloading price histories (autosave):', err);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // TODO Get free item history
  useEffect(() => {
    const fetchFreeItemHistory = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pc/free-items/recent?part_no=${partNo}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch free item history');
        const data = await res.json();
        setFreeItemHistory(data);
        // console.log('🎁 Fetched Free Item History:', data);
        // console.log('🎁 for partNo:', partNo);
        // console.log('🎁 free items:', freeItemHistory);
      } catch (err) {
        console.error('Error fetching free item history:', err);
        setFreeItemHistory([]);
      }
    };
    fetchFreeItemHistory();
  }, [token, partNo]);

  // TODO New QTY
  const getQTYHistory = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pc/qty-history/detail?pricecompareId=${compareData?.pcl_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch qty history');
      const data = await res.json();
      setQtyHistory(data);
      console.log('Fetched QTY History:', data);
    } catch (err) {
      console.error('Error fetching qty history:', err);
      setQtyHistory([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'compare' && compareData?.pcl_id) {
      getQTYHistory();
    } else {
      setQtyHistory([]);
    }
  }, [activeTab, compareData?.pcl_id]);

  const handleQtyChange = async () => {
    const confirmSave = window.confirm('คุณต้องการบันทึกจำนวนสินค้าใช่หรือไม่?');
    if (!confirmSave) return;

    const payload = {
      qty: qtyValue !== '' ? Number(qtyValue) : qty,
      pricecompare_id: compareData?.pcl_id || null,
    }
    console.log('Saving qty history payload:', payload);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pc/qty-hist`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      alert('แก้ไขจำนวนสินค้าเรียบร้อยแล้ว');
      setEditingQty(false);
    } catch (err) {
      console.error('Error saving qty history:', err);
    }
  }

  // TODO Save Compare Note
  const saveCompareNote = async (note: string, compare_id?: number) => {
    const payload = {
      save_comparisons_vendors: [
        {
          clv_id: compare_id,
          content: note,
        }
      ]
    }
    // console.log('compare note payload:', payload);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/update-content`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      alert('บันทึกหมายเหตุเรียบร้อยแล้ว');
      setEditingNote(null);
      // Reload compare data to get updated remarks
      if (typeof fetchCompareData === 'function') {
        await fetchCompareData();
      }
    } catch (err) {
      console.error('Error saving compare note:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกหมายเหตุ');
    }
  }

  // TODO: PDF
  // Preview PDF: ใช้ Authorization header (Bearer token) เพื่อไม่ให้ token อยู่ใน URL
  // หมายเหตุ: GET ไม่สามารถส่ง body ที่ browser ยอมรับได้ ดังนั้นใช้ header แทน
  const previewComparePdf = async () => {
    // console.log('Generating preview PDF for partNo:', partNo, 'pr_list_id:', pr_list_id);
    if (!token) {
      alert('ไม่พบ token กรุณาเข้าสู่ระบบใหม่');
      return;
    }
    // แสดง toast โหลด PDF (ไอคอน IoReloadOutline หมุน)
    const toastId = showPDFToast(
      `Preview PDF ${partNo}`,
      `กำลังสร้างตัวอย่างไฟล์ PDF เปรียบเทียบ รายการ ${partNo} กรุณารอสักครู่...`,
      true // loading = true
    );
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PDF_SERVICE}/preview_compare/${partNo}/${pr_list_id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener');
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      // เปลี่ยน toast เดิมให้เป็นสถานะสำเร็จ (PiCheckCircleBold)
      setPDFToastSuccess(
        toastId,
        `เปิดตัวอย่างไฟล์ PDF เปรียบเทียบ รายการ ${partNo} สำเร็จแล้ว`
      );
    } catch (err) {
      console.error('previewComparePdf error:', err);
      setPDFToastError(
        toastId,
        `ไม่สามารถเปิดตัวอย่างไฟล์ PDF เปรียบเทียบ รายการ ${partNo} ได้ กรุณาลองใหม่อีกครั้ง`
      );
    }
  }

  // Download PDF: ใช้ Authorization header + Blob เพื่อไม่ให้ token อยู่ใน URL
  const downloadComparePdf = async () => {
    if (!token) {
      alert('ไม่พบ token กรุณาเข้าสู่ระบบใหม่');
      return;
    }
    // แสดง toast โหลด PDF (ไอคอน IoReloadOutline หมุน)
    const toastId = showPDFToast(
      `Preview PDF ${partNo}`,
      `กำลังสร้างตัวอย่างไฟล์ PDF เปรียบเทียบ รายการ ${partNo} กรุณารอสักครู่...`,
      true // loading = true
    );
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PDF_SERVICE}/generate_compare/${partNo}/${pr_list_id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        if (res.status === 401) alert('Token หมดอายุ กรุณาเข้าสู่ระบบใหม่');
        throw new Error(`HTTP ${res.status}`);
      }
      const blob = await res.blob();
      // สร้างลิงก์ดาวน์โหลดชั่วคราว
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Compare_${partNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      // เปลี่ยน toast เดิมให้เป็นสถานะสำเร็จ (PiCheckCircleBold)
      setPDFToastSuccess(
        toastId,
        `เปิดตัวอย่างไฟล์ PDF เปรียบเทียบ รายการ ${partNo} สำเร็จแล้ว`
      );
    } catch (err) {
      console.error('downloadComparePdf error:', err);
      setPDFToastError(
        toastId,
        `ไม่สามารถเปิดตัวอย่างไฟล์ PDF เปรียบเทียบ รายการ ${partNo} ได้ กรุณาลองใหม่อีกครั้ง`
      );
    }
  }

  // ตัดข้อความส่วนที่อยู่หลังตัวอักษรภาษาไทยตัวสุดท้าย
  // แต่ถ้าข้อความนั้นไม่มีภาษาไทยเลย จะคืนค่าเดิม (เช่น เป็นอังกฤษล้วน)
  function removeEnglishUnlessNoThai(text: string): string {
    if (!text) return text;
    const hasThai = /[\u0E00-\u0E7F]/.test(text);
    if (!hasThai) return text;

    let lastThaiIndex = -1;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (/[\u0E00-\u0E7F]/.test(ch)) {
        lastThaiIndex = i;
      }
    }

    if (lastThaiIndex === -1) return text;
    return text.slice(0, lastThaiIndex + 1).trim();
  }

  const reasonOptions = [
    { key: "1", label: "1. ราคาถูก มีสินค้าส่งมอบได้เลย" },
    { key: "2", label: "2. ราคาแพงกว่า แต่มีสินค้าส่งมอบและรอไม่ได้" },
    { key: "3", label: "3. มีผู้ขาย / ผู้ผลิตรายเดียว" },
    { key: "4", label: "4. ราคาแพงกว่า คุณภาพดีกว่า" },
    { key: "5", label: "5. ราคาเท่ากัน มีเครดิตยาวกว่า" },
    { key: "6", label: "6. ราคาแพงกว่า แต่ส่งให้ ไม่ต้องไปรับ" },
    { key: "7", label: "7. ราคาเท่ากัน ส่งเร็วกว่า (ส่งถึงที่)" },
    { key: "8", label: "8. ราคาแพงกว่า แต่เป็นชุดเดียวกัน แยกสั่งไม่ได้" },
    { key: "9", label: "9. ราคาเท่ากัน แบ่งสั่ง" },
    { key: "10", label: "10. ต้องการด่วน รอเทียบราคาไม่ได้" },
    { key: "11", label: "11. อื่นๆ" }
  ];

  const rowsPerPageOptions = [
    { key: "10", label: "10 per page" },
    { key: "25", label: "25 per page" },
    { key: "50", label: "50 per page" }
  ];

  return (
    <>
      <style jsx global>{`
        .smooth-scroll {
          scroll-behavior: smooth !important;
          -webkit-overflow-scrolling: touch;
          overscroll-behavior: contain;
          will-change: scroll-position;
        }
                  
        .smooth-scroll > * {
          transition: transform 0.1s ease-out;
        }
                  
        .custom-scrollbar-dark::-webkit-scrollbar {
          width: 10px;
          height: 12px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-track {
          background: #1e293b;
          border-radius: 10px;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 10px;
          border: 2px solid #1e293b;
          transition: background 0.15s ease;
        }
        .custom-scrollbar-dark::-webkit-scrollbar-thumb:hover {
          background: #64748b;
          border: 2px solid #334155;
        }
                  
        .custom-scrollbar-light::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        .custom-scrollbar-light::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        .custom-scrollbar-light::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
          border: 2px solid #f1f5f9;
          transition: background 0.15s ease;
        }
        .custom-scrollbar-light::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
          border: 2px solid #e2e8f0;
        }

        /* Firefox scrollbar support */
        .custom-scrollbar-dark {
          scrollbar-width: thin;
          scrollbar-color: #475569 #1e293b;
        }
        
        .custom-scrollbar-light {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }
      `}</style>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-900/60 via-gray-900/40 to-slate-800/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className={`backdrop-blur-md rounded-tl-3xl rounded-bl-3xl rounded-tr-md rounded-br-md shadow-2xl border p-0 max-w-7xl w-full mx-4 overflow-hidden smooth-scroll ${isDarkMode ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'} ${isDarkMode ? 'bg-slate-900/95 border-slate-700/60' : 'bg-white/95 border-white/20'}`}
          // style={{ maxHeight: '90vh', height: '90vh' }}
          style={{ maxHeight: '90vh', height: 'auto', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Modal header */}
          <div className={`bg-gradient-to-r border-b ${isDarkMode ? 'from-slate-800/80 to-slate-900/80 border-slate-700' : 'from-slate-50 to-blue-50 border-slate-200'}`}>
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  {/* Simple title */}
                  <div className="flex items-center space-x-3 mb-3">
                    <button
                      type="button"
                      onClick={() => setShowChartsModal(true)}
                      className={`p-2 rounded-lg cursor-pointer transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${isDarkMode ? 'bg-blue-900/40 focus:ring-blue-700 focus:ring-offset-slate-800' : 'bg-blue-100 focus:ring-blue-300 focus:ring-offset-white'} hover:scale-120`}
                      aria-label="ดูกราฟเปรียบเทียบราคา"
                    >
                      <svg className={`w-5 h-5 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </button>
                    <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                      เปรียบเทียบราคาสินค้า
                    </h2>
                    {/* Info Cards */}
                    <div className="flex-1 flex justify-end items-start space-x-3">
                      {/* ANCHOR Create multiple PO */}
                      {selectedToPO && selectedToPO.length > 0 && (
                        <div className="relative">
                          {(() => {
                            // กรองเฉพาะรายการที่ group_id ตรงกันและ status = 'Approved'
                            // หา reference จากรายการที่ตรงกับ currentPartNo และ currentPrListId
                            // ANCHOR filtered OPEN multiple PO
                            const refItem = selectedToPO.find(item => item.part_no === currentPartNo && item.pr_list_id === currentPrListId);
                            const filteredToPO = refItem && refItem.group_id
                              ? selectedToPO.filter(item =>
                                item.group_id === refItem.group_id &&
                                item.status === 'Approved'
                              )
                              : [];
                            if (filteredToPO.length <= 1) return null;
                            return (
                              <>
                                <button
                                  type="button"
                                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-sm border transition-all duration-200 ${isDarkMode
                                    ? 'bg-gradient-to-r from-green-900/80 to-emerald-900/80 text-green-200 border-green-700/60 hover:from-green-800/90 hover:to-emerald-800/90 hover:shadow-lg'
                                    : 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 hover:from-green-100 hover:to-emerald-100 hover:shadow-md'
                                    }`}
                                  onClick={() => setShowSelectedToPODropdown(prev => !prev)}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span>Approved Data ({filteredToPO.length})</span>
                                  <svg className={`w-4 h-4 transition-transform duration-200 ${showSelectedToPODropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>

                                {showSelectedToPODropdown && (
                                  <div className={`absolute right-0 z-50 mt-2 w-[23rem] rounded-xl shadow-xl border backdrop-blur-sm max-h-[32rem] overflow-y-auto smooth-scroll ${isDarkMode
                                    ? 'custom-scrollbar-dark bg-slate-900/95 border-slate-700/60 text-slate-100'
                                    : 'custom-scrollbar-light bg-white/95 border-slate-200/60 text-slate-800'
                                    }`}>
                                    <div className="p-4">
                                      <div className="flex items-center space-x-2 mb-3">
                                        <div className="flex items-center justify-between w-full">
                                          <div className="flex items-center space-x-2">
                                            <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-green-900/50' : 'bg-green-100'}`}>
                                              <svg className={`w-4 h-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                              </svg>
                                            </div>
                                            <h4 className={`font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>รายการออก PO</h4>
                                          </div>
                                          <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-green-900/40 text-green-300' : 'bg-green-100 text-green-600'}`}>
                                            {filteredToPO.length} รายการ
                                          </span>
                                        </div>
                                      </div>

                                      <div className={`space-y-3 max-h-72 overflow-y-auto smooth-scroll ${isDarkMode ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'}`}>
                                        <button
                                          type="button"
                                          className={`w-full mb-2 py-2 rounded-lg font-semibold text-sm border transition-all duration-200 flex items-center justify-center space-x-2 ${isDarkMode
                                            ? 'bg-gradient-to-r from-emerald-900/80 to-green-900/80 text-green-200 border-green-700/60 hover:from-emerald-800/90 hover:to-green-800/90 hover:shadow-lg'
                                            : 'bg-gradient-to-r from-emerald-50 to-green-50 text-green-700 border-green-200 hover:from-emerald-100 hover:to-green-100 hover:shadow-md'
                                            }`}
                                          onClick={() => {
                                            filteredToPO.forEach(item => {
                                              if (!selectedApprovedItems?.some(sel => sel.pr_list_id === item.pr_list_id && sel.part_no === item.part_no && sel.part_name === item.part_name && sel.prod_code === item.prod_code)) {
                                                handleApprovedCheckboxChange(item, true);
                                              }
                                            });
                                          }}
                                        >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                          </svg>
                                          <span>เลือกทั้งหมด ({filteredToPO.length})</span>
                                        </button>
                                        {filteredToPO.map((item, index) => (
                                          <div
                                            key={`${item.pr_list_id}-${index}`}
                                            className={`flex items-center w-full p-3 rounded-lg border transition hover:bg-green-100 dark:hover:bg-green-900/30 ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}
                                          >
                                            <input
                                              type="checkbox"
                                              className="form-checkbox h-5 w-5 text-emerald-600 rounded focus:ring-emerald-500 mr-3"
                                              checked={selectedApprovedItems?.some(sel => sel.pr_list_id === item.pr_list_id && sel.part_no === item.part_no)}
                                              onChange={e => handleApprovedCheckboxChange(item, e.target.checked)}
                                              disabled={!item.part_no || !item.pr_list_id}
                                            />
                                            <div
                                              className="flex-1 cursor-pointer"
                                              onClick={() => handleApprovedDropdownSelect(item)}
                                              role="button"
                                              tabIndex={0}
                                              onKeyPress={e => { if (e.key === 'Enter') handleApprovedDropdownSelect(item); }}
                                            >
                                              <div className="text-sm">
                                                <div className="flex justify-between items-center mb-1">
                                                  <span className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{item.part_no || '-'}</span>
                                                  <span className={`font-semi ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{item.date_shipped ? new Date(item.date_shipped).toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</span>
                                                </div>
                                                {/* <div className="mb-1">
                                                  <span className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{item.part_no || '-'}</span>
                                                </div> */}
                                                <div className="mb-1">
                                                  <span className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{item.prod_code || '-'}</span>
                                                </div>
                                                <div>
                                                  <span
                                                    className={`font-semi ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'} inline-block max-w-[160px] overflow-hidden text-ellipsis whitespace-nowrap align-middle`}
                                                    title={item.part_name || '-'}
                                                  >
                                                    {item.part_name || '-'}
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                      {selectedApprovedItems && selectedApprovedItems.length > 0 && (
                                        <div className="mt-4 flex justify-end">
                                          <button
                                            type="button"
                                            className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg font-semibold shadow-lg transition-all duration-200 border text-sm focus:outline-none focus:ring-2 cursor-pointer ${isDarkMode ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-500 hover:from-emerald-700 hover:to-teal-700 hover:shadow-xl focus:ring-emerald-600' : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-emerald-400 hover:from-emerald-600 hover:to-teal-600 hover:shadow-xl focus:ring-emerald-400'}`}
                                            onClick={handleApprovedDropdownSelectMultiple}
                                          >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <span>ออก PO {selectedApprovedItems.length} รายการ</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Clean Product Info Cards */}
                  <div className="flex flex-wrap gap-3">
                    {prNumber && (
                      <div className={`rounded-lg px-4 py-2 border shadow-sm ${isDarkMode ? 'bg-slate-800/60 border-purple-700/50' : 'bg-white border-purple-200'}`}>
                        <div className="flex items-center space-x-2">
                          <div className={`p-1 rounded ${isDarkMode ? 'bg-purple-900/40' : 'bg-purple-50'}`}>
                            <svg className={`w-3 h-3 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div>
                            <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>PR เลขที่</span>
                            <div className={`font-semibold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{prNumber}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {compareData?.part_inventory_and_pr?.[0]?.prod_code &&
                      compareData.part_inventory_and_pr.every(item => item.prod_code === compareData.part_inventory_and_pr[0].prod_code) && (
                        <div className={`rounded-lg px-4 py-2 border shadow-sm ${isDarkMode ? 'bg-slate-800/60 border-blue-700' : 'bg-white border-blue-200'}`}>
                          <div className="flex items-center space-x-2">
                            <div className={`p-1 rounded ${isDarkMode ? 'bg-blue-900/40' : 'bg-blue-50'}`}>
                              <svg className={`w-3 h-3 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                              </svg>
                            </div>
                            <div>
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>Part No</span>
                              <div className={`font-semibold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{currentPartNo}</div>
                            </div>
                          </div>
                        </div>
                      )}

                    {(() => {
                      const prItem = compareData?.part_inventory_and_pr?.find(item => item.pr_list_id === currentPrListId);
                      if (!prItem) return null;
                      return (
                        <>
                          {prItem.prod_code && (
                            <div className={`rounded-lg px-4 py-2 border shadow-sm ${isDarkMode ? 'bg-slate-800/60 border-emerald-700/50' : 'bg-white border-emerald-200'}`}>
                              <div className="flex items-center space-x-2">
                                <div className={`p-1 rounded ${isDarkMode ? 'bg-emerald-900/40' : 'bg-emerald-50'}`}>
                                  <svg className={`w-3 h-3 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                  </svg>
                                </div>
                                <div>
                                  <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>รหัสสินค้า</span>
                                  <div className={`font-semibold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{prItem.prod_code}</div>
                                </div>
                              </div>
                            </div>
                          )}
                          {prItem.prod_detail && (
                            <div className={`rounded-lg px-4 py-2 border shadow-sm max-w-sm ${isDarkMode ? 'bg-slate-800/60 border-amber-700/50' : 'bg-white border-amber-200'}`}>
                              <div className="flex items-center space-x-2">
                                <div className={`p-1 rounded ${isDarkMode ? 'bg-amber-900/40' : 'bg-amber-50'}`}>
                                  <svg className={`w-3 h-3 ${isDarkMode ? 'text-amber-300' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m-1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-500'}`}>รายละเอียด</span>
                                  <div className={`font-semibold text-sm truncate ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{prItem.prod_detail}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className={`bg-gradient-to-r px-8 py-2 border-b ${isDarkMode ? 'from-slate-800/60 via-slate-900/60 to-slate-800/60 border-slate-700/60' : 'from-slate-50 via-white to-slate-50 border-slate-200/60'}`}>
            <nav className="flex justify-between items-center">
              <div className="flex space-x-1">
                <button type="button" onClick={() => setActiveTab('purchase')}
                  className={`px-6 py-3 cursor-pointer rounded-xl text-sm font-semibold transition-all duration-300 relative ${activeTab === 'purchase'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200/50 transform scale-105'
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
                  className={`px-6 py-3 cursor-pointer rounded-xl text-sm font-semibold transition-all duration-300 relative ${activeTab === 'compare'
                    ? 'bg-gradient-to-r from-purple-500 to-violet-600 text-white shadow-md shadow-purple-200/50 transform scale-105'
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

                {/* Tab รายละเอียดการขอซื้อหลายรายการ */}
                {multipleOrderDetails.length > 0 && (
                  <button type="button" onClick={() => setActiveTab('multiple-order')}
                    className={`px-6 py-3 cursor-pointer rounded-xl text-sm font-semibold transition-all duration-300 relative ${activeTab === 'multiple-order'
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md shadow-orange-200/50 transform scale-105'
                      : isDarkMode
                        ? 'text-slate-300 hover:text-orange-400 hover:bg-orange-900/30 hover:shadow-md'
                        : 'text-slate-600 hover:text-orange-700 hover:bg-orange-50/80 hover:shadow-md'
                      }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-current opacity-75"></span>
                      <span>รายละเอียดการขอซื้อหลายรายการ ({multipleOrderDetails.length})</span>
                    </div>
                  </button>
                )}

                {/* TODO - implement tab logic by status */}
                {(() => {
                  const prItem = compareData?.part_inventory_and_pr?.find(item => item.pr_list_id === currentPrListId);
                  // console.log("Current PR Item for tab logic:", prItem?.status);
                  if (!prItem) {
                    // ถ้าไม่พบ PR ให้แสดง summary เฉพาะเมื่อข้อมูลโหลดเสร็จ
                    if (loading || error || !compareData) return null;
                    return (
                      <button type="button" onClick={() => setActiveTab('summary')}
                        className={`px-6 py-3 cursor-pointer rounded-xl text-sm font-semibold transition-all duration-300 relative ${activeTab === 'summary'
                          ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-200/50 transform scale-105'
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
                    );
                  }
                  switch (prItem.status) {
                    case 'Pending Approval':
                      return (
                        <button type="button" onClick={() => setActiveTab('approve')}
                          className={`px-6 py-3 cursor-pointer rounded-xl text-sm font-semibold transition-all duration-300 relative ${activeTab === 'approve'
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white shadow-md shadow-yellow-200/50 transform scale-105'
                            : isDarkMode
                              ? 'text-slate-300 hover:text-yellow-400 hover:bg-yellow-900/30 hover:shadow-md'
                              : 'text-slate-600 hover:text-yellow-700 hover:bg-yellow-50/80 hover:shadow-md'
                            }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-current opacity-75"></span>
                            <span>อนุมัติ</span>
                          </div>
                        </button>
                      );
                    case 'Approved':
                      return (
                        <button type="button" onClick={() => setActiveTab('completed-summary')}
                          className={`px-6 py-3 cursor-pointer rounded-xl text-sm font-semibold transition-all duration-300 relative ${activeTab === 'completed-summary'
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200/50 transform scale-105'
                            : isDarkMode
                              ? 'text-slate-300 hover:text-blue-400 hover:bg-blue-900/30 hover:shadow-md'
                              : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/80 hover:shadow-md'
                            }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-current opacity-75"></span>
                            <span>รายละเอียดการสั่งซื้อ</span>
                          </div>
                        </button>
                      );
                    case 'Po Created':
                      return (
                        <button type="button" onClick={() => setActiveTab('completed-summary')}
                          className={`px-6 py-3 cursor-pointer rounded-xl text-sm font-semibold transition-all duration-300 relative ${activeTab === 'completed-summary'
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200/50 transform scale-105'
                            : isDarkMode
                              ? 'text-slate-300 hover:text-blue-400 hover:bg-blue-900/30 hover:shadow-md'
                              : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/80 hover:shadow-md'
                            }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-current opacity-75"></span>
                            <span>รายละเอียดการสั่งซื้อ</span>
                          </div>
                        </button>
                      );
                    case 'Po Updated':
                      return (
                        <button type="button" onClick={() => setActiveTab('completed-summary')}
                          className={`px-6 py-3 cursor-pointer rounded-xl text-sm font-semibold transition-all duration-300 relative ${activeTab === 'completed-summary'
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200/50 transform scale-105'
                            : isDarkMode
                              ? 'text-slate-300 hover:text-blue-400 hover:bg-blue-900/30 hover:shadow-md'
                              : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/80 hover:shadow-md'
                            }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-current opacity-75"></span>
                            <span>รายละเอียดการสั่งซื้อ</span>
                          </div>
                        </button>
                      );
                    default:
                      // สำหรับ status อื่นๆ ที่ไม่อยู่ใน case ให้แสดง summary
                      return (
                        <button type="button" onClick={() => setActiveTab('summary')}
                          className={`px-6 py-3 cursor-pointer rounded-xl text-sm font-semibold transition-all duration-300 relative ${activeTab === 'summary'
                            ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-200/50 transform scale-105'
                            : isDarkMode
                              ? 'text-slate-300 hover:text-blue-400 hover:bg-blue-900/30 hover:shadow-md'
                              : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/80 hover:shadow-md'
                            }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-current opacity-75"></span>
                            <span>ผลสรุป</span>
                          </div>
                        </button>
                      );
                  }
                })()}
              </div>

              {/* PDF Action Buttons - ฝั่งขวาสุด */}
              <div className="flex">
                <button
                  className={`flex items-center cursor-pointer justify-center rounded-l-lg px-3 py-2 text-lg font-medium transition ${isDarkMode ? 'text-emerald-400 bg-emerald-900/20 border border-emerald-800/50 hover:bg-emerald-800/30' : 'text-green-600 bg-green-50 border border-green-100 hover:bg-green-100'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    previewComparePdf();
                  }}
                >
                  <MdOutlineRemoveRedEye className="w-6 h-6" />
                </button>
                <button
                  className={`flex items-center cursor-pointer justify-center rounded-r-lg px-3 py-2 text-lg font-medium transition ${isDarkMode ? 'text-red-400 bg-red-900/20 border border-red-800/50 hover:bg-red-800/30' : 'text-red-400 bg-red-50 border border-red-100 hover:bg-red-100'}`}
                  onClick={e => {
                    e.stopPropagation();
                    downloadComparePdf();
                  }}
                >
                  <GoDownload className="w-6 h-6" />
                </button>
              </div>
            </nav>
          </div>
          {/* Modal body */}
          <div className={`flex-1 bg-gradient-to-br overflow-hidden ${isDarkMode ? 'from-slate-900/60 via-slate-800/40 to-slate-900/60' : 'from-white/60 via-slate-50/40 to-gray-50/60'}`}>
            <div className={`p-6 flex flex-col smooth-scroll ${isDarkMode ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'}`} style={{ height: 'calc(90vh - 200px)', minHeight: '500px', overflowY: 'auto' }}>
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

              {/* ANCHOR Approve Tab*/}
              {/* Tab Content - Approve (show only when latestNoPO and activeTab is 'approve') */}
              {!loading && !error && compareData && activeTab === 'approve' && (
                <div className={`backdrop-blur-sm rounded-2xl shadow-xl border overflow-hidden flex-1 ${isDarkMode ? 'bg-slate-800/90 border-slate-700/60' : 'bg-white/90 border-white/40'}`}>
                  {(() => {
                    const prWithPO = latestInventoryItem && latestInventoryItem.pr_list_id === currentPrListId ? latestInventoryItem : compareData?.part_inventory_and_pr?.find(item => item.pr_list_id === currentPrListId);
                    if (!prWithPO) return <div className="p-6">ไม่พบข้อมูล</div>;

                    // หา vendor_id จาก recent_purchase
                    let purchaseVendorId: number | undefined = undefined;
                    const rp = prWithPO.choose_vendor;
                    if (Array.isArray(rp) && rp.length > 0 && typeof rp[0]?.vendor_id === 'number') {
                      purchaseVendorId = rp[0].vendor_id;
                    } else if (rp && typeof rp === 'object' && 'vendor_id' in rp && typeof (rp as { vendor_id?: number }).vendor_id === 'number') {
                      purchaseVendorId = (rp as { vendor_id: number }).vendor_id;
                    }

                    const vendorDetail = compareData?.compare_vendors?.find(v => v.vendor_id === rp);

                    return (
                      <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className={`bg-gradient-to-r px-8 py-4 border-b ${isDarkMode ? 'from-yellow-900/60 to-orange-900/60 border-yellow-700/60' : 'from-yellow-50 to-orange-50 border-yellow-200/60'}`}>
                          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>รออนุมัติใบเปรียบเทียบ</h3>
                        </div>

                        {/* Content */}
                        <div className={`flex-1 p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)] smooth-scroll ${isDarkMode ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'}`}
                          style={{ willChange: 'scroll-position, transform' }}>
                          {/* Form Layout - 2 Column Grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Column 1 (Left) - ข้อมูลการขอซื้อ + เหตุผลการขอซื้อ */}
                            <div className="space-y-4">
                              {/* ข้อมูลการขอซื้อ */}
                              <div className={`bg-gradient-to-br p-4 rounded-xl border shadow-md ${isDarkMode ? 'from-slate-700/50 to-slate-800/50 border-slate-600/60' : 'from-slate-50 to-white border-slate-200/60'}`}>
                                <div className="flex items-center space-x-2 mb-4">
                                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                                    <svg className={`w-4 h-4 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <h4 className={`text-lg font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>ข้อมูลการขอซื้อ</h4>
                                </div>

                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>PR เลขที่</label>
                                      <div className={`text-sm font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{prNumber || '-'}</div>
                                    </div>
                                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>PO เลขที่</label>
                                      <div className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{prWithPO?.po_no || 'รอดำเนินการ'}</div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-3">
                                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>จำนวน</label>
                                      <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{prWithPO.qty}</div>
                                    </div>
                                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>หน่วย</label>
                                      <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{prWithPO.unit}</div>
                                    </div>
                                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>แผนก</label>
                                      <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{prWithPO.dept_request}</div>
                                    </div>
                                  </div>

                                  <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                    <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>รหัสสินค้า</label>
                                    <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{prWithPO.prod_code}</div>
                                  </div>

                                  <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                    <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>รายละเอียด</label>
                                    <div className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'} line-clamp-2`}>{prWithPO.prod_detail}</div>
                                  </div>
                                </div>
                              </div>

                              {/* เหตุผลการขอซื้อ */}
                              <div className={`bg-gradient-to-br p-4 rounded-xl border shadow-md ${isDarkMode ? 'from-slate-700/50 to-slate-800/50 border-slate-600/60' : 'from-slate-50 to-white border-slate-200/60'}`}>
                                <div className="flex items-center space-x-2 mb-4">
                                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'}`}>
                                    <svg className={`w-4 h-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <h4 className={`text-lg font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>เหตุผลการขอซื้อ</h4>
                                </div>

                                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                  <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {(() => {
                                      const reasonMap: { [key: string]: string } = {
                                        '1': '1. ราคาถูก มีสินค้าส่งมอบได้เลย',
                                        '2': '2. ราคาแพงกว่า แต่มีสินค้าส่งมอบและรอไม่ได้',
                                        '3': '3. มีผู้ขาย / ผู้ผลิตรายเดียว',
                                        '4': '4. ราคาแพงกว่า คุณภาพดีกว่า',
                                        '5': '5. ราคาเท่ากัน มีเครดิตยาวกว่า',
                                        '6': '6. ราคาแพงกว่า แต่ส่งให้ ไม่ต้องไปรับ',
                                        '7': '7. ราคาเท่ากัน ส่งเร็วกว่า (ส่งถึงที่)',
                                        '8': '8. ราคาแพงกว่า แต่เป็นชุดเดียวกัน แยกสั่งไม่ได้',
                                        '9': '9. ราคาเท่ากัน แบ่งสั่ง',
                                        '10': '10. ต้องการด่วน รอเทียบราคาไม่ได้'
                                      };
                                      const reasonChoose = prWithPO?.reason_choose;
                                      if (reasonChoose && reasonMap[reasonChoose]) {
                                        return reasonMap[reasonChoose];
                                      }
                                      // ถ้าไม่ใช่ 1-10 ให้แสดง 11. อื่นๆ: <เหตุผล>
                                      if (reasonChoose && reasonChoose.trim() !== "") {
                                        return `11. อื่นๆ : ${reasonChoose}`;
                                      }
                                      return 'ไม่ระบุเหตุผล';
                                    })()}
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons - แยกกรอบอิสระ */}
                              {roleID === 5 && (
                                <div className={`p-4`}>
                                  <div className="flex justify-center gap-4">
                                    <button
                                      type="button"
                                      onClick={handleRejectCompare}
                                      className={`px-8 py-2 rounded-xl font-semibold shadow-lg transition-all duration-200 border text-base focus:outline-none focus:ring-2 cursor-pointer ${isDarkMode ? 'bg-red-700 text-white border-red-600 hover:bg-red-800 focus:ring-red-600' : 'bg-red-500 text-white border-red-400 hover:bg-red-600 focus:ring-red-400'}`}
                                    >
                                      Reject
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleApproveSubmit}
                                      className={`px-8 py-2 rounded-xl font-semibold shadow-lg transition-all duration-200 border text-base focus:outline-none focus:ring-2 cursor-pointer ${isDarkMode ? 'bg-green-700 text-white border-green-600 hover:bg-green-800 focus:ring-green-600' : 'bg-green-500 text-white border-green-400 hover:bg-green-600 focus:ring-green-400'}`}
                                    >
                                      Approve
                                    </button>
                                  </div>
                                </div>
                              )}

                            </div>

                            {/* Column 2 (Right) - ข้อมูลผู้ขาย + สถานะและข้อมูลเพิ่มเติม */}
                            <div className="space-y-4">
                              {/* ข้อมูลผู้ขาย */}
                              {vendorDetail && (
                                <div className={`bg-gradient-to-br p-4 rounded-xl border shadow-md ${isDarkMode ? 'from-slate-700/50 to-slate-800/50 border-slate-600/60' : 'from-slate-50 to-white border-slate-200/60'}`}
                                  style={{ willChange: 'scroll-position, transform', scrollBehavior: 'smooth' }}>
                                  <div className="flex items-center space-x-2 mb-4">
                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                                      <svg className={`w-4 h-4 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </div>
                                    <h4 className={`text-lg font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>ข้อมูลผู้ขาย</h4>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                        <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>รหัสผู้ขาย</label>
                                        <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{vendorDetail.vendor_code}</div>
                                      </div>
                                      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                        <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>เครดิต</label>
                                        <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{vendorDetail.credit_term || '-'}</div>
                                      </div>
                                    </div>

                                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ชื่อผู้ขาย</label>
                                      <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{vendorDetail.vendor_name}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                        <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>เบอร์โทร</label>
                                        <div className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{vendorDetail.tel || '-'}</div>
                                      </div>
                                      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                        <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>อีเมล</label>
                                        <div className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'} truncate`}>{vendorDetail.email || '-'}</div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                        <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ราคา</label>
                                        <div className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                          {/* {Array.isArray(prWithPO.recent_purchase) && prWithPO.recent_purchase.length > 0
                                            ? (prWithPO.recent_purchase[0]?.price_for_approve !== undefined && prWithPO.recent_purchase[0]?.price_for_approve !== null
                                              ? `฿ ${prWithPO.recent_purchase[0].price_for_approve.toLocaleString()}`
                                              : '-')
                                            : (!Array.isArray(prWithPO.recent_purchase) && prWithPO.recent_purchase && (prWithPO.recent_purchase as { price_for_approve?: number }).price_for_approve !== undefined && (prWithPO.recent_purchase as { price_for_approve?: number }).price_for_approve !== null
                                              ? `฿ ${((prWithPO.recent_purchase as { price_for_approve: number }).price_for_approve).toLocaleString()}`
                                              : '-')} */}
                                          {vendorDetail.price}
                                        </div>
                                      </div>
                                      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                        <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ส่วนลด %</label>
                                        <div className={`text-sm font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                          {(() => {
                                            // Use discount from compare_vendor if available
                                            let discountArr: number[] = [];
                                            if (vendorDetail && Array.isArray(vendorDetail.discount)) {
                                              discountArr = vendorDetail.discount;
                                            }
                                            return discountArr.length ? discountArr.join(' , ') : '0';
                                          })()}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* สถานะและข้อมูลเพิ่มเติม */}
                              <div className={`bg-gradient-to-br p-4 rounded-xl border shadow-md ${isDarkMode ? 'from-slate-700/50 to-slate-800/50 border-slate-600/60' : 'from-slate-50 to-white border-slate-200/60'}`}
                                style={{ willChange: 'scroll-position, transform', scrollBehavior: 'smooth' }}>
                                <div className="flex items-center space-x-2 mb-4">
                                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-orange-900/50' : 'bg-orange-100'}`}>
                                    <svg className={`w-4 h-4 ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <h4 className={`text-lg font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-700'}`}>สถานะและข้อมูลเพิ่มเติม</h4>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex flex-row gap-4">
                                    <div className={`p-3 rounded-lg border flex-1 ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>สถานะ</label>
                                      <span className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-bold w-20 ${isDarkMode ? 'bg-yellow-900/80 text-yellow-300 border border-yellow-700/60' : 'bg-yellow-100 text-yellow-800'}`}>
                                        รออนุมัติ
                                      </span>
                                    </div>
                                    <div className={`p-3 rounded-lg border flex-1 ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>วันที่ส่งมอบ</label>
                                      <div className={`text-sm text-center ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                        {(() => {
                                          let deliverDate: string | null = null;
                                          const rp = prWithPO.recent_purchase;
                                          if (Array.isArray(rp) && rp.length > 0) {
                                            deliverDate = rp[0]?.date || null;
                                          } else if (rp && typeof rp === 'object' && 'date' in rp) {
                                            deliverDate = (rp as { date?: string }).date || null;
                                          }
                                          return deliverDate ? new Date(deliverDate).toLocaleDateString('th-TH') : '-';
                                        })()}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-row gap-4">
                                    <div className={`p-3 rounded-lg border flex-1 ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>วันที่ต้องการใช้สินค้า</label>
                                      <div className={`text-sm text-center ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                        {(() => {
                                          let useDate: string | null = null;
                                          const rp = prWithPO.recent_purchase;
                                          if (Array.isArray(rp) && rp.length > 0) {
                                            useDate = rp[0]?.due_date || null;
                                          } else if (rp && typeof rp === 'object' && 'due_date' in rp) {
                                            useDate = (rp as { due_date?: string }).due_date || null;
                                          }
                                          return useDate ? new Date(useDate).toLocaleDateString('th-TH') : '-';
                                        })()}
                                      </div>
                                    </div>
                                    <div className={`p-3 rounded-lg border flex-1 ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>วันที่ดำเนินการเปรียบเทียบ</label>
                                      <div className={`text-sm text-center ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{prWithPO.date_compare ? new Date(prWithPO.date_compare).toLocaleDateString('th-TH') : '-'}</div>
                                    </div>
                                  </div>

                                  {compareData.requester_name && (
                                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ผู้ร้องขอ</label>
                                      <div className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{compareData.requester_name}</div>
                                    </div>
                                  )}

                                  {compareData.pu_responsible && (
                                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ผู้จัดทำ</label>
                                      <div className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{compareData.pu_responsible}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {/* ANCHOR Completed Summary Tab */}
              {/* Tab Content - Completed Summary (show when there's PO data) */}
              {!loading && !error && compareData && activeTab === 'completed-summary' && (
                <div className={`backdrop-blur-sm rounded-2xl shadow-xl border overflow-hidden flex-1 ${isDarkMode ? 'bg-slate-800/90 border-slate-700/60' : 'bg-white/90 border-white/40'}`}>
                  {(() => {
                    const prWithPO = compareData?.part_inventory_and_pr?.find(item => item.pr_list_id === currentPrListId);
                    if (!prWithPO) return <div className="p-6">ไม่พบข้อมูล</div>;

                    // หา vendor_id จาก recent_purchase เหมือนกับใน left column
                    let purchaseVendorId: number | undefined = undefined;
                    const rp = prWithPO.choose_vendor;
                    if (Array.isArray(rp) && rp.length > 0 && typeof rp[0]?.vendor_id === 'number') {
                      purchaseVendorId = rp[0].vendor_id;
                    } else if (rp && typeof rp === 'object' && 'vendor_id' in rp && typeof (rp as { vendor_id?: number }).vendor_id === 'number') {
                      purchaseVendorId = (rp as { vendor_id: number }).vendor_id;
                    }

                    const vendorDetail = compareData?.compare_vendors?.find(v => v.vendor_id === rp);

                    return (
                      <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className={`bg-gradient-to-r px-6 py-5 border-b ${isDarkMode ? 'from-blue-900/80 via-indigo-900/70 to-purple-900/80 border-blue-700/60' : 'from-blue-50 via-indigo-50 to-purple-50 border-blue-200/60'}`}>
                          <div className="flex items-center justify-between">
                            {/* Left Section - Title and Status */}
                            <div className="flex items-center space-x-4">
                              <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-blue-800/60' : 'bg-blue-100'}`}>
                                <svg className={`w-6 h-6 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div>
                                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                  ผลสรุปรายละเอียดการสั่งซื้อ
                                </h3>
                                <p className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                  PR: {prWithPO.pr_no} • PO: {prWithPO.po_no || 'รออนุมัติ'}
                                </p>
                              </div>
                            </div>

                            {/* Right Section - Status Badge and Action Button */}
                            <div className="flex items-center space-x-4">

                              {/* Action Button */}
                              {(roleID === 4 || roleID === 5) && prWithPO.status !== 'Po Created' && prWithPO.status !== 'Po Updated' && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if ((!purchaseType && !prWithPO.po_no) || isSaving) return;
                                    setIsSaving(true);
                                    try {
                                      await handleSubmitPOCreate();
                                    } finally {
                                      setIsSaving(false);
                                    }
                                  }}
                                  className={`px-6 py-2.5 cursor-pointer rounded-xl font-semibold shadow-lg transition-all duration-300 border text-sm focus:outline-none focus:ring-2 flex items-center space-x-2 ${(!purchaseType && !prWithPO.po_no) || isSaving
                                    ? 'bg-slate-400 text-slate-200 border-slate-300 cursor-not-allowed opacity-60'
                                    : isDarkMode
                                      ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white border-emerald-500 hover:from-emerald-700 hover:to-green-700 hover:shadow-xl focus:ring-emerald-400 transform hover:scale-105'
                                      : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white border-emerald-400 hover:from-emerald-600 hover:to-green-600 hover:shadow-xl focus:ring-emerald-400 transform hover:scale-105'
                                    }`}
                                  disabled={(!purchaseType && !prWithPO.po_no) || isSaving}
                                >
                                  {isSaving ? (
                                    <>
                                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      <span>กำลังบันทึก...</span>
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                      </svg>
                                      <span>{prWithPO.po_no ? 'อัปเดต PO' : 'สร้าง PO'}</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className={`flex-1 p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)] smooth-scroll ${isDarkMode ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'}`}
                          style={{ willChange: 'scroll-position, transform', transform: 'translateZ(0)' }}>
                          {/* Form Layout - 2 Column Grid */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {/* Column 1 (Left) - ข้อมูลการขอซื้อ + เหตุผลการขอซื้อ + ประเภทการซื้อ */}
                            <div className="space-y-4">
                              {/* ข้อมูลการขอซื้อ */}
                              <div className={`bg-gradient-to-br p-4 rounded-xl border shadow-md ${isDarkMode ? 'from-slate-700/50 to-slate-800/50 border-slate-600/60' : 'from-slate-50 to-white border-slate-200/60'}`}>
                                <div className="flex items-center space-x-2 mb-4">
                                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                                    <svg className={`w-4 h-4 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <h4 className={`text-lg font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>ข้อมูลการขอซื้อ</h4>
                                </div>

                                <div className="space-y-3">
                                  <div className="grid grid-cols-2 gap-3">
                                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>PR เลขที่</label>
                                      <div className={`text-sm font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{prWithPO.pr_no}</div>
                                    </div>
                                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>PO เลขที่</label>
                                      <div className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{prWithPO.po_no}</div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-3 gap-3">
                                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>จำนวน</label>
                                      <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{prWithPO.qty}</div>
                                    </div>
                                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>หน่วย</label>
                                      <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{prWithPO.unit}</div>
                                    </div>
                                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>แผนก</label>
                                      <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{prWithPO.dept_request}</div>
                                    </div>
                                  </div>

                                  <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                    <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>รหัสสินค้า</label>
                                    <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{prWithPO.prod_code}</div>
                                  </div>

                                  <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                    <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>รายละเอียด</label>
                                    <div className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'} line-clamp-2`}>{prWithPO.prod_detail}</div>
                                  </div>
                                </div>
                              </div>

                              {/* เหตุผลการขอซื้อ */}
                              <div className={`bg-gradient-to-br p-4 rounded-xl border shadow-md ${isDarkMode ? 'from-slate-700/50 to-slate-800/50 border-slate-600/60' : 'from-slate-50 to-white border-slate-200/60'}`}>
                                <div className="flex items-center space-x-2 mb-4">
                                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-100'}`}>
                                    <svg className={`w-4 h-4 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <h4 className={`text-lg font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>เหตุผลการขอซื้อ</h4>
                                </div>

                                <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                  <div className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {(() => {
                                      const reasonMap: { [key: string]: string } = {
                                        '1': '1. ราคาถูก มีสินค้าส่งมอบได้เลย',
                                        '2': '2. ราคาแพงกว่า แต่มีสินค้าส่งมอบและรอไม่ได้',
                                        '3': '3. มีผู้ขาย / ผู้ผลิตรายเดียว',
                                        '4': '4. ราคาแพงกว่า คุณภาพดีกว่า',
                                        '5': '5. ราคาเท่ากัน มีเครดิตยาวกว่า',
                                        '6': '6. ราคาแพงกว่า แต่ส่งให้ ไม่ต้องไปรับ',
                                        '7': '7. ราคาเท่ากัน ส่งเร็วกว่า (ส่งถึงที่)',
                                        '8': '8. ราคาแพงกว่า แต่เป็นชุดเดียวกัน แยกสั่งไม่ได้',
                                        '9': '9. ราคาเท่ากัน แบ่งสั่ง',
                                        '10': '10. ต้องการด่วน รอเทียบราคาไม่ได้'
                                      };

                                      const reasonChoose = prWithPO?.reason_choose;
                                      // console.log('reasonChoose from prWithPO:', reasonChoose);
                                      if (reasonChoose && reasonMap[reasonChoose]) {
                                        return reasonMap[reasonChoose];
                                      }
                                      return 'ไม่ระบุเหตุผล';
                                    })()}
                                  </div>
                                </div>
                              </div>

                              {/* ประเภทการซื้อ - ซ่อนเมื่อสถานะเป็น Po Created หรือมี po_no */}
                              {prWithPO.status !== 'Po Created' && prWithPO.status !== 'Po Updated' && (
                                <>
                                  <div className={`bg-gradient-to-br p-4 rounded-xl border shadow-md ${isDarkMode ? 'from-slate-700/50 to-slate-800/50 border-slate-600/60' : 'from-slate-50 to-white border-slate-200/60'}`}>
                                    <div className="flex items-center space-x-2 mb-4">
                                      <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-indigo-900/50' : 'bg-indigo-100'}`}>
                                        <svg className={`w-4 h-4 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                        </svg>
                                      </div>
                                      <h4 className={`text-lg font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-700'}`}>ประเภทการซื้อ</h4>
                                    </div>
                                    {!prWithPO.po_no && (
                                      <div className="grid grid-cols-2 gap-3">
                                        <div
                                          className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${purchaseType === 'D'
                                            ? isDarkMode
                                              ? 'bg-blue-900/60 border-blue-500'
                                              : 'bg-blue-100 border-blue-500'
                                            : isDarkMode
                                              ? 'bg-slate-800/50 border-slate-600 hover:border-blue-500'
                                              : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                                            }`}
                                          onClick={() => setPurchaseType('D')}
                                        >
                                          <div className="flex items-center space-x-2">
                                            <div className={`w-3 h-3 rounded-full border-2 ${purchaseType === 'D'
                                              ? isDarkMode
                                                ? 'border-blue-300 bg-blue-500'
                                                : 'border-blue-500 bg-blue-500'
                                              : isDarkMode
                                                ? 'border-slate-500'
                                                : 'border-slate-400'
                                              }`}></div>
                                            <div>
                                              <div className={`font-bold text-sm ${purchaseType === 'D'
                                                ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                                : isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                                }`}>DIRECT</div>
                                              <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>วัตถุดิบที่เกี่ยวข้องกับการผลิต</div>
                                            </div>
                                          </div>
                                        </div>
                                        <div
                                          className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${purchaseType === 'I'
                                            ? isDarkMode
                                              ? 'bg-blue-900/60 border-blue-500'
                                              : 'bg-blue-100 border-blue-500'
                                            : isDarkMode
                                              ? 'bg-slate-800/50 border-slate-600 hover:border-blue-500'
                                              : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                                            }`}
                                          onClick={() => setPurchaseType('I')}
                                        >
                                          <div className="flex items-center space-x-2">
                                            <div className={`w-3 h-3 rounded-full border-2 ${purchaseType === 'I'
                                              ? isDarkMode
                                                ? 'border-blue-300 bg-blue-500'
                                                : 'border-blue-500 bg-blue-500'
                                              : isDarkMode
                                                ? 'border-slate-500'
                                                : 'border-slate-400'
                                              }`}></div>
                                            <div>
                                              <div className={`font-bold text-sm ${purchaseType === 'I'
                                                ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                                : isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                                }`}>INDIRECT</div>
                                              <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>วัตถุดิบที่ไม่เกี่ยวข้องกับการผลิต</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    <label htmlFor="Vat" className={`block mb-2 text-sm font-medium mt-4 ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>Vat</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div
                                          className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${purchaseType === 'D'
                                            ? isDarkMode
                                              ? 'bg-blue-900/60 border-blue-500'
                                              : 'bg-blue-100 border-blue-500'
                                            : isDarkMode
                                              ? 'bg-slate-800/50 border-slate-600 hover:border-blue-500'
                                              : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                                            }`}
                                          onClick={() => setPurchaseType('D')}
                                        >
                                          <div className="flex items-center space-x-2">
                                            <div className={`w-3 h-3 rounded-full border-2 ${purchaseType === 'D'
                                              ? isDarkMode
                                                ? 'border-blue-300 bg-blue-500'
                                                : 'border-blue-500 bg-blue-500'
                                              : isDarkMode
                                                ? 'border-slate-500'
                                                : 'border-slate-400'
                                              }`}></div>
                                            <div>
                                              <div className={`font-bold text-sm ${purchaseType === 'D'
                                                ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                                : isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                                }`}>Vat 7%</div>
                                              <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>มีภาษี</div>
                                            </div>
                                          </div>
                                        </div>
                                        <div
                                          className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-105 ${purchaseType === 'I'
                                            ? isDarkMode
                                              ? 'bg-blue-900/60 border-blue-500'
                                              : 'bg-blue-100 border-blue-500'
                                            : isDarkMode
                                              ? 'bg-slate-800/50 border-slate-600 hover:border-blue-500'
                                              : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                                            }`}
                                          onClick={() => setPurchaseType('I')}
                                        >
                                          <div className="flex items-center space-x-2">
                                            <div className={`w-3 h-3 rounded-full border-2 ${purchaseType === 'I'
                                              ? isDarkMode
                                                ? 'border-blue-300 bg-blue-500'
                                                : 'border-blue-500 bg-blue-500'
                                              : isDarkMode
                                                ? 'border-slate-500'
                                                : 'border-slate-400'
                                              }`}></div>
                                            <div>
                                              <div className={`font-bold text-sm ${purchaseType === 'I'
                                                ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                                : isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                                }`}>No Vat</div>
                                              <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>ไม่มีภาษี</div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    {/* Remark input field */}
                                    <div className="mt-6">
                                      <label htmlFor="remark" className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>Remark</label>
                                      <input
                                        id="remark"
                                        type="text"
                                        className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-2 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-200 focus:ring-amber-400' : 'bg-white border-gray-300 text-gray-800 focus:ring-amber-500'}`}
                                        placeholder="ระบุหมายเหตุเพิ่มเติม (Remark)"
                                        value={remark || ''}
                                        onChange={e => setRemark(e.target.value)}
                                      />
                                    </div>
                                    {/* last discount input field */}
                                    <div className="mt-6">
                                      <label htmlFor="last_discount" className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>ส่วนลดท้ายบิล</label>
                                      <input
                                        id="last_discount"
                                        type="number"
                                        className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-2 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-600 text-cyan-200 focus:ring-cyan-400' : 'bg-white border-gray-300 text-cyan-800 focus:ring-cyan-500'}`}
                                        placeholder="ระบุส่วนลดท้ายบิล (Last Discount)"
                                        value={lastDiscount ?? ''}
                                        onChange={e => {
                                          const value = e.target.value;
                                          setLastDiscount(value === '' ? null : Number(value));
                                        }}
                                      />
                                    </div>
                                  </div>
                                  {/* <div className={`p-4`}>
                                    <div className="flex justify-center gap-4">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if (!purchaseType || isSaving) return;
                                          setIsSaving(true);
                                          try {
                                            await handleSubmitPOCreate();
                                          } finally {
                                            setIsSaving(false);
                                          }
                                        }}
                                        className={`px-8 py-2 rounded-xl font-semibold shadow-lg transition-all duration-200 border text-base focus:outline-none focus:ring-2 ${isDarkMode ? 'bg-green-700 text-white border-green-600 hover:bg-green-800 focus:ring-green-600' : 'bg-green-500 text-white border-green-400 hover:bg-green-600 focus:ring-green-400'} ${!purchaseType || isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        style={!purchaseType || isSaving ? { cursor: 'not-allowed' } : undefined}
                                        disabled={!purchaseType || isSaving}
                                      >
                                        {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                                      </button>
                                    </div>
                                  </div> */}
                                </>
                              )}

                            </div>

                            {/* Column 2 (Right) - ข้อมูลผู้ขาย + สถานะและข้อมูลเพิ่มเติม */}
                            <div className="space-y-4" style={{ transform: 'translateZ(0)', backfaceVisibility: 'hidden' }}>
                              {/* ข้อมูลผู้ขาย */}
                              {vendorDetail && (
                                <div className={`bg-gradient-to-br p-4 rounded-xl border shadow-md ${isDarkMode ? 'from-slate-700/50 to-slate-800/50 border-slate-600/60' : 'from-slate-50 to-white border-slate-200/60'}`}>
                                  <div className="flex items-center space-x-2 mb-4">
                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                                      <svg className={`w-4 h-4 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                      </svg>
                                    </div>
                                    <h4 className={`text-lg font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>ข้อมูลผู้ขาย</h4>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                        <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>รหัสผู้ขาย</label>
                                        <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{vendorDetail.vendor_code}</div>
                                      </div>
                                      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                        <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>เครดิต</label>
                                        <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{vendorDetail.credit_term || '-'}</div>
                                      </div>
                                    </div>

                                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ชื่อผู้ขาย</label>
                                      <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{vendorDetail.vendor_name}</div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                        <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>เบอร์โทร</label>
                                        <div className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{vendorDetail.tel || '-'}</div>
                                      </div>
                                      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                        <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>อีเมล</label>
                                        <div className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'} truncate`}>{vendorDetail.email || '-'}</div>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                        <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ราคา</label>
                                        <div className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                          {/* {Array.isArray(prWithPO.recent_purchase) && prWithPO.recent_purchase.length > 0
                                            ? ((prWithPO.recent_purchase[0] as { price?: number })?.price !== undefined
                                              ? `฿ ${(prWithPO.recent_purchase[0] as { price: number }).price.toLocaleString()}`
                                              : '-')
                                            : (!Array.isArray(prWithPO.recent_purchase) && (prWithPO.recent_purchase as { price?: number })?.price !== undefined)
                                              ? `฿ ${(prWithPO.recent_purchase as { price: number }).price.toLocaleString()}`
                                              : '-'} */}
                                          {vendorDetail.price}
                                        </div>
                                      </div>
                                      <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                        <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ส่วนลด %</label>
                                        <div className={`text-sm font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                          {(() => {
                                            // Use discount from compare_vendor if available
                                            let discountArr: number[] = [];
                                            if (vendorDetail && Array.isArray(vendorDetail.discount)) {
                                              discountArr = vendorDetail.discount;
                                            }
                                            return discountArr.length ? discountArr.join(' , ') : '0';
                                          })()}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* สถานะและข้อมูลเพิ่มเติม */}
                              <div className={`bg-gradient-to-br p-4 rounded-xl border shadow-md ${isDarkMode ? 'from-slate-700/50 to-slate-800/50 border-slate-600/60' : 'from-slate-50 to-white border-slate-200/60'}`}>
                                <div className="flex items-center space-x-2 mb-4">
                                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-orange-900/50' : 'bg-orange-100'}`}>
                                    <svg className={`w-4 h-4 ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  </div>
                                  <h4 className={`text-lg font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-700'}`}>สถานะและข้อมูลเพิ่มเติม</h4>
                                </div>

                                <div className="space-y-3">
                                  <div className="flex flex-row gap-4">
                                    <div className={`p-3 rounded-lg border flex-1 ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>สถานะ</label>
                                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${prWithPO.status === 'ORDERED'
                                        ? (isDarkMode ? 'bg-green-900/80 text-green-300 border border-green-700/60' : 'bg-blue-100 text-green-800')
                                        : (isDarkMode ? 'bg-green-900/80 text-green-300 border border-green-700/60' : 'bg-green-100 text-green-800')
                                        }`}>
                                        {prWithPO.status === 'ORDERED' ? 'ผู้จัดการจัดซื้ออนุมัติ' : prWithPO.status}
                                      </span>
                                    </div>
                                    <div className={`p-3 rounded-lg border flex-1 ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>วันที่ส่งมอบ</label>
                                      <div className={`text-sm text-center ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                        {(() => {
                                          // Use compare_vendors[0].date_shipped for delivery date
                                          const dateShipped = compareData?.compare_vendors && compareData.compare_vendors.length > 0 && compareData.compare_vendors[0].date_shipped;
                                          return dateShipped ? new Date(dateShipped).toLocaleDateString('th-TH') : '-';
                                        })()}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-row gap-4">
                                    <div className={`p-3 rounded-lg border flex-1 ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>วันที่ต้องการใช้สินค้า</label>
                                      <div className={`text-sm text-center ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                        {(() => {
                                          // Use compare_vendors[0].due_date for usage date
                                          const dueDate = compareData?.compare_vendors && compareData.compare_vendors.length > 0 && compareData.compare_vendors[0].due_date;
                                          return dueDate ? new Date(dueDate).toLocaleDateString('th-TH') : '-';
                                        })()}
                                      </div>
                                    </div>
                                    <div className={`p-3 rounded-lg border flex-1 ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>วันที่ดำเนินการเปรียบเทียบ</label>
                                      <div className={`text-sm text-center ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{prWithPO.date_compare ? new Date(prWithPO.date_compare).toLocaleDateString('th-TH') : '-'}</div>
                                    </div>
                                  </div>

                                  {compareData.requester_name && (
                                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ผู้ร้องขอ</label>
                                      <div className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{compareData.requester_name}</div>
                                    </div>
                                  )}

                                  {compareData.pu_responsible && (
                                    <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                      <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ผู้จัดทำ</label>
                                      <div className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{compareData.pu_responsible}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {/* {prWithPO.status !== 'Po Created' && (
                                <>
                                  <div className={`p-4`}>
                                    <div className="flex justify-center gap-4">
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          if ((!purchaseType && !prWithPO.po_no) || isSaving) return;
                                          setIsSaving(true);
                                          try {
                                            await handleSubmitPOCreate();
                                          } finally {
                                            setIsSaving(false);
                                          }
                                        }}
                                        className={`px-8 py-2 rounded-xl font-semibold shadow-lg transition-all duration-200 border text-base focus:outline-none focus:ring-2 ${isDarkMode ? 'bg-green-700 text-white border-green-600 hover:bg-green-800 focus:ring-green-600' : 'bg-green-500 text-white border-green-400 hover:bg-green-600 focus:ring-green-400'} ${(!purchaseType && !prWithPO.po_no) || isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                        style={((!purchaseType && !prWithPO.po_no) || isSaving) ? { cursor: 'not-allowed' } : undefined}
                                        disabled={(!purchaseType && !prWithPO.po_no) || isSaving}
                                      >
                                        {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                                      </button>
                                    </div>
                                  </div>
                                </>
                              )} */}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )
              }

              {/* ANCHOR Purchase History Tab */}
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
                        <col style={{ width: '120px' }} />
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
                        <col style={{ width: '120px' }} />
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
                          <th className={`px-3 py-3 text-center font-bold text-xs uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>ส่วนลด%</th>
                          <th className={`px-3 py-3 text-center font-bold text-xs uppercase tracking-wide ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>วันส่งมอบ</th>
                        </tr>
                      </thead>
                    </table>
                  </div>

                  {/* Scrollable tbody area */}
                  <div className={`flex-1 smooth-scroll ${isDarkMode ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'}`} style={{ maxHeight: 'calc(100vh - 480px)', overflowY: 'auto' }}>
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
                        <col style={{ width: '120px' }} />
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
                                      {removeEnglishUnlessNoThai(item.dept_request)}
                                    </span>
                                  </td>
                                  <td className={`px-4 py-4 font-bold text-sm text-center ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{item.pr_no}</td>
                                  <td className={`px-4 py-4 font-bold text-sm text-right ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{item.qty}</td>
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
                                  <td className={`px-4 py-4 text-sm text-left font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{purchase.vendor_name || '-'}</td>
                                  <td className={`px-4 py-4 text-sm text-right font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{purchase.price ? `${purchase.price.toLocaleString()}` : '-'} ฿</td>
                                  <td className={`px-4 py-4 text-sm text-center font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                    <div className="flex justify-center items-center w-full">
                                      {purchase.discount?.length ? (
                                        <div
                                          className={`inline-block px-1 py-2 rounded-lg border shadow-sm ${isDarkMode ? 'bg-amber-950/60 border-amber-900' : 'bg-amber-50 border-amber-200'}`}
                                          style={{ maxWidth: '100%', overflow: 'hidden', wordBreak: 'break-word', overflowWrap: 'break-word' }}
                                        >
                                          <div className="flex flex-col gap-0.5 justify-center items-center w-full">
                                            {Array.from({ length: Math.ceil((purchase.discount?.length ?? 0) / 3) }, (_, rowIdx) => (
                                              <div key={rowIdx} className="flex flex-row gap-1 justify-center items-center w-full">
                                                {(purchase.discount?.slice(rowIdx * 3, rowIdx * 3 + 3) ?? []).map((d, i) => (
                                                  <span
                                                    key={i}
                                                    className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold shadow-sm flex-shrink-0 ${isDarkMode ? 'bg-amber-900/80 text-amber-300' : 'bg-amber-100 text-amber-700'}`}
                                                    style={{ minWidth: '1.75rem', minHeight: '1.75rem' }}
                                                  >
                                                    {d}
                                                  </span>
                                                ))}
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : '-'}
                                    </div>
                                  </td>
                                  <td className={`px-4 py-4 text-sm text-center font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{purchase.date ? new Date(purchase.date).toLocaleDateString('th-TH', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                  }) : '-'}</td>
                                </tr>
                              );

                              // Render free items for this pr_list_id
                              const renderFreeItemRows = (prListId: number): React.ReactElement[] => {
                                // console.log('🎁 Free Items Debug:', {
                                //   prListId,
                                //   prListIdType: typeof prListId,
                                //   freeItemHistory,
                                //   isArray: Array.isArray(freeItemHistory),
                                //   length: freeItemHistory?.length,
                                //   firstItem: freeItemHistory?.[0]
                                // });

                                // Check if freeItemHistory is an object with data array inside
                                type FreeItem = {
                                  id?: number;
                                  pr_list_id?: number;
                                  qty?: number | string;
                                  part_name?: string;
                                  item_name?: string;
                                  remark?: string;
                                };
                                const freeItems: FreeItem[] = Array.isArray(freeItemHistory)
                                  ? freeItemHistory as FreeItem[]
                                  : (typeof freeItemHistory === 'object' && freeItemHistory !== null && Array.isArray((freeItemHistory as { data?: unknown }).data))
                                    ? (freeItemHistory as { data: FreeItem[] }).data
                                    : [];

                                // console.log('🔍 Extracted freeItems:', {
                                //   freeItems,
                                //   isArray: Array.isArray(freeItems),
                                //   length: freeItems?.length
                                // });

                                if (!Array.isArray(freeItems) || freeItems.length === 0) {
                                  // console.log('❌ No freeItems or empty array');
                                  return [];
                                }

                                const itemsForThisPR = freeItems.filter(fi => {
                                  const fiPrListId = fi?.pr_list_id;
                                  const match = Number(fiPrListId) === Number(prListId);
                                  return match;
                                });
                                // console.log('🎁 Filtered for PR', prListId, ':', itemsForThisPR);
                                const rows: React.ReactElement[] = [];
                                itemsForThisPR.forEach((fi, fiIdx) => {
                                  const qtyValue = fi.qty ?? '-';
                                  const showQty = !qtyValue || qtyValue === '-' ? '-' : qtyValue;
                                  const showUnit = !qtyValue || qtyValue === '-' ? '-' : item.unit;
                                  rows.push(
                                    <tr key={`free-${prListId}-${fi.id ?? fiIdx}`} className={`border-b ${isDarkMode ? 'bg-emerald-900/20 border-slate-700/60' : 'bg-emerald-50/60 border-emerald-100'}`}>
                                      <td className={`px-3 py-2.5 text-center text-xs font-medium ${isDarkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>ฟรี</td>
                                      <td className={`px-4 py-2.5 text-xs text-center font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>-</td>
                                      <td className="px-4 py-2.5 text-center">
                                        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-semibold ${isDarkMode ? 'bg-emerald-800/60 text-emerald-200' : 'bg-emerald-100 text-emerald-700'}`}>
                                          ของแถม
                                        </span>
                                      </td>
                                      <td className={`px-4 py-2.5 font-bold text-xs text-center ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`}>{item.pr_no}</td>
                                      <td className={`px-4 py-2.5 font-bold text-xs text-right ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{showQty}</td>
                                      <td className={`px-4 py-2.5 text-xs text-center font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{showUnit}</td>
                                      <td className={`px-4 py-2.5 text-center border-r ${isDarkMode ? 'border-slate-700' : 'border-black-200'}`}>
                                        <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-medium ${isDarkMode ? 'bg-emerald-800/40 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>FREE</span>
                                      </td>
                                      <td colSpan={4} className={`px-4 py-2.5 text-xs text-left font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                        <div className="whitespace-nowrap overflow-visible">
                                          {fi.part_name ?? fi.item_name ?? '-'}
                                          {fi.remark && (
                                            <span className={`ml-2 italic ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                              ({fi.remark})
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                });
                                return rows;
                              };

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

                              // Append free item rows for this pr_list_id
                              const freeRows = renderFreeItemRows(item.pr_list_id);
                              freeRows.forEach(fr => allRows.push(fr));
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
                      {/* <select
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
                      </select> */}
                      <Select
                        classNames={{
                          base: "w-35",
                          trigger: [
                            "px-3",
                            "py-1.5",
                            "min-h-[2.2rem]",
                            "text-sm",
                            "rounded",
                            "border",
                            "shadow-sm",
                            "transition-colors",
                            isDarkMode
                              ? "bg-slate-800 border-slate-600 text-slate-200 focus:border-slate-500 hover:border-slate-500"
                              : "bg-white border-slate-300 text-slate-700 focus:border-slate-400 hover:border-slate-400",
                          ],
                          value: "text-sm",
                          selectorIcon: [
                            "right-2",
                            isDarkMode ? "text-slate-400" : "text-slate-500"
                          ],
                          popoverContent: [
                            "rounded-lg",
                            "shadow-lg",
                            isDarkMode
                              ? "bg-slate-900 border-slate-600"
                              : "bg-white border-slate-300",
                          ],
                        }}
                        variant="bordered"
                        size="sm"
                        radius="sm"
                        selectedKeys={[String(rowsPerPage)]}
                        onSelectionChange={(keys) => {
                          const selected = Array.from(keys)[0] as string | undefined;
                          if (selected) {
                            setRowsPerPage(Number(selected));
                            setPurchasePage(1);
                          }
                        }}
                      >
                        {rowsPerPageOptions.map((option) => (
                          <SelectItem
                            key={option.key}
                            className={`rounded-md my-0.5 px-2 py-1.5 ${isDarkMode
                              ? "text-slate-200 hover:bg-slate-700 data-[selected=true]:bg-slate-700 data-[selected=true]:text-slate-100"
                              : "text-slate-700 hover:bg-slate-100 data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-900"
                              }`}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </Select>
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

              {/* ANCHOR Multiple Order Tab */}
              {!loading && !error && activeTab === 'multiple-order' && multipleOrderDetails.length > 0 && (
                <div className={`backdrop-blur-sm rounded-2xl shadow-xl border overflow-hidden flex-1 ${isDarkMode ? 'bg-slate-800/90 border-slate-700/60' : 'bg-white/90 border-white/40'}`}>
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className={`relative px-8 py-6 border-b ${isDarkMode
                      ? 'border-orange-500/30 bg-gradient-to-br from-slate-900 via-orange-950/50 to-red-950/50'
                      : 'border-orange-200/50 bg-gradient-to-br from-orange-50/80 via-white to-red-50/80'
                      }`}>
                      <div className="flex items-center justify-between">
                        {/* Left Section - Title and Info */}
                        <div className="flex items-center space-x-4">
                          <div className={`relative p-3 rounded-xl backdrop-blur-sm border shadow-lg ${isDarkMode
                            ? 'bg-gradient-to-br from-orange-900/60 to-red-900/60 border-orange-700/50'
                            : 'bg-gradient-to-br from-orange-100 to-red-100 border-orange-300/50'
                            }`}>
                            <svg className={`w-7 h-7 ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                            <div className={`absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isDarkMode
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                              : 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                              }`}>
                              {multipleOrderDetails.length}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center space-x-3">
                              <h3 className={`text-xl font-bold ${isDarkMode ? 'text-orange-200' : 'text-orange-800'}`}>
                                รายละเอียดการขอซื้อหลายรายการ
                              </h3>
                              <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${isDarkMode
                                ? 'bg-gradient-to-r from-orange-600/80 to-red-600/80 text-orange-100 border border-orange-500/50'
                                : 'bg-gradient-to-r from-orange-500/80 to-red-500/80 text-white border border-orange-400/50'
                                }`}>
                                Multiple Orders
                              </div>
                            </div>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-orange-300/80' : 'text-orange-700/80'}`}>
                              จัดการและสร้างใบสั่งซื้อสำหรับรายการทั้งหมด • {multipleOrderDetails.length} รายการ
                            </p>
                          </div>
                        </div>

                        {/* Right Section - Actions */}
                        <div className="flex items-center space-x-4">
                          {/* Status Indicator */}
                          <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg backdrop-blur-sm border ${(() => {
                            const hasPO = multipleOrderDetails.some(item => {
                              const prItem = compareData?.part_inventory_and_pr?.find(
                                pr => pr.pr_list_id === item.pr_list_id && pr.po_no && pr.po_no.trim() !== ''
                              );
                              return !!prItem;
                            });
                            if (hasPO) {
                              return isDarkMode
                                ? 'bg-green-900/30 border-green-600/50 text-green-300'
                                : 'bg-green-100/80 border-green-300/50 text-green-700';
                            }
                            return multipleOrderDetails[0]?.purchaseType
                              ? isDarkMode ? 'bg-blue-900/30 border-blue-600/50 text-blue-300' : 'bg-blue-100/80 border-blue-300/50 text-blue-700'
                              : isDarkMode ? 'bg-amber-900/30 border-amber-600/50 text-amber-300' : 'bg-amber-100/80 border-amber-300/50 text-amber-700';
                          })()}`}>
                            {(() => {
                              const hasPO = multipleOrderDetails.some(item => {
                                const prItem = compareData?.part_inventory_and_pr?.find(
                                  pr => pr.pr_list_id === item.pr_list_id && pr.po_no && pr.po_no.trim() !== ''
                                );
                                return !!prItem;
                              });
                              if (hasPO) {
                                return (
                                  <>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span className="text-sm font-semibold">มี PO แล้ว</span>
                                  </>
                                );
                              }
                              return multipleOrderDetails[0]?.purchaseType ? (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-sm font-semibold">พร้อมสร้าง PO</span>
                                </>
                              ) : (
                                <>
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.75 0L4.064 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                  </svg>
                                  <span className="text-sm font-semibold">ต้องเลือกประเภทการซื้อ</span>
                                </>
                              );
                            })()}
                          </div>

                          {/* Save Button */}
                          <button
                            type="button"
                            onClick={handleSubmitPOCreateMultiplePart}
                            disabled={(() => {
                              const hasPO = multipleOrderDetails.some(item => {
                                const prItem = compareData?.part_inventory_and_pr?.find(
                                  pr => pr.pr_list_id === item.pr_list_id && pr.po_no && pr.po_no.trim() !== ''
                                );
                                return !!prItem;
                              });
                              if (hasPO) return false;
                              return !multipleOrderDetails[0]?.purchaseType;
                            })()}
                            className={`group relative cursor-pointer flex items-center space-x-3 px-8 py-3 rounded-xl font-bold shadow-xl transition-all duration-300 border-2 text-sm focus:outline-none focus:ring-4 overflow-hidden ${(() => {
                              const hasPO = multipleOrderDetails.some(item => {
                                const prItem = compareData?.part_inventory_and_pr?.find(
                                  pr => pr.pr_list_id === item.pr_list_id && pr.po_no && pr.po_no.trim() !== ''
                                );
                                return !!prItem;
                              });
                              if (hasPO) {
                                return isDarkMode
                                  ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 text-white border-emerald-500 hover:from-emerald-700 hover:via-green-700 hover:to-emerald-800 hover:shadow-2xl hover:scale-105 focus:ring-emerald-500/50'
                                  : 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 text-white border-emerald-400 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 hover:shadow-2xl hover:scale-105 focus:ring-emerald-400/50';
                              }
                              return !multipleOrderDetails[0]?.purchaseType
                                ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                                : isDarkMode
                                  ? 'bg-gradient-to-r from-orange-600 via-red-600 to-orange-700 text-white border-orange-500 hover:from-orange-700 hover:via-red-700 hover:to-orange-800 hover:shadow-2xl hover:scale-105 focus:ring-orange-500/50'
                                  : 'bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 text-white border-orange-400 hover:from-orange-600 hover:via-red-600 hover:to-orange-700 hover:shadow-2xl hover:scale-105 focus:ring-orange-400/50';
                            })()}`}
                          >
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>

                            <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              {(() => {
                                const hasPO = multipleOrderDetails.some(item => {
                                  const prItem = compareData?.part_inventory_and_pr?.find(
                                    pr => pr.pr_list_id === item.pr_list_id && pr.po_no && pr.po_no.trim() !== ''
                                  );
                                  return !!prItem;
                                });
                                return hasPO ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                                );
                              })()}
                            </svg>
                            <span className="relative z-10 font-bold">
                              {(() => {
                                const hasPO = multipleOrderDetails.some(item => {
                                  const prItem = compareData?.part_inventory_and_pr?.find(
                                    pr => pr.pr_list_id === item.pr_list_id && pr.po_no && pr.po_no.trim() !== ''
                                  );
                                  return !!prItem;
                                });
                                return hasPO ? 'อัพเดท PO' : 'สร้าง PO';
                              })()}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-4 overflow-y-auto">
                      <div className="space-y-4">
                        {/* รายการที่ขอซื้อ */}
                        <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center space-x-3 mb-4">
                            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-orange-700' : 'bg-orange-100'}`}>
                              <svg className={`w-5 h-5 ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                              </svg>
                            </div>
                            <h4 className={`text-base font-bold ${isDarkMode ? 'text-orange-100' : 'text-orange-800'}`}>
                              รายการ Part Numbers
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isDarkMode ? 'bg-orange-900/80 text-orange-200' : 'bg-orange-100 text-orange-700'}`}>
                              {multipleOrderDetails.length} รายการ
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {multipleOrderDetails.map((item, index) => (
                              <div key={`${item.pr_list_id}-${index}`}
                                className={`flex items-start p-3 rounded-lg border text-sm transition-all duration-200 ${isDarkMode
                                  ? 'bg-slate-800/80 border-slate-600 hover:border-orange-500/50'
                                  : 'bg-white border-slate-200 hover:border-orange-300'
                                  }`}>
                                <span className={`w-6 h-6 text-xs rounded-full flex items-center justify-center mr-3 font-bold ${isDarkMode
                                  ? 'bg-orange-600 text-white'
                                  : 'bg-orange-500 text-white'}`}>
                                  {index + 1}
                                </span>
                                <div className="flex flex-col gap-1 min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`font-semibold font-mono ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{item.part_no}</span>
                                    {item.prod_code && (
                                      <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-orange-900/50 text-orange-200' : 'bg-orange-100 text-orange-700'}`}>{item.prod_code}</span>
                                    )}
                                  </div>
                                  {item.part_name && (
                                    <span className={`font-sans text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{item.part_name}</span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleMultipleOrderItemSelect({ part_no: item.part_no, pr_list_id: item.pr_list_id })}
                                  className={`ml-2 px-3 py-1 cursor-pointer text-xs rounded-md font-medium transition-all duration-200 ${currentPartNo === item.part_no && currentPrListId === item.pr_list_id
                                    ? isDarkMode
                                      ? 'bg-emerald-600 text-white border border-emerald-500'
                                      : 'bg-emerald-500 text-white border border-emerald-400'
                                    : isDarkMode
                                      ? 'bg-slate-700 text-slate-300 hover:bg-orange-600 hover:text-white border border-slate-600 hover:border-orange-500'
                                      : 'bg-gray-100 text-gray-700 hover:bg-orange-500 hover:text-white border border-gray-300 hover:border-orange-400'
                                    }`}
                                  title={`โหลดข้อมูล ${item.part_no}`}
                                >
                                  {currentPartNo === item.part_no && currentPrListId === item.pr_list_id ? 'Active' : 'View'}
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* ประเภทการซื้อ */}
                        {(() => {
                          // ตรวจสอบว่ามีรายการใดที่มี po_no แล้วหรือไม่
                          // console.log('=== Debug PO Check ===');
                          // console.log('multipleOrderDetails:', multipleOrderDetails);
                          // console.log('compareData?.part_inventory_and_pr:', compareData?.part_inventory_and_pr);

                          const hasExistingPO = multipleOrderDetails.some(item => {
                            // ตรวจสอบเฉพาะ pr_list_id เพื่อให้สามารถจัดการ part_no ที่ต่างกันได้
                            const prItem = compareData?.part_inventory_and_pr?.find(
                              pr => pr.pr_list_id === item.pr_list_id &&
                                pr.po_no &&
                                pr.po_no.trim() !== ''
                            );
                            // console.log(`Checking pr_list_id: ${item.pr_list_id}, part_no: ${item.part_no}`);
                            // console.log('Found prItem:', prItem);
                            // console.log('po_no:', prItem?.po_no);
                            return !!prItem;
                          });

                          // console.log('hasExistingPO:', hasExistingPO);
                          // console.log('======================');

                          // ถ้ามีรายการที่มี po_no แล้ว ให้ซ่อนส่วนนี้
                          if (hasExistingPO) {
                            return (
                              <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-yellow-900/20 border-yellow-600/40' : 'bg-yellow-50 border-yellow-300'}`}>
                                <div className="flex items-center space-x-3">
                                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-900/50' : 'bg-yellow-200'}`}>
                                    <svg className={`w-5 h-5 ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.99-.833-2.75 0L4.064 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <h4 className={`text-base font-bold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                                      ไม่สามารถแก้ไขประเภทการซื้อได้
                                    </h4>
                                    <p className={`text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                                      มีรายการที่ได้รับการอนุมัติและสร้าง PO แล้ว ไม่สามารถเปลี่ยนแปลงประเภทการซื้อได้
                                    </p>
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          // ถ้าไม่มีรายการที่มี po_no ให้แสดงส่วนเลือกประเภทการซื้อปกติ
                          return (
                            <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex items-center space-x-3 mb-4">
                                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-red-700' : 'bg-red-100'}`}>
                                  <svg className={`w-5 h-5 ${isDarkMode ? 'text-red-300' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                  </svg>
                                </div>
                                <h4 className={`text-base font-bold ${isDarkMode ? 'text-red-100' : 'text-red-800'}`}>
                                  ประเภทการซื้อ
                                </h4>
                              </div>

                              <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* DIRECT Option */}
                                  <div
                                    className={`relative p-3 rounded-lg border cursor-pointer transition-all duration-200 ${multipleOrderDetails[0]?.purchaseType === 'D'
                                      ? isDarkMode
                                        ? 'bg-green-900/30 border-green-500'
                                        : 'bg-green-50 border-green-400'
                                      : isDarkMode
                                        ? 'bg-slate-800/50 border-slate-600 hover:border-green-500/50'
                                        : 'bg-white border-slate-200 hover:border-green-300'
                                      }`}
                                    onClick={() => {
                                      setMultipleOrderDetails(prev =>
                                        prev.map(item => ({ ...item, purchaseType: 'D' }))
                                      );
                                    }}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${multipleOrderDetails[0]?.purchaseType === 'D'
                                        ? isDarkMode
                                          ? 'border-green-400 bg-green-500'
                                          : 'border-green-500 bg-green-500'
                                        : isDarkMode
                                          ? 'border-slate-500'
                                          : 'border-slate-300'
                                        }`}>
                                        {multipleOrderDetails[0]?.purchaseType === 'D' && (
                                          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <div className={`font-semibold text-sm ${multipleOrderDetails[0]?.purchaseType === 'D'
                                          ? isDarkMode ? 'text-green-300' : 'text-green-700'
                                          : isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                          }`}>
                                          DIRECT
                                        </div>
                                        <div className={`text-xs ${multipleOrderDetails[0]?.purchaseType === 'D'
                                          ? isDarkMode ? 'text-green-400' : 'text-green-600'
                                          : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                                          }`}>
                                          วัตถุดิบที่เกี่ยวข้องกับการผลิต (D)
                                        </div>
                                      </div>
                                      <div className={`p-1.5 rounded ${multipleOrderDetails[0]?.purchaseType === 'D'
                                        ? isDarkMode ? 'bg-green-900/50' : 'bg-green-100'
                                        : isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'
                                        }`}>
                                        <svg className={`w-4 h-4 ${multipleOrderDetails[0]?.purchaseType === 'D'
                                          ? isDarkMode ? 'text-green-300' : 'text-green-600'
                                          : isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>

                                  {/* INDIRECT Option */}
                                  <div
                                    className={`relative p-3 rounded-lg border cursor-pointer transition-all duration-200 ${multipleOrderDetails[0]?.purchaseType === 'I'
                                      ? isDarkMode
                                        ? 'bg-blue-900/30 border-blue-500'
                                        : 'bg-blue-50 border-blue-400'
                                      : isDarkMode
                                        ? 'bg-slate-800/50 border-slate-600 hover:border-blue-500/50'
                                        : 'bg-white border-slate-200 hover:border-blue-300'
                                      }`}
                                    onClick={() => {
                                      setMultipleOrderDetails(prev =>
                                        prev.map(item => ({ ...item, purchaseType: 'I' }))
                                      );
                                    }}
                                  >
                                    <div className="flex items-center space-x-2">
                                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${multipleOrderDetails[0]?.purchaseType === 'I'
                                        ? isDarkMode
                                          ? 'border-blue-400 bg-blue-500'
                                          : 'border-blue-500 bg-blue-500'
                                        : isDarkMode
                                          ? 'border-slate-500'
                                          : 'border-slate-300'
                                        }`}>
                                        {multipleOrderDetails[0]?.purchaseType === 'I' && (
                                          <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                        )}
                                      </div>
                                      <div className="flex-1">
                                        <div className={`font-semibold text-sm ${multipleOrderDetails[0]?.purchaseType === 'I'
                                          ? isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                          : isDarkMode ? 'text-slate-300' : 'text-slate-700'
                                          }`}>
                                          INDIRECT
                                        </div>
                                        <div className={`text-xs ${multipleOrderDetails[0]?.purchaseType === 'I'
                                          ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                          : isDarkMode ? 'text-slate-400' : 'text-slate-600'
                                          }`}>
                                          วัตถุดิบที่ไม่เกี่ยวข้องกับการผลิต (I)
                                        </div>
                                      </div>
                                      <div className={`p-1.5 rounded ${multipleOrderDetails[0]?.purchaseType === 'I'
                                        ? isDarkMode ? 'bg-blue-900/50' : 'bg-blue-100'
                                        : isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100'
                                        }`}>
                                        <svg className={`w-4 h-4 ${multipleOrderDetails[0]?.purchaseType === 'I'
                                          ? isDarkMode ? 'text-blue-300' : 'text-blue-600'
                                          : isDarkMode ? 'text-slate-400' : 'text-slate-500'
                                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                                        </svg>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {multipleOrderDetails[0]?.purchaseType && (
                                  <div className={`p-3 rounded-lg border ${multipleOrderDetails[0]?.purchaseType === 'D'
                                    ? isDarkMode ? 'bg-green-900/20 border-green-600/40' : 'bg-green-50 border-green-200'
                                    : isDarkMode ? 'bg-blue-900/20 border-blue-600/40' : 'bg-blue-50 border-blue-200'
                                    }`}>
                                    <div className="flex items-center space-x-2">
                                      <svg className={`w-4 h-4 ${multipleOrderDetails[0]?.purchaseType === 'D'
                                        ? isDarkMode ? 'text-green-400' : 'text-green-600'
                                        : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <div className="flex-1">
                                        <span className={`font-semibold text-sm ${multipleOrderDetails[0]?.purchaseType === 'D'
                                          ? isDarkMode ? 'text-green-300' : 'text-green-700'
                                          : isDarkMode ? 'text-blue-300' : 'text-blue-700'
                                          }`}>
                                          {multipleOrderDetails[0]?.purchaseType === 'D' ? 'วัตถุดิบที่เกี่ยวข้องกับการผลิต (DIRECT)' : 'วัตถุดิบที่ไม่เกี่ยวข้องกับการผลิต (INDIRECT)'}
                                        </span>
                                        <p className={`text-xs ${multipleOrderDetails[0]?.purchaseType === 'D'
                                          ? isDarkMode ? 'text-green-400' : 'text-green-600'
                                          : isDarkMode ? 'text-blue-400' : 'text-blue-600'
                                          }`}>
                                          ใช้สำหรับ {multipleOrderDetails.length} รายการ
                                        </p>
                                      </div>
                                      <div className={`px-2 py-1 rounded text-xs font-bold ${multipleOrderDetails[0]?.purchaseType === 'D'
                                        ? isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-600 text-white'
                                        : isDarkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-600 text-white'
                                        }`}>
                                        {multipleOrderDetails[0]?.purchaseType}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}

                        {/* Remark และ Last Discount - แสดงเสมอ */}
                        <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                          {/* Remark input field */}
                          <div className="mb-6">
                            <label htmlFor="remark" className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>Remark</label>
                            <input
                              id="remark"
                              type="text"
                              className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-2 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-200 focus:ring-amber-400' : 'bg-white border-gray-300 text-gray-800 focus:ring-amber-500'}`}
                              placeholder="ระบุหมายเหตุเพิ่มเติม (Remark)"
                              value={remark || ''}
                              onChange={e => setRemark(e.target.value)}
                            />
                          </div>
                          {/* last discount input field */}
                          <div>
                            <label htmlFor="last_discount" className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-cyan-300' : 'text-cyan-700'}`}>ส่วนลดท้ายบิล</label>
                            <input
                              id="last_discount"
                              type="number"
                              className={`w-full p-2 rounded-lg border focus:outline-none focus:ring-2 transition-all ${isDarkMode ? 'bg-slate-800 border-slate-600 text-cyan-200 focus:ring-cyan-400' : 'bg-white border-gray-300 text-cyan-800 focus:ring-cyan-500'}`}
                              placeholder="ระบุส่วนลดท้ายบิล (Last Discount)"
                              value={lastDiscount ?? ''}
                              onChange={e => {
                                const value = e.target.value;
                                setLastDiscount(value === '' ? null : Number(value));
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* ปุ่มบันทึก - แสดงเสมอ และทำงานได้เสมอ */}
                      {/* <div className="flex justify-end pt-4">
                        <button
                          type="button"
                          onClick={handleSubmitPOCreateMultiplePart}
                          disabled={(() => {
                            // ถ้ามี po_no ไม่ต้องตรวจสอบ purchaseType
                            const hasPO = multipleOrderDetails.some(item => {
                              const prItem = compareData?.part_inventory_and_pr?.find(
                                pr => pr.pr_list_id === item.pr_list_id && pr.po_no && pr.po_no.trim() !== ''
                              );
                              return !!prItem;
                            });
                            if (hasPO) return false;
                            // ถ้าไม่มี po_no ต้องเลือก purchaseType
                            return !multipleOrderDetails[0]?.purchaseType;
                          })()}
                          className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-semibold shadow-md transition-all duration-200 border text-sm focus:outline-none focus:ring-2 cursor-pointer ${(() => {
                              const hasPO = multipleOrderDetails.some(item => {
                                const prItem = compareData?.part_inventory_and_pr?.find(
                                  pr => pr.pr_list_id === item.pr_list_id && pr.po_no && pr.po_no.trim() !== ''
                                );
                                return !!prItem;
                              });
                              if (hasPO) return isDarkMode
                                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border-orange-500 hover:from-orange-700 hover:to-red-700 hover:shadow-lg focus:ring-orange-500'
                                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400 hover:from-orange-600 hover:to-red-600 hover:shadow-lg focus:ring-orange-400';
                              return !multipleOrderDetails[0]?.purchaseType
                                ? 'bg-gray-300 text-gray-500 border-gray-200 cursor-not-allowed'
                                : isDarkMode
                                  ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white border-orange-500 hover:from-orange-700 hover:to-red-700 hover:shadow-lg focus:ring-orange-500'
                                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400 hover:from-orange-600 hover:to-red-600 hover:shadow-lg focus:ring-orange-400';
                            })()
                            }`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          <span>บันทึกข้อมูล</span>
                        </button>
                      </div> */}
                    </div>
                  </div>
                </div>
              )}

              {/* ANCHOR Compare Tab */}
              {!loading && !error && compareData && activeTab === 'compare' && (
                <div className={`backdrop-blur-sm rounded-2xl shadow-xl border overflow-hidden flex-1 flex flex-col ${isDarkMode ? 'bg-slate-800/90 border-slate-700/60' : 'bg-white/90 border-white/40'}`} style={{ minHeight: 0 }}>
                  {/* Header Section - Fixed, no scroll */}
                  <div className="bg-gradient-to-r from-purple-500 to-violet-600 text-white border-b border-purple-200/50" style={{ paddingRight: '12px' }}>
                    <table className="text-sm table-fixed" style={{ width: '100%' }}>
                      <colgroup>
                        <col style={{ width: '25px' }} />
                        <col style={{ width: '45px' }} />
                        <col style={{ width: '60px' }} />
                        <col style={{ width: '250px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '140px' }} />
                        <col style={{ width: '80px' }} />
                        {/* <col style={{ width: '50px' }} /> */}
                      </colgroup>
                      <thead>
                        <tr>
                          <th className="px-3 py-3 font-bold text-xs uppercase tracking-wide text-center"></th>
                          <th className="px-3 py-3 font-bold text-xs uppercase tracking-wide text-center">#</th>
                          <th className="px-3 py-3 font-bold text-xs uppercase tracking-wide text-center">ID</th>
                          <th className="px-3 py-3 font-bold text-xs uppercase tracking-wide text-left">Vendor</th>
                          <th className="px-3 py-3 font-bold text-xs uppercase tracking-wide text-left">Tel.</th>
                          <th className="px-3 py-3 font-bold text-xs uppercase tracking-wide text-center">เครดิต</th>
                          <th className="px-3 py-3 font-bold text-xs uppercase tracking-wide text-center">ราคา</th>
                          <th className="px-3 py-3 font-bold text-xs uppercase tracking-wide text-center">ส่วนลด%</th>
                          <th className="px-3 py-3 font-bold text-xs uppercase tracking-wide text-center">ส่งมอบ</th>
                          {/* <th className="px-3 py-3 font-bold text-xs uppercase tracking-wide text-center">Actions</th> */}
                        </tr>
                      </thead>
                    </table>
                  </div>
                  {/* Scrollable tbody area */}
                  <div className={`flex-1 min-h-0 smooth-scroll ${isDarkMode ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'} overflow-y-auto`}>
                    <table className="text-sm table-fixed" style={{ width: '100%' }}>
                      <colgroup>
                        <col style={{ width: '25px' }} />
                        <col style={{ width: '45px' }} />
                        <col style={{ width: '60px' }} />
                        <col style={{ width: '250px' }} />
                        <col style={{ width: '120px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '100px' }} />
                        <col style={{ width: '140px' }} />
                        <col style={{ width: '80px' }} />
                        {/* <col style={{ width: '50px' }} /> */}
                      </colgroup>
                      <tbody className={`${isDarkMode ? 'bg-slate-800/95' : 'bg-white/95'}`}>
                        {(() => {
                          const allCompareData = getCompareRows();
                          const startIdx = (purchasePage - 1) * rowsPerPage;
                          const pagedRows = allCompareData.slice(startIdx, startIdx + rowsPerPage);
                          return pagedRows.length > 0 ? pagedRows.map((vendor, index) => {
                            // Find matching purchase row for this vendor - use current pr_list_id
                            const matchingPurchase = compareData?.part_inventory_and_pr?.find(item => item.pr_no === prNumber && item.pr_list_id === pr_list_id && item.po_no && item.po_no.trim() !== '');
                            const prItem = compareData?.part_inventory_and_pr?.find(item => item.pr_no === prNumber && item.pr_list_id === pr_list_id);

                            // Debug log สำหรับทุก vendor row
                            const statusRaw = prItem?.status;
                            const status = statusRaw ? statusRaw.trim().toLowerCase() : '';
                            let isDisabled = false;
                            if (status === 'po rejected' || status === 'rejected' || status === 'pending' || status === 'recheck' || !status) {
                              isDisabled = false;
                            } else {
                              isDisabled = true;
                            }
                            // console.log(`Row ${index + 1} - Vendor: ${vendor.vendor_name}`);
                            // console.log(`Status raw: "${statusRaw}" | Normalized: "${status}" | isDisabled: ${isDisabled}`);
                            // console.log(`Has PO: ${!!matchingPurchase}`);
                            // console.log('---');
                            // Visual indicator for editability: underline color
                            const editableBorder = isDisabled
                              ? (isDarkMode ? 'border-b' : 'border-b border-gray-200')
                              : (isDarkMode ? 'border-b' : 'border-b border-gray-200');
                            return (
                              <React.Fragment key={vendor.compare_id || index}>
                                <tr
                                  // key={vendor.compare_id || index}
                                  className={`border-b ${editableBorder} ${isDisabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'cursor-pointer transition-colors'} ${isDarkMode ? isDisabled ? 'bg-slate-700' : 'hover:bg-purple-900/30' : isDisabled ? 'bg-gray-100' : 'hover:bg-purple-50/50'}`}
                                  onClick={e => {
                                    if (isDisabled) return;
                                    if ((e.target as HTMLElement).closest('input')) return;
                                    handleCompareRowClick(vendor);
                                  }}
                                >
                                  <td className={`px-4 py-3 text-sm text-center justify-items-center ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                    <div className="relative inline-block">
                                      <button
                                        ref={el => {
                                          if (el) {
                                            if (!buttonRef.current) buttonRef.current = {};
                                            buttonRef.current[vendor.compare_id] = el;
                                          }
                                        }}
                                        onClick={(e) => {
                                          if (isDisabled) return;
                                          e.stopPropagation();
                                          const rect = e.currentTarget.getBoundingClientRect();
                                          setDropdownPosition({
                                            top: rect.top,
                                            left: rect.right + 8
                                          });
                                          setOpenDropdown(openDropdown === vendor.compare_id ? null : vendor.compare_id);
                                        }}
                                        className={`p-2 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 ${isDarkMode
                                          ? 'hover:bg-gray-600 border-gray-600'
                                          : 'hover:bg-slate-100 border-slate-200'
                                          } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
                                        type="button"
                                        disabled={isDisabled}
                                      >
                                        <SlOptionsVertical size={18} className={`${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                                      </button>
                                      {isClient && openDropdown !== null && openDropdown === vendor.compare_id && dropdownPosition &&
                                        createPortal(
                                          <>
                                            {/* Overlay for outside click */}
                                            <div
                                              className="fixed inset-0 z-[9998]"
                                              style={{ pointerEvents: 'auto' }}
                                              onClick={() => setOpenDropdown(null)}
                                            />
                                            <div
                                              ref={dropdownRef}
                                              className={`fixed border-2 rounded-xl shadow-xl z-[9999] min-w-[160px] ${isDarkMode
                                                ? 'bg-gray-700 border-gray-600'
                                                : 'bg-white border-slate-200'
                                                }`}
                                              style={{
                                                top: dropdownPosition.top,
                                                left: dropdownPosition.left
                                              }}
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingNote(vendor.compare_id);
                                                  setOpenDropdown(null);
                                                }}
                                                className={`w-full text-left px-5 py-3 text-sm flex items-center gap-3 cursor-pointer transition-all duration-200 font-medium rounded-t-xl ${isDarkMode
                                                  ? 'text-gray-300 hover:bg-amber-900/30'
                                                  : 'text-slate-700 hover:bg-amber-50'
                                                  }`}
                                              >
                                                <LuNotebookPen size={18} className={isDarkMode ? 'text-amber-300' : 'text-amber-600'} /> หมายเหตุ
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleEditVendor({
                                                    ID: vendor.vendor_id,
                                                    vendor_code: vendor.vendor_code,
                                                    vendor_name: vendor.vendor_name,
                                                    tax_id: vendor.tax_id ?? null,
                                                    credit_term: vendor.credit_term,
                                                    tel_no: vendor.tel,
                                                    fax_no: vendor.fax_no ?? '',
                                                    contact_person: vendor.contact_name ?? '',
                                                    email: vendor.email ?? '',
                                                  });
                                                  // handleEditVendor({
                                                  //   ID: vendor.vendor_id,
                                                  //   vendor_code: vendor.vendor_code,
                                                  //   vendor_name: vendor.vendor_name,
                                                  //   tax_id: vendor.tax_id ?? null,
                                                  //   credit_term: vendor.credit_term,
                                                  //   tel_no: vendor.tel,
                                                  //   fax_no: vendor.fax_no ?? '',
                                                  //   contact_person: vendor.contact_name ?? '',
                                                  //   email: vendor.email ?? '',
                                                  //   address1: vendor.address1 ?? '',
                                                  //   address2: vendor.address2 ?? '',
                                                  //   city: vendor.city ?? '',
                                                  //   country: vendor.country ?? '',
                                                  //   currency_code: vendor.currency_code ?? '',
                                                  //   zip_code: vendor.zip_code ?? '',
                                                  // });
                                                  setOpenDropdown(null);
                                                }}
                                                className={`w-full text-left px-5 py-3 text-sm flex items-center gap-3 cursor-pointer transition-all duration-200 font-medium ${isDarkMode
                                                  ? 'text-gray-300 hover:bg-purple-900/30'
                                                  : 'text-slate-700 hover:bg-purple-50'
                                                  }`}
                                              >
                                                <CiEdit size={18} className={isDarkMode ? 'text-purple-300' : 'text-purple-600'} /> แก้ไขข้อมูลผู้ขาย
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  if (window.confirm(`ต้องการลบ ${vendor.vendor_name} ออกจากรายการเปรียบเทียบ?`)) {
                                                    handleDeleteVendor(vendor);
                                                  }
                                                  setOpenDropdown(null);
                                                }}
                                                className={`w-full text-left px-5 py-3 text-sm flex items-center gap-3 cursor-pointer transition-all duration-200 font-medium rounded-b-xl ${isDarkMode
                                                  ? 'text-gray-300 hover:bg-red-900/30'
                                                  : 'text-slate-700 hover:bg-red-50'
                                                  }`}
                                              >
                                                <IoTrashBinOutline size={18} className={isDarkMode ? 'text-red-300' : 'text-red-600'} /> ลบผู้ขาย
                                              </button>
                                            </div>
                                          </>,
                                          document.body
                                        )
                                      }
                                    </div>
                                  </td>
                                  <td className={`px-4 py-3 text-sm text-center ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{startIdx + index + 1}</td>
                                  <td className={`px-4 py-3 text-sm text-center font-mono ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{vendor.vendor_code}</td>
                                  <td className={`px-4 py-3 text-sm font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{vendor.vendor_name}</td>
                                  <td className={`px-4 py-3 text-sm text-left ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {typeof vendor.tel === 'string' && vendor.tel.includes(',')
                                      ? vendor.tel.split(',').map((tel, idx) => (
                                        <div key={idx}>{tel.trim()}</div>
                                      ))
                                      : vendor.tel}
                                  </td>
                                  <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>{vendor.credit_term}</td>
                                  {/* PRICE EDIT */}
                                  <td className={`px-4 py-3 text-sm font-bold text-right pr-5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                    <span className="flex items-center justify-center gap-2">
                                      <span className="flex items-center">
                                        {/* NOTE Tooltips compare */}
                                        <Tooltip
                                          content={(() => {
                                            // ใช้ข้อมูลจาก priceCompareHistory ของผู้ขายนี้
                                            const vendorHistory = Array.isArray(priceCompareHistory)
                                              ? priceCompareHistory.filter((h: PriceCompareHistory) => h && (h.VendorId === vendor.vendor_id))
                                              : [];
                                            const historyPrices = vendorHistory
                                              .map((h: PriceCompareHistory) => Number(h.price))
                                              .filter((p: number) => !isNaN(p));
                                            const priceRounds = historyPrices.length > 0
                                              ? historyPrices
                                              : (typeof vendor.price === 'number' && !isNaN(vendor.price) ? [Number(vendor.price)] : []);

                                            // คำนวณค่าต่างๆ สำหรับกราฟ
                                            const w = 280;
                                            const h = 140;
                                            const paddingLeft = 45;
                                            const paddingRight = 20;
                                            const paddingTop = 20;
                                            const paddingBottom = 35;

                                            const minPrice = priceRounds.length ? Math.min(...priceRounds) : 0;
                                            const maxPrice = priceRounds.length ? Math.max(...priceRounds) : 0;
                                            const priceRange = (maxPrice - minPrice) || 1;
                                            const chartWidth = w - paddingLeft - paddingRight;
                                            const chartHeight = h - paddingTop - paddingBottom;
                                            const stepX = priceRounds.length > 1 ? chartWidth / (priceRounds.length - 1) : 0;

                                            // สร้างจุดข้อมูล
                                            const points = priceRounds.map((price, i) => {
                                              const x = paddingLeft + i * stepX;
                                              const y = paddingTop + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
                                              return { x, y, price, round: i + 1 };
                                            });

                                            const pathPoints = points.map(p => `${p.x},${p.y}`).join(' ');
                                            const areaPath = `M ${paddingLeft},${paddingTop + chartHeight} L ${pathPoints} L ${paddingLeft + chartWidth},${paddingTop + chartHeight} Z`;

                                            // Y axis ticks
                                            const yTicks = [];
                                            const tickCount = 4;
                                            for (let i = 0; i < tickCount; i++) {
                                              const value = minPrice + (priceRange * i / (tickCount - 1));
                                              const y = paddingTop + chartHeight - ((value - minPrice) / priceRange) * chartHeight;
                                              yTicks.push({ value, y });
                                            }

                                            // Move handlers to top-level scope
                                            // ...existing code...

                                            return (
                                              <div className="w-80" onMouseLeave={() => { setMouseX(null); setHoveredPoint(null); }}>
                                                <div className={`text-base font-bold text-left mb-3 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                  <CiCircleInfo className={`w-4 h-4 mr-1 ${isDarkMode ? 'text-white' : 'text-gray-500'}`} />
                                                  <span>ประวัติการต่อรองราคา</span>
                                                </div>

                                                {/* Chart Container */}
                                                <div className={`rounded-xl mb-3 p-3 shadow-lg ${isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-gray-50 border border-gray-200'}`}>
                                                  <div className="relative">
                                                    <svg
                                                      width={w}
                                                      height={h}
                                                      className="overflow-visible"
                                                      onMouseMove={e => {
                                                        if (!points.length) return;
                                                        const svg = e.currentTarget;
                                                        const rect = svg.getBoundingClientRect();
                                                        const x = e.clientX - rect.left;
                                                        let closestIndex = 0;
                                                        let closestDistance = Math.abs(x - points[0].x);
                                                        points.forEach((pt, idx) => {
                                                          const distance = Math.abs(x - pt.x);
                                                          if (distance < closestDistance) {
                                                            closestDistance = distance;
                                                            closestIndex = idx;
                                                          }
                                                        });
                                                        setMouseX(points[closestIndex].x);
                                                        setHoveredPoint(closestIndex);
                                                      }}
                                                      onMouseLeave={() => { setMouseX(null); setHoveredPoint(null); }}
                                                      style={{ cursor: 'crosshair' }}
                                                    >
                                                      {/* Grid lines */}
                                                      {yTicks.map((tick, i) => (
                                                        <line
                                                          key={i}
                                                          x1={paddingLeft}
                                                          y1={tick.y}
                                                          x2={paddingLeft + chartWidth}
                                                          y2={tick.y}
                                                          stroke={isDarkMode ? '#334155' : '#e5e7eb'}
                                                          strokeWidth="1"
                                                          strokeDasharray="3,3"
                                                          opacity="0.5"
                                                        />
                                                      ))}

                                                      {/* Vertical line on hover */}
                                                      {mouseX !== null && points.length > 0 && (
                                                        <>
                                                          <line
                                                            x1={mouseX}
                                                            y1={paddingTop}
                                                            x2={mouseX}
                                                            y2={paddingTop + chartHeight}
                                                            stroke="#05df72"
                                                            strokeWidth="1.5"
                                                            strokeDasharray="5,5"
                                                            opacity="0.6"
                                                          />
                                                          {/* Dot on X axis */}
                                                          <circle
                                                            cx={mouseX}
                                                            cy={paddingTop + chartHeight}
                                                            r="4"
                                                            fill="#05df72"
                                                            opacity="0.8"
                                                          />
                                                        </>
                                                      )}

                                                      {/* Gradient area */}
                                                      <defs>
                                                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                          <stop offset="0%" stopColor="#00c950" stopOpacity="0.25" />
                                                          <stop offset="100%" stopColor="#00c950" stopOpacity="0.05" />
                                                        </linearGradient>
                                                      </defs>
                                                      {points.length > 0 && <path d={areaPath} fill="url(#areaGradient)" />}

                                                      {/* Main line */}
                                                      {points.length > 0 && (
                                                        <polyline
                                                          fill="none"
                                                          stroke="#05df72"
                                                          strokeWidth="2.5"
                                                          points={pathPoints}
                                                          strokeLinecap="round"
                                                          strokeLinejoin="round"
                                                        />
                                                      )}

                                                      {/* Data points */}
                                                      {points.map((pt, idx) => (
                                                        <g key={idx}>
                                                          <circle
                                                            cx={pt.x}
                                                            cy={pt.y}
                                                            r={hoveredPoint === idx ? "8" : "6"}
                                                            fill={isDarkMode ? '#1e293b' : '#ffffff'}
                                                            stroke="#00c950"
                                                            strokeWidth={hoveredPoint === idx ? "3" : "2.5"}
                                                            style={{
                                                              cursor: 'pointer',
                                                              transition: 'all 0.2s ease'
                                                            }}
                                                          />
                                                          <circle
                                                            cx={pt.x}
                                                            cy={pt.y}
                                                            r={hoveredPoint === idx ? "4" : "3"}
                                                            fill="#7bf1a8"
                                                            style={{ transition: 'all 0.2s ease' }}
                                                          />
                                                        </g>
                                                      ))}

                                                      {/* X axis */}
                                                      <line
                                                        x1={paddingLeft}
                                                        y1={paddingTop + chartHeight}
                                                        x2={paddingLeft + chartWidth}
                                                        y2={paddingTop + chartHeight}
                                                        stroke={isDarkMode ? '#475569' : '#d1d5db'}
                                                        strokeWidth="1.5"
                                                      />
                                                      {points.map((pt, idx) => (
                                                        <text
                                                          key={idx}
                                                          x={pt.x}
                                                          y={paddingTop + chartHeight + 18}
                                                          textAnchor="middle"
                                                          fontSize="11"
                                                          fill={isDarkMode ? '#94a3b8' : '#6b7280'}
                                                          fontWeight="500"
                                                        >
                                                          รอบ {pt.round}
                                                        </text>
                                                      ))}

                                                      {/* Y axis */}
                                                      <line
                                                        x1={paddingLeft}
                                                        y1={paddingTop}
                                                        x2={paddingLeft}
                                                        y2={paddingTop + chartHeight}
                                                        stroke={isDarkMode ? '#475569' : '#d1d5db'}
                                                        strokeWidth="1.5"
                                                      />
                                                      {yTicks.map((tick, i) => (
                                                        <text
                                                          key={i}
                                                          x={paddingLeft - 8}
                                                          y={tick.y + 3}
                                                          textAnchor="end"
                                                          fontSize="10"
                                                          fill={isDarkMode ? '#94a3b8' : '#6b7280'}
                                                        >
                                                          ฿{Math.round(tick.value)}
                                                        </text>
                                                      ))}
                                                    </svg>

                                                    {/* Hover tooltip */}
                                                    {hoveredPoint !== null && points.length > 0 && points[hoveredPoint] && (
                                                      <div
                                                        className={`absolute ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} border rounded-xl p-3 shadow-xl z-50 pointer-events-none`}
                                                        style={{
                                                          left: points[hoveredPoint].x - 65,
                                                          top: points[hoveredPoint].y - 130,
                                                          minWidth: '130px',
                                                          transform: 'translateX(0%)',
                                                          textAlign: 'center'
                                                        }}
                                                      >
                                                        <div className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                          รอบที่ {points[hoveredPoint].round}
                                                        </div>
                                                        <div className={`text-xs mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                                                          ราคาต่อรอง
                                                        </div>
                                                        <div className="flex gap-2 items-center mb-1">
                                                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${isDarkMode ? 'bg-slate-800 text-emerald-400' : 'bg-gray-100 text-gray-900'}`}>
                                                            ฿{points[hoveredPoint].price}
                                                          </span>
                                                          {hoveredPoint > 0 && points[hoveredPoint - 1] && (() => {
                                                            const prev = points[hoveredPoint - 1].price;
                                                            const curr = points[hoveredPoint].price;
                                                            const diff = curr - prev;
                                                            const percent = ((diff / prev) * 100).toFixed(1);
                                                            const isIncrease = diff > 0;
                                                            const sign = isIncrease ? '+' : '';
                                                            const colorClass = isIncrease
                                                              ? (isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700')
                                                              : (isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700');
                                                            return (
                                                              <span className={`px-2 py-1 rounded-lg text-xs font-bold ${colorClass}`}>
                                                                {sign}{percent}%
                                                              </span>
                                                            );
                                                          })()}
                                                        </div>
                                                        <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                                                          {hoveredPoint > 0 ? 'จากรอบก่อนหน้า' : 'ราคาเริ่มต้น'}
                                                        </div>
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>

                                                {/* Summary */}
                                                <div className={`text-center text-xs mb-2 ${isDarkMode ? 'text-white' : 'text-slate-600'} font-semibold`}>
                                                  {priceRounds.length > 0 ? (
                                                    <>มีการต่อรองราคา {priceRounds.length} รอบ</>
                                                  ) : (
                                                    <>ไม่มีข้อมูลประวัติการต่อรองสำหรับผู้ขายนี้</>
                                                  )}
                                                </div>

                                                {/* Price list */}
                                                <div className="flex flex-wrap justify-center gap-2 text-xs">
                                                  {priceRounds.map((price, idx) => (
                                                    <span
                                                      key={idx}
                                                      className={`px-2 py-1 rounded-lg font-semibold ${isDarkMode
                                                        ? 'bg-slate-800 text-emerald-300'
                                                        : 'bg-emerald-50 text-emerald-700'
                                                        }`}
                                                    >
                                                      รอบ {idx + 1}: ฿{price}
                                                    </span>
                                                  ))}
                                                </div>
                                              </div>
                                            );
                                          })()}
                                          showArrow={true}
                                          placement="left"
                                          classNames={{
                                            content: isDarkMode
                                              ? "bg-slate-900 text-white border border-slate-700 shadow-lg rounded-2xl px-4 py-4 m-1"
                                              : "bg-white text-gray-900 border border-gray-200 shadow-lg rounded-2xl px-4 py-4 m-1",
                                            arrow: isDarkMode
                                              ? "fill-slate-900 border-slate-700"
                                              : "fill-white border-gray-200",
                                          }}
                                        >
                                          <CiCircleInfo className={`w-4 h-4 mr-1 cursor-pointer ${isDarkMode ? 'text-emerald-400' : 'text-emerald-500'}`} />
                                        </Tooltip>
                                        <input
                                          type="text"
                                          inputMode="decimal"
                                          className={`w-24 px-2 py-1 rounded border text-right font-bold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-emerald-400' : 'bg-white border-emerald-200 text-emerald-700'} focus:outline-none focus:ring-2 focus:ring-emerald-400`}
                                          value={(() => {
                                            // Show the raw string if user is editing, otherwise show number
                                            const found = editedPrices.find(p => p.compare_id === vendor.compare_id);
                                            if (typeof found?.rawPrice === 'string') return found.rawPrice;
                                            if (typeof found?.price === 'number' && !isNaN(found.price)) return found.price === 0 ? '' : String(found.price);
                                            if (typeof vendor.price === 'number' && vendor.price !== null && !isNaN(vendor.price)) return vendor.price === 0 ? '' : String(vendor.price);
                                            return '';
                                          })()}
                                          onClick={e => e.stopPropagation()}
                                          onFocus={e => {
                                            e.stopPropagation();
                                          }}
                                          onBlur={() => {
                                            // On blur, parse and save as number, remove rawPrice
                                            const found = editedPrices.find(p => p.compare_id === vendor.compare_id);
                                            const val = found?.rawPrice ?? '';
                                            const num = Number(val);
                                            setEditedPrices(prev => {
                                              const exists = prev.find(p => p.compare_id === vendor.compare_id);
                                              if (exists) {
                                                return prev.map(p => p.compare_id === vendor.compare_id ? { ...p, price: isNaN(num) ? 0 : num, rawPrice: undefined } : p);
                                              } else {
                                                return [...prev, { compare_id: vendor.compare_id, price: isNaN(num) ? 0 : num }];
                                              }
                                            });
                                            if (typeof handlePriceBlur === 'function') handlePriceBlur();
                                          }}
                                          onChange={e => {
                                            let val = e.target.value;
                                            // Allow only digits and one dot
                                            val = val.replace(/[^\d.]/g, '');
                                            // Only one dot allowed
                                            const parts = val.split('.');
                                            if (parts.length > 2) val = parts[0] + '.' + parts.slice(1).join('');
                                            // Remove leading zeros from integer part (except for 0. cases)
                                            if (/^0\d+/.test(val)) val = val.replace(/^0+/, '');
                                            // Prevent negative
                                            if (val.startsWith('-')) val = val.replace(/^-+/, '');
                                            setEditedPrices(prev => {
                                              const exists = prev.find(p => p.compare_id === vendor.compare_id);
                                              if (exists) {
                                                return prev.map(p => p.compare_id === vendor.compare_id ? { ...p, rawPrice: val } : p);
                                              } else {
                                                return [...prev, { compare_id: vendor.compare_id, rawPrice: val }];
                                              }
                                            });
                                          }}
                                          disabled={isDisabled}
                                        />
                                      </span>
                                      {/* <span>฿</span> */}
                                    </span>
                                  </td>
                                  {/* DISCOUNT EDIT */}
                                  <td className={`px-2 py-2 text-sm font-bold text-center ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                    <div className="flex flex-col items-center w-[140px] mx-auto min-h-[48px] justify-center">
                                      {(() => {
                                        const currentDiscounts = editedPrices.find(p => p.compare_id === vendor.compare_id)?.discounts || vendor.discount || [];

                                        // ถ้ายังไม่มี discount ให้ปุ่มเพิ่มอยู่ตรงกลาง
                                        if (currentDiscounts.length === 0) {
                                          return (
                                            <div className="flex justify-center items-center min-h-[48px]">
                                              {!isDisabled && (
                                                <button
                                                  type="button"
                                                  className={`w-7 h-7 rounded-full text-base leading-none opacity-70 hover:opacity-100 transition-all ${isDarkMode
                                                    ? 'bg-orange-600/50 text-orange-300 hover:bg-orange-500'
                                                    : 'bg-orange-300 text-orange-700 hover:bg-orange-400'
                                                    }`}
                                                  onClick={e => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    setEditedPrices(prev => {
                                                      const exists = prev.find(p => p.compare_id === vendor.compare_id);
                                                      if (exists) {
                                                        return prev.map(p => p.compare_id === vendor.compare_id
                                                          ? { ...p, discounts: [0] }
                                                          : p
                                                        );
                                                      } else {
                                                        return [...prev, { compare_id: vendor.compare_id, discounts: [0] }];
                                                      }
                                                    });
                                                  }}
                                                  title="เพิ่มส่วนลด"
                                                  disabled={isDisabled}
                                                >+</button>
                                              )}
                                            </div>
                                          );
                                        }

                                        // จัดกลุ่มส่วนลดเป็นบรรทัดละ 2 รายการ
                                        const discountRows = [];
                                        for (let i = 0; i < currentDiscounts.length; i += 2) {
                                          discountRows.push(currentDiscounts.slice(i, i + 2));
                                        }

                                        return (
                                          <div className="w-full space-y-1">
                                            {/* แสดงส่วนลดแต่ละบรรทัด */}
                                            {discountRows.map((row, rowIdx) => (
                                              <div key={rowIdx} className="flex items-center justify-center gap-1">
                                                {row.map((discount, colIdx) => {
                                                  const originalIdx = rowIdx * 2 + colIdx;
                                                  return (
                                                    <Tooltip
                                                      key={originalIdx}
                                                      content={`ส่วนลดลำดับที่ ${originalIdx + 1}: ${discount}%`}
                                                      showArrow={true}
                                                      placement="top"
                                                      classNames={{
                                                        content: isDarkMode
                                                          ? "text-xs bg-slate-900 text-orange-300 border border-slate-700 shadow-lg rounded"
                                                          : "text-xs bg-white text-orange-700 border border-orange-200 shadow-lg rounded",
                                                        arrow: isDarkMode
                                                          ? "fill-slate-900 border-slate-700"
                                                          : "fill-white border-orange-200",
                                                      }}
                                                    >
                                                      <div className={`flex items-center gap-0.5 rounded-md px-1.5 py-1 transition-all duration-200 ${isDarkMode
                                                        ? 'bg-slate-800/60 border border-slate-600/40 hover:bg-slate-700/70 hover:border-slate-500/60'
                                                        : 'bg-orange-50/80 border border-orange-200/60 hover:bg-orange-100/90 hover:border-orange-300/80'
                                                        }`}>
                                                        <input
                                                          type="number"
                                                          min={0}
                                                          max={100}
                                                          step={0.1}
                                                          className={`w-14 px-1 py-0.5 rounded text-center font-medium text-xs border-0 ${isDarkMode
                                                            ? 'bg-slate-900/80 text-orange-300 focus:bg-slate-800'
                                                            : 'bg-white/90 text-orange-700 focus:bg-white'
                                                            } focus:outline-none focus:ring-1 focus:ring-orange-400/30`}
                                                          value={discount}
                                                          onClick={e => e.stopPropagation()}
                                                          onFocus={e => e.target.select()}
                                                          onChange={e => {
                                                            let newValue = Number(e.target.value);
                                                            if (isNaN(newValue) || e.target.value === '') newValue = 0;
                                                            if (newValue > 100) newValue = 100;
                                                            setEditedPrices(prev => {
                                                              const exists = prev.find(p => p.compare_id === vendor.compare_id);
                                                              if (exists) {
                                                                const newDiscounts = [...(exists.discounts || [])];
                                                                newDiscounts[originalIdx] = newValue;
                                                                return prev.map(p => p.compare_id === vendor.compare_id ? { ...p, discounts: newDiscounts } : p);
                                                              } else {
                                                                const discounts = [...currentDiscounts];
                                                                discounts[originalIdx] = newValue;
                                                                return [...prev, { compare_id: vendor.compare_id, discounts }];
                                                              }
                                                            });
                                                          }}
                                                          disabled={isDisabled}
                                                        />
                                                        {/* <span className="text-xs opacity-60">%</span> */}
                                                        {currentDiscounts.length > 1 && !isDisabled && (
                                                          <button
                                                            type="button"
                                                            className={`w-3 h-3 rounded-full flex items-center justify-center text-xs leading-none opacity-40 hover:opacity-100 transition-opacity ${isDarkMode
                                                              ? 'bg-red-600/60 text-red-200 hover:bg-red-500'
                                                              : 'bg-red-300 text-red-700 hover:bg-red-400'
                                                              }`}
                                                            onClick={e => {
                                                              e.stopPropagation();
                                                              setEditedPrices(prev => {
                                                                return prev.map(p => {
                                                                  if (p.compare_id === vendor.compare_id) {
                                                                    const newDiscounts = [...(p.discounts || [])];
                                                                    newDiscounts.splice(originalIdx, 1);
                                                                    return { ...p, discounts: newDiscounts };
                                                                  }
                                                                  return p;
                                                                });
                                                              });
                                                            }}
                                                            title="ลบส่วนลด"
                                                          >×</button>
                                                        )}
                                                      </div>
                                                    </Tooltip>
                                                  );
                                                })}
                                              </div>
                                            ))}

                                            {/* ปุ่มเพิ่มส่วนลด */}
                                            {currentDiscounts.length < 6 && !isDisabled && (
                                              <div className="flex justify-center">
                                                <button
                                                  type="button"
                                                  className={`w-5 h-5 rounded-full text-xs leading-none opacity-50 hover:opacity-100 transition-all ${isDarkMode
                                                    ? 'bg-emerald-600/50 text-emerald-300 hover:bg-emerald-500'
                                                    : 'bg-emerald-300 text-emerald-700 hover:bg-emerald-400'
                                                    }`}
                                                  onClick={e => {
                                                    e.stopPropagation();
                                                    e.preventDefault();
                                                    setEditedPrices(prev => {
                                                      const exists = prev.find(p => p.compare_id === vendor.compare_id);
                                                      if (exists) {
                                                        return prev.map(p => p.compare_id === vendor.compare_id
                                                          ? { ...p, discounts: [...(p.discounts || []), 0] }
                                                          : p
                                                        );
                                                      } else {
                                                        return [...prev, { compare_id: vendor.compare_id, discounts: [...currentDiscounts, 0] }];
                                                      }
                                                    });
                                                  }}
                                                  title="เพิ่มส่วนลด"
                                                  disabled={isDisabled}
                                                >+</button>
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </td>
                                  {/* DELIVERY DATE */}
                                  <td className={`px-4 py-3 text-sm text-center ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {vendor.due_date ? new Date(vendor.due_date).toLocaleDateString('th-TH', {
                                      year: 'numeric',
                                      month: '2-digit',
                                      day: '2-digit'
                                    }) : '-'}
                                  </td>
                                </tr>
                                {/* Note Row - แถวหมายเหตุใต้แต่ละ vendor */}
                                {(editingNote === vendor.compare_id || (vendor.remark && vendor.remark.trim() !== '')) && (
                                  <tr className={`${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50/80'} border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'} ${isDisabled ? 'opacity-60' : ''}`}>
                                    <td className="px-4 py-2" />
                                    <td className="px-4 py-2" />
                                    <td className="px-4 py-2 flex justify-center" ><LuNotebookPen className={`w-4 h-4 ${isDisabled ? 'text-amber-400/100' : 'text-amber-600'}`} /></td>
                                    <td colSpan={6} className="px-4 py-2 text-xs align-top">
                                      {editingNote === vendor.compare_id ? (
                                        <div className="flex items-start gap-2">
                                          <textarea
                                            className={`flex-1 px-3 py-2 rounded-lg border text-sm resize-none ${isDarkMode
                                              ? 'bg-slate-900 border-slate-600 text-amber-300 focus:border-amber-500'
                                              : 'bg-white border-amber-300 text-amber-700 focus:border-amber-500'
                                              } focus:outline-none focus:ring-2 focus:ring-amber-400/30`}
                                            rows={2}
                                            placeholder="กรอกหมายเหตุ..."
                                            value={vendorNotes[vendor.compare_id] !== undefined ? vendorNotes[vendor.compare_id] : (vendor.remark || '')}
                                            onChange={(e) => {
                                              setVendorNotes(prev => ({
                                                ...prev,
                                                [vendor.compare_id]: e.target.value
                                              }));
                                            }}
                                            disabled={isDisabled}
                                            autoFocus
                                          />
                                          <div className="flex gap-1">
                                            <button
                                              onClick={() => saveCompareNote(vendorNotes[vendor.compare_id] !== undefined ? vendorNotes[vendor.compare_id] : (vendor.remark || ''), vendor.compare_id)}
                                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDarkMode
                                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                }`}
                                              disabled={isDisabled}
                                            >
                                              บันทึก
                                            </button>
                                            <button
                                              onClick={() => {
                                                setEditingNote(null);
                                                setVendorNotes(prev => {
                                                  const newNotes = { ...prev };
                                                  delete newNotes[vendor.compare_id];
                                                  return newNotes;
                                                });
                                              }}
                                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDarkMode
                                                ? 'bg-slate-600 hover:bg-slate-500 text-white'
                                                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                                                }`}
                                              disabled={isDisabled}
                                            >
                                              ยกเลิก
                                            </button>
                                          </div>
                                        </div>
                                      ) : (
                                        <span className={`${isDisabled ? (isDarkMode ? 'text-amber-300/100' : 'text-amber-600/100') : (isDarkMode ? 'text-white' : 'text-black')}`}>
                                          หมายเหตุ : {vendor.remark}
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          }) : (
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
                  <div className={`flex items-center py-3 px-4 border-t shrink-0 ${isDarkMode ? 'border-slate-700 bg-slate-800/90' : 'border-slate-200 bg-white'}`}>
                    {/* ปุ่มเพิ่ม Vendor ซ้ายสุด */}
                    <div className="w-full md:w-96 relative">
                      <div className="relative w-full">
                        {/* Dropdown ด้านบน input */}
                        {showDropdown && search && vendors.length > 0 && (
                          <div ref={dropdownRef} className={`absolute z-[9999] w-full border rounded-tl-xl rounded-bl-xl rounded-tr-md rounded-br-md shadow-lg mb-2 max-h-56 overflow-y-auto bottom-full smooth-scroll ${isDarkMode ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'} ${isDarkMode ? 'bg-slate-900/95 border-slate-700/50 backdrop-blur-sm' : 'bg-white border-purple-200'}`} style={{ zIndex: 9999 }}>
                            <div className="p-2">
                              <div className={`text-xs px-4 py-3 border-b rounded-t-lg ${isDarkMode ? 'text-slate-400 bg-slate-800/50' : 'text-purple-700 border-purple-200 bg-purple-100'}`}>
                                พบ {vendors.length} รายการ
                              </div>
                              {vendors.map((vendor, idx) => {
                                // Extract vendor code for compare
                                const vendorCode = vendor.split(' |')[0];
                                // Always use the latest compareData.compare_vendors for check
                                const isAlreadyAdded = Array.isArray(compareData?.compare_vendors) && compareData.compare_vendors.some(v => v.vendor_code === vendorCode);
                                return (
                                  <div
                                    key={vendor + '-' + idx}
                                    className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200 
                                      ${isAlreadyAdded || isInsertingVendor
                                        ? (isDarkMode ? 'bg-purple-900/40 border-l-4 border-purple-500 font-semibold text-purple-300 cursor-not-allowed opacity-70' : 'bg-purple-100 border-l-4 border-purple-500 font-semibold text-purple-800 cursor-not-allowed opacity-70')
                                        : (selectedVendors.includes(vendor)
                                          ? (isDarkMode ? 'bg-slate-700/50 border-l-4 border-purple-500 font-semibold text-purple-300' : 'bg-purple-100 border-l-4 border-purple-500 font-semibold text-purple-800')
                                          : (isDarkMode ? 'hover:bg-slate-800/50 text-slate-300 cursor-pointer' : 'hover:bg-purple-50 cursor-pointer'))
                                      }`}
                                    onClick={() => {
                                      if (isAlreadyAdded || isInsertingVendor) return;
                                      if (selectedVendors.includes(vendor)) {
                                        setSelectedVendors(selectedVendors.filter(p => p !== vendor));
                                      } else {
                                        setSelectedVendors([...selectedVendors, vendor]);
                                      }
                                    }}
                                    style={(isAlreadyAdded || isInsertingVendor) ? { pointerEvents: 'none' } : {}}
                                  >
                                    {isAlreadyAdded ? (
                                      <span className={`inline-block w-3 h-3 rounded-full mr-3 ${isDarkMode ? 'bg-purple-400' : 'bg-purple-500'}`} title="มีในตารางแล้ว"></span>
                                    ) : selectedVendors.includes(vendor) && (
                                      <span className={`inline-block w-3 h-3 rounded-full mr-3 ${isDarkMode ? 'bg-purple-400' : 'bg-purple-500'}`} title="Selected"></span>
                                    )}
                                    <span className={`${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{vendor}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        <input
                          ref={inputRef}
                          type="text"
                          placeholder="ค้นหา/เพิ่ม Vendor..."
                          className={`px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 text-sm w-full shadow-sm transition-all duration-200 pr-10 ${isDarkMode ? 'border-slate-600 focus:ring-purple-500/30 bg-slate-800/50 text-slate-200 placeholder-slate-500' : 'border-purple-300 focus:ring-purple-200 bg-white'}`}
                          value={search}
                          onChange={e => {
                            if (isVendorInputDisabled) return;
                            setSearch(e.target.value);
                          }}
                          onFocus={() => {
                            if (isVendorInputDisabled) return;
                            if (search && vendors.length > 0) setShowDropdown(true);
                          }}
                          disabled={isVendorInputDisabled}
                          readOnly={isVendorInputDisabled}
                        />
                        <button
                          type="button"
                          className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-white font-bold shadow transition-all duration-150 ${isVendorInputDisabled ? 'bg-gray-400 cursor-not-allowed opacity-60' : (isDarkMode ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer' : 'bg-purple-500 hover:bg-purple-600 cursor-pointer')}`}
                          style={{ zIndex: 2 }}
                          onClick={() => {
                            if (isVendorInputDisabled) return;
                            setShowCreateVendor(true);
                          }}
                          disabled={isVendorInputDisabled}
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
                        {/* <select
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
                        </select> */}
                        <Select
                          classNames={{
                            base: "w-35",
                            trigger: [
                              "px-3",
                              "py-1.5",
                              "min-h-[2.2rem]",
                              "text-sm",
                              "rounded",
                              "border",
                              "shadow-sm",
                              "transition-colors",
                              isDarkMode
                                ? "bg-slate-800 border-slate-600 text-slate-200 focus:border-slate-500 hover:border-slate-500"
                                : "bg-white border-slate-300 text-slate-700 focus:border-slate-400 hover:border-slate-400",
                            ],
                            value: "text-sm",
                            selectorIcon: [
                              "right-2",
                              isDarkMode ? "text-slate-400" : "text-slate-500"
                            ],
                            popoverContent: [
                              "rounded-lg",
                              "shadow-lg",
                              isDarkMode
                                ? "bg-slate-900 border-slate-600"
                                : "bg-white border-slate-300",
                            ],
                          }}
                          variant="bordered"
                          size="sm"
                          radius="sm"
                          selectedKeys={[String(rowsPerPage)]}
                          onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0] as string | undefined;
                            if (selected) {
                              setRowsPerPage(Number(selected));
                              setPurchasePage(1);
                            }
                          }}
                        >
                          {rowsPerPageOptions.map((option) => (
                            <SelectItem
                              key={option.key}
                              className={`rounded-md my-0.5 px-2 py-1.5 ${isDarkMode
                                ? "text-slate-200 hover:bg-slate-700 data-[selected=true]:bg-slate-700 data-[selected=true]:text-slate-100"
                                : "text-slate-700 hover:bg-slate-100 data-[selected=true]:bg-slate-100 data-[selected=true]:text-slate-900"
                                }`}
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </Select>
                      </div>
                      {/* Pagination info และปุ่มเลื่อนหน้า */}
                      <div className={`flex items-center border rounded shadow-sm overflow-hidden ${isDarkMode ? 'border-slate-600 bg-slate-800' : 'border-slate-300 bg-white'}`}>
                        {/* Save Compare Price */}
                        <button
                          type="button"
                          className={`px-3 py-1.5 font-medium transition-colors flex items-center justify-center
                            ${isVendorInputDisabled
                              ? `${isDarkMode ? 'text-slate-500' : 'text-slate-400'} opacity-50 cursor-not-allowed !hover:cursor-not-allowed`
                              : isDarkMode
                                ? 'text-green-400 hover:bg-green-700/30 hover:text-white cursor-pointer'
                                : 'text-green-700 hover:bg-green-100 hover:text-green-900 cursor-pointer'}
                          `}
                          disabled={isVendorInputDisabled}
                          onClick={() => {
                            // Save prices for ALL vendors (no selection required)
                            saveAllComparePrices();
                          }}
                          aria-label="Save Compare Price"
                        >
                          <FaSave className="inline-block text-lg align-middle" />
                        </button>
                        {/* Pagination Info */}
                        <div className={`px-3 py-1.5 text-sm border-r border-l ${isDarkMode ? 'text-slate-300 bg-slate-700 border-slate-600' : 'text-slate-600 bg-slate-50 border-slate-300'}`}>
                          {(() => {
                            // เปลี่ยนมานับจากจำนวนผู้ขาย (compareData.compare_vendors)
                            const vendorCount = Array.isArray(compareData?.compare_vendors) ? compareData.compare_vendors.length : 0;
                            const startRow = vendorCount === 0 ? 0 : ((purchasePage - 1) * rowsPerPage + 1);
                            const endRow = Math.min(purchasePage * rowsPerPage, vendorCount);
                            return (
                              <>
                                <span className={`font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>{startRow}-{endRow}</span> of {vendorCount}
                              </>
                            );
                          })()}
                        </div>
                        {/* Pagination Buttons */}
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
                            disabled={(() => {
                              const vendorCount = Array.isArray(compareData?.compare_vendors) ? compareData.compare_vendors.length : 0;
                              const lastPage = Math.ceil(vendorCount / rowsPerPage) || 1;
                              return purchasePage >= lastPage;
                            })()}
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

              {/* ANCHOR Summary Tab */}
              {!loading && !error && activeTab === 'summary' && (
                <div className={`backdrop-blur-sm rounded-2xl shadow-xl border overflow-hidden flex-1 ${isDarkMode ? 'bg-slate-800/90 border-slate-700/60' : 'bg-white/90 border-white/40'}`}>
                  <div className={`bg-gradient-to-r px-8 py-4 border-b ${isDarkMode ? 'from-blue-900/60 to-indigo-900/60 border-blue-700/60' : 'from-blue-50 to-indigo-50 border-blue-200/60'}`}>
                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>ผลสรุปข้อมูลที่เลือก</h3>
                  </div>
                  {selectedRowData ? (
                    <div className="flex flex-col h-full">
                      <div className={`smooth-scroll ${isDarkMode ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'} overflow-y-auto max-h-[calc(100vh-400px)] grid grid-cols-1 lg:grid-cols-2 gap-4 p-4`}>
                        {/* Column 1 (Left) - ข้อมูลการขอซื้อ */}
                        <div className="space-y-4">
                          <div className={`bg-gradient-to-br p-4 rounded-xl border shadow-md ${isDarkMode ? 'from-slate-700/50 to-slate-800/50 border-slate-600/60' : 'from-slate-50 to-white border-slate-200/60'}`}>
                            <div className="flex items-center space-x-2 mb-4">
                              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-emerald-900/50' : 'bg-emerald-100'}`}>
                                <svg className={`w-4 h-4 ${isDarkMode ? 'text-emerald-300' : 'text-emerald-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <h4 className={`text-lg font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>ข้อมูลการขอซื้อ</h4>
                            </div>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                  <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>PR เลขที่</label>
                                  <div className={`text-sm font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{prNumber || '-'}</div>
                                </div>
                                <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                  <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>PO เลขที่</label>
                                  <div className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{selectedRowData?.po_no || 'รอดำเนินการ'}</div>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-3">
                                <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                  <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>จำนวน</label>
                                  <div className={`flex justify-between text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                                    {!editingQty ? (
                                      <>
                                        {Array.isArray(qtyHistory) && qtyHistory.length > 0
                                          ? qtyHistory[qtyHistory.length - 1]?.qty ?? '-'
                                          : qtyValue || '-'}
                                        {(roleID === 4 || roleID === 5) && (
                                          <button
                                            aria-label="แก้ไขจำนวน"
                                            type="button"
                                            className={`ml-2 px-2 py-1 rounded text-xs font-normal border ${isDarkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700' : 'border-slate-300 text-slate-700 hover:bg-slate-100'}`}
                                            onClick={() => setEditingQty(true)}
                                            style={{ marginLeft: 8 }}
                                          >
                                            แก้ไข
                                          </button>
                                        )}
                                      </>
                                    ) : (
                                      <>
                                        <input
                                          type="number"
                                          min={0}
                                          value={qtyValue}
                                          onChange={e => setQtyValue(e.target.value)}
                                          className={`w-20 px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 ${isDarkMode ? 'border-slate-600 bg-slate-700 text-gray-100' : 'border-gray-300 bg-white text-gray-900'}`}
                                          style={{ marginRight: 8 }}
                                        />
                                        <button
                                          aria-label="บันทึกจำนวน"
                                          type="button"
                                          className={`px-1.5 py-1 cursor-pointer rounded text-xs font-normal border ${isDarkMode ? 'border-green-600 text-green-300 hover:bg-green-900/30' : 'border-green-300 text-green-700 hover:bg-green-50'}`}
                                          onClick={() => {
                                            // TODO: Call API to update qty here if needed
                                            handleQtyChange();
                                          }}
                                          style={{ marginRight: 4 }}
                                        >
                                          <FaSave className="inline-block text-lg align-middle" />
                                        </button>
                                        <button
                                          aria-label="ยกเลิกแก้ไขจำนวน"
                                          type="button"
                                          className={`px-1.5 py-1 cursor-pointer rounded text-xs font-normal border ${isDarkMode ? 'border-red-600 text-red-300 hover:bg-red-900/30' : 'border-red-300 text-red-700 hover:bg-red-50'}`}
                                          onClick={() => {
                                            // รีเซ็ตจากข้อมูลที่ตรงกับ pr_list_id
                                            const currentItem = compareData?.part_inventory_and_pr?.find(item => item.pr_list_id === pr_list_id);
                                            setQtyValue(currentItem?.qty?.toString() || qty?.toString() || '');
                                            setEditingQty(false);
                                          }}
                                        >
                                          <GiCancel className="inline-block text-lg align-middle" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                  <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>หน่วย</label>
                                  <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{unit || '-'}</div>
                                </div>
                                <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                  <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>แผนก</label>
                                  <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{department || '-'}</div>
                                </div>
                              </div>
                              <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>รหัสสินค้า</label>
                                <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{selectedRowData.prod_code || '-'}</div>
                              </div>
                              <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>รายละเอียด</label>
                                <div className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'} line-clamp-2`}>{selectedRowData.prod_detail || '-'}</div>
                              </div>
                            </div>
                          </div>
                          {/* เหตุผลการขอซื้อ */}
                          <div className={`bg-gradient-to-br p-4 rounded-xl border shadow-md ${isDarkMode ? 'from-slate-700/50 to-slate-800/50 border-slate-600/60' : 'from-slate-50 to-white border-slate-200/60'}`}>
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
                              {/* <select
                                value={selectedReason}
                                onChange={(e) => {
                                  setSelectedReason(e.target.value);
                                  if (e.target.value !== '11') setCustomReason("");
                                }}
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
                                <option value="11">11. อื่นๆ</option>
                              </select>
                              {selectedReason === '11' && (
                                <div className="mt-4">
                                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
                                    โปรดระบุเหตุผลเพิ่มเติม
                                  </label>
                                  <input
                                    type="text"
                                    value={customReason}
                                    onChange={e => setCustomReason(e.target.value)}
                                    className={`w-full p-3 border-2 rounded-xl focus:outline-none focus:ring-4 text-sm font-medium transition-all duration-200 ${isDarkMode ? 'border-indigo-600 bg-slate-800 text-slate-200 focus:border-indigo-400 focus:ring-indigo-900/30' : 'border-indigo-200 bg-white text-slate-700 focus:border-indigo-500 focus:ring-indigo-100'}`}
                                    placeholder="กรุณาระบุเหตุผลของคุณ"
                                  />
                                </div>
                              )} */}
                              <Select
                                placeholder="-- กรุณาเลือกเหตุผลในการเลือกผู้ขาย --"
                                classNames={{
                                  base: "w-full",
                                  label: "font-semibold text-sm",
                                  trigger: [
                                    "p-4",
                                    "min-h-[3.5rem]",
                                    "text-sm",
                                    "font-medium",
                                    "rounded-xl",
                                    "border-2",
                                    "transition-all",
                                    "duration-200",
                                    isDarkMode
                                      ? "bg-slate-800 border-indigo-600 text-slate-200 focus:border-indigo-400 hover:border-indigo-500"
                                      : "bg-white border-indigo-200 text-slate-700 focus:border-indigo-500 hover:border-indigo-300",
                                  ],
                                  value: "text-sm font-medium",
                                  mainWrapper: "w-full",
                                  innerWrapper: "pr-0",
                                  selectorIcon: [
                                    "right-4",
                                    "text-indigo-500"
                                  ],
                                  listboxWrapper: [
                                    "max-h-[400px]",
                                    isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar-light"
                                  ],
                                  popoverContent: [
                                    "rounded-xl",
                                    "shadow-xl",
                                    "border-2",
                                    isDarkMode
                                      ? "bg-slate-800 border-indigo-600"
                                      : "bg-white border-indigo-200",
                                  ],
                                }}
                                variant="bordered"
                                size="lg"
                                radius="lg"
                                scrollShadowProps={{
                                  isEnabled: true
                                }}
                                selectedKeys={selectedReason ? [selectedReason] : []}
                                onSelectionChange={(keys) => {
                                  const selected = Array.from(keys)[0] as string | undefined;
                                  setSelectedReason(selected ?? "");
                                  if (selected !== "11") setCustomReason("");
                                }}
                              >
                                {reasonOptions.map((reason) => (
                                  <SelectItem
                                    key={reason.key}
                                    className={`rounded-lg my-1 px-3 py-2 ${isDarkMode
                                      ? "text-slate-200 hover:bg-slate-700/50 data-[selected=true]:bg-indigo-500/20 data-[selected=true]:text-indigo-300"
                                      : "text-slate-700 hover:bg-indigo-50 data-[selected=true]:bg-indigo-100 data-[selected=true]:text-indigo-700"
                                      }`}
                                  >
                                    {reason.label}
                                  </SelectItem>
                                ))}
                              </Select>

                              {selectedReason === "11" && (
                                <div className="mt-4">
                                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-800'}`}>
                                    โปรดระบุเหตุผลเพิ่มเติม
                                  </label>
                                  <Input
                                    type="text"
                                    value={customReason}
                                    onChange={(e) => setCustomReason(e.target.value)}
                                    placeholder="กรุณาระบุเหตุผลของคุณ"
                                    classNames={{
                                      base: "w-full",
                                      inputWrapper: [
                                        "p-3",
                                        "border-2",
                                        "rounded-xl",
                                        "transition-all",
                                        "duration-200",
                                        isDarkMode
                                          ? "bg-slate-800 border-indigo-600 focus-within:border-indigo-400 hover:border-indigo-500"
                                          : "bg-white border-indigo-200 focus-within:border-indigo-500 hover:border-indigo-300",
                                      ],
                                      input: [
                                        "text-sm",
                                        "font-medium",
                                        isDarkMode ? "text-slate-200" : "text-slate-700"
                                      ]
                                    }}
                                    variant="bordered"
                                    size="md"
                                    radius="lg"
                                  />
                                </div>
                              )}

                              {selectedReason && (
                                <div className={`p-4 rounded-xl border-2 mt-3 ${isDarkMode
                                  ? 'bg-slate-800/50 border-indigo-600/50 text-slate-300'
                                  : 'bg-indigo-50 border-indigo-200 text-indigo-900'
                                  }`}>
                                  <p className="text-sm font-semibold mb-1">เหตุผลที่เลือก:</p>
                                  <p className="text-sm">
                                    {selectedReason === "11"
                                      ? customReason || "กรุณาระบุเหตุผล"
                                      : reasonOptions.find(r => r.key === selectedReason)?.label}
                                  </p>
                                </div>
                              )}
                            </div>
                            {/* Action buttons */}
                            {(roleID === 4 || roleID === 5) && (
                              <div className={`flex justify-end space-x-3 mt-6 pt-4 border-t ${isDarkMode ? 'border-indigo-700/50' : 'border-indigo-200'}`}>
                                <button
                                  aria-label="ล้างการเลือกเหตุผล"
                                  type="button"
                                  className={`px-6 py-2.5 border-2 rounded-xl transition-all duration-200 text-sm font-semibold ${isDarkMode ? 'bg-slate-800 text-indigo-400 border-indigo-600 hover:bg-slate-700 hover:border-indigo-500' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300'}`}
                                  onClick={() => setSelectedReason("")}
                                >
                                  ล้างการเลือก
                                </button>
                                <button
                                  aria-label="บันทึกเหตุผล"
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
                            )}
                          </div>
                        </div>
                        {/* Column 2 (Right) - ข้อมูลผู้ขาย + สถานะและข้อมูลเพิ่มเติม */}
                        <div className="space-y-4">
                          {selectedRowData.selectedVendor && (
                            <div className={`bg-gradient-to-br p-4 rounded-xl border shadow-md ${isDarkMode ? 'from-slate-700/50 to-slate-800/50 border-slate-600/60' : 'from-slate-50 to-white border-slate-200/60'}`}>
                              <div className="flex items-center space-x-2 mb-4">
                                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-900/50' : 'bg-purple-100'}`}>
                                  <svg className={`w-4 h-4 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                  </svg>
                                </div>
                                <h4 className={`text-lg font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-700'}`}>ข้อมูลผู้ขาย</h4>
                              </div>
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                    <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>รหัสผู้ขาย</label>
                                    <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{selectedRowData.selectedVendor.vendor_code || '-'}</div>
                                  </div>
                                  <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                    <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>เครดิต</label>
                                    <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{selectedRowData.selectedVendor.credit_term || '-'}</div>
                                  </div>
                                </div>
                                <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                  <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ชื่อผู้ขาย</label>
                                  <div className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{selectedRowData.selectedVendor.vendor_name || '-'}</div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                    <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>เบอร์โทร</label>
                                    <div className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{selectedRowData.selectedVendor.tel || '-'}</div>
                                  </div>
                                  <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                    <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>อีเมล</label>
                                    <div className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'} truncate`}>{selectedRowData.selectedVendor.email || '-'}</div>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                    <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ราคา</label>
                                    <div className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{
                                      (() => {
                                        const found = editedPrices.find(p => p.compare_id === selectedRowData.selectedVendor.compare_id);
                                        const price = typeof found?.price === 'number' ? found.price : selectedRowData.selectedVendor.price;
                                        return price ? `฿ ${price.toLocaleString()}` : '-';
                                      })()
                                    }</div>
                                  </div>
                                  <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                    <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ส่วนลด %</label>
                                    <div className={`text-sm font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>{
                                      (() => {
                                        const found = editedPrices.find(p => p.compare_id === selectedRowData.selectedVendor.compare_id);
                                        const discounts = Array.isArray(found?.discounts) ? found.discounts : (Array.isArray(selectedRowData.selectedVendor.discount) ? selectedRowData.selectedVendor.discount : [0]);
                                        return discounts && discounts.length > 0 ? discounts.map(d => `${d}`).join(', ') : '0';
                                      })()
                                    }</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className={`bg-gradient-to-br p-4 rounded-xl border shadow-md ${isDarkMode ? 'from-slate-700/50 to-slate-800/50 border-slate-600/60' : 'from-slate-50 to-white border-slate-200/60'}`}>
                            <div className="flex items-center space-x-2 mb-4">
                              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-orange-900/50' : 'bg-orange-100'}`}>
                                <svg className={`w-4 h-4 ${isDarkMode ? 'text-orange-300' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h4 className={`text-lg font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-700'}`}>สถานะและข้อมูลเพิ่มเติม</h4>
                            </div>
                            <div className="space-y-4">
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                  <label className={`block text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>วันที่ส่งมอบ</label>
                                  <div className="relative w-full">
                                    <DatePicker

                                      selected={deliveryDate ? new Date(deliveryDate) : (
                                        compareData?.compare_vendors && compareData.compare_vendors.length > 0 && compareData.compare_vendors[0].date_shipped
                                          ? new Date(compareData.compare_vendors[0].date_shipped)
                                          : null
                                      )}
                                      onChange={handleDeliveryDateChange}
                                      dateFormat="dd/MM/yyyy"
                                      placeholderText="เลือกวันที่"
                                      className={`px-3 py-2 pr-10 border rounded-lg text-sm text-center focus:outline-none focus:ring-2 transition-all duration-200 ${isDarkMode ? 'border-slate-600 bg-slate-800 text-slate-200 focus:ring-orange-500/30 focus:border-orange-500' : 'border-slate-300 bg-white text-slate-800 focus:ring-orange-500 focus:border-orange-500'}`}
                                      calendarClassName={isDarkMode ? 'react-datepicker-orange-dark' : 'react-datepicker-orange'}
                                      popperClassName="z-[9999]"
                                      popperPlacement="bottom-start"
                                    />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                      <FaRegCalendarAlt className={`w-4 h-4 ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`} />
                                    </span>
                                  </div>
                                </div>
                                <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                  <label className={`block text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>วันที่ต้องการใช้สินค้า</label>
                                  <div className={`px-3 py-2 border rounded-lg text-sm text-center ${isDarkMode ? 'border-slate-600 bg-slate-800 text-slate-200' : 'border-slate-300 bg-white text-slate-800'}`}>
                                    {(() => {
                                      const dueDate = compareData?.compare_vendors && compareData.compare_vendors.length > 0 && compareData.compare_vendors[0].due_date;
                                      return dueDate ? new Date(dueDate).toLocaleDateString('th-TH') : '-';
                                    })()}
                                  </div>
                                </div>
                              </div>
                              <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                <label className={`block text-xs font-semibold mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>วันที่ดำเนินการเปรียบเทียบ</label>
                                <div className={`px-3 py-2 border rounded-lg text-sm text-center ${isDarkMode ? 'border-slate-600 bg-slate-800 text-slate-200' : 'border-slate-300 bg-white text-slate-800'}`}>
                                  {selectedRowData.date_compare ? (() => {
                                    // ดึงเฉพาะวันที่จาก string เช่น "2025-10-13T04:01:38Z" => "2025-10-13"
                                    const dateStr = selectedRowData.date_compare.split('T')[0];
                                    const [year, month, day] = dateStr.split('-');
                                    // แปลงเป็นวันที่ไทยเอง (dd/mm/yyyy) เพื่อเลี่ยง timezone shift
                                    return `${Number(day)}/${Number(month)}/${Number(year) + 543}`;
                                  })() : '-'}
                                </div>
                              </div>
                              {compareData?.requester_name && (
                                <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                  <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ผู้ร้องขอ</label>
                                  <div className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{compareData.requester_name}</div>
                                </div>
                              )}
                              {compareData?.pu_responsible && (
                                <div className={`p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                                  <label className={`block text-xs font-semibold mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>ผู้จัดทำ</label>
                                  <div className={`text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{compareData.pu_responsible}</div>
                                </div>
                              )}
                            </div>
                          </div>
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
      </div >
      {/* Open Modal */}
      {
        showCreateVendor && (
          <CreateVendor
            pcl_id={compareData?.pcl_id}
            onCancel={() => setShowCreateVendor(false)}
            onConfirm={() => {
              setShowCreateVendor(false);
              // รีโหลดข้อมูลใหม่และไปที่ tab เปรียบเทียบราคา
              if (typeof fetchCompareData === 'function') fetchCompareData();
              setActiveTab('compare');
            }}
          />
        )
      }
      {
        showEditVendor && (
          <EditVendor
            vendorData={editVendorData ? {
              ...editVendorData,
              tax_id: editVendorData.tax_id ?? undefined,
              fax_no: editVendorData.fax_no ?? undefined,
              email: editVendorData.email ?? undefined,
              tel: editVendorData.tel_no ?? undefined,
              contact_name: editVendorData.contact_person ?? undefined,
            } : undefined}
            source="PRModal"
            onCancel={() => setShowEditVendor(false)}
            onConfirm={() => {
              setShowEditVendor(false);
              if (typeof fetchCompareData === 'function') fetchCompareData();
              setActiveTab('compare');
            }}
          />
        )
      }
      {
        showRejectModal && (
          <RejectCompare
            open={showRejectModal}
            onClose={() => setShowRejectModal(false)}
            onConfirm={handleConfirmRejectCompare}
            reason={rejectReason}
            setReason={setRejectReason}
          />
        )
      }

      {
        showChartsModal && (
          <ChartsModal
            isDarkMode={isDarkMode}
            onClose={() => setShowChartsModal(false)}
            partNo={partNo}
            pr_list_id={pr_list_id}
          />
        )
      }

    </>
  );
};

export default PRModal;