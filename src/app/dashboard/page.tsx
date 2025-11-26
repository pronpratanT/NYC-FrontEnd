"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import { useToken } from "../context/TokenContext";
import { useSidebar } from "../context/SidebarContext";
import { useTheme } from "../components/ThemeProvider";

type PRData = {
    id: number;
    pr_no: string;
    pr_date: string;
    dept_name: string;
    dept_short_name: string;
    count_list: number;
    supervisor_id: string;
    manager_id: string;
    pu_responsible_id: string;
    supervisor_name: string;
    manager_name: string;
    pu_responsible: string;
    requester_name: string
    manager_approved: boolean;
    supervisor_approved: boolean;
    pu_operator_approved: boolean;
    supervisor_reject_at: string | null;
    manager_reject_at: string | null;
    pu_operator_reject_at: string | null;
    reason_rejected: string | null;
    waiting: number;
}

type Department = {
    ID: number;
    name: string;
    short_name: string;
    dep_no: string;
}

export default function DashboardPage() {
    const token = useToken();
    const router = useRouter();
    const { isCollapsed } = useSidebar();
    const { isDarkMode } = useTheme();

    const [prData, setPrData] = useState<PRData[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    console.log("Token in DashboardPage component:", token);

    // ตรวจสอบ token เมื่อโหลดหน้า (รอให้ token โหลดเสร็จก่อน)
    useEffect(() => {
        // ใช้ setTimeout เพื่อให้ context โหลดเสร็จก่อน
        const timeoutId = setTimeout(() => {
            if (token === null) {
                router.replace(process.env.NEXT_PUBLIC_LOGOUT_REDIRECT || "/login");
            }
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [token, router]);

    // Fetch data when token is available
    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                const responseData = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/pr/request/departments?page=1&limit=1000`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await responseData.json();
                const prArray = Array.isArray(data) ? data : data.data || [];
                setPrData(prArray);
                console.log("PR Request Data:", prArray);

                const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_USER_SERVICE}/api/user/deps`, { cache: "no-store" });
                const dataDeps = await response.json();
                const depsArray = Array.isArray(dataDeps) ? dataDeps : dataDeps.data || [];

                setDepartments(depsArray);
                console.log("Loaded departments:", depsArray);
            } catch (error) {
                console.error("Error fetching PR data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    // Extract available years
    const availableYears = useMemo(() => {
        const years = new Set<number>();
        prData.forEach(pr => {
            if (pr.pr_date) {
                years.add(new Date(pr.pr_date).getFullYear());
            }
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [prData]);

    // Calculate monthly data
    const monthlyData = useMemo(() => {
        const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
        const monthCounts = new Array(12).fill(0);

        prData.forEach(pr => {
            if (pr.pr_date) {
                const date = new Date(pr.pr_date);
                const year = date.getFullYear();
                const month = date.getMonth();

                if (year === selectedYear) {
                    monthCounts[month]++;
                }
            }
        });

        return monthNames.map((name, index) => ({
            month: name,
            count: monthCounts[index]
        }));
    }, [prData, selectedYear]);

    // Calculate department data
    const departmentData = useMemo(() => {
        const deptCounts: { [key: string]: number } = {};
        prData.forEach(pr => {
            if (pr.pr_date) {
                const year = new Date(pr.pr_date).getFullYear();
                if (year === selectedYear && pr.dept_name) {
                    deptCounts[pr.dept_name] = (deptCounts[pr.dept_name] || 0) + 1;
                }
            }
        });
        const allDepts = Object.entries(deptCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
        // Pie chart: top 8
        const topDepts = allDepts.slice(0, 8);
        const othersCount = allDepts.slice(8).reduce((sum, d) => sum + d.count, 0);
        if (othersCount > 0) topDepts.push({ name: 'อื่นๆ', count: othersCount });
        return {
            pie: topDepts,
            bar: allDepts.slice(0, 15) // Bar chart: top 15
        };
    }, [prData, selectedYear]);

    // แสดง loading ถ้ายัง loading token อยู่
    if (token === null) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
                </div>
            </div>
        );
    }

    // Sidebar width: 288px (expanded), 80px (collapsed), left-6 (24px)
    const sidebarWidth = isCollapsed ? 80 : 288;
    const marginLeft = sidebarWidth + 24; // px

    // Calculate chart dimensions
    const maxCount = Math.max(...monthlyData.map(d => d.count), 1);
    const chartHeight = 320;
    const chartWidth = 600;
    const padding = { top: 40, right: 40, bottom: 60, left: 60 };
    const barWidth = (chartWidth - padding.left - padding.right) / 12;
    // Department Bar Chart
    const deptBarChartHeight = 320;
    const deptBarChartWidth = 400;
    const deptBarPadding = { top: 40, right: 40, bottom: 40, left: 120 };
    const deptBarHeight = departmentData.bar.length > 0
        ? (deptBarChartHeight - deptBarPadding.top - deptBarPadding.bottom) / departmentData.bar.length
        : 30;

    return (
        <div className="flex min-h-screen">
            <Sidebar />
            <Header />
            <main
                style={{ marginLeft, transition: 'margin-left 0.3s' }}
                className={`flex-1 p-6 min-h-screen pt-24`}
            >
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            Dashboard - สถิติ PR รายเดือน
                        </h1>

                        {/* Year Filter */}
                        <div className="flex items-center gap-3">
                            <label className={`text-sm font-medium ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                                ปี:
                            </label>
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                className={`px-4 py-2 rounded-lg border ${isDarkMode
                                        ? 'bg-slate-800 border-slate-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            >
                                {availableYears.map(year => (
                                    <option key={year} value={year}>
                                        {year + 543} {/* Buddhist year */}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <div className={`w-full p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-lg flex items-center justify-center`} style={{ height: chartHeight }}>
                            <div className="text-center">
                                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'}`}></div>
                                <p className={isDarkMode ? 'text-slate-300' : 'text-gray-600'}>กำลังโหลดข้อมูล...</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Charts Grid - 3 columns on xl, 1 on mobile */}
                            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                                {/* Monthly Chart */}
                                <div className={`p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-lg flex flex-col items-center`}>
                                    <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        PR รายเดือน
                                    </h2>
                                    <svg width={chartWidth} height={chartHeight} className="mx-auto">
                                        {/* Grid lines */}
                                        {[0, 1, 2, 3, 4].map(i => {
                                            const y = padding.top + (chartHeight - padding.top - padding.bottom) * i / 4;
                                            const value = Math.round(maxCount * (4 - i) / 4);
                                            return (
                                                <g key={i}>
                                                    <line
                                                        x1={padding.left}
                                                        y1={y}
                                                        x2={chartWidth - padding.right}
                                                        y2={y}
                                                        stroke={isDarkMode ? '#334155' : '#e5e7eb'}
                                                        strokeWidth="1"
                                                    />
                                                    <text
                                                        x={padding.left - 10}
                                                        y={y + 4}
                                                        textAnchor="end"
                                                        className={`text-xs ${isDarkMode ? 'fill-slate-400' : 'fill-gray-600'}`}
                                                    >
                                                        {value}
                                                    </text>
                                                </g>
                                            );
                                        })}

                                        {/* Bars */}
                                        {monthlyData.map((data, index) => {
                                            const barHeight = data.count > 0
                                                ? (data.count / maxCount) * (chartHeight - padding.top - padding.bottom)
                                                : 0;
                                            const x = padding.left + index * barWidth;
                                            const y = chartHeight - padding.bottom - barHeight;

                                            return (
                                                <g key={index}>
                                                    {/* Bar */}
                                                    <rect
                                                        x={x + 5}
                                                        y={y}
                                                        width={barWidth - 10}
                                                        height={barHeight}
                                                        fill={isDarkMode ? '#3b82f6' : '#2563eb'}
                                                        className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                                                        rx="4"
                                                    />

                                                    {/* Count label */}
                                                    {data.count > 0 && (
                                                        <text
                                                            x={x + barWidth / 2}
                                                            y={y - 8}
                                                            textAnchor="middle"
                                                            className={`text-sm font-semibold ${isDarkMode ? 'fill-blue-400' : 'fill-blue-600'}`}
                                                        >
                                                            {data.count}
                                                        </text>
                                                    )}

                                                    {/* Month label */}
                                                    <text
                                                        x={x + barWidth / 2}
                                                        y={chartHeight - padding.bottom + 20}
                                                        textAnchor="middle"
                                                        className={`text-sm ${isDarkMode ? 'fill-slate-300' : 'fill-gray-700'}`}
                                                    >
                                                        {data.month}
                                                    </text>
                                                </g>
                                            );
                                        })}

                                        {/* Axes */}
                                        <line
                                            x1={padding.left}
                                            y1={chartHeight - padding.bottom}
                                            x2={chartWidth - padding.right}
                                            y2={chartHeight - padding.bottom}
                                            stroke={isDarkMode ? '#475569' : '#9ca3af'}
                                            strokeWidth="2"
                                        />
                                        <line
                                            x1={padding.left}
                                            y1={padding.top}
                                            x2={padding.left}
                                            y2={chartHeight - padding.bottom}
                                            stroke={isDarkMode ? '#475569' : '#9ca3af'}
                                            strokeWidth="2"
                                        />
                                    </svg>
                                </div>

                                {/* Department Pie Chart */}
                                <div className={`p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-lg flex flex-col items-center`}>
                                    <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        สัดส่วน PR ตามแผนก (Top 8)
                                    </h2>
                                    {departmentData.pie.length === 0 ? (
                                        <div className="flex items-center justify-center h-64">
                                            <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>ไม่มีข้อมูล</p>
                                        </div>
                                    ) : (
                                        <svg width={340} height={340} viewBox="0 0 340 340" className="mx-auto">
                                            {(() => {
                                                const total = departmentData.pie.reduce((sum, d) => sum + d.count, 0);
                                                let startAngle = 0;
                                                const colors = [
                                                    '#10b981', '#3b82f6', '#f59e42', '#eab308', '#a78bfa', '#ef4444', '#14b8a6', '#6366f1', '#9ca3af'
                                                ];
                                                return departmentData.pie.map((dept, i) => {
                                                    const angle = (dept.count / total) * 2 * Math.PI;
                                                    const endAngle = startAngle + angle;
                                                    const largeArc = angle > Math.PI ? 1 : 0;
                                                    const radius = 140;
                                                    const centerX = 170;
                                                    const centerY = 170;
                                                    const x1 = centerX + radius * Math.cos(startAngle);
                                                    const y1 = centerY + radius * Math.sin(startAngle);
                                                    const x2 = centerX + radius * Math.cos(endAngle);
                                                    const y2 = centerY + radius * Math.sin(endAngle);
                                                    const pathData = `M${centerX},${centerY} L${x1},${y1} A${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`;
                                                    const midAngle = startAngle + angle / 2;
                                                    const labelX = centerX + (radius + 30) * Math.cos(midAngle);
                                                    const labelY = centerY + (radius + 30) * Math.sin(midAngle);
                                                    const percent = Math.round((dept.count / total) * 100);
                                                    startAngle = endAngle;
                                                    return (
                                                        <g key={i}>
                                                            <path d={pathData} fill={colors[i % colors.length]} stroke="#fff" strokeWidth="2" />
                                                            <text
                                                                x={labelX}
                                                                y={labelY}
                                                                textAnchor="middle"
                                                                alignmentBaseline="middle"
                                                                className={`text-xs font-bold ${isDarkMode ? 'fill-white' : 'fill-gray-900'}`}
                                                            >
                                                                {dept.name.length > 10 ? dept.name.substring(0, 10) + '...' : dept.name}
                                                                ` (${percent}%)`
                                                            </text>
                                                        </g>
                                                    );
                                                });
                                            })()}
                                        </svg>
                                    )}
                                </div>
                                {/* Department Bar Chart */}
                                <div className={`p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-lg flex flex-col items-center`}>
                                    <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        จำนวน PR ของแต่ละแผนก (Top 15)
                                    </h2>
                                    {departmentData.bar.length === 0 ? (
                                        <div className="flex items-center justify-center h-64">
                                            <p className={isDarkMode ? 'text-slate-400' : 'text-gray-500'}>ไม่มีข้อมูล</p>
                                        </div>
                                    ) : (
                                        <svg width={deptBarChartWidth} height={deptBarChartHeight} className="mx-auto">
                                            {/* Bars */}
                                            {departmentData.bar.map((dept, index) => {
                                                const barW = dept.count > 0
                                                    ? (dept.count / departmentData.bar[0].count) * (deptBarChartWidth - deptBarPadding.left - deptBarChartWidth * 0.1)
                                                    : 0;
                                                const y = deptBarPadding.top + index * deptBarHeight;
                                                return (
                                                    <g key={index}>
                                                        {/* Department name */}
                                                        <text
                                                            x={deptBarPadding.left - 10}
                                                            y={y + deptBarHeight / 2 + 4}
                                                            textAnchor="end"
                                                            className={`text-sm ${isDarkMode ? 'fill-slate-300' : 'fill-gray-700'}`}
                                                        >
                                                            {dept.name.length > 15 ? dept.name.substring(0, 15) + '...' : dept.name}
                                                        </text>
                                                        {/* Bar */}
                                                        <rect
                                                            x={deptBarPadding.left}
                                                            y={y + 5}
                                                            width={barW}
                                                            height={deptBarHeight - 10}
                                                            fill={isDarkMode ? '#3b82f6' : '#2563eb'}
                                                            className="transition-all duration-200 hover:opacity-80 cursor-pointer"
                                                            rx="4"
                                                        />
                                                        {/* Count label */}
                                                        {dept.count > 0 && (
                                                            <text
                                                                x={deptBarPadding.left + barW + 8}
                                                                y={y + deptBarHeight / 2 + 4}
                                                                className={`text-sm font-semibold ${isDarkMode ? 'fill-blue-400' : 'fill-blue-600'}`}
                                                            >
                                                                {dept.count}
                                                            </text>
                                                        )}
                                                    </g>
                                                );
                                            })}
                                            {/* Axes */}
                                            <line
                                                x1={deptBarPadding.left}
                                                y1={deptBarPadding.top}
                                                x2={deptBarPadding.left}
                                                y2={deptBarChartHeight - deptBarPadding.bottom}
                                                stroke={isDarkMode ? '#475569' : '#9ca3af'}
                                                strokeWidth="2"
                                            />
                                            <line
                                                x1={deptBarPadding.left}
                                                y1={deptBarChartHeight - deptBarPadding.bottom}
                                                x2={deptBarChartWidth - deptBarChartWidth * 0.1}
                                                y2={deptBarChartHeight - deptBarPadding.bottom}
                                                stroke={isDarkMode ? '#475569' : '#9ca3af'}
                                                strokeWidth="2"
                                            />
                                        </svg>
                                    )}
                                </div>
                            </div>

                            {/* Summary */}
                            <div className={`w-full p-6 ${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-lg`}>
                                <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    สรุปข้อมูล ปี {selectedYear + 543}
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>จำนวน PR ทั้งหมด</p>
                                        <p className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                            {monthlyData.reduce((sum, d) => sum + d.count, 0)}
                                        </p>
                                    </div>
                                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>เดือนที่มากที่สุด</p>
                                        <p className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                            {maxCount}
                                        </p>
                                    </div>
                                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>ค่าเฉลี่ย/เดือน</p>
                                        <p className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                            {Math.round(monthlyData.reduce((sum, d) => sum + d.count, 0) / 12)}
                                        </p>
                                    </div>
                                    <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-gray-50'}`}>
                                        <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>ทั้งหมดในระบบ</p>
                                        <p className={`text-2xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                            {prData.length}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
