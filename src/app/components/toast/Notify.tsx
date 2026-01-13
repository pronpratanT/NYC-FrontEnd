"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { useTheme } from "../ThemeProvider";

// icons
import { GoArrowRight } from "react-icons/go";
import { GoCheckCircleFill } from "react-icons/go";
import { GoXCircleFill } from "react-icons/go";
import { GoClockFill } from "react-icons/go";
import { GoAlertFill } from "react-icons/go";
import { IoClose } from "react-icons/io5";
import { IoChevronUp } from "react-icons/io5";
import { IoChevronDown } from "react-icons/io5";
import { IoAlertCircle } from "react-icons/io5";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { IoIosCloseCircle } from "react-icons/io";
import { IoMdNotifications } from "react-icons/io";
import { IoAlertCircleOutline } from "react-icons/io5";
import { PiCheckCircleBold } from "react-icons/pi";
import { IoIosCloseCircleOutline } from "react-icons/io";

type Toast = {
    id: number;
    title: string;
    message: string;
    expanded: boolean;
    paused: boolean;
    remainingTime: number;
};

type ToastContextType = {
    showToast: (title: string, message: string) => void;
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

    const showToast = useCallback((title: string, message: string) => {
        counterRef.current += 1;
        const id = counterRef.current;
        const toast: Toast = { 
            id, 
            title, 
            message, 
            expanded: false, 
            paused: false, 
            remainingTime: TOAST_DURATION 
        };
        setToasts(prev => [...prev, toast]);
    }, []);

    // Timer effect for countdown and auto-dismiss
    useEffect(() => {
        const interval = setInterval(() => {
            setToasts(prev => 
                prev
                    .map(t => {
                        if (t.paused) return t;
                        const newTime = t.remainingTime - 1;
                        return { ...t, remainingTime: newTime };
                    })
                    .filter(t => t.remainingTime > 0)
            );
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
        setToasts(prev => prev.filter(t => t.id !== id));
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
                    let background = isDarkMode ? "#020617" : "#FFFFFF";
                    let cardBorderColor = isDarkMode ? "rgba(55, 65, 81, 1)" : "rgba(209, 213, 219, 1)";
                    let bar = "linear-gradient(90deg, #22c55e 0%, #22c55e 100%)";
                    if (toast.message.includes("มีการอนุมัติ") || toast.message.includes("รายการเปรียบเทียบราคาของท่านได้รับการอนุมัติ") || toast.message.includes("มีการอนุมัติคำขอแก้ไข")) {
                        icon = <PiCheckCircleBold className="w-6 h-6 text-emerald-500" />;
                        border = "2px solid rgba(16, 185, 129, 0.6)";
                        iconBg = isDarkMode ? "rgba(16, 185, 129, 0.24)" : "rgba(34, 197, 94, 0.1)";
                        background = isDarkMode ? "#022c22" : "#ECFDF3"; // green-900-ish / green-50
                        cardBorderColor = isDarkMode ? "rgba(16, 185, 129, 0.6)" : "rgba(34, 197, 94, 0.65)";
                        bar = "linear-gradient(90deg, #22c55e 0%, #16a34a 100%)";
                    } else if (toast.message.includes("มีการไม่อนุมัติ") || toast.message.includes("รายการเปรียบเทียบราคาของท่านไม่ได้รับการอนุมัติ")) {
                        icon = <IoIosCloseCircle className="w-7 h-7 text-red-500" />;
                        border = "2px solid rgba(239, 68, 68, 0.6)";
                        iconBg = isDarkMode ? "rgba(239, 68, 68, 0.24)" : "rgba(248, 113, 113, 0.12)";
                        background = isDarkMode ? "#450a0a" : "#FEF2F2";
                        cardBorderColor = isDarkMode ? "rgba(248, 113, 113, 0.7)" : "rgba(248, 113, 113, 0.7)";
                        bar = "linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)";
                    } else if (toast.message.includes("มีรายการเปรียบเทียบราคาใหม่") || toast.message.includes("มีการขออนุมัติ")) {
                        icon = <IoAlertCircle className="w-7 h-7 text-yellow-500" />;
                        border = "2px solid rgba(234, 179, 8, 0.6)";
                        iconBg = isDarkMode ? "rgba(234, 179, 8, 0.2)" : "rgba(234, 179, 8, 0.1)";
                        background = isDarkMode ? "#422006" : "#FFFBEB";
                        cardBorderColor = isDarkMode ? "rgba(234, 179, 8, 0.7)" : "rgba(234, 179, 8, 0.7)";
                        bar = "linear-gradient(90deg, #eab308 0%, #b45309 100%)";
                    } else if (toast.message.includes("มีการขอแก้ไข")) {
                        icon = <IoAlertCircle className="w-7 h-7 text-yellow-500" />;
                        border = "2px solid rgba(234, 179, 8, 0.6)";
                        iconBg = isDarkMode ? "rgba(234, 179, 8, 0.2)" : "rgba(234, 179, 8, 0.1)";
                        background = isDarkMode ? "#422006" : "#FFFBEB";
                        cardBorderColor = isDarkMode ? "rgba(234, 179, 8, 0.7)" : "rgba(234, 179, 8, 0.7)";
                        bar = "linear-gradient(90deg, #eab308 0%, #b45309 100%)";
                    }
                    return (
                        <div
                            key={toast.id}
                            style={{
                                minWidth: "340px",
                                maxWidth: "420px",
                                background,
                                color: isDarkMode ? "#E5E7EB" : "#111827",
                                padding: "14px 18px 12px 18px",
                                borderRadius: "12px",
                                boxShadow: isDarkMode
                                    ? "0 18px 45px rgba(0, 0, 0, 0.55)"
                                    : "0 18px 45px rgba(15, 23, 42, 0.14)",
                                border: `1px solid ${cardBorderColor}`,
                                fontFamily: "'Inter', sans-serif",
                                position: "relative",
                                animation: "slideIn 0.3s ease-out",
                                overflow: "hidden",
                            }}
                        >
                            {/* Top row: icon | title | chevron | close */}
                            <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
                                <div
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        // borderRadius: "50%",
                                        // border,
                                        // backgroundColor: iconBg,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "left",
                                        // marginRight: 5,
                                    }}
                                >
                                    {icon}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: "1rem",
                                            fontWeight: "600",
                                            color: isDarkMode ? "#FFFFFF" : "#111827",
                                            letterSpacing: "0.01em",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
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
                                            e.currentTarget.style.background = isDarkMode
                                                ? "rgba(255, 255, 255, 0.1)"
                                                : "rgba(15, 23, 42, 0.06)";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = "transparent";
                                        }}
                                        aria-label="Toggle details"
                                    >
                                        {toast.expanded ? (
                                            <IoChevronUp className="w-5 h-5" />
                                        ) : (
                                            <IoChevronDown className="w-5 h-5" />
                                        )}
                                    </button>
                                    <button
                                        onClick={() => dismissToast(toast.id)}
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
                                            e.currentTarget.style.background = isDarkMode
                                                ? "rgba(255, 255, 255, 0.2)"
                                                : "rgba(15, 23, 42, 0.12)";
                                            e.currentTarget.style.color = isDarkMode ? "#FFFFFF" : "#111827";
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = isDarkMode
                                                ? "rgba(255, 255, 255, 0.1)"
                                                : "rgba(15, 23, 42, 0.06)";
                                            e.currentTarget.style.color = isDarkMode ? "#9CA3AF" : "#6B7280";
                                        }}
                                        aria-label="Close notification"
                                    >
                                        <IoClose className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                            {/* Message block (expanded only) */}
                            {toast.expanded && (
                                <div
                                    style={{
                                        fontSize: "0.95rem",
                                        lineHeight: 1.6,
                                        color: isDarkMode ? "#C8C5C5" : "#374151",
                                        marginTop: 10,
                                        marginBottom: 15,
                                        paddingLeft: 33,
                                        paddingRight: 8,
                                    }}
                                >
                                    {toast.message}
                                </div>
                            )}
                            {/* Timer row (always at bottom, not paused) */}
                            {!toast.paused && (
                                <div
                                    style={{
                                        fontSize: "0.8125rem",
                                        color: isDarkMode ? "#9CA3AF" : "#6B7280",
                                        marginTop: 15,
                                        textAlign: "left",
                                        whiteSpace: "normal",
                                    }}
                                >
                                    This message will close in <span style={{ fontWeight: "600" }}>{toast.remainingTime}</span> seconds.
                                    {!toast.paused ? (
                                        <span
                                            onClick={() => togglePaused(toast.id)}
                                            style={{
                                                textDecoration: "underline",
                                                cursor: "pointer",
                                                fontWeight: "600",
                                                marginLeft: 4,
                                            }}
                                        >
                                            Click to stop.
                                        </span>
                                    ) : (
                                        <span style={{ fontWeight: "600", fontStyle: "italic", marginLeft: 4 }}>
                                            (paused)
                                        </span>
                                    )}
                                </div>
                            )}
                            {/* Bottom gradient bar (not paused) */}
                            {!toast.paused && (
                                <div
                                    style={{
                                        position: "absolute",
                                        left: 0,
                                        bottom: 0,
                                        height: "4px",
                                        width: "100%",
                                        background: bar,
                                        animation: "fillBar 14s ease-out forwards",
                                        transformOrigin: "left",
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
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
				@keyframes fillBar {
					from {
						transform: scaleX(0);
					}
					to {
						transform: scaleX(1);
					}
				}
			`}</style>
        </ToastContext.Provider>
    );
}

