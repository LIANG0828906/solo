import { motion } from 'framer-motion';
import { RotateCcw, Gauge, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/store/gameStore';

const panelVariants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 20,
    },
  },
};

const moonPhases = [
  { name: '新月', emoji: '🌑' },
  { name: '蛾眉月', emoji: '🌒' },
  { name: '上弦月', emoji: '🌓' },
  { name: '盈凸月', emoji: '🌔' },
  { name: '满月', emoji: '🌕' },
];

const speedOptions = [
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 4, label: '4x' },
];

export default function Controls() {
  const { speedMultiplier, setSpeed, resetGears, currentPhase, gears, isSpinning } = useGameStore();

  const handleSpeedToggle = () => {
    const currentIndex = speedOptions.findIndex(s => s.value === speedMultiplier);
    const nextIndex = (currentIndex + 1) % speedOptions.length;
    setSpeed(speedOptions[nextIndex].value);
  };

  const handleReset = () => {
    resetGears();
  };

  const progress = Math.min((currentPhase / moonPhases.length) * 100, 100);
  const currentMoonPhase = moonPhases[Math.min(currentPhase, moonPhases.length - 1)];

  const embeddedCount = gears.filter(g => g.hasJade).length;
  const totalGears = gears.length;

  return (
    <motion.div
      className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-4 rounded-2xl border border-[#ffd700]/30 bg-[#1a1f3a]/70 px-6 py-3 backdrop-blur-xl shadow-2xl"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleReset}
        className="group flex items-center gap-2 rounded-xl border border-[#ffd700]/30 bg-[#1a1f3a]/50 px-4 py-2 transition-all hover:bg-[#ffd700]/10"
      >
        <motion.div
          animate={isSpinning ? { rotate: 360 } : {}}
          transition={{ duration: 1, repeat: isSpinning ? Infinity : 0, ease: 'linear' }}
        >
          <RotateCcw className="h-4 w-4 text-[#ffd700]" />
        </motion.div>
        <span className="text-sm font-medium text-[#ffd700]">重置</span>
      </motion.button>

      <div className="h-8 w-px bg-[#ffd700]/20" />

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleSpeedToggle}
        className="group flex items-center gap-2 rounded-xl border border-[#ffd700]/30 bg-[#1a1f3a]/50 px-4 py-2 transition-all hover:bg-[#ffd700]/10"
      >
        <Gauge className="h-4 w-4 text-[#ffd700]" />
        <span className="text-sm font-medium text-[#ffd700]">
          {speedOptions.find(s => s.value === speedMultiplier)?.label}
        </span>
      </motion.button>

      <div className="h-8 w-px bg-[#ffd700]/20" />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-[#c0c0c0]" />
          <span className="text-sm text-[#c0c0c0]">月相进度</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-2 w-32 overflow-hidden rounded-full bg-[#1a1f3a]">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: 'linear-gradient(90deg, #ffd700, #ffed4a)',
              }}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          <motion.div
            key={currentMoonPhase.emoji}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="text-xl"
          >
            {currentMoonPhase.emoji}
          </motion.div>
        </div>
      </div>

      <div className="h-8 w-px bg-[#ffd700]/20" />

      <div className="flex items-center gap-2">
        <span className="text-xs text-[#dcdcdc]/60">齿轮</span>
        <span className={cn(
          'text-sm font-bold',
          embeddedCount === totalGears ? 'text-[#ffd700]' : 'text-[#dcdcdc]'
        )}>
          {embeddedCount}/{totalGears}
        </span>
      </div>
    </motion.div>
  );
}
