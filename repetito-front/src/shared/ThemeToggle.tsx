import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type ThemeMode = "light" | "dark";

const THEME_STORAGE_KEY = "repetito_theme";

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const isDark = theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [isDark, theme]);

  return (
    <button
      type="button"
      onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
      aria-label={isDark ? "Включить светлую тему" : "Включить темную тему"}
      title={isDark ? "Светлая тема" : "Темная тема"}
      className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-border px-2.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground sm:px-3"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span className="hidden text-xs sm:inline">{isDark ? "Светлая" : "Темная"}</span>
    </button>
  );
}
