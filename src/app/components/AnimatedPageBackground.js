'use client';
import React, { useState, useEffect } from "react";
import { useTheme } from "./ThemeProvider";

function AnimatedPageBackground() {
  const { isDarkMode } = useTheme();
  const [time, setTime] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [targetMousePos, setTargetMousePos] = useState({ x: 50, y: 50 });

  useEffect(() => {
    let animationId;
    const animate = () => {
      setTime(prev => prev + 0.015);
      setMousePos(prev => ({
        x: prev.x + (targetMousePos.x - prev.x) * 0.08,
        y: prev.y + (targetMousePos.y - prev.y) * 0.08
      }));
      animationId = requestAnimationFrame(animate);
    };
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setTargetMousePos({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    animationId = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [targetMousePos.x, targetMousePos.y]);

  // Luxury pattern
  const dynamicLuxuryPattern = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundImage: isDarkMode
      ? `
        radial-gradient(circle at ${25 + Math.sin(time) * 10}% ${25 + Math.cos(time * 0.8) * 10}%, rgba(33, 192, 99, ${0.15 + Math.sin(time * 0.5) * 0.05}) 0%, transparent 50%),
        radial-gradient(circle at ${75 + Math.cos(time * 0.7) * 15}% ${75 + Math.sin(time * 0.6) * 15}%, rgba(255, 215, 0, ${0.08 + Math.cos(time * 0.3) * 0.03}) 0%, transparent 50%)
      `
      : `
        radial-gradient(circle at ${25 + Math.sin(time) * 10}% ${25 + Math.cos(time * 0.8) * 10}%, rgba(33, 192, 99, ${0.03 + Math.sin(time * 0.5) * 0.02}) 0%, transparent 50%),
        radial-gradient(circle at ${75 + Math.cos(time * 0.7) * 15}% ${75 + Math.sin(time * 0.6) * 15}%, rgba(255, 215, 0, ${0.02 + Math.cos(time * 0.3) * 0.01}) 0%, transparent 50%)
      `,
    zIndex: -3
  };

  // Grid overlay
  const dynamicGridOverlay = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundImage: isDarkMode
      ? `
        linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
      `
      : `
        linear-gradient(rgba(0,0,0,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0,0,0,0.02) 1px, transparent 1px)
      `,
    backgroundSize: `${60 + Math.sin(time * 0.2) * 5}px ${60 + Math.cos(time * 0.25) * 5}px`,
    transform: `translate(${Math.sin(time * 0.4) * 8 + (mousePos.x - 50) * 0.01}px, ${Math.cos(time * 0.3) * 5 + (mousePos.y - 50) * 0.01}px) rotate(${time * 0.5}deg)`,
    transition: "none",
    zIndex: -2
  };

  // Main background gradient (matches page.js dark mode)
  const mainBgStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    background: isDarkMode
      ? "linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)"
      : "linear-gradient(135deg, #FAFBFC 0%, #F8F9FA 50%, #F1F3F4 100%)",
    zIndex: -4
  };

  return (
    <>
      <div style={mainBgStyle} />
      <div style={dynamicLuxuryPattern} />
      <div style={dynamicGridOverlay} />
      {/* Mouse-following ambient light */}
      <div
        style={{
          position: "fixed",
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          width: "400px",
          height: "400px",
          transform: "translate(-50%, -50%)",
          background: isDarkMode 
            ? `radial-gradient(circle, rgba(33, 192, 99, ${0.15 + Math.sin(time * 0.8) * 0.05}) 0%, rgba(255, 215, 0, ${0.08 + Math.cos(time * 0.6) * 0.03}) 30%, transparent 70%)`
            : `radial-gradient(circle, rgba(33, 192, 99, ${0.08 + Math.sin(time * 0.8) * 0.02}) 0%, rgba(255, 215, 0, ${0.04 + Math.cos(time * 0.6) * 0.02}) 30%, transparent 70%)`,
          borderRadius: "50%",
          filter: "blur(1px)",
          opacity: 0.8 + Math.sin(time * 0.5) * 0.2,
          pointerEvents: "none",
          zIndex: -1
        }}
      />
      {/* Secondary ambient light */}
      <div
        style={{
          position: "fixed",
          left: `${mousePos.x + Math.sin(time * 0.3) * 5}%`,
          top: `${mousePos.y + Math.cos(time * 0.4) * 3}%`,
          width: "600px",
          height: "600px",
          transform: "translate(-50%, -50%)",
          background: isDarkMode 
            ? `radial-gradient(circle, rgba(33, 192, 99, 0.05) 0%, transparent 60%)`
            : `radial-gradient(circle, rgba(33, 192, 99, 0.03) 0%, transparent 60%)`,
          borderRadius: "50%",
          filter: "blur(2px)",
          pointerEvents: "none",
          zIndex: -2
        }}
      />
      {/* Premium floating elements */}
      {[...Array(6)].map((_, i) => (
        <div
          key={`particle-${i}`}
          style={{
            position: "fixed",
            left: `${mousePos.x + Math.sin(time * (2 + i * 0.5) + i * 60) * (15 + i * 3)}%`,
            top: `${mousePos.y + Math.cos(time * (1.5 + i * 0.7) + i * 45) * (12 + i * 2)}%`,
            width: `${4 + i}px`,
            height: `${4 + i}px`,
            background: isDarkMode
              ? (i % 3 === 0 ? "#21C063" : i % 3 === 1 ? "#FFD700" : "#FFFFFF")
              : (i % 3 === 0 ? "#21C063" : i % 3 === 1 ? "#FFD700" : "#FFFFFF"),
            borderRadius: "50%",
            opacity: 0.7,
            filter: "blur(1px)",
            zIndex: 0
          }}
        />
      ))}
    </>
  );
}

export default AnimatedPageBackground;