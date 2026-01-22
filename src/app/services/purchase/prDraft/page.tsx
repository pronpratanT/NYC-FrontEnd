'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from "next/navigation";
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import "@/app/styles/react-datepicker-dark.css";
import "@/app/styles/react-datepicker-light.css";
import "@/app/styles/react-datepicker-orange.css";
import { FaRegCalendarAlt } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import { IoReloadOutline } from "react-icons/io5";
import { useTheme } from '../../../components/ThemeProvider';
import { BsCalendar2Event } from "react-icons/bs";
import { MdOutlineGroups3 } from "react-icons/md";
import { IoDocumentTextOutline } from "react-icons/io5";
import Sidebar from '@/app/components/sidebar';
import Header from '@/app/components/header';
import { useSidebar } from '@/app/context/SidebarContext';
import { useUser } from '../../../context/UserContext';
import { useToken } from '../../../context/TokenContext';
import { TiPlus } from "react-icons/ti";
import CreatPartNo from '@/app/components/Modal/CreatPartNo';
import DraftPRModal from '@/app/components/Modal/Draft_PR';

// hero ui
import { Select, SelectSection, SelectItem } from "@heroui/select";

type partData = {
    part_no: string | null;
    part_name: string | null;
    prod_code: string | null;
    qty: number | null;
    unit: string | null;
    vendor: string | null;
    rempo: string | null;
    stock: number | null;
    price_per_unit: number | null;
}

type partDataNew = {
    concat: string;
    rempo: string | null;
}

type Unit = {
    measure_name: string;
}

type Part = {
    pcl_id: number;
    pr_list_id: number;
    part_no: string;
    prod_code: string;
    part_name: string;
    qty: number;
    unit: string;
    stock: number;
    objective: string;
    plant: string;
    vendor: string;
    price_per_unit: number;
    ordered: string;
};

// เปลี่ยน type PRs เป็น object
type PRs = {
    pr_id: number;
    pr_no: string;
    pr_date: string;
    dept_name: string;
    dept_short: string;
    dept_id: number;
    manager_approve: boolean;
    supervisor_approve: boolean;
    pu_operator_approve: boolean;
    supervisor_reject_at: string | null;
    manager_reject_at: string | null;
    pu_operator_reject_at: string | null;
    reason_reject: string | null;
    count_ordered: number;
    pr_lists: Part[];
};

type List = {
    id: number;
    member_id: number;
    pcl_id: number;
    pr_list_id: number; // id รายการ PR ในฐานข้อมูล (ใช้สำหรับลบ/อัปเดต)
    part_no: string;
    prod_code: string;
    part_name: string;
    objective: string;
    qty: number;
    unit: string;
    vendor: string;
    stock: number;
    price_per_unit: number;
    plant: string;
    status: string;
    due_date: string;
    free_item: FreeItems[];
}

type FreeItems = {
    free_item_id: number;
    pcl_id: number;
    part_no: string;
    prod_code: string;
    part_name: string;
    qty: number;
    remark: string;
}

import { Suspense } from 'react';

function PRDraftContent() {
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

    const { isCollapsed, isMobile } = useSidebar();
    const router = useRouter();
    // สร้างหมายเลข PR mock: PR-YY-X000
    function getMockPRNo() {
        const year = new Date().getFullYear().toString().slice(-2); // ปีสองหลัก
        return `PR${year}X000`;
    }
    const { isDarkMode } = useTheme();
    const [partNos, setPartNos] = useState<partDataNew[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [search, setSearch] = useState<string>("");
    const [selectedParts, setSelectedParts] = useState<string[]>([]);
    const [rowDueDates, setRowDueDates] = useState<(Date | null)[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const token = useToken();
    const [partsInfo, setPartsInfo] = useState<partData[]>([]);
    const [qtyData, setQtyData] = useState<(string | number)[]>([]);
    const [objectiveData, setObjectiveData] = useState<string[]>([]);
    const [destinationData, setDestinationData] = useState<string[]>([]);
    const [stockData, setStockData] = useState<string[]>([]);
    const [priceData, setPriceData] = useState<string[]>([]);
    const [unitData, setUnitData] = useState<string[]>([]);
    const [rempoData, setRempoData] = useState<string[]>([]);
    const [prListIds, setPrListIds] = useState<number[]>([]);
    const [isSaving, setIsSaving] = useState(false)

    // create PR modal
    const [draftModalOpen, setDraftModalOpen] = useState(false);

    // unit data from API
    const [unitOptions, setUnitOptions] = useState<Unit[]>([]);

    // Pagination
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;
    const totalPages = Math.ceil(selectedParts.length / rowsPerPage);
    const pagedParts = selectedParts.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    const pagedDueDates = rowDueDates.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    const pagedQty = qtyData.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    const pagedObjective = objectiveData.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    // Create Part No. Modal
    const [showCreatPartNo, setShowCreatPartNo] = useState(false);

    const isSelectedPartsEmpty = selectedParts.length === 0;

    const [prData, setPrData] = useState<PRs | null>(null);
    const [error, setError] = useState<string>("");
    const searchParams = useSearchParams();
    const prId = searchParams.get("id");

    const fetchData = async () => {
        try {
            setError("");
            setLoading(true);
            if (!token) throw new Error("กรุณาเข้าสู่ระบบก่อน");

            // Fetch PR data
            const prRes = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pr/request/list?pr_id=${prId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!prRes.ok) throw new Error("โหลดข้อมูล PR ไม่สำเร็จ");
            const prJson = await prRes.json();
            if (prJson.data && Array.isArray(prJson.data.pr_lists)) {
                const prLists = prJson.data.pr_lists;
                const partNoFirstIndex = new Map();
                prLists.forEach((item: List, idx: number) => {
                    if (!partNoFirstIndex.has(item.part_no)) {
                        partNoFirstIndex.set(item.part_no, idx);
                    }
                });
                prLists.sort((a: List, b: List) => {
                    const aIdx = partNoFirstIndex.get(a.part_no);
                    const bIdx = partNoFirstIndex.get(b.part_no);
                    if (a.part_no === b.part_no) return 0;
                    return aIdx - bIdx;
                });

                // Prefill table state from PR draft data
                // ใช้ part_no เป็น key หลักใน selectedParts
                const lists = prLists as List[];
                const selected = lists.map(item => item.part_no);
                setSelectedParts(selected);
                setPrListIds(lists.map(item => item.pr_list_id ?? 0));

                // เติมข้อมูลรายละเอียด part ให้ partsInfo
                setPartsInfo(lists.map(item => ({
                    part_no: item.part_no,
                    part_name: item.part_name ?? null,
                    prod_code: item.prod_code ?? null,
                    qty: item.qty ?? null,
                    unit: item.unit ?? null,
                    vendor: item.vendor ?? null,
                    rempo: item.objective ?? null,
                    stock: item.stock ?? null,
                    price_per_unit: item.price_per_unit ?? null,
                })));

                // QTY, Objective, Plant, Stock, Price, Unit, Due Date
                setQtyData(lists.map(item => item.qty ?? ""));
                setObjectiveData(lists.map(item => item.objective ?? ""));
                setDestinationData(lists.map(item => item.plant || "Plant 1"));
                setStockData(lists.map(item =>
                    item.stock !== undefined && item.stock !== null ? String(item.stock) : "0"
                ));
                setPriceData(lists.map(item =>
                    item.price_per_unit !== undefined && item.price_per_unit !== null
                        ? String(item.price_per_unit)
                        : "0"
                ));
                setUnitData(lists.map(item => item.unit ?? ""));
                setRempoData(lists.map(item => item.objective ?? ""));
                setRowDueDates(lists.map(item => item.due_date ? new Date(item.due_date) : null));
            }
            setPrData(prJson.data);
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

    useEffect(() => {
        if (!prId) {
            setError("ไม่พบ PR ID");
            setLoading(false);
            return;
        }
        fetchData();
    }, [prId, token]);

    useEffect(() => {
        if (!isSelectedPartsEmpty) return; // reset เฉพาะตอนที่ไม่มีรายการแล้วเท่านั้น
        setPartsInfo([]); // reset ข้อมูล part info
        setQtyData([]);   // reset QTY
        setObjectiveData([]); // reset objective
        setRowDueDates([]); // reset due dates
        setDestinationData([]); // reset destination
        setStockData([]); // reset stock
        setPriceData([]); // reset price
        setUnitData([]); // reset unit
        setRempoData([]); // reset rempo
        setPrListIds([]); // reset pr_list_id
    }, [isSelectedPartsEmpty]);

    useEffect(() => {
        // Sync ข้อมูลทั้งหมดกับ selectedParts
        setRowDueDates(r => selectedParts.map((_, idx) => r[idx] || null));
        setQtyData(q => selectedParts.map((_, idx) => q[idx] || ''));
        setObjectiveData(o => selectedParts.map((_, idx) => o[idx] || ''));
        setDestinationData(d => selectedParts.map((_, idx) => d[idx] || 'Plant 1'));
        setStockData(s => selectedParts.map((_, idx) => s[idx] || ''));
        setPriceData(p => selectedParts.map((_, idx) => p[idx] || ''));
        setUnitData(u => selectedParts.map((_, idx) => u[idx] || ''));
        setRempoData(r => selectedParts.map((_, idx) => r[idx] || ''));
        setPrListIds(ids => selectedParts.map((_, idx) => ids[idx] ?? 0));

        const fetchPartData = async () => {
            try {
                if (selectedParts.length === 0) {
                    setPartsInfo([]);
                    return;
                }

                // ใช้ functional update เพื่อหลีกเลี่ยง dependency
                setPartsInfo(currentPartsInfo => {
                    // เก็บข้อมูลเก่าไว้ก่อน
                    const existingPartsInfo = [...currentPartsInfo];

                    // หา part ที่ยังไม่มีข้อมูล
                    const existingPartNos = existingPartsInfo.map(p => p.part_no);
                    const newParts = selectedParts.filter(part => !existingPartNos.includes(part));

                    if (newParts.length === 0) {
                        // ถ้าไม่มี part ใหม่ให้ดึง แต่ยังต้อง filter เฉพาะ part ที่ถูกเลือกไว้
                        return existingPartsInfo.filter(p => typeof p.part_no === 'string' && selectedParts.includes(p.part_no));
                    }

                    // ฟังก์ชันตัดหลัง ' |' ออก
                    function formatPartForFetch(part: string) {
                        const idx = part.indexOf(' |');
                        return idx !== -1 ? part.slice(0, idx) : part;
                    }

                    (async () => {
                        const newPartsData: partData[] = [];

                        for (const part of newParts) {
                            const fetchPart = formatPartForFetch(part);
                            // console.log("Fetching data for part:", fetchPart);
                            // console.log("Original selected part:", part);
                            try {
                                const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pr/compare/lists/last?part_no=${encodeURIComponent(fetchPart)}`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                });

                                if (!response.ok) {
                                    console.warn(`No data found for part: ${fetchPart} (HTTP ${response.status})`);
                                    continue;
                                }

                                const json = await response.json();
                                console.log(`Fetched data for ${fetchPart}:`, json);

                                const data = Array.isArray(json.data) ? json.data : (json.data ? [json.data] : (Array.isArray(json) ? json : [json]));

                                data.forEach((item: partData) => {
                                    if (item && item.part_no === fetchPart) {
                                        const parsed: partData = {
                                            part_no: part, // ใช้ part เดิมจาก selectedParts เพื่อให้ตรงกับการ find ในตาราง
                                            part_name: item.part_name ?? null,
                                            prod_code: item.prod_code ?? null,
                                            qty: item.qty ?? null,
                                            unit: item.unit ?? null,
                                            vendor: item.vendor ?? null,
                                            rempo: item.rempo ?? null,
                                            stock: item.stock ?? null,
                                            price_per_unit: item.price_per_unit ?? null,
                                        };
                                        newPartsData.push(parsed);
                                        console.log("Added part data:", parsed);
                                    }
                                });

                            } catch (error) {
                                console.error(`Error fetching data for part ${fetchPart}:`, error);
                            }
                        }

                        // อัปเดตข้อมูลหลังจาก fetch เสร็จ
                        setPartsInfo(prev => {
                            const combinedPartsInfo = [...prev, ...newPartsData];
                            return combinedPartsInfo.filter(p => typeof p.part_no === 'string' && selectedParts.includes(p.part_no));
                        });

                    })();

                    // return ค่าเดิมก่อนเพื่อไม่ให้เกิด re-render
                    return existingPartsInfo.filter(p => typeof p.part_no === 'string' && selectedParts.includes(p.part_no));
                });

            } catch (error) {
                console.error("Error fetching part data:", error);
            }
        };

        fetchPartData();
    }, [selectedParts, token]); // ลบ partsInfo ออกเพื่อป้องกัน infinite loop

    const handleRowDueDateChange = (idx: number, date: Date | null) => {
        setRowDueDates(prev => {
            const arr = [...prev];
            arr[idx] = date;
            return arr;
        });
    };

    // Pattern สำหรับ Handler Function
    const handleQtyChange = (idx: number, value: string) => {
        setQtyData(prev => {
            const arr = [...prev];
            arr[idx] = value;
            return arr;
        });
    };

    // Pattern สำหรับ Handler Function
    const handleObjectiveChange = (idx: number, value: string) => {
        setObjectiveData(prev => {
            const arr = [...prev];
            arr[idx] = value;
            return arr;
        });
    };

    const handleUnitChange = (idx: number, value: string) => {
        setUnitData(prev => {
            const arr = [...prev];
            arr[idx] = value;
            return arr;
        });
    };

    useEffect(() => {
        if (!search) {
            setPartNos([]);
            setShowDropdown(false);
            return;
        }
        const fetchData = async () => {
            try {
                setLoading(true);
                // data fetch part no
                const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/inven?keyword=${encodeURIComponent(search)}`, {
                    cache: "no-store",
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error(`PartNo API error: HTTP ${response.status} ${response.statusText}`);
                }
                const data = await response.json();
                const arr: partDataNew[] = Array.isArray(data.data) ? data.data : [];
                setPartNos(arr);
                setShowDropdown(true);
                // unit options fetch
                const resUnit = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/measure-unit`, {
                    cache: "no-store",
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                });
                if (!resUnit.ok) {
                    throw new Error(`Unit API error: HTTP ${resUnit.status} ${resUnit.statusText}`);
                }
                const dataUnit = await resUnit.json();
                const unitArr = Array.isArray(dataUnit.data) ? dataUnit.data : [];
                setUnitOptions(unitArr);

            } catch (err: unknown) {
                if (err instanceof Error) {
                    // setError(err.message || "เกิดข้อผิดพลาดในการดึงข้อมูล");
                    console.error(err.message);
                } else {
                    // setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
                    console.error("เกิดข้อผิดพลาดในการดึงข้อมูล");
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [search, token]);

    useEffect(() => {
        if (!showDropdown) return;
        function handleClickOutside(event: MouseEvent) {
            if (
                inputRef.current && !inputRef.current.contains(event.target as Node) &&
                dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
            ) {
                setShowDropdown(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);

    // ฟังก์ชันลบแถว (ลบข้อมูลทุกชุดที่อิงตาม index เดียวกัน)
    const handleDeleteRow = (idx: number) => {
        setSelectedParts(prev => prev.filter((_, i) => i !== idx));
        setRowDueDates(prev => prev.filter((_, i) => i !== idx));
        setQtyData(prev => prev.filter((_, i) => i !== idx));
        setObjectiveData(prev => prev.filter((_, i) => i !== idx));
        setDestinationData(prev => prev.filter((_, i) => i !== idx));
        setStockData(prev => prev.filter((_, i) => i !== idx));
        setPriceData(prev => prev.filter((_, i) => i !== idx));
        setUnitData(prev => prev.filter((_, i) => i !== idx));
        setRempoData(prev => prev.filter((_, i) => i !== idx));
        setPrListIds(prev => prev.filter((_, i) => i !== idx));
    };

    const handleDelete = (idx: number) => {
        const confirmed = window.confirm('ต้องการลบรายการนี้หรือไม่?');
        if (!confirmed) return;

        const prlistid = prListIds[idx];
        if (prlistid && prlistid > 0) {
            // แถวที่มาจากฐานข้อมูล เดิมอยู่ใน PR draft
            handleDeleteItem(prlistid, idx);
        } else {
            // แถวที่เพิ่งเพิ่มใหม่ ยังไม่มีใน DB ลบแค่ใน state
            handleDeleteRow(idx);
        }
    };

    const handleDestinationChange = (idx: number, value: string) => {
        setDestinationData(prev => {
            const arr = [...prev];
            arr[idx] = value;
            return arr;
        });
    };

    // ฟังก์ชันตรวจสอบความถูกต้องของข้อมูลในแต่ละแถว
    function validatePRInputs() {
        for (let idx = 0; idx < selectedParts.length; idx++) {
            if (qtyData[idx] === undefined || qtyData[idx] === null || qtyData[idx] === '' || isNaN(Number(qtyData[idx]))) {
                console.log(`กรุณากรอก QTY ให้ถูกต้องในแถวที่ ${idx + 1}`);
                return false;
            }
            // เช็ค UNIT ทั้งจาก unitData และ partInfo.unit
            const partInfo = partsInfo.find(p => p.part_no === selectedParts[idx]);
            const unitValue = unitData[idx] || partInfo?.unit;
            if (!unitValue || unitValue === '') {
                console.log(`กรุณากรอก UNIT ในแถวที่ ${idx + 1}`);
                return false;
            }
            if (!rowDueDates[idx]) {
                console.log(`กรุณาเลือก Due Date ในแถวที่ ${idx + 1}`);
                return false;
            }
            const objectiveValue = objectiveData[idx] || rempoData[idx] || partInfo?.rempo || '';
            if (!objectiveValue || objectiveValue === '') {
                console.log(`กรุณากรอก Objective ในแถวที่ ${idx + 1}`);
                return false;
            }
            if (!destinationData[idx] || destinationData[idx] === '') {
                console.log(`กรุณาเลือก Destination ในแถวที่ ${idx + 1}`);
                return false;
            }
            // ตรวจสอบข้อมูลจริง
            const hasRealData = partInfo && (partInfo.vendor !== null || partInfo.unit !== null || partInfo.stock !== null || partInfo.price_per_unit !== null);
            if (!hasRealData) {
                // ถ้าไม่มีข้อมูลจริง ให้ stock และ price/unit เป็น 0 และผ่าน validation
                continue;
            }
            const stockValue = stockData[idx] !== undefined && stockData[idx] !== null && stockData[idx] !== '' ? stockData[idx] : partInfo?.stock;
            if (stockValue === undefined || stockValue === null || stockValue === '' || isNaN(Number(stockValue))) {
                console.log(`กรุณากรอก Stock ให้ถูกต้องในแถวที่ ${idx + 1}`);
                return false;
            }
            const priceValue = priceData[idx] !== undefined && priceData[idx] !== null && priceData[idx] !== ''
                ? priceData[idx]
                : partInfo?.price_per_unit;
            if (priceValue === undefined || priceValue === null || priceValue === '' || isNaN(Number(priceValue))) {
                console.log(`กรุณากรอก Price/Unit ให้ถูกต้องในแถวที่ ${idx + 1}`);
                return false;
            }
        }
        return true;
    }

    const handleCreateClick = () => {
        // setCreatePr(prData?.pr_no ?? null);
        setDraftModalOpen(true);
    };

    const handleCreatePR = async (mode: "draft" | "submitted") => {
        if (!validatePRInputs()) {
            alert('กรุณากรอกข้อมูลให้ครบทุกช่องและเป็นตัวเลขที่ถูกต้อง');
            return;
        }
        setIsSaving(true);
        const payload = selectedParts.map((part, idx) => {
            // Try to find pr_list_id if this part exists in prData.pr_lists
            let pr_list_id = 0;
            let isNewPart = true;
            if (prData?.pr_lists) {
                const found = prData.pr_lists.find(pl => pl.part_no === part);
                if (found) {
                    pr_list_id = found.pr_list_id;
                    isNewPart = false;
                }
            }
            const partInfo = partsInfo.find(p => p.part_no === part);
            // Trim part_no only for new parts (not in pr_lists)
            const part_no = isNewPart && part.indexOf(' |') !== -1 ? part.slice(0, part.indexOf(' |')) : part;
            // Always send qty as a number
            let qtyValue = qtyData[idx] !== undefined ? qtyData[idx] : partInfo?.qty ?? '';
            if (typeof qtyValue === 'string') {
                qtyValue = qtyValue.trim() === '' ? 0 : parseFloat(qtyValue);
            }
            if (typeof qtyValue !== 'number' || isNaN(qtyValue)) qtyValue = 0;
            // Objective: ถ้า objectiveData ว่าง ให้ใช้ rempoData หรือ rempo จาก partInfo แทน
            const objectiveValue =
                objectiveData[idx] !== undefined && objectiveData[idx].trim() !== ''
                    ? objectiveData[idx]
                    : (rempoData[idx] || partInfo?.rempo || '');
            return {
                pr_list_id,
                part_no,
                qty: qtyValue,
                unit: unitData[idx] !== undefined ? unitData[idx] : partInfo?.unit ?? '',
                due_date: rowDueDates[idx] ? rowDueDates[idx]?.toLocaleDateString('en-CA') : null,
                objective: objectiveValue,
                destination: destinationData[idx] !== undefined ? destinationData[idx] : '',
                stock: 0,
            };
        });
        console.log("Payload to submit:", payload);
        // UPDATE draft API
        if (mode === "draft") {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pr/update/draft-lists/${prId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) {
                    const errorMsg = 'บันทึกฉบับร่างไม่สำเร็จ';
                    throw new Error(errorMsg);
                }
                await res.json();
                alert('บันทึกฉบับร่างสำเร็จ!');
                // Reset form
                setSelectedParts([]);
                setQtyData([]);
                setObjectiveData([]);
                setRowDueDates([]);
                setDestinationData([]);
                setStockData([]);
                setPriceData([]);
                fetchData();
            } catch (error) {
                console.error('Error saving draft:', error);
                alert('เกิดข้อผิดพลาดในการบันทึกฉบับร่าง');
            } finally {
                setIsSaving(false);
            }
        } else if (mode === "submitted") {
            try {
                // 1) บันทึกฉบับร่างก่อน ด้วย payload ปัจจุบัน
                const draftRes = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pr/update/draft-lists/${prId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });
                if (!draftRes.ok) {
                    const errorMsg = 'บันทึกฉบับร่างไม่สำเร็จ';
                    throw new Error(errorMsg);
                }
                await draftRes.json();

                // 2) จากนั้นจึงบันทึกแบบ submitted
                const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/update/pr/draft/${prId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                });
                if (!res.ok) {
                    const errorMsg = 'บันทึกข้อมูลไม่สำเร็จ';
                    throw new Error(errorMsg);
                }
                await res.json();
                alert('บันทึกข้อมูลสำเร็จ!');
                // Reset form
                setSelectedParts([]);
                setQtyData([]);
                setObjectiveData([]);
                setRowDueDates([]);
                setDestinationData([]);
                setStockData([]);
                setPriceData([]);
                router.push(process.env.NEXT_PUBLIC_PURCHASE_PR_REDIRECT || '/services/purchase');
            } catch (error) {
                console.error('Error saving draft:', error);
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleDeleteItem = async (prlistid: number, idx: number) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pr/list/item?pr_list_id=${prlistid}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Delete draft PR failed');
            }
            alert('Delete draft PR clicked!');
            // ลบแถวออกจากตารางฝั่ง frontend ด้วย เพื่อไม่ต้อง fetchData ใหม่
            handleDeleteRow(idx);
        } catch (error) {
            console.error("Error deleting draft PR:", error);
        }
    }

    const handleSyncInventory = async () => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/sync/inventory-econs`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Sync inventory failed');
            }
            alert('Sync Inventory clicked!');
        } catch (error) {
            console.error("Error syncing inventory:", error);
        }
    };

    const plantOptions = [
        { key: 'Plant 1', label: 'Plant 1' },
        { key: 'Plant 2', label: 'Plant 2' },
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
            <div className="min-h-screen relative">
                <Sidebar />
                <Header />
                {/* Main Content */}
                <main
                    className="mt-[5.5rem] sm:mt-[7.5rem] mr-3 sm:mr-6 transition-all duration-300"
                    style={{
                        minHeight: 'calc(100vh - 3rem)',
                        position: 'relative',
                        marginLeft: isMobile ? '1.25rem' : (isCollapsed ? '9rem' : 'calc(18rem + 55px)'),
                    }}
                >
                    <div className="max-w-none w-full space-y-8 mb-6 relative z-10">
                        {/* Header Section */}
                        {/* <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">ระบบจัดซื้อ</h1>
            <p className="text-gray-600">Purchase Requisition System</p>
          </div> */}
                        {/* Modern PR Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            <div className={`rounded-2xl p-6 shadow-sm border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                                        <IoDocumentTextOutline className={`h-6 w-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                                    </div>
                                    <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>หมายเลข PR</span>
                                </div>
                                <div className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{getMockPRNo()}</div>
                                <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>สถานะ: รอดำเนินการ</div>
                            </div>
                            <div className={`rounded-2xl p-6 shadow-sm border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-emerald-900/30' : 'bg-green-100'}`}>
                                        <MdOutlineGroups3 className={`h-6 w-6 ${isDarkMode ? 'text-emerald-400' : 'text-green-500'}`} />
                                    </div>
                                    <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>แผนก/หน่วยงาน</span>
                                </div>
                                <div className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{user?.Department?.name}</div>
                                <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>รหัสแผนก: {user?.Department?.short_name}</div>
                            </div>
                            <div className={`rounded-2xl p-6 shadow-sm border flex flex-col justify-between ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-purple-900/30' : 'bg-purple-100'}`}>
                                        <BsCalendar2Event className={`h-6 w-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                                    </div>
                                    <span className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>วันที่ทำ PR</span>
                                </div>
                                <div className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-slate-200' : 'text-gray-900'}`}>{new Date().toLocaleDateString('th-TH')}</div>
                                <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>เวลา: {new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        </div>

                        {/* Part No Input and Table */}
                        <div className={`rounded-3xl shadow border overflow-visible ${isDarkMode ? 'bg-slate-900/50 border-slate-700/50' : 'bg-white border-green-100'}`}>
                            <div className={`px-8 pt-8 pb-4 flex items-center justify-between rounded-t-3xl overflow-visible relative ${isDarkMode ? 'bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50' : 'bg-gradient-to-r from-green-50 via-white to-green-100'}`}>
                                {/* Back Button */}
                                {/* <button
                onClick={() => router.push('/services/purchase')}
                className="absolute -top-1 left-1 flex items-center gap-2 px-3 py-2 bg-white hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-lg text-gray-600 hover:text-green-600 transition-all duration-200 shadow-sm hover:shadow-md group"
              >
                <FaArrowLeft className="text-xs group-hover:-translate-x-1 transition-transform duration-200" />
                <span className="text-xs font-medium">กลับไปยัง PR</span>
              </button> */}

                                <div className="flex items-center gap-3">
                                    <span className={`text-xl font-bold ${isDarkMode ? 'text-emerald-400' : 'text-green-700'}`}>Purchase Requisition</span>
                                    <span className={`text-sm px-3 py-1 rounded-full shadow-sm border ${isDarkMode ? 'text-emerald-400 bg-emerald-900/20 border-emerald-800/50' : 'text-green-700 bg-green-50 border-green-200'}`}>{selectedParts.length} รายการ</span>
                                    {/* Sync button */}
                                    <button
                                        type="button"
                                        className={`px-4 py-2 font-medium border rounded-md cursor-pointer text-sm transition-colors shadow-sm ${isDarkMode ? 'text-amber-300 hover:bg-amber-600/50 hover:text-white' : 'text-amber-700 hover:bg-amber-100 hover:text-amber-600'}`}
                                        onClick={() => {
                                            handleSyncInventory()
                                        }}
                                    >
                                        <IoReloadOutline className="inline-block text-lg align-middle mr-2" />
                                        <span>Sync Inventory</span>
                                    </button>
                                </div>
                                <div className="w-full md:w-96 relative">
                                    <div className="relative w-full">
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            placeholder="ค้นหา/เพิ่ม Part No..."
                                            className={`px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 text-sm w-full shadow-sm transition-all duration-200 pr-10 ${isDarkMode ? 'border-slate-600 focus:ring-emerald-500/30 bg-slate-800/50 text-slate-200 placeholder-slate-500' : 'border-green-300 focus:ring-green-200 bg-white'}`}
                                            value={search}
                                            onChange={e => setSearch(e.target.value)}
                                            onFocus={() => search && partNos.length > 0 ? setShowDropdown(true) : undefined}
                                        />
                                        <button
                                            type="button"
                                            className={`absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-white font-bold shadow transition-all duration-150 cursor-pointer ${isDarkMode ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-emerald-500 hover:bg-green-500'}`}
                                            style={{ zIndex: 2 }}
                                            onClick={() => setShowCreatPartNo(true)}
                                        >
                                            <TiPlus size={16} />
                                            <span className="sr-only">เพิ่ม Part No.</span>
                                        </button>
                                    </div>
                                    {loading && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <div className={`animate-spin rounded-full h-5 w-5 border-b-2 ${isDarkMode ? 'border-emerald-400' : 'border-green-400'}`}></div>
                                        </div>
                                    )}
                                    {showDropdown && search && partNos.length > 0 && (
                                        <div ref={dropdownRef} className={`absolute z-[9999] w-full border rounded-xl shadow-lg mt-2 max-h-56 overflow-y-auto smooth-scroll ${isDarkMode ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'} ${isDarkMode ? 'bg-slate-900/95 border-slate-700/50 backdrop-blur-sm' : 'bg-white border-green-200'}`} style={{ zIndex: 9999 }}>
                                            <div className="p-2">
                                                <div className={`text-xs px-4 py-3 border-b rounded-t-lg ${isDarkMode ? 'text-slate-400 bg-slate-800/50 border-slate-700/50' : 'text-green-700 border-green-100 bg-green-50'}`}>
                                                    พบ {partNos.length} รายการ
                                                </div>
                                                {partNos.map((part, idx) => (
                                                    <div
                                                        key={part.concat + '-' + idx}
                                                        className={`flex items-center px-4 py-3 cursor-pointer rounded-lg transition-all duration-200 ${isDarkMode ? 'hover:bg-slate-800/50 text-slate-300' : 'hover:bg-green-50'}`}
                                                        onClick={() => {
                                                            setSelectedParts(prev => [...prev, part.concat]);
                                                            setPrListIds(prev => [...prev, 0]);
                                                            setRempoData(prev => [...prev, part.rempo ?? '']);
                                                        }}
                                                    >
                                                        {selectedParts.includes(part.concat) && (
                                                            <span className={`inline-block w-3 h-3 rounded-full mr-3 ${isDarkMode ? 'bg-emerald-500' : 'bg-green-500'}`} title="เลือกแล้ว"></span>
                                                        )}
                                                        <span className={`${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{part.concat}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="overflow-visible">
                                <table className="min-w-full text-sm overflow-visible">
                                    <thead className={`${isDarkMode ? 'bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50' : 'bg-gradient-to-r from-green-50 via-white to-green-100'}`}>
                                        <tr>
                                            <th className={`px-2 py-3 text-center font-semibold w-12 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>ลบ</th>
                                            <th className={`px-2 py-3 text-center font-semibold w-12 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Item</th>
                                            <th className={`px-2 py-3 text-left font-semibold w-32 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Part No.</th>
                                            <th className={`px-2 py-3 text-left font-semibold w-32 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Prod Code</th>
                                            <th className={`px-2 py-3 text-left font-semibold w-36 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Part Name</th>
                                            <th className={`px-2 py-3 text-center font-semibold w-24 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>QTY</th>
                                            <th className={`px-2 py-3 text-center font-semibold w-20 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>UNIT</th>
                                            <th className={`px-2 py-3 text-center font-semibold w-32 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Due Date</th>
                                            <th className={`px-2 py-3 text-center font-semibold w-64 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Objective</th>
                                            <th className={`px-2 py-3 text-center font-semibold w-16 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Stock</th>
                                            <th className={`px-2 py-3 text-center font-semibold w-22 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>Plant</th>
                                        </tr>
                                    </thead>
                                    <tbody className={`divide-y transition-colors ${isDarkMode ? 'bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50' : 'bg-white divide-green-100 bg-gradient-to-r from-green-50 via-white to-green-100'}`}>
                                        {selectedParts.length > 0 ? (
                                            pagedParts.map((part, idx) => {
                                                const partInfo = partsInfo.find(p => p.part_no === part);
                                                const hasRealData = partInfo && (partInfo.vendor !== null || partInfo.unit !== null || partInfo.stock !== null || partInfo.price_per_unit !== null);
                                                if (hasRealData) {
                                                    const globalIdx = (page - 1) * rowsPerPage + idx;
                                                    return (
                                                        <tr key={part + '-row-' + ((page - 1) * rowsPerPage + idx)} className={`transition-all duration-150 items-center ${isDarkMode ? 'hover:bg-slate-800/50' : 'hover:bg-green-50'}`}>
                                                            <td className="px-2 py-3 text-center w-12">
                                                                <button
                                                                    type="button"
                                                                    className={`flex items-center justify-center mx-auto p-2 rounded-full transition-colors duration-150 ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`}
                                                                    title="ลบแถวนี้"
                                                                    onClick={() => handleDelete((page - 1) * rowsPerPage + idx)}
                                                                >
                                                                    <RiDeleteBin6Line className="w-5 h-5" />
                                                                </button>
                                                            </td>
                                                            <td className={`px-2 py-3 font-bold text-center w-12 ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{(page - 1) * rowsPerPage + idx + 1}</td>
                                                            <td className={`px-2 py-3 font-medium w-32 ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                                                {partInfo.part_no && partInfo.part_no.indexOf(' |') !== -1 ? partInfo.part_no.slice(0, partInfo.part_no.indexOf(' |')) : partInfo.part_no}
                                                            </td>
                                                            <td className={`px-2 py-3 font-medium w-32 ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                                                {partInfo.prod_code && partInfo.prod_code.indexOf(' |') !== -1 ? partInfo.prod_code.slice(0, partInfo.prod_code.indexOf(' |')) : partInfo.prod_code}
                                                            </td>
                                                            <td className={`px-2 py-3 font-medium w-36 ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>
                                                                {partInfo.part_name && partInfo.part_name.indexOf(' |') !== -1 ? partInfo.part_name.slice(0, partInfo.part_name.indexOf(' |')) : partInfo.part_name}
                                                            </td>
                                                            <td className="px-2 py-3 w-24">
                                                                <input
                                                                    type="number"
                                                                    min="0" step="1"
                                                                    className={`w-full h-10 px-2 py-2 border rounded text-right text-sm focus:ring-2 transition-colors ${isDarkMode ? 'border-slate-600 bg-slate-800/50 text-slate-200 focus:ring-emerald-500/30 focus:border-emerald-500' : 'border-green-300 focus:ring-green-500 focus:border-green-500'}`}
                                                                    value={pagedQty[idx] !== undefined && pagedQty[idx] !== null ? pagedQty[idx] : (partInfo.qty !== null && partInfo.qty !== undefined ? partInfo.qty : '')}
                                                                    onChange={(e) => handleQtyChange((page - 1) * rowsPerPage + idx, e.target.value)}
                                                                    onBlur={e => {
                                                                        const val = e.target.value;
                                                                        if (val !== '' && !isNaN(Number(val))) {
                                                                            handleQtyChange((page - 1) * rowsPerPage + idx, Number(val).toFixed(2));
                                                                        }
                                                                    }}
                                                                    placeholder="0"
                                                                />
                                                            </td>
                                                            <td className="px-2 py-3 w-20">
                                                                <input type="text"
                                                                    className={`w-full h-10 px-2 py-2 border rounded text-center text-sm focus:ring-2 transition-colors ${isDarkMode ? 'border-slate-600 bg-slate-800/50 text-slate-200 focus:border-emerald-500 focus:ring-emerald-500/30' : 'border-green-200 bg-green-50 focus:border-green-300 focus:ring-green-100'}`}
                                                                    value={partInfo.unit ?? ''} 
                                                                    readOnly
                                                                    />
                                                            </td>
                                                            <td className={`px-2 py-5 whitespace-nowrap text-sm w-32  ${isDarkMode ? 'text-slate-300 border-r border-slate-700' : 'text-gray-700 border-r border-green-100'}`}>
                                                                <div className="relative w-full">
                                                                    <DatePicker
                                                                        selected={pagedDueDates[idx]}
                                                                        onChange={date => handleRowDueDateChange((page - 1) * rowsPerPage + idx, date)}
                                                                        dateFormat="dd/MM/yyyy"
                                                                        placeholderText="เลือกวันที่"
                                                                        className={`w-full h-10 px-2 py-2 pr-10 border rounded-lg text-sm text-center focus:outline-none focus:ring-2 transition-all duration-200 ${isDarkMode ? 'border-slate-600 bg-slate-800/50 text-slate-200 focus:ring-emerald-500/30 focus:border-emerald-500' : 'border-green-300 focus:ring-green-500 focus:border-green-500'}`}
                                                                        calendarClassName={isDarkMode ? 'react-datepicker-dark' : 'react-datepicker-light'}
                                                                        popperClassName="z-[9999]"
                                                                        popperPlacement="bottom-start"
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                        <FaRegCalendarAlt className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-2 py-3 w-64">
                                                                <textarea
                                                                    className={`w-full min-h-[2.5rem] px-2 py-2 border rounded text-sm resize-none focus:ring-2 transition-colors ${isDarkMode ? 'border-slate-600 bg-slate-800/50 text-slate-200 focus:ring-emerald-500/30 focus:border-emerald-500' : 'border-green-300 focus:ring-green-500 focus:border-green-500'}`}
                                                                    placeholder="วัตถุประสงค์"
                                                                    rows={1}
                                                                    value={
                                                                        pagedObjective[idx] !== undefined && pagedObjective[idx] !== ''
                                                                            ? pagedObjective[idx]
                                                                            : (rempoData[globalIdx] || partInfo.rempo || '')
                                                                    }
                                                                    onChange={(e) => handleObjectiveChange(globalIdx, e.target.value)}
                                                                />
                                                            </td>
                                                            {/* <td className="px-2 py-3 w-16">
                              <div className={`w-full h-10 px-3 py-2 rounded-lg flex items-center justify-center text-sm font-medium ${isDarkMode ? 'bg-slate-700/50 text-slate-200 border border-slate-600/50' : 'bg-gray-50 text-gray-700 border border-gray-200'}`}>
                                {partInfo.vendor || '-'}
                              </div>
                            </td> */}
                                                            <td className="px-2 py-3 w-16">
                                                                <div className={`w-full h-10 px-3 py-2 rounded-lg flex items-center justify-end text-sm font-medium ${isDarkMode ? 'bg-blue-900/20 text-blue-300 border border-blue-800/50' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                                                    {Number(partInfo.stock ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                                                                </div>
                                                            </td>
                                                            {/* <td className="px-2 py-3 w-16">
                              <div className={`w-full h-10 px-3 py-2 rounded-lg flex items-center justify-end text-sm font-medium ${isDarkMode ? 'bg-emerald-900/20 text-emerald-300 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                ฿{Number(partInfo.price_per_unit ?? 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                              </div>
                            </td> */}
                                                            <td className="px-2 py-3 w-22">
                                                                {/* <select
                                  value={destinationData[(page - 1) * rowsPerPage + idx] || 'Plant 1'}
                                  onChange={(e) => handleDestinationChange((page - 1) * rowsPerPage + idx, e.target.value)}
                                  className={`w-full h-10 px-2 py-2 border rounded text-sm text-center focus:ring-2 transition-colors ${isDarkMode ? 'border-slate-600 bg-slate-800/50 text-slate-200 focus:border-emerald-500 focus:ring-emerald-500/30' : 'border-green-200 bg-green-50 focus:border-green-300 focus:ring-green-100'}`}>
                                  <option>Plant 1</option>
                                  <option>Plant 2</option>
                                </select> */}

                                                                <Select
                                                                    placeholder="กรุณาเลือก Plant"
                                                                    className="w-28"
                                                                    classNames={{
                                                                        base: "w-full",
                                                                        label: "font-semibold text-sm text-center",
                                                                        trigger: [
                                                                            "h-10",
                                                                            "min-h-10",
                                                                            "pl-2",
                                                                            "pr-10",
                                                                            "text-sm",
                                                                            "rounded",
                                                                            "border",
                                                                            "transition-colors",
                                                                            "focus:ring-2",
                                                                            isDarkMode
                                                                                ? "bg-slate-800/50 border-slate-600 text-slate-200 focus:border-emerald-500 focus:ring-emerald-500/30 hover:border-emerald-500"
                                                                                : "bg-emerald-50 border-emerald-300 text-gray-900 focus:border-emerald-300 focus:ring-emerald-500 hover:border-emerald-500",
                                                                        ],
                                                                        value: "text-sm font-medium",
                                                                        mainWrapper: "w-full",
                                                                        innerWrapper: "pr-0",
                                                                        selectorIcon: [
                                                                            "right-2",
                                                                            "absolute",
                                                                            "text-emerald-500"
                                                                        ],
                                                                        listboxWrapper: [
                                                                            "max-h-[400px]",
                                                                            isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar-light"
                                                                        ],
                                                                        popoverContent: [
                                                                            "rounded-lg",
                                                                            "shadow-xl",
                                                                            isDarkMode
                                                                                ? "bg-slate-800 border-slate-600"
                                                                                : "bg-white border-emerald-200",
                                                                        ],
                                                                    }}
                                                                    variant="bordered"
                                                                    size="md"
                                                                    radius="md"
                                                                    scrollShadowProps={{
                                                                        isEnabled: true
                                                                    }}
                                                                    selectedKeys={destinationData[globalIdx] ? [destinationData[globalIdx]] : []}
                                                                    onSelectionChange={(keys) => {
                                                                        const selected = Array.from(keys)[0] as string | undefined;
                                                                        handleDestinationChange(globalIdx, selected ?? "");
                                                                    }}
                                                                >
                                                                    {plantOptions.map((unit) => (
                                                                        <SelectItem
                                                                            key={unit.key}
                                                                            className={`rounded-md my-1 text-center ${isDarkMode
                                                                                ? "text-slate-200 hover:bg-slate-700/50 data-[selected=true]:bg-emerald-500/20 data-[selected=true]:text-emerald-300"
                                                                                : "text-gray-900 hover:bg-emerald-50 data-[selected=true]:bg-emerald-100 data-[selected=true]:text-emerald-700"
                                                                                }`}
                                                                        >
                                                                            {unit.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </Select>
                                                            </td>
                                                        </tr>
                                                    );
                                                } else {
                                                    const globalIdx = (page - 1) * rowsPerPage + idx;
                                                    return (
                                                        <tr key={part + '-nodata-' + ((page - 1) * rowsPerPage + idx)} className={`transition-all duration-150 ${isDarkMode ? 'bg-orange-900/10' : 'bg-orange-50'}`}>
                                                            <td className="px-2 py-3 text-center w-12">
                                                                <button type="button" className={`flex items-center justify-center mx-auto p-2 rounded-full transition-colors duration-150 ${isDarkMode ? 'text-red-400 hover:text-red-300' : 'text-red-500 hover:text-red-700'}`} title="ลบแถวนี้" onClick={() => handleDelete((page - 1) * rowsPerPage + idx)}>
                                                                    <RiDeleteBin6Line className="w-5 h-5" />
                                                                </button>
                                                            </td>
                                                            <td className={`px-2 py-3 font-bold text-center w-12 ${isDarkMode ? 'text-slate-200' : 'text-gray-800'}`}>{(page - 1) * rowsPerPage + idx + 1}</td>
                                                            <td className={`px-2 py-3 font-medium w-32 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>{part && part.indexOf(' |') !== -1 ? part.slice(0, part.indexOf(' |')) : part}</td>
                                                            {/* prod_code */}
                                                            <td className={`px-2 py-3 font-medium w-26 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>{(() => {
                                                                // Try to parse prod_code from part string: "...|prod_code|..."
                                                                const parts = part.split(' | ');
                                                                return parts.length > 2 ? parts[2] : '';
                                                            })()}</td>
                                                            {/* part_name */}
                                                            <td className={`px-2 py-3 font-medium w-32 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>{(() => {
                                                                // Try to parse part_name from part string: "...|prod_code|part_name"
                                                                const parts = part.split(' | ');
                                                                return parts.length > 1 ? parts[1] : '';
                                                            })()}</td>

                                                            <td className="px-2 py-3 w-20">
                                                                <input
                                                                    type="number"
                                                                    min="0" step="1"
                                                                    className={`w-full h-10 px-2 py-2 border rounded text-center text-sm text-right focus:ring-2 transition-colors ${isDarkMode ? 'border-slate-600 bg-slate-800/50 text-slate-200 focus:ring-orange-500/30 focus:border-orange-500' : 'border-orange-300 focus:ring-orange-500 focus:border-orange-500'}`}
                                                                    placeholder="0"
                                                                    value={pagedQty[idx] !== undefined && pagedQty[idx] !== null ? pagedQty[idx] : ''}
                                                                    onChange={(e) => handleQtyChange((page - 1) * rowsPerPage + idx, e.target.value)}
                                                                    onBlur={e => {
                                                                        const val = e.target.value;
                                                                        if (val !== '' && !isNaN(Number(val))) {
                                                                            handleQtyChange((page - 1) * rowsPerPage + idx, Number(val).toFixed(2));
                                                                        }
                                                                    }}
                                                                />
                                                            </td>
                                                            <td className="px-2 py-3 w-20">
                                                                <div className="flex justify-center items-center w-full">
                                                                    <Select
                                                                        placeholder="กรุณาเลือก"
                                                                        className="w-full"
                                                                        classNames={{
                                                                            base: "w-full",
                                                                            label: "font-semibold text-sm",
                                                                            trigger: [
                                                                                "h-10",
                                                                                "min-h-10",
                                                                                "pl-2",
                                                                                "pr-10",
                                                                                "text-sm",
                                                                                "rounded",
                                                                                "border",
                                                                                "transition-colors",
                                                                                "focus:ring-2",
                                                                                isDarkMode
                                                                                    ? "bg-slate-800/50 border-slate-600 text-slate-200 focus:border-orange-500 focus:ring-orange-500/30 hover:border-orange-500"
                                                                                    : "bg-orange-50 border-orange-300 text-gray-900 focus:border-orange-300 focus:ring-orange-500 hover:border-orange-500",
                                                                            ],
                                                                            value: "text-sm font-medium",
                                                                            mainWrapper: "w-full",
                                                                            innerWrapper: "pr-0",
                                                                            selectorIcon: [
                                                                                "right-2",
                                                                                "absolute",
                                                                                "text-orange-500"
                                                                            ],
                                                                            listboxWrapper: [
                                                                                "max-h-[400px]",
                                                                                isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar-light"
                                                                            ],
                                                                            popoverContent: [
                                                                                "rounded-lg",
                                                                                "shadow-xl",
                                                                                isDarkMode
                                                                                    ? "bg-slate-800 border-slate-600"
                                                                                    : "bg-white border-orange-200",
                                                                            ],
                                                                        }}
                                                                        variant="bordered"
                                                                        size="md"
                                                                        radius="md"
                                                                        scrollShadowProps={{
                                                                            isEnabled: true
                                                                        }}
                                                                        selectedKeys={unitData[globalIdx] ? [unitData[globalIdx]] : []}
                                                                        onSelectionChange={(keys) => {
                                                                            const selected = Array.from(keys)[0] as string | undefined;
                                                                            handleUnitChange(globalIdx, selected ?? "");
                                                                        }}
                                                                    >
                                                                        {unitOptions.map((unit) => (
                                                                            <SelectItem
                                                                                key={unit.measure_name}
                                                                                className={`rounded-md my-1 ${isDarkMode
                                                                                    ? "text-slate-200 hover:bg-slate-700/50 data-[selected=true]:bg-orange-500/20 data-[selected=true]:text-orange-300"
                                                                                    : "text-gray-900 hover:bg-orange-50 data-[selected=true]:bg-orange-100 data-[selected=true]:text-orange-700"
                                                                                    }`}
                                                                            >
                                                                                {unit.measure_name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </Select>
                                                                </div>
                                                            </td>
                                                            <td className={`px-2 py-5 whitespace-nowrap text-sm w-30`}>
                                                                <div className="relative w-full">
                                                                    <DatePicker
                                                                        selected={pagedDueDates[idx]}
                                                                        onChange={date => handleRowDueDateChange((page - 1) * rowsPerPage + idx, date)}
                                                                        dateFormat="dd/MM/yyyy"
                                                                        placeholderText="เลือกวันที่"
                                                                        className={`w-full h-10 px-2 py-2 pr-10 border rounded-lg text-sm text-center focus:outline-none focus:ring-2 transition-all duration-200 ${isDarkMode ? 'border-slate-600 bg-slate-800/50 text-slate-200 focus:ring-orange-500/30 focus:border-orange-500' : 'border-orange-300 focus:ring-orange-500 focus:border-orange-500'}`}
                                                                        calendarClassName={isDarkMode ? 'react-datepicker-orange-dark' : 'react-datepicker-orange'}
                                                                        popperClassName="z-[9999]"
                                                                        popperPlacement="bottom-start"
                                                                    />
                                                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                                        <FaRegCalendarAlt className="w-4 h-4 text-orange-400" />
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="px-2 py-3 w-64">
                                                                <textarea
                                                                    className={`w-full min-h-[2.5rem] px-2 py-2 border rounded text-sm resize-none focus:ring-2 transition-colors ${isDarkMode ? 'border-slate-600 bg-slate-800/50 text-slate-200 focus:ring-orange-500/30 focus:border-orange-500' : 'border-orange-300 focus:ring-orange-500 focus:border-orange-500'}`}
                                                                    placeholder="วัตถุประสงค์"
                                                                    rows={1}
                                                                    value={
                                                                        pagedObjective[idx] !== undefined && pagedObjective[idx] !== ''
                                                                            ? pagedObjective[idx]
                                                                            : (rempoData[globalIdx] || '')
                                                                    }
                                                                    onChange={(e) => handleObjectiveChange(globalIdx, e.target.value)}
                                                                />
                                                            </td>
                                                            {/* <td className="px-2 py-3 w-16">
                              <div className={`w-full h-10 py-2 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-orange-900/20 border border-orange-800/50' : 'bg-orange-50 border border-orange-200'}`}>
                                <span className={`text-xs px-1 py-1 rounded-full whitespace-nowrap ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} title="ไม่เคยถูกซื้อ ไม่มีข้อมูลในฐานข้อมูล">
                                  ไม่มีข้อมูล
                                </span>
                              </div>
                            </td> */}
                                                            <td className="px-2 py-3 w-16">
                                                                <div className={`w-full h-10 px-3 py-2 rounded-lg flex items-center justify-end text-sm font-medium ${isDarkMode ? 'bg-orange-900/20 border border-orange-800/50' : 'bg-orange-50 border border-orange-200'}`}>
                                                                    <span className={`text-xs px-1 py-1 rounded-full whitespace-nowrap ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} title="ไม่เคยถูกซื้อ ไม่มีข้อมูลในฐานข้อมูล">
                                                                        0.00
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            {/* <td className="px-2 py-3 w-16">
                              <div className={`w-full h-10 px-3 py-2 rounded-lg flex items-center justify-end text-sm font-medium ${isDarkMode ? 'bg-orange-900/20 border border-orange-800/50' : 'bg-orange-50 border border-orange-200'}`}>
                                <span className={`text-xs px-1 py-1 rounded-full whitespace-nowrap ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} title="ไม่เคยถูกซื้อ ไม่มีข้อมูลในฐานข้อมูล">
                                  ฿0.00
                                </span>
                              </div>
                            </td> */}
                                                            <td className="px-2 py-3 w-22">
                                                                {/* <select
                                  value={destinationData[(page - 1) * rowsPerPage + idx] || 'Plant 1'}
                                  onChange={(e) => handleDestinationChange((page - 1) * rowsPerPage + idx, e.target.value)}
                                  className={`w-full h-10 px-2 py-2 border rounded text-sm text-center focus:ring-2 transition-colors ${isDarkMode ? 'border-slate-600 bg-slate-800/50 text-slate-200 focus:border-emerald-500 focus:ring-emerald-500/30' : 'border-green-200 bg-green-50 focus:border-green-300 focus:ring-green-100'}`}>
                                  <option>Plant 1</option>
                                  <option>Plant 2</option>
                                </select> */}

                                                                <Select
                                                                    placeholder="กรุณาเลือก Plant"
                                                                    className="w-28"
                                                                    classNames={{
                                                                        base: "w-full",
                                                                        label: "font-semibold text-sm text-center",
                                                                        trigger: [
                                                                            "h-10",
                                                                            "min-h-10",
                                                                            "pl-2",
                                                                            "pr-10",
                                                                            "text-sm",
                                                                            "rounded",
                                                                            "border",
                                                                            "transition-colors",
                                                                            "focus:ring-2",
                                                                            isDarkMode
                                                                                ? "bg-slate-800/50 border-slate-600 text-slate-200 focus:border-orange-500 focus:ring-orange-500/30 hover:border-orange-500"
                                                                                : "bg-orange-50 border-orange-300 text-gray-900 focus:border-orange-300 focus:ring-orange-500 hover:border-orange-500",
                                                                        ],
                                                                        value: "text-sm font-medium",
                                                                        mainWrapper: "w-full",
                                                                        innerWrapper: "pr-0",
                                                                        selectorIcon: [
                                                                            "right-2",
                                                                            "absolute",
                                                                            "text-orange-500"
                                                                        ],
                                                                        listboxWrapper: [
                                                                            "max-h-[400px]",
                                                                            isDarkMode ? "custom-scrollbar-dark" : "custom-scrollbar-light"
                                                                        ],
                                                                        popoverContent: [
                                                                            "rounded-lg",
                                                                            "shadow-xl",
                                                                            isDarkMode
                                                                                ? "bg-slate-800 border-slate-600"
                                                                                : "bg-white border-orange-200",
                                                                        ],
                                                                    }}
                                                                    variant="bordered"
                                                                    size="md"
                                                                    radius="md"
                                                                    scrollShadowProps={{
                                                                        isEnabled: true
                                                                    }}
                                                                    selectedKeys={destinationData[globalIdx] ? [destinationData[globalIdx]] : []}
                                                                    onSelectionChange={(keys) => {
                                                                        const selected = Array.from(keys)[0] as string | undefined;
                                                                        handleDestinationChange(globalIdx, selected ?? "");
                                                                    }}
                                                                >
                                                                    {plantOptions.map((unit) => (
                                                                        <SelectItem
                                                                            key={unit.key}
                                                                            className={`rounded-md my-1 text-center ${isDarkMode
                                                                                ? "text-slate-200 hover:bg-slate-700/50 data-[selected=true]:bg-orange-500/20 data-[selected=true]:text-orange-300"
                                                                                : "text-gray-900 hover:bg-orange-50 data-[selected=true]:bg-orange-100 data-[selected=true]:text-orange-700"
                                                                                }`}
                                                                        >
                                                                            {unit.label}
                                                                        </SelectItem>
                                                                    ))}
                                                                </Select>
                                                            </td>
                                                        </tr>
                                                    );
                                                }
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={14} className={`px-4 py-12 text-center italic ${isDarkMode ? 'text-slate-400 bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50' : 'text-green-300 bg-gradient-to-r from-green-50 via-white to-green-100'}`}>กรุณาเลือก Part No จากฟอร์มด้านบน</td>
                                            </tr>
                                        )}
                                        {/* Pagination row */}
                                        {selectedParts.length > 0 && totalPages > 1 && (
                                            <tr>
                                                <td colSpan={14} className={`px-4 py-4 text-center border-t ${isDarkMode ? 'bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50 border-slate-700' : 'bg-gradient-to-r from-green-50 via-white to-green-100 border-green-100'}`}>
                                                    <div className="inline-flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            className={`px-3 py-1 cursor-pointer rounded-lg border transition-all duration-150 ${isDarkMode ? 'border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700/50' : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'} ${page === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            onClick={() => page > 1 && setPage(page - 1)}
                                                            disabled={page === 1}
                                                        >ย้อนกลับ</button>
                                                        <span className={`mx-2 font-medium ${isDarkMode ? 'text-slate-200' : 'text-green-700'}`}>หน้า {page} / {totalPages}</span>
                                                        <button
                                                            type="button"
                                                            className={`px-3 py-1 cursor-pointer rounded-lg border transition-all duration-150 ${isDarkMode ? 'border-slate-600 bg-slate-800/50 text-slate-200 hover:bg-slate-700/50' : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'} ${page === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                            onClick={() => page < totalPages && setPage(page + 1)}
                                                            disabled={page === totalPages}
                                                        >ถัดไป</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div> {/* end table container */}
                            <div className={`w-full flex justify-center py-8 rounded-b-3xl ${isDarkMode ? 'bg-gradient-to-r from-slate-800/50 via-slate-900/50 to-slate-800/50' : 'bg-gradient-to-r from-green-50 via-white to-green-100'}`}>
                                <button
                                    type="button"
                                    className={`px-8 py-3 rounded-xl cursor-pointer font-bold text-lg shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 ${isDarkMode ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-700 text-white focus:ring-emerald-300/50' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-500 hover:to-green-700 text-white focus:ring-green-300'} ${(isSaving || selectedParts.length === 0) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={handleCreateClick}
                                    disabled={isSaving || selectedParts.length === 0}
                                >
                                    {isSaving ? 'กำลังบันทึก...' : 'บันทึก'}
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
                {showCreatPartNo && (
                    <CreatPartNo onCancel={() => setShowCreatPartNo(false)} />
                )}
                <DraftPRModal
                    open={draftModalOpen}
                    onClose={() => setDraftModalOpen(false)}
                    onConfirm={(mode) => { if (!isSaving && selectedParts.length > 0) handleCreatePR(mode); }}
                />
            </div>
        </>
    );

}

export default function PRDraft() {
    return (
        <Suspense>
            <PRDraftContent />
        </Suspense>
    );
}