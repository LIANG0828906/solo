import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/useGameStore';
import { matchRecipe } from '@/data/recipes';
import MaterialCard from './MaterialCard';
import ParticleEffect from './ParticleEffect';

export default function Workbench() {
  const workbenchItems = useGameStore((s) => s.workbenchItems);
  const moveFromWorkbench = useGameStore((s) => s.moveFromWorkbench);
  const clearWorkbench = useGameStore((s) => s.clearWorkbench);
  const craftItem = useGameStore((s) => s.craftItem);
  const craftAnimation = useGameStore((s) => s.craftAnimation);
  const clearCraftAnimation = useGameStore((s) => s.clearCraftAnimation);

  const [isDragOver, setIsDragOver] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [failShake, setFailShake] = useState(false);
  const [failFlash, setFailFlash] = useState(false);

  const benchIngredients = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of workbenchItems) {
      map[item.id] = (map[item.id] || 0) + item.count;
    }
    return map;
  }, [workbenchItems]);

  const matchedRecipe = useMemo(() => matchRecipe(benchIngredients), [benchIngredients]);
  const hasItems = workbenchItems.length > 0;

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      try {
        const data = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (data.source === 'backpack' && data.itemId) {
          moveFromWorkbench(data.itemId);
        }
      } catch {
        // ignore
      }
    },
    [moveFromWorkbench]
  );

  const handleCraft = useCallback(() => {
    craftItem();

    if (matchedRecipe) {
      setShowParticles(true);
    } else if (hasItems) {
      setFailShake(true);
      setFailFlash(true);
      setTimeout(() => setFailShake(false), 300);
      setTimeout(() => setFailFlash(false), 300);
    }
  }, [craftItem, matchedRecipe, hasItems]);

  const handleParticleComplete = useCallback(() => {
    setShowParticles(false);
    clearCraftAnimation();
  }, [clearCraftAnimation]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#424242]">
        <h2 className="text-[var(--color-primary)] font-bold text-sm tracking-wider mono uppercase">
          ⚒️ 工作台
        </h2>
        {hasItems && (
          <button
            onClick={clearWorkbench}
            className="text-xs px-3 py-1 rounded-lg bg-[#3a3a3a] text-[var(--color-text-muted)] hover:bg-[#4a4a4a] hover:text-[var(--color-text)] transition-colors"
          >
            清空工作台
          </button>
        )}
      </div>

      <div
        className={`flex-1 flex flex-col relative overflow-hidden ${failShake ? 'shake' : ''}`}
        style={failFlash ? { backgroundColor: 'rgba(229,57,53,0.15)' } : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          className={`
            flex-1 flex flex-col items-center justify-center p-4 m-3 rounded-lg
            workbench-surface
            transition-all duration-200
            ${isDragOver ? 'workbench-surface-hover' : ''}
          `}
        >
          {showParticles && (
            <ParticleEffect
              active={showParticles}
              color={matchedRecipe?.color || '#ff9800'}
              onComplete={handleParticleComplete}
            />
          )}

          {craftAnimation.active && craftAnimation.type === 'success' && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#1a1a1a] border border-[var(--color-success)] px-4 py-2 rounded-lg"
            >
              <span className="text-[var(--color-success)] font-bold mono text-sm">
                ✓ {craftAnimation.recipeName} 合成成功！
              </span>
            </motion.div>
          )}

          {!hasItems && (
            <div className="text-center text-[var(--color-text-muted)]">
              <div className="text-5xl mb-3 opacity-20">⚒️</div>
              <p className="text-sm">将材料拖放到此处</p>
              <p className="text-xs mt-1 opacity-50">工作台将自动检测可用配方</p>
            </div>
          )}

          {hasItems && (
            <div className="w-full z-10">
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                <AnimatePresence mode="popLayout">
                  {workbenchItems.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.8, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2 }}
                    >
                      <MaterialCard item={item} onDragStart={() => moveFromWorkbench(item.id)} compact />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {matchedRecipe ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3"
                >
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border-2"
                    style={{
                      borderColor: matchedRecipe.color,
                      backgroundColor: `${matchedRecipe.color}15`,
                    }}
                  >
                    <span className="text-3xl">{matchedRecipe.icon}</span>
                    <div>
                      <div className="font-bold text-sm" style={{ color: matchedRecipe.color }}>
                        {matchedRecipe.name}
                      </div>
                      <div className="text-xs text-[var(--color-text-muted)]">
                        占 {matchedRecipe.slots} 格
                        {matchedRecipe.statEffects && (
                          <>
                            {' · '}
                            {matchedRecipe.statEffects.health && `生命+${matchedRecipe.statEffects.health}`}
                            {matchedRecipe.statEffects.hunger && `饥饿+${matchedRecipe.statEffects.hunger}`}
                            {matchedRecipe.statEffects.thirst && `口渴+${matchedRecipe.statEffects.thirst}`}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCraft}
                    className="px-8 py-2.5 rounded-lg font-bold text-sm tracking-wider transition-all duration-200 hover:shadow-lg active:scale-95"
                    style={{
                      backgroundColor: matchedRecipe.color,
                      color: '#fff',
                    }}
                  >
                    ⚡ 合成 {matchedRecipe.name}
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center"
                >
                  <p className="text-[var(--color-accent)] font-bold text-sm">✕ 无效配方</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    材料组合不匹配任何已知配方
                  </p>
                  <button
                    onClick={handleCraft}
                    className="mt-3 px-6 py-2 rounded-lg bg-[var(--color-accent)] text-white text-sm font-bold hover:opacity-90 transition-opacity active:scale-95"
                  >
                    尝试合成
                  </button>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
