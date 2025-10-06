"use client";
import React from "react";
import { useState } from "react";
import { IoDocumentTextOutline } from "react-icons/io5";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { GoDownload } from "react-icons/go";
import { LuCalendarFold } from "react-icons/lu";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

// Dummy data types
export type PRCard = {
  id: number;
  pr_no: string;
  pr_date: string;
  dept_name: string;
  requester_name: string;
  pu_responsible: string;
  count_list: number;
  waiting: number;
  supervisor_approved: boolean;
  manager_approved: boolean;
  pu_operator_approved: boolean;
  supervisor_reject_at?: string | null;
  manager_reject_at?: string | null;
  pu_operator_reject_at?: string | null;
};

export type Department = {
  ID: number;
  name: string;
};

const departmentColors: { [key: string]: string } = {
  "Production": "text-blue-500",
  "Maintenance": "text-green-500",
  "Quality Control": "text-purple-500",
  "Engineering": "text-yellow-500",
  "Logistics": "text-pink-500",
  "Procurement": "text-indigo-500",
  "R&D": "text-red-500"
};

export default function PurchasePO2Template({
  prCards = [],
  departments = [],
  isDarkMode = false,
  ...props
}: {
  prCards?: PRCard[];
  departments?: Department[];
  isDarkMode?: boolean;
}) {
  // Filter states
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [statusSortDropdownOpen, setStatusSortDropdownOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter logic
  let displayedPrCards = prCards;
  if (departmentFilter) {
    displayedPrCards = displayedPrCards.filter(pr => pr.dept_name === departmentFilter);
  }
  if (statusFilter) {
    displayedPrCards = displayedPrCards.filter(pr => {
      if (statusFilter === 'rejected') {
        return pr.supervisor_reject_at || pr.manager_reject_at || pr.pu_operator_reject_at;
      } else if (statusFilter === 'supervisor') {
        return !pr.supervisor_approved && !pr.supervisor_reject_at && !pr.manager_reject_at && !pr.pu_operator_reject_at;
      } else if (statusFilter === 'manager') {
        return pr.supervisor_approved && !pr.manager_approved && !pr.supervisor_reject_at && !pr.manager_reject_at && !pr.pu_operator_reject_at;
      } else if (statusFilter === 'pu') {
        return pr.supervisor_approved && pr.manager_approved && !pr.pu_operator_approved && !pr.supervisor_reject_at && !pr.manager_reject_at && !pr.pu_operator_reject_at;
      } else if (statusFilter === 'processing') {
        return pr.supervisor_approved && pr.manager_approved && pr.pu_operator_approved && pr.waiting !== pr.count_list && !pr.supervisor_reject_at && !pr.manager_reject_at && !pr.pu_operator_reject_at;
      } else if (statusFilter === 'complete') {
        return pr.supervisor_approved && pr.manager_approved && pr.pu_operator_approved && pr.waiting === pr.count_list && !pr.supervisor_reject_at && !pr.manager_reject_at && !pr.pu_operator_reject_at;
      }
      return true;
    });
  }
  if (search && search.trim() !== "") {
    const lower = search.trim().toLowerCase();
    displayedPrCards = displayedPrCards.filter(pr =>
      (pr.pr_no && pr.pr_no.toLowerCase().includes(lower)) ||
      (pr.requester_name && pr.requester_name.toLowerCase().includes(lower)) ||
      (pr.pu_responsible && pr.pu_responsible.toLowerCase().includes(lower))
    );
  }

  // Pagination
  const totalItems = displayedPrCards.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPrCards = displayedPrCards.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen">
      {/* Filter Section */}
      <form className="flex items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="ค้นหา PR หรือชื่อผู้ร้องขอ..."
          className="border rounded-lg px-3 py-2 text-sm w-64"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="relative">
          <button type="button" className="border rounded-lg px-3 py-2 text-sm" onClick={() => setDropdownOpen(!dropdownOpen)}>
            {departmentFilter || "ทุกแผนก"}
          </button>
          {dropdownOpen && (
            <ul className="absolute left-0 mt-2 bg-white border rounded-lg shadow z-10 w-40">
              <li className="px-4 py-2 cursor-pointer" onClick={() => { setDepartmentFilter(""); setDropdownOpen(false); }}>ทุกแผนก</li>
              {departments.map(dept => (
                <li key={dept.ID} className="px-4 py-2 cursor-pointer" onClick={() => { setDepartmentFilter(dept.name); setDropdownOpen(false); }}>{dept.name}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="relative">
          <button type="button" className="border rounded-lg px-3 py-2 text-sm" onClick={() => setStatusSortDropdownOpen(!statusSortDropdownOpen)}>
            <MdOutlineRemoveRedEye /> กรองสถานะ
          </button>
          {statusSortDropdownOpen && (
            <ul className="absolute left-0 mt-2 bg-white border rounded-lg shadow z-10 w-56">
              <li className="px-4 py-2 cursor-pointer" onClick={() => { setStatusFilter(""); setStatusSortDropdownOpen(false); }}>ทุกสถานะ</li>
              <li className="px-4 py-2 cursor-pointer" onClick={() => { setStatusFilter("supervisor"); setStatusSortDropdownOpen(false); }}>รอหัวหน้าแผนกอนุมัติ</li>
              <li className="px-4 py-2 cursor-pointer" onClick={() => { setStatusFilter("manager"); setStatusSortDropdownOpen(false); }}>รอผู้จัดการแผนกอนุมัติ</li>
              <li className="px-4 py-2 cursor-pointer" onClick={() => { setStatusFilter("pu"); setStatusSortDropdownOpen(false); }}>รอแผนกจัดซื้ออนุมัติ</li>
              <li className="px-4 py-2 cursor-pointer" onClick={() => { setStatusFilter("processing"); setStatusSortDropdownOpen(false); }}>รอดำเนินการ</li>
              <li className="px-4 py-2 cursor-pointer" onClick={() => { setStatusFilter("complete"); setStatusSortDropdownOpen(false); }}>เสร็จสมบูรณ์</li>
              <li className="px-4 py-2 cursor-pointer" onClick={() => { setStatusFilter("rejected"); setStatusSortDropdownOpen(false); }}>ปฏิเสธ</li>
            </ul>
          )}
        </div>
      </form>

      {/* Pagination Controls */}
      {totalItems > 0 && (
        <div className="flex items-center gap-4 mb-6">
          <select value={itemsPerPage} onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
          <div className="flex items-center">
            <span>หน้า {currentPage} / {totalPages}</span>
            <button type="button" className="ml-2" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))}><IoIosArrowBack /></button>
            <button type="button" className="ml-2" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}><IoIosArrowForward /></button>
          </div>
        </div>
      )}

      {/* Card Grid */}
      <div className="grid gap-x-6 gap-y-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 justify-items-center">
        {paginatedPrCards.map((pr) => (
          <div key={pr.pr_no} className="relative rounded-2xl p-0 flex flex-col items-center shadow-md border w-full max-w-[270px] min-w-[180px] min-h-[320px] transition-all duration-200 hover:scale-[1.03] hover:shadow-lg cursor-pointer">
            {/* Top: Department Icon */}
            <div className="w-full flex justify-center pt-12 pb-2">
              <IoDocumentTextOutline className={`h-14 w-14 ${departmentColors[pr.dept_name] || 'text-blue-400'}`} />
            </div>
            {/* Status badge top right */}
            <div className="absolute top-2 right-2 z-10">
              {pr.supervisor_reject_at || pr.manager_reject_at || pr.pu_operator_reject_at ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm bg-red-50 border-red-300 text-red-800">
                  ปฏิเสธ
                </span>
              ) : !pr.supervisor_approved ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm bg-blue-50 border-blue-300 text-blue-800">
                  รอหัวหน้าแผนกอนุมัติ
                </span>
              ) : !pr.manager_approved ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm bg-purple-50 border-purple-300 text-purple-800">
                  รอผู้จัดการแผนกอนุมัติ
                </span>
              ) : !pr.pu_operator_approved ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm bg-orange-50 border-orange-300 text-orange-800">
                  รอแผนกจัดซื้ออนุมัติ
                </span>
              ) : pr.waiting === pr.count_list ? (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm bg-green-50 border-green-500 text-green-900">
                  เสร็จสมบูรณ์
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border font-semibold text-xs shadow-sm bg-yellow-50 border-yellow-400 text-yellow-800">
                  รอดำเนินการ
                </span>
              )}
            </div>
            {/* Middle: Table info */}
            <div className="w-full px-6 pt-2">
              <table className="w-full text-sm mb-2">
                <tbody>
                  <tr><td className="py-1 text-gray-500">หมายเลข PR</td><td className="text-right font-semibold py-1 text-blue-700">{pr.pr_no}</td></tr>
                  <tr><td className="py-1 text-gray-500">แผนก</td><td className="text-right py-1 text-green-700">{pr.dept_name}</td></tr>
                  <tr><td className="py-1 text-gray-500">ผู้ร้องขอ</td><td className="text-right py-1 text-gray-700">{pr.requester_name}</td></tr>
                  <tr><td className="py-1 text-gray-500">ผู้จัดทำ</td><td className="text-right py-1 text-gray-700">{pr.pu_responsible}</td></tr>
                </tbody>
              </table>
            </div>
            {/* Bottom: Actions */}
            <div className="w-full px-6 pb-5 flex flex-col gap-2 items-center">
              <span className="text-xs mb-1 text-gray-400">{pr.pr_date}</span>
              <div className="flex w-full justify-center">
                <button className="flex items-center justify-center rounded-l-lg px-4 py-2 text-lg font-medium transition text-green-600 bg-green-50 border border-green-100 hover:bg-green-100">
                  <MdOutlineRemoveRedEye className="w-7 h-7" />
                </button>
                <button className="flex items-center justify-center rounded-r-lg px-4 py-2 text-lg font-medium transition text-red-400 bg-red-50 border border-red-100 hover:bg-red-100">
                  <GoDownload className="w-7 h-7" />
                </button>
              </div>
              <span className="text-xs mt-2 text-gray-500">
                ดำเนินการ {pr.waiting} | <span className="font-semibold text-green-700">{pr.count_list} รายการ</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
