import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Upload, Shield, LogIn, LogOut, Menu, X } from "lucide-react";
import { useWorkStore } from "@/stores/useWorkStore";

const links = [
  { to: "/", label: "展示墙", icon: LayoutGrid },
  { to: "/upload", label: "上传作品", icon: Upload },
  { to: "/admin", label: "审核管理", icon: Shield },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { adminToken, setAdminToken } = useWorkStore();

  return (
    <nav className="fixed top-0 inset-x-0 z-50 bg-gray-900/70 backdrop-blur-[10px] border-b border-white/10">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-4 h-14">
        <Link to="/" className="font-display text-xl font-bold text-indigo-400 tracking-wide">
          作品收集墙
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                location.pathname === to ? "text-indigo-400" : "text-gray-300 hover:text-white"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          {adminToken ? (
            <button onClick={() => setAdminToken(null)} className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors">
              <LogOut size={16} />登出
            </button>
          ) : (
            <Link to="/login" className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white transition-colors">
              <LogIn size={16} />登录
            </Link>
          )}
        </div>

        <button className="md:hidden text-gray-300" onClick={() => setOpen(!open)}>
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-gray-900/90 backdrop-blur-[10px] px-4 pb-4 pt-2 space-y-3">
          {links.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 text-sm ${
                location.pathname === to ? "text-indigo-400" : "text-gray-300"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
          {adminToken ? (
            <button
              onClick={() => { setAdminToken(null); setOpen(false); }}
              className="flex items-center gap-2 text-sm text-gray-300"
            >
              <LogOut size={16} />登出
            </button>
          ) : (
            <Link to="/login" onClick={() => setOpen(false)} className="flex items-center gap-2 text-sm text-gray-300">
              <LogIn size={16} />登录
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
