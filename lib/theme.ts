import type { ThemePreference } from "@/lib/db/repo";

export const THEME_STORAGE_KEY = "theme";

/** Applies the theme to <html> and mirrors it to localStorage for the pre-paint script. */
export function applyTheme(pref: ThemePreference) {
  const root = document.documentElement;
  if (pref === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", pref);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {
    // Private mode — the theme still applies for this session.
  }
}

/** Runs before first paint to avoid a light flash for dark-mode users. */
export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

/** A short, gentle vibration where supported (Android). iOS ignores it silently. */
export function haptic(pattern: number | number[] = 12) {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(pattern);
  } catch {
    // ignore
  }
}
