import { useState, useEffect } from "react";

export default function AnimatedLoginBackground({ isDarkMode = false }) {
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
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [targetMousePos.x, targetMousePos.y]);

  // Dynamic luxury pattern
  const dynamicLuxuryPattern = {
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
  const dynamicGridOverlay = {
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
  const floatingElements = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: 2
  };

  return (
    <div style={{ position: "fixed", inset: 0, width: "100vw", height: "100vh", pointerEvents: "none", zIndex: 0 }}>
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
    </div>
  );
}