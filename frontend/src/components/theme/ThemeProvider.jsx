"use client";

import { useEffect } from "react";

const STORAGE_KEY = "theme";

function applyTheme(theme) {
  const next = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore
  }
}

export default function ThemeProvider({ children }) {
  useEffect(() => {
    let initial = "dark";

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark") {
        initial = stored;
      }
    } catch {
      // ignore
    }

    applyTheme(initial);
  }, []);

  return children;
}

export function toggleTheme() {
  const current = document.documentElement.dataset.theme === "light" ? "light" : "dark";
  applyTheme(current === "dark" ? "light" : "dark");
}
