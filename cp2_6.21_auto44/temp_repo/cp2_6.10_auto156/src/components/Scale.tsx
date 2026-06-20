import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpiceStore } from '../store/spiceStore';
import { getSpiceById } from '../utils/spiceData';
import PowderPile from './PowderPile';
import { mixColors } from '../utils/colorMixer';

function Scale() {
  const mixture = useSpiceStore(state => state.mixture);
  const isDragging = useSpiceStore(state => state.isDragging);
  const [isHovered, setIsHovered] = useState(false);

  const totalAmount = useMemo(() =>
    mixture.reduce((sum, m) => sum + m.amount, 0),
    [mixture]
  );

  const mixedColor = useMemo(() => {
    if (mixture.length === 0) return '#F5DEB3';

    const colorInputs = mixture
      .map(m => {
        const spice = getSpiceById(m.spiceId);
        return spice ? { color: spice.color, ratio: m.amount } : null;
      })
      .filter(Boolean) as { color: string; ratio: number }[];

    return mixColors(colorInputs);
  }, [mixture]);

  const sortedMixture = useMemo(() =>
    [...mixture].sort((a, b) => b.amount - a.amount),
    [mixture]
  );

  return (
    <motion.div
      className="flex flex-col items-center"
      data-scale="true"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.h2
        className="text-3xl font-bold mb-6 text-center"
        style={{
          color: '#DAA520',
          fontFamily: "'Noto Serif SC', serif",
          textShadow: '2px 2px 8px rgba(0,0,0,0.6)'
        }}
      >
        香 料 称 盘
      </motion.h2>

      <div className="relative">
        <motion.div
          className="relative w-80 h-80 md:w-96 md:h-96 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(145deg, #B8860B, #8B6914)',
            border: '8px solid #DAA520',
            boxShadow: isDragging || isHovered
              ? '0 0 40px rgba(218, 165, 32, 0.6), inset 0 -10px 30px rgba(0,0,0,0.4), inset 0 10px 30px rgba(255,255,255,0.1)'
              : '0 10px 40px rgba(0,0,0,0.5), inset 0 -10px 30px rgba(0,0,0,0.4), inset 0 10px 30px rgba(255,255,255,0.1)',
            transition: 'box-shadow 0.3s ease'
          }}
          animate={isDragging ? { scale: 1.02 } : { scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <div
            className="absolute inset-4 rounded-full"
            style={{
              background: 'linear-gradient(180deg, #5C4033 0%, #3D2914 100%)',
              border: '3px solid #8B4513',
              boxShadow: 'inset 0 5px 20px rgba(0,0,0,0.6)'
            }}
          />

          <div className="absolute inset-8 rounded-full overflow-hidden">
            <PowderPile />
          </div>

          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none"
                style={{
                  background: 'radial-gradient(circle, rgba(218, 165, 32, 0.3) 0%, transparent 70%)',
                  border: '3px dashed #DAA520'
                }}
              >
                <motion.span
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="text-lg font-bold"
                  style={{ color: '#DAA520', fontFamily: "'Noto Serif SC', serif" }}
                >
                  在此处释放香料
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <div
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 w-48 h-6"
          style={{
            background: 'linear-gradient(to bottom, #8B6914, #5C4033)',
            borderRadius: '0 0 50% 50%',
            boxShadow: '0 5px 15px rgba(0,0,0,0.5)'
          }}
        />
      </div>

      <motion.div
        className="mt-16 w-full max-w-md p-6 rounded-xl"
        style={{
          background: 'rgba(42, 11, 11, 0.9)',
          border: '2px solid #DAA520',
          boxShadow: '0 5px 20px rgba(0,0,0,0.3)'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm" style={{ color: '#CD853F', fontFamily: "'Noto Sans SC', sans-serif" }}>
            混合总量
          </span>
          <motion.span
            key={totalAmount}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            className="text-2xl font-bold"
            style={{ color: mixedColor, fontFamily: "'Noto Serif SC', serif" }}
          >
            {totalAmount}%
          </motion.span>
        </div>

        <div className="space-y-3">
          {sortedMixture.length === 0 ? (
            <p className="text-center py-4 text-sm" style={{ color: '#CD853F' }}>
              秤盘空空，等待香料...
            </p>
          ) : (
            sortedMixture.map((m, index) => {
              const spice = getSpiceById(m.spiceId);
              if (!spice) return null;

              return (
                <motion.div
                  key={m.spiceId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: spice.color,
                      boxShadow: `0 0 8px ${spice.color}`
                    }}
                  />
                  <span
                    className="flex-1 text-sm"
                    style={{ color: '#F5DEB3', fontFamily: "'Noto Sans SC', sans-serif" }}
                  >
                    {spice.nameCN}
                  </span>
                  <motion.span
                    key={m.amount}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-sm font-bold"
                    style={{ color: '#DAA520', fontFamily: "'Noto Serif SC', serif", minWidth: '40px', textAlign: 'right' }}
                  >
                    {m.amount}%
                  </motion.span>
                </motion.div>
              );
            })
          )}
        </div>

        {sortedMixture.length > 0 && (
          <div className="mt-4 pt-4 border-t border-amber-900">
            <div className="h-3 rounded-full overflow-hidden flex">
              {sortedMixture.map(m => {
                const spice = getSpiceById(m.spiceId);
                return (
                  <motion.div
                    key={m.spiceId}
                    initial={{ width: 0 }}
                    animate={{ width: `${m.amount}%` }}
                    transition={{ duration: 0.5 }}
                    style={{ backgroundColor: spice?.color || '#8B4513' }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default Scale;
