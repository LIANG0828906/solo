import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDropZone } from '@/hooks/useDropZone';

interface MedicalCaseProps {
  onDrop: (herbId: string) => void;
}

export default function MedicalCase({ onDrop }: MedicalCaseProps) {
  const { isOver, dropHandlers } = useDropZone({ onDrop });

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className={cn(
        'wood-border paper-texture',
        'absolute left-4 top-[420px]',
        'w-64 h-48',
        'p-4',
        'flex flex-col items-center justify-center',
        'transition-all duration-300',
        isOver && [
          'bg-herb-green/10',
          'border-herb-green',
          'shadow-herb',
          'scale-105',
        ]
      )}
      {...dropHandlers}
    >
      <div className="text-center">
        <motion.div
          animate={isOver ? { y: [0, -8, 0] } : {}}
          transition={{ duration: 0.6, repeat: isOver ? Infinity : 0 }}
          className="text-5xl mb-3"
        >
          📜
        </motion.div>
        <p
          className={cn(
            'font-kai text-base tracking-wider',
            isOver ? 'text-herb-green' : 'text-ink-black-lighter'
          )}
        >
          {isOver ? '释放草药以完成诊断' : '请将草药放置于此'}
        </p>
        {isOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-2 text-xs text-herb-green-light"
          >
            松开放置即可
          </motion.div>
        )}
      </div>

      {isOver && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="absolute inset-0 border-2 border-dashed border-herb-green rounded m-2 animate-pulse" />
        </motion.div>
      )}
    </motion.div>
  );
}
