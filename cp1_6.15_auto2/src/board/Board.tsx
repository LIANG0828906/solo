import { useCallback, useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from 'react-beautiful-dnd';
import { Plus, Clock, Trash2 } from 'lucide-react';
import { useStore } from '@/shared/store';
import { emitTaskMove, emitTaskCreate, emitTaskDelete } from '@/shared/socketClient';
import { LANE_CONFIG, PRIORITY_CONFIG, type Lane, type Task } from '@/shared/types';

function TaskCard({ task, isHighlighted }: { task: Task; isHighlighted: boolean }) {
  const members = useStore((s) => s.teamMembers);
  const assignee = members.find((m) => m.id === task.assignee);
  const priorityCfg = PRIORITY_CONFIG[task.priority];

  return (
    <Draggable draggableId={task.id} index={task.order}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          data-task-id={task.id}
          className={`
            group relative bg-white rounded-card p-3 mb-2 shadow-card
            transition-all duration-200 ease-out cursor-grab active:cursor-grabbing
            border-l-4 ${task.lane === 'todo' ? 'border-macaron-purple' : task.lane === 'inProgress' ? 'border-macaron-mint' : 'border-macaron-pink'}
            ${snapshot.isDragging ? 'shadow-card-drag scale-[1.05] rotate-[1deg]' : 'hover:shadow-card-hover'}
            ${isHighlighted ? 'ring-2 ring-macaron-highlight ring-offset-2 animate-scale-in' : ''}
          `}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                {task.type === 'milestone' && (
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-gradient-to-br from-macaron-pink to-macaron-purple flex-shrink-0" />
                )}
                <h4 className="font-display font-semibold text-macaron-dark text-sm truncate">{task.title}</h4>
              </div>
              <p className="text-xs text-gray-400 truncate mb-2">{task.description}</p>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${priorityCfg.bg} ${priorityCfg.color}`}>
                  {priorityCfg.label}
                </span>
                {task.remainingHours > 0 && (
                  <span className="flex items-center gap-0.5 text-[10px] text-gray-400">
                    <Clock size={10} />
                    {task.remainingHours}h
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              {assignee && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: assignee.color + '40' }}>
                  {assignee.avatar}
                </div>
              )}
            </div>
          </div>
          {task.remainingHours > 0 && (
            <div className="mt-2 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-macaron-mint to-macaron-purple transition-all duration-500"
                style={{ width: `${Math.min(100, (task.remainingHours / 16) * 100)}%` }}
              />
            </div>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); emitTaskDelete(task.id); }}
            className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-red-300 hover:text-red-500"
          >
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </Draggable>
  );
}

function AddCardForm({ lane, onAdd }: { lane: Lane; onAdd: (title: string, desc: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(title.trim(), desc.trim());
    setTitle('');
    setDesc('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-2 flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-macaron-dark hover:bg-white/60 rounded-card transition-colors"
      >
        <Plus size={14} /> 添加任务
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-card p-3 shadow-card animate-scale-in">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="任务标题"
        className="w-full text-sm font-display font-semibold mb-1.5 border-b border-gray-100 pb-1.5 outline-none focus:border-macaron-mint placeholder:text-gray-300"
        autoFocus
      />
      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="描述（可选）"
        className="w-full text-xs text-gray-400 mb-2 outline-none placeholder:text-gray-300"
      />
      <div className="flex gap-1.5">
        <button type="submit" className="px-3 py-1 text-xs font-semibold bg-macaron-mint text-macaron-dark rounded-lg hover:opacity-80 transition-opacity">
          添加
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-1 text-xs text-gray-400 hover:text-macaron-dark">
          取消
        </button>
      </div>
    </form>
  );
}

export default function Board() {
  const tasks = useStore((s) => s.tasks);
  const highlightedTaskId = useStore((s) => s.highlightedTaskId);
  const members = useStore((s) => s.teamMembers);
  const moveTask = useStore((s) => s.moveTask);
  const updateTask = useStore((s) => s.updateTask);

  const reorder = useCallback((list: Task[], startIndex: number, endIndex: number): Task[] => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result.map((item, idx) => ({ ...item, order: idx }));
  }, []);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, source, destination } = result;

    const startLane = source.droppableId as Lane;
    const endLane = destination.droppableId as Lane;
    const startIndex = source.index;
    const endIndex = destination.index;

    if (startLane === endLane) {
      const laneTasks = tasks
        .filter((t) => t.lane === startLane)
        .sort((a, b) => a.order - b.order);
      const reordered = reorder(laneTasks, startIndex, endIndex);
      reordered.forEach((t) => updateTask(t));
      emitTaskMove({ id: draggableId, lane: endLane, order: endIndex });
    } else {
      const startLaneTasks = tasks
        .filter((t) => t.lane === startLane)
        .sort((a, b) => a.order - b.order);
      const endLaneTasks = tasks
        .filter((t) => t.lane === endLane)
        .sort((a, b) => a.order - b.order);

      const movingTask = startLaneTasks[startIndex];
      const newStartTasks = [...startLaneTasks];
      newStartTasks.splice(startIndex, 1);
      const reorderedStart = newStartTasks.map((t, i) => ({ ...t, order: i }));

      const newEndTasks = [...endLaneTasks];
      const newTask = {
        ...movingTask,
        lane: endLane,
        order: endIndex,
        remainingHours: endLane === 'done' ? 0 : movingTask.remainingHours,
      };
      newEndTasks.splice(endIndex, 0, newTask);
      const reorderedEnd = newEndTasks.map((t, i) => ({ ...t, order: i }));

      reorderedStart.forEach((t) => updateTask(t));
      reorderedEnd.forEach((t) => {
        if (t.id === movingTask.id) {
          moveTask({ ...t, lane: endLane, order: endIndex });
        } else {
          updateTask(t);
        }
      });
      emitTaskMove({ id: draggableId, lane: endLane, order: endIndex });
    }
  }, [tasks, reorder, updateTask, moveTask]);

  const handleAddTask = useCallback((lane: Lane) => (title: string, desc: string) => {
    emitTaskCreate({
      title,
      description: desc,
      priority: 'medium' as const,
      assignee: members[0]?.id || 'm1',
      remainingHours: 4,
      lane,
      type: 'task' as const,
      sprintId: 's1',
    });
  }, [members]);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 h-full overflow-x-auto pb-4 px-1">
        {LANE_CONFIG.map((laneCfg) => {
          const laneTasks = tasks
            .filter((t) => t.lane === laneCfg.key)
            .sort((a, b) => a.order - b.order);

          return (
            <div key={laneCfg.key} className={`flex-1 min-w-[280px] flex flex-col ${laneCfg.bgColor} rounded-card p-3`}>
              <div className={`flex items-center gap-2 mb-3 pb-2 border-b-2 ${laneCfg.color}`}>
                <h3 className="font-display font-bold text-macaron-dark text-sm">{laneCfg.label}</h3>
                <span className="text-[10px] font-semibold bg-white/80 text-gray-500 px-1.5 py-0.5 rounded-full">
                  {laneTasks.length}
                </span>
              </div>
              <Droppable droppableId={laneCfg.key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 min-h-[120px] transition-colors rounded-lg p-1 ${
                      snapshot.isDraggingOver ? 'bg-white/50' : ''
                    }`}
                  >
                    {laneTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isHighlighted={highlightedTaskId === task.id}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
              <AddCardForm lane={laneCfg.key} onAdd={handleAddTask(laneCfg.key)} />
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
