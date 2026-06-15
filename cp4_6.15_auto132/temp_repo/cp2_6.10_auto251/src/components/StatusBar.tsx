import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BookOpen, Award, Calendar, Target } from 'lucide-react';

interface StatusBarProps {
  period: number;
  day: number;
  knowledge: number;
  score: number;
  correctCount: number;
  totalCount: number;
}

const chineseNumbers = ['初', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];

function getChineseDay(day: number): string {
  if (day === 1) return '初一';
  if (day === 10) return '初十';
  if (day < 10) return `初${chineseNumbers[day]}`;
  return `${chineseNumbers[Math.floor(day / 10)]}${chineseNumbers[day % 10] || ''}`;
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
    >
      {value}
    </motion.span>
  );
}

export default function StatusBar({
  period,
  day,
  knowledge,
  score,
  correctCount,
  totalCount,
}: StatusBarProps) {
  const progress = totalCount > 0 ? (correctCount / totalCount) * 100 : 0;

  return (
    <div className="w-full px-4 py-3 relative">
      <div
        className={cn(
          'relative w-full h-16',
          'bg-paper-white border-2 border-wood-brown',
          'shadow-paper rounded-lg overflow-hidden'
        )}
        style={{
          backgroundImage: `
            linear-gradient(90deg, transparent 0%, rgba(139, 105, 20, 0.05) 50%, transparent 100%),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 30px,
              rgba(139, 105, 20, 0.03) 30px,
              rgba(139, 105, 20, 0.03) 31px
            )
          `,
        }}
      >
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-wood-brown/30 to-transparent" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-wood-brown/30 to-transparent" />

        <div className="relative h-full flex items-center justify-between px-8 gap-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-wood-brown" />
              <span className="text-ink-black font-kai text-base">
                第<AnimatedNumber value={period} className="text-cinnabar-red font-bold mx-1" />旬
              </span>
              <span className="text-ink-black-lighter font-song text-sm">
                {getChineseDay(day)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-herb-green" />
              <span className="text-ink-black font-kai text-base">
                进度：
                <AnimatedNumber value={correctCount} className="text-herb-green font-bold mx-1" />
                <span className="text-ink-black-lighter">/</span>
                <AnimatedNumber value={totalCount} className="text-ink-black-lighter mx-1" />
              </span>
            </div>
          </div>

          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-wood-brown" />
              <span className="text-ink-black font-kai text-base">
                知识值：
                <AnimatedNumber value={knowledge} className="text-wood-brown font-bold mx-1" />
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-cinnabar-red" />
              <span className="text-ink-black font-kai text-base">
                得分：
                <AnimatedNumber value={score} className="text-cinnabar-red font-bold mx-1" />
              </span>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-wood-brown/20">
          <motion.div
            className="h-full bg-gradient-to-r from-herb-green to-herb-green-light"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      <div className="absolute left-8 -top-1 w-4 h-3 bg-wood-brown rounded-t-lg shadow-ink" />
      <div className="absolute right-8 -top-1 w-4 h-3 bg-wood-brown rounded-t-lg shadow-ink" />
    </div>
  );
}
