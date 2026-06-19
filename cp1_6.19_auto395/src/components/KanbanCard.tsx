import { forwardRef, useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { Task } from '../types';
import { useAppStore } from '../store/useAppStore';

interface KanbanCardProps {
  task: Task;
}

const MotionDiv = motion.div;

const KanbanCard = forwardRef<HTMLDivElement, KanbanCardProps>(({ task }, ref) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  const { setSelectedTaskId, setIsTaskModalOpen, dependencies, tasks } = useAppStore();
  const [isAnimating, setIsAnimating] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const isOverdue = task.status !== 'done' && new Date(task.endDate) < new Date(today);

  const hasDependencies = dependencies.some((d) => d.toTaskId === task.id);
  const allDependenciesDone = hasDependencies
    ? dependencies
        .filter((d) => d.toTaskId === task.id)
        .every((d) => {
          const fromTask = tasks.find((t) => t.id === d.fromTaskId);
          return fromTask && fromTask.status === 'done';
        })
    : true;

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleClick = () => {
    if (!isDragging) {
      setSelectedTaskId(task.id);
      setIsTaskModalOpen(true);
    }
  };

  const getProgressColor = () => {
    if (task.status === 'done') return '#4CAF50';
    if (isOverdue) return '#F44336';
    return '#2196F3';
  };

  const setRefs = (node: HTMLDivElement | null) => {
    setNodeRef(node);
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  return (
    <MotionDiv
      ref={setRefs}
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isDragging ? 1.02 : 1,
        transition: { duration: 0.3, ease: 'easeOut' },
      }}
      exit={{ opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.2 } }}
      whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        ...style,
        width: '180px',
        backgroundColor: isDragging ? '#E8F5E9' : 'white',
        borderRadius: '8px',
        padding: '12px',
        boxShadow: isDragging
          ? '0 8px 25px rgba(0,0,0,0.2)'
          : '0 2px 6px rgba(0,0,0,0.1)',
        cursor: 'grab',
        position: 'relative',
        userSelect: 'none',
        zIndex: isDragging ? 1000 : 1,
      }}
      {...listeners}
      {...attributes}
      onClick={handleClick}
    >
      <div
        style={{
          fontSize: '14px',
          fontWeight: '500',
          color: '#333',
          marginBottom: '8px',
          wordBreak: 'break-word',
        }}
      >
        {task.title}
      </div>

      <div
        style={{
          width: '100%',
          height: '6px',
          backgroundColor: '#E0E0E0',
          borderRadius: '3px',
          overflow: 'hidden',
          marginBottom: '8px',
        }}
      >
        <motion.div
          key={task.progress}
          initial={{ width: '0%' }}
          animate={{ width: `${task.progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            height: '100%',
            backgroundColor: getProgressColor(),
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: '#999',
        }}
      >
        <span>{task.startDate.slice(5)}</span>
        <span>{task.endDate.slice(5)}</span>
      </div>

      {isOverdue && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 500 }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: '#F44336',
            color: 'white',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: '500',
          }}
        >
          逾期
        </motion.div>
      )}

      {task.status === 'done' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 500 }}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: '#4CAF50',
            color: 'white',
            fontSize: '10px',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: '500',
          }}
        >
          完成
        </motion.div>
      )}

      {hasDependencies && task.status !== 'done' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '8px',
          }}
        >
          <motion.div
            animate={{
              scale: allDependenciesDone ? [1, 1.3, 1] : 1,
            }}
            transition={{
              duration: 0.6,
              repeat: allDependenciesDone ? 0 : Infinity,
              repeatType: 'reverse',
            }}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: allDependenciesDone ? '#4CAF50' : '#2196F3',
              boxShadow: allDependenciesDone
                ? '0 0 8px rgba(76, 175, 80, 0.6)'
                : 'none',
            }}
          />
          <span
            style={{
              fontSize: '11px',
              color: allDependenciesDone ? '#4CAF50' : '#2196F3',
              fontWeight: '500',
            }}
          >
            {allDependenciesDone ? '可开始' : '等待前置'}
          </span>
        </motion.div>
      )}
    </MotionDiv>
  );
});

KanbanCard.displayName = 'KanbanCard';

export default KanbanCard;
