import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const avatarOptions = ["🌿", "🎧", "🚀", "🐾", "🌈", "🍜"];

const blankUser = {
  name: "",
  email: "",
  username: "",
  avatar: avatarOptions[0],
};

const AUTH_USER_KEY = "habita:auth:user";
const AUTH_TOKEN_KEY = "habita:auth:token";

const themes = {
  light: {
    background: "#f7f8fa",
    card: "#ffffff",
    text: "#2d2f38",
    muted: "#6b6f7d",
    accent: "#4A90E2",
    border: "#d4d7de",
    shadow: "none",
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
    shadow: "none",
    chip: "#272c38",
    chipText: "#a8c9ff",
    input: "#232734",
    buttonText: "#0b1426",
  },
};

const THEME_STORAGE_KEY = "habita:theme";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return blankUser;
    try {
      const stored = window.localStorage.getItem(AUTH_USER_KEY);
      return stored ? JSON.parse(stored) : blankUser;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Failed to load stored user", err);
      return blankUser;
    }
  });
  const [authToken, setAuthToken] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(AUTH_TOKEN_KEY);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("Failed to load stored token", err);
      return null;
    }
  });
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(THEME_STORAGE_KEY) === "dark";
  });

  const palette = useMemo(
    () => (darkMode ? themes.dark : themes.light),
    [darkMode]
  );

  const persistUser = useCallback((nextUser) => {
    setUser(nextUser);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(nextUser));
    }
  }, []);

  const persistToken = useCallback((token) => {
    setAuthToken(token);
    if (typeof window !== "undefined") {
      if (token) {
        window.localStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    }
  }, []);

  const normalizeUser = useCallback(
    (username, name) => ({
      ...blankUser,
      username: username?.toLowerCase() || "",
      email: username || "",
      name: name || username || "",
      avatar: user?.avatar || blankUser.avatar,
    }),
    [user?.avatar]
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

  const updateUser = useCallback(
    (updates) => {
      setUser((prev) => {
        const merged = { ...prev, ...updates };
        if (typeof window !== "undefined") {
          window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(merged));
        }
        return merged;
      });
    },
    []
  );

  const logout = useCallback(() => {
    persistUser(blankUser);
    persistToken(null);
  }, [persistToken, persistUser]);

  const callAuthEndpoint = useCallback(async (path, payload) => {
    const response = await fetch(`/api/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    let data;
    try {
      data = await response.json();
    } catch (err) {
      data = {};
    }

    if (!response.ok || data?.success === false) {
      const message = data?.message || data?.errors?.[0]?.msg || "Authentication failed.";
      throw new Error(message);
    }

    return data;
  }, []);

  const login = useCallback(
    async ({ username, password }) => {
      const normalizedUsername = username?.trim();
      if (!normalizedUsername || !password) {
        throw new Error("Username and password are required.");
      }
      const payload = await callAuthEndpoint("login", {
        username: normalizedUsername,
        password,
      });

      const userProfile = normalizeUser(payload.username || normalizedUsername);
      persistUser(userProfile);
      persistToken(payload.token);
      return userProfile;
    },
    [callAuthEndpoint, normalizeUser, persistToken, persistUser]
  );

  const register = useCallback(
    async ({ username, password, name, householdId }) => {
      const normalizedUsername = username?.trim();
      if (!normalizedUsername || !password) {
        throw new Error("Username and password are required.");
      }
      const payload = await callAuthEndpoint("signup", {
        username: normalizedUsername,
        password,
        householdId: householdId?.trim() || undefined,
      });

      const userProfile = normalizeUser(payload.username || normalizedUsername, name);
      persistUser(userProfile);
      persistToken(payload.token);
      return userProfile;
    },
    [callAuthEndpoint, normalizeUser, persistToken, persistUser]
  );

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

  const isAuthenticated = Boolean(authToken);

  return (
    <UserContext.Provider
      value={{
        user,
        token: authToken,
        isAuthenticated,
        login,
        register,
        logout,
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
