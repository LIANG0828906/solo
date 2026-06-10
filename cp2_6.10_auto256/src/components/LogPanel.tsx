import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGameStore } from '@/store/gameStore';
import type { Narrative } from '@/types';

const panelVariants = {
  hidden: { opacity: 0, x: 50, y: 50 },
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

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  }),
};

interface NarrativeCardProps {
  narrative: Narrative;
  index: number;
}

function NarrativeCard({ narrative, index }: NarrativeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!narrative.unlocked) {
    return (
      <motion.div
        custom={index}
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="relative rounded-xl border border-[#c0c0c0]/20 bg-[#1a1f3a]/50 p-4"
      >
        <div className="absolute inset-0 overflow-hidden rounded-xl">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(192,192,192,0.1) 2px, rgba(192,192,192,0.1) 4px)',
            }}
          />
        </div>
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#c0c0c0]/10">
            <Lock className="h-5 w-5 text-[#c0c0c0]/40" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-[#c0c0c0]/40">???</h4>
            <p className="text-xs text-[#c0c0c0]/30">修复月相计时器解锁</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02 }}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-[#ffd700]/30 bg-gradient-to-br from-[#1a1f3a]/80 to-[#1a1f3a]/40"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,215,0,0.1) 2px, rgba(255,215,0,0.1) 4px)',
          }}
          animate={{
            backgroundPosition: ['0px 0px', '0px 8px'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        <div
          className="absolute left-0 top-0 h-full w-1"
          style={{
            background: 'linear-gradient(180deg, #ffd700, #ffd700/20)',
          }}
        />
        <motion.div
          className="absolute -right-20 -top-20 h-40 w-40 rounded-full opacity-0 group-hover:opacity-30 transition-opacity"
          style={{ background: 'radial-gradient(circle, #ffd700, transparent 70%)' }}
        />
      </div>

      <div className="relative p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ffd700]/20">
              <BookOpen className="h-5 w-5 text-[#ffd700]" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#ffd700] tracking-wide">
                {narrative.title}
              </h4>
              <p className="text-xs text-[#dcdcdc]/60">
                月相阶段 {narrative.moonPhase + 1}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-5 w-5 text-[#ffd700]/60" />
          </motion.div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <motion.div
                initial={{ y: -10 }}
                animate={{ y: 0 }}
                className="mt-3 pt-3 border-t border-[#ffd700]/20"
              >
                <p className="text-sm leading-relaxed text-[#dcdcdc]/90">
                  {narrative.content}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 flex items-center gap-1 text-xs text-[#ffd700]/60"
          >
            <span>点击展开</span>
            <ChevronDown className="h-3 w-3" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export default function LogPanel() {
  const { narratives } = useGameStore();
  const unlockedCount = narratives.filter(n => n.unlocked).length;

  return (
    <motion.div
      className="absolute bottom-6 right-6 w-80 rounded-2xl border border-[#c0c0c0]/30 bg-[#1a1f3a]/70 p-4 backdrop-blur-xl shadow-2xl"
      variants={panelVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#c0c0c0]" />
          <h3 className="text-lg font-bold text-[#c0c0c0] tracking-wider">叙事日志</h3>
        </div>
        <div className="rounded-full bg-[#ffd700]/20 px-3 py-1 text-xs font-medium text-[#ffd700]">
          {unlockedCount}/{narratives.length}
        </div>
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#ffd700]/30 scrollbar-track-transparent">
        {narratives.map((narrative, index) => (
          <NarrativeCard
            key={narrative.id}
            narrative={narrative}
            index={index}
          />
        ))}
      </div>

      <div className="mt-4 text-center text-xs text-[#c0c0c0]/50">
        收集光玉修复计时器解锁更多叙事
      </div>
    </motion.div>
  );
}
