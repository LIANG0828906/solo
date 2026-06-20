import { Orbit, GitCompare, Download, Eye, EyeOff } from 'lucide-react';
import { usePlanetStore } from '@/store/useStore';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const showOrbits = usePlanetStore((s) => s.showOrbits);
  const toggleOrbits = usePlanetStore((s) => s.toggleOrbits);
  const compareList = usePlanetStore((s) => s.compareList);

  return (
    <nav className="glass fixed top-0 left-0 right-0 z-50 h-14 px-4 md:px-6 flex items-center justify-between transition-smooth">
      <div className="flex items-center gap-2">
        <Orbit className="h-6 w-6 text-[var(--accent-blue)]" />
        <div className="flex flex-col leading-tight">
          <span className="text-lg font-semibold text-gradient">星途</span>
          <span className="hidden sm:block text-[10px] text-[var(--text-muted)] tracking-wider">
            SOLAR SYSTEM EXPLORER
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <button
          onClick={toggleOrbits}
          className={cn(
            'glass glass-hover glow-hover flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-smooth',
            showOrbits
              ? 'text-[var(--accent-cyan)]'
              : 'text-[var(--text-muted)]'
          )}
          title={showOrbits ? '隐藏轨道' : '显示轨道'}
        >
          {showOrbits ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
          <Orbit className="h-3.5 w-3.5" />
          <span className="hidden md:inline">
            {showOrbits ? '轨道开' : '轨道关'}
          </span>
        </button>

        <button
          className={cn(
            'glass glass-hover glow-hover flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-smooth',
            compareList.length > 0
              ? 'text-[var(--accent-purple)]'
              : 'text-[var(--text-secondary)]'
          )}
          title="对比模式"
        >
          <GitCompare className="h-4 w-4" />
          <span className="hidden md:inline">对比</span>
          {compareList.length > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--accent-purple)] px-1 text-[10px] font-bold text-white">
              {compareList.length}
            </span>
          )}
        </button>
      </div>

      <button
        className="glass glass-hover glow-hover flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-smooth"
        title="导出数据"
      >
        <Download className="h-4 w-4" />
        <span className="hidden md:inline">导出</span>
      </button>
    </nav>
  );
}
