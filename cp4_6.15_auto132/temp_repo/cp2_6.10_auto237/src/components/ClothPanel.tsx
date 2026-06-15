import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ClothCard from './ClothCard';
import { useGameStore, useInventoryPieces, useSewnPieces } from '../store/gameStore';
import { ClothPiece } from '../types';
import { Thread, Sparkles, X } from 'lucide-react';
import { TOTAL_PIECES_TO_WIN } from '../data/storyData';

export default function ClothPanel() {
  const inventoryPieces = useInventoryPieces();
  const sewnPieces = useSewnPieces();
  const {
    selectedCloth,
    selectCloth,
    attemptSew,
    generateClothPiece,
    addParticles,
    isComplete
  } = useGameStore((state) => ({
    selectedCloth: state.selectedCloth,
    selectCloth: state.selectCloth,
    attemptSew: state.attemptSew,
    generateClothPiece: state.generateClothPiece,
    addParticles: state.addParticles,
    isComplete: state.isComplete
  }));

  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, piece: ClothPiece) => {
    e.dataTransfer.setData('clothId', piece.id);
    selectCloth(piece);
  }, [selectCloth]);

  const handleDragOver = useCallback((e: React.DragEvent, slotIndex: number) => {
    e.preventDefault();
    setDragOverSlot(slotIndex);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverSlot(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetOrder: number) => {
    e.preventDefault();
    setDragOverSlot(null);

    const clothId = e.dataTransfer.getData('clothId');
    if (!clothId) return;

    const success = attemptSew(clothId, targetOrder);
    
    if (success) {
      const rect = e.currentTarget.getBoundingClientRect();
      addParticles(rect.left + rect.width / 2, rect.top + rect.height / 2);
    }
    
    selectCloth(null);
  }, [attemptSew, addParticles, selectCloth]);

  const handleCardClick = useCallback((piece: ClothPiece) => {
    if (selectedCloth?.id === piece.id) {
      selectCloth(null);
    } else {
      selectCloth(piece);
    }
  }, [selectedCloth, selectCloth]);

  const nextSlot = sewnPieces.length;
  const progress = (sewnPieces.length / TOTAL_PIECES_TO_WIN) * 100;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        <div className="w-[280px] lg:w-[280px] md:w-[240px] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#f5e6b8] flex items-center gap-2">
              <Thread size={18} />
              布片库存
            </h2>
            <span className="text-xs text-[#b87333]">
              {inventoryPieces.length}/8
            </span>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin pr-2 space-y-3">
            <AnimatePresence>
              {inventoryPieces.map((piece, index) => (
                <motion.div
                  key={piece.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <ClothCard
                    piece={piece}
                    isSelected={selectedCloth?.id === piece.id}
                    onClick={() => handleCardClick(piece)}
                    onDragStart={(e) => handleDragStart(e, piece)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            {inventoryPieces.length === 0 && (
              <div className="text-center text-[#b87333] text-sm py-8">
                库存空空如也
              </div>
            )}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateClothPiece}
            disabled={inventoryPieces.length >= 8}
            className={`
              w-full py-3 rounded-lg font-bold text-sm
              flex items-center justify-center gap-2
              transition-all duration-300
              ${inventoryPieces.length >= 8
                ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                : 'bg-gradient-to-r from-[#b87333] to-[#CD853F] text-white hover:shadow-lg hover:shadow-[#b87333]/30'
              }
            `}
          >
            <Sparkles size={16} />
            收集命运丝线
          </motion.button>
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-[#f5e6b8]">
              时光织布
            </h2>
            <div className="flex items-center gap-3">
              <div className="text-sm text-[#b87333]">
                进度: {sewnPieces.length}/{TOTAL_PIECES_TO_WIN}
              </div>
              <div className="w-32 h-2 bg-[#4a3b2c] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#b87333] to-[#f5e6b8]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 bg-[#2c1810]/50 rounded-xl border border-[#b87333]/30 p-4 overflow-y-auto scrollbar-thin">
            <div className="grid grid-cols-6 gap-3">
              {Array.from({ length: TOTAL_PIECES_TO_WIN }).map((_, index) => {
                const sewnPiece = sewnPieces[index];
                const isNextSlot = index === nextSlot;
                const isDragOver = dragOverSlot === index;

                return (
                  <motion.div
                    key={index}
                    className={`
                      relative aspect-[3/4] rounded-lg border-2 border-dashed
                      transition-all duration-300
                      ${sewnPiece ? 'border-solid border-[#f5e6b8]/50' : ''}
                      ${isNextSlot && !sewnPiece ? 'border-[#f5e6b8] animate-pulse-glow' : ''}
                      ${isDragOver ? 'border-[#f5e6b8] bg-[#f5e6b8]/20 scale-105' : ''}
                      ${!sewnPiece && !isNextSlot ? 'border-[#b87333]/30' : ''}
                    `}
                    style={sewnPiece ? {
                      background: `linear-gradient(145deg, ${sewnPiece.color}dd 0%, ${sewnPiece.color}88 100%)`
                    } : {}}
                    onDragOver={(e) => !sewnPiece && handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => !sewnPiece && handleDrop(e, index)}
                    whileHover={sewnPiece ? { scale: 1.05 } : {}}
                    onClick={() => sewnPiece && handleCardClick(sewnPiece)}
                  >
                    {sewnPiece ? (
                      <div className="absolute inset-0 p-1 flex flex-col justify-between">
                        <div className="text-[10px] font-bold text-white truncate">
                          {sewnPiece.title}
                        </div>
                        <div className="text-[8px] text-white/70 text-right">
                          #{index + 1}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[#b87333]/50 text-xs">
                        {index + 1}
                      </div>
                    )}

                    {isNextSlot && !sewnPiece && (
                      <motion.div
                        className="absolute inset-0 rounded-lg"
                        animate={{
                          boxShadow: [
                            '0 0 0 rgba(245, 230, 184, 0)',
                            '0 0 20px rgba(245, 230, 184, 0.5)',
                            '0 0 0 rgba(245, 230, 184, 0)'
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
              <defs>
                <pattern id="stitch-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="10" y2="10" stroke="#b87333" strokeWidth="0.5" strokeDasharray="2,2" />
                </pattern>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedCloth && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center"
            onClick={() => selectCloth(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => selectCloth(null)}
                className="absolute -top-4 -right-4 w-8 h-8 bg-[#b87333] rounded-full flex items-center justify-center z-10 hover:bg-[#f5e6b8] transition-colors"
              >
                <X size={16} className="text-white" />
              </button>
              <ClothCard
                piece={selectedCloth}
                size="large"
                showStory
                isSelected
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center p-8 bg-gradient-to-b from-[#4a3b2c] to-[#2c1810] rounded-2xl border-2 border-[#f5e6b8] glow-gold"
            >
              <h2 className="font-display text-4xl font-bold text-[#f5e6b8] mb-4">
                ✨ 时光织锦完成 ✨
              </h2>
              <p className="text-[#b87333] mb-6">
                您已成功编织出一段完整的人生轨迹
              </p>
              <div className="flex gap-4 justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => useGameStore.getState().resetGame()}
                  className="px-6 py-3 bg-[#b87333] text-white rounded-lg font-bold"
                >
                  开始新的织布
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
