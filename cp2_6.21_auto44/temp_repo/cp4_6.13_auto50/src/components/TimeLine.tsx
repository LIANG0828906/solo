import React, { useState, useRef, useEffect } from 'react';
import { useRecorder, useDispatch } from '../store';
import { HistoryFrame } from '../timeRecorder';
import { getActionTypeLabel } from '../gameEngine';
import { ActionType } from '../gameEngine';

const FRAME_SIZE = 10;
const FRAME_GAP = 2;
const TIMELINE_HEIGHT = 80;

const actionColors: Record<ActionType, string> = {
  move: '#4ade80',
  interact: '#facc15',
  push: '#f87171',
  none: '#555'
};

const TimeLine: React.FC = () => {
  const recorder = useRecorder();
  const dispatch = useDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredFrame, setHoveredFrame] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, []);

  const frameSize = isMobile ? 5 : FRAME_SIZE;
  const frameGap = isMobile ? 1 : FRAME_GAP;

  if (!recorder.isRewindMode) {
    return null;
  }

  const frames = recorder.history;
  const totalWidth = frames.length * (frameSize + frameGap) - frameGap;

  const handleFrameClick = (index: number) => {
    dispatch({ type: 'jumpToFrame', frameIndex: index });
  };

  const handleMouseMove = (e: React.MouseEvent, index: number) => {
    setHoveredFrame(index);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setHoverPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredFrame(null);
  };

  const handleContainerMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frameIndex = Math.floor(x / (frameSize + frameGap));
    if (frameIndex >= 0 && frameIndex < frames.length) {
      setIsDragging(true);
      dispatch({ type: 'jumpToFrame', frameIndex });
    }
  };

  const handleContainerMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const frameIndex = Math.floor(x / (frameSize + frameGap));
    if (frameIndex >= 0 && frameIndex < frames.length) {
      dispatch({ type: 'jumpToFrame', frameIndex });
    }
  };

  const handleContainerMouseUp = () => {
    setIsDragging(false);
  };

  const getTooltipContent = (frame: HistoryFrame) => {
    return `帧 #${frame.frameIndex}\n操作: ${getActionTypeLabel(frame.action)}`;
  };

  return (
    <div
      style={{
        width: '100%',
        maxWidth: 12 * 32,
        height: TIMELINE_HEIGHT,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(4px)',
        borderRadius: 8,
        padding: 12,
        marginTop: 12,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
        fontSize: isMobile ? 10 : 12,
        color: '#ccc'
      }}>
        <span>时间轴 ({frames.length} 帧)</span>
        <span>当前: #{recorder.currentIndex}</span>
      </div>
      
      <div
        ref={containerRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: frameGap,
          overflowX: 'auto',
          paddingBottom: 4,
          cursor: 'pointer',
          userSelect: 'none'
        }}
        onMouseDown={handleContainerMouseDown}
        onMouseMove={handleContainerMouseMove}
        onMouseUp={handleContainerMouseUp}
        onMouseLeave={handleContainerMouseUp}
      >
        {frames.map((frame, index) => {
          const isCurrent = index === recorder.currentIndex;
          return (
            <div
              key={frame.frameIndex}
              onClick={() => handleFrameClick(index)}
              onMouseEnter={(e) => handleMouseMove(e, index)}
              onMouseMove={(e) => handleMouseMove(e, index)}
              onMouseLeave={handleMouseLeave}
              style={{
                width: frameSize,
                height: frameSize,
                backgroundColor: actionColors[frame.action],
                borderRadius: 2,
                flexShrink: 0,
                transition: 'transform 0.1s',
                boxShadow: isCurrent
                  ? `0 0 0 2px #facc15, 0 0 8px rgba(250, 204, 21, 0.6)`
                  : 'none',
                transform: isCurrent ? 'scale(1.3)' : 'scale(1)',
                opacity: index > recorder.currentIndex ? 0.5 : 1
              }}
            />
          );
        })}
      </div>

      {hoveredFrame !== null && !isMobile && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(hoverPos.x + 10, 300),
            top: hoverPos.y - 40,
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            padding: '6px 10px',
            borderRadius: 4,
            fontSize: 11,
            whiteSpace: 'pre-line',
            pointerEvents: 'none',
            zIndex: 100,
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          {getTooltipContent(frames[hoveredFrame])}
        </div>
      )}

      <div style={{
        display: 'flex',
        gap: 8,
        marginTop: 8,
        justifyContent: 'center'
      }}>
        <button
          onClick={() => dispatch({ type: 'stepBackward' })}
          style={buttonStyle}
        >
          ◀ 后退
        </button>
        <button
          onClick={() => dispatch({ type: 'togglePlayback' })}
          style={buttonStyle}
        >
          {recorder.isPlaying ? '⏸ 暂停' : '▶ 播放'}
        </button>
        <button
          onClick={() => dispatch({ type: 'stepForward' })}
          style={buttonStyle}
        >
          前进 ▶
        </button>
        <button
          onClick={() => dispatch({ type: 'toggleRewind' })}
          style={{ ...buttonStyle, background: '#4ade80', color: '#166534' }}
        >
          ✓ 确认
        </button>
      </div>

      <div style={{
        display: 'flex',
        gap: 12,
        marginTop: 6,
        justifyContent: 'center',
        fontSize: isMobile ? 8 : 10,
        color: '#888'
      }}>
        <span><span style={{ color: actionColors.move }}>■</span> 移动</span>
        <span><span style={{ color: actionColors.interact }}>■</span> 交互</span>
        <span><span style={{ color: actionColors.push }}>■</span> 推箱</span>
      </div>
    </div>
  );
};

const buttonStyle: React.CSSProperties = {
  padding: '4px 10px',
  background: 'rgba(255,255,255,0.15)',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontSize: 11
};

export default TimeLine;
