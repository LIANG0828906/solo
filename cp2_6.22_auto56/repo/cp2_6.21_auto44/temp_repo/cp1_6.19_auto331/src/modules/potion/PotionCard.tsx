import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { POTION_GRADIENTS, QUALITY_STARS, type Potion, type PotionType } from '../brewing/types';
import { usePotionStore } from './store';
import { useBrewingStore } from '../brewing/store';

interface PotionCardProps {
  potion: Potion;
}

const particleColors: Record<PotionType, string[]> = {
  healing: ['#A8E6CF', '#81C784', '#C8E6C9', '#ffffff'],
  explosion: ['#FF8A80', '#FF5252', '#FFAB91', '#FFD180'],
  invisibility: ['#B39DDB', '#9575CD', '#D1C4E9', '#E1BEE7'],
  unknown: ['#9e9e9e', '#bdbdbd', '#e0e0e0', '#ffffff'],
};

export const PotionCard = ({ potion }: PotionCardProps) => {
  const { removePotion } = usePotionStore();
  const { setActiveEffect } = useBrewingStore();
  const [showParticles, setShowParticles] = useState(false);
  const starCount = QUALITY_STARS[potion.quality];

  const handleUse = () => {
    setShowParticles(true);
    setActiveEffect({ text: `${potion.name} 激活！${potion.effect}`, type: potion.type });
    setTimeout(() => {
      removePotion(potion.id);
      setShowParticles(false);
    }, 1500);
  };

  const colors = particleColors[potion.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, x: 50 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="relative shrink-0"
      style={{ width: 120, height: 160 }}
    >
      <AnimatePresence>
        {showParticles && (
          <motion.div
            className="absolute inset-0 pointer-events-none z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: 6 + Math.random() * 8,
                  height: 6 + Math.random() * 8,
                  background: colors[i % colors.length],
                  left: '50%',
                  top: '50%',
                  boxShadow: `0 0 8px ${colors[i % colors.length]}`,
                }}
                initial={{
                  x: 0,
                  y: 0,
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: (Math.random() - 0.5) * 150,
                  y: (Math.random() - 0.5) * 150 - 50,
                  scale: 1,
                  opacity: 0,
                }}
                transition={{
                  duration: 1.2 + Math.random() * 0.3,
                  delay: Math.random() * 0.2,
                  ease: 'easeOut',
                }}
              />
            ))}
            <motion.div
              className="absolute inset-0 rounded-xl"
              style={{
                background: `radial-gradient(circle, ${colors[0]}66 0%, transparent 70%)`,
              }}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2] }}
              transition={{ duration: 1 }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ y: -3, scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.2 }}
        className="w-full h-full rounded-xl p-3 flex flex-col items-center justify-between shadow-xl border border-white/20 cursor-default overflow-hidden"
        style={{
          background: POTION_GRADIENTS[potion.type],
          boxShadow: `0 4px 20px ${potion.type === 'healing' ? 'rgba(168,230,207,0.4)' : potion.type === 'explosion' ? 'rgba(255,138,128,0.4)' : potion.type === 'invisibility' ? 'rgba(179,157,219,0.4)' : 'rgba(158,158,158,0.4)'}`,
        }}
      >
        <div className="w-full flex justify-center">
          {[...Array(3)].map((_, i) => (
            <motion.span
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: i < starCount ? 1 : 0 }}
              transition={{ delay: i * 0.1, type: 'spring' }}
              className="text-sm"
              style={{
                filter: i < starCount ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' : 'none',
                color: i < starCount && potion.quality === 'perfect' ? '#FFD700' : i < starCount && potion.quality === 'good' ? '#FFA500' : '#ccc',
              }}
            >
              ★
            </motion.span>
          ))}
        </div>

        <motion.div
          animate={showParticles ? { scale: [1, 1.3, 0], rotate: [0, 15, -15, 0] } : {}}
          transition={{ duration: 1 }}
          className="text-5xl"
          style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))' }}
        >
          {potion.icon}
        </motion.div>

        <div className="w-full text-center">
          <div
            className="text-sm font-bold truncate mb-1"
            style={{ color: '#1a1a2e' }}
          >
            {potion.name}
          </div>
          <div
            className="text-[10px] mb-2 font-medium"
            style={{ color: '#4a4a6a' }}
          >
            威力: {potion.power}
          </div>
          <motion.button
            onClick={handleUse}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            disabled={showParticles}
            className="w-full py-1.5 rounded-lg text-white text-xs font-bold transition-all disabled:opacity-50"
            style={{
              background:
                potion.type === 'healing'
                  ? 'linear-gradient(135deg, #4CAF50, #388E3C)'
                  : potion.type === 'explosion'
                  ? 'linear-gradient(135deg, #f44336, #D32F2F)'
                  : potion.type === 'invisibility'
                  ? 'linear-gradient(135deg, #7E57C2, #5E35B1)'
                  : 'linear-gradient(135deg, #757575, #424242)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            ⚡ 使用
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};
