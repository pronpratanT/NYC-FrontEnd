"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { useTheme } from "../ThemeProvider";

// icons
import { GoArrowRight } from "react-icons/go";
import { GoCheckCircleFill } from "react-icons/go";
import { GoXCircleFill } from "react-icons/go";
import { GoClockFill } from "react-icons/go";
import { GoAlertFill } from "react-icons/go";
import { IoAlertCircle } from "react-icons/io5";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { IoIosCloseCircle } from "react-icons/io";

type Toast = {
    id: number;
    title: string;
    message: string;
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

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const counterRef = useRef(0);
    const { isDarkMode } = useTheme();

    const showToast = useCallback((title: string, message: string) => {
        counterRef.current += 1;
        const id = counterRef.current;
        const toast: Toast = { id, title, message };
        setToasts(prev => [...prev, toast]);
    }, []);

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
                    let icon = <IoIosCheckmarkCircle className="w-7 h-7 text-emerald-500" />;
                    let border = "5px solid rgba(255, 255, 255, 0.1)";
                    let background = isDarkMode
                        ? "radial-gradient(ellipse 200px 150px at 0% 50%, rgba(0, 122, 85, 0.5) 0%, transparent 60%), linear-gradient(90deg, #1a2033ff 0%, #2a3044ff 100%)"
                        : "linear-gradient(90deg, #86EFAC 0%, #FFFFFF 25%, #FFFFFF 100%)";
                    let bar = "linear-gradient(90deg, #00bc7d 100%, rgba(0, 237, 123, 0) 100%)";
                    if (toast.message.includes("มีการอนุมัติ") || toast.message.includes("รายการเปรียบเทียบราคาของท่านได้รับการอนุมัติ") || toast.message.includes("มีการอนุมัติคำขอแก้ไข")) {
                        icon = <IoIosCheckmarkCircle className="w-7 h-7 text-emerald-500" />;
                        border = "5px solid rgba(16, 185, 129, 0.3)";
                        background = isDarkMode
                            ? "radial-gradient(ellipse 200px 150px at 0% 50%, rgba(16, 185, 129, 0.5) 0%, transparent 60%), linear-gradient(90deg, #1a2033ff 0%, #2a3044ff 100%)"
                            : "linear-gradient(90deg, #A7F3D0 0%, #FFFFFF 25%, #FFFFFF 100%)";
                        bar = "linear-gradient(90deg, #10b981 100%, rgba(16, 185, 129, 0) 100%)";
                    } else if (toast.message.includes("มีการไม่อนุมัติ") || toast.message.includes("รายการเปรียบเทียบราคาของท่านไม่ได้รับการอนุมัติ")) {
                        icon = <IoIosCloseCircle className="w-7 h-7 text-red-500" />;
                        border = "5px solid rgba(239, 68, 68, 0.3)";
                        background = isDarkMode
                            ? "radial-gradient(ellipse 200px 150px at 0% 50%, rgba(239, 68, 68, 0.5) 0%, transparent 60%), linear-gradient(90deg, #1a2033ff 0%, #2a3044ff 100%)"
                            : "linear-gradient(90deg, #FCA5A5 0%, #FFFFFF 25%, #FFFFFF 100%)";
                        bar = "linear-gradient(90deg, #ef4444 100%, rgba(239, 68, 68, 0) 100%)";
                    } else if (toast.message.includes("มีรายการเปรียบเทียบราคาใหม่") || toast.message.includes("มีการขออนุมัติ")) {
                        icon = <IoAlertCircle className="w-7 h-7 text-yellow-500" />;
                        border = "5px solid rgba(234, 179, 8, 0.3)";
                        background = isDarkMode
                            ? "radial-gradient(ellipse 200px 150px at 0% 50%, rgba(234, 179, 8, 0.5) 0%, transparent 60%), linear-gradient(90deg, #1a2033ff 0%, #2a3044ff 100%)"
                            : "linear-gradient(90deg, #FEF08A 0%, #FFFFFF 25%, #FFFFFF 100%)";
                        bar = "linear-gradient(90deg, #eab308 100%, rgba(234, 179, 8, 0) 100%)";
                    } else if (toast.message.includes("มีการขอแก้ไข")) {
                        icon = <IoAlertCircle className="w-7 h-7 text-yellow-500" />;
                        border = "5px solid rgba(234, 179, 8, 0.3)";
                        background = isDarkMode
                            ? "radial-gradient(ellipse 200px 150px at 0% 50%, rgba(234, 179, 8, 0.5) 0%, transparent 60%), linear-gradient(90deg, #1a2033ff 0%, #2a3044ff 100%)"
                            : "linear-gradient(90deg, #FEF08A 0%, #FFFFFF 25%, #FFFFFF 100%)";
                        bar = "linear-gradient(90deg, #eab308 100%, rgba(234, 179, 8, 0) 100%)";
                    }
                    return (
                        <div
                            key={toast.id}
                            style={{
                                minWidth: "320px",
                                maxWidth: "400px",
                                background,
                                color: "#FFFFFF",
                                padding: "16px 20px",
                                borderRadius: "10px",
                                boxShadow: isDarkMode
                                    ? "0 10px 40px rgba(0, 0, 0, 0.5)"
                                    : "0 10px 40px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(16, 185, 129, 0.18)",
                                fontFamily: "'Inter', sans-serif",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                animation: "slideIn 0.3s ease-out",
                                overflow: "hidden",
                            }}
                        >
                            {/* Icon */}
                            <div
                                style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    border,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                {icon}
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, paddingRight: "24px" }}>
                                <div
                                    style={{
                                        fontSize: "1rem",
                                        fontWeight: "600",
                                        color: isDarkMode ? "#FFFFFF" : "#111827",
                                        marginBottom: "4px",
                                        letterSpacing: "0.01em",
                                    }}
                                >
                                    {toast.title}
                                </div>
                                <div
                                    style={{
                                        fontSize: "0.875rem",
                                        lineHeight: 1.5,
                                        color: isDarkMode ? "#C8C5C5" : "#4B5563",
                                    }}
                                >
                                    {toast.message}
                                </div>
                            </div>

                            {/* Close Button */}
                            <button
                                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                                style={{
                                    position: "absolute",
                                    top: "12px",
                                    right: "12px",
                                    width: "24px",
                                    height: "24px",
                                    border: "none",
                                    background: isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(15, 23, 42, 0.06)",
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
                                ×
                            </button>
                            {/* Bottom gradient bar */}
                            <div
                                style={{
                                    position: "absolute",
                                    left: 0,
                                    bottom: 0,
                                    height: "4px",
                                    width: "100%",
                                    background: bar,
                                    animation: "fillBar 2.5s ease-out forwards",
                                    transformOrigin: "left",
                                }}
                            />
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

