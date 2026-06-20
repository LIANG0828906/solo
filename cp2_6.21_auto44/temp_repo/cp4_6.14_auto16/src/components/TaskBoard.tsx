import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { motion } from 'framer-motion';
import { Plus, MoreHorizontal, Edit2, Trash2, GripVertical } from 'lucide-react';
import type { Task, TeamMember, Lane, TaskStatus } from '@/utils/types';
import { useVirtualList } from '@/hooks/useVirtualList';
import TaskCard from './TaskCard';

interface TaskBoardProps {
  tasks: Task[];
  lanes: Lane[];
  members: TeamMember[];
  onEditTask: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  onRenameLane: (laneId: string, newName: string) => void;
  onRemoveLane: (laneId: string) => void;
  onReorderLanes: (fromIndex: number, toIndex: number) => void;
  onReorderTasksInLane: (
    status: TaskStatus,
    fromIndex: number,
    toIndex: number
  ) => void;
  onMoveTaskToLane: (
    taskId: string,
    fromStatus: TaskStatus,
    toStatus: TaskStatus,
    toIndex: number
  ) => void;
}

const CARD_HEIGHT = 130;
const LANE_HEIGHT = 'calc(100vh - 200px)';

const springConfig = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 28,
  mass: 0.6,
};

export function TaskBoard({
  tasks,
  lanes,
  members,
  onEditTask,
