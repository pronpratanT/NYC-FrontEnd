'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  FaBook, FaCar, FaTools, FaDesktop, FaWrench, FaClipboardCheck,
  FaCreditCard, FaServer, FaBoxOpen, FaShoppingCart,FaChevronDown,
  FaLink, FaLeaf, FaDownload, FaCode, FaClock, FaChartLine, FaKey, FaUser
} from 'react-icons/fa';
import { RiDashboardFill } from "react-icons/ri";
import { BsPersonFillGear } from "react-icons/bs";
import { HiUserGroup } from "react-icons/hi2";
import Link from 'next/link';
import { useTheme } from './ThemeProvider';


const menu = [
  { label: 'Dashboard', icon: RiDashboardFill, href: '/' },
  { label: 'คู่มือการใช้งาน', icon: FaBook },
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
  { label: 'ระบบจัดซื้อ', icon: FaShoppingCart, href: '/services/purchase' },
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
  const [showSystem, setShowSystem] = useState(false);
  const [showPrograms, setShowPrograms] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  
  // Helper function to check if current path matches the item
  const isPathActive = (item: { href?: string; label: string }) => {
    if (!item.href) return false;
    if (item.href === '/' && pathname === '/') return true;
    if (item.href !== '/' && pathname.startsWith(item.href)) return true;
    return false;
  };

  const renderItem = (item: { label: string; icon: React.ComponentType; href?: string }, key: string) => {
    const isActive = isPathActive(item);
    const Icon = item.icon;
    const commonClass = `group relative w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm text-left outline-none ` +
      (isActive
        ? (isDarkMode ? 'text-green-400 font-semibold bg-gray-800' : 'text-[#0f9015] font-semibold bg-[#D4E6DA]')
        : (isDarkMode ? 'text-gray-400 hover:text-green-400 hover:bg-gray-800' : 'text-gray-500 hover:text-[#0f9015] hover:bg-[#F0F8F2]')) +
      ' focus:ring-2 ' + (isDarkMode ? 'focus:ring-green-400/20' : 'focus:ring-[#0f9015]/20');

    if (item.href) {
      return (
        <Link href={item.href} key={key} className={commonClass} aria-pressed={isActive}>
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-6 rounded-r-full transition-all duration-200 ${isActive ? (isDarkMode ? 'bg-gradient-to-b from-green-400 to-green-700 shadow-sm' : 'bg-gradient-to-b from-[#0f9015] to-[#2D5F47] shadow-sm') : 'bg-transparent'}`} />
          <span className={`text-lg transition-all duration-200 ${isActive ? (isDarkMode ? 'text-green-400' : 'text-[#0f9015]') : (isDarkMode ? 'text-gray-400 group-hover:text-green-400' : 'text-gray-400 group-hover:text-[#0f9015]')}`}>
            <Icon />
          </span>
          <span className="truncate">{item.label}</span>
        </Link>
      );
    }
    // Default button
    return (
      <button
        key={key}
        aria-pressed={isActive}
        className={commonClass}
      >
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-2 h-6 rounded-r-full transition-all duration-200 ${isActive ? (isDarkMode ? 'bg-gradient-to-b from-green-400 to-green-700 shadow-sm' : 'bg-gradient-to-b from-[#0f9015] to-[#2D5F47] shadow-sm') : 'bg-transparent'}`} />
        <span className={`text-lg transition-all duration-200 ${isActive ? (isDarkMode ? 'text-green-400' : 'text-[#0f9015]') : (isDarkMode ? 'text-gray-400 group-hover:text-green-400' : 'text-gray-400 group-hover:text-[#0f9015]')}`}>
          <Icon />
        </span>
        <span className="truncate">{item.label}</span>
      </button>
    );
  };

  const renderSectionButton = (icon: React.ComponentType, title: string, isExpanded: boolean, onClick: () => void) => {
  const Icon = icon;
    return (
      <button
        onClick={onClick}
        aria-expanded={isExpanded}
        className={`group w-full flex items-center justify-between px-3 py-3 text-sm font-semibold rounded-lg transition-all duration-200 ` +
          (isDarkMode ? 'text-gray-300 hover:bg-gray-800' : 'text-gray-600 hover:bg-[#F0F8F2]')}
      >
        <div className="flex items-center gap-3">
          <span className={isDarkMode ? 'text-green-400 text-base' : 'text-[#0f9015] text-base'}>
            <Icon />
          </span>
          <span>{title}</span>
        </div>
        <FaChevronDown 
          className={`text-xs transition-transform duration-200 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'} ${isExpanded ? 'rotate-180' : ''}`} 
        />
      </button>
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
      <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-6" style={{
        scrollbarWidth: 'thin',
        scrollbarColor: isDarkMode ? '#16a34a #222' : '#16a34a #F0F8F2'
      }}>
        
        {/* Menu Section */}
        <section>
          <div className={`px-2 mb-3 text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Menu</div>
          <div className="space-y-1">
            {menu.map((m, i) => renderItem(m, `menu-${i}`))}
          </div>
        </section>

        {/* Divider */}
        <div className={isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'} />

        {/* System Section */}
        <section>
          {renderSectionButton(FaTools, 'System', showSystem, () => setShowSystem(!showSystem))}
          <div className={`mt-2 space-y-1 pl-2 transition-all duration-300 ${
            showSystem ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}>
            {system.map((s, i) => renderItem(s, `sys-${i}`))}
          </div>
        </section>

        {/* Divider */}
        <div className={isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'} />

        {/* Programs Section */}
        <section>
          {renderSectionButton(FaBoxOpen, 'Programs', showPrograms, () => setShowPrograms(!showPrograms))}
          <div className={`mt-2 space-y-1 pl-2 transition-all duration-300 ${
            showPrograms ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}>
            {programs.map((p, i) => renderItem(p, `prog-${i}`))}
          </div>
        </section>

        {/* Divider */}
        <div className={isDarkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'} />

        {/* admin Section */}
        <section>
          {renderSectionButton(FaBoxOpen, 'Admin', showAdmin, () => setShowAdmin(!showAdmin))}
          <div className={`mt-2 space-y-1 pl-2 transition-all duration-300 ${
            showAdmin ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
          }`}>
            {admin.map((p, i) => renderItem(p, `admin-${i}`))}
          </div>
        </section>
      </nav>

      {/* General Section */}
      {/* <footer className="px-4 py-4 border-t border-gray-200 bg-white">
        <div className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">ทั่วไป</div>
        <div className="space-y-1">
          {general.map((g, i) => {
            const Icon = g.icon;
            const isActive = activeLabel === g.label;
            return (
              <button
                key={`gen-${i}`}
                onClick={() => handleClick(g.label)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors duration-200 ${
                  isActive 
                    ? 'text-[#0f9015] bg-[#D4E6DA] font-medium' 
                    : 'text-gray-500 hover:text-[#0f9015] hover:bg-[#F0F8F2]'
                }`}
              >
                <span className={`text-base ${isActive ? 'text-[#0f9015]' : 'text-gray-400'}`}>
                  <Icon />
                </span>
                <span>{g.label}</span>
              </button>
            );
          })}
        </div>
      </footer> */}

      {/* Custom scrollbar styles */}
      <style jsx global>{`
        nav::-webkit-scrollbar {
          width: 6px;
        }
        nav::-webkit-scrollbar-track {
          background: ${isDarkMode ? '#222' : '#F0F8F2'};
          border-radius: 10px;
        }
        nav::-webkit-scrollbar-thumb {
          background: #2D5F47;
          border-radius: 10px;
        }
        nav::-webkit-scrollbar-thumb:hover {
          background: #0f9015;
        }
        nav::-webkit-scrollbar-button {
          width: 0;
          height: 0;
          display: none;
        }
        nav::-webkit-scrollbar-corner {
          background: transparent;
        }
        nav {
          scrollbar-width: thin;
          scrollbar-color: #2D5F47 ${isDarkMode ? '#222' : '#F0F8F2'};
        }
      `}</style>
    </aside>
  );
}