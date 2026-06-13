import { useState, useEffect } from 'react';
import {
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Plus,
  List,
  LayoutGrid,
  Filter,
  User,
} from 'lucide-react';
import type { KeyResult, SubTask, SubTaskStatus } from '@/types';
import { useOkrStore } from '@/store/useOkrStore';
import {
  getProgressInfo,
  getTypeLabel,
  getTypeBadgeClass,
} from '@/modules/okr/utils/progressCalculator';

interface KeyResultCardProps {
  kr: KeyResult;
}

type ViewMode = 'list' | 'kanban';

const STATUS_OPTIONS: { value: SubTaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: '待办', color: 'bg-gray-100 text-gray-600' },
  { value: 'in_progress', label: '进行中', color: 'bg-teal-50 text-teal-700' },
  { value: 'done', label: '已完成', color: 'bg-green-50 text-green-700' },
];

function getStatusLabel(status: SubTaskStatus) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.label || status;
}

function getStatusColor(status: SubTaskStatus) {
  return STATUS_OPTIONS.find((s) => s.value === status)?.color || '';
}

export default function KeyResultCard({ kr }: KeyResultCardProps) {
  const [pressed, setPressed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState(kr.assignee);

  const allSubTasks = useOkrStore((s) => s.subTasks.filter((st) => st.keyResultId === kr.id));
  const addSubTask = useOkrStore((s) => s.addSubTask);
  const updateSubTask = useOkrStore((s) => s.updateSubTask);
  const deleteSubTask = useOkrStore((s) => s.deleteSubTask);
  const updateKeyResult = useOkrStore((s) => s.updateKeyResult);
  const deleteKeyResult = useOkrStore((s) => s.deleteKeyResult);
  const [editingValue, setEditingValue] = useState<string | null>(null);

  const progress = getProgressInfo(kr.type, kr.initialValue, kr.targetValue, kr.currentValue);

  const assignees = Array.from(new Set(allSubTasks.map((t) => t.assignee)));
  const filteredTasks = assigneeFilter === 'all'
    ? allSubTasks
    : allSubTasks.filter((t) => t.assignee === assigneeFilter);

  useEffect(() => {
    setAssigneeFilter('all');
  }, [kr.id]);

  const handleCardDown = () => setPressed(true);
  const handleCardUp = () => setTimeout(() => setPressed(false), 150);

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    if (allSubTasks.length >= 10) return;
    const newTask: SubTask = {
      id: `st-${Date.now()}`,
      keyResultId: kr.id,
      title: newTaskTitle.trim(),
      status: 'todo',
      assignee: newTaskAssignee || kr.assignee,
    };
    addSubTask(newTask);
    setNewTaskTitle('');
    setShowAddTask(false);
  };

  const toggleTaskDone = (task: SubTask) => {
    const newStatus: SubTaskStatus = task.status === 'done' ? 'todo' : 'done';
    updateSubTask(task.id, { status: newStatus });
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#0d9488', '#14b8a6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
  };

  return (
    <div
      data-kr-id={kr.id}
      className="group bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md overflow-hidden select-none"
      style={{
        transform: pressed ? 'scale(1.02)' : 'scale(1)',
        transition: 'transform 150ms ease-out, box-shadow 200ms ease',
      }}
      onMouseDown={handleCardDown}
      onMouseUp={handleCardUp}
      onMouseLeave={() => setPressed(false)}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${getTypeBadgeClass(
                  kr.type
                )}`}
              >
                {getTypeLabel(kr.type)}
              </span>
              <span className="text-[13px] font-semibold text-gray-800 truncate" style={{ fontFamily: 'Outfit, sans-serif' }}>
                {kr.title}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2.5">
              <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden relative">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progress.percentage}%`,
                    backgroundColor: progress.color,
                    transition: `width 1000ms ease-in-out, background-color 1000ms ease-in-out`,
                  }}
                />
              </div>
              <span
                className={`text-[13px] font-bold tabular-nums min-w-[42px] text-right ${progress.textClass}`}
                style={{ transition: 'color 1000ms ease-in-out' }}
              >
                {progress.percentage}%
              </span>
            </div>
            <div className="flex items-center justify-between mt-2.5">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] text-white font-bold"
                  style={{ backgroundColor: getAvatarColor(kr.assignee) }}
                >
                  {kr.assignee.charAt(0)}
                </div>
                <span className="text-[11px] text-gray-500">{kr.assignee}</span>
                {kr.type !== 'boolean' && (
                  <span className="text-[11px] text-gray-400 ml-1">
                    {kr.currentValue} / {kr.targetValue}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button
                  onClick={() => {
                    setEditingValue(String(kr.currentValue));
                  }}
                  className="p-1 rounded hover:bg-gray-100 transition-colors"
                  title="编辑当前值"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <button
                  onClick={() => deleteKeyResult(kr.id)}
                  className="p-1 rounded hover:bg-red-50 transition-colors"
                  title="删除"
                >
                  <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label={expanded ? '收起子任务' : '展开子任务'}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>

        {editingValue !== null && (
          <div className="mt-3 flex items-center gap-2 pt-3 border-t border-gray-50">
            <span className="text-xs text-gray-500">当前值:</span>
            <input
              autoFocus
              type="number"
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              className="w-24 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:border-teal-400"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = parseFloat(editingValue);
                  if (!isNaN(val)) {
                    updateKeyResult(kr.id, { currentValue: val });
                  }
                  setEditingValue(null);
                } else if (e.key === 'Escape') {
                  setEditingValue(null);
                }
              }}
              onBlur={() => {
                const val = parseFloat(editingValue);
                if (!isNaN(val)) {
                  updateKeyResult(kr.id, { currentValue: val });
                }
                setEditingValue(null);
              }}
            />
            {kr.type === 'boolean' && (
              <span className="text-[11px] text-gray-400">(布尔型: 0或1)</span>
            )}
          </div>
        )}
      </div>

      <div
        className="overflow-hidden border-t border-gray-50 transition-all duration-300 ease-in-out"
        style={{
          maxHeight: expanded ? '600px' : '0',
          opacity: expanded ? 1 : 0,
        }}
      >
        <div className="p-4 bg-gray-50/60">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-gray-600">
                子任务 ({allSubTasks.length}/10)
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex bg-white rounded-md border border-gray-200 p-0.5">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded ${
                    viewMode === 'list' ? 'bg-teal-50 text-teal-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="列表视图"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-1 rounded ${
                    viewMode === 'kanban' ? 'bg-teal-50 text-teal-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="看板视图"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>

              {assignees.length > 0 && (
                <select
                  value={assigneeFilter}
                  onChange={(e) => setAssigneeFilter(e.target.value)}
                  className="h-7 text-[11px] border border-gray-200 rounded-md px-2 bg-white text-gray-600 focus:outline-none"
                >
                  <option value="all">全部负责人</option>
                  {assignees.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              )}

              {allSubTasks.length < 10 && (
                <button
                  onClick={() => setShowAddTask((v) => !v)}
                  className="h-7 px-2 flex items-center gap-1 rounded-md text-[11px] font-medium text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#0d9488' }}
                >
                  <Plus className="w-3 h-3" />
                  添加
                </button>
              )}
            </div>
          </div>

          {showAddTask && (
            <div className="mb-3 p-3 bg-white rounded-lg border border-gray-200 flex flex-col gap-2">
              <input
                autoFocus
                type="text"
                placeholder="子任务标题..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-teal-400"
                onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <User className="w-3 h-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="负责人"
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-24 px-2 py-1 text-[11px] border border-gray-200 rounded focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setShowAddTask(false)}
                    className="px-3 py-1 text-[11px] text-gray-500 rounded-md hover:bg-gray-100"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleAddTask}
                    className="px-3 py-1 text-[11px] text-white rounded-md"
                    style={{ backgroundColor: '#0d9488' }}
                  >
                    确认
                  </button>
                </div>
              </div>
            </div>
          )}

          {filteredTasks.length === 0 ? (
            <div className="py-6 text-center text-[11px] text-gray-400">
              {allSubTasks.length === 0 ? '暂无子任务' : '该负责人无子任务'}
            </div>
          ) : viewMode === 'list' ? (
            <ul className="space-y-1.5">
              {filteredTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-2.5 p-2 bg-white rounded-md border border-gray-100 group/item"
                >
                  <label className="relative flex items-center justify-center flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={task.status === 'done'}
                      onChange={() => toggleTaskDone(task)}
                      className="task-checkbox appearance-none w-4 h-4 rounded border-2 border-gray-300 checked:border-teal-600 cursor-pointer transition-all duration-300"
                      style={{
                        transitionDuration: '300ms',
                      }}
                    />
                    <svg
                      className={`absolute w-2.5 h-2.5 text-white pointer-events-none ${
                        task.status === 'done' ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-50 -rotate-90'
                      }`}
                      style={{
                        transition: 'opacity 300ms ease, transform 300ms ease',
                      }}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </label>
                  <span
                    className={`flex-1 text-[12px] ${
                      task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-700'
                    }`}
                  >
                    {task.title}
                  </span>
                  <select
                    value={task.status}
                    onChange={(e) => updateSubTask(task.id, { status: e.target.value as SubTaskStatus })}
                    className={`text-[10px] px-1.5 py-0.5 rounded border-0 font-medium ${getStatusColor(
                      task.status
                    )}`}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                  <span
                    className="text-[10px] text-gray-500 flex items-center gap-1"
                  >
                    <div
                      className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] text-white font-bold"
                      style={{ backgroundColor: getAvatarColor(task.assignee) }}
                    >
                      {task.assignee.charAt(0)}
                    </div>
                    {task.assignee}
                  </span>
                  <button
                    onClick={() => deleteSubTask(task.id)}
                    className="opacity-0 group-hover/item:opacity-100 p-0.5 rounded hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((col) => (
                <div key={col.value} className="bg-gray-50 rounded-lg p-2 min-h-[100px]">
                  <div className={`text-[10px] font-semibold mb-2 px-1 py-0.5 rounded inline-block ${col.color}`}>
                    {col.label}
                  </div>
                  <div className="space-y-1.5">
                    {filteredTasks
                      .filter((t) => t.status === col.value)
                      .map((task) => (
                        <div
                          key={task.id}
                          className="p-2 bg-white rounded-md border border-gray-100 text-[11px] group/item"
                        >
                          <div
                            className={`${
                              task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-700'
                            }`}
                          >
                            {task.title}
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <div
                              className="w-3 h-3 rounded-full flex items-center justify-center text-[7px] text-white font-bold"
                              style={{ backgroundColor: getAvatarColor(task.assignee) }}
                            >
                              {task.assignee.charAt(0)}
                            </div>
                            <button
                              onClick={() => deleteSubTask(task.id)}
                              className="opacity-0 group-hover/item:opacity-100"
                            >
                              <Trash2 className="w-2.5 h-2.5 text-gray-300 hover:text-red-400" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
