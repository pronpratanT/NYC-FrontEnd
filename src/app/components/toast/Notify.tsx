"use client";

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from "react";

// icons
import { GoArrowRight } from "react-icons/go";
import { GoCheckCircleFill } from "react-icons/go";
import { GoXCircleFill } from "react-icons/go";
import { GoClockFill } from "react-icons/go";
import { GoAlertFill } from "react-icons/go";

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
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        style={{
                            minWidth: "320px",
                            maxWidth: "400px",
                            background: "linear-gradient(270deg, rgba(16,185,129,0.25) 0%, rgba(240, 240, 240, 0.8) 80%), rgba(240, 240, 240, 0.8)",
                            color: "#F9FAFB",
                            padding: "16px 20px",
                            borderRadius: "10px",
                            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(16, 185, 129, 0.3)",
                            borderBottom: "4px solid #10B981",
                            fontFamily: "'Inter', sans-serif",
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            animation: "slideIn 0.3s ease-out",
                        }}
                    >
                        {/* Success Icon */}
                        <div
                            style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                // background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {/* <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(15,23,42,0.95)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
								<polyline points="20 6 9 17 4 12"></polyline>
							</svg> */}
                            <GoCheckCircleFill className="w-7 h-7 text-green-500" />
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, paddingRight: "24px" }}>
                            <div
                                style={{
                                    fontSize: "1rem",
                                    fontWeight: "600",
                                    color: "#000000",
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
                                    color: "#646464ff",
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
                                background: "rgba(255, 255, 255, 0.1)",
                                color: "#9CA3AF",
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
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                                e.currentTarget.style.color = "#FFFFFF";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                                e.currentTarget.style.color = "#9CA3AF";
                            }}
                            aria-label="Close notification"
                        >
                            ×
                        </button>
                    </div>
                ))}
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
			`}</style>
        </ToastContext.Provider>
    );
}

