import { createContext, useContext, useEffect, useMemo, useState } from "react";

const avatarOptions = ["🌿", "🎧", "🚀", "🐾", "🌈", "🍜"];

const defaultUser = {
  name: "Mavis Liu",
  email: "mavisliu@example.com",
  avatar: avatarOptions[0],
};

const themes = {
  light: {
    background: "#f7f8fa",
    card: "#ffffff",
    text: "#2d2f38",
    muted: "#6b6f7d",
    accent: "#4A90E2",
    border: "#d4d7de",
    shadow: "0 8px 24px rgba(10, 22, 70, 0.08)",
    chip: "#eef3ff",
    chipText: "#2c63d7",
    input: "#ffffff",
    buttonText: "#ffffff",
  },
  dark: {
    background: "#11131a",
    card: "#1b1f2a",
    text: "#f2f5ff",
    muted: "#a7aec3",
    accent: "#7bb3ff",
    border: "#2f3542",
    shadow: "0 12px 28px rgba(0, 0, 0, 0.55)",
    chip: "#272c38",
    chipText: "#a8c9ff",
    input: "#232734",
    buttonText: "#0b1426",
  },
};

const THEME_STORAGE_KEY = "habita:theme";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(defaultUser);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark";
  });

  const palette = useMemo(
    () => (darkMode ? themes.dark : themes.light),
    [darkMode]
  );

  useEffect(() => {
    const root = document.documentElement;
    const entries = {
      "--habita-bg": palette.background,
      "--habita-card": palette.card,
      "--habita-text": palette.text,
      "--habita-muted": palette.muted,
      "--habita-accent": palette.accent,
      "--habita-border": palette.border,
      "--habita-shadow": palette.shadow,
      "--habita-chip": palette.chip,
      "--habita-chip-text": palette.chipText,
      "--habita-input": palette.input,
      "--habita-button-text": palette.buttonText,
    };
    Object.entries(entries).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
    document.body.style.backgroundColor = palette.background;
    document.body.style.color = palette.text;
    root.dataset.theme = darkMode ? "dark" : "light";
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        THEME_STORAGE_KEY,
        darkMode ? "dark" : "light"
      );
    }
  }, [palette, darkMode]);

  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  const cycleAvatar = () => {
    let nextAvatar = avatarOptions[0];
    setUser((prev) => {
      const currentIndex = avatarOptions.indexOf(prev.avatar);
      const nextIndex = (currentIndex + 1) % avatarOptions.length;
      nextAvatar = avatarOptions[nextIndex];
      return { ...prev, avatar: nextAvatar };
    });
    return nextAvatar;
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev);
  };

  const setDarkModePreference = (value) => {
    setDarkMode(Boolean(value));
  };

  return (
    <UserContext.Provider
      value={{
        user,
        updateUser,
        cycleAvatar,
        avatarOptions,
        darkMode,
        toggleDarkMode,
        setDarkMode: setDarkModePreference,
        palette,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
