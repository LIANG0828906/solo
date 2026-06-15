import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { createContext, useContext, useEffect, ReactNode } from "react";
import { useThemeStore, initializeTheme } from "@/store/themeStore";
import Home from "@/pages/Home";
import TripBuilderPage from "@/pages/TripBuilderPage";
import MapViewPage from "@/pages/MapViewPage";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function ThemeProvider({ children }: { children: ReactNode }) {
  const { theme, toggleTheme, setTheme } = useThemeStore();
  const isDark = theme === "dark";

  useEffect(() => {
    initializeTheme();
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}

export default function App() {
  return (
    <Router>
      <ThemeProvider>
        <div className="page-container">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/trip/:id" element={<TripBuilderPage />} />
            <Route path="/map/:id" element={<MapViewPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </ThemeProvider>
    </Router>
  );
}
