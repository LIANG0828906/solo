import { useCallback, useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Herb, DragPosition } from '@/types';

interface HerbCardProps {
  herb: Herb;
  onDragStart?: (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => void;
  onDrag?: (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => void;
  onDragEnd?: (
    event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => void;
  onParticleTrigger?: (position: DragPosition) => void;
  disabled?: boolean;
}

export default function HerbCard({
  herb,
  onDragStart,
  onDrag,
  onDragEnd,
  onParticleTrigger,
  disabled = false,
}: HerbCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = useCallback(
    (
      event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ) => {
      setIsDragging(true);
      onDragStart?.(event, info);
    },
    [onDragStart]
  );

  const handleDrag = useCallback(
    (
      event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ) => {
      onDrag?.(event, info);
      
      if (onParticleTrigger && 'clientX' in event && 'clientY' in event) {
        const point = event as PointerEvent;
        onParticleTrigger({
          x: point.clientX,
          y: point.clientY,
        });
      }
    },
    [onDrag, onParticleTrigger]
  );

  const handleDragEnd = useCallback(
    (
      event: MouseEvent | TouchEvent | PointerEvent,
      info: PanInfo
    ) => {
      setIsDragging(false);
      onDragEnd?.(event, info);
    },
    [onDragEnd]
  );

  return (
    <motion.div
      layout
      drag={!disabled}
      dragMomentum={false}
      dragElastic={0.1}
      whileHover={{
        scale: isDragging ? 0.9 : 1.08,
        boxShadow: isDragging
          ? '0 8px 30px rgba(45, 45, 45, 0.4)'
          : '0 0 25px rgba(74, 157, 87, 0.6)',
      }}
      whileTap={{ scale: isDragging ? 0.9 : 0.95 }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: 1,
        scale: isDragging ? 0.9 : 1,
        zIndex: isDragging ? 50 : 1,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      onDragStart={handleDragStart}
      onDrag={handleDrag}
      onDragEnd={handleDragEnd}
      className={cn(
        'relative select-none cursor-grab active:cursor-grabbing',
        'w-24 h-32 rounded-lg',
        'bg-paper-cream border-2 border-wood-brown',
        'flex flex-col items-center justify-center gap-2',
        'shadow-ink hover:shadow-herb',
        'transition-all duration-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <motion.div
        className="text-4xl"
        animate={{
          y: [0, -3, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {herb.emoji}
      </motion.div>
      
      <div className="text-center px-2">
        <p className={cn(
          'text-ink-black font-kai text-sm font-bold',
          'tracking-wider'
        )}>
          {herb.name}
        </p>
        <p className="text-ink-black-lighter text-xs font-song">
          {herb.alias}
        </p>
      </div>

      <div className={cn(
        'absolute inset-0 rounded-lg pointer-events-none',
        'bg-gradient-to-t from-herb-green/10 to-transparent',
        'opacity-0 hover:opacity-100 transition-opacity duration-300'
      )} />
    </motion.div>
  );
}
