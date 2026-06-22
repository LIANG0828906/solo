import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scroll, Award, Target, Calendar, Sparkles } from 'lucide-react';
import { ScoreReport } from '../types';
import { cn } from '../lib/utils';

interface ScoreBoardProps {
  report: ScoreReport;
  onContinue: () => void;
  isOpen: boolean;
}

const gradeConfig = {
  '下工': { color: 'text-ink-black-lighter', bgColor: 'bg-ink-black-lighter/10', borderColor: 'border-ink-black-lighter' },
  '中工': { color: 'text-wood-brown', bgColor: 'bg-wood-brown/10', borderColor: 'border-wood-brown' },
  '上工': { color: 'text-herb-green', bgColor: 'bg-herb-green/10', borderColor: 'border-herb-green' },
  '神医': { color: 'text-cinnabar-red', bgColor: 'bg-cinnabar-red/10', borderColor: 'border-cinnabar-red' },
};

function useAnimatedNumber(target: number, duration: number = 1500, start: boolean = true) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) {
      setValue(0);
      return;
    }

    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(easeProgress * target));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [target, duration, start]);

  return value;
}

export default function ScoreBoard({ report, onContinue, isOpen }: ScoreBoardProps) {
  const [animationStarted, setAnimationStarted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setAnimationStarted(true), 500);
      return () => clearTimeout(timer);
    } else {
      setAnimationStarted(false);
    }
  }, [isOpen]);

  const accuracy = useAnimatedNumber(Math.round(report.accuracy * 100), 1500, animationStarted);
  const completionRate = useAnimatedNumber(Math.round(report.completionRate * 100), 1500, animationStarted);
  const eventHandling = useAnimatedNumber(Math.round(report.eventHandling), 1500, animationStarted);
  const totalScore = useAnimatedNumber(Math.round(report.totalScore), 2000, animationStarted);

  const gradeStyle = gradeConfig[report.grade];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-ink-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative w-full max-w-2xl my-8"
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          >
            <div className="relative scroll-style paper-texture bg-paper-cream rounded-lg shadow-paper overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-wood-brown/20 to-transparent" />

              <div className="relative p-8 pt-12">
                <motion.div
                  className="text-center mb-8"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <Scroll className="w-8 h-8 text-wood-brown" />
                    <h1 className="text-3xl font-bold text-ink-black font-kai tracking-widest">
                      本草录
                    </h1>
                    <Scroll className="w-8 h-8 text-wood-brown" />
                  </div>
                  <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-wood-brown/50 to-transparent" />
                </motion.div>

                <motion.div
                  className="flex items-center justify-center gap-4 mb-8 p-4 bg-paper-white/50 rounded-lg border border-wood-brown/20"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Calendar className="w-5 h-5 text-wood-brown" />
                  <span className="text-lg font-kai text-ink-black">
                    第 {report.period} 旬 考评
                  </span>
                </motion.div>

                <div className="space-y-4 mb-8">
                  <motion.div
                    className="flex items-center justify-between p-4 bg-paper-white rounded-lg border border-wood-brown/20"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-herb-green" />
                      <span className="font-song text-ink-black">采集准确率</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-paper-white-dark rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-herb-green rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: animationStarted ? `${accuracy}%` : '0%' }}
                          transition={{ duration: 1.5, delay: 0.4, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="text-xl font-bold text-herb-green font-kai min-w-[3ch] text-right">
                        {accuracy}%
                      </span>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-center justify-between p-4 bg-paper-white rounded-lg border border-wood-brown/20"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-wood-brown" />
                      <span className="font-song text-ink-black">方剂完成度</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-paper-white-dark rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-wood-brown rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: animationStarted ? `${completionRate}%` : '0%' }}
                          transition={{ duration: 1.5, delay: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="text-xl font-bold text-wood-brown font-kai min-w-[3ch] text-right">
                        {completionRate}%
                      </span>
                    </div>
                  </motion.div>

                  <motion.div
                    className="flex items-center justify-between p-4 bg-paper-white rounded-lg border border-wood-brown/20"
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-cinnabar-red" />
                      <span className="font-song text-ink-black">事件处理评分</span>
                    </div>
                    <span className="text-xl font-bold text-cinnabar-red font-kai">
                      {eventHandling}
                    </span>
                  </motion.div>
                </div>

                <motion.div
                  className="text-center mb-8"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7, type: 'spring' }}
                >
                  <div className="inline-block p-6 bg-paper-white rounded-xl border-2 border-wood-brown/30 mb-4">
                    <div className="text-sm text-ink-black-lighter font-kai mb-2 tracking-wider">
                      ━ 总 分 ━
                    </div>
                    <div className="text-5xl font-bold text-ink-black font-kai mb-2">
                      {totalScore}
                    </div>
                    <div className="h-px w-24 mx-auto bg-gradient-to-r from-transparent via-wood-brown/30 to-transparent mb-4" />
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-ink-black-lighter font-song">品级：</span>
                      <motion.div
                        className={cn(
                          'seal-stamp text-2xl font-bold',
                          gradeStyle.color
                        )}
                        animate={{
                          rotate: [-5, 5, -5],
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 2,
                          delay: 1,
                          repeat: Infinity,
                          repeatType: 'reverse',
                        }}
                      >
                        {report.grade}
                      </motion.div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  className="mb-8 p-6 bg-paper-white/50 rounded-lg border border-wood-brown/20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="text-sm text-ink-black-lighter font-kai mb-2 tracking-wider">
                    【评语】
                  </div>
                  <p className="text-ink-black-light font-song leading-relaxed text-lg">
                    {report.comment}
                  </p>
                </motion.div>

                <motion.div
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <motion.button
                    onClick={onContinue}
                    className="px-12 py-4 bg-herb-green text-white rounded-lg font-kai text-xl hover:bg-herb-green-light transition-all shadow-herb"
                    whileHover={{ scale: 1.05, boxShadow: '0 4px 24px rgba(58, 125, 68, 0.5)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    继续前行
                  </motion.button>
                </motion.div>

                <div className="absolute left-2 top-1/4 vertical-text text-4xl font-kai text-wood-brown/10">
                  本
                </div>
                <div className="absolute right-2 top-1/3 vertical-text text-4xl font-kai text-wood-brown/10">
                  草
                </div>
                <div className="absolute right-2 bottom-1/4 vertical-text text-4xl font-kai text-wood-brown/10">
                  录
                </div>
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-wood-brown/20 to-transparent" />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
