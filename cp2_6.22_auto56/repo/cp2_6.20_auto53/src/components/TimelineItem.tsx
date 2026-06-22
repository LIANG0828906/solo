import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { BidRecord } from '@/types';
import { formatFullPrice, formatDateTime } from '@/utils/formatters';
import { STATUS_LABEL } from '@/types';

interface TimelineItemProps {
  bidRecord: BidRecord;
  isNew?: boolean;
}

export default function TimelineItem({ bidRecord, isNew = false }: TimelineItemProps) {
  const { itemName, amount, time, status } = bidRecord;

  const isLeading = status === 'leading';

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="relative flex gap-4 pb-6 last:pb-0"
    >
      <div className="relative flex flex-col items-center">
        <motion.div
          className={cn(
            'relative z-10 w-4 h-4 rounded-full',
            'bg-primary-bg border-2 border-primary-gold',
            'shadow-[0_0_12px_rgba(201,168,76,0.5)',
          )}
          animate={
            isNew
              ? {
                scale: [1, 1.3, 1], opacity: [1, 0.8, 1] }
              : undefined
          }
          transition={
            isNew
              ? { duration: 1.2, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }
              : undefined
          }
        >
          <div
            className={cn(
              'absolute inset-0 rounded-full',
              isLeading ? 'bg-primary-gold/30' : 'bg-primary-gold/10',
            )}
          />
        </motion.div>
        <div className="flex-1 w-px bg-gradient-to-b from-primary-gold/70 to-primary-gold/10 mt-1" />
      </div>

      <div className="flex-1 min-w-0 pb-1">
        <div className="flex items-start justify-between gap-3 mb-1">
          <h4 className="text-primary-gold font-semibold text-base truncate flex-1">
            {itemName}
          </h4>
          <motion.span
            className={cn(
              'flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              isLeading
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-red-500/20 text-red-400 border border-red-500/40',
            )}
            animate={
              isNew
                ? {
                    opacity: [1, 0.75, 1],
                    scale: [1, 1.04, 1],
                  }
                : undefined
            }
            transition={
              isNew
                ? { duration: 1.2, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }
                : undefined
            }
          >
            {STATUS_LABEL[status]}
          </motion.span>
        </div>

        <div className="mb-1.5">
          <span className="text-white font-display text-2xl font-bold tracking-tight">
            {formatFullPrice(amount)}
          </span>
        </div>

        <div>
          <span className="text-primary-text/40 text-xs">
            {formatDateTime(time)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
