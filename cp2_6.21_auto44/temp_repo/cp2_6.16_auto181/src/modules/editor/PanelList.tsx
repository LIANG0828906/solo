import React, { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import type { Panel } from '@/types/story';

const PanelThumbnail: React.FC<{
  panel: Panel;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  index: number;
  isDragging: boolean;
  isRemoving: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  isDropTarget: boolean;
}> = ({
  panel,
  isActive,
  onClick,
  onDelete,
  index,
  isDragging,
  isRemoving,
  onDragStart,
  onDragOver,
  onDrop,
  isDropTarget,
}) => {
  const thumbScale = 160 / panel.width;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
      className={`relative cursor-pointer rounded-lg overflow-hidden shadow-md transition-all ${
        isDragging ? 'opacity-40' : ''
      } ${isRemoving ? 'animate-slide-out-left' : 'animate-slide-up'}`}
      style={{
        border: isActive
          ? '3px solid #E63946'
          : isDropTarget
          ? '2px dashed #3b82f6'
          : '2px solid transparent',
        backgroundColor: isDropTarget ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
        padding: isDropTarget ? '6px' : '4px',
      }}
    >
      <div
        className="relative rounded-lg overflow-hidden"
        style={{
          width: 160,
          height: panel.height * thumbScale,
          backgroundColor: panel.backgroundColor,
          backgroundImage: panel.backgroundImage
            ? `url(${panel.backgroundImage})`
            : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <svg
          viewBox={`0 0 ${panel.width} ${panel.height}`}
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
        >
          {panel.characters.map((ch) => (
            <g key={ch.id}>
              <text
                x={ch.x}
                y={ch.y + 12}
                textAnchor="middle"
                fontSize="48"
              >
                {ch.emoji}
              </text>
            </g>
          ))}
        </svg>

        <div
          className="absolute top-1 left-1 font-bangers text-sm px-2 py-0.5 rounded"
          style={{ backgroundColor: 'rgba(74, 44, 42, 0.8)', color: '#FFF8E7' }}
        >
          #{index + 1}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-2 right-2 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
        style={{ backgroundColor: '#E63946' }}
      >
        ✕
      </button>
    </div>
  );
};

interface PanelListProps {
  onCloseDrawer?: () => void;
}

export const PanelList: React.FC<PanelListProps> = ({ onCloseDrawer }) => {
  const {
    story,
    currentPanelIndex,
    setCurrentPanelIndex,
    addPanel,
    addingPanel,
    deletePanel,
    confirmDeletePanel,
    cancelDeletePanel,
    removingPanelId,
    reorderPanels,
  } = useStore();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const handleAddPanel = () => {
    addPanel();
  };

  return (
    <>
      <div className="sidebar-desktop w-[220px] h-full flex flex-col p-3 overflow-hidden border-r-2" style={{ borderColor: 'rgba(74,44,42,0.1)' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bangers text-xl" style={{ color: '#4A2C2A' }}>
            📖 面板列表
          </h3>
          <button
            onClick={handleAddPanel}
            disabled={addingPanel}
            className="w-8 h-8 rounded-full text-white text-xl font-bold flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50"
            style={{ backgroundColor: '#E63946' }}
            title="新增面板"
          >
            +
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {story.panels.map((panel, idx) => (
            <PanelThumbnail
              key={panel.id}
              panel={panel}
              index={idx}
              isActive={idx === currentPanelIndex}
              isDragging={draggedIndex === idx}
              isRemoving={removingPanelId === panel.id}
              isDropTarget={dropTargetIndex === idx && draggedIndex !== idx}
              onClick={() => setCurrentPanelIndex(idx)}
              onDelete={() => deletePanel(panel.id)}
              onDragStart={(e) => {
                setDraggedIndex(idx);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(idx));
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedIndex === null || draggedIndex === idx) return;
                setDropTargetIndex(idx);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIndex !== null && draggedIndex !== idx) {
                  reorderPanels(draggedIndex, idx);
                }
                setDraggedIndex(null);
                setDropTargetIndex(null);
              }}
            />
          ))}

          {addingPanel && (
            <div className="drag-placeholder flex items-center justify-center" style={{ height: '140px' }}>
              <span style={{ color: '#3b82f6' }}>新增中...</span>
            </div>
          )}
        </div>

        <div
          className="mt-3 py-2 text-center text-xs rounded-lg"
          style={{ backgroundColor: 'rgba(74,44,42,0.05)', color: '#4A2C2A' }}
        >
          共 {story.panels.length} 个面板
        </div>
      </div>

      {/* 移动端抽屉 */}
      <div
        className={`mobile-drawer fixed top-0 left-0 h-full z-40 transition-transform duration-300 shadow-2xl ${
          onCloseDrawer ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          width: '260px',
          backgroundColor: '#FFF8E7',
        }}
        onMouseEnter={() => { dragCounter.current = 0; }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{ backgroundColor: '#4A2C2A' }}
        >
          <h3 className="font-bangers text-xl" style={{ color: '#FFF8E7' }}>
            📖 面板列表
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAddPanel}
              disabled={addingPanel}
              className="w-8 h-8 rounded-full text-white text-xl font-bold flex items-center justify-center"
              style={{ backgroundColor: '#E63946' }}
            >
              +
            </button>
            <button
              onClick={onCloseDrawer}
              className="text-white text-2xl"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 h-[calc(100%-60px)]">
          {story.panels.map((panel, idx) => (
            <PanelThumbnail
              key={panel.id}
              panel={panel}
              index={idx}
              isActive={idx === currentPanelIndex}
              isDragging={draggedIndex === idx}
              isRemoving={removingPanelId === panel.id}
              isDropTarget={dropTargetIndex === idx && draggedIndex !== idx}
              onClick={() => {
                setCurrentPanelIndex(idx);
                onCloseDrawer?.();
              }}
              onDelete={() => deletePanel(panel.id)}
              onDragStart={(e) => {
                setDraggedIndex(idx);
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', String(idx));
              }}
              onDragOver={(e) => {
                e.preventDefault();
                if (draggedIndex === null || draggedIndex === idx) return;
                setDropTargetIndex(idx);
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedIndex !== null && draggedIndex !== idx) {
                  reorderPanels(draggedIndex, idx);
                }
                setDraggedIndex(null);
                setDropTargetIndex(null);
              }}
            />
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={!!removingPanelId}
        title="删除面板"
        message="确定要删除此面板吗？此操作无法撤销。"
        confirmText="删除"
        onConfirm={confirmDeletePanel}
        onCancel={cancelDeletePanel}
      />
    </>
  );
};
