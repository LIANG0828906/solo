import { BrowserRouter as Router, Routes, Route, NavLink } from "react-router-dom";
import { useEffect } from "react";
import { LayoutDashboard, Layers, Brain } from "lucide-react";
import { useFlashcardStore } from "@/store";
import Dashboard from "@/Dashboard";
import CardManager from "@/CardManager";
import StudySession from "@/StudySession";

function Navigation() {
  const links = [
    { to: "/", label: "仪表盘", icon: LayoutDashboard },
    { to: "/cards", label: "卡片管理", icon: Layers },
    { to: "/study", label: "学习模式", icon: Brain },
  ];

  return (
    <nav className="glass sticky top-0 z-50 border-b border-white/10">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gradient tracking-wide">闪卡记忆</h1>
        <div className="flex gap-1 sm:gap-2">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `nav-link flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "active text-primary-400 bg-white/5"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                }`
              }
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  const init = useFlashcardStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/cards" element={<CardManager />} />
            <Route path="/study" element={<StudySession />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
