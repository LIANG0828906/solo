import { useState, useEffect, useRef } from 'react';
import { BookCheck, Flame, MessageSquare, Heart, BookOpen, ListChecks, Lock, X } from 'lucide-react';
import { useStore } from '@/store';
import type { Achievement } from '@/types';

const ICON_MAP: Record<string, React.ElementType> = {
  'calendar-check': BookCheck,
  'flame': Flame,
  'message-circle': MessageSquare,
  'heart': Heart,
  'book-open': BookOpen,
  'library': ListChecks,
};

function AchievementIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = ICON_MAP[icon] ?? BookCheck;
  return <Icon className={className} />;
}

function Popover({
  achievement,
  onClose,
}: {
  achievement: Achievement;
  onClose: () => void;
}) {
  const pct = Math.min((achievement.progress / achievement.target) * 100, 100);

  return (
    <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 animate-fade-in">
      <div className="bg-white rounded-lg shadow-lg border border-cream-dark/50 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-text">{achievement.name}</span>
          <button onClick={onClose} className="text-text-muted hover:text-text transition-colors">
            <X size={14} />
          </button>
        </div>
        <p className="text-xs text-text-muted mb-2">{achievement.condition}</p>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange to-orange-light"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-text-light mt-1 text-right">
          {achievement.progress}/{achievement.target}
        </p>
      </div>
      <div className="w-3 h-3 bg-white border-b border-r border-cream-dark/50 rotate-45 mx-auto -mt-1.5" />
    </div>
  );
}

export default function AchievementSystem() {
  const { achievements, achievementsLoading, fetchAchievements } = useStore();
  const [popoverId, setPopoverId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPopoverId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (achievementsLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 py-4">
            <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="grid grid-cols-2 gap-4">
      {achievements.map((a) => (
        <div key={a.id} className="relative flex flex-col items-center gap-2 py-4">
          {a.unlocked ? (
            <>
              <div className="badge-unlocked w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-[0_0_16px_rgba(251,191,36,0.5)]">
                <AchievementIcon icon={a.icon} className="w-7 h-7 text-white" />
              </div>
              <span className="text-sm font-bold text-text">{a.name}</span>
            </>
          ) : (
            <>
              <button
                onClick={() => setPopoverId(popoverId === a.id ? null : a.id)}
                className="badge-locked w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center"
              >
                <Lock className="w-6 h-6 text-text-muted" />
              </button>
              <span className="text-sm text-text-muted">{a.name}</span>
              {popoverId === a.id && (
                <Popover achievement={a} onClose={() => setPopoverId(null)} />
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
