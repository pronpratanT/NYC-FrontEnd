"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { IoChevronDown, IoClose, IoReloadOutline } from "react-icons/io5";
import { PiCheckCircleBold } from "react-icons/pi";
import { useTheme } from "../ThemeProvider";

type Toast = {
    id: number;
    title: string;
    message: string;
    expanded: boolean;
    paused: boolean;
    remainingTime: number;
    exiting?: boolean;
    loading?: boolean;
};

type ToastContextType = {
    // แสดง toast แบบ PDF loading และคืน id กลับมา
    showPDFToast: (title: string, message: string, loading?: boolean) => number;
    // เปลี่ยน toast loading ให้เป็นสถานะสำเร็จ (icon check) พร้อมอัปเดตข้อความได้
    setPDFToastSuccess: (id: number, message?: string) => void;
    // ปิด toast เองแบบ manual
    dismissToast: (id: number) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const usePdfToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("usePdfToast must be used within ToastProvider");
    return ctx;
};

const TOAST_DURATION = 14; // seconds
export function PdfGen({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const counterRef = useRef(0);
    const { isDarkMode } = useTheme();

    const showPDFToast = useCallback((title: string, message: string, loading?: boolean) => {
        counterRef.current += 1;
        const id = counterRef.current;
        const toast: Toast = {
            id,
            title,
            message,
            expanded: false,
            paused: false,
            remainingTime: TOAST_DURATION,
            exiting: false,
            loading: !!loading,
        };
        setToasts(prev => [...prev, toast]);
        return id;
    }, []);

    // ใช้ตอนงานเสร็จ เพื่อเปลี่ยน icon เป็น PiCheckCircleBold และอัปเดตข้อความ
    const setPDFToastSuccess = useCallback((id: number, message?: string) => {
        setToasts(prev =>
            prev.map(t =>
                t.id === id
                    ? {
                        ...t,
                        loading: false,
                        message: message ?? t.message,
                        // เริ่มนับถอยหลังใหม่ได้ถ้าต้องการให้ค้างสักพัก
                        remainingTime: TOAST_DURATION,
                    }
                    : t
            )
        );
    }, []);

    // Timer effect สำหรับนับถอยหลังและ auto-dismiss เฉพาะ toast ที่ไม่ใช่ loading
    useEffect(() => {
        const interval = setInterval(() => {
            setToasts(prev => {
                const toastsToExit = prev.filter(
                    t => !t.paused && !t.loading && t.remainingTime === 1 && !t.exiting
                );
                if (toastsToExit.length > 0) {
                    toastsToExit.forEach(t => {
                        setTimeout(() => {
                            setToasts(current => current.filter(x => x.id !== t.id));
                        }, 300);
                    });
                }
                return prev.map(t => {
                    if (t.paused || t.loading) return t;
                    if (t.remainingTime === 1 && !t.exiting) {
                        return { ...t, exiting: true };
                    }
                    if (t.remainingTime > 1) {
                        return { ...t, remainingTime: t.remainingTime - 1 };
                    }
                    return t;
                });
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const toggleExpanded = (id: number) => {
        setToasts(prev =>
            prev.map(t => (t.id === id ? { ...t, expanded: !t.expanded } : t))
        );
    };

    const togglePaused = (id: number) => {
        setToasts(prev =>
            prev.map(t => (t.id === id ? { ...t, paused: !t.paused } : t))
        );
    };

    const dismissToast = (id: number) => {
        setToasts(prev => prev.map(t => (
            t.id === id ? { ...t, exiting: true } : t
        )));

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 300);
    };

    return (
        <ToastContext.Provider value={{ showPDFToast, setPDFToastSuccess, dismissToast }}>
            {children}
            {/* Toast container bottom-right */}
            <div
                style={{
                    position: "fixed",
                    right: "20px",
                    bottom: "20px",
                    zIndex: 9999,
                    display: "flex",
                    flexDirection: "column-reverse",
                    gap: "12px",
                }}
            >
                {toasts.map(toast => {
                    // สำหรับ PDF: มีแค่ 2 สถานะหลัก loading (หมุน) และ success (check)
                    let icon = <PiCheckCircleBold className="w-7 h-7 text-sky-500" />;
                    const background = isDarkMode ? "#0d1320" : "#FFFFFF";
                    let bar = "linear-gradient(90deg, #22c55e 0%, #22c55e 100%)";
                    if (toast.loading) {
                        icon = <IoReloadOutline className="w-7 h-7 text-blue-500 toast-loading-spin" />;
                        bar = "#00a6f4";
                    } else {
                        // success style
                        icon = <PiCheckCircleBold className="w-7 h-7 text-sky-500" />;
                        bar = "#00a6f4";
                    }
                    return (
                        <div
                            key={toast.id}
                            style={{
                                minWidth: "360px",
                                maxWidth: "420px",
                                background,
                                color: isDarkMode ? "#E5E7EB" : "#111827",
                                padding: "14px 18px 12px 18px",
                                borderRadius: "12px",
                                boxShadow: isDarkMode
                                    ? "0 18px 45px rgba(63, 69, 85, 0.3)"
                                    : "0 0px 45px rgba(15, 23, 42, 0.50)",
                                // border: `1px solid ${cardBorderColor}`,
                                fontFamily: "'Inter', sans-serif",
                                position: "relative",
                                animation: toast.exiting ? "slideOutRight 0.3s ease-in forwards" : "slideIn 0.3s ease-out",
                                overflow: "hidden",
                                paddingBottom: toast.paused ? 14 : 36, // เผื่อพื้นที่ timer+bar เฉพาะตอนยังนับเวลา
                                transform: toast.expanded ? "translateY(-2px)" : "translateY(0)",
                                transition: "box-shadow 0.2s ease, transform 0.2s ease, padding-bottom 0.25s ease",
                            }}
                        >
                            {/* Top row: icon | title | chevron | close */}
                            <div style={{ display: "flex", alignItems: "center", width: "100%", marginBottom: toast.paused ? 0 : 15 }}>
                                <div
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        // borderRadius: "50%",
                                        // border,
                                        // backgroundColor: iconBg,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        // marginRight: 5,
                                    }}
                                >
                                    {icon}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: "0.95rem",
                                            fontWeight: "550",
                                            color: isDarkMode ? "#fafafa" : "#020618",
                                            letterSpacing: "0.01em",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            marginLeft: 5,
                                        }}
                                    >
                                        {toast.title}
                                    </div>
                                </div>
                                {/* Chevron + Close group */}
                                <div style={{ display: "flex", alignItems: "center", gap: 2, marginLeft: 8, minWidth: 52 }}>
                                    <button
                                        onClick={() => toggleExpanded(toast.id)}
                                        style={{
                                            width: "24px",
                                            height: "24px",
                                            border: "none",
                                            background: "transparent",
                                            color: isDarkMode ? "#9CA3AF" : "#6B7280",
                                            cursor: "pointer",
                                            fontSize: "18px",
                                            borderRadius: "6px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            transition: "all 0.2s ease",
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = isDarkMode ? "#FFFFFF" : "#111827";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = isDarkMode ? "#9CA3AF" : "#6B7280";
                                        }}
                                        aria-label="Toggle details"
                                    >
                                        <IoChevronDown
                                            className="w-5 h-5"
                                            style={{
                                                transform: toast.expanded ? "rotate(180deg)" : "rotate(0deg)",
                                                transition: "transform 0.25s ease",
                                                transformOrigin: "center",
                                            }}
                                        />
                                    </button>
                                    <button
                                        onClick={() => dismissToast(toast.id)}
                                        className="toast-close-btn"
                                        style={{
                                            width: "24px",
                                            height: "24px",
                                            border: "none",
                                            background: "transparent",
                                            color: isDarkMode ? "#9CA3AF" : "#6B7280",
                                            cursor: "pointer",
                                            fontSize: "18px",
                                            borderRadius: "6px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            transition: "all 0.2s ease",
                                            lineHeight: 1,
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.color = isDarkMode ? "#FFFFFF" : "#111827";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.color = isDarkMode ? "#9CA3AF" : "#6B7280";
                                        }}
                                        aria-label="Close notification"
                                    >
                                        <IoClose className="w-5 h-5 toast-close-icon" />
                                    </button>
                                </div>
                            </div>
                            {/* Message block with smooth expand/collapse */}
                            <div
                                style={{
                                    fontSize: "0.95rem",
                                    lineHeight: 1.5,
                                    color: isDarkMode ? "#C8C5C5" : "#374151",
                                    paddingLeft: 38,
                                    paddingRight: 18,
                                    whiteSpace: "pre-line",
                                    wordBreak: "break-word",
                                    overflow: "hidden",
                                    maxHeight: toast.expanded ? 260 : 0,
                                    opacity: toast.expanded ? 1 : 0,
                                    marginTop: toast.expanded ? 4 : 0,
                                    marginBottom: toast.expanded && !toast.paused ? 18 : 0,
                                    pointerEvents: toast.expanded ? "auto" : "none",
                                    transition:
                                        "max-height 0.25s ease, opacity 0.2s ease, margin-top 0.25s ease, margin-bottom 0.25s ease",
                                }}
                            >
                                <div>{toast.message}</div>
                            </div>
                            {/* Timer row with smooth hide/show and pausable bar */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    bottom: 0,
                                    width: "100%",
                                    backgroundColor: isDarkMode ? "#101828" : "#f5f5f5",
                                    color: isDarkMode ? "#E5E7EB" : "#62748e",
                                    fontSize: "0.8125rem",
                                    textAlign: "left",
                                    whiteSpace: "normal",
                                    borderRadius: 0,
                                    padding: toast.paused ? "0 0 0 18px" : "8px 0 11px 18px",
                                    maxHeight: toast.paused ? 0 : 42,
                                    opacity: toast.paused ? 0 : 1,
                                    transform: toast.paused ? "translateY(4px)" : "translateY(0)",
                                    transition:
                                        "padding 0.25s ease, max-height 0.25s ease, opacity 0.2s ease, transform 0.25s ease",
                                    overflow: "hidden",
                                        zIndex: 2,
                                    }}
                                    >
                                This message will close in <span style={{ fontWeight: "600", color: isDarkMode ? "#fafafa" : "#314158" }}>{toast.remainingTime}</span> seconds.
                                <span
                                    onClick={() => togglePaused(toast.id)}
                                    style={{
                                        textDecoration: "none",
                                        cursor: "pointer",
                                        color: isDarkMode ? "#fafafa" : "#020618",
                                        marginLeft: 4,
                                        transition: "text-decoration 0.2s",
                                        fontSize: "0.85rem",
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.textDecoration = "underline"; }}
                                    onMouseLeave={e => { e.currentTarget.style.textDecoration = "none"; }}
                                >
                                    Click to stop.
                                </span>
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        bottom: 0,
                                        height: "4.5px",
                                        width: "100%",
                                        background: isDarkMode ? background : "#f5f5f5",
                                        zIndex: 1,
                                    }}
                                    >
                                    <div
                                        style={{
                                            position: "absolute",
                                            left: 0,
                                            top: 0,
                                            height: "100%",
                                            width: "100%",
                                            background: bar,
                                            animation: "fillBar 13s linear forwards",
                                            animationPlayState: toast.paused ? "paused" : "running",
                                            transformOrigin: "left",
                                            zIndex: 2,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
                @keyframes fillBar {
                    from {
                        transform: scaleX(0);
                    }
                    to {
                        transform: scaleX(1);
                    }
                }
                @keyframes toastLoadingSpin {
                    100% { transform: rotate(360deg); }
                }
                .toast-loading-spin {
                    animation: toastLoadingSpin 1s linear infinite;
                }
            `}</style>
        </ToastContext.Provider>
    );
}
