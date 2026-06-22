import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useBrewingStore } from './store';
import type { PotionType } from './types';

const effectColors: Record<PotionType, string> = {
  healing: '#A8E6CF',
  explosion: '#FF8A80',
  invisibility: '#B39DDB',
  unknown: '#9e9e9e',
};

export const Cauldron = () => {
  const {
    materials,
    cauldronMaterials,
    temperature,
    stirCount,
    progress,
    isBrewing,
    isExploding,
    activeEffect,
    setTemperature,
    incrementStir,
    addMaterialToCauldron,
    removeMaterialFromCauldron,
    startBrewing,
    cancelBrewing,
    tickProgress,
  } = useBrewingStore();

  const [isStirAnimating, setIsStirAnimating] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const progressRef = useRef<number | null>(null);

  useEffect(() => {
    if (isBrewing) {
      progressRef.current = window.setInterval(() => {
        tickProgress();
      }, 1000);
    }
    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
        progressRef.current = null;
      }
    };
  }, [isBrewing, tickProgress]);

  const handleDragStart = (e: React.DragEvent, materialId: string) => {
    e.dataTransfer.setData('materialId', materialId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const materialId = e.dataTransfer.getData('materialId');
    if (materialId) {
      addMaterialToCauldron(materialId);
    }
  };

  const handleStirClick = () => {
    if (isStirAnimating) return;
    incrementStir();
    setIsStirAnimating(true);
    setTimeout(() => setIsStirAnimating(false), 300);
  };

  const getAvailableCount = (materialId: string) => {
    const material = materials.find((m) => m.id === materialId);
    const inCauldron = cauldronMaterials.find((cm) => cm.materialId === materialId);
    if (!material) return 0;
    return material.count - (inCauldron?.count || 0);
  };

  const getMaterialInfo = (materialId: string) =>
    materials.find((m) => m.id === materialId);

  const tempPercent = (temperature / 300) * 100;

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-4 flex-1 min-h-0">
        <div className="w-[240px] bg-[#16213e] rounded-xl p-4 overflow-y-auto border border-[#2a2a4a] shrink-0">
          <h2 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
            <span>🧰</span> 材料架
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {materials.map((material) => {
              const available = getAvailableCount(material.id);
              const disabled = available <= 0 || isBrewing;
              return (
                <motion.div
                  key={material.id}
                  draggable={!disabled}
                  onDragStart={(e) => !disabled && handleDragStart(e, material.id)}
                  onClick={() => !disabled && addMaterialToCauldron(material.id)}
                  whileHover={{ y: disabled ? 0 : -3, scale: disabled ? 1 : 1.02 }}
                  transition={{ duration: 0.2 }}
                  className={`relative p-3 rounded-xl cursor-pointer select-none transition-all ${
                    disabled
                      ? 'bg-[#1a1a2e] opacity-50 cursor-not-allowed'
                      : 'bg-[#1a1a2e] hover:bg-[#252547]'
                  } border border-[#2a2a4a]`}
                  title={material.description}
                >
                  <div className="text-3xl text-center mb-1">{material.icon}</div>
                  <div className="text-white text-xs text-center truncate font-medium">
                    {material.name}
                  </div>
                  <div
                    className={`absolute -top-1 -right-1 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${
                      available > 0 ? 'bg-[#e94560] text-white' : 'bg-gray-600 text-gray-400'
                    }`}
                  >
                    {available}
                  </div>
                  <div className="text-[10px] text-gray-400 text-center mt-1">
                    {material.tempMin}°~{material.tempMax}°
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <AnimatePresence>
            {activeEffect && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.2, y: -40 }}
                transition={{ duration: 0.3 }}
                className="absolute top-20 left-1/2 -translate-x-1/2 z-50"
              >
                <div
                  className="px-8 py-4 rounded-2xl text-2xl font-bold shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${effectColors[activeEffect.type]}33, ${effectColors[activeEffect.type]}66)`,
                    border: `2px solid ${effectColors[activeEffect.type]}`,
                    color: '#fff',
                    textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  }}
                >
                  ✨ {activeEffect.text} ✨
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-4 mb-4">
            <div className="flex-1 bg-[#16213e] rounded-xl p-4 border border-[#2a2a4a]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white text-sm font-medium flex items-center gap-1">
                  🌡️ 温度控制
                </span>
                <span
                  className="text-lg font-bold"
                  style={{
                    color:
                      tempPercent < 33
                        ? '#00b4d8'
                        : tempPercent < 66
                        ? '#f4a261'
                        : '#e63946',
                  }}
                >
                  {temperature}°C
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={0}
                  max={300}
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  disabled={!isBrewing && cauldronMaterials.length === 0 ? false : false}
                  className="w-full h-3 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #00b4d8 0%, #f4a261 50%, #e63946 100%)`,
                  }}
                />
                <style>{`
                  input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #fff;
                    border: 3px solid #e94560;
                    cursor: pointer;
                    box-shadow: 0 2px 8px rgba(233,69,96,0.5);
                  }
                  input[type="range"]::-moz-range-thumb {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #fff;
                    border: 3px solid #e94560;
                    cursor: pointer;
                  }
                `}</style>
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>0°</span>
                <span>150°</span>
                <span>300°</span>
              </div>
            </div>

            <div className="bg-[#16213e] rounded-xl p-4 border border-[#2a2a4a] w-40">
              <div className="text-white text-sm font-medium mb-2 flex items-center gap-1">
                🥄 搅拌次数
              </div>
              <motion.button
                onClick={handleStirClick}
                whileTap={{ scale: 0.95 }}
                disabled={cauldronMaterials.length === 0}
                className="w-full py-3 rounded-xl bg-gradient-to-br from-[#e94560] to-[#c73e54] text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#e94560]/30 transition-shadow"
              >
                <motion.span
                  animate={isStirAnimating ? { rotate: 360 } : {}}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  display="inline-block"
                >
                  🌀
                </motion.span>
                <div className="text-xs mt-1">{stirCount} 次</div>
              </motion.button>
            </div>
          </div>

          <motion.div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            animate={isExploding ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.3 }}
            className={`flex-1 min-h-[300px] rounded-2xl p-6 relative overflow-hidden flex flex-col ${
              isExploding ? 'bg-red-900/60' : 'bg-[#16213e]'
            }`}
            style={{
              boxShadow: isExploding
                ? '0 0 60px rgba(230,57,70,0.8), inset 0 0 40px rgba(230,57,70,0.5)'
                : '0 0 20px rgba(233,69,96,0.3)',
              border: dragOver
                ? '3px dashed #e94560'
                : '2px solid #2a2a4a',
            }}
          >
            <AnimatePresence>
              {isExploding && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 pointer-events-none"
                >
                  <div className="absolute inset-0 bg-gradient-radial from-red-500/60 via-transparent to-transparent" />
                  {[...Array(20)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{
                        x: '50%',
                        y: '50%',
                        scale: 0,
                        opacity: 1,
                      }}
                      animate={{
                        x: `${30 + Math.random() * 40}%`,
                        y: `${30 + Math.random() * 40}%`,
                        scale: 1,
                        opacity: 0,
                      }}
                      transition={{ duration: 0.5, delay: i * 0.01 }}
                      className="absolute w-4 h-4 rounded-full bg-orange-400"
                      style={{
                        boxShadow: '0 0 10px #f59e0b',
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-between items-center mb-4 z-10">
              <h2 className="text-white text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">⚗️</span> 炼金坩埚
              </h2>
              <div className="flex gap-2">
                {isBrewing ? (
                  <motion.button
                    onClick={cancelBrewing}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 text-white text-sm font-medium transition-colors"
                  >
                    ✕ 取消
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={startBrewing}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={cauldronMaterials.length === 0}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#e94560] to-[#ff6b6b] text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#e94560]/40 transition-shadow"
                  >
                    🔥 开始酿造
                  </motion.button>
                )}
              </div>
            </div>

            <div className="mb-4 z-10">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">酿造进度</span>
                <span
                  className={`font-bold ${
                    progress >= 100 ? 'text-green-400' : 'text-[#e94560]'
                  }`}
                >
                  {progress.toFixed(0)}%
                </span>
              </div>
              <div className="h-4 bg-[#1a1a2e] rounded-full overflow-hidden border border-[#2a2a4a]">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background:
                      'linear-gradient(90deg, #e94560 0%, #f4a261 50%, #A8E6CF 100%)',
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>

            <div
              className={`flex-1 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-4 min-h-[180px] z-10 ${
                dragOver
                  ? 'border-[#e94560] bg-[#e94560]/10'
                  : 'border-[#2a2a4a] bg-[#1a1a2e]/50'
              } transition-all`}
            >
              {cauldronMaterials.length === 0 ? (
                <div className="text-center text-gray-500">
                  <div className="text-5xl mb-2 opacity-50">🫕</div>
                  <div className="text-sm">
                    将材料拖拽或点击放入坩埚
                  </div>
                </div>
              ) : (
                <Reorder.Group
                  axis="x"
                  values={cauldronMaterials}
                  onReorder={() => {}}
                  className="flex flex-wrap gap-3 justify-center items-center max-w-full"
                >
                  {cauldronMaterials.map((cm) => {
                    const material = getMaterialInfo(cm.materialId);
                    if (!material) return null;
                    const isTempOk =
                      temperature >= material.tempMin &&
                      temperature <= material.tempMax;
                    return (
                      <Reorder.Item
                        key={cm.materialId}
                        value={cm}
                        as="div"
                        className="pointer-events-none"
                      >
                        <motion.div
                          layout
                          initial={{ scale: 0, y: 20 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0, y: -20 }}
                          onClick={() =>
                            !isBrewing && removeMaterialFromCauldron(cm.materialId)
                          }
                          className={`relative p-4 rounded-xl cursor-pointer transition-all pointer-events-auto ${
                            isTempOk
                              ? 'bg-gradient-to-br from-[#2a2a4a] to-[#1a1a2e] hover:from-[#3a3a5a]'
                              : 'bg-red-900/50 animate-pulse'
                          } border-2 ${
                            isTempOk ? 'border-[#3a3a5a]' : 'border-red-500'
                          }`}
                          title={`点击移除 · 耐受温度: ${material.tempMin}°~${material.tempMax}°`}
                        >
                          <div className="text-4xl text-center mb-1">
                            {material.icon}
                          </div>
                          <div className="text-white text-xs text-center font-medium">
                            {material.name}
                          </div>
                          {cm.count > 1 && (
                            <div className="absolute -top-2 -right-2 bg-[#e94560] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">
                              ×{cm.count}
                            </div>
                          )}
                          {!isTempOk && (
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[10px] text-red-400 bg-red-900/80 px-1.5 py-0.5 rounded whitespace-nowrap">
                              温度异常!
                            </div>
                          )}
                        </motion.div>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              )}
            </div>

            {isBrewing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 right-4 text-xs text-gray-400 bg-[#1a1a2e]/80 px-3 py-1.5 rounded-lg z-10"
              >
                酿造中... 保持温度在材料耐受范围内
              </motion.div>
            )}

            <div className="absolute inset-0 pointer-events-none opacity-20">
              {isBrewing && (
                <>
                  {[...Array(8)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full bg-[#e94560]"
                      style={{
                        left: `${20 + i * 8}%`,
                        bottom: '30%',
                      }}
                      animate={{
                        y: [0, -100, -150],
                        opacity: [0.8, 0.4, 0],
                        x: [0, Math.sin(i) * 20, 0],
                      }}
                      transition={{
                        duration: 2 + Math.random(),
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
