import { useMemo, useRef, useCallback, memo } from 'react';
import {
  DragDropContext,
  Droppable,
  DropResult,
} from 'react-beautiful-dnd';
import { Plus, MoreHorizontal, Edit2, Check, X, Pencil } from 'lucide-react';
import TaskCard from './TaskCard';
import type { Task, TeamMember, Lane, TaskStatus } from '@/utils/types';

interface TaskBoardProps {
  tasks: Task[];
  lanes: Lane[];
  members: TeamMember[];
  onReorderInLane: (
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
  onEditTask: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
  onRenameLane: (laneId: string, newName: string) => void;
  onDeleteLane?: (laneId: string) => void;
  onAddLane?: () => void;
  lanesCount: number;
}

export const TaskBoard = memo(function TaskBoard({
  tasks,
  lanes,
  members,
  onReorderInLane,
  onMoveTaskToLane,
  onEditTask,
  onAddTask,
  onRenameLane,
  onDeleteLane,
  onAddLane,
  lanesCount,
}: TaskBoardProps) {
  const [editingLaneId, setEditingLaneId] = useRef<string | null>(null);
  const [editingLaneName, setEditingLaneName] = useState('');
  const [editingInputRef] = useRef<HTMLInputElement>(null);
  const [showLaneMenu, setShowLaneMenu] = useState<string | null>(null);

  const sortedLanes = useMemo(
    () => [...lanes].sort((a, b) => a.order - b.order),
    [lanes]
  );

  const getTasksByLaneStatus = useCallback(
    (status: TaskStatus) => {
      return tasks
        .filter((t) => t.status === status)
        .sort((a, b) => a.order - b.order);
    },
    [tasks]
  );

  const getProgressPercent = (tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100 : 0;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    const sourceLane = sortedLanes.find((l) => l.id === source.droppableId);
    const destLane = sortedLanes.find((l) => l.id === destination.droppableId);

    if (!sourceLane || !destLane) return;

    if (sourceLane.id === destLane.id) {
      onReorderInLane(sourceLane.status, source.index, destination.index);
    } else {
      onMoveTaskToLane(
        draggableId,
        sourceLane.status,
        destLane.status,
        destination.index
      );
    }
  };

  const handleStartEditLane = (lane: Lane) => {
    setEditingLaneId.current(lane.id);
    setEditingLaneName(lane.name);
    setShowLaneMenu(null);
    setTimeout(() => editingInputRef.current?.focus(), 0);
  };

  const handleSaveLaneName = (laneId: string) => {
    if (editingLaneName.trim()) {
      onRenameLane(laneId, editingLaneName.trim());
    }
