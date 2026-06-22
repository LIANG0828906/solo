import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Clock, Repeat, Trash2, Copy, Plus, GripVertical, Timer } from 'lucide-react';
import { useSpriteStore } from '@/store/spriteStore';
import { imageDataToDataURL } from '@/utils/canvasUtils';
import './Timeline.css';

export const Timeline: React.FC = () => {
  const {
    frames,
    timeline,
    setFrameDuration,
    setFps,
    setLoop,
    setCurrentFrameIndex,
    reorderTimeline,
    removeFromTimeline,
    duplicateFrame,
    insertBlankFrame,
  } = useSpriteStore();

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    index: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const timelineFrames = timeline.frameIds
    .map((id) => frames.find((f) => f.id === id))
    .filter(Boolean) as Array<typeof frames[number]>;

  useEffect(() => {
    const handleClick = () => {
      if (contextMenu?.visible) {
        setContextMenu(null);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

  const handleFrameClick = useCallback((index: number) => {
    setCurrentFrameIndex(index);
  }, [setCurrentFrameIndex]);

  const handleDurationChange = useCallback((frameId: string, value: string) => {
    const duration = parseFloat(value);
    if (!isNaN(duration) && duration > 0) {
      setFrameDuration(frameId, duration);
    }
  }, [setFrameDuration]);

  const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
    setDragIndex(index);
    setIsDragging(true);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragIndex !== null && dropIndex !== null && dragIndex !== dropIndex) {
      let toIndex = dropIndex;
      if (dragIndex < dropIndex) {
        toIndex = dropIndex - 1;
      }
      reorderTimeline(dragIndex, toIndex);
    }
    setDragIndex(null);
    setDropIndex(null);
    setIsDragging(false);
  }, [dragIndex, dropIndex, reorderTimeline]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropIndex(index);
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      index,
    });
  }, []);

  const handleDuplicate = useCallback(() => {
    if (contextMenu) {
      duplicateFrame(contextMenu.index);
      setContextMenu(null);
    }
  }, [contextMenu, duplicateFrame]);

  const handleDelete = useCallback(() => {
    if (contextMenu) {
      removeFromTimeline(contextMenu.index);
      setContextMenu(null);
    }
  }, [contextMenu, removeFromTimeline]);

  const handleInsertBlank = useCallback(() => {
    if (contextMenu) {
      insertBlankFrame(contextMenu.index);
      setContextMenu(null);
    }
  }, [contextMenu, insertBlankFrame]);

  return (
    <div className="timeline-panel">
      <div className="panel-header">
        <Timer size={16} />
        <span>时间轴</span>
        <span className="frame-count">{timeline.frameIds.length} 帧</span>
      </div>

      <div className="timeline-controls">
        <div className="control-group">
          <label className="control-label">
            <Clock size={14} />
            播放速度
          </label>
          <div className="fps-control">
            <input
              type="range"
              min="1"
              max="60"
              value={timeline.fps}
              onChange={(e) => setFps(parseInt(e.target.value))}
              className="fps-slider"
            />
            <span className="fps-value">{timeline.fps} FPS</span>
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">
            <Repeat size={14} />
            循环播放
          </label>
          <button
            className={`toggle-btn ${timeline.loop ? 'active' : ''}`}
            onClick={() => setLoop(!timeline.loop)}
          >
            {timeline.loop ? '开启' : '关闭'}
          </button>
        </div>
      </div>

      <div
        className="timeline-track"
        ref={containerRef}
        onDragOver={(e) => {
          e.preventDefault();
          if (timelineFrames.length === 0) {
            setDropIndex(0);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          if (timelineFrames.length === 0 && dropIndex === 0) {
            setDropIndex(null);
          }
        }}
      >
        {timelineFrames.length === 0 ? (
          <div className="timeline-empty">
            <Plus size={24} />
            <p>时间轴为空</p>
            <p className="empty-hint">将帧拖拽到这里添加到动画序列</p>
          </div>
        ) : (
          <div className="timeline-frames" onDragEnd={handleDragEnd}>
            {timelineFrames.map((frame, index) => {
              const dataUrl = imageDataToDataURL(frame.imageData);
              const isCurrent = index === timeline.currentFrameIndex;
              const isDraggingSelf = dragIndex === index;
              const isDropTarget = dropIndex === index;

              return (
                <div
                  key={`${frame.id}-${index}`}
                  className={`timeline-frame-card ${isCurrent ? 'current' : ''} ${isDraggingSelf ? 'dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(index, e)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={() => {
                    if (dropIndex === index) {
                      setDropIndex(null);
                    }
                  }}
                  onClick={() => handleFrameClick(index)}
                  onContextMenu={(e) => handleContextMenu(e, index)}
                >
                  {isDropTarget && !isDraggingSelf && (
                    <div className="drop-indicator" />
                  )}

                  <div className="card-grip">
                    <GripVertical size={12} />
                  </div>

                  <div className="card-thumbnail">
                    <img src={dataUrl} alt={frame.name} />
                  </div>

                  <div className="card-info">
                    <span className="card-name">{frame.name}</span>
                    <div className="card-duration">
                      <Clock size={10} />
                      <input
                        type="number"
                        value={frame.duration}
                        step="0.05"
                        min="0.01"
                        onChange={(e) => handleDurationChange(frame.id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>s</span>
                    </div>
                  </div>

                  <span className="card-index">{index + 1}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {contextMenu?.visible && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="context-item" onClick={handleDuplicate}>
            <Copy size={14} />
            复制帧
          </button>
          <button className="context-item" onClick={handleInsertBlank}>
            <Plus size={14} />
            插入空白帧
          </button>
          <div className="context-divider" />
          <button className="context-item danger" onClick={handleDelete}>
            <Trash2 size={14} />
            删除帧
          </button>
        </div>
      )}
    </div>
  );
};
