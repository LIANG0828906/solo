import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import { Era, ERA_LABELS, ERA_COLORS } from '../types';
import { X, BookOpen, Clock } from 'lucide-react';

export default function Collection() {
  const { showCollection, toggleCollection, clothPieces, collection } = useGameStore((state) => ({
    showCollection: state.showCollection,
    toggleCollection: state.toggleCollection,
    clothPieces: state.clothPieces,
    collection: state.collection
  }));

  const [selectedEra, setSelectedEra] = useState<Era | 'all'>('all');
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);

  if (!showCollection) return null;

  const eras: Array<Era | 'all'> = ['all', 'ancient', 'medieval', 'renaissance', 'industrial', 'modern', 'future'];

  const collectedIds = Object.values(collection).flat();
  const collectedPieces = clothPieces.filter(p => collectedIds.includes(p.id));
  
  const filteredPieces = selectedEra === 'all'
    ? collectedPieces
    : collectedPieces.filter(p => p.era === selectedEra);

  const totalCollected = collectedPieces.length;
  const totalPossible = 18;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={toggleCollection}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-gradient-to-b from-[#4a3b2c] to-[#2c1810] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border-2 border-[#b87333]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-[#b87333]/30">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#f5e6b8] flex items-center gap-3">
              <BookOpen size={28} />
              时光图鉴
            </h2>
            <p className="text-[#b87333] text-sm mt-1">
              已收集 {totalCollected}/{totalPossible} 片布片
            </p>
          </div>
          <button
            onClick={toggleCollection}
            className="w-10 h-10 rounded-full bg-[#b87333]/20 hover:bg-[#b87333]/40 flex items-center justify-center transition-colors"
          >
            <X size={20} className="text-[#f5e6b8]" />
          </button>
        </div>

        <div className="flex gap-2 p-4 border-b border-[#b87333]/30 overflow-x-auto scrollbar-thin">
          {eras.map((era) => (
            <motion.button
              key={era}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedEra(era)}
              className={`
                px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium
                transition-all duration-300 flex items-center gap-2
                ${selectedEra === era
                  ? 'bg-[#f5e6b8] text-[#2c1810]'
                  : 'bg-[#2c1810] text-[#b87333] hover:text-[#f5e6b8] border border-[#b87333]/30'
                }
              `}
            >
              {era === 'all' ? (
                <>全部</>
              ) : (
                <>
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: ERA_COLORS[era] }}
                  />
                  {ERA_LABELS[era]}
                  <span className="text-xs opacity-70">
                    ({collection[era].length})
                  </span>
                </>
              )}
            </motion.button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {filteredPieces.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#b87333]">
              <Clock size={48} className="mb-4 opacity-50" />
              <p className="text-lg">这个时代还没有收集到布片</p>
              <p className="text-sm mt-2 opacity-70">继续游戏来解锁更多布片吧</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredPieces.map((piece, index) => (
                <motion.div
                  key={piece.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05, y: -4 }}
                  onClick={() => setSelectedPiece(selectedPiece === piece.id ? null : piece.id)}
                  className={`
                    relative rounded-xl overflow-hidden cursor-pointer
                    transition-all duration-300 border-2
                    ${selectedPiece === piece.id
                      ? 'border-[#f5e6b8] glow-gold'
                      : 'border-[#b87333]/50 hover:border-[#b87333]'
                    }
                  `}
                  style={{
                    background: `linear-gradient(145deg, ${piece.color}dd 0%, ${piece.color}88 100%)`
                  }}
                >
                  <div className="aspect-[3/4] p-4 flex flex-col justify-between">
                    <div>
                      <div className="text-xs px-2 py-0.5 rounded bg-black/30 inline-block mb-2">
                        {piece.eraLabel}
                      </div>
                      <h3 className="font-bold text-white text-sm">{piece.title}</h3>
                    </div>
                    <div className="text-[10px] text-white/70">
                      图案: {piece.pattern}
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedPiece === piece.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/90 p-4 flex flex-col"
                      >
                        <h4 className="font-bold text-[#f5e6b8] mb-2">{piece.title}</h4>
                        <p className="text-xs text-white/90 leading-relaxed flex-1 overflow-auto scrollbar-thin">
                          {piece.story}
                        </p>
                        <div className="mt-3 text-[10px] text-[#b87333] flex justify-between">
                          <span>{piece.eraLabel}</span>
                          <span>{piece.pattern}</span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#b87333]/30">
          <div className="flex items-center justify-center gap-2">
            {eras.filter(e => e !== 'all').map((era) => (
              <div key={era} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: ERA_COLORS[era as Era] }}
                />
                <span className="text-[10px] text-[#b87333]">
                  {collection[era as Era].length}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
