import { useEffect, useState } from 'react';
import { useUIStore } from '@/store';
import AchievementBadge from './AchievementBadge';
import { Sparkles } from 'lucide-react';

export default function AchievementPopover() {
  const { pendingAchievements, clearPendingAchievement } = useUIStore();
  const [current, setCurrent] = useState<any | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!current && pendingAchievements.length > 0) {
      const ach = pendingAchievements[0];
      setCurrent(ach);
      setShow(true);
      const t1 = setTimeout(() => {
        setShow(false);
        setTimeout(() => {
          clearPendingAchievement();
          setCurrent(null);
        }, 600);
      }, 4500);
      return () => clearTimeout(t1);
    }
  }, [pendingAchievements, current, clearPendingAchievement]);

  if (!current || !show) return null;

  return (
    <div className="fixed top-24 right-1/2 translate-x-1/2 md:right-6 md:translate-x-0 z-[80] pointer-events-none">
      <div
        className="relative bg-bg-secondary border-2 border-accent-secondary/40 rounded-2xl shadow-[0_0_40px_rgba(245,197,66,0.25)] px-5 py-4 min-w-[280px] animate-fade-slide-up"
        style={{ animationDuration: '500ms' }}
      >
        <div className="absolute -top-2 -left-2">
          <Sparkles className="w-6 h-6 text-accent-secondary animate-pulse-soft" />
        </div>
        <div className="flex items-center gap-4">
          <AchievementBadge achievement={current} animate size="md" showTooltip={false} />
          <div className="flex-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-accent-secondary mb-0.5">
              成就解锁！
            </div>
            <div className="text-base font-bold text-text-primary mb-0.5">
              {current.name}
            </div>
            <div className="text-xs text-text-secondary">{current.description}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
