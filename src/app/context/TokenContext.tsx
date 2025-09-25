"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getCookie } from "../utils/cookies";

const TokenContext = createContext<string | null>(null);
export const useToken = () => useContext(TokenContext);

export const TokenProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(null);
    
    useEffect(() => {
        const updateToken = () => {
            const currentToken = getCookie("authToken");
            // เฉพาะ log เมื่อ token เปลี่ยนแปลง
            if (currentToken !== token) {
                console.log("TokenProvider updating token:", currentToken);
                setToken(currentToken);
            }
        };
        
        const currentToken = getCookie("authToken");
        console.log("TokenProvider initial token:", currentToken);
        setToken(currentToken);
        
        // ฟัง custom event สำหรับ token updates
        const handleTokenUpdate = () => {
            const currentToken = getCookie("authToken");
            console.log("TokenProvider event-triggered update:", currentToken);
            setToken(currentToken);
        };
        window.addEventListener("tokenUpdated", handleTokenUpdate);
        
        // ตั้ง interval เพื่อตรวจสอบ cookie changes (กรณี cross-tab) - ทุก 30 วินาที
        const checkInterval = setInterval(updateToken, 30000);
        
        return () => {
            window.removeEventListener("tokenUpdated", handleTokenUpdate);
            clearInterval(checkInterval);
        };
    }, [token]);
    
    return <TokenContext.Provider value={token}>{children}</TokenContext.Provider>;
}