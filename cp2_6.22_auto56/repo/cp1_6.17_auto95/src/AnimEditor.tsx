import { useState, useRef, useCallback, useEffect } from 'react';
import { useAppStore, getCurrentSprite, getCurrentAnimation } from './store';
import { spriteManager } from './SpriteManager';
import type { AnimationClip } from './types';

interface DragState {
  animId: string;
  fromIndex: number;
  currentX: number;
  currentY: number;
  offsetX: number;
  offsetY: number;
}

export function AnimEditor() {
  const currentSprite = useAppStore(getCurrentSprite);
  const currentAnimationId = useAppStore((state) => state.currentAnimationId);
  const expandedAnimations = useAppStore((state) => state.expandedAnimations);
  const toggleAnimationExpanded = useAppStore((state) => state.toggleAnimationExpanded);
  const setCurrentAnimation = useAppStore((state) => state.setCurrentAnimation);
  const setCurrentFrameIndex = useAppStore((state) => state.setCurrentFrameIndex);
  const updateAnimationFrameDuration = useAppStore((state) => state.updateAnimationFrameDuration);
  const reorderAnimationFrames = useAppStore((state) => state.reorderAnimationFrames);
  const currentFrameIndex = useAppStore((state) => state.currentFrameIndex);

  const [dragState, setDragState] = useState<DragState | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [thumbnails, setThumbnails] = useState<Map<string, string>>(new Map());
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentSprite) return;

    const newThumbnails = new Map<string, string>();
    for (let i = 0; i < currentSprite.frames.length; i++) {
      const thumb = spriteManager.createThumbnail(currentSprite, i, 32);
      newThumbnails.set(String(i), thumb);
    }
    setThumbnails(newThumbnails);
  }, [currentSprite]);

  const handleAnimClick = (anim: AnimationClip) => {
    setCurrentAnimation(anim.id);
    setCurrentFrameIndex(0);
  };

  const handleToggleExpand = (e: React.MouseEvent, animId: string) => {
    e.stopPropagation();
    toggleAnimationExpanded(animId);
  };

  const handleDurationChange = (animId: string, frameIdx: number, value: string) => {
    const duration = parseInt(value, 10);
    if (!isNaN(duration)) {
      updateAnimationFrameDuration(animId, frameIdx, duration);
    }
  };

  const handleDragStart = (
    e: React.MouseEvent,
    animId: string,
    frameIndex: number
  ) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    setDragState({
      animId,
      fromIndex: frameIndex,
      currentX: e.clientX,
      currentY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragState || !timelineRef.current) return;

    setDragState((prev) =>
      prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null
    );

    const timelineRect = timelineRef.current.getBoundingClientRect();
    const relX = e.clientX - timelineRect.left;
    const frameWidth = 32 + 4;
    const newDropIndex = Math.max(
      0,
      Math.min(
        Math.floor(relX / frameWidth),
        currentSprite?.metadata.animations.find((a) => a.id === dragState.animId)?.frames.length || 0
      )
    );
    setDropIndex(newDropIndex);
  }, [dragState, currentSprite]);

  const handleMouseUp = useCallback(() => {
    if (dragState && dropIndex !== null) {
      reorderAnimationFrames(dragState.animId, dragState.fromIndex, dropIndex);
    }
    setDragState(null);
    setDropIndex(null);
  }, [dragState, dropIndex, reorderAnimationFrames]);

  useEffect(() => {
    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, handleMouseMove, handleMouseUp]);

  const getTotalDuration = (anim: AnimationClip): number => {
    return anim.frames.reduce((sum, f) => sum + f.duration, 0);
  };

  if (!currentSprite) {
    return (
      <div className="anim-editor">
        <div className="empty-state">暂无精灵数据</div>
      </div>
    );
  }

  const currentAnim = currentSprite.metadata.animations.find(
    (a) => a.id === currentAnimationId
  );

  return (
    <div className="anim-editor">
      <div className="anim-editor-header">
        <h3>动画剪辑</h3>
        <span className="anim-count">{currentSprite.metadata.animations.length} 个动画</span>
      </div>

      <div className="anim-list">
        {currentSprite.metadata.animations.map((anim) => {
          const isExpanded = expandedAnimations.has(anim.id);
          const isActive = anim.id === currentAnimationId;
          const totalDuration = getTotalDuration(anim);

          return (
            <div
              key={anim.id}
              className={`anim-item ${isActive ? 'active' : ''}`}
            >
              <div
                className="anim-header"
                onClick={() => handleAnimClick(anim)}
              >
                <button
                  className="expand-btn"
                  onClick={(e) => handleToggleExpand(e, anim.id)}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
                  >
                    <polygon points="2,3 10,6 2,9" fill="currentColor" />
                  </svg>
                </button>

                <span className="anim-name">{anim.name}</span>

                <div className="anim-summary">
                  <span className="frame-count">{anim.frames.length}帧</span>
                  <span className="total-time">
                    {(totalDuration / 1000).toFixed(2)}s
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div
                  className="timeline-container"
                  ref={anim.id === dragState?.animId ? timelineRef : null}
                >
                  <div className="timeline-track">
                    {anim.frames.map((frame, idx) => {
                      const isDragging =
                        dragState?.animId === anim.id &&
                        dragState.fromIndex === idx;
                      const isCurrent = isActive && idx === currentFrameIndex;

                      return (
                        <div
                          key={idx}
                          className={`frame-thumb ${isCurrent ? 'current' : ''} ${isDragging ? 'dragging' : ''}`}
                          onMouseDown={(e) => handleDragStart(e, anim.id, idx)}
                          onClick={() => {
                            if (isActive) {
                              setCurrentFrameIndex(idx);
                            }
                          }}
                        >
                          <div className="frame-image">
                            {thumbnails.get(String(frame.frameIndex)) && (
                              <img
                                src={thumbnails.get(String(frame.frameIndex))}
                                alt={`帧 ${idx + 1}`}
                                draggable={false}
                              />
                            )}
                          </div>
                          <input
                            type="number"
                            className="frame-duration"
                            value={frame.duration}
                            min={50}
                            max={500}
                            step={10}
                            onChange={(e) =>
                              handleDurationChange(anim.id, idx, e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      );
                    })}

                    {dragState?.animId === anim.id && dropIndex !== null && (
                      <div
                        className="drop-indicator"
                        style={{
                          left: dropIndex * (32 + 4),
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {dragState && (
        <div
          className="drag-preview"
          style={{
            left: dragState.currentX - dragState.offsetX,
            top: dragState.currentY - dragState.offsetY,
          }}
        >
          <div className="frame-image">
            {currentAnim &&
              thumbnails.get(
                String(currentAnim.frames[dragState.fromIndex]?.frameIndex)
              ) && (
                <img
                  src={thumbnails.get(
                    String(currentAnim.frames[dragState.fromIndex].frameIndex)
                  )}
                  alt="拖拽预览"
                  draggable={false}
                />
              )}
          </div>
        </div>
      )}
    </div>
  );
}
