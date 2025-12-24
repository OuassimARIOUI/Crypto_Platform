"use client";

import { useEffect, useState } from "react";
import { toggleTheme } from "./ThemeProvider";

function getTheme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export default function ThemeToggleButton({ className = "" }) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    setTheme(getTheme());

    // Keep in sync if theme is changed elsewhere.
    const observer = new MutationObserver(() => {
      setTheme(getTheme());
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });

    return () => observer.disconnect();
  }, []);

  const nextLabel = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
  const icon = theme === "dark" ? "light_mode" : "dark_mode";

  return (
    <button
      type="button"
      onClick={() => toggleTheme()}
      className={className}
      aria-label={nextLabel}
      title={nextLabel}
    >
      <span className="material-symbols-outlined">{icon}</span>
    </button>
  );
}
