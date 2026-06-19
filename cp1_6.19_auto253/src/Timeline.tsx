import React, { useRef, useEffect, useState } from 'react';
import { useAppStore } from './store';
import { drawFrameToCanvas } from './utils/frame';
import { GRID_SIZE, THUMBNAIL_SIZE } from './utils/palette';
import type { Frame } from './types';

const PIXEL = THUMBNAIL_SIZE / GRID_SIZE;

interface FrameThumbProps {
  frame: Frame;
  index: number;
  isCurrent: boolean;
  isDragging: boolean;
  editorColor?: string;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent) => void;
}

const FrameThumb: React.FC<FrameThumbProps> = ({
  frame,
  index,
  isCurrent,
  isDragging,
  editorColor,
  onClick,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawFrameToCanvas(ctx, frame.data, THUMBNAIL_SIZE, PIXEL);
  }, [frame.data]);

  return (
    <div
      className={`frame-thumb ${isCurrent ? 'current' : ''} ${isDragging ? 'dragging' : ''}`}
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
    >
      <canvas ref={canvasRef} className="frame-thumb-canvas" width={THUMBNAIL_SIZE} height={THUMBNAIL_SIZE} />
      <span className="frame-index">{index + 1}</span>
      {editorColor && (
        <span className="frame-editor-dot" style={{ background: editorColor }} />
      )}
    </div>
  );
};

const Timeline: React.FC = () => {
  const frames = useAppStore((s) => s.frames);
  const currentFrameId = useAppStore((s) => s.currentFrameId);
  const setCurrentFrame = useAppStore((s) => s.setCurrentFrame);
  const addFrame = useAppStore((s) => s.addFrame);
  const removeFrame = useAppStore((s) => s.removeFrame);
  const reorderFrames = useAppStore((s) => s.reorderFrames);
  const incrementEditCount = useAppStore((s) => s.incrementEditCount);
  const onlineUsers = useAppStore((s) => s.onlineUsers);
  const editCount = useAppStore((s) => s.editCount);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const handleAddFrame = () => {
    addFrame();
    incrementEditCount();
    const emitFn = window.socketEmitFramesUpdate;
    if (emitFn) {
      const state = useAppStore.getState();
      emitFn(state.frames);
    }
  };

  const handleRemoveFrame = () => {
    if (frames.length <= 1) return;
    removeFrame(currentFrameId);
    incrementEditCount();
    const emitFn = window.socketEmitFramesUpdate;
    if (emitFn) {
      setTimeout(() => {
        const state = useAppStore.getState();
        emitFn(state.frames);
      }, 0);
    }
  };

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragIndex !== null && index !== dragIndex) {
      setDropIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
      reorderFrames(dragIndex, dropIndex);
      incrementEditCount();
      const emitFn = window.socketEmitFramesUpdate;
      if (emitFn) {
        setTimeout(() => {
          const state = useAppStore.getState();
          emitFn(state.frames);
        }, 0);
      }
    }
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleDrop = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    setDropIndex(index);
  };

  const getEditorColor = (frame: Frame): string | undefined => {
    if (!frame.editorId) return undefined;
    const user = onlineUsers.find((u) => u.id === frame.editorId);
    return user?.color;
  };

  return (
    <div className="timeline-panel">
      <div className="timeline-controls">
        <div className="timeline-title">时间轴</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-create" onClick={handleAddFrame} disabled={frames.length >= 50}>
            + 新帧
          </button>
          <button
            className="btn btn-delete"
            onClick={handleRemoveFrame}
            disabled={frames.length <= 1}
          >
            删除
          </button>
        </div>
        <div className="edit-counter">编辑次数: {editCount} | 帧数: {frames.length}/50</div>
      </div>

      <div className="timeline-frames">
        {frames.map((frame, index) => (
          <React.Fragment key={frame.id}>
            {dropIndex === index && dragIndex !== index && <div className="drop-placeholder" />}
            <FrameThumb
              frame={frame}
              index={index}
              isCurrent={frame.id === currentFrameId}
              isDragging={dragIndex === index}
              editorColor={getEditorColor(frame)}
              onClick={() => setCurrentFrame(frame.id)}
              onDragStart={handleDragStart(index)}
              onDragOver={handleDragOver(index)}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop(index)}
            />
          </React.Fragment>
        ))}
        {dropIndex === frames.length && dragIndex !== null && <div className="drop-placeholder" />}
      </div>
    </div>
  );
};

export default Timeline;
