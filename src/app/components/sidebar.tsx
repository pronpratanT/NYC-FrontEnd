'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  FaBook, FaCar, FaTools, FaDesktop, FaWrench, FaClipboardCheck,
  FaCreditCard, FaServer, FaBoxOpen, FaShoppingCart, FaChevronDown,
  FaLink, FaLeaf, FaDownload, FaCode, FaClock, FaChartLine, FaKey, FaUser,
  FaFileInvoice, FaClipboardList
} from 'react-icons/fa';
import { RiDashboardFill } from "react-icons/ri";
import { BsPersonFillGear } from "react-icons/bs";
import { HiUserGroup } from "react-icons/hi2";
import Link from 'next/link';
import { useTheme } from './ThemeProvider';


const menu = [
  { label: 'Dashboard', icon: RiDashboardFill, href: process.env.NEXT_PUBLIC_LOGIN_SUCCESS_REDIRECT || '/nycsystem' },
  { label: 'คู่มือการใช้งาน', icon: FaBook, href: process.env.NEXT_PUBLIC_MANUAL_REDIRECT || '/manual' },
];

const system = [
  { label: 'ระบบจัดการเครื่องจักร', icon: FaTools },
  { label: 'ระบบจัดการรถยนต์ NYC', icon: FaCar },
  { label: 'ระบบแจ้งงาน ECONS', icon: FaTools },
  { label: 'ระบบแจ้งงาน IT Support', icon: FaDesktop },
  { label: 'ระบบแจ้งซ่อมบำรุง', icon: FaWrench },
  { label: 'ระบบตรวจสอบมาตรฐานการผลิต', icon: FaClipboardCheck },
];

const programs = [
  { label: 'FeetCard', icon: FaCreditCard },
  { label: 'N.Y.C. Server IS', icon: FaServer },
  { label: 'Packing Check', icon: FaBoxOpen },
  {
    label: 'ระบบจัดซื้อ',
    icon: FaShoppingCart,
    subItems: [
      { label: 'Purchase Request (PR)', icon: FaClipboardList, href: process.env.NEXT_PUBLIC_PURCHASE_PR_REDIRECT || '/services/purchase' },
      { label: 'Purchase Order (PO)', icon: FaFileInvoice, href: process.env.NEXT_PUBLIC_PURCHASE_PO_REDIRECT || '/nycsystem/services/purchase/PO' },
    ]
  },
  { label: 'เชื่อมโยงแอปฯ', icon: FaLink },
  { label: 'Emerald Website', icon: FaLeaf },
  { label: 'Download YT', icon: FaDownload },
  { label: 'IT Service API', icon: FaCode },
  { label: 'คู่มือ OT', icon: FaClock },
  { label: 'คู่มือแผนการผลิต', icon: FaChartLine },
];


const admin = [
  { label: 'จัดการข้อมูลพนักงาน', icon: FaUser, href: '/user' },
  { label: 'จัดการสถานะพนักงาน', icon: BsPersonFillGear, href: '/userStatus' },
  { label: 'กำหนดสิทธิแผนก', icon: HiUserGroup, href: '/admin' },
  { label: 'Tokens', icon: FaKey, href: '/token' },
  // เพิ่มเมนูอื่น ๆ ได้ง่าย
];

export default function Sidebar() {
  const { isDarkMode } = useTheme();
  const pathname = usePathname();
  const purchaseMenuPath = process.env.NEXT_PUBLIC_PURCHASE_PR_REDIRECT || '/services/purchase';
  const [showPurchaseMenu, setShowPurchaseMenu] = useState(pathname.startsWith(purchaseMenuPath));

  // Helper function to check if current path matches the item
  const isPathActive = (item: { href?: string; label: string }) => {
    if (!item.href) return false;
    // Use env for dashboard root path if provided
    const dashboardRootPath = process.env.NEXT_PUBLIC_LOGIN_SUCCESS_REDIRECT || '/nycsystem/';
    if (item.href === dashboardRootPath && pathname === dashboardRootPath) return true;


    // Special handling for purchase system paths using env
    const purchaseMenuPath = process.env.NEXT_PUBLIC_PURCHASE_PR_REDIRECT || '/services/purchase';
    const purchasePOPath = process.env.NEXT_PUBLIC_PURCHASE_PO_REDIRECT || '/nycsystem/services/purchase/PO';
    if (item.href === purchaseMenuPath && pathname === purchaseMenuPath) return true;
    if (item.href === purchasePOPath && pathname.startsWith(purchasePOPath)) return true;

    // For other paths, use exact match or startsWith with additional path segment
    if (item.href !== dashboardRootPath && item.href !== purchaseMenuPath && pathname.startsWith(item.href)) return true;

    return false;
  };

  type SidebarSubItem = { label: string; icon: React.ComponentType; href?: string };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderItem = (item: { label: string; icon: React.ComponentType; href?: string; subItems?: SidebarSubItem[] }, key: string, isSubItem: boolean = false) => {
    const isActive = isPathActive(item);
    const Icon = item.icon;
    const hasSubItems = item.subItems && item.subItems.length > 0;

    // Minimal styling with more breathing room
    const commonClass = `group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm text-left outline-none ` +
      (isActive
        ? (isDarkMode ? 'text-green-400 font-medium bg-green-900/20' : 'text-[#0f9015] font-medium bg-green-50')
        : (isDarkMode ? 'text-slate-300 hover:text-green-400 hover:bg-slate-800/50' : 'text-slate-600 hover:text-[#0f9015] hover:bg-slate-50')) +
      ' focus:ring-1 focus:ring-offset-0 ' + (isDarkMode ? 'focus:ring-green-400/30' : 'focus:ring-green-300/50');

    if (item.href && !hasSubItems) {
      return (
        <Link href={item.href} key={key} className={commonClass} aria-pressed={isActive}>
          {isActive && (
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r transition-all duration-200 ${isDarkMode ? 'bg-green-400' : 'bg-[#0f9015]'}`} />
          )}
          <span className={`text-base transition-all duration-150 ${isActive ? (isDarkMode ? 'text-green-400' : 'text-[#0f9015]') : (isDarkMode ? 'text-slate-400 group-hover:text-green-400' : 'text-slate-400 group-hover:text-[#0f9015]')}`}>
            <Icon />
          </span>
          <span className="truncate font-medium">{item.label}</span>
        </Link>
      );
    }

    // Handle items with sub-items - clickable parent for ระบบจัดซื้อ
    if (hasSubItems && item.label === 'ระบบจัดซื้อ') {
      const isExpanded = showPurchaseMenu;
      // Check if any sub-item is active (for purchase system)
      const hasActiveSubItem = item.subItems?.some((subItem) => isPathActive(subItem));

      // Use active styling if any sub-item is active
      const parentClass = `group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 text-sm text-left outline-none justify-between cursor-pointer ` +
        (hasActiveSubItem
          ? (isDarkMode ? 'text-green-400 font-medium bg-green-900/20' : 'text-[#0f9015] font-medium bg-green-50')
          : (isDarkMode ? 'text-slate-300 hover:text-green-400 hover:bg-slate-800/50' : 'text-slate-600 hover:text-[#0f9015] hover:bg-slate-50')) +
        ' focus:ring-1 focus:ring-offset-0 ' + (isDarkMode ? 'focus:ring-green-400/30' : 'focus:ring-green-300/50');

      return (
        <div key={key} className="space-y-1">
          <button
            onClick={() => setShowPurchaseMenu(!showPurchaseMenu)}
            className={parentClass}
          >
            {hasActiveSubItem && (
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r transition-all duration-200 ${isDarkMode ? 'bg-green-400' : 'bg-[#0f9015]'}`} />
            )}
            <div className="flex items-center gap-3">
              <span className={`text-base transition-all duration-150 ${hasActiveSubItem ? (isDarkMode ? 'text-green-400' : 'text-[#0f9015]') : (isDarkMode ? 'text-slate-400 group-hover:text-green-400' : 'text-slate-400 group-hover:text-[#0f9015]')}`}>
                <Icon />
              </span>
              <span className="truncate font-medium">{item.label}</span>
            </div>
            <FaChevronDown
              className={`text-xs transition-transform duration-200 ${hasActiveSubItem ? (isDarkMode ? 'text-green-400' : 'text-[#0f9015]') : (isDarkMode ? 'text-slate-400' : 'text-slate-400')} ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
          <div className={`ml-6 space-y-0.5 transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
            }`}>
            {item.subItems?.map((subItem, subIndex) => renderItem(subItem, `${key}-sub-${subIndex}`, true))}
          </div>
        </div>
      );
    }

    // Handle other items with sub-items - static display
    if (hasSubItems) {
      return (
        <div key={key} className="space-y-1">
          <div className={`px-3 py-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            <div className="flex items-center gap-3">
              <span className={`text-base ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                <Icon />
              </span>
              <span className="truncate font-medium">{item.label}</span>
            </div>
          </div>
          <div className="ml-6 space-y-0.5">
            {item.subItems?.map((subItem, subIndex) => renderItem(subItem, `${key}-sub-${subIndex}`, true))}
          </div>
        </div>
      );
    }

    // Default button - non-clickable items
    return (
      <div
        key={key}
        className={`px-3 py-2.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
      >
        <div className="flex items-center gap-3">
          <span className={`text-base ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            <Icon />
          </span>
          <span className="truncate font-medium">{item.label}</span>
        </div>
      </div>
    );
  };

  const renderSectionTitle = (title: string) => {
    return (
      <div className={`px-1 pb-2 text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        {title}
      </div>
    );
  };

  return (
    <aside className={`fixed left-6 top-6 h-[calc(100vh-3rem)] w-72 border rounded-2xl flex flex-col z-40 shadow-xl transition-colors duration-200 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#D4E6DA]'}`}>

      {/* Header */}
      <div className="px-5 py-5 flex items-center gap-4" style={{ borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #d1d5db' }}>
        <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg" style={{
          background: isDarkMode ? 'linear-gradient(135deg, #166534 0%, #16a34a 50%, #22c55e 100%)' : 'linear-gradient(135deg, #166534 0%, #16a34a 50%, #22c55e 100%)',
        }}>
          <span className="text-lg font-bold text-white">NYC</span>
        </div>
        <div>
          <div
            className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}
            style={{
              letterSpacing: "1px",
            }}
          >
            NYC
          </div>
          <div className={isDarkMode ? 'text-xs text-gray-400 font-medium' : 'text-xs text-gray-600 font-medium'}>INDUSTRY CO.,LTD.</div>
        </div>
      </div>

      {/* Navigation with custom scrollbar */}
      <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-8" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: isDarkMode ? '#10b981 transparent' : '#10b981 transparent'
      }}>

        {/* Menu Section */}
        <section>
          {renderSectionTitle('Menu')}
          <div className="space-y-0.5">
            {menu.map((m, i) => renderItem(m, `menu-${i}`))}
          </div>
        </section>

        {/* System Section */}
        <section>
          {renderSectionTitle('System')}
          <div className="space-y-0.5">
            {system.map((s, i) => renderItem(s, `sys-${i}`))}
          </div>
        </section>

        {/* Programs Section */}
        <section>
          {renderSectionTitle('Programs')}
          <div className="space-y-0.5">
            {programs.map((p, i) => renderItem(p, `prog-${i}`))}
          </div>
        </section>

        {/* Admin Section */}
        <section>
          {renderSectionTitle('Admin')}
          <div className="space-y-0.5">
            {admin.map((p, i) => renderItem(p, `admin-${i}`))}
          </div>
        </section>
      </nav>

      {/* Footer Section */}
      <footer className={`px-3 py-4 border-t ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
        <div className="space-y-3">
          {/* Version Info */}
          <div className={`flex items-center justify-between text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            <span className="font-medium">Version</span>
            <span className={`px-2 py-1 rounded-md font-mono ${isDarkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
              v0.1.0-beta
            </span>
          </div>

          {/* Developed by */}
          <div className={`text-center space-y-1`}>
            <div className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              จัดทำโดย
            </div>
            <div className={`flex items-center justify-center gap-2`}>
              <div className={`w-6 h-6 rounded flex items-center justify-center ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div className="text-xs">
                <div className={`font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  แผนก IT
                </div>
                <div className={`${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  Information Technology
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className={`text-center text-xs ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
            © 2025 NYC Industry Co.,Ltd.
          </div>
        </div>
      </footer>

      {/* Custom scrollbar styles - minimal and clean */}
      <style jsx global>{`
        nav::-webkit-scrollbar {
          width: 4px;
        }
        nav::-webkit-scrollbar-track {
          background: transparent;
        }
        nav::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#475569' : '#cbd5e1'};
          border-radius: 2px;
        }
        nav::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? '#64748b' : '#94a3b8'};
        }
        nav::-webkit-scrollbar-button {
          display: none;
        }
        nav {
          scrollbar-width: thin;
          scrollbar-color: ${isDarkMode ? '#475569 transparent' : '#cbd5e1 transparent'};
        }
      `}</style>
    </aside>
  );
}