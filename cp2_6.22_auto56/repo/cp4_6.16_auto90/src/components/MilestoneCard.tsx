import React, { memo, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, GripVertical, Check, Pencil, Trash2, Link } from 'lucide-react';
import { Milestone } from '@/store/projectStore';
import { cn } from '@/lib/utils';

interface MilestoneCardProps {
  milestone: Milestone;
  isBlocked: boolean;
  isDragging: boolean;
  isConnecting: boolean;
  index: number;
  onStatusChange: (status: 'pending' | 'in-progress' | 'completed') => void;
  onRename: (name: string) => void;
  onDelete: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onDragEnd: () => void;
  onConnectStart?: (e: React.MouseEvent) => void;
  onConnectEnd?: () => void;
}

export const MilestoneCard = memo(function MilestoneCard({
  milestone,
  isBlocked,
  isDragging,
  isConnecting,
  index,
  onStatusChange,
  onRename,
  onDelete,
  onDragStart,
  onDragEnd,
  onConnectStart,
}: MilestoneCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(milestone.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const statusColors = {
    pending: 'bg-gray-200 text-gray-600 border-gray-300',
    'in-progress': 'bg-blue-100 text-blue-700 border-blue-300',
    completed: 'bg-green-100 text-green-700 border-green-300',
  };

  const statusIcons = {
    pending: null,
    'in-progress': null,
    completed: <Check className="w-3 h-3" />,
  };

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(milestone.name);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [milestone.name]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    if (editName.trim() && editName !== milestone.name) {
      onRename(editName.trim());
    }
  }, [editName, milestone.name, onRename]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(milestone.name);
    }
  }, [handleBlur, milestone.name]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: isDragging ? 1.05 : 1 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className={cn(
        'relative flex items-center gap-2 px-3 py-2 rounded-lg border-2 bg-white',
        'cursor-pointer select-none transition-all duration-200',
        'hover:shadow-md hover:-translate-y-0.5',
        statusColors[milestone.status],
        isDragging && 'shadow-lg z-10',
        isConnecting && 'ring-2 ring-primary ring-offset-2'
      )}
      onMouseDown={onDragStart}
      onMouseUp={onDragEnd}
      onDoubleClick={handleDoubleClick}
    >
      <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="relative flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none outline-none text-sm font-medium"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-sm font-medium truncate block">{milestone.name}</span>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          const nextStatus: Record<string, 'pending' | 'in-progress' | 'completed'> = {
            pending: 'in-progress',
            'in-progress': 'completed',
            completed: 'pending',
          };
          onStatusChange(nextStatus[milestone.status]);
        }}
        className={cn(
          'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
          milestone.status === 'completed' && 'bg-green-500 border-green-500 text-white',
          milestone.status === 'in-progress' && 'bg-blue-500 border-blue-500 text-white',
          milestone.status === 'pending' && 'bg-gray-200 border-gray-300'
        )}
      >
        {statusIcons[milestone.status]}
      </button>

      {isBlocked && (
        <div
          className="absolute -top-2 -right-2 z-10"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white shadow-md"
          >
            <Lock className="w-3 h-3" />
          </motion.div>
          
          <AnimatePresence>
            {showTooltip && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                className="absolute top-6 right-0 whitespace-nowrap px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg z-20"
              >
                等待前置完成
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {onConnectStart && (
        <button
          onMouseDown={(e) => {
            e.stopPropagation();
            onConnectStart(e);
          }}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-primary rounded-full 
                     opacity-0 group-hover:opacity-100 transition-opacity cursor-crosshair
                     hover:scale-125"
          title="拖拽创建依赖"
        />
      )}
    </motion.div>
  );
});
