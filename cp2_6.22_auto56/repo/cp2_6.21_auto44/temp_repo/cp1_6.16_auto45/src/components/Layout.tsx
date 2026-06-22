import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Ticket, Music, Shield, LogOut, User, Menu, X } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useState } from "react";

export default function Layout() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: "/", label: "首页", icon: Home },
    { to: "/tickets", label: "我的票夹", icon: Ticket },
  ];

  if (user?.role === "artist") {
    navLinks.push({ to: "/artist/dashboard", label: "音乐人后台", icon: Music });
  }
  if (user?.role === "admin") {
    navLinks.push({ to: "/admin", label: "管理员后台", icon: Shield });
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 glass border-b border-white/10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="text-2xl font-extrabold gradient-text">
            IndieVibe
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  isActive(link.to)
                    ? "text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300 flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {user.name}
                </span>
                <button
                  onClick={() => {
                    logout();
                    navigate("/");
                  }}
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  退出
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-1.5 rounded-lg gradient-bg text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                登录 / 注册
              </Link>
            )}
          </div>

          <button
            className="md:hidden text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden glass border-t border-white/10 px-4 py-3 space-y-2 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                  isActive(link.to)
                    ? "bg-white/10 text-white"
                    : "text-gray-400"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                  navigate("/");
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 w-full"
              >
                <LogOut className="w-4 h-4" />
                退出登录
              </button>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm gradient-bg text-white"
              >
                登录 / 注册
              </Link>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10">
        <div className="flex items-center justify-around h-16">
          {[
            { to: "/", label: "首页", icon: Home },
            { to: "/tickets", label: "票夹", icon: Ticket },
            ...(user?.role === "artist"
              ? [{ to: "/artist/dashboard", label: "后台", icon: Music }]
              : []),
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-0.5 text-xs transition-colors ${
                isActive(item.to) ? "text-white" : "text-gray-500"
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
