import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';

const STATUS_CONFIG = [
  { key: 'health' as const, label: '生命', color: 'var(--color-health)', max: 100, icon: '❤️' },
  { key: 'hunger' as const, label: '饥饿', color: 'var(--color-hunger)', max: 100, icon: '🍖' },
  { key: 'thirst' as const, label: '口渴', color: 'var(--color-thirst)', max: 100, icon: '💧' },
];

export default function StatusBar() {
  const status = useGameStore((s) => s.status);

  return (
    <div className="flex items-center gap-4 px-5 py-3 bg-[#222] border-b border-[#424242] relative noise-overlay">
      <div className="text-[var(--color-primary)] font-bold text-lg tracking-wider mono z-10 mr-2">
        ☢ 废土拾荒
      </div>

      <div className="flex items-center gap-4 flex-1 z-10">
        {STATUS_CONFIG.map(({ key, label, color, max, icon }) => {
          const value = status[key];
          const pct = Math.max(0, Math.min(100, (value / max) * 100));
          const isCritical = value <= 20;

          return (
            <div key={key} className="flex items-center gap-2 flex-1">
              <span className="text-sm">{icon}</span>
              <span className="text-xs text-[var(--color-text-muted)] mono w-8">{label}</span>
              <div className="flex-1 h-3 bg-[#111] rounded-sm overflow-hidden relative">
                <motion.div
                  className="h-full rounded-sm"
                  style={{ backgroundColor: color }}
                  initial={false}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                {isCritical && (
                  <div
                    className="absolute inset-0 rounded-sm"
                    style={{
                      backgroundColor: 'var(--color-health)',
                      animation: 'flash-red 0.8s ease-in-out infinite',
                      opacity: 0.4,
                    }}
                  />
                )}
              </div>
              <span className={`text-xs mono w-8 text-right ${isCritical ? 'text-red-400 font-bold' : 'text-[var(--color-text-muted)]'}`}>
                {Math.round(value)}
              </span>
            </div>
          );
        })}
      </div>

      <SlotIndicator />
    </div>
  );
}

function SlotIndicator() {
  const items = useGameStore((s) => s.items);
  const maxSlots = useGameStore((s) => s.maxSlots);
  const used = items.reduce((sum, item) => sum + item.slots * item.count, 0);
  const pct = (used / maxSlots) * 100;

  return (
    <div className="flex items-center gap-2 z-10">
      <span className="text-xs text-[var(--color-text-muted)] mono">背包</span>
      <div className="w-20 h-3 bg-[#111] rounded-sm overflow-hidden">
        <motion.div
          className="h-full rounded-sm"
          style={{
            backgroundColor: pct > 80 ? 'var(--color-accent)' : 'var(--color-primary)',
          }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
      <span className="text-xs mono text-[var(--color-text-muted)]">
        {used}/{maxSlots}
      </span>
    </div>
  );
}
