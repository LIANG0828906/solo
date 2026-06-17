import { Beaker, BookOpen, Settings, Home } from 'lucide-react';
import { useAnalysisStore } from '@/store/analysisStore';

type NavItem = {
  key: 'home' | 'analyze' | 'guide' | 'settings';
  icon: typeof Beaker;
  label: string;
};

const navItems: NavItem[] = [
  { key: 'home', icon: Home, label: '首页' },
  { key: 'analyze', icon: Beaker, label: '分析' },
  { key: 'guide', icon: BookOpen, label: '指南' },
  { key: 'settings', icon: Settings, label: '设置' }
];

export default function SideNav() {
  const { activeNav, setActiveNav } = useAnalysisStore();

  return (
    <>
      <nav
        className="fixed left-0 top-0 z-50 flex flex-col items-center py-4 md:flex md:w-[60px] md:h-screen"
        style={{ backgroundColor: '#0F172A' }}
      >
        <div className="hidden md:flex md:flex-col md:gap-2 md:w-full">
          {navItems.map(({ key, icon: Icon }) => {
            const isActive = activeNav === key;
            return (
              <button
                key={key}
                onClick={() => setActiveNav(key)}
                className="relative flex w-full items-center justify-center py-3 transition-colors duration-200 hover:bg-slate-800/50"
                title={navItems.find((n) => n.key === key)?.label}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-0 h-full w-[3px]"
                    style={{ backgroundColor: '#3B82F6' }}
                  />
                )}
                <Icon
                  size={24}
                  color={isActive ? '#3B82F6' : '#FFFFFF'}
                />
              </button>
            );
          })}
        </div>
      </nav>

      <nav
        className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around py-2 md:hidden"
        style={{ backgroundColor: '#0F172A' }}
      >
        {navItems.map(({ key, icon: Icon }) => {
          const isActive = activeNav === key;
          return (
            <button
              key={key}
              onClick={() => setActiveNav(key)}
              className="relative flex flex-1 flex-col items-center justify-center py-2 transition-colors duration-200"
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full"
                  style={{ backgroundColor: '#3B82F6' }}
                />
              )}
              <Icon
                size={24}
                color={isActive ? '#3B82F6' : '#FFFFFF'}
              />
            </button>
          );
        })}
      </nav>
    </>
  );
}
