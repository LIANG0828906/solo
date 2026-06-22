import { useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import MaterialCard from './MaterialCard';

export default function BackpackPanel() {
  const items = useGameStore((s) => s.items);
  const moveToWorkbench = useGameStore((s) => s.moveToWorkbench);

  const handleDragStart = useCallback(
    (itemId: string) => {
      moveToWorkbench(itemId);
    },
    [moveToWorkbench]
  );

  const sortedItems = [...items].sort((a, b) => a.name.localeCompare(b.name));
  const isEmpty = items.length === 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#424242]">
        <h2 className="text-[var(--color-primary)] font-bold text-sm tracking-wider mono uppercase">
          🎒 背包
        </h2>
        <span className="text-xs text-[var(--color-text-muted)] mono">
          {items.reduce((s, i) => s + i.slots * i.count, 0)}/20 格
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 relative noise-overlay">
        {isEmpty ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-[var(--color-text-muted)]">
              <div className="text-4xl mb-2 opacity-30">🏚️</div>
              <p className="text-sm">搜刮更多物资</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <AnimatePresence mode="popLayout">
              {sortedItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <MaterialCard item={item} onDragStart={handleDragStart} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
