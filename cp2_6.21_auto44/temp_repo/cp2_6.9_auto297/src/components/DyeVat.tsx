import { motion } from 'framer-motion';
import { DyeRecipe, DYE_COLORS } from '../utils/types';

interface DyeVatProps {
  recipe: DyeRecipe | null;
  isDyeing: boolean;
  fabricPosition: 'above' | 'inside' | 'below';
}

export function DyeVat({ recipe, isDyeing, fabricPosition }: DyeVatProps) {
  const getLiquidColor = () => {
    if (!recipe) return '#6b8e6b';
    const primary = DYE_COLORS[recipe.primary];
    if (!recipe.secondary) {
      return `rgb(${primary.r}, ${primary.g}, ${primary.b})`;
    }
    const secondary = DYE_COLORS[recipe.secondary];
    const ratio = recipe.mixRatio ?? 0.6;
    const r = Math.round(primary.r * ratio + secondary.r * (1 - ratio));
    const g = Math.round(primary.g * ratio + secondary.g * (1 - ratio));
    const b = Math.round(primary.b * ratio + secondary.b * (1 - ratio));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const liquidColor = getLiquidColor();

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        className="relative"
        style={{
          width: 300,
          height: 250,
        }}
      >
        <div
          className="absolute inset-0 rounded-t-3xl"
          style={{
            background: 'linear-gradient(135deg, #a67c52 0%, #8b6914 50%, #6b4423 100%)',
            boxShadow: 'inset -8px -8px 16px rgba(0,0,0,0.4), inset 8px 8px 16px rgba(255,255,255,0.1)',
          }}
        />
        
        <div
          className="absolute top-4 left-4 right-4 bottom-0"
          style={{
            background: 'linear-gradient(180deg, #5d4037 0%, #3e2723 100%)',
            borderRadius: '28px 28px 50% 50%',
          }}
        >
          <motion.div
            className="vat-liquid"
            animate={isDyeing ? { y: [0, -5, 0] } : {}}
            transition={isDyeing ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
            style={{
              height: '85%',
              background: `linear-gradient(180deg, ${liquidColor}dd 0%, ${liquidColor} 100%)`,
              boxShadow: `inset 0 -20px 40px rgba(0,0,0,0.3)`,
            }}
          >
            {isDyeing && (
              <motion.div
                className="absolute inset-0"
                animate={{
                  background: [
                    `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`,
                    `linear-gradient(90deg, transparent 30%, rgba(255,255,255,0.3) 80%, transparent 100%)`,
                    `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)`,
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </motion.div>
        </div>

        <div
          className="absolute top-0 left-0 right-0 h-8"
          style={{
            background: 'linear-gradient(180deg, #8b6914 0%, #6b4423 100%)',
            borderRadius: '24px 24px 0 0',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
          }}
        />

        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-48 h-48 bg-white rounded-sm"
          initial={{ y: -180 }}
          animate={{
            y: fabricPosition === 'above' ? -180 : fabricPosition === 'inside' ? 20 : -80,
            opacity: fabricPosition === 'inside' ? 0.7 : 1,
          }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          style={{
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            border: '2px solid #d7ccc8',
          }}
        />
      </motion.div>

      <div className="mt-4 text-lg text-[#3e2723]">
        {isDyeing ? '染色中...' : '陶制染缸'}
      </div>
    </div>
  );
}
