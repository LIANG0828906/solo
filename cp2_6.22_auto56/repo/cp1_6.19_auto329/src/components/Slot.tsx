import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Shield, Crosshair } from 'lucide-react';
import type { Slot as SlotType, ModuleType, ShipModule } from '../types';

interface SlotProps {
  slot: SlotType;
  onDrop: (slotId: string, moduleId: string) => boolean;
  onRemove: (slotId: string) => void;
  draggedModule: ShipModule | null;
}

const typeIcons: Record<ModuleType, typeof Zap> = {
  engine: Zap,
  shield: Shield,
  weapon: Crosshair,
};

const typeColors: Record<ModuleType, string> = {
  engine: '#FF5252',
  shield: '#448AFF',
  weapon: '#69F0AE',
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

export const Slot = ({ slot, onDrop, onRemove, draggedModule }: SlotProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isInvalid, setIsInvalid] = useState(false);
  const Icon = typeIcons[slot.type];
  const color = typeColors[slot.type];

  const isValidDrop = draggedModule && draggedModule.type === slot.type;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (isValidDrop) {
      e.dataTransfer.dropEffect = 'move';
      setIsDragOver(true);
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const moduleId = e.dataTransfer.getData('moduleId');
    if (!moduleId) return;

    const success = onDrop(slot.id, moduleId);
    if (!success) {
      setIsInvalid(true);
      setTimeout(() => setIsInvalid(false), 300);
    }
  };

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${slot.position.x}%`,
        top: `${slot.position.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.1, type: 'spring' }}
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative w-24 h-24 rounded-xl flex flex-col items-center justify-center
          transition-all duration-200 cursor-pointer
          ${isDragOver && isValidDrop ? 'slot-valid-hover' : ''}
          ${isInvalid ? 'invalid-drop-animation' : ''}
        `}
        style={{
          backgroundColor: slot.equippedModule ? 'rgba(42, 42, 62, 0.95)' : 'rgba(42, 42, 62, 0.6)',
          border: isDragOver && isValidDrop
            ? '3px dashed #4CAF50'
            : `2px solid ${slot.equippedModule ? color : 'rgba(79, 195, 247, 0.3)'}`,
          boxShadow: slot.equippedModule
            ? `0 0 20px ${color}40, inset 0 0 15px ${color}15`
            : '0 2px 8px rgba(0, 0, 0, 0.3)',
        }}
      >
        <AnimatePresence mode="wait">
          {slot.equippedModule ? (
            <motion.div
              key="equipped"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="w-full h-full p-2 flex flex-col items-center justify-between"
            >
              <div className="flex items-center justify-between w-full">
                <div
                  className="rounded-full p-1"
                  style={{ backgroundColor: `${color}30` }}
                >
                  <Icon size={14} style={{ color }} />
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove(slot.id);
                  }}
                  className="p-0.5 rounded-full hover:bg-red-500/30 transition-colors"
                  style={{ color: '#F44336' }}
                >
                  <X size={14} />
                </button>
              </div>

              <div className="text-center flex-1 flex flex-col justify-center">
                <div
                  className="text-xs font-bold truncate w-full"
                  style={{ color }}
                >
                  {slot.equippedModule.name}
                </div>
              </div>

              <div className="text-[10px] text-center w-full">
                <span className="opacity-60">{typeValueLabels[slot.type]}: </span>
                <span className="font-bold" style={{ color }}>
                  {slot.equippedModule.value}
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center"
            >
              <Icon
                size={24}
                className="mb-1 pulse-glow"
                style={{ color: isDragOver && isValidDrop ? '#4CAF50' : color, opacity: 0.5 }}
              />
              <span className="text-[10px] opacity-50">
                {typeLabels[slot.type]}槽位
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Slot;
