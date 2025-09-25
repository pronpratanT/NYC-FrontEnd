import React from "react";
import { useTheme } from "./ThemeProvider";

const ThemeToggle: React.FC = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`px-4 py-2 rounded transition-colors duration-200 font-semibold border focus:outline-none ${
        isDarkMode
          ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
          : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
      }`}
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? "โหมดสว่าง" : "โหมดมืด"}
    </button>
  );
};

export default ThemeToggle;
