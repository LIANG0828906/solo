'use client';

import { Coffee, Plus, Home, Radar, User } from 'lucide-react';
import { useUserStore } from '@/store/userStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function Navbar() {
  const openCreateModal = useUserStore((s) => s.openCreateModal);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => openCreateModal();
    window.addEventListener('open-create-modal', handler);
    return () => window.removeEventListener('open-create-modal', handler);
  }, [openCreateModal]);

  const navItems = [
    { href: '/', label: '首页', icon: Home },
  ];

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 h-16 glass-card border-0 border-b border-white/10 rounded-none backdrop-blur-xl bg-[#1A1A2E]/80">
        <div className="h-full max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
              <Coffee className="relative w-8 h-8 text-yellow-400 drop-shadow-lg" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-display text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                咖啡味觉档案馆
              </span>
              <span className="text-[10px] text-white/40 tracking-widest uppercase">
                Coffee Taste Archive
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                    isActive
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>

          <button
            onClick={openCreateModal}
            className="coffee-btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">记录新品尝</span>
            <span className="sm:hidden">记录</span>
          </button>
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-card border-0 border-t border-white/10 rounded-none backdrop-blur-xl bg-[#1A1A2E]/90 pb-safe">
        <div className="h-16 flex items-center justify-around px-2">
          {[
            { href: '/', label: '首页', icon: Home },
            { href: '#', label: '记录', icon: Plus, action: openCreateModal },
            { href: '/#radar', label: '雷达', icon: Radar },
            { href: '/#profile', label: '我的', icon: User },
          ].map((item, idx) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isAction = item.label === '记录';
            const content = (
              <div
                className={`flex flex-col items-center justify-center gap-0.5 py-1 px-3 transition-all ${
                  isActive ? 'text-yellow-400' : 'text-white/50'
                } ${isAction ? '-mt-4' : ''}`}
              >
                <div
                  className={`flex items-center justify-center ${
                    isAction
                      ? 'w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-[#1A1A2E] shadow-lg shadow-orange-500/30'
                      : ''
                  }`}
                >
                  <Icon className={isAction ? 'w-6 h-6' : 'w-5 h-5'} />
                </div>
                <span className={`text-[10px] font-medium ${isAction ? 'text-white/70' : ''}`}>
                  {item.label}
                </span>
              </div>
            );

            return isAction ? (
              <button key={idx} onClick={item.action} className="flex items-center justify-center">
                {content}
              </button>
            ) : (
              <Link
                key={item.href + idx}
                href={item.href}
                onClick={(e) => {
                  if (item.href.startsWith('/#')) {
                    e.preventDefault();
                    const el = document.querySelector(item.href.substring(1));
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="flex items-center justify-center"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
