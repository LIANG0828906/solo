import { motion } from 'framer-motion';
import { Gem, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/store/gameStore';
import { lightJadeConfig } from '@/data';
import type { LightJadeType } from '@/types';

const jadeTypes: LightJadeType[] = ['newMoon', 'crescent', 'firstQuarter', 'gibbous', 'fullMoon'];

const panelVariants = {
  hidden: { opacity: 0, x: -50, y: 50 },
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: {
      delay: i * 0.1,
      type: 'spring',
      stiffness: 200,
      damping: 15,
    },
  }),
};

export default function GearPanel() {
  const { collectedCount, selectedJade, setSelectedJade, gears } = useGameStore();

  const handleJadeClick = (type: LightJadeType) => {
    if (collectedCount[type] <= 0) return;
    if (selectedJade === type) {
      setSelectedJade(null);
    } else {
      setSelectedJade(type);
    }
  };

  const availableGearSlot = gears.find(g => !g.hasJade);

  return (
    <motion.div
      className="absolute bottom-6 left-6 w-80 rounded-2xl border border-[#ffd700]/30 bg-[#1a1f3a]/70 p-4 backdrop-blur-xl shadow-2xl"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mb-4 flex items-center gap-2">
        <Gem className="h-5 w-5 text-[#ffd700]" />
        <h3 className="text-lg font-bold text-[#ffd700] tracking-wider">光玉背包</h3>
      </div>

      {selectedJade && availableGearSlot && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 rounded-lg bg-[#ffd700]/20 px-3 py-2 text-sm text-[#ffd700]"
        >
          已选择「{lightJadeConfig[selectedJade].name}」，点击齿轮插槽嵌入
        </motion.div>
      )}

      <div className="grid grid-cols-5 gap-2">
        {jadeTypes.map((type, index) => {
          const config = lightJadeConfig[type];
          const count = collectedCount[type];
          const isSelected = selectedJade === type;
          const isAvailable = count > 0;

          return (
            <motion.button
              key={type}
              custom={index}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              whileHover={isAvailable ? { scale: 1.1 } : {}}
              whileTap={isAvailable ? { scale: 0.95 } : {}}
              onClick={() => handleJadeClick(type)}
              className={cn(
                'group relative flex flex-col items-center gap-1 rounded-xl p-2 transition-all duration-200',
                isAvailable
                  ? 'cursor-pointer hover:bg-[#ffd700]/10'
                  : 'cursor-not-allowed opacity-40',
                isSelected && 'bg-[#ffd700]/20 ring-2 ring-[#ffd700]'
              )}
              disabled={!isAvailable}
            >
              <motion.div
                className="relative h-10 w-10"
                animate={isSelected ? { rotate: 360 } : {}}
                transition={{ duration: 2, repeat: isSelected ? Infinity : 0, ease: 'linear' }}
              >
                <div
                  className="absolute inset-0 rounded-full blur-md opacity-60"
                  style={{ backgroundColor: config.color }}
                />
                <div
                  className="absolute inset-1 rounded-full"
                  style={{
                    background: `radial-gradient(circle at 30% 30%, ${config.color}, #1a1f3a 120%)`,
                    boxShadow: `0 0 12px ${config.color}/60, inset 0 0 8px rgba(255,255,255,0.3)`,
                  }}
                />
                {count > 0 && (
                  <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#ffd700] text-xs font-bold text-[#1a1f3a]">
                    {count}
                  </div>
                )}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-2 -bottom-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-500"
                  >
                    <Check className="h-3 w-3 text-white" />
                  </motion.div>
                )}
              </motion.div>

              <span className="text-xs text-[#dcdcdc]/80 truncate w-full text-center">
                {config.name.slice(0, 2)}
              </span>

              {isAvailable && (
                <motion.div
                  className="absolute inset-0 rounded-xl border border-[#ffd700]/40 opacity-0 group-hover:opacity-100"
                  initial={false}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      <div className="mt-4 text-center text-xs text-[#dcdcdc]/50">
        点击光玉选中，再点击齿轮插槽嵌入
      </div>
    </motion.div>
  );
}
