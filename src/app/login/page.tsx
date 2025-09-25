"use client";

import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { setCookie } from "../utils/cookies";

const h1Style = {
  fontSize: "2.5rem",
  fontWeight: "300",
  background: "linear-gradient(135deg, #21C063 0%, #1A9453 50%, #FFD700 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  padding: "30px 0 20px 0",
  letterSpacing: "2px",
  fontFamily: "'Inter', sans-serif"
};

function FloatingLabelInput({
  type,
  value,
  onChange,
  label,
  isDarkMode = false,
  onKeyDown
}: {
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  isDarkMode?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}): React.ReactElement {
  const [isFocused, setIsFocused] = useState(false);

  const inputStyles = {
    width: "100%",
    padding: "18px 24px",
    fontSize: "16px",
    border: isDarkMode
      ? `1px solid rgba(255, 255, 255, ${isFocused ? '0.3' : '0.15'})`
      : `1px solid rgba(0, 0, 0, ${isFocused ? '0.15' : '0.08'})`,
    borderRadius: "12px",
    backgroundColor: isDarkMode
      ? "rgba(255, 255, 255, 0.08)"
      : "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(20px)",
    outline: "none",
    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
    color: isDarkMode ? "#ffffff" : "#2C3E50",
    fontFamily: "'Inter', sans-serif",
    fontWeight: "400",
    boxShadow: isDarkMode
      ? (isFocused ? "0 4px 20px rgba(33, 192, 99, 0.3)" : "0 2px 10px rgba(0, 0, 0, 0.2)")
      : (isFocused ? "0 4px 20px rgba(33, 192, 99, 0.15)" : "0 2px 10px rgba(0, 0, 0, 0.04)"),
    transform: isFocused ? "translateY(-2px)" : "translateY(0)"
  };

  const labelStyles: React.CSSProperties = {
    position: "absolute",
    left: "20px",
    top: (value || isFocused) ? "2px" : "50%", // 👈 ดัน label ขึ้นไปสูงขึ้น
    transform: (value || isFocused) ? "translateY(0)" : "translateY(-50%)",
    fontSize: (value || isFocused) ? "12px" : "16px", // 👈 ตอน float ทำให้เล็กลง
    color: isDarkMode
      ? (isFocused ? "#21C063" : "rgba(255, 255, 255, 0.7)")
      : (isFocused ? "#21C063" : "rgba(44, 62, 80, 0.6)"),
    transition: "all 0.3s ease",
    pointerEvents: "none",
    fontWeight: (value || isFocused) ? "600" : "400",
    padding: "0 4px" // กัน label ทับ input border
  };



  return (
    <div style={{
      position: "relative",
      marginBottom: "25px",
      width: "100%"
    }}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={inputStyles}
        onKeyDown={onKeyDown}
      />
      <label style={labelStyles}>
        {label}
      </label>
    </div>
  );
}

// Animated background component (all elements)
function AnimatedBackground({ isDarkMode }: { isDarkMode: boolean }): React.ReactElement {
  const [time, setTime] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [targetMousePos, setTargetMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    let animationId: number | null = null;

    const animate = () => {
      setTime(prev => prev + 0.015);
      setMousePos(prev => ({
        x: prev.x + (targetMousePos.x - prev.x) * 0.08,
        y: prev.y + (targetMousePos.y - prev.y) * 0.08
      }));
      animationId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setTargetMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationId !== null) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [targetMousePos.x, targetMousePos.y]);

  // Dynamic luxury pattern
    const dynamicLuxuryPattern: React.CSSProperties = {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      backgroundImage: isDarkMode ? (
        `radial-gradient(circle at ${25 + Math.sin(time) * 10}% ${25 + Math.cos(time * 0.8) * 10}%, rgba(33, 192, 99, ${0.15 + Math.sin(time * 0.5) * 0.05}) 0%, transparent 50%),
        radial-gradient(circle at ${75 + Math.cos(time * 0.7) * 15}% ${75 + Math.sin(time * 0.6) * 15}%, rgba(255, 215, 0, ${0.08 + Math.cos(time * 0.3) * 0.03}) 0%, transparent 50%)`
      ) : (
        `radial-gradient(circle at ${25 + Math.sin(time) * 10}% ${25 + Math.cos(time * 0.8) * 10}%, rgba(33, 192, 99, ${0.03 + Math.sin(time * 0.5) * 0.02}) 0%, transparent 50%),
        radial-gradient(circle at ${75 + Math.cos(time * 0.7) * 15}% ${75 + Math.sin(time * 0.6) * 15}%, rgba(255, 215, 0, ${0.02 + Math.cos(time * 0.3) * 0.01}) 0%, transparent 50%)`
      ),
      zIndex: 0
    };

  // Dynamic grid overlay
  const dynamicGridOverlay: React.CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundImage: isDarkMode ? (
      `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`
    ) : (
      `linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px)`
    ),
    backgroundSize: `${60 + Math.sin(time * 0.2) * 5}px ${60 + Math.cos(time * 0.25) * 5}px`,
    transform: `translate(${Math.sin(time * 0.4) * 8 + (mousePos.x - 50) * 0.01}px, ${Math.cos(time * 0.3) * 5 + (mousePos.y - 50) * 0.01}px) rotate(${time * 0.5}deg)`,
    transition: "none",
    zIndex: 1
  };

  // Floating elements container
    const floatingElements: React.CSSProperties = {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      pointerEvents: "none",
      zIndex: 2
    };

  return (
    <>
      <style jsx>{`
        @keyframes shine {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          50% { transform: translateX(100%) translateY(100%) rotate(45deg); }
          100% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
        }
      `}</style>
      <div style={dynamicLuxuryPattern} />
      <div style={dynamicGridOverlay} />
      {/* Mouse-following ambient light */}
      <div
        style={{
          position: "absolute",
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          width: "400px",
          height: "400px",
          transform: "translate(-50%, -50%)",
          background: isDarkMode
            ? `radial-gradient(circle, rgba(33, 192, 99, ${0.15 + Math.sin(time * 0.8) * 0.05}) 0%, rgba(255, 215, 0, ${0.08 + Math.cos(time * 0.6) * 0.03}) 30%, transparent 70%)`
            : `radial-gradient(circle, rgba(33, 192, 99, ${0.08 + Math.sin(time * 0.8) * 0.02}) 0%, rgba(255, 215, 0, ${0.04 + Math.cos(time * 0.6) * 0.02}) 30%, transparent 70%)`,
          borderRadius: "50%",
          transition: "none",
          pointerEvents: "none",
          zIndex: 1,
          filter: "blur(1px)",
          opacity: 0.8 + Math.sin(time * 0.5) * 0.2
        }}
      />
      {/* Secondary ambient light */}
      <div
        style={{
          position: "absolute",
          left: `${mousePos.x + Math.sin(time * 0.3) * 5}%`,
          top: `${mousePos.y + Math.cos(time * 0.4) * 3}%`,
          width: "600px",
          height: "600px",
          transform: "translate(-50%, -50%)",
          background: isDarkMode
            ? `radial-gradient(circle, rgba(33, 192, 99, 0.05) 0%, transparent 60%)`
            : `radial-gradient(circle, rgba(33, 192, 99, 0.03) 0%, transparent 60%)`,
          borderRadius: "50%",
          transition: "none",
          pointerEvents: "none",
          zIndex: 0,
          filter: "blur(2px)"
        }}
      />
      {/* Premium floating elements */}
      <div style={floatingElements}>
        {/* Mouse interaction particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={`particle-${i}`}
            style={{
              position: "absolute",
              left: `${mousePos.x + Math.sin(time * (2 + i * 0.5) + i * 60) * (15 + i * 3)}%`,
              top: `${mousePos.y + Math.cos(time * (1.5 + i * 0.7) + i * 45) * (12 + i * 2)}%`,
              width: `${4 + i}px`,
              height: `${4 + i}px`,
              borderRadius: "50%",
              background: isDarkMode ? (
                i % 3 === 0 ? "rgba(33, 192, 99, 0.6)" :
                  i % 3 === 1 ? "rgba(255, 215, 0, 0.5)" :
                    "rgba(255, 255, 255, 0.4)"
              ) : (
                i % 3 === 0 ? "rgba(33, 192, 99, 0.4)" :
                  i % 3 === 1 ? "rgba(255, 215, 0, 0.3)" :
                    "rgba(255, 255, 255, 0.6)"
              ),
              transform: `scale(${1 + Math.sin(time * 3 + i) * 0.3})`,
              opacity: 0.4 + Math.sin(time * 2 + i) * 0.3,
              boxShadow: isDarkMode
                ? `0 0 ${8 + i * 2}px ${i % 3 === 0 ? "rgba(33, 192, 99, 0.6)" : i % 3 === 1 ? "rgba(255, 215, 0, 0.5)" : "rgba(255, 255, 255, 0.4)"}`
                : `0 0 ${6 + i}px ${i % 3 === 0 ? "rgba(33, 192, 99, 0.4)" : i % 3 === 1 ? "rgba(255, 215, 0, 0.3)" : "rgba(255, 255, 255, 0.6)"}`,
              transition: "none",
              pointerEvents: "none"
            }}
          />
        ))}
        {/* Enhanced geometric shapes */}
        {[...Array(8)].map((_, i) => {
          const size = [160, 120, 90, 70, 55, 40, 30, 25][i];
          const shapes = ['circle', 'rounded-square', 'diamond', 'hexagon'];
          const shapeType = shapes[i % 4];
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                width: `${size}px`,
                height: `${size}px`,
                borderRadius: shapeType === 'circle' ? "50%" :
                  shapeType === 'rounded-square' ? "20%" :
                    shapeType === 'diamond' ? "10px" : "30%",
                background: isDarkMode ? (
                  i === 0
                    ? `linear-gradient(${135 + time * 20}deg, rgba(33, 192, 99, 0.2), rgba(255, 215, 0, 0.1))`
                    : i === 1
                      ? `linear-gradient(${45 + time * 15}deg, rgba(255, 255, 255, 0.15), rgba(248, 249, 250, 0.08))`
                      : i === 2
                        ? `linear-gradient(${225 + time * 25}deg, rgba(33, 192, 99, 0.18), rgba(255, 255, 255, 0.1))`
                        : i === 3
                          ? `linear-gradient(${315 + time * 18}deg, rgba(255, 215, 0, 0.15), transparent)`
                          : i === 4
                            ? `conic-gradient(from ${time * 30}deg, rgba(33, 192, 99, 0.12), rgba(255, 215, 0, 0.06), rgba(255, 255, 255, 0.1))`
                            : i === 5
                              ? `radial-gradient(circle, rgba(255, 255, 255, 0.12), rgba(33, 192, 99, 0.08))`
                              : i === 6
                                ? `linear-gradient(${90 + time * 22}deg, rgba(255, 215, 0, 0.1), rgba(248, 249, 250, 0.06))`
                                : `linear-gradient(${180 + time * 12}deg, rgba(33, 192, 99, 0.08), rgba(255, 255, 255, 0.05))`
                ) : (
                  i === 0
                    ? `linear-gradient(${135 + time * 20}deg, rgba(33, 192, 99, 0.12), rgba(255, 215, 0, 0.06))`
                    : i === 1
                      ? `linear-gradient(${45 + time * 15}deg, rgba(255, 255, 255, 0.8), rgba(248, 249, 250, 0.5))`
                      : i === 2
                        ? `linear-gradient(${225 + time * 25}deg, rgba(33, 192, 99, 0.1), rgba(255, 255, 255, 0.4))`
                        : i === 3
                          ? `linear-gradient(${315 + time * 18}deg, rgba(255, 215, 0, 0.08), transparent)`
                          : i === 4
                            ? `conic-gradient(from ${time * 30}deg, rgba(33, 192, 99, 0.06), rgba(255, 215, 0, 0.03), rgba(255, 255, 255, 0.4))`
                            : i === 5
                              ? `radial-gradient(circle, rgba(255, 255, 255, 0.6), rgba(33, 192, 99, 0.05))`
                              : i === 6
                                ? `linear-gradient(${90 + time * 22}deg, rgba(255, 215, 0, 0.05), rgba(248, 249, 250, 0.3))`
                                : `linear-gradient(${180 + time * 12}deg, rgba(33, 192, 99, 0.04), rgba(255, 255, 255, 0.2))`
                ),
                left: [12, 70, 20, 80, 8, 88, 35, 60][i] + "%",
                top: `${[18, 25, 75, 12, 60, 45, 85, 35][i] + Math.sin(time * (0.8 + i * 0.2) + i * 1.5) * (15 + i * 2)}%`,
                transform: `
                  rotate(${time * (8 + i * 4) + i * 60}deg) 
                  scale(${1 + Math.sin(time * (0.6 + i * 0.1) + i) * 0.2}) 
                  translate(${Math.cos(time * 0.5 + i) * (10 + i * 2) + (mousePos.x - 50) * (0.02 + i * 0.005)}px, ${Math.sin(time * 0.7 + i) * (8 + i) + (mousePos.y - 50) * (0.015 + i * 0.003)}px)
                  ${shapeType === 'diamond' ? `rotateX(${Math.sin(time + i) * 15}deg)` : ''}
                `,
                transition: "none",
                border: isDarkMode ? (
                  i % 3 === 0 ? "1px solid rgba(33, 192, 99, 0.3)" :
                    i % 3 === 1 ? "1px solid rgba(255, 255, 255, 0.2)" :
                      "1px solid rgba(255, 215, 0, 0.25)"
                ) : (
                  i % 3 === 0 ? "1px solid rgba(33, 192, 99, 0.2)" :
                    i % 3 === 1 ? "1px solid rgba(255, 255, 255, 0.3)" :
                      "1px solid rgba(255, 215, 0, 0.15)"
                ),
                boxShadow: isDarkMode ? (
                  i === 1 ? "0 15px 50px rgba(0, 0, 0, 0.3)" :
                    i === 3 ? "0 8px 25px rgba(33, 192, 99, 0.25)" :
                      i === 5 ? "0 6px 20px rgba(255, 215, 0, 0.2)" : "none"
                ) : (
                  i === 1 ? "0 15px 50px rgba(0, 0, 0, 0.1)" :
                    i === 3 ? "0 8px 25px rgba(33, 192, 99, 0.15)" :
                      i === 5 ? "0 6px 20px rgba(255, 215, 0, 0.1)" : "none"
                ),
                backdropFilter: i % 2 === 0 ? "blur(2px)" : "none"
              }}
            />
          );
        })}
      </div>
    </>
  );
}

export default function Home() {
  const [empID, setEmpID] = useState("");
  const [password, setPassword] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
      e.preventDefault();
      setError("");
      setIsLoading(true);
      try {
        const response = await fetch("/api/proxy/user/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: empID, password })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "เข้าสู่ระบบไม่สำเร็จ");
        }
        // เก็บ token ถ้ามี
        if (data.token) {
          // เก็บ token ลง cookies (expired ใน 7 วัน)
          setCookie("authToken", data.token, 7);
          console.log("Token saved to cookies:", data.token);
          
          // Trigger custom event เพื่อให้ TokenContext รับรู้การเปลี่ยนแปลง
          window.dispatchEvent(new CustomEvent('tokenUpdated'));
          
          // รอสักครู่ให้ context อัพเดตก่อน redirect
          setTimeout(() => {
            router.push("/");
          }, 100);
        } else {
          router.push("/");
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message || "เกิดข้อผิดพลาด");
        } else {
          setError("เกิดข้อผิดพลาด");
        }
      } finally {
        setIsLoading(false);
      }
    };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Dynamic styles based on theme
  const dynamicBgMain: React.CSSProperties = {
    background: isDarkMode
      ? "linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)"
      : "linear-gradient(135deg, #FAFBFC 0%, #F8F9FA 50%, #F1F3F4 100%)",
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden"
  };

  const dynamicCardStyle = {
    minHeight: "600px",
    backgroundColor: isDarkMode
      ? "rgba(255, 255, 255, 0.05)"
      : "rgba(255, 255, 255, 0.85)",
    borderRadius: "24px",
    padding: "60px 50px",
    backdropFilter: "blur(40px)",
    border: isDarkMode
      ? "1px solid rgba(255, 255, 255, 0.1)"
      : "1px solid rgba(255, 255, 255, 0.3)",
    boxShadow: isDarkMode
      ? `0 32px 64px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 1px rgba(33, 192, 99, 0.1)`
      : `0 32px 64px rgba(0, 0, 0, 0.08), 0 16px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.9), 0 0 0 1px rgba(33, 192, 99, 0.08)`
  };

  const dynamicTextColor = isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(44, 62, 80, 0.7)";

  return (
    <>
      <div style={dynamicBgMain}>
        {/* Loading spinner */}
        {isLoading && (
          <div style={{position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.15)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <div style={{width: 60, height: 60, border: '6px solid #21C063', borderRadius: '50%', borderTop: '6px solid #FFD700', animation: 'spin 1s linear infinite'}} />
            <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
          </div>
        )}
        {/* Animated background */}
        <AnimatedBackground isDarkMode={isDarkMode} />

        {/* Dark Mode Toggle */}
        <div style={{
          position: "absolute",
          top: "30px",
          right: "30px",
          zIndex: 100
        }}>
          <button
            onClick={toggleDarkMode}
            style={{
              width: "60px",
              height: "32px",
              borderRadius: "16px",
              border: "none",
              background: isDarkMode
                ? "linear-gradient(135deg, #21C063, #1A9453)"
                : "linear-gradient(135deg, #E8E8E8, #F0F0F0)",
              position: "relative",
              cursor: "pointer",
              transition: "all 0.3s ease",
              boxShadow: isDarkMode
                ? "0 4px 15px rgba(33, 192, 99, 0.3)"
                : "0 4px 15px rgba(0, 0, 0, 0.1)"
            }}
          >
            <div style={{
              width: "24px",
              height: "24px",
              borderRadius: "12px",
              background: "#FFFFFF",
              position: "absolute",
              top: "4px",
              left: isDarkMode ? "32px" : "4px",
              transition: "all 0.3s ease",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px"
            }}>
              {isDarkMode ? "🌙" : "☀️"}
            </div>
          </button>
        </div>

        <div style={{ width: "100%", maxWidth: "480px", zIndex: 10 }}>
          <div style={dynamicCardStyle}>
            <div style={{ width: "100%", textAlign: "center", marginBottom: "40px" }}>
              {/* Custom NYC Logo */}
              <div style={{
                display: "inline-block",
                position: "relative",
                marginBottom: "20px"
              }}>
                <div style={{
                  width: "100px",
                  height: "100px",
                  borderRadius: "24px",
                  background: isDarkMode
                    ? "linear-gradient(135deg, #21C063 0%, #1A9453 50%, #FFD700 100%)"
                    : "linear-gradient(135deg, #21C063 0%, #1A9453 50%, #FFD700 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: isDarkMode
                    ? "0 12px 40px rgba(33, 192, 99, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)"
                    : "0 12px 40px rgba(33, 192, 99, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
                  position: "relative",
                  overflow: "hidden"
                }}>
                  {/* Logo Text */}
                  <div style={{
                    color: "#FFFFFF",
                    fontSize: "28px",
                    fontWeight: "800",
                    fontFamily: "'Inter', sans-serif",
                    letterSpacing: "1px",
                    textShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
                    zIndex: 2
                  }}>
                    NYC
                  </div>
                  {/* Animated shine effect */}
                  <div style={{
                    position: "absolute",
                    top: "-50%",
                    left: "-50%",
                    width: "200%",
                    height: "200%",
                    background: "linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent)",
                    transform: "rotate(45deg)",
                    animation: "shine 3s ease-in-out infinite",
                    zIndex: 1
                  }} />
                </div>
                {/* Company subtitle */}
                <div style={{
                  fontSize: "10px",
                  color: isDarkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(44, 62, 80, 0.6)",
                  fontWeight: "500",
                  letterSpacing: "1px",
                  marginTop: "8px",
                  fontFamily: "'Inter', sans-serif"
                }}>
                  INDUSTRY CO.,LTD.
                </div>
              </div>
              <h1 style={h1Style}>Welcome Back</h1>
              <p style={{
                color: dynamicTextColor,
                fontSize: "14px",
                fontWeight: "400",
                margin: "0",
                fontFamily: "'Inter', sans-serif"
              }}>Sign in to your account</p>
            </div>
              <div style={{ width: "100%" }}>
                {/* Error message */}
                {error && (
                  <div style={{color: 'red', textAlign: 'center', marginBottom: 16, fontWeight: 500}}>{error}</div>
                )}
              <FloatingLabelInput
                label="Employee ID"
                type="text"
                value={empID}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmpID(e.target.value)}
                isDarkMode={isDarkMode}
              />
              <FloatingLabelInput
                label="Password"
                type="password"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                isDarkMode={isDarkMode}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter' && empID && password) {
                    // Trigger the button click or form submit instead of passing e as any
                    handleLogin(new Event('submit') as unknown as React.FormEvent);
                  }
                }}
              />
              <button
                style={{
                  width: "100%",
                  padding: "18px",
                  fontSize: "16px",
                  fontWeight: "500",
                  border: "none",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #21C063 0%, #1A9453 100%)",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                  marginTop: "30px",
                  fontFamily: "'Inter', sans-serif",
                  letterSpacing: "0.5px",
                  boxShadow: "0 8px 32px rgba(33, 192, 99, 0.25)",
                  position: "relative",
                  overflow: "hidden"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 12px 40px rgba(33, 192, 99, 0.35)";
                  e.currentTarget.style.background = "linear-gradient(135deg, #2ECC71 0%, #21C063 100%)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 8px 32px rgba(33, 192, 99, 0.25)";
                  e.currentTarget.style.background = "linear-gradient(135deg, #21C063 0%, #1A9453 100%)";
                }}
                onClick={handleLogin}
              >
                Sign In
              </button>
              <div style={{
                textAlign: "center",
                marginTop: "30px"
              }}>
                <a href="#" style={{
                  color: isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(44, 62, 80, 0.6)",
                  fontSize: "14px",
                  textDecoration: "none",
                  fontFamily: "'Inter', sans-serif",
                  transition: "color 0.3s ease"
                }}
                  onMouseOver={(e) => (e.currentTarget as HTMLAnchorElement).style.color = "#21C063"}
                  onMouseOut={(e) => (e.currentTarget as HTMLAnchorElement).style.color = isDarkMode ? "rgba(255, 255, 255, 0.6)" : "rgba(44, 62, 80, 0.6)"}
                >
                  Forgot your password?
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}