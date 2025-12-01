"use client";
import { useTheme } from "./ThemeProvider";
// import AnimatedPageBackground from "./bg/AnimatedPageBackground";
// import AnimatedPageBackgroundDarkMode from "./bg/AnimatedPageBackGroundDarkMode";

export default function BackgroundSwitcher() {
  const { isDarkMode } = useTheme();
  // return isDarkMode ? <AnimatedPageBackgroundDarkMode /> : <AnimatedPageBackground />;
  return (
    <div 
      style={{ 
        position: 'fixed', 
        inset: 0, 
        width: '100vw', 
        height: '100vh', 
        background: isDarkMode 
          ? 'linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)' 
          : '#ffffff',
        zIndex: -1 
      }} 
    />
  );
}
