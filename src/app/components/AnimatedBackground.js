'use client';
import { useState, useEffect } from "react";

function AnimatedBackground({ isDarkMode = false }) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    let animationId;
    let startTime = null;
    
    const animate = (timestamp) => {
      if (startTime === null) startTime = timestamp;
      const deltaTime = (timestamp - startTime) / 1000; // Convert to seconds
      setTime(deltaTime);
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  const luxuryPattern = {
    position: "absolute",
    top: 0, left: 0, width: "100%", height: "100%",
    backgroundImage: isDarkMode
      ? `radial-gradient(circle at ${25 + Math.sin(time * 0.5) * 15}% ${25 + Math.cos(time * 0.4) * 12}%, rgba(33,192,99,${0.15 + Math.sin(time * 0.3) * 0.08}) 0%, transparent 60%),
         radial-gradient(circle at ${75 + Math.cos(time * 0.6) * 20}% ${75 + Math.sin(time * 0.5) * 18}%, rgba(255,215,0,${0.08 + Math.cos(time * 0.4) * 0.05}) 0%, transparent 55%),
         radial-gradient(circle at ${50 + Math.sin(time * 0.3) * 25}% ${30 + Math.cos(time * 0.7) * 20}%, rgba(0,255,255,${0.06 + Math.sin(time * 0.2) * 0.03}) 0%, transparent 65%)`
      : `radial-gradient(circle at ${25 + Math.sin(time * 0.5) * 15}% ${25 + Math.cos(time * 0.4) * 12}%, rgba(33,192,99,${0.05 + Math.sin(time * 0.3) * 0.03}) 0%, transparent 60%),
         radial-gradient(circle at ${75 + Math.cos(time * 0.6) * 20}% ${75 + Math.sin(time * 0.5) * 18}%, rgba(255,215,0,${0.03 + Math.cos(time * 0.4) * 0.02}) 0%, transparent 55%),
         radial-gradient(circle at ${50 + Math.sin(time * 0.3) * 25}% ${30 + Math.cos(time * 0.7) * 20}%, rgba(0,255,255,${0.02 + Math.sin(time * 0.2) * 0.01}) 0%, transparent 65%)`,
    animation: "float 10s ease-in-out infinite",
    zIndex: 0
  };

  const gridOverlay = {
    position: "absolute",
    top: 0, left: 0, width: "100%", height: "100%",
    backgroundImage: isDarkMode
      ? `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
         linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`
      : `linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px),
         linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)`,
    backgroundSize: `${50 + Math.sin(time * 0.3) * 8}px ${50 + Math.cos(time * 0.35) * 8}px`,
    transform: `translate(${Math.sin(time * 0.2) * 12}px, ${Math.cos(time * 0.15) * 8}px) rotate(${time * 0.2}deg)`,
    opacity: 0.6 + Math.sin(time * 0.5) * 0.2,
    zIndex: 1
  };

  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", overflow: "hidden" }}>
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(180deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
      <div style={luxuryPattern} />
      <div style={gridOverlay} />
      {/* Animated flowing lines */}
      {[...Array(12)].map((_, i) => (
        <div
          key={`line-${i}`}
          style={{
            position: "absolute",
            width: `${80 + i * 25}px`,
            height: "3px",
            top: `${15 + i * 8 + Math.sin(time * (0.4 + i * 0.08)) * 15}%`,
            left: `${5 + i * 15 + Math.cos(time * (0.3 + i * 0.1)) * 20}%`,
            background: `linear-gradient(90deg, transparent, ${
              i % 5 === 0 ? (isDarkMode ? 'rgba(33,192,99,0.5)' : 'rgba(33,192,99,0.4)') :
              i % 5 === 1 ? (isDarkMode ? 'rgba(255,215,0,0.4)' : 'rgba(255,215,0,0.3)') :
              i % 5 === 2 ? (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)') :
              i % 5 === 3 ? (isDarkMode ? 'rgba(0,255,255,0.25)' : 'rgba(0,255,255,0.15)') :
              (isDarkMode ? 'rgba(255,0,255,0.15)' : 'rgba(255,0,255,0.1)')
            }, transparent)`,
            borderRadius: "3px",
            opacity: 0.8 + Math.sin(time * (1 + i * 0.1)) * 0.2,
            transform: `rotate(${time * (0.5 + i * 0.05)}deg) scaleX(${1 + Math.sin(time * (0.7 + i * 0.03)) * 0.3})`,
            boxShadow: `0 0 ${8 + Math.sin(time * (0.8 + i * 0.05)) * 4}px rgba(33,192,99,0.3)`,
            zIndex: 2 + i
          }}
        />
      ))}
      {/* Floating particles */}
      {[...Array(20)].map((_, i) => (
        <div
          key={`particle-${i}`}
          style={{
            position: "absolute",
            width: `${2 + Math.sin(time * (1 + i * 0.1)) * 2}px`,
            height: `${2 + Math.sin(time * (1 + i * 0.1)) * 2}px`,
            top: `${10 + (i * 4) % 80 + Math.sin(time * (0.2 + i * 0.05)) * 10}%`,
            left: `${5 + (i * 7) % 90 + Math.cos(time * (0.15 + i * 0.04)) * 15}%`,
            background: i % 3 === 0 ? 'rgba(33,192,99,0.6)' : i % 3 === 1 ? 'rgba(255,215,0,0.5)' : 'rgba(0,255,255,0.4)',
            borderRadius: "50%",
            opacity: 0.3 + Math.sin(time * (2 + i * 0.1)) * 0.3,
            transform: `scale(${0.5 + Math.sin(time * (1.5 + i * 0.08)) * 0.5})`,
            boxShadow: `0 0 ${4 + Math.sin(time * (1 + i * 0.05)) * 2}px currentColor`,
            zIndex: 1
          }}
        />
      ))}
    </div>
  );
}

export default AnimatedBackground;
