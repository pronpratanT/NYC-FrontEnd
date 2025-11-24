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
        };
    } | null>(null);

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

    // Extract recent purchases from the data
    const recentPurchases = React.useMemo(() => {
        console.log('Computing recentPurchases...');
        console.log('dataCharts:', dataCharts);
        console.log('pr_list_id:', pr_list_id);
        
        const purchases: RecentPurchase[] = [];
        dataCharts.forEach((chart, idx) => {
            console.log(`Chart ${idx}:`, chart);
            
            // recent_purchase is an object, not an array
            chart.part_inventory_and_pr?.forEach((pr, prIdx) => {
                console.log(`  PR ${prIdx} (pr_list_id: ${pr.pr_list_id}):`, pr);
                
                if (pr.recent_purchase) {
                    // Check if it's an object or array
                    if (Array.isArray(pr.recent_purchase)) {
                        console.log(`    Adding ${pr.recent_purchase.length} purchases (array)`);
                        purchases.push(...pr.recent_purchase);
                    } else {
                        console.log(`    Adding 1 purchase (object)`);
                        purchases.push(pr.recent_purchase);
                    }
                }
            });
        });
        
        console.log('Total recentPurchases:', purchases.length, purchases);
        return purchases;
    }, [dataCharts, pr_list_id]);

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
                    <div>
                        <h3 className={`text-xl font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>ประวัติราคาการซื้อ</h3>
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
                    <button
                        type="button"
                        onClick={onClose}
                        className={`px-3 py-1 rounded-lg text-sm font-medium border transition ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'}`}
                        aria-label="ปิดกราฟ"
                    >ปิด</button>
                </div>

                {/* Content Area */}
                <div className="flex-1 space-y-4" style={{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto', overflowX: 'visible' }}>
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
                                            <div className="w-8 h-0.5 bg-blue-500"></div>
                                            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>ราคา</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-0.5 bg-orange-500"></div>
                                            <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>ราคาอนุมัติ</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Chart SVG */}
                                <div 
                                    id="chart-container"
                                    className="w-full relative" 
                                    style={{ height: '300px', overflow: 'visible' }}
                                    onMouseLeave={() => setHoveredPoint(null)}
                                >
                                    <svg width="100%" height="100%" viewBox="0 0 800 300" preserveAspectRatio="none" className="overflow-visible">
                                        {(() => {
                                            const padding = 50;
                                            const chartWidth = 800;
                                            const chartHeight = 300;
                                            const allPrices = recentPurchases.flatMap(p => [p.price || 0, p.price_for_approve || 0]);
                                            const maxPrice = Math.max(...allPrices);
                                            const minPrice = Math.min(...allPrices);
                                            const priceRange = maxPrice - minPrice || 1;
                                            
                                            const points = recentPurchases.map((p, i) => ({
                                                x: padding + (i / Math.max(recentPurchases.length - 1, 1)) * (chartWidth - padding * 2),
                                                yPrice: chartHeight - padding - (((p.price || 0) - minPrice) / priceRange) * (chartHeight - padding * 2),
                                                yApprove: chartHeight - padding - (((p.price_for_approve || 0) - minPrice) / priceRange) * (chartHeight - padding * 2),
                                                price: p.price || 0,
                                                approve: p.price_for_approve || 0,
                                                vendor: p.vendor_name,
                                                date: p.date,
                                                discount: p.discount || []
                                            }));

                                            const pricePathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.yPrice}`).join(' ');
                                            const approvePathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.yApprove}`).join(' ');

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
                                                                    fill={isDarkMode ? '#94a3b8' : '#64748b'}
                                                                >
                                                                    ฿{price.toFixed(0)}
                                                                </text>
                                                            </g>
                                                        );
                                                    })}
                                                    
                                                    {/* Lines */}
                                                    <path d={pricePathD} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d={approvePathD} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                                                    
                                                    {/* Points */}
                                                    {points.map((point, i) => (
                                                        <g key={i}>
                                                            {/* Price Point */}
                                                            <circle 
                                                                cx={point.x} 
                                                                cy={point.yPrice} 
                                                                r={hoveredPoint?.data.index === i && hoveredPoint?.data.type === 'price' ? '10' : '8'}
                                                                fill="#3b82f6" 
                                                                stroke={isDarkMode ? '#1e293b' : '#fff'} 
                                                                strokeWidth="3"
                                                                className="cursor-pointer transition-all duration-200 hover:r-10"
                                                                style={{
                                                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    const container = document.getElementById('chart-container');
                                                                    if (container) {
                                                                        const containerRect = container.getBoundingClientRect();
                                                                        const percentX = point.x / 800;
                                                                        const percentY = point.yPrice / 300;
                                                                        setHoveredPoint({
                                                                            x: containerRect.left + percentX * containerRect.width,
                                                                            y: containerRect.top + percentY * containerRect.height,
                                                                            data: {
                                                                                vendor: point.vendor,
                                                                                price: point.price,
                                                                                approve: point.approve,
                                                                                date: point.date,
                                                                                type: 'price',
                                                                                index: i,
                                                                                discount: point.discount
                                                                            }
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                            
                                                            {/* Approve Point */}
                                                            <circle 
                                                                cx={point.x} 
                                                                cy={point.yApprove} 
                                                                r={hoveredPoint?.data.index === i && hoveredPoint?.data.type === 'approve' ? '10' : '8'}
                                                                fill="#f97316" 
                                                                stroke={isDarkMode ? '#1e293b' : '#fff'} 
                                                                strokeWidth="3"
                                                                className="cursor-pointer transition-all duration-200"
                                                                style={{
                                                                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    const container = document.getElementById('chart-container');
                                                                    if (container) {
                                                                        const containerRect = container.getBoundingClientRect();
                                                                        const percentX = point.x / 800;
                                                                        const percentY = point.yApprove / 300;
                                                                        setHoveredPoint({
                                                                            x: containerRect.left + percentX * containerRect.width,
                                                                            y: containerRect.top + percentY * containerRect.height,
                                                                            data: {
                                                                                vendor: point.vendor,
                                                                                price: point.price,
                                                                                approve: point.approve,
                                                                                date: point.date,
                                                                                type: 'approve',
                                                                                index: i,
                                                                                discount: point.discount
                                                                            }
                                                                        });
                                                                    }
                                                                }}
                                                            />
                                                            
                                                            <text 
                                                                x={point.x} 
                                                                y={chartHeight - padding + 20} 
                                                                textAnchor="middle" 
                                                                fontSize="10" 
                                                                fill={isDarkMode ? '#94a3b8' : '#64748b'}
                                                            >
                                                                {new Date(point.date).toLocaleDateString('th-TH', { month: 'short', day: 'numeric' })}
                                                            </text>
                                                        </g>
                                                    ))}
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
                                                        backgroundColor: hoveredPoint.data.type === 'price' ? '#3b82f6' : '#f97316',
                                                        boxShadow: hoveredPoint.data.type === 'price' 
                                                            ? '0 0 8px rgba(59, 130, 246, 0.5)' 
                                                            : '0 0 8px rgba(249, 115, 22, 0.5)'
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
                                                    <span className={`text-sm font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                                        ฿{hoveredPoint.data.price.toLocaleString()}
                                                    </span>
                                                </div>
                                                
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                        ราคาอนุมัติ:
                                                    </span>
                                                    <span className={`text-sm font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                                        ฿{hoveredPoint.data.approve.toLocaleString()}
                                                    </span>
                                                </div>
                                                
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
                                                
                                                {hoveredPoint.data.price !== hoveredPoint.data.approve && (
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
                                                )}
                                                
                                                <div className={`flex items-center gap-2 pt-2 mt-2 border-t ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                                    <svg className={`w-3 h-3 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                    <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                                        {new Date(hoveredPoint.data.date).toLocaleDateString('th-TH', { 
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

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
