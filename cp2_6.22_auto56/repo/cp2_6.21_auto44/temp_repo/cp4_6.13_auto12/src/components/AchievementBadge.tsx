import { useEffect, useMemo, useRef } from 'react';
import type { Achievement } from '@/types';
import { Award, Flame, Target, Trophy, Star, Zap } from 'lucide-react';

interface Props {
  achievement: Achievement;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

const LEVEL_STYLES: Record<string, { bg: string; ring: string; text: string; iconCls: string }> = {
  bronze: {
    bg: 'from-amber-800 to-amber-600',
    ring: 'ring-amber-500/40',
    text: '#d97706',
    iconCls: 'text-amber-300',
  },
  silver: {
    bg: 'from-slate-500 to-slate-300',
    ring: 'ring-slate-300/50',
    text: '#94a3b8',
    iconCls: 'text-white',
  },
  gold: {
    bg: 'from-yellow-500 to-amber-400',
    ring: 'ring-yellow-400/50',
    text: '#eab308',
    iconCls: 'text-white',
  },
  extra1: {
    bg: 'from-blue-600 to-cyan-400',
    ring: 'ring-blue-400/50',
    text: '#3b82f6',
    iconCls: 'text-white',
  },
  extra2: {
    bg: 'from-emerald-600 to-green-400',
    ring: 'ring-emerald-400/50',
    text: '#10b981',
    iconCls: 'text-white',
  },
  extra3: {
    bg: 'from-purple-600 to-fuchsia-400',
    ring: 'ring-purple-400/50',
    text: '#a855f7',
    iconCls: 'text-white',
  },
};

const SIZE_STYLES = {
  sm: { wrap: 'w-12 h-12', icon: 'w-6 h-6' },
  md: { wrap: 'w-16 h-16', icon: 'w-8 h-8' },
  lg: { wrap: 'w-24 h-24', icon: 'w-12 h-12' },
};

export default function AchievementBadge({
  achievement,
  animate = false,
  size = 'md',
  showTooltip = true,
}: Props) {
  const style = LEVEL_STYLES[achievement.level] || LEVEL_STYLES.bronze;
  const sz = SIZE_STYLES[size];
  const wrapRef = useRef<HTMLDivElement>(null);

  const IconComp = useMemo(() => {
    if (achievement.type === 'streak') {
      if (achievement.level === 'gold') return Trophy;
      if (achievement.level === 'silver') return Star;
      return Flame;
    }
    if (achievement.level === 'extra3') return Zap;
    if (achievement.level === 'extra2') return Trophy;
    if (achievement.level === 'extra1') return Target;
    return Award;
  }, [achievement]);

  useEffect(() => {
    if (!animate || !wrapRef.current) return;
    const container = wrapRef.current;
    const particleCount = 16;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const dist = 60 + Math.random() * 40;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      const p = document.createElement('span');
      p.className = 'badge-particle';
      p.style.setProperty('--tx', `${tx}px`);
      p.style.setProperty('--ty', `${ty}px`);
      p.style.backgroundColor = style.text;
      p.style.left = '50%';
      p.style.top = '50%';
      container.appendChild(p);
      setTimeout(() => p.remove(), 700);
    }
  }, [animate, style.text]);

  return (
    <div
      ref={wrapRef}
      className={`relative ${
        showTooltip ? 'group' : ''
      } inline-block ${animate ? 'animate-badge-pop' : ''}`}
      title={showTooltip ? `${achievement.name}: ${achievement.description}` : undefined}
    >
      <div
        className={`${sz.wrap} rounded-full bg-gradient-to-br ${style.bg} ring-4 ${style.ring} flex items-center justify-center shadow-xl transition-transform duration-300 ${
          showTooltip ? 'group-hover:scale-110' : ''
        }`}
      >
        <IconComp className={`${sz.icon} ${style.iconCls} drop-shadow-lg`} />
      </div>
      {showTooltip && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-44 p-3 rounded-xl bg-bg-tertiary border border-zinc-600/40 text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none shadow-xl">
          <div className="font-semibold text-text-primary mb-1" style={{ color: style.text }}>
            {achievement.name}
          </div>
          <div className="text-text-secondary leading-relaxed">{achievement.description}</div>
        </div>
      )}
    </div>
  );
}
