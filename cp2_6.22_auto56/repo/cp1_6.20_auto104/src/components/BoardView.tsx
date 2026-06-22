import { useState, useRef, useCallback } from 'react';
import { Plus, X, User, Clock, Tag, Image, Box, Music, File, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import type { Task, TaskStatus, TaskPriority, TaskType, Asset, AssetStatus } from '../types';
import { TASK_STATUS_LABELS, TASK_TYPE_LABELS, PRIORITY_LABELS, ASSET_TYPE_LABELS } from '../types';
import { useStore } from '../store';

const COLUMNS: TaskStatus[] = ['unassigned', 'in_progress', 'testing', 'completed'];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#60a5fa',
  medium: '#fbbf24',
  high: '#f97316',
  urgent: '#ef4444',
};

const ASSET_ICONS: Record<Asset['type'], typeof Image> = {
  image: Image,
  '3d_model': Box,
  audio: Music,
  other: File,
};

interface BoardViewProps {
  projectId: string;
  milestoneId: string;
  tasks: Task[];
  assets: Asset[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (id: string, data: Partial<Task>) => void;
  onDeleteTask: (id: string) => void;
  onAddAsset: (asset: Asset) => void;
  onUpdateAsset: (id: string, data: Partial<Asset>) => void;
  onDeleteAsset: (id: string) => void;
}

export default function BoardView({
  projectId,
  milestoneId,
  tasks,
  assets,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddAsset,
  onUpdateAsset,
}: BoardViewProps) {
  const { updateTaskStatus } = useStore();
  const dragOverColumn = useRef<string | null>(null);
  const [addingToColumn, setAddingToColumn] = useState<TaskStatus | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newTaskType, setNewTaskType] = useState<TaskType>('programming');
  const [newHours, setNewHours] = useState(4);
  const [addingAssetTo, setAddingAssetTo] = useState<string | null>(null);
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState<Asset['type']>('image');

  const columnTasks = useCallback(
    (status: TaskStatus) => tasks.filter((t) => t.status === status),
    [tasks]
  );

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    const el = e.currentTarget as HTMLElement;
    requestAnimationFrame(() => el.classList.add('task-card-drag'));
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove('task-card-drag');
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();

  const handleDragEnter = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    dragOverColumn.current = status;
    (e.currentTarget as HTMLElement).classList.add('kanban-column-drop');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (
      e.clientX <= rect.left || e.clientX >= rect.right ||
      e.clientY <= rect.top || e.clientY >= rect.bottom
    ) {
      (e.currentTarget as HTMLElement).classList.remove('kanban-column-drop');
      dragOverColumn.current = null;
    }
  };

  const handleDrop = async (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('kanban-column-drop');
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === status) return;
    await updateTaskStatus(taskId, status);
  };

  const handleAddTask = async (status: TaskStatus) => {
    if (!newTitle.trim()) return;
    const res = await fetch(`/api/milestones/${milestoneId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle.trim(),
        priority: newPriority,
        taskType: newTaskType,
        estimatedHours: newHours,
        status,
        assignee: null,
        assetIds: [],
      }),
    });
    const task = await res.json();
    onAddTask(task);
    setNewTitle('');
    setNewPriority('medium');
    setNewTaskType('programming');
    setNewHours(4);
    setAddingToColumn(null);
  };

  const handleAddAsset = async (taskId: string) => {
    if (!assetName.trim()) return;
    const res = await fetch(`/api/projects/${projectId}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: assetName.trim(), type: assetType, status: 'in_production' }),
    });
    const asset = await res.json();
    onAddAsset(asset);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      const updated = [...task.assetIds, asset.id];
      await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetIds: updated }),
      });
      onUpdateTask(taskId, { assetIds: updated });
    }
    setAssetName('');
    setAssetType('image');
    setAddingAssetTo(null);
  };

  const toggleAssetStatus = (asset: Asset) => {
    const next: AssetStatus = asset.status === 'completed' ? 'in_production' : 'completed';
    fetch(`/api/assets/${asset.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    }).then(() => onUpdateAsset(asset.id, { status: next }));
  };

  return (
    <div className="flex gap-4 h-full overflow-x-auto">
      {COLUMNS.map((status) => {
        const colTasks = columnTasks(status);
        return (
          <div
            key={status}
            className="glass rounded-xl min-w-[280px] w-[280px] flex flex-col transition-colors"
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            <div className="p-3 flex justify-between items-center border-b border-white/5">
              <span className="text-xs font-semibold text-text-primary">
                {TASK_STATUS_LABELS[status]}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-text-secondary">
                {colTasks.length}
              </span>
            </div>

            <div className="p-2 flex-1 overflow-y-auto space-y-2">
              {colTasks.map((task) => {
                const isUrgent = task.priority === 'urgent';
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className={`glass rounded-lg p-3 cursor-grab transition-all ${
                      isUrgent ? 'urgent-pulse animate-urgent-blink' : ''
                    }`}
                    style={{ borderLeftWidth: 3, borderLeftColor: PRIORITY_COLORS[task.priority] }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-text-primary leading-tight">
                        {task.title}
                      </span>
                      <button
                        onClick={() => onDeleteTask(task.id)}
                        className="p-0.5 hover:bg-white/10 rounded flex-shrink-0"
                      >
                        <X size={12} className="text-text-muted" />
                      </button>
                    </div>

                    <div className="flex gap-2 mt-2 text-[10px] text-text-secondary">
                      <span className="px-1.5 py-0.5 rounded bg-white/5">
                        {TASK_TYPE_LABELS[task.taskType]}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Clock size={10} />
                        {task.estimatedHours}h
                      </span>
                      {task.assignee ? (
                        <span className="w-4 h-4 rounded-full bg-primary-from/40 flex items-center justify-center text-[8px] text-text-primary font-bold">
                          {task.assignee[0]}
                        </span>
                      ) : (
                        <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
                          <User size={8} className="text-text-muted" />
                        </span>
                      )}
                    </div>

                    {task.assetIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.assetIds.map((aid) => {
                          const asset = assets.find((a) => a.id === aid);
                          if (!asset) return null;
                          const Icon = ASSET_ICONS[asset.type];
                          const color =
                            asset.status === 'completed'
                              ? 'text-green-400 bg-green-400/10'
                              : 'text-blue-400 bg-blue-400/10';
                          return (
                            <button
                              key={aid}
                              onClick={() => toggleAssetStatus(asset)}
                              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] ${color} hover:opacity-80 transition-opacity`}
                            >
                              <Icon size={8} />
                              {asset.name}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="flex items-center gap-1 mt-2">
                      <button
                        onClick={() => {
                          setAddingAssetTo(addingAssetTo === task.id ? null : task.id);
                          setAssetName('');
                          setAssetType('image');
                        }}
                        className="p-0.5 hover:bg-white/10 rounded"
                      >
                        <Plus size={10} className="text-text-muted" />
                      </button>
                      {addingAssetTo === task.id && (
                        <div className="flex items-center gap-1 flex-1">
                          <input
                            value={assetName}
                            onChange={(e) => setAssetName(e.target.value)}
                            placeholder="资产名"
                            className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-[10px] text-text-primary focus:outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddAsset(task.id)}
                          />
                          <select
                            value={assetType}
                            onChange={(e) => setAssetType(e.target.value as Asset['type'])}
                            className="bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px] text-text-primary focus:outline-none"
                          >
                            {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAddAsset(task.id)}
                            className="text-[10px] text-primary-from hover:underline"
                          >
                            确定
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-2 border-t border-white/5">
              {addingToColumn === status ? (
                <div className="space-y-1.5">
                  <input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="任务标题"
                    className="w-full bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-primary-from"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask(status)}
                  />
                  <div className="flex gap-1">
                    <select
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                      className="flex-1 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px] text-text-primary focus:outline-none"
                    >
                      {Object.entries(PRIORITY_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <select
                      value={newTaskType}
                      onChange={(e) => setNewTaskType(e.target.value as TaskType)}
                      className="flex-1 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px] text-text-primary focus:outline-none"
                    >
                      {Object.entries(TASK_TYPE_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={newHours}
                      onChange={(e) => setNewHours(Number(e.target.value))}
                      className="w-12 bg-white/5 border border-white/10 rounded px-1 py-0.5 text-[10px] text-text-primary focus:outline-none"
                      min={0}
                    />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleAddTask(status)}
                      className="flex-1 text-[10px] py-0.5 rounded bg-primary-gradient text-white hover:opacity-90 transition-opacity"
                    >
                      添加
                    </button>
                    <button
                      onClick={() => setAddingToColumn(null)}
                      className="px-2 py-0.5 text-[10px] rounded border border-white/10 text-text-secondary hover:bg-white/5"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setAddingToColumn(status)}
                  className="w-full flex items-center justify-center gap-1 py-1.5 rounded text-[10px] text-text-muted hover:bg-white/5 hover:text-text-secondary transition-colors"
                >
                  <Plus size={12} />
                  添加任务
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
