import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Task } from '@/types';

interface MedicalBookProps {
  task: Task | null;
  timeRemaining: number;
}

export default function MedicalBook({ task, timeRemaining }: MedicalBookProps) {
  const progress = task ? (timeRemaining / task.timeLimit) * 100 : 0;
  const isUrgent = progress < 30;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'scroll-style paper-texture',
        'absolute top-4 left-4',
        'w-64 h-96',
        'p-6',
        'flex flex-col items-center'
      )}
    >
      <h2 className="font-kai text-xl text-ink-black mb-4 tracking-widest">
        本草纲目
      </h2>

      {task ? (
        <div className="flex-1 w-full flex flex-col items-center">
          <div className="flex-1 flex gap-4 py-4">
            <div className="vertical-text font-song text-ink-black-light text-sm leading-relaxed">
              <span className="text-herb-green font-bold">【气味】</span>
              {task.description.smell}
            </div>
            <div className="vertical-text font-song text-ink-black-light text-sm leading-relaxed">
              <span className="text-herb-green font-bold">【形态】</span>
              {task.description.shape}
            </div>
            <div className="vertical-text font-song text-ink-black-light text-sm leading-relaxed">
              <span className="text-cinnabar-red font-bold">【功效】</span>
              {task.description.effect}
            </div>
          </div>

          <div className="w-full mt-4">
            <div className="flex justify-between text-xs text-ink-black-lighter mb-1">
              <span>剩余时间</span>
              <span className={cn(isUrgent && 'text-cinnabar-red font-bold')}>
                {timeRemaining}s
              </span>
            </div>
            <div className="w-full h-2 bg-paper-white-dark rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  isUrgent ? 'bg-cinnabar-red' : 'bg-herb-green'
                )}
                initial={{ width: '100%' }}
                animate={{ width: `${Math.max(0, progress)}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="vertical-text font-kai text-ink-black-lighter text-lg">
            今日暂无任务
          </p>
        </div>
      )}
    </motion.div>
  );
}
