import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useTeaStore } from './store';

const GlassCup = () => {
  const selectedMaterials = useTeaStore((s) => s.selectedMaterials);
  const newlyAddedInstanceId = useTeaStore((s) => s.newlyAddedInstanceId);
  const clearNewlyAdded = useTeaStore((s) => s.clearNewlyAdded);

  const liquidLayers = selectedMaterials.filter((m) => m.category === 'tea' || m.category === 'syrup');
  const toppings = selectedMaterials.filter((m) => m.category === 'topping');

  useEffect(() => {
    if (newlyAddedInstanceId) {
      const t = setTimeout(() => clearNewlyAdded(), 800);
      return () => clearTimeout(t);
    }
  }, [newlyAddedInstanceId, clearNewlyAdded]);

  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative" style={{ width: 200, height: 320 }}>
        <div
          className="absolute inset-0"
          style={{
            borderRadius: '20px 20px 36px 36px',
            background: 'linear-gradient(180deg, rgba(200, 230, 201, 0.35) 0%, rgba(200, 230, 201, 0.15) 100%)',
            border: '2px solid rgba(200, 230, 201, 0.6)',
            boxShadow: 'inset 0 4px 20px rgba(255,255,255,0.4), 0 8px 32px rgba(165, 214, 167, 0.3)',
            backdropFilter: 'blur(4px)',
            overflow: 'hidden',
          }}
        >
          <div
            className="absolute left-2 top-6 bottom-6 w-6 rounded-full"
            style={{
              background: 'linear-gradient(180deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.1) 100%)',
            }}
          />
          <div
            className="absolute right-4 top-8 bottom-8 w-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.3)' }}
          />

          <div className="absolute inset-x-1 bottom-1 top-12 flex flex-col-reverse overflow-hidden"
            style={{ borderRadius: '0 0 32px 32px' }}
          >
            <AnimatePresence>
              {liquidLayers.map((m, idx) => {
                const totalLayers = liquidLayers.length || 1;
                const layerHeight = 100 / totalLayers;
                const isNew = m.instanceId === newlyAddedInstanceId;
                return (
                  <motion.div
                    key={m.instanceId}
                    initial={isNew ? { y: -300, opacity: 0 } : false}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 120, damping: 14, delay: idx * 0.05 }}
                    className="relative"
                    style={{
                      height: `${layerHeight}%`,
                      background: `linear-gradient(180deg, ${m.color}CC 0%, ${m.color}99 100%)`,
                      boxShadow: `inset 0 2px 10px ${m.color}33`,
                    }}
                  >
                    <div
                      className="absolute inset-x-0 top-0 h-1"
                      style={{ background: 'rgba(255,255,255,0.35)' }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="absolute inset-x-2 bottom-2 top-14 pointer-events-none">
            <AnimatePresence>
              {toppings.map((t, i) => {
                const isNew = t.instanceId === newlyAddedInstanceId;
                const positions = [
                  { left: '25%', bottom: '8%' },
                  { left: '55%', bottom: '12%' },
                  { left: '38%', bottom: '5%' },
                  { left: '68%', bottom: '6%' },
                  { left: '15%', bottom: '15%' },
                  { left: '48%', bottom: '18%' },
                ];
                const pos = positions[i % positions.length];
                return (
                  <motion.div
                    key={t.instanceId}
                    initial={isNew ? { y: -260, scale: 0, opacity: 0 } : false}
                    animate={{
                      y: 0,
                      scale: 1,
                      opacity: 1,
                      transition: {
                        type: 'spring',
                        stiffness: 260,
                        damping: 10,
                        mass: 0.8,
                      },
                    }}
                    className="absolute"
                    style={{ ...pos, fontSize: 22 }}
                  >
                    {t.icon}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <div
          className="absolute -inset-x-2 -bottom-3 h-5 rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(165, 214, 167, 0.4) 0%, transparent 70%)',
            filter: 'blur(4px)',
          }}
        />
      </div>
      <p className="mt-6 text-sm text-gray-500 font-medium">
        {selectedMaterials.length === 0 ? '添加材料开始调配你的专属茶饮 ✨' : `已添加 ${selectedMaterials.length} 种材料`}
      </p>
    </div>
  );
};

export const Workbench = () => {
  const {
    selectedMaterials,
    recommendations,
    removeMaterial,
    reorderMaterials,
    addMaterial,
    materials,
    showWorkbench,
    toggleWorkbench,
    generateRecipeCard,
  } = useTeaStore();

  const [recipeName, setRecipeName] = useState('');

  const totalCalories = selectedMaterials.reduce((s, m) => s + m.calories, 0);

  if (!showWorkbench) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={toggleWorkbench}
        className="fixed right-6 top-1/2 -translate-y-1/2 z-30 px-5 py-4 rounded-2xl text-white font-medium shadow-xl flex flex-col items-center gap-1"
        style={{ background: 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)' }}
      >
        <span className="text-2xl">🧪</span>
        <span className="text-sm">调配台</span>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-7xl mx-auto mt-8 px-6"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🧪</span>
          <h2 className="text-xl font-bold text-gray-800">调配工作台</h2>
          <span className="px-3 py-1 rounded-full text-xs font-medium text-white"
            style={{ background: 'linear-gradient(135deg, #66BB6A, #43A047)' }}
          >
            {totalCalories} kcal
          </span>
        </div>
        <button
          onClick={toggleWorkbench}
          className="text-gray-400 hover:text-gray-600 transition-colors text-xl"
        >
          ✕
        </button>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <motion.div
          className="col-span-3 bg-white rounded-2xl p-4 h-[560px] overflow-hidden flex flex-col"
          style={{ boxShadow: '0 4px 20px rgba(165, 214, 167, 0.2)' }}
        >
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>📋</span> 已选材料
          </h3>
          <div className="flex-1 overflow-y-auto pr-1">
            {selectedMaterials.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm">
                <span className="text-4xl mb-2 opacity-50">🍵</span>
                还没有选择材料
              </div>
            ) : (
              <Reorder.Group
                axis="y"
                values={selectedMaterials}
                onReorder={(newOrder) => {
                  if (newOrder.length === selectedMaterials.length) {
                    const fromIdx = selectedMaterials.findIndex(
                      (m) => m.instanceId !== newOrder[selectedMaterials.indexOf(m)]?.instanceId
                    );
                    const changedIdx = newOrder.findIndex(
                      (m, i) => m.instanceId !== selectedMaterials[i]?.instanceId
                    );
                    if (changedIdx !== -1) {
                      const fromItem = selectedMaterials.find(
                        (m) => !newOrder.some((n, idx) => n.instanceId === m.instanceId && idx === selectedMaterials.indexOf(m))
                      );
                      if (fromItem) {
                        const f = selectedMaterials.indexOf(fromItem);
                        const t = newOrder.findIndex((n) => n.instanceId === fromItem.instanceId);
                        reorderMaterials(f, t);
                      }
                    }
                  }
                }}
                className="flex flex-col gap-2"
              >
                <AnimatePresence>
                  {selectedMaterials.map((m) => (
                    <Reorder.Item
                      key={m.instanceId}
                      value={m}
                      whileDrag={{ scale: 1.05, boxShadow: '0 8px 24px rgba(165, 214, 167, 0.4)' }}
                      exit={{ x: -100, opacity: 0, transition: { duration: 0.3 } }}
                      className="flex items-center gap-3 p-3 rounded-xl cursor-grab active:cursor-grabbing"
                      style={{
                        background: `linear-gradient(135deg, ${m.color}22 0%, ${m.color}11 100%)`,
                        border: `1px solid ${m.color}44`,
                      }}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-800 truncate">{m.name}</div>
                        <div className="text-xs text-gray-400">{m.calories} kcal</div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => removeMaterial(m.instanceId)}
                        className="w-6 h-6 rounded-full bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center text-xs transition-colors"
                      >
                        ✕
                      </motion.button>
                    </Reorder.Item>
                  ))}
                </AnimatePresence>
              </Reorder.Group>
            )}
          </div>

          <div className="pt-4 mt-3 border-t border-gray-100">
            <input
              type="text"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="给你的茶饮起个名字..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-100 focus:outline-none focus:border-green-300 text-sm mb-3 bg-gray-50"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => generateRecipeCard(recipeName || '我的专属茶饮')}
              disabled={selectedMaterials.length === 0}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'linear-gradient(135deg, #66BB6A 0%, #43A047 100%)', boxShadow: '0 4px 14px rgba(102, 187, 106, 0.4)' }}
            >
              ✨ 生成配方卡片
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          className="col-span-5 rounded-2xl flex items-center justify-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(232, 245, 233, 0.6) 0%, rgba(200, 230, 201, 0.3) 100%)',
            boxShadow: '0 4px 20px rgba(165, 214, 167, 0.2)',
          }}
        >
          <div
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(165, 214, 167, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(200, 230, 201, 0.4) 0%, transparent 50%)',
            }}
          />
          <GlassCup />
        </motion.div>

        <motion.div
          className="col-span-4 bg-white rounded-2xl p-4 h-[560px] overflow-hidden flex flex-col"
          style={{ boxShadow: '0 4px 20px rgba(165, 214, 167, 0.2)' }}
        >
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span>💡</span> 智能推荐
          </h3>
          <div className="flex-1 overflow-y-auto pr-1">
            {recommendations.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm text-center px-4">
                <span className="text-4xl mb-2 opacity-50">🌟</span>
                {selectedMaterials.length === 0
                  ? '先添加一些茶底材料\n我会为你推荐最佳搭配'
                  : '你的配方已经很完美啦！'}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recommendations.map((rec, idx) => {
                  const mat = materials.find((m) => m.id === rec.materialId);
                  if (!mat) return null;
                  return (
                    <motion.div
                      key={rec.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.08 }}
                      className="relative p-3 rounded-xl overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${mat.color}18 0%, ${mat.color}0A 100%)`,
                        border: `1px solid ${mat.color}33`,
                      }}
                    >
                      <motion.div
                        animate={{
                          opacity: [0.5, 1, 0.5],
                          scale: [1, 1.02, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          delay: idx * 0.3,
                        }}
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: `linear-gradient(135deg, transparent 0%, ${mat.color}22 50%, transparent 100%)`,
                        }}
                      />
                      <div className="relative flex items-start gap-3">
                        <span className="text-2xl">{mat.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-800">{mat.name}</div>
                          <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{rec.reason}</div>
                          <div className="text-xs text-gray-400 mt-1">{mat.calories} kcal</div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          onClick={() => addMaterial(mat.id)}
                          className="px-3 py-1.5 rounded-lg text-white text-xs font-medium"
                          style={{ background: 'linear-gradient(135deg, #66BB6A, #43A047)' }}
                        >
                          添加
                        </motion.button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
