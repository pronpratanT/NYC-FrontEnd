'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  FaBook, FaCar, FaTools, FaDesktop, FaWrench, FaClipboardCheck,
  FaCreditCard, FaServer, FaBoxOpen, FaShoppingCart, FaChevronDown,
  FaLink, FaLeaf, FaDownload, FaCode, FaClock, FaChartLine, FaKey, FaUser,
  FaFileInvoice, FaClipboardList, FaBars
} from 'react-icons/fa';
import { RiDashboardFill } from "react-icons/ri";
import { BsPersonFillGear } from "react-icons/bs";
import { HiUserGroup } from "react-icons/hi2";
import Link from 'next/link';
import { useTheme } from './ThemeProvider';
import { useSidebar } from '../context/SidebarContext';

// Manual PDF path: set NEXT_PUBLIC_MANUAL_PDF in .env, else fallback
const manualPdfPath = process.env.NEXT_PUBLIC_MANUAL_PDF || '/guidebook/manual.pdf';

const menu = [
  { label: 'Dashboard', icon: RiDashboardFill, href: process.env.NEXT_PUBLIC_DASHBOARD_ROOT_REDIRECT },
  // ใช้ PDF โดยตรง แทนหน้าภายใน; ต้องวางไฟล์ไว้ที่ public/guidebook/manual.pdf หรือกำหนด env NEXT_PUBLIC_MANUAL_PDF
  { label: 'คู่มือการใช้งาน', icon: FaBook, href: manualPdfPath },
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
      { label: 'Purchase Order (PO)', icon: FaFileInvoice, href: process.env.NEXT_PUBLIC_PURCHASE_PO_REDIRECT || '/services/purchase/PO' },
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
];

export default function Sidebar() {
  const { isDarkMode } = useTheme();
  const pathname = usePathname();
  const purchaseMenuPath = process.env.NEXT_PUBLIC_PURCHASE_PR_REDIRECT || '/services/purchase';
  const [showPurchaseMenu, setShowPurchaseMenu] = useState(pathname.startsWith(purchaseMenuPath));
  const { isCollapsed, setIsCollapsed } = useSidebar();
  // Tooltip state for collapsed menu
  const [showTooltip, setShowTooltip] = useState<{ [key: string]: boolean }>({});

  const isPathActive = (item: { href?: string; label: string; subItems?: SidebarSubItem[] }): boolean => {
    if (item.subItems && item.subItems.length > 0) {
      // If any subItem is active, parent is active
      return item.subItems.some((sub) => isPathActive(sub));
    }
    if (!item.href) return false;
    const dashboardRootPath = process.env.NEXT_PUBLIC_LOGIN_SUCCESS_REDIRECT;
    // กำหนด path ที่จะ active สำหรับ PR
    const prActivePaths = [
      '/services/purchase',
      '/services/purchase/createPR',
      '/services/purchase/comparePrice',
    ];
    // กำหนด path ที่จะ active สำหรับ PO
    const poActivePaths = [
      '/services/purchase/PO',
      '/services/purchase/PO/ReviewedPO',
    ];

    // Dashboard: only exact match
    if (item.href === dashboardRootPath) {
      return pathname === dashboardRootPath;
    }

    // PR: active เฉพาะ path ที่กำหนด
    if (item.label === 'Purchase Request (PR)') {
      return prActivePaths.includes(pathname);
    }

    // PO: active เฉพาะ path ที่กำหนด
    if (item.label === 'Purchase Order (PO)') {
      return poActivePaths.includes(pathname);
    }

    // General: highlight if current path starts with item.href
    if (pathname.startsWith(item.href)) return true;

    return false;
  };

  type SidebarIconType = React.ComponentType<{ className?: string }>;
  type SidebarSubItem = { label: string; icon: SidebarIconType; href?: string };
  
  const renderItem = (item: { label: string; icon: SidebarIconType; href?: string; subItems?: SidebarSubItem[] }, key: string) => {
    const isActive = isPathActive(item);
  const Icon = item.icon;
    const hasSubItems = item.subItems && item.subItems.length > 0;

    const commonClass = `group relative w-full flex items-center gap-3 rounded-lg transition-all duration-150 text-sm text-left outline-none ` +
      (isCollapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5') +
      (isActive
        ? (isDarkMode ? ' text-green-400 font-medium bg-green-900/20' : ' text-[#0f9015] font-medium bg-green-50')
        : (isDarkMode ? ' text-slate-300 hover:text-green-400 hover:bg-slate-800/50' : ' text-slate-600 hover:text-[#0f9015] hover:bg-slate-50')) +
      ' focus:ring-1 focus:ring-offset-0 ' + (isDarkMode ? 'focus:ring-green-400/30' : 'focus:ring-green-300/50');

    if (item.href && !hasSubItems) {
      const isPdf = item.href.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        // เปิด PDF ในแท็บใหม่เพื่อให้ตัว viewer ของ browser ทำงาน
        return (
          <button
            key={key}
            onClick={() => window.open(item.href, '_blank', 'noopener')}
            className={commonClass}
            aria-pressed={false}
            title={isCollapsed ? item.label : undefined}
            type="button"
          >
            {isActive && !isCollapsed && (
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r transition-all duration-200 ${isDarkMode ? 'bg-green-400' : 'bg-[#0f9015]'}`} />
            )}
            <span className={`text-base transition-all duration-150 ${(isDarkMode ? 'text-slate-400 group-hover:text-green-400' : 'text-slate-400 group-hover:text-[#0f9015]')}`}>
              <Icon className="w-5 h-5" />
            </span>
            {!isCollapsed && <span className="truncate font-medium">{item.label}</span>}
          </button>
        );
      }
      return (
        <Link
          href={item.href}
          key={key}
          className={commonClass}
          aria-pressed={isActive}
          title={isCollapsed ? item.label : undefined}
        >
          {isActive && !isCollapsed && (
            <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r transition-all duration-200 ${isDarkMode ? 'bg-green-400' : 'bg-[#0f9015]'}`} />
          )}
          <span className={`text-base transition-all duration-150 ${isActive ? (isDarkMode ? 'text-green-400' : 'text-[#0f9015]') : (isDarkMode ? 'text-slate-400 group-hover:text-green-400' : 'text-slate-400 group-hover:text-[#0f9015]')}`}>
            <Icon className="w-5 h-5" />
          </span>
          {!isCollapsed && <span className="truncate font-medium">{item.label}</span>}
        </Link>
      );
    }

    if (hasSubItems && item.label === 'ระบบจัดซื้อ') {
      const isExpanded = showPurchaseMenu;
      const hasActiveSubItem = item.subItems?.some((subItem) => isPathActive(subItem));

      const parentClass = `group relative w-full flex items-center gap-3 rounded-lg transition-all duration-150 text-sm text-left outline-none cursor-pointer ` +
        (isCollapsed ? 'px-2 py-2.5 justify-center' : 'px-3 py-2.5 justify-between') +
        (hasActiveSubItem
          ? (isDarkMode ? ' text-green-400 font-medium bg-green-900/20' : ' text-[#0f9015] font-medium bg-green-50')
          : (isDarkMode ? ' text-slate-300 hover:text-green-400 hover:bg-slate-800/50' : ' text-slate-600 hover:text-[#0f9015] hover:bg-slate-50')) +
        ' focus:ring-1 focus:ring-offset-0 ' + (isDarkMode ? 'focus:ring-green-400/30' : 'focus:ring-green-300/50');

      if (isCollapsed) {
        return (
          <div key={key} className="relative">
            <button
              className={parentClass}
              onMouseEnter={() => setShowTooltip(prev => ({ ...prev, [key]: true }))}
              onMouseLeave={() => setShowTooltip(prev => ({ ...prev, [key]: false }))}
              onClick={() => setShowPurchaseMenu(!showPurchaseMenu)}
            >
              {hasActiveSubItem && (
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r transition-all duration-200 ${isDarkMode ? 'bg-green-400' : 'bg-[#0f9015]'}`} />
              )}
              <span className={`text-base transition-all duration-150 ${hasActiveSubItem ? (isDarkMode ? 'text-green-400' : 'text-[#0f9015]') : (isDarkMode ? 'text-slate-400 group-hover:text-green-400' : 'text-slate-400 group-hover:text-[#0f9015]')}`}>
                <Icon />
              </span>
              {isExpanded && (
                <div className={`absolute -right-1 -top-1 w-2 h-2 rounded-full ${isDarkMode ? 'bg-green-400' : 'bg-green-500'}`}></div>
              )}
            </button>
            {/* Tooltip Popup Menu */}
            {showTooltip[key] && (
              <div
                className={`absolute left-full ml-2 top-0 z-50 rounded-lg shadow-2xl border overflow-hidden transition-all duration-200 ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}
                style={{ minWidth: '200px' }}
              >
                <div className={`px-3 py-2 border-b font-semibold text-sm ${isDarkMode ? 'bg-gray-700/50 border-gray-600 text-green-400' : 'bg-gray-50 border-gray-200 text-green-700'}`}>
                  {item.label}
                </div>
                <div className="py-1">
                  {item.subItems?.map((subItem, idx) => {
                    const SubIcon = subItem.icon;
                    const isSubActive = isPathActive(subItem);
                    return (
                      <Link
                        key={idx}
                        href={subItem.href || '#'}
                        className={`flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                          isSubActive
                            ? (isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700')
                            : (isDarkMode ? 'text-slate-300 hover:bg-slate-700/50 hover:text-green-400' : 'text-slate-600 hover:bg-slate-50 hover:text-green-600')
                        }`}
                      >
                        <SubIcon className={`text-sm ${isSubActive ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-slate-400' : 'text-slate-400')}`} />
                        <span className="font-medium">{subItem.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      }

      return (
        <div key={key} className="space-y-1">
          <button onClick={() => setShowPurchaseMenu(!showPurchaseMenu)} className={parentClass}>
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
          
          {/* Expanded Submenu */}
          <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className={`ml-4 mt-1 space-y-0.5 pl-4 border-l-2 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              {item.subItems?.map((subItem, subIndex) => {
                const SubIcon = subItem.icon;
                const isSubActive = isPathActive(subItem);
                return (
                  <Link
                    key={subIndex}
                    href={subItem.href || '#'}
                    className={`group relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                      isSubActive
                        ? (isDarkMode ? 'bg-green-900/30 text-green-400 font-medium' : 'bg-green-50 text-green-700 font-medium')
                        : (isDarkMode ? 'text-slate-400 hover:text-green-400 hover:bg-slate-800/30' : 'text-slate-500 hover:text-green-600 hover:bg-slate-50')
                    }`}
                  >
                    <SubIcon className={`text-sm ${isSubActive ? (isDarkMode ? 'text-green-400' : 'text-green-600') : ''}`} />
                    <span>{subItem.label}</span>
                    {isSubActive && (
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r ${isDarkMode ? 'bg-green-400' : 'bg-green-600'}`} />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (hasSubItems) {
      if (isCollapsed) {
        return (
          <div key={key} className={`relative group/collapsed ${isCollapsed ? 'px-2 py-2.5' : 'px-3 py-2'} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} title={item.label}>
            <span className={`text-base ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              <Icon />
            </span>
          </div>
        );
      }

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
            {item.subItems?.map((subItem, subIndex) => renderItem(subItem, `${key}-sub-${subIndex}`))}
          </div>
        </div>
      );
    }

    return (
      <div
        key={key}
        className={`${isCollapsed ? 'px-2 py-2.5' : 'px-3 py-2.5'} ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
        title={isCollapsed ? item.label : undefined}
      >
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
          <span className={`text-base ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            <Icon />
          </span>
          {!isCollapsed && <span className="truncate font-medium">{item.label}</span>}
        </div>
      </div>
    );
  };

  const renderSectionTitle = (title: string) => {
    if (isCollapsed) return null;
    return (
      <div className={`px-1 pb-2 text-xs font-medium uppercase tracking-wider ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        {title}
      </div>
    );
  };

  return (
    <aside 
      className={`fixed left-6 top-6 h-[calc(100vh-3rem)] border rounded-2xl flex flex-col z-40 shadow-xl transition-all duration-300 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-[#D4E6DA]'}`}
      style={{ width: isCollapsed ? '80px' : '288px' }}
    >
      {/* Header */}
      <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'px-3 py-5 justify-center' : 'px-5 py-5 gap-4'}`} style={{ borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #d1d5db' }}>
        {!isCollapsed && (
          <>
            <div className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg" style={{
              background: isDarkMode ? 'linear-gradient(135deg, #166534 0%, #16a34a 50%, #22c55e 100%)' : 'linear-gradient(135deg, #166534 0%, #16a34a 50%, #22c55e 100%)',
            }}>
              <span className="text-lg font-bold text-white">NYC</span>
            </div>
            <div>
              <div className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-700'}`} style={{ letterSpacing: "1px" }}>
                NYC
              </div>
              <div className={isDarkMode ? 'text-xs text-gray-400 font-medium' : 'text-xs text-gray-600 font-medium'}>INDUSTRY CO.,LTD.</div>
            </div>
          </>
        )}
        {isCollapsed && (
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg" style={{
            background: isDarkMode ? 'linear-gradient(135deg, #166534 0%, #16a34a 50%, #22c55e 100%)' : 'linear-gradient(135deg, #166534 0%, #16a34a 50%, #22c55e 100%)',
          }}>
            <span className="text-sm font-bold text-white">NYC</span>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute -right-3 top-20 w-6 h-6 rounded-full shadow-lg flex items-center justify-center transition-colors duration-200 ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700 text-green-400 border border-gray-600' : 'bg-white hover:bg-gray-50 text-green-600 border border-gray-300'}`}
        title={isCollapsed ? 'ขยาย Sidebar' : 'ย่อ Sidebar'}
      >
        <FaBars className={`text-xs transition-transform duration-300 ${isCollapsed ? 'rotate-0' : 'rotate-180'}`} />
      </button>

      {/* Navigation */}
      <nav className={`flex-1 overflow-y-auto py-6 space-y-8 ${isCollapsed ? 'px-2' : 'px-3'}`} style={{
        scrollbarWidth: 'thin',
        scrollbarColor: isDarkMode ? '#10b981 transparent' : '#10b981 transparent'
      }}>
        <section>
          {renderSectionTitle('Menu')}
          <div className="space-y-0.5">
            {menu.map((m, i) => renderItem(m, `menu-${i}`))}
          </div>
        </section>

        <section>
          {renderSectionTitle('System')}
          <div className="space-y-0.5">
            {system.map((s, i) => renderItem(s, `sys-${i}`))}
          </div>
        </section>

        <section>
          {renderSectionTitle('Programs')}
          <div className="space-y-0.5">
            {programs.map((p, i) => renderItem(p, `prog-${i}`))}
          </div>
        </section>

        {/* <section>
          {renderSectionTitle('Admin')}
          <div className="space-y-0.5">
            {admin.map((p, i) => renderItem(p, `admin-${i}`))}
          </div>
        </section> */}
      </nav>

      {/* Footer */}
      {!isCollapsed && (
        <footer className={`px-3 py-4 border-t ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200'}`}>
          <div className="space-y-3">
            <div className={`flex items-center justify-between text-xs ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              <span className="font-medium">Version</span>
              <span className={`px-2 py-1 rounded-md font-mono ${isDarkMode ? 'bg-slate-800/50 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>
                v0.3.2-beta
              </span>
            </div>

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

            <div className={`text-center text-xs ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
              © 2025 NYC Industry Co.,Ltd.
            </div>
          </div>
        </footer>
      )}

      {/* Custom scrollbar styles */}
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