import { motion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';

interface Props {
  percent: number;
  completed: boolean;
  label: string;
}

export const ProgressBar = ({ percent, completed, label }: Props) => {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {completed ? (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            >
              <Check size={12} style={{ color: '#4CAF50' }} strokeWidth={3} />
            </motion.div>
          ) : (
            <Circle size={10} fill="#B0BEC5" style={{ color: '#B0BEC5' }} />
          )}
          <span className="text-[11px] text-white/80">{label}</span>
        </div>
        <span
          className="text-[11px] tabular-nums"
          style={{ color: completed ? '#4CAF50' : 'rgba(255,255,255,0.5)' }}
        >
          {percent}%
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          className="h-full rounded-full"
          style={{
            background: completed
              ? 'linear-gradient(90deg,#4CAF50,#66BB6A)'
              : 'linear-gradient(90deg,#FFD54F,#FFC107)',
          }}
        />
      </div>
    </div>
  );
};
