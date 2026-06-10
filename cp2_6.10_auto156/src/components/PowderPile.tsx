import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpiceStore } from '../store/spiceStore';
import { getSpiceById } from '../utils/spiceData';
import { mixColors } from '../utils/colorMixer';

function PowderPile() {
  const mixture = useSpiceStore(state => state.mixture);
  const spices = useSpiceStore(state => state.spices);
  const powderLayers = useSpiceStore(state => state.powderLayers);

  const mixedColor = useMemo(() => {
    if (mixture.length === 0) return 'transparent';

    const colorInputs = mixture
      .map(m => {
        const spice = getSpiceById(m.spiceId);
        return spice ? { color: spice.color, ratio: m.amount } : null;
      })
      .filter(Boolean) as { color: string; ratio: number }[];

    return mixColors(colorInputs);
  }, [mixture]);

  const totalAmount = useMemo(() =>
    mixture.reduce((sum, m) => sum + m.amount, 0),
    [mixture]
  );

  const pileHeight = useMemo(() =>
    Math.min(80, totalAmount * 0.8),
    [totalAmount]
  );

  return (
    <div className="relative w-full h-full flex items-end justify-center overflow-hidden">
      <motion.div
        className="relative w-4/5 h-full"
        style={{ aspectRatio: '1' }}
      >
        <AnimatePresence mode="popLayout">
          {powderLayers.map((layer, index) => (
            <motion.div
              key={layer.id}
              initial={{ y: -50, opacity: 0, scale: 0.5 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 20,
                delay: index * 0.05
              }}
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at center bottom, ${layer.color}dd, transparent 70%)`,
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
                filter: 'blur(2px)',
                opacity: Math.min(1, (layer.amount / 100) * 0.9),
                transform: `scaleY(${0.3 + (pileHeight / 100)})`,
                transformOrigin: 'bottom center'
              }}
            />
          ))}
        </AnimatePresence>

        {mixture.length > 0 && (
          <motion.div
            key={mixedColor}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 30% 30%, ${mixedColor}dd, ${mixedColor}99 40%, transparent 70%)`,
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              filter: 'blur(1px)',
              transform: `scaleY(${0.3 + (pileHeight / 100)})`,
              transformOrigin: 'bottom center',
              boxShadow: `inset 0 -10px 30px rgba(0,0,0,0.3), inset 0 5px 15px rgba(255,255,255,0.1)`
            }}
          />
        )}

        {mixture.length > 0 && (
          <div
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 50%)`,
              transform: `scaleY(${0.3 + (pileHeight / 100)})`,
              transformOrigin: 'bottom center',
              pointerEvents: 'none'
            }}
          />
        )}
      </motion.div>
    </div>
  );
}

export default PowderPile;
