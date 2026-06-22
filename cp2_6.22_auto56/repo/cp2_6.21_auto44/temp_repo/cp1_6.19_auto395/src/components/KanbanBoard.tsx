import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { Task, TaskStatus } from '../types';
import KanbanCard from './KanbanCard';

interface KanbanColumnProps {
  id: TaskStatus;
  title: string;
  tasks: Task[];
  color: string;
}

const KanbanColumn = ({ id, title, tasks, color }: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        width: '200px',
        minWidth: '200px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isOver ? '#E8F5E9' : '#F5F5F5',
        borderRadius: '8px',
        padding: '12px',
        transition: 'background-color 0.2s',
        height: '100%',
      }}
    >
      <div
        style={{
          fontWeight: '600',
          fontSize: '14px',
          color: '#333',
          marginBottom: '12px',
          padding: '6px 10px',
          backgroundColor: color,
          borderRadius: '6px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <span style={{ color: 'white' }}>{title}</span>
        <span
          style={{
            backgroundColor: 'rgba(255,255,255,0.3)',
            color: 'white',
            borderRadius: '10px',
            padding: '2px 8px',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          {tasks.length}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          overflowY: 'auto',
          minHeight: '50px',
          padding: '2px',
        }}
      >
        <AnimatePresence mode="popLayout">
          {tasks.map((task) => (
            <KanbanCard key={task.id} task={task} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const KanbanBoard = () => {
  const { tasks } = useAppStore();

  const columns = useMemo(() => {
    return [
      { id: 'todo' as TaskStatus, title: '待办', color: '#9E9E9E' },
      { id: 'in-progress' as TaskStatus, title: '进行中', color: '#2196F3' },
      { id: 'done' as TaskStatus, title: '已完成', color: '#4CAF50' },
    ];
  }, []);

  const getTasksByStatus = (status: TaskStatus): Task[] => {
    return tasks.filter((task) => task.status === status);
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: '20px 24px',
        overflowX: 'auto',
        overflowY: 'hidden',
        display: 'flex',
        gap: '16px',
        backgroundColor: '#FAFAFA',
        boxSizing: 'border-box',
      }}
    >
      {columns.map((column) => (
        <KanbanColumn
          key={column.id}
          id={column.id}
          title={column.title}
          color={column.color}
          tasks={getTasksByStatus(column.id)}
        />
      ))}
    </div>
  );
};

export default KanbanBoard;
