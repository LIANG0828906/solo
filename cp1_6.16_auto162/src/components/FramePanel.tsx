import { useEffect, useRef, useState } from 'react';
import { useEditorStore, type Frame } from '../stores/editorStore';
import { socketClient } from '../utils/socketClient';

function FrameThumbnail({ pixels, size = 48 }: { pixels: (string | null)[][]; size?: number }) {
  const canvasRef = (canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = size;
    canvas.height = size;
    ctx.fillStyle = '#1A1A1A';
    ctx.fillRect(0, 0, size, size);
    const pixelSize = size / 32;
    for (let y = 0; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        const color = pixels[y]?.[x];
        if (color) {
          ctx.fillStyle = color;
          ctx.fillRect(
            Math.floor(x * pixelSize),
            Math.floor(y * pixelSize),
            Math.ceil(pixelSize),
            Math.ceil(pixelSize)
          );
        }
      }
    }
  };

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
        borderRadius: 4,
      }}
    />
  );
}

export function FramePanel() {
  const {
    frames,
    currentFrameIndex,
    addFrame,
    deleteFrame,
    reorderFrames,
    setCurrentFrameIndex,
    updateFrameDuration,
    applyFrameToCanvas,
    setFrames,
    pixels,
    isPlaying,
    setIsPlaying,
    playFrameIndex,
    setPlayFrameIndex,
  } = useEditorStore();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const playTimerRef = useRef<number | null>(null);

  const handleAddFrame = () => {
    const duration = frames[currentFrameIndex]?.duration || 0.2;
    const newFrame: Frame = {
      id: Math.random().toString(36).slice(2, 11),
      pixels: pixels.map((row) => [...row]),
      duration,
    };
    addFrame(duration);
    socketClient.addFrame(newFrame);
  };

  const handleDeleteFrame = (index: number) => {
    deleteFrame(index);
    socketClient.deleteFrame(index);
  };

  const handleSelectFrame = (index: number) => {
    setCurrentFrameIndex(index);
    socketClient.selectFrame(index);
  };

  const handleApplyFrame = (index: number) => {
    applyFrameToCanvas(index);
    socketClient.selectFrame(index);
    if (frames[index]) {
      socketClient.setPixels(frames[index].pixels);
    }
  };

  const handleDurationChange = (index: number, duration: number) => {
    updateFrameDuration(index, duration);
    socketClient.updateFrameDuration(index, duration);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (toIndex: number) => {
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      reorderFrames(draggedIndex, toIndex);
      socketClient.reorderFrames(draggedIndex, toIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  useEffect(() => {
    const un = socketClient.on('frames_update', (data: unknown) => {
      const d = data as { frames: Frame[]; currentFrameIndex: number };
      setFrames(d.frames, d.currentFrameIndex);
    });
    const un2 = socketClient.on('select_frame', (data: unknown) => {
      const index = data as number;
      setCurrentFrameIndex(index);
      applyFrameToCanvas(index);
    });
    return () => {
      un();
      un2();
    };
  }, [setFrames, setCurrentFrameIndex, applyFrameToCanvas]);

  useEffect(() => {
    if (!isPlaying || frames.length === 0) {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
      return;
    }

    const currentFrame = frames[playFrameIndex % frames.length];
    const duration = (currentFrame?.duration || 0.2) * 1000;
    const expectedTime = performance.now() + duration;

    playTimerRef.current = window.setTimeout(() => {
      setPlayFrameIndex((prev) => (prev + 1) % frames.length);
    }, Math.max(50, duration));

    // optional drift logging if needed, using expectedTime
    void expectedTime;

    return () => {
      if (playTimerRef.current) {
        clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
    };
  }, [isPlaying, playFrameIndex, frames, setPlayFrameIndex]);

  const exportSpriteSheet = () => {
    if (frames.length === 0) return;

    const spriteSize = 32;
    const canvas = document.createElement('canvas');
    canvas.width = spriteSize * frames.length;
    canvas.height = spriteSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    frames.forEach((frame, i) => {
      for (let y = 0; y < 32; y++) {
        for (let x = 0; x < 32; x++) {
          const color = frame.pixels[y]?.[x];
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(i * spriteSize + x, y, 1, 1);
          }
        }
      }
    });

    const link = document.createElement('a');
    link.download = `spritesheet_${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <h3
          style={{
            color: '#E0E0E0',
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          帧列表 ({frames.length}/12)
        </h3>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        <button
          onClick={handleAddFrame}
          disabled={frames.length >= 12 || isPlaying}
          style={{
            flex: 1,
            padding: '8px 12px',
            background: '#00BFA5',
            color: '#1A1A1A',
            border: 'none',
            borderRadius: 6,
            cursor: frames.length >= 12 || isPlaying ? 'not-allowed' : 'pointer',
            fontSize: 12,
            fontWeight: 600,
            transition: 'all 0.2s',
            opacity: frames.length >= 12 || isPlaying ? 0.5 : 1,
          }}
        >
          + 保存帧
        </button>
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={frames.length === 0}
          style={{
            padding: '8px 14px',
            background: isPlaying ? '#FF6B6B' : '#3a3a3a',
            color: '#E0E0E0',
            border: '1px solid #555555',
            borderRadius: 6,
            cursor: frames.length === 0 ? 'not-allowed' : 'pointer',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all 0.2s',
            opacity: frames.length === 0 ? 0.5 : 1,
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          onClick={exportSpriteSheet}
          disabled={frames.length === 0 || isPlaying}
          style={{
            padding: '8px 14px',
            background: '#3a3a3a',
            color: '#E0E0E0',
            border: '1px solid #555555',
            borderRadius: 6,
            cursor: frames.length === 0 || isPlaying ? 'not-allowed' : 'pointer',
            fontSize: 12,
            transition: 'all 0.2s',
            opacity: frames.length === 0 || isPlaying ? 0.5 : 1,
          }}
          title="导出精灵图"
        >
          ⬇
        </button>
      </div>

      {frames.length === 0 ? (
        <div
          style={{
            color: '#888888',
            fontSize: 12,
            textAlign: 'center',
            padding: 32,
            border: '1px dashed #444444',
            borderRadius: 8,
          }}
        >
          暂无帧，编辑画布后点击
          <br />
          「保存帧」添加动画帧
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {frames.map((frame, index) => {
            const isCurrent = currentFrameIndex === index;
            const isActiveDuringPlay = isPlaying && playFrameIndex % frames.length === index;
            return (
              <div
                key={frame.id}
                draggable={!isPlaying}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => {
                  setDraggedIndex(null);
                  setDragOverIndex(null);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: 8,
                  background: '#1A1A1A',
                  border: `2px solid ${
                    isCurrent || isActiveDuringPlay ? '#00BFA5' : '#333333'
                  }`,
                  borderRadius: 8,
                  transition: 'all 0.2s',
                  cursor: isPlaying ? 'default' : draggedIndex === index ? 'grabbing' : 'grab',
                  opacity: draggedIndex !== null && dragOverIndex === index ? 0.7 : 1,
                  transform: dragOverIndex === index && draggedIndex !== index ? 'translateY(2px)' : 'none',
                }}
              >
                <div
                  style={{
                    width: 20,
                    textAlign: 'center',
                    fontSize: 12,
                    fontWeight: 700,
                    color: '#E0E0E0',
                    flexShrink: 0,
                  }}
                >
                  {index + 1}
                </div>

                <div
                  onClick={() => !isPlaying && handleApplyFrame(index)}
                  onDoubleClick={() => !isPlaying && handleSelectFrame(index)}
                  style={{ cursor: isPlaying ? 'default' : 'pointer', flexShrink: 0 }}
                >
                  <FrameThumbnail pixels={frame.pixels} size={48} />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: '#E0E0E0', fontSize: 11 }}>时长:</span>
                    <input
                      type="number"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={frame.duration.toFixed(1)}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) {
                          const clamped = Math.max(0.1, Math.min(1, val));
                          handleDurationChange(index, clamped);
                        }
                      }}
                      disabled={isPlaying}
                      style={{
                        width: 50,
                        background: '#2C2C2C',
                        border: '1px solid #555555',
                        borderRadius: 4,
                        color: '#E0E0E0',
                        fontSize: 11,
                        padding: '2px 4px',
                        outline: 'none',
                      }}
                    />
                    <span style={{ color: '#888888', fontSize: 11 }}>s</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteFrame(index)}
                  disabled={isPlaying}
                  style={{
                    width: 26,
                    height: 26,
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 4,
                    color: '#FF6B6B',
                    fontSize: 16,
                    cursor: isPlaying ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: isPlaying ? 0.3 : 1,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                  }}
                  title="删除帧"
                  onMouseEnter={(e) => {
                    if (!isPlaying) {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,107,107,0.2)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
