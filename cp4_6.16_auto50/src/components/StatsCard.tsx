import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface StatsCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  gradient: string;
  delay?: number;
}

export const StatsCard: React.FC<StatsCardProps> = memo(({ title, value, icon: Icon, gradient, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl p-6 text-white"
      style={{ background: gradient }}
    >
      <div className="absolute right-4 top-4 opacity-20">
        <Icon size={60} />
      </div>
      <div className="relative z-10">
        <p className="text-white/80 text-sm mb-2">{title}</p>
        <motion.p
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.2, type: 'spring', stiffness: 200 }}
          className="text-3xl font-bold"
        >
          {value}
        </motion.p>
      </div>
      <div
        className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 100%)',
        }}
      />
    </motion.div>
  );
});

StatsCard.displayName = 'StatsCard';
