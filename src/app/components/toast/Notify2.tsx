"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { useTheme } from "../ThemeProvider";
import { useRouter } from 'next/navigation';

// context
import { useToken } from "../../context/TokenContext";

// icons
import { GoArrowRight } from "react-icons/go";
import { IoClose } from "react-icons/io5";
import { IoChevronDown } from "react-icons/io5";
import { PiCheckCircleBold } from "react-icons/pi";
import { PiXCircleBold } from "react-icons/pi";
import { PiWarningBold } from "react-icons/pi";

type Toast = {
    id: number;
    title: string;
    message: string;
    related_type: string;
    expanded: boolean;
    paused: boolean;
    remainingTime: number;
    exiting?: boolean;
};

type ToastContextType = {
    showToast: (title: string, message: string, related_type: string) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
};

const TOAST_DURATION = 14; // seconds

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const counterRef = useRef(0);
    const { isDarkMode } = useTheme();
    const router = useRouter();
    const token = useToken();

    const showToast = useCallback((title: string, message: string, related_type: string) => {
        counterRef.current += 1;
        const id = counterRef.current;
        const toast: Toast = {
            id,
            title,
            message,
            related_type,
            expanded: false,
            paused: false,
            remainingTime: TOAST_DURATION,
            exiting: false,
        };
        setToasts(prev => [...prev, toast]);
    }, []);

    // Timer effect for countdown and auto-dismiss
    useEffect(() => {
        const interval = setInterval(() => {
            setToasts(prev => {
                // หา toast ที่จะหมดเวลาและยังไม่ exiting
                const toastsToExit = prev.filter(t => !t.paused && t.remainingTime === 1 && !t.exiting);
                if (toastsToExit.length > 0) {
                    // mark exiting ก่อน แล้วค่อยลบหลัง animation
                    toastsToExit.forEach(t => {
                        setTimeout(() => {
                            setToasts(current => current.filter(x => x.id !== t.id));
                        }, 300);
                    });
                }
                return prev.map(t => {
                    if (t.paused) return t;
                    if (t.remainingTime === 1 && !t.exiting) {
                        // mark exiting
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
            prev.map(t => t.id === id ? { ...t, expanded: !t.expanded } : t)
        );
    };

    const togglePaused = (id: number) => {
        setToasts(prev =>
            prev.map(t => t.id === id ? { ...t, paused: !t.paused } : t)
        );
    };

    const dismissToast = (id: number) => {
        // ทำ animation slide ออกไปทางขวาก่อน แล้วค่อยลบออกจาก state
        setToasts(prev => prev.map(t => (
            t.id === id ? { ...t, exiting: true } : t
        )));

        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 300); // ให้เวลาตาม duration ของ animation slideOutRight
    };

    const handleRelatedToPage = (relatedLink: string) => {
        if (!relatedLink) return;
        if (!/^D|^I/.test(relatedLink)) {
            router.push(`${process.env.NEXT_PUBLIC_PATH}/services/purchase/comparePrice?id=${relatedLink}`);
        }
        else {
            router.push(`${process.env.NEXT_PUBLIC_PATH}/services/purchase/PO/ReviewedPO?poNo=${relatedLink}`);
        }
    }

    const handleReadNotification = async (notify_id: number) => {
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_PATH_PURCHASE_SERVICE}/api/purchase/notify/read/${notify_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                // แจ้งให้ทุกส่วนที่ฟัง event นี้ reload ข้อมูลแจ้งเตือน
                window.dispatchEvent(new CustomEvent('notificationsUpdated'));
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
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
                    // Logic for style/icon by message
                    let icon = <PiCheckCircleBold className="w-7 h-7 text-emerald-500" />;
                    let border = "2px solid rgba(34, 197, 94, 0.4)"; // icon border
                    let iconBg = isDarkMode ? "rgba(34, 197, 94, 0.16)" : "rgba(34, 197, 94, 0.08)";
                    // พื้นหลังการ์ดและสีขอบแบบเรียบง่าย ใกล้เคียงดีไซน์ตัวอย่าง
                    let background = isDarkMode ? "#0d1320" : "#FFFFFF";
                    let cardBorderColor = isDarkMode ? "rgba(55, 65, 81, 1)" : "rgba(209, 213, 219, 1)";
                    let bar = "linear-gradient(90deg, #22c55e 0%, #22c55e 100%)";
                    if (toast.message.includes("มีการอนุมัติ") || toast.message.includes("รายการเปรียบเทียบราคาของท่านได้รับการอนุมัติ") || toast.message.includes("มีการอนุมัติคำขอแก้ไข")) {
                        icon = <PiCheckCircleBold className="w-7 h-7 text-green-500" />;
                        border = "2px solid rgba(16, 185, 129, 0.6)";
                        iconBg = isDarkMode ? "rgba(16, 185, 129, 0.24)" : "rgba(34, 197, 94, 0.1)";
                        cardBorderColor = isDarkMode ? "rgba(16, 185, 129, 0.6)" : "rgba(34, 197, 94, 0.65)";
                        // bar = "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)";
                        bar = "#00c950";
                    } else if (toast.message.includes("มีการไม่อนุมัติ") || toast.message.includes("รายการเปรียบเทียบราคาของท่านไม่ได้รับการอนุมัติ")) {
                        icon = <PiXCircleBold className="w-7 h-7 text-red-500" />;
                        border = "2px solid rgba(239, 68, 68, 0.6)";
                        iconBg = isDarkMode ? "rgba(239, 68, 68, 0.24)" : "rgba(248, 113, 113, 0.12)";
                        cardBorderColor = isDarkMode ? "rgba(248, 113, 113, 0.7)" : "rgba(248, 113, 113, 0.7)";
                        bar = "#fb2c36";
                    } else if (toast.message.includes("มีรายการเปรียบเทียบราคาใหม่") || toast.message.includes("มีการขออนุมัติ") || toast.message.includes("มีการขอแก้ไข")) {
                        icon = <PiWarningBold className="w-7 h-7 text-amber-500" />;
                        border = "2px solid rgba(234, 179, 8, 0.6)";
                        iconBg = isDarkMode ? "rgba(234, 179, 8, 0.2)" : "rgba(234, 179, 8, 0.1)";
                        cardBorderColor = isDarkMode ? "rgba(234, 179, 8, 0.7)" : "rgba(234, 179, 8, 0.7)";
                        bar = "#fe9a00";
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
                                            fontSize: "1rem",
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
                                <button
                                    onClick={() => {
                                        handleRelatedToPage(toast.related_type);
                                        handleReadNotification(toast.id);
                                        dismissToast(toast.id);
                                    }}
                                    className="details-btn"
                                    style={{
                                        marginTop: 8,
                                        padding: "7px 18px",
                                        borderRadius: 8,
                                        border: isDarkMode ? "1px solid rgba(148, 163, 184, 0.9)" : "1px solid rgba(209, 213, 219, 1)",
                                        backgroundColor: isDarkMode ? "rgba(15, 23, 42, 0.8)" : "#ffffff",
                                        color: isDarkMode ? "#E5E7EB" : "#111827",
                                        fontWeight: 500,
                                        cursor: "pointer",
                                        boxShadow: isDarkMode
                                            ? "0 1px 2px rgba(15, 23, 42, 0.9)"
                                            : "0 1px 2px rgba(148, 163, 184, 0.6)",
                                        transition: "background-color 0.15s ease, transform 0.1s ease",
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = isDarkMode
                                                ? "#101828"
                                                : "#f5f5f5";
                                        // e.currentTarget.style.transform = "translateY(-1px)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = isDarkMode
                                                ? "rgba(15, 23, 42, 0.8)"
                                                : "#ffffff";
                                        // e.currentTarget.style.transform = "translateY(0)";
                                    }}
                                >
                                    Details
                                    <GoArrowRight className="inline-block w-4 h-4 ml-2 details-arrow" />
                                </button>
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
            </div>);
            {/* Animation keyframes */}
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
                @keyframes closeSpinBounce {
                    0% {
                        transform: rotate(0deg);
                    }
                    70% {
                        transform: rotate(105deg);
                    }
                    90% {
                        transform: rotate(88deg);
                    }
                    100% {
                        transform: rotate(90deg);
                    }
                }
                .toast-close-icon {
                    transform-origin: center;
                }
                .toast-close-btn:hover .toast-close-icon {
                    animation: closeSpinBounce 0.65s cubic-bezier(0.6, 0, 0.2, 1) forwards;
                }
                .details-arrow {
                    transition: transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .details-btn:hover .details-arrow {
                    transform: translateX(6px);
                }
            `}</style>
        </ToastContext.Provider>
    );
}

