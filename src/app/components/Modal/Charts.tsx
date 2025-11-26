'use client';
import React, { useEffect, useState } from 'react';

import { useToken } from '../../context/TokenContext';

type RecentPurchase = {
    vendor_id: number;
    vendor_name: string;
    price: number;
    price_for_approve: number;
    discount: number[];
    date: string;
    due_date: string;
}

type CompareVendorData = {
    compare_id: number;
    vendor_id: number;
    vendor_name: string;
    vendor_code: string;
    email: string;
    tax_id: string;
    fax_no: string;
    contact_name: string;
    tel: string;
    credit_term: string;
    price: number;
    discount: number[];
    due_date: string;
    date_shipped: string;
}

type PartInventory = {
    pr_list_id: number;
    prod_code: string;
    prod_detail: string;
    dept_request: string;
    pr_no: string;
    date_compare: string;
    qty: number;
    unit: string;
    po_no: string;
    recent_purchase: RecentPurchase | RecentPurchase[]; // Can be object or array
    status: string;
    approval_name: string;
    responsible_name: string;
    reason_choose: string;
    compare_vendors: CompareVendorData[];
}
export type Charts = {
    pcl_id: number;
    part_no: string;
    choose_vendor: number;
    requester_name: string;
    dept_request: string;
    pu_responsible: string;
    part_inventory_and_pr: PartInventory[];
};

type ChartsModalProps = {
    isDarkMode: boolean;
    onClose: () => void;
    partNo?: string;
    pr_list_id?: number;
};

export default function ChartsModal({ onClose, isDarkMode, partNo, pr_list_id }: ChartsModalProps) {
    const token = useToken();
    const [dataCharts, setDataCharts] = React.useState<Charts[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [hoveredPoint, setHoveredPoint] = useState<{
        x: number;
        y: number;
        data: {
            vendor: string;
            price: number;
            approve: number;
            date: string;
            type: 'price' | 'approve';
            index: number;
            discount: number[];
            dateCompare: string;
            qty: number;
            unit: string;
        };
    } | null>(null);
    
    const [hoveredVendorGroup, setHoveredVendorGroup] = useState<{
        x: number;
        date: string;
        vendors: Array<{
            vendor: string;
            price: number;
            color: string;
            discount: number[];
            creditTerm: string;
            tel: string;
        }>;
    } | null>(null);
    
    const [selectedYear, setSelectedYear] = useState<string>('all');

    useEffect(() => {
        const fetchDataCharts = async () => {
            if (!partNo || !pr_list_id || !token) return;
            
            try {
                setLoading(true);
                const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pcl/doc?part_no=${partNo}&pr_list_id=${pr_list_id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (!response.ok) {
                    throw new Error('Failed to fetch chart data');
                }
                const chartData = await response.json();
                console.log('Raw chartData:', chartData);
                
                // Handle response structure: { data: {...}, message: "...", status: "..." }
                let dataArray: Charts[];
                if (chartData?.data) {
                    // If data is wrapped in a response object
                    if (Array.isArray(chartData.data)) {
                        dataArray = chartData.data;
                    } else {
                        dataArray = [chartData.data];
                    }
                } else if (Array.isArray(chartData)) {
                    dataArray = chartData;
                } else if (chartData) {
                    dataArray = [chartData];
                } else {
                    dataArray = [];
                }
                
                console.log('Setting dataCharts:', dataArray);
                setDataCharts(dataArray);
            } catch (error) {
                console.error('Error fetching chart data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDataCharts();
    }, [partNo, pr_list_id, token]);

    // Extract all years from the data
    const availableYears = React.useMemo(() => {
        const years = new Set<number>();
        dataCharts.forEach(chart => {
            chart.part_inventory_and_pr?.forEach(pr => {
                if (pr.date_compare) {
                    years.add(new Date(pr.date_compare).getFullYear());
                }
            });
        });
        return Array.from(years).sort((a, b) => b - a); // Sort descending (newest first)
    }, [dataCharts]);

    // Extract recent purchases from the data
    const recentPurchases = React.useMemo(() => {
        console.log('Computing recentPurchases...');
        console.log('dataCharts:', dataCharts);
        console.log('pr_list_id:', pr_list_id);
        console.log('selectedYear:', selectedYear);
        
        const purchases: (RecentPurchase & { date_compare: string; qty: number; unit: string })[] = [];
        dataCharts.forEach((chart, idx) => {
            console.log(`Chart ${idx}:`, chart);
            
            // recent_purchase is an object, not an array
            chart.part_inventory_and_pr?.forEach((pr, prIdx) => {
                console.log(`  PR ${prIdx} (pr_list_id: ${pr.pr_list_id}):`, pr);
                
                // Filter by year
                if (selectedYear !== 'all') {
                    const prYear = new Date(pr.date_compare).getFullYear();
                    if (prYear.toString() !== selectedYear) {
                        return; // Skip this PR if year doesn't match
                    }
                }
                
                if (pr.recent_purchase) {
                    // Check if it's an object or array
                    if (Array.isArray(pr.recent_purchase)) {
                        console.log(`    Adding ${pr.recent_purchase.length} purchases (array)`);
                        purchases.push(...pr.recent_purchase.map(p => ({ ...p, date_compare: pr.date_compare, qty: pr.qty, unit: pr.unit })));
                    } else {
                        console.log(`    Adding 1 purchase (object)`);
                        purchases.push({ ...pr.recent_purchase, date_compare: pr.date_compare, qty: pr.qty, unit: pr.unit });
                    }
                }
            });
        });
        
        console.log('Total recentPurchases:', purchases.length, purchases);
        return purchases;
    }, [dataCharts, pr_list_id, selectedYear]);

    // Extract compare vendors data and group by date
    const compareVendorsByDate = React.useMemo(() => {
        const vendors: (CompareVendorData & { date_compare: string; qty: number; unit: string })[] = [];
        dataCharts.forEach((chart) => {
            chart.part_inventory_and_pr?.forEach((pr) => {
                // Filter by year
                if (selectedYear !== 'all') {
                    const prYear = new Date(pr.date_compare).getFullYear();
                    if (prYear.toString() !== selectedYear) {
                        return; // Skip this PR if year doesn't match
                    }
                }
                
                if (pr.compare_vendors && pr.compare_vendors.length > 0) {
                    vendors.push(...pr.compare_vendors.map(v => ({ 
                        ...v, 
                        date_compare: pr.date_compare,
                        qty: pr.qty,
                        unit: pr.unit
                    })));
                }
            });
        });
        
        // Group by date
        const grouped = vendors.reduce((acc, vendor) => {
            const dateKey = new Date(vendor.date_compare).toDateString();
            if (!acc[dateKey]) {
                acc[dateKey] = [];
            }
            acc[dateKey].push(vendor);
            return acc;
        }, {} as Record<string, typeof vendors>);
        
        // Sort dates and return as array
        const sortedDates = Object.keys(grouped).sort((a, b) => 
            new Date(a).getTime() - new Date(b).getTime()
        );
        
        console.log('Grouped compareVendors by date:', grouped);
        return sortedDates.map(date => ({
            date,
            vendors: grouped[date]
        }));
    }, [dataCharts, selectedYear]);

    // Generate consistent color for each vendor based on name
    const getVendorColor = React.useCallback((vendorName: string) => {
        // Simple hash function to generate consistent color from vendor name
        let hash = 0;
        for (let i = 0; i < vendorName.length; i++) {
            hash = vendorName.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        // Convert to hue value (0-360)
        const hue = Math.abs(hash % 360);
        
        // Use HSL for better color distribution
        // Saturation 70%, Lightness 55% for good visibility
        return `hsl(${hue}, 70%, 55%)`;
    }, []);

    // Calculate max price for chart scaling
    const maxPrice = React.useMemo(() => {
        if (recentPurchases.length === 0) return 0;
        return Math.max(...recentPurchases.map(p => p.price));
    }, [recentPurchases]);

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className={`w-full max-w-5xl mx-4 rounded-2xl shadow-2xl border p-6 relative max-h-[90vh] flex flex-col ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-4">
                            <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>ประวัติราคาการซื้อ</h3>
                            
                            {/* Year Filter */}
                            {availableYears.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                        ปี:
                                    </label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                                            isDarkMode 
                                                ? 'bg-slate-800 border-slate-600 text-slate-200 hover:border-slate-500' 
                                                : 'bg-white border-slate-300 text-slate-700 hover:border-slate-400'
                                        } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                    >
                                        <option value="all">ทั้งหมด</option>
                                        {availableYears.map(year => (
                                            <option key={year} value={year.toString()}>
                                                {year + 543}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        
                        {(partNo || pr_list_id) && (
                            <div className="flex gap-3 mt-2">
                                {partNo && (
                                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${isDarkMode ? 'bg-blue-900/40 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                        Part No: {partNo}
                                    </span>
                                )}
                                {pr_list_id && (
                                    <span className={`text-xs px-2 py-1 rounded-md font-medium ${isDarkMode ? 'bg-purple-900/40 text-purple-300 border border-purple-800' : 'bg-purple-50 text-purple-700 border border-purple-200'}`}>
                                        PR List ID: {pr_list_id}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                    {/* <button
                        type="button"
                        onClick={onClose}
                        className={`px-3 py-1 rounded-lg text-sm font-medium border transition ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'}`}
                        aria-label="ปิดกราฟ"
                    >ปิด</button> */}
                </div>

                {/* Content Area */}
                <div 
                    className={`flex-1 space-y-4 smooth-scroll ${isDarkMode ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'}`} 
                    style={{ 
                        maxHeight: 'calc(90vh - 120px)', 
                        overflowY: 'auto', 
                        overflowX: 'visible',
                        scrollBehavior: 'smooth'
                    }}
                >
                    <style jsx>{`
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
                    `}</style>
                    {loading && (
                        <div className={`text-center py-16 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-current mb-3"></div>
                            <p>กำลังโหลดข้อมูล...</p>
                        </div>
                    )}

                    {!loading && recentPurchases.length === 0 && (
                        <div className={`text-center py-16 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                            <div className="text-4xl mb-3">📊</div>
                            <p>ไม่พบประวัติการซื้อ</p>
                        </div>
                    )}

                    {!loading && recentPurchases.length > 0 && (
                        <div className="space-y-4" style={{ overflow: 'visible', position: 'relative' }}>
                            {/* Summary Stats */}
                            <div className={`p-4 rounded-xl border mb-4 ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                <h4 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>สรุปประวัติราคา</h4>
                                <div className="flex flex-wrap gap-3">
                                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${isDarkMode ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                        สูงสุด ฿{Math.max(...recentPurchases.map(p => p.price)).toLocaleString()}
                                    </span>
                                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${isDarkMode ? 'bg-teal-900/40 text-teal-300 border border-teal-800' : 'bg-teal-50 text-teal-700 border-teal-200 border'}`}>
                                        ต่ำสุด ฿{Math.min(...recentPurchases.map(p => p.price)).toLocaleString()}
                                    </span>
                                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${isDarkMode ? 'bg-purple-900/40 text-purple-300 border border-purple-800' : 'bg-purple-50 text-purple-700 border-purple-200 border'}`}>
                                        เฉลี่ย ฿{(recentPurchases.reduce((sum, p) => sum + p.price, 0) / recentPurchases.length).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                    </span>
                                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${isDarkMode ? 'bg-blue-900/40 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                        {recentPurchases.length} รายการ
                                    </span>
                                </div>
                            </div>

                            {/* Line Chart */}
                            <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`} style={{ overflow: 'visible', position: 'relative' }}>
                                <div className="mb-6 flex items-center justify-between">
                                    <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>กราฟประวัติการซื้อ</h4>
                                    <div className="flex gap-4 text-xs">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-0.5 bg-green-500"></div>
                                            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>ราคา</span>
                                        </div>
                                        {/* <div className="flex items-center gap-2">
                                            <div className="w-8 h-0.5 bg-emerald-500 opacity-50"></div>
                                            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>ราคาอนุมัติ</span>
                                        </div> */}
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-0.5 bg-amber-500"></div>
                                            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>จำนวน</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Chart SVG */}
                                <div 
                                    id="chart-container"
                                    className={`w-full relative ${isDarkMode ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'}`}
                                    style={{ 
                                        height: '300px', 
                                        overflow: 'visible',
                                        overflowX: recentPurchases.length > 15 ? 'auto' : 'visible',
                                        paddingBottom: recentPurchases.length > 15 ? '10px' : '0'
                                    }}
                                    onMouseLeave={() => setHoveredPoint(null)}
                                >
                                    <svg 
                                        width={recentPurchases.length > 15 ? `${recentPurchases.length * 60}px` : '100%'} 
                                        height="100%" 
                                        viewBox={`0 0 ${recentPurchases.length > 15 ? recentPurchases.length * 60 : 800} 300`} 
                                        preserveAspectRatio="none" 
                                        className="overflow-visible"
                                    >
                                        {(() => {
                                            const padding = 50;
                                            const chartWidth = recentPurchases.length > 15 ? recentPurchases.length * 60 : 800;
                                            const chartHeight = 300;
                                            const allPrices = recentPurchases.flatMap(p => [p.price || 0, p.price_for_approve || 0]);
                                            const maxPrice = Math.max(...allPrices);
                                            const minPrice = Math.min(...allPrices);
                                            const priceRange = maxPrice - minPrice || 1;
                                            
                                            // Calculate qty range for secondary axis
                                            const allQty = recentPurchases.map(p => p.qty).filter(q => q != null && q > 0);
                                            const maxQty = allQty.length > 0 ? Math.max(...allQty) : 100;
                                            const minQty = allQty.length > 0 ? Math.min(...allQty) : 0;
                                            const qtyRange = maxQty - minQty || maxQty || 1;
                                            
                                            const points = recentPurchases.map((p, i) => ({
                                                x: padding + (i / Math.max(recentPurchases.length - 1, 1)) * (chartWidth - padding * 2),
                                                yPrice: chartHeight - padding - (((p.price || 0) - minPrice) / priceRange) * (chartHeight - padding * 2),
                                                yApprove: chartHeight - padding - (((p.price_for_approve || 0) - minPrice) / priceRange) * (chartHeight - padding * 2),
                                                yQty: p.qty != null && p.qty > 0 
                                                    ? chartHeight - padding - (((p.qty) - minQty) / qtyRange) * (chartHeight - padding * 2)
                                                    : null,
                                                price: p.price || 0,
                                                approve: p.price_for_approve || 0,
                                                vendor: p.vendor_name,
                                                date: p.date,
                                                discount: p.discount || [],
                                                dateCompare: p.date_compare,
                                                qty: p.qty,
                                                unit: p.unit
                                            }));

                                            // Create smooth curved paths using cubic bezier
                                            let pricePathD = `M ${points[0].x},${points[0].yPrice}`;
                                            let approvePathD = `M ${points[0].x},${points[0].yApprove}`;
                                            
                                            // Build qty path only with valid points
                                            const validQtyPoints = points.filter(p => p.yQty !== null);
                                            let qtyPathD = '';
                                            if (validQtyPoints.length > 0) {
                                                qtyPathD = `M ${validQtyPoints[0].x},${validQtyPoints[0].yQty}`;
                                                for (let i = 1; i < validQtyPoints.length; i++) {
                                                    const prev = validQtyPoints[i - 1];
                                                    const curr = validQtyPoints[i];
                                                    const dx = curr.x - prev.x;
                                                    const cp1x = prev.x + dx * 0.5;
                                                    const cp2x = curr.x - dx * 0.5;
                                                    qtyPathD += ` C ${cp1x},${prev.yQty} ${cp2x},${curr.yQty} ${curr.x},${curr.yQty}`;
                                                }
                                            }
                                            
                                            for (let i = 1; i < points.length; i++) {
                                                const prev = points[i - 1];
                                                const curr = points[i];
                                                
                                                // Calculate control points for smooth curve
                                                const dx = curr.x - prev.x;
                                                const cp1x = prev.x + dx * 0.5;
                                                const cp2x = curr.x - dx * 0.5;
                                                
                                                pricePathD += ` C ${cp1x},${prev.yPrice} ${cp2x},${curr.yPrice} ${curr.x},${curr.yPrice}`;
                                                approvePathD += ` C ${cp1x},${prev.yApprove} ${cp2x},${curr.yApprove} ${curr.x},${curr.yApprove}`;
                                            }

                                            return (
                                                <>
                                                    {/* Grid lines */}
                                                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                                                        const y = chartHeight - padding - ratio * (chartHeight - padding * 2);
                                                        const price = minPrice + ratio * priceRange;
                                                        const qty = minQty + ratio * qtyRange;
                                                        return (
                                                            <g key={i}>
                                                                <line 
                                                                    x1={padding} 
                                                                    y1={y} 
                                                                    x2={chartWidth - padding} 
                                                                    y2={y} 
                                                                    stroke={isDarkMode ? '#334155' : '#e2e8f0'} 
                                                                    strokeWidth="1"
                                                                    strokeDasharray="4 4"
                                                                />
                                                                {/* Price labels (left) */}
                                                                <text 
                                                                    x={padding - 10} 
                                                                    y={y + 4} 
                                                                    textAnchor="end" 
                                                                    fontSize="11" 
                                                                    fill={isDarkMode ? '#10b981' : '#059669'}
                                                                >
                                                                    ฿{price.toFixed(0)}
                                                                </text>
                                                                {/* Qty labels (right) */}
                                                                <text 
                                                                    x={chartWidth - padding + 10} 
                                                                    y={y + 4} 
                                                                    textAnchor="start" 
                                                                    fontSize="11" 
                                                                    fill={isDarkMode ? '#f59e0b' : '#d97706'}
                                                                >
                                                                    {qty.toFixed(0)}
                                                                </text>
                                                            </g>
                                                        );
                                                    })}
                                                    
                                                    {/* Lines */}
                                                    <path d={pricePathD} fill="none" stroke="#05df72" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                    {/* <path d={approvePathD} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" /> */}
                                                    {qtyPathD && <path d={qtyPathD} fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="5 5" />}
                                                    
                                                    {/* Points */}
                                                    {points.map((point, i) => {
                                                        const vendorColor = point.vendor === 'No Vendor Selected' 
                                                            ? (isDarkMode ? '#6b7280' : '#9ca3af')
                                                            : getVendorColor(point.vendor);
                                                        return (
                                                            <g key={i}>
                                                                {/* Price Point */}
                                                                <circle 
                                                                    cx={point.x} 
                                                                    cy={point.yPrice} 
                                                                    r={hoveredPoint?.data.index === i && hoveredPoint?.data.type === 'price' ? '10' : '8'}
                                                                    fill={vendorColor} 
                                                                    stroke={isDarkMode ? '#1e293b' : '#fff'} 
                                                                    strokeWidth="3"
                                                                    className="cursor-pointer transition-all duration-200 hover:r-10"
                                                                    style={{
                                                                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                                                                    }}
                                                                    onMouseEnter={(e) => {
                                                                        const circle = e.currentTarget as SVGCircleElement;
                                                                        const rect = circle.getBoundingClientRect();
                                                                        setHoveredPoint({
                                                                            x: rect.left + rect.width / 2,
                                                                            y: rect.top,
                                                                            data: {
                                                                                vendor: point.vendor,
                                                                                price: point.price,
                                                                                approve: point.approve,
                                                                                date: point.date,
                                                                                type: 'price',
                                                                                index: i,
                                                                                discount: point.discount,
                                                                                dateCompare: point.dateCompare,
                                                                                qty: point.qty,
                                                                                unit: point.unit
                                                                            }
                                                                        });
                                                                    }}
                                                            />
                                                            
                                                            {/* Approve Point */}
                                                            {/* <circle 
                                                                cx={point.x} 
                                                                cy={point.yApprove} 
                                                                r={hoveredPoint?.data.index === i && hoveredPoint?.data.type === 'approve' ? '10' : '8'}
                                                                fill={vendorColor} 
                                                                stroke={isDarkMode ? '#1e293b' : '#fff'} 
                                                                strokeWidth="3"
                                                                className="cursor-pointer transition-all duration-200"
                                                                style={{
                                                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                                                                    opacity: 0.7
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    const container = document.getElementById('chart-container');
                                                                    if (container) {
                                                                        const svg = container.querySelector('svg');
                                                                        if (!svg) return;
                                                                        const svgRect = svg.getBoundingClientRect();
                                                                        const containerRect = container.getBoundingClientRect();
                                                                        const percentX = point.x / chartWidth;
                                                                        const percentY = point.yApprove / 300;
                                                                        setHoveredPoint({
                                                                            x: svgRect.left + percentX * svgRect.width,
                                                                            y: svgRect.top + percentY * svgRect.height,
                                                                            data: {
                                                                                vendor: point.vendor,
                                                                                price: point.price,
                                                                                approve: point.approve,
                                                                                date: point.date,
                                                                                type: 'approve',
                                                                                index: i,
                                                                                discount: point.discount,
                                                                                dateCompare: point.dateCompare,
                                                                                qty: point.qty,
                                                                                unit: point.unit
                                                                            }
                                                                        });
                                                                    }
                                                                }}
                                                            /> */}
                                                            
                                                            <text 
                                                                x={point.x} 
                                                                y={chartHeight - padding + 20} 
                                                                textAnchor="middle" 
                                                                fontSize="10" 
                                                                fill={isDarkMode ? '#94a3b8' : '#64748b'}
                                                                transform={points.length > 10 ? `rotate(-45 ${point.x} ${chartHeight - padding + 20})` : ''}
                                                                style={{
                                                                    display: i > 0 && new Date(point.dateCompare).toLocaleDateString('th-TH') === new Date(points[i-1].dateCompare).toLocaleDateString('th-TH') ? 'none' : 'block'
                                                                }}
                                                            >
                                                                {new Date(point.dateCompare).toLocaleDateString('th-TH', { 
                                                                    month: points.length > 10 ? 'numeric' : 'short', 
                                                                    day: 'numeric',
                                                                    year: points.length > 10 ? '2-digit' : undefined
                                                                })}
                                                            </text>
                                                        </g>
                                                        );
                                                    })}
                                                </>
                                            );
                                        })()}
                                    </svg>
                                    
                                    {/* Custom Tooltip */}
                                    {hoveredPoint && (
                                        <div 
                                            className={`fixed z-[10001] pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-3 min-w-[220px] ${
                                                isDarkMode 
                                                    ? 'bg-slate-800 border-slate-600 shadow-2xl' 
                                                    : 'bg-white border-slate-200 shadow-xl'
                                            } border-2 rounded-xl p-4`}
                                            style={{
                                                left: `${hoveredPoint.x}px`,
                                                top: `${hoveredPoint.y}px`,
                                                boxShadow: isDarkMode 
                                                    ? '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)' 
                                                    : '0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            {/* Arrow */}
                                            <div 
                                                className={`absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-full w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent ${
                                                    isDarkMode ? 'border-t-slate-800' : 'border-t-white'
                                                }`}
                                                style={{
                                                    filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.1))'
                                                }}
                                            />
                                            
                                            {/* Header */}
                                            <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                                <div 
                                                    className="w-3 h-3 rounded-full" 
                                                    style={{ 
                                                        backgroundColor: hoveredPoint.data.vendor === 'No Vendor Selected' 
                                                            ? (isDarkMode ? '#6b7280' : '#9ca3af')
                                                            : getVendorColor(hoveredPoint.data.vendor),
                                                        boxShadow: hoveredPoint.data.vendor === 'No Vendor Selected'
                                                            ? `0 0 8px ${isDarkMode ? '#6b728080' : '#9ca3af80'}`
                                                            : `0 0 8px ${getVendorColor(hoveredPoint.data.vendor)}80`,
                                                        opacity: hoveredPoint.data.type === 'approve' ? 0.7 : 1
                                                    }}
                                                />
                                                <span className={`font-semibold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                                    {hoveredPoint.data.vendor}
                                                </span>
                                            </div>
                                            
                                            {/* Content */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                        ราคา:
                                                    </span>
                                                    <span className={`text-sm font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                                        ฿{hoveredPoint.data.price.toLocaleString()}
                                                    </span>
                                                </div>
                                                
                                                {/* <div className="flex justify-between items-center">
                                                    <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                        ราคาอนุมัติ:
                                                    </span>
                                                    <span className={`text-sm font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                                        ฿{hoveredPoint.data.approve.toLocaleString()}
                                                    </span>
                                                </div> */}
                                                
                                                {hoveredPoint.data.discount && hoveredPoint.data.discount.length > 0 && (
                                                    <div className="flex justify-between items-center">
                                                        <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                            ส่วนลด %:
                                                        </span>
                                                        <span className={`text-sm font-semibold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                                            {hoveredPoint.data.discount.join(', ')}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {/* {hoveredPoint.data.price !== hoveredPoint.data.approve && (
                                                    <div className="flex justify-between items-center pt-1">
                                                        <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                            ส่วนต่าง:
                                                        </span>
                                                        <span className={`text-xs font-semibold ${
                                                            hoveredPoint.data.approve > hoveredPoint.data.price 
                                                                ? (isDarkMode ? 'text-red-400' : 'text-red-600')
                                                                : (isDarkMode ? 'text-green-400' : 'text-green-600')
                                                        }`}>
                                                            {hoveredPoint.data.approve > hoveredPoint.data.price ? '+' : ''}
                                                            ฿{(hoveredPoint.data.approve - hoveredPoint.data.price).toLocaleString()}
                                                        </span>
                                                    </div>
                                                )} */}

                                                {hoveredPoint.data.qty && (
                                                    <div className="flex justify-between items-center">
                                                        <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                            จำนวน:
                                                        </span>
                                                        <span className={`text-sm font-semibold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                                                            {hoveredPoint.data.qty.toLocaleString()} {hoveredPoint.data.unit}
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                <div className={`flex items-center gap-2 pt-2 mt-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                                    <svg className={`w-3 h-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                        {new Date(hoveredPoint.data.dateCompare).toLocaleDateString('th-TH', { 
                                                            year: 'numeric',
                                                            month: 'long', 
                                                            day: 'numeric' 
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Compare Vendors Chart */}
                            {compareVendorsByDate.length > 0 && (
                                <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`} style={{ overflow: 'visible', position: 'relative' }}>
                                    <div className="mb-6">
                                        <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>กราฟเปรียบเทียบราคาจาก Vendors</h4>
                                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>แสดงราคาที่เสนอจากแต่ละ Vendor จัดกลุ่มตามวันที่</p>
                                    </div>
                                    
                                    {/* Chart SVG */}
                                    <div 
                                        id="compare-chart-container"
                                        className={`w-full relative ${isDarkMode ? 'custom-scrollbar-dark' : 'custom-scrollbar-light'}`}
                                        style={{ 
                                            height: '300px', 
                                            overflow: 'visible',
                                            overflowX: compareVendorsByDate.length > 15 ? 'auto' : 'visible',
                                            paddingBottom: compareVendorsByDate.length > 15 ? '10px' : '0'
                                        }}
                                        onMouseLeave={() => setHoveredVendorGroup(null)}
                                    >
                                        <svg 
                                            width={compareVendorsByDate.length > 15 ? `${compareVendorsByDate.length * 80}px` : '100%'} 
                                            height="100%" 
                                            viewBox={`0 0 ${compareVendorsByDate.length > 15 ? compareVendorsByDate.length * 80 : 800} 300`} 
                                            preserveAspectRatio="none" 
                                            className="overflow-visible"
                                        >
                                            {(() => {
                                                const padding = 50;
                                                const chartWidth = compareVendorsByDate.length > 15 ? compareVendorsByDate.length * 80 : 800;
                                                const chartHeight = 300;
                                                
                                                // Flatten all vendors for price calculation
                                                const allVendors = compareVendorsByDate.flatMap(d => d.vendors);
                                                const allPrices = allVendors.map(v => v.price || 0);
                                                const maxPrice = Math.max(...allPrices);
                                                const minPrice = Math.min(...allPrices);
                                                const priceRange = maxPrice - minPrice || 1;
                                                
                                                // Create points grouped by date
                                                const pointGroups = compareVendorsByDate.map((dateGroup, dateIndex) => {
                                                    const x = padding + (dateIndex / Math.max(compareVendorsByDate.length - 1, 1)) * (chartWidth - padding * 2);
                                                    return {
                                                        date: dateGroup.date,
                                                        x,
                                                        points: dateGroup.vendors.map(v => ({
                                                            x,
                                                            y: chartHeight - padding - (((v.price || 0) - minPrice) / priceRange) * (chartHeight - padding * 2),
                                                            price: v.price || 0,
                                                            vendor: v.vendor_name,
                                                            discount: v.discount || [],
                                                            creditTerm: v.credit_term,
                                                            tel: v.tel,
                                                            dateCompare: v.date_compare
                                                        }))
                                                    };
                                                });
                                                
                                                // Generate consistent color for each vendor based on name
                                                const getVendorColor = (vendorName: string) => {
                                                    // Simple hash function to generate consistent color from vendor name
                                                    let hash = 0;
                                                    for (let i = 0; i < vendorName.length; i++) {
                                                        hash = vendorName.charCodeAt(i) + ((hash << 5) - hash);
                                                    }
                                                    
                                                    // Convert to hue value (0-360)
                                                    const hue = Math.abs(hash % 360);
                                                    
                                                    // Use HSL for better color distribution
                                                    // Saturation 70%, Lightness 55% for good visibility
                                                    return `hsl(${hue}, 70%, 55%)`;
                                                };
                                                
                                                // Create vendor-to-color mapping and lines between same vendors
                                                const vendorColorMap = new Map<string, { color: string; points: Array<{ x: number; y: number }> }>();
                                                
                                                pointGroups.forEach(group => {
                                                    group.points.forEach(point => {
                                                        if (!vendorColorMap.has(point.vendor)) {
                                                            vendorColorMap.set(point.vendor, {
                                                                color: getVendorColor(point.vendor),
                                                                points: []
                                                            });
                                                        }
                                                        vendorColorMap.get(point.vendor)!.points.push({ x: point.x, y: point.y });
                                                    });
                                                });

                                                return (
                                                    <>
                                                        {/* Grid lines */}
                                                        {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                                                            const y = chartHeight - padding - ratio * (chartHeight - padding * 2);
                                                            const price = minPrice + ratio * priceRange;
                                                            return (
                                                                <g key={i}>
                                                                    <line 
                                                                        x1={padding} 
                                                                        y1={y} 
                                                                        x2={chartWidth - padding} 
                                                                        y2={y} 
                                                                        stroke={isDarkMode ? '#334155' : '#e2e8f0'} 
                                                                        strokeWidth="1"
                                                                        strokeDasharray="4 4"
                                                                    />
                                                                    <text 
                                                                        x={padding - 10} 
                                                                        y={y + 4} 
                                                                        textAnchor="end" 
                                                                        fontSize="11" 
                                                                        fill={isDarkMode ? '#10b981' : '#059669'}
                                                                    >
                                                                        ฿{price.toFixed(0)}
                                                                    </text>
                                                                </g>
                                                            );
                                                        })}
                                                        
                                                        {/* Lines connecting same vendors with curves */}
                                                        {Array.from(vendorColorMap.entries()).map(([vendor, data], idx) => {
                                                            if (data.points.length < 2) return null;
                                                            
                                                            // Create smooth curve using cubic bezier
                                                            let pathD = `M ${data.points[0].x},${data.points[0].y}`;
                                                            
                                                            for (let i = 1; i < data.points.length; i++) {
                                                                const prev = data.points[i - 1];
                                                                const curr = data.points[i];
                                                                
                                                                // Calculate control points for smooth curve
                                                                const dx = curr.x - prev.x;
                                                                const cp1x = prev.x + dx * 0.5;
                                                                const cp1y = prev.y;
                                                                const cp2x = curr.x - dx * 0.5;
                                                                const cp2y = curr.y;
                                                                
                                                                pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
                                                            }
                                                            
                                                            return (
                                                                <path 
                                                                    key={idx}
                                                                    d={pathD} 
                                                                    fill="none" 
                                                                    stroke={data.color} 
                                                                    strokeWidth="2.5" 
                                                                    strokeLinecap="round" 
                                                                    strokeLinejoin="round"
                                                                    opacity="0.7"
                                                                />
                                                            );
                                                        })}
                                                        
                                                        {/* Points grouped by date */}
                                                        {pointGroups.map((group, groupIndex) => (
                                                            <g key={groupIndex}>
                                                                {group.points.map((point, pointIndex) => {
                                                                    const vendorData = vendorColorMap.get(point.vendor)!;
                                                                    return (
                                                                        <g key={pointIndex}>
                                                                            <circle 
                                                                                cx={point.x} 
                                                                                cy={point.y} 
                                                                                r="8"
                                                                                fill={vendorData.color}
                                                                                stroke={isDarkMode ? '#1e293b' : '#fff'} 
                                                                                strokeWidth="3"
                                                                                className="cursor-pointer"
                                                                                style={{
                                                                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                                                                                }}
                                                                            >
                                                                                <title>{`${point.vendor}\n฿${point.price.toLocaleString()}\n${new Date(point.dateCompare).toLocaleDateString('th-TH')}`}</title>
                                                                            </circle>
                                                                        </g>
                                                                    );
                                                                })}
                                                                
                                                                {/* Date label (once per group) */}
                                                                <text 
                                                                    x={group.x} 
                                                                    y={chartHeight - padding + 20} 
                                                                    textAnchor="middle" 
                                                                    fontSize="9" 
                                                                    fill={isDarkMode ? '#94a3b8' : '#64748b'}
                                                                    transform={pointGroups.length > 10 ? `rotate(-45 ${group.x} ${chartHeight - padding + 20})` : ''}
                                                                    style={{
                                                                        display: groupIndex > 0 && new Date(group.date).toLocaleDateString('th-TH') === new Date(pointGroups[groupIndex-1].date).toLocaleDateString('th-TH') ? 'none' : 'block'
                                                                    }}
                                                                >
                                                                    {new Date(group.date).toLocaleDateString('th-TH', { 
                                                                        month: pointGroups.length > 10 ? 'numeric' : 'short', 
                                                                        day: 'numeric',
                                                                        year: pointGroups.length > 10 ? '2-digit' : undefined
                                                                    })}
                                                                </text>
                                                            </g>
                                                        ))}
                                                        
                                                        {/* Invisible hover zones for each date group */}
                                                        {pointGroups.map((group, groupIndex) => {
                                                            // Calculate zone width and position
                                                            let zoneX, zoneWidth;
                                                            
                                                            if (groupIndex === 0) {
                                                                // First item: zone starts from left edge
                                                                const nextX = groupIndex < pointGroups.length - 1 
                                                                    ? pointGroups[groupIndex + 1].x 
                                                                    : chartWidth - padding;
                                                                zoneWidth = (nextX - group.x) / 2 + (group.x - padding);
                                                                zoneX = padding;
                                                            } else if (groupIndex === pointGroups.length - 1) {
                                                                // Last item: zone extends to right edge
                                                                const prevX = pointGroups[groupIndex - 1].x;
                                                                zoneX = group.x - (group.x - prevX) / 2;
                                                                zoneWidth = (chartWidth - padding) - zoneX;
                                                            } else {
                                                                // Middle items: zone between midpoints
                                                                const prevX = pointGroups[groupIndex - 1].x;
                                                                const nextX = pointGroups[groupIndex + 1].x;
                                                                zoneX = group.x - (group.x - prevX) / 2;
                                                                zoneWidth = (nextX - group.x) / 2 + (group.x - prevX) / 2;
                                                            }
                                                            
                                                            return (
                                                                <rect
                                                                    key={`zone-${groupIndex}`}
                                                                    x={zoneX}
                                                                    y={padding}
                                                                    width={zoneWidth}
                                                                    height={chartHeight - padding * 2}
                                                                    fill="transparent"
                                                                    className="cursor-pointer"
                                                                    onMouseEnter={(e) => {
                                                                        if (group.points.length >= 1) {
                                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                                            // Deduplicate vendors with same name, price, and discount
                                                                            const uniqueVendors = group.points.reduce((acc, p) => {
                                                                                const discountStr = JSON.stringify(p.discount.sort());
                                                                                const key = `${p.vendor}-${p.price}-${discountStr}`;
                                                                                
                                                                                if (!acc.has(key)) {
                                                                                    acc.set(key, {
                                                                                        vendor: p.vendor,
                                                                                        price: p.price,
                                                                                        color: vendorColorMap.get(p.vendor)!.color,
                                                                                        discount: p.discount,
                                                                                        creditTerm: p.creditTerm,
                                                                                        tel: p.tel
                                                                                    });
                                                                                }
                                                                                return acc;
                                                                            }, new Map());
                                                                            
                                                                            setHoveredVendorGroup({
                                                                                x: rect.left + rect.width / 2,
                                                                                date: group.date,
                                                                                vendors: Array.from(uniqueVendors.values())
                                                                            });
                                                                        }
                                                                    }}
                                                                />
                                                            );
                                                        })}
                                                        
                                                        {/* Vertical line on hover */}
                                                        {hoveredVendorGroup && (() => {
                                                            const group = pointGroups.find(g => g.date === hoveredVendorGroup.date);
                                                            if (!group) return null;
                                                            
                                                            return (
                                                                <line
                                                                    x1={group.x}
                                                                    y1={padding}
                                                                    x2={group.x}
                                                                    y2={chartHeight - padding}
                                                                    stroke={isDarkMode ? '#94a3b8' : '#64748b'}
                                                                    strokeWidth="2"
                                                                    strokeDasharray="5 5"
                                                                    opacity="0.6"
                                                                />
                                                            );
                                                        })()}
                                                    </>
                                                );
                                            })()}
                                        </svg>
                                        
                                        {/* Vendor Group Tooltip */}
                                        {hoveredVendorGroup && (
                                            <div
                                                className={`fixed z-[10001] pointer-events-none transform -translate-x-1/2 min-w-[280px] max-w-[320px] ${
                                                    isDarkMode
                                                        ? 'bg-slate-800 border-slate-600 shadow-2xl'
                                                        : 'bg-white border-slate-200 shadow-xl'
                                                } border-2 rounded-xl p-4`}
                                                style={{
                                                    left: `${hoveredVendorGroup.x}px`,
                                                    top: '80px',
                                                    boxShadow: isDarkMode
                                                        ? '0 10px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)'
                                                        : '0 10px 40px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)'
                                                }}
                                            >
                                                {/* Arrow */}
                                                <div
                                                    className={`absolute left-1/2 -translate-x-1/2 -top-2 w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent ${
                                                        isDarkMode ? 'border-b-slate-800' : 'border-b-white'
                                                    }`}
                                                    style={{
                                                        filter: 'drop-shadow(0 -2px 2px rgba(0,0,0,0.1))'
                                                    }}
                                                />

                                                {/* Header */}
                                                <div className={`mb-3 pb-2 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                                    <div className={`text-xs font-semibold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                        {new Date(hoveredVendorGroup.date).toLocaleDateString('th-TH', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Vendors List */}
                                                <div className="space-y-3">
                                                    {hoveredVendorGroup.vendors.map((v, idx) => (
                                                        <div key={idx} className={`pb-3 ${idx < hoveredVendorGroup.vendors.length - 1 ? `border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}` : ''}`}>
                                                            {/* Vendor name with color */}
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div
                                                                    className="w-3 h-3 rounded-full"
                                                                    style={{
                                                                        backgroundColor: v.color,
                                                                        boxShadow: `0 0 6px ${v.color}80`
                                                                    }}
                                                                />
                                                                <span className={`font-semibold text-sm ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                                                                    {v.vendor}
                                                                </span>
                                                            </div>

                                                            {/* Price */}
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                                    ราคา:
                                                                </span>
                                                                <span className={`text-sm font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                                    ฿{v.price.toLocaleString()}
                                                                </span>
                                                            </div>

                                                            {/* Credit Term */}
                                                            {v.creditTerm && (
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                                        เครดิต:
                                                                    </span>
                                                                    <span className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                                        {v.creditTerm}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {/* Discount */}
                                                            {v.discount && v.discount.length > 0 && (
                                                                <div className="flex justify-between items-center">
                                                                    <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                                        ส่วนลด:
                                                                    </span>
                                                                    <span className={`text-xs font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                                                        {v.discount.join(', ')}%
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Vendor Legend */}
                                    <div className="mt-4">
                                        <div className={`text-xs font-semibold mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                            Vendors
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {(() => {
                                                // Get unique vendors
                                                const uniqueVendors = new Set<string>();
                                                compareVendorsByDate.forEach(dateGroup => {
                                                    dateGroup.vendors.forEach(v => uniqueVendors.add(v.vendor_name));
                                                });
                                                
                                                // Generate color for each vendor
                                                const getVendorColor = (vendorName: string) => {
                                                    let hash = 0;
                                                    for (let i = 0; i < vendorName.length; i++) {
                                                        hash = vendorName.charCodeAt(i) + ((hash << 5) - hash);
                                                    }
                                                    const hue = Math.abs(hash % 360);
                                                    return `hsl(${hue}, 70%, 55%)`;
                                                };
                                                
                                                return Array.from(uniqueVendors).map(vendorName => (
                                                    <div key={vendorName} className="flex items-center gap-2">
                                                        <div 
                                                            className="w-3 h-3 rounded-full" 
                                                            style={{ backgroundColor: getVendorColor(vendorName) }}
                                                        />
                                                        <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                                            {vendorName}
                                                        </div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
                
                {/* Bottom spacing */}
                <div style={{ height: '15px' }}></div>
            </div>
        </div>
    );
}
