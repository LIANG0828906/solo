import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../store';
import { MaterialFlask } from './MaterialFlask';
import { Cauldron } from './Cauldron';
import { ControlPanel } from './ControlPanel';
import { Material } from '../types';
import { MATERIAL_INFO } from '../data/recipes';
import { BookOpen } from 'lucide-react';

export const Workbench: React.FC = () => {
  const {
    materials,
    cauldronMaterials,
    temperature,
    stirSpeed,
    successChance,
    isSynthesizing,
    addMaterialToCauldron,
    removeMaterialFromCauldron,
    setTemperature,
    setStirSpeed,
    startSynthesis,
    toggleRecipeBook,
    unlockedRecipes,
    successfulSynthesisCount,
  } = useGameStore();

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragStart = (e: React.DragEvent, material: Material) => {
    e.dataTransfer.setData('material', material);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (material: Material) => {
    addMaterialToCauldron(material);
    setIsDragOver(false);
  };

  const handleMaterialClick = (material: Material) => {
    if (materials[material] > 0) {
      addMaterialToCauldron(material);
    }
  };

  const canSynthesize = cauldronMaterials.length >= 2 && !isSynthesizing;

  const materialList = Object.values(Material);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* 背景 */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, #1A1A2E 0%, #16213E 50%, #0F0F1A 100%)',
        }}
      />

      {/* 背景装饰粒子 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 30 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 2 + Math.random() * 4,
              height: 2 + Math.random() * 4,
              background: 'rgba(255, 215, 0, 0.3)',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 4 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 4,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* 主内容 */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* 顶部状态栏 */}
        <div className="p-4 flex justify-center">
          <div
            className="flex items-center gap-6 px-6 py-3 rounded-full"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="text-blue-400">🌡️</span>
              <span className="text-white/80 text-sm">{temperature}°C</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-400">🌀</span>
              <span className="text-white/80 text-sm">{stirSpeed}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-amber-400">🎯</span>
              <span
                className={`text-sm font-medium ${
                  successChance >= 60
                    ? 'text-green-400'
                    : successChance >= 30
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {successChance}%
              </span>
            </div>
            <div className="w-px h-5 bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="text-white/60 text-sm">材料:</span>
              <span className="text-white/80 text-sm">
                {cauldronMaterials.length}/5
              </span>
            </div>
            <div className="w-px h-5 bg-white/20" />
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-sm">🏆</span>
              <span className="text-white/80 text-sm">
                {unlockedRecipes.length}/12 配方
              </span>
            </div>
          </div>
        </div>

        {/* 工作台主体 */}
        <div className="flex-1 flex flex-col lg:flex-row items-start justify-center gap-6 p-4 lg:p-8">
          {/* 材料栏 - 左侧/顶部 */}
          <motion.div
            className="w-full lg:w-56 flex-shrink-0 order-2 lg:order-1"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <h3 className="text-white/90 font-bold mb-4 text-center text-sm tracking-wider">
                ✨ 材料库存
              </h3>
              <div className="grid grid-cols-5 lg:grid-cols-2 gap-4 justify-items-center">
                {materialList.map((material) => (
                  <div
                    key={material}
                    draggable={materials[material] > 0 && !isSynthesizing}
                    onDragStart={(e) => handleDragStart(e, material)}
                    onClick={() => handleMaterialClick(material)}
                    className="cursor-pointer"
                  >
                    <MaterialFlask
                      material={material}
                      count={materials[material]}
                      size={48}
                      draggable={false}
                    />
                  </div>
                ))}
              </div>
              <p className="text-white/40 text-xs text-center mt-4">
                点击或拖拽到反应区
              </p>
            </div>

            {/* 成功计数 */}
            <div
              className="mt-4 rounded-xl p-4 text-center"
              style={{
                background: 'rgba(255, 215, 0, 0.08)',
                border: '1px solid rgba(255, 215, 0, 0.2)',
              }}
            >
              <p className="text-amber-400/80 text-xs mb-1">成功合成次数</p>
              <p className="text-amber-400 text-2xl font-bold">
                {successfulSynthesisCount}
              </p>
              <p className="text-amber-400/50 text-xs mt-1">
                每 3 次解锁新配方
              </p>
              <div className="mt-2 w-full h-1.5 bg-amber-900/30 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300"
                  style={{
                    width: `${(successfulSynthesisCount % 3) * (100 / 3)}%`,
                  }}
                />
              </div>
            </div>
          </motion.div>

          {/* 中央反应区 */}
          <motion.div
            className="flex-1 flex flex-col items-center order-1 lg:order-2 w-full lg:w-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-white/90 font-bold mb-6 text-lg tracking-wider">
              ⚗️ 炼金坩埚
            </h2>

            <Cauldron
              materials={cauldronMaterials}
              isDragOver={isDragOver}
              onDrop={handleDrop}
              onMaterialClick={removeMaterialFromCauldron}
              isSynthesizing={isSynthesizing}
            />

            {/* 控制区 */}
            <div className="w-full max-w-md mt-8">
              <ControlPanel
                temperature={temperature}
                stirSpeed={stirSpeed}
                successChance={successChance}
                onTemperatureChange={setTemperature}
                onStirSpeedChange={setStirSpeed}
                onSynthesize={startSynthesis}
                canSynthesize={canSynthesize}
                isSynthesizing={isSynthesizing}
              />
            </div>
          </motion.div>
        </div>

        {/* 右下角魔法书图标 */}
        <motion.button
          className="fixed bottom-6 right-6 z-40"
          whileHover={{ scale: 1.1, rotate: -5 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleRecipeBook}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 300 }}
        >
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #8D6E63 0%, #5D4037 100%)',
              boxShadow: '0 4px 20px rgba(93, 64, 55, 0.5)',
              border: '2px solid #FFD700',
            }}
          >
            <BookOpen className="text-amber-200" size={28} />
          </div>
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-amber-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
            {unlockedRecipes.length}
          </span>
        </motion.button>

        {/* 当前配方提示 */}
        {cauldronMaterials.length >= 2 && successChance > 0 && (
          <motion.div
            className="fixed bottom-6 left-6 z-40"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div
              className="px-4 py-3 rounded-xl max-w-xs"
              style={{
                background: 'rgba(255, 215, 0, 0.1)',
                border: '1px solid rgba(255, 215, 0, 0.3)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <p className="text-amber-400/80 text-xs">当前配方</p>
              <p className="text-white text-sm font-medium">
                {cauldronMaterials.map((m) => MATERIAL_INFO[m].name).join(' + ')}
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};
