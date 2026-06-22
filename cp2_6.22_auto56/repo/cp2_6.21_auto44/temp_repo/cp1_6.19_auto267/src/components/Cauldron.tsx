import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Material } from '../types';
import { MATERIAL_INFO } from '../data/recipes';

interface CauldronProps {
  materials: Material[];
  isDragOver: boolean;
  onDrop: (material: Material) => void;
  onMaterialClick: (index: number) => void;
  isSynthesizing: boolean;
}

export const Cauldron: React.FC<CauldronProps> = ({
  materials,
  isDragOver,
  onDrop,
  onMaterialClick,
  isSynthesizing,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const material = e.dataTransfer.getData('material') as Material;
    if (material) {
      onDrop(material);
    }
  };

  const particles = Array.from({ length: 8 }, (_, i) => i);

  return (
    <div className="relative flex flex-col items-center">
      <div
        className="relative"
        style={{ width: 160, height: 160 }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* 发光粒子效果 */}
        <AnimatePresence>
          {particles.map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 6,
                height: 6,
                background: isDragActive || isDragOver ? '#FFD700' : '#3A7CA5',
                boxShadow: `0 0 10px ${isDragActive || isDragOver ? '#FFD700' : '#3A7CA5'}`,
                left: '50%',
                top: '50%',
              }}
              animate={{
                x: [
                  0,
                  Math.cos((i * Math.PI * 2) / 8) * 85,
                  0,
                ],
                y: [
                  0,
                  Math.sin((i * Math.PI * 2) / 8) * 85,
                  0,
                ],
                opacity: [0.2, 0.8, 0.2],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.3,
                ease: 'easeInOut',
              }}
            />
          ))}
        </AnimatePresence>

        {/* 坩埚主体 */}
        <motion.div
          className="absolute inset-0 rounded-full flex items-center justify-center"
          animate={{
            borderColor:
              isDragActive || isDragOver ? '#FFD700' : '#3A7CA5',
            boxShadow:
              isDragActive || isDragOver
                ? '0 0 30px #FFD70060, inset 0 0 30px #FFD70020'
                : '0 0 20px #3A7CA540, inset 0 0 20px #3A7CA520',
          }}
          transition={{ duration: 0.3 }}
          style={{
            border: '3px solid #3A7CA5',
            background:
              'radial-gradient(circle at 50% 60%, rgba(58, 124, 165, 0.3) 0%, rgba(26, 26, 46, 0.9) 70%)',
          }}
        >
          {/* 坩埚内的材料 */}
          <div className="relative w-full h-full flex items-center justify-center">
            {materials.map((mat, index) => {
              const info = MATERIAL_INFO[mat];
              const angle =
                (index / Math.max(materials.length, 1)) * Math.PI * 2 -
                Math.PI / 2;
              const radius = materials.length > 1 ? 35 : 0;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;

              return (
                <motion.div
                  key={index}
                  className="absolute cursor-pointer"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    x,
                    y,
                    scale: 1,
                    opacity: 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 300,
                    damping: 20,
                  }}
                  onClick={() => onMaterialClick(index)}
                  whileHover={{ scale: 1.2 }}
                  title="点击移除"
                >
                  <div
                    className="rounded-full border border-white/40 shadow-md"
                    style={{
                      width: 36,
                      height: 36,
                      background: info.gradient,
                      boxShadow: `0 0 10px ${info.color}60`,
                    }}
                  />
                </motion.div>
              );
            })}

            {materials.length === 0 && (
              <span className="text-white/40 text-sm text-center">
                拖拽材料
                <br />
                到这里
              </span>
            )}
          </div>

          {/* 合成时的漩涡效果 */}
          <AnimatePresence>
            {isSynthesizing && (
              <motion.div
                className="absolute inset-4 rounded-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'conic-gradient(from 0deg, transparent, rgba(255, 215, 0, 0.5), transparent)',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};
