"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { toggleTheme } from "./ThemeProvider";

function getThemeSnapshot() {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

function subscribeToTheme(callback) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

export default function ThemeToggleButton({ className = "" }) {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => "dark");

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
