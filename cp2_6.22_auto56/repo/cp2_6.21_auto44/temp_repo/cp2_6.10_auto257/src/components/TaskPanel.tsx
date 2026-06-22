import { motion } from 'framer-motion';
import { Hourglass, BookOpen, Leaf, Wind, Sparkles } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { useState, useEffect } from 'react';

export function TaskPanel() {
  const { currentTask, knowledge, day, period, correctCount, wrongCount } = useGameStore();
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (currentTask) {
      setTimeLeft(currentTask.timeLimit);
      const timer = setInterval(() => {
        setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentTask]);

  const accuracy = correctCount + wrongCount > 0
    ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
    : 100;

  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="scroll-panel p-6 h-full flex flex-col"
    >
      <div className="text-center mb-4 pb-4 border-b-2 border-earth/30">
        <h2 className="font-kai text-2xl text-ink mb-1">本草纲目</h2>
        <p className="text-earth text-sm">第 {period} 旬 · 第 {day} 日</p>
      </div>

      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-ink/70 flex items-center gap-1">
            <Sparkles className="w-4 h-4" />
            知识值
          </span>
          <span className="font-bold text-pine">
            {knowledge}
            <motion.span
              key={knowledge}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="ml-1 text-sm"
            >
              {knowledge >= 50 ? '↑' : '↓'}
            </motion.span>
          </span>
        </div>
        <div className="h-2 bg-ink/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-pine to-bamboo"
            initial={{ width: 0 }}
            animate={{ width: `${knowledge}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between text-xs text-ink/60">
          <span>准确率: {accuracy}%</span>
          <span>正确: {correctCount} | 错误: {wrongCount}</span>
        </div>
      </div>

      {currentTask && (
        <div className="flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-kai text-xl text-ink flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-earth" />
              今日任务
            </h3>
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${
              timeLeft <= 10 ? 'bg-vermilion/20 text-vermilion animate-pulse' : 'bg-pine/20 text-pine'
            }`}>
              <Hourglass className="w-4 h-4" />
              <span className="font-bold">{timeLeft}s</span>
            </div>
          </div>

          <div className="space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bamboo-slip p-4"
            >
              <h4 className="font-kai text-ink flex items-center gap-2 mb-2">
                <Leaf className="w-4 h-4 text-pine" />
                形态
              </h4>
              <p className="text-ink/80 text-sm leading-relaxed">
                {currentTask.description.shape}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bamboo-slip p-4"
            >
              <h4 className="font-kai text-ink flex items-center gap-2 mb-2">
                <Wind className="w-4 h-4 text-earth" />
                气味
              </h4>
              <p className="text-ink/80 text-sm leading-relaxed">
                {currentTask.description.odor}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bamboo-slip p-4"
            >
              <h4 className="font-kai text-ink flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-vermilion" />
                功效
              </h4>
              <p className="text-ink/80 text-sm leading-relaxed">
                {currentTask.description.effect}
              </p>
            </motion.div>
          </div>

          <div className="mt-4 p-3 bg-ink/5 rounded-lg border border-earth/20">
            <p className="text-sm text-ink/70 text-center">
              📜 请从药圃中拖拽对应的草药到医案区域
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
