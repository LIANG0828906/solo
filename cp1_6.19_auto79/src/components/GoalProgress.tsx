import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoalProgress as GoalProgressType, CATEGORY_LABELS } from '@/types/types';

interface ConfettiProps {
  active: boolean;
}

function Confetti({ active }: ConfettiProps) {
  const [particles, setParticles] = useState<Array<{ id: number; left: number; color: string; delay: number; size: number }>>([]);

  useEffect(() => {
    if (active) {
      const colors = ['#F1C40F', '#E74C3C', '#3498DB', '#2ECC71', '#9B59B6', '#E67E22'];
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.5,
        size: 6 + Math.random() * 8,
      }));
      setParticles(newParticles);

      const timer = setTimeout(() => setParticles([]), 1500);
      return () => clearTimeout(timer);
    }
  }, [active]);

  return (
    <AnimatePresence>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="confetti-piece"
          initial={{ y: -20, opacity: 1 }}
          animate={{ y: window.innerHeight + 20, rotate: 720 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, delay: p.delay, ease: 'easeOut' }}
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </AnimatePresence>
  );
}

interface GoalProgressProps {
  progress: GoalProgressType[];
}

export default function GoalProgress({ progress }: GoalProgressProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const [completedGoals, setCompletedGoals] = useState<Set<string>>(new Set());

  const handleGoalComplete = useCallback((goalId: string) => {
    if (!completedGoals.has(goalId)) {
      setShowConfetti(true);
      setCompletedGoals((prev) => new Set(prev).add(goalId));
      setTimeout(() => setShowConfetti(false), 1500);
    }
  }, [completedGoals]);

  useEffect(() => {
    progress.forEach((p) => {
      if (p.percentage >= 100) {
        handleGoalComplete(p.goal.id);
      }
    });
  }, [progress, handleGoalComplete]);

  const uncompletedGoals = progress.filter((p) => p.percentage < 100);

  return (
    <>
      <Confetti active={showConfetti} />

      <div className="px-4 py-3 border-b border-[#3A3A5C]">
        <div className="flex gap-3 overflow-x-auto scrollbar-hide">
          {progress.map((p) => {
            const isComplete = p.percentage >= 100;
            return (
              <div key={p.goal.id} className="flex-shrink-0 min-w-[200px]">
                <div className="flex items-center gap-2 mb-1">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: p.goal.color }}
                  />
                  <span className="text-sm text-gray-300">
                    {CATEGORY_LABELS[p.goal.category]}
                  </span>
                  <span className="text-xs text-gray-500 ml-auto font-mono">
                    {Math.round(p.completed / 60 * 10) / 10}/{Math.round(p.goal.targetMinutes / 60 * 10) / 10}h
                  </span>
                </div>
                <div className="h-2 bg-[#2A2A4A] rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${isComplete ? 'gold-pulse' : ''}`}
                    style={{ backgroundColor: isComplete ? '#F1C40F' : p.goal.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(p.percentage, 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {uncompletedGoals.length > 0 && (
        <div className="px-4 py-2 bg-[#1A1A2E]">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide text-xs">
            {uncompletedGoals.map((p) => (
              <span
                key={p.goal.id}
                className="text-[#E74C3C] flex-shrink-0"
              >
                ⚠️ {CATEGORY_LABELS[p.goal.category]}还需{Math.round((p.goal.targetMinutes - p.completed) / 60 * 10) / 10}小时
              </span>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
