import { useMemo } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { Search, ChefHat, CalendarDays, ShoppingCart, User, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/state/appStore';

export default function NavBar() {
  const { inviteCode = 'demo' } = useParams<{ inviteCode: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = useAppStore((s) => s.currentUser);
  const [query, setQuery] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo(
    () => [
      {
        label: '食谱',
        to: `/room/${inviteCode}/recipes`,
        icon: ChefHat,
        active: location.pathname.includes('/recipes') && !location.pathname.includes('meal-planner') && !location.pathname.includes('shopping-list'),
      },
      {
        label: '菜单规划',
        to: `/room/${inviteCode}/meal-planner`,
        icon: CalendarDays,
        active: location.pathname.includes('meal-planner'),
      },
      {
        label: '采购清单',
        to: `/room/${inviteCode}/shopping-list`,
        icon: ShoppingCart,
        active: location.pathname.includes('shopping-list'),
      },
    ],
    [inviteCode, location.pathname]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/room/${inviteCode}/recipes?search=${encodeURIComponent(query.trim())}`);
  };

  const avatarSeed = currentUser?.nickname ?? 'chef';

  return (
    <header className="sticky top-0 z-40 w-full shadow-sm">
      <div className="bg-gradient-to-r from-primary via-primary-light to-primary">
        <div className="container flex h-16 items-center gap-3 px-4 sm:gap-6 sm:px-6">
          <Link
            to={`/room/${inviteCode}/recipes`}
            className="flex shrink-0 items-center gap-2 text-white"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <ChefHat className="h-5 w-5" />
            </div>
            <span className="font-display text-xl tracking-wider sm:text-2xl">
              美食小筑
            </span>
          </Link>

          <nav className="ml-2 hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all',
                  item.active
                    ? 'bg-white/25 text-white shadow-inner'
                    : 'text-white/85 hover:bg-white/15 hover:text-white'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <form
            onSubmit={handleSearch}
            className="ml-auto hidden flex-1 max-w-sm items-center sm:flex"
          >
            <div className="relative w-full">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索食谱、食材..."
                className="w-full rounded-xl border-0 bg-white/20 py-2 pl-10 pr-4 text-sm text-white placeholder-white/70 backdrop-blur-sm transition-all focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
              />
            </div>
          </form>

          <div className="ml-auto sm:ml-2">
            <div className="flex items-center gap-2">
              <button
                className="md:hidden rounded-lg p-2 text-white/90 transition hover:bg-white/15"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="toggle menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-inner ring-2 ring-white/60">
                {currentUser?.avatarUrl ? (
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.nickname}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-5 w-5" />
                )}
              </div>
              <div className="hidden flex-col leading-tight sm:flex">
                <span className="text-xs text-white/75">当前房间</span>
                <span className="text-sm font-medium text-white">
                  {avatarSeed} · {inviteCode}
                </span>
              </div>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="animate-slide-down border-t border-white/15 px-4 pb-4 pt-2 md:hidden">
            <form onSubmit={handleSearch} className="mb-3">
              <div className="relative w-full">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="搜索食谱、食材..."
                  className="w-full rounded-xl border-0 bg-white/20 py-2 pl-10 pr-4 text-sm text-white placeholder-white/70 backdrop-blur-sm focus:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/40"
                />
              </div>
            </form>
            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                    item.active
                      ? 'bg-white/25 text-white'
                      : 'text-white/85 hover:bg-white/15'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
