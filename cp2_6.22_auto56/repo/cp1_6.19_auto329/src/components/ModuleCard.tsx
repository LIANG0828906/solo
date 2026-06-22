import { motion } from 'framer-motion';
import { Zap, Shield, Crosshair } from 'lucide-react';
import type { ShipModule, ModuleType, Rarity } from '../types';

interface ModuleCardProps {
  module: ShipModule;
  onDragStart?: () => void;
  onDragEnd?: (success: boolean) => void;
  isDragging?: boolean;
  compact?: boolean;
}

const rarityColors: Record<Rarity, string> = {
  common: '#B0BEC5',
  rare: '#FFD54F',
  legendary: '#FF8A65',
};

const typeIcons: Record<ModuleType, typeof Zap> = {
  engine: Zap,
  shield: Shield,
  weapon: Crosshair,
};

const typeLabels: Record<ModuleType, string> = {
  engine: '引擎',
  shield: '护盾',
  weapon: '武器',
};

const typeValueLabels: Record<ModuleType, string> = {
  engine: '推力',
  shield: '强度',
  weapon: '伤害',
};

export const ModuleCard = ({
  module,
  onDragStart,
  onDragEnd,
  isDragging = false,
  compact = false,
}: ModuleCardProps) => {
  const Icon = typeIcons[module.type];
  const bgColor = rarityColors[module.rarity];

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('moduleId', module.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart?.();
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    const success = e.dataTransfer.dropEffect === 'move';
    onDragEnd?.(success);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`
        relative cursor-grab active:cursor-grabbing rounded-lg overflow-hidden
        select-none
        ${compact ? 'p-2' : 'p-3'}
        ${isDragging ? 'opacity-50' : ''}
      `}
      style={{
        backgroundColor: `${bgColor}20`,
        border: `2px solid ${bgColor}`,
        boxShadow: isDragging
          ? `0 10px 40px ${bgColor}40`
          : `0 2px 8px ${bgColor}15`,
        transition: 'all 0.2s ease',
        transform: isDragging ? 'scale(1.1)' : 'scale(1)',
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.zIndex = '10';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.zIndex = '1';
        }
      }}
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div
            className="rounded-full p-1"
            style={{ backgroundColor: `${bgColor}30` }}
          >
            <Icon size={compact ? 14 : 18} style={{ color: bgColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <div
              className={`font-semibold truncate ${compact ? 'text-xs' : 'text-sm'}`}
              style={{ color: bgColor }}
            >
              {module.name}
            </div>
            <div className={`text-[10px] opacity-70 ${compact ? 'hidden' : ''}`}>
              {typeLabels[module.type]}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-1 ${compact ? 'text-xs' : 'text-sm'}`}>
            <span className="opacity-60">{typeValueLabels[module.type]}:</span>
            <span className="font-bold" style={{ color: bgColor }}>
              {module.value}
            </span>
          </div>
          {!compact && (
            <div
              className="text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: `${bgColor}30`, color: bgColor }}
            >
              {module.rarity === 'common' ? '普通' : module.rarity === 'rare' ? '稀有' : '传说'}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ModuleCard;
