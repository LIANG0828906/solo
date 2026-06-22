import { motion } from 'framer-motion';
import type { ItemStatus } from '@/types';

interface StatusBadgeProps {
  status: ItemStatus;
}

const statusConfig: Record<ItemStatus, { bg: string; color: string; label: string }> = {
  pending: { bg: '#FFD54F', color: '#5D4037', label: '待匹配' },
  matched: { bg: '#A5D6A7', color: '#1B5E20', label: '已匹配' },
  completed: { bg: '#BDBDBD', color: '#424242', label: '已完成' },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <motion.span
      animate={{ backgroundColor: config.bg, color: config.color }}
      transition={{ duration: 0.3 }}
      className="inline-flex items-center justify-center font-medium"
      style={{
        backgroundColor: config.bg,
        color: config.color,
        borderRadius: '12px',
        padding: '4px 12px',
        fontSize: '12px',
      }}
    >
      {config.label}
    </motion.span>
  );
}
