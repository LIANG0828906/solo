import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
}

interface ReplayState {
  active: boolean;
  entry?: {
    itemName: string;
    recipeColor: string;
  };
}

export default function CraftHistory() {
  const history = useGameStore((s) => s.history);
  const [expanded, setExpanded] = useState(false);
  const [replay, setReplay] = useState<ReplayState>({ active: false });

  const handleReplay = useCallback((entry: typeof history[0]) => {
    setReplay({
      active: true,
      entry: { itemName: entry.itemName, recipeColor: entry.recipeColor },
    });

    setTimeout(() => {
      setReplay({ active: false });
    }, 1500);
  }, []);

  return (
    <div className="border-t border-[#424242] bg-[#222]">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2 hover:bg-[#2a2a2a] transition-colors"
      >
        <span className="text-[var(--color-primary)] text-xs font-bold mono tracking-wider">
          📜 合成历史 {history.length > 0 && `(${history.length})`}
        </span>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-[var(--color-text-muted)] text-xs"
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto', maxHeight: 180 }}
            exit={{ height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="overflow-y-auto max-h-[180px] px-4 pb-2">
              {history.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)] py-3 text-center">
                  暂无合成记录
                </p>
              ) : (
                <div className="space-y-1">
                  {history.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-[#2a2a2a] transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs mono text-[var(--color-text-muted)]">
                          {formatTime(entry.timestamp)}
                        </span>
                        <span className="text-xs">合成</span>
                        <span
                          className="text-xs font-bold"
                          style={{ color: entry.recipeColor }}
                        >
                          {entry.itemName}
                        </span>
                        <span className="text-xs mono text-[var(--color-text-muted)]">
                          x{entry.itemCount}
                        </span>
                      </div>
                      <button
                        onClick={() => handleReplay(entry)}
                        className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity px-2 py-0.5 rounded hover:bg-[#333]"
                      >
                        ▶ 回放
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {replay.active && replay.entry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: [0, 1.2, 1], rotate: 0 }}
              transition={{ duration: 0.5 }}
              className="px-8 py-4 rounded-xl border-2"
              style={{
                borderColor: replay.entry.recipeColor,
                backgroundColor: `${replay.entry.recipeColor}20`,
              }}
            >
              <span className="text-2xl font-bold" style={{ color: replay.entry.recipeColor }}>
                ⚡ {replay.entry.itemName}
              </span>
            </motion.div>

            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: 0,
                  y: 0,
                  opacity: 1,
                  scale: 1,
                }}
                animate={{
                  x: Math.cos((i / 8) * Math.PI * 2) * 120,
                  y: Math.sin((i / 8) * Math.PI * 2) * 120,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="absolute w-3 h-3 rounded-full"
                style={{ backgroundColor: replay.entry!.recipeColor }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
