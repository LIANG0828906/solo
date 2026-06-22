import { Link, useLocation } from "react-router-dom";
import { Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { path: "/", label: "创作" },
  { path: "/history", label: "历史记录" },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="glass-panel fixed top-0 left-0 right-0 z-50 border-b border-vintage-red/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            to="/"
            className="flex items-center gap-2 group"
          >
            <div className="relative">
              <Newspaper className="w-8 h-8 text-vintage-red transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute -inset-1 bg-gold/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="font-display text-xl sm:text-2xl font-bold text-ink tracking-wide">
              封面<span className="text-vintage-red">工坊</span>
            </span>
          </Link>

          <div className="flex items-center gap-1 sm:gap-2">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={cn(
                    "relative px-3 sm:px-5 py-2 rounded-lg font-sans text-sm sm:text-base font-medium transition-all duration-300",
                    isActive
                      ? "text-vintage-red bg-gold/10"
                      : "text-ink/80 hover:text-vintage-red hover:bg-cream/50"
                  )}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-vintage-red via-gold to-vintage-red rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
