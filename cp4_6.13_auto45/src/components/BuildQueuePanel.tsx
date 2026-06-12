import React, { useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import type { BuildTask } from '@/types';
import { X, ChevronUp, Clock, GripVertical, Inbox } from 'lucide-react';
import { AnimatedNumber } from './AnimatedNumber';

interface BuildQueuePanelProps {
  isMobile?: boolean;
  isDrawerOpen?: boolean;
  onCloseDrawer?: () => void;
}

const TaskRow = React.memo(function TaskRow({
  task,
  index,
  isDragging,
  dragOverIndex,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onCancel,
  onPrioritize,
}: {
  task: BuildTask;
  index: number;
  isDragging: boolean;
  dragOverIndex: number | null;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (index: number) => void;
  onDragEnd: () => void;
  onCancel: (taskId: string) => void;
  onPrioritize: (taskId: string) => void;
}) {
  const isBuilding = task.status === 'building';
  const isFirst = index === 0;

  return (
    <div
      draggable={!isBuilding}
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={() => onDrop(index)}
      onDragEnd={onDragEnd}
      className={`p-3 rounded-xl transition-all duration-200 fade-in-up relative ${
        isDragging ? 'opacity-40 scale-95' : ''
      } ${dragOverIndex === index && !isBuilding ? 'ring-2 ring-dashed' : ''}`}
      style={{
        background: isBuilding
          ? 'linear-gradient(135deg, rgba(207,181,59,0.25) 0%, rgba(207,181,59,0.08) 100%)'
          : 'rgba(245,230,200,0.8)',
        border: isBuilding ? '1.5px solid var(--gold)' : '1.5px solid rgba(207,181,59,0.3)',
        boxShadow: isBuilding ? '0 0 14px rgba(207,181,59,0.25)' : 'var(--shadow-sm)',
        ringColor: 'var(--gold)',
      }}
    >
      {dragOverIndex === index && !isBuilding && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            border: '2px dashed var(--gold)',
            background: 'rgba(207,181,59,0.08)',
          }}
        />
      )}

      <div className="flex items-center gap-2 mb-2">
        {!isBuilding && (
          <div
            className="text-xs p-0.5 rounded cursor-grab opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--text-brown-light)' }}
          >
            <GripVertical size={14} />
          </div>
        )}
        <div
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{
            background: isBuilding
              ? 'var(--gold)'
              : isFirst
              ? 'rgba(207,181,59,0.4)'
              : 'rgba(61,43,31,0.1)',
            color: isBuilding || isFirst ? 'var(--text-brown)' : 'var(--text-brown-light)',
          }}
        >
          {isBuilding ? '⚡ 建造中' : `#${index + 1}`}
        </div>
        <div
          className="flex-1 text-sm font-bold truncate"
          style={{ color: 'var(--text-brown)' }}
        >
          阶段{task.phaseIndex + 1}: {task.phaseName}
        </div>
      </div>

      <div
        className="h-2 rounded-full overflow-hidden mb-2"
        style={{ background: 'rgba(61,43,31,0.08)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden"
          style={{
            width: `${task.progress}%`,
            background: isBuilding
              ? 'linear-gradient(90deg, var(--gold-dark) 0%, var(--gold-light) 100%)'
              : 'rgba(156,163,175,0.6)',
          }}
        >
          {isBuilding && (
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)',
                animation: 'shimmer 1.5s linear infinite',
              }}
            />
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-xs font-bold" style={{ color: 'var(--gold-dark)' }}>
            <AnimatedNumber value={Math.round(task.progress)} />%
          </div>
          <div
            className="flex items-center gap-1 text-xs"
            style={{ color: 'var(--text-brown-light)' }}
          >
            <Clock size={12} />
            <span>
              {Math.ceil(task.remainingSeconds)}s / {task.estimatedTime}s
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!isFirst && !isBuilding && (
            <button
              onClick={() => onPrioritize(task.taskId)}
              className="p-1.5 rounded-lg transition-all hover:scale-110"
              title="置顶"
              style={{
                background: 'rgba(207,181,59,0.15)',
                color: 'var(--gold-dark)',
              }}
            >
              <ChevronUp size={14} />
            </button>
          )}
          {!isBuilding && (
            <button
              onClick={() => onCancel(task.taskId)}
              className="p-1.5 rounded-lg transition-all hover:scale-110"
              title="取消任务"
              style={{
                background: 'rgba(185,28,28,0.1)',
                color: 'var(--error)',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export const BuildQueuePanel: React.FC<BuildQueuePanelProps> = ({
  isMobile = false,
  isDrawerOpen = false,
  onCloseDrawer,
}) => {
  const buildQueue = useGameStore((s) => s.buildQueue);
  const cancelBuildTask = useGameStore((s) => s.cancelBuildTask);
  const prioritizeBuildTask = useGameStore((s) => s.prioritizeBuildTask);
  const reorderBuildTasks = useGameStore((s) => s.reorderBuildTasks);

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    setDraggingIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (toIndex: number) => {
      if (draggingIndex !== null && draggingIndex !== toIndex) {
        reorderBuildTasks(draggingIndex, toIndex);
      }
      setDraggingIndex(null);
      setDragOverIndex(null);
    },
    [draggingIndex, reorderBuildTasks]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  }, []);

  const panelContent = (
    <div
      className="flex flex-col h-full"
      style={isMobile ? { maxHeight: '75vh' } : undefined}
    >
      <div
        className="px-4 py-3 flex items-center justify-between flex-shrink-0"
        style={{
          borderBottom: '1.5px solid rgba(207,181,59,0.3)',
          background:
            'linear-gradient(180deg, rgba(207,181,59,0.12) 0%, transparent 100%)',
        }}
      >
        <div>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-brown)' }}>
            施工队列
          </h3>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-brown-light)' }}>
            {buildQueue.length} 个任务 · 拖拽调整顺序
          </p>
        </div>
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            background: buildQueue.length > 0 ? 'var(--gold)' : 'rgba(61,43,31,0.1)',
            color: buildQueue.length > 0 ? 'var(--text-brown)' : 'var(--text-brown-light)',
            boxShadow: buildQueue.length > 0 ? 'var(--shadow-sm)' : undefined,
          }}
        >
          {buildQueue.length}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {buildQueue.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 text-center"
            style={{ color: 'var(--text-brown-light)' }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3"
              style={{ background: 'rgba(61,43,31,0.06)' }}
            >
              <Inbox size={24} />
            </div>
            <div className="text-sm font-bold mb-1">队列为空</div>
            <div className="text-xs opacity-75">点击左侧高亮阶段开始建造</div>
          </div>
        ) : (
          buildQueue.map((task, index) => (
            <TaskRow
              key={task.taskId}
              task={task}
              index={index}
              isDragging={draggingIndex === index}
              dragOverIndex={dragOverIndex}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
              onCancel={cancelBuildTask}
              onPrioritize={prioritizeBuildTask}
            />
          ))
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div
        className={`fixed inset-x-0 bottom-0 z-40 transition-transform duration-300 ease-out ${
          isDrawerOpen ? 'translate-y-0' : 'translate-y-[92%]'
        }`}
        style={{
          background: 'var(--bg-papyrus)',
          borderTop: '2px solid var(--gold)',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          boxShadow: '0 -8px 24px rgba(61,43,31,0.2)',
          height: '75vh',
          touchAction: 'none',
        }}
      >
        <div
          className="flex justify-center py-2 cursor-pointer"
          onClick={onCloseDrawer}
        >
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: 'rgba(61,43,31,0.25)' }}
          />
        </div>
        {panelContent}
      </div>
    );
  }

  return (
    <div
      className="w-72 flex-shrink-0 h-full overflow-hidden"
      style={{
        borderLeft: '1.5px solid rgba(207,181,59,0.3)',
        background:
          'linear-gradient(180deg, rgba(245,230,200,1) 0%, rgba(232,212,168,0.35) 100%)',
      }}
    >
      {panelContent}
    </div>
  );
};
