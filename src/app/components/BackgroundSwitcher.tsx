"use client";
import { useTheme } from "./ThemeProvider";
import AnimatedPageBackground from "./bg/AnimatedPageBackground";
import AnimatedPageBackgroundDarkMode from "./bg/AnimatedPageBackGroundDarkMode";

export default function BackgroundSwitcher() {
  const { isDarkMode } = useTheme();
  return isDarkMode ? <AnimatedPageBackgroundDarkMode /> : <AnimatedPageBackground />;
}
