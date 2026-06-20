import { motion } from 'framer-motion';
import { Zap, Shield, Crosshair } from 'lucide-react';

interface AttributeBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  icon: 'thrust' | 'shield' | 'weapon';
}

const iconMap = {
  thrust: Zap,
  shield: Shield,
  weapon: Crosshair,
};

export const AttributeBar = ({ label, value, maxValue, color, icon }: AttributeBarProps) => {
  const Icon = iconMap[icon];
  const percentage = Math.min(100, (value / maxValue) * 100);

  return (
    <div className="flex items-center gap-3 w-full">
      <div
        className="rounded-lg p-2 flex-shrink-0"
        style={{ backgroundColor: `${color}20` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium" style={{ color }}>{label}</span>
          <span className="text-sm font-bold" style={{ color }}>{value}</span>
        </div>
        <div
          className="h-3 rounded-full overflow-hidden"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>
    </div>
  );
};

export default AttributeBar;
