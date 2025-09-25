"use client";
import { useTheme } from "./ThemeProvider";
import AnimatedPageBackground from "./AnimatedPageBackground";
import AnimatedPageBackgroundDarkMode from "./AnimatedPageBackGroundDarkMode";

export default function BackgroundSwitcher() {
  const { isDarkMode } = useTheme();
  return isDarkMode ? <AnimatedPageBackgroundDarkMode /> : <AnimatedPageBackground />;
}
