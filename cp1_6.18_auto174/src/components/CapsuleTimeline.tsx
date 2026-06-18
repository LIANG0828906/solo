import React, { useState, useEffect, useRef, useMemo } from 'react';
import { EmotionType, Capsule } from '../../shared/types';
import { useCapsuleStore } from '../stores/capsuleStore';
import {
  EMOTION_COLORS,
  EMOTION_LABELS,
  formatCountdown,
  formatDate,
  truncateText,
} from '../engine/capsuleEngine';

const NODE_HEIGHT = 80;
const CONTAINER_OFFSET = 20;

const CapsuleTimeline: React.FC = () => {
  const capsules = useCapsuleStore((s) => s.capsules);
  const activeFilter = useCapsuleStore((s) => s.activeFilter);
  const setActiveFilter = useCapsuleStore((s) => s.setActiveFilter);
  const setPlayingCapsule = useCapsuleStore((s) => s.setPlayingCapsule);
  const markAsRead = useCapsuleStore((s) => s.markAsRead);
  const isLoading = useCapsuleStore((s) => s.isLoading);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 10 });

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const emotions: EmotionType[] = ['joy', 'sadness', 'nostalgia', 'anticipation', 'calm'];

  const filteredCapsules = useMemo(() => {
    if (!activeFilter) return capsules;
    return capsules.filter((c) => c.emotion === activeFilter);
  }, [capsules, activeFilter]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, clientHeight } = containerRef.current;
    const start = Math.max(0, Math.floor(scrollTop / NODE_HEIGHT) - 2);
    const end = Math.min(
      filteredCapsules.length,
      Math.ceil((scrollTop + clientHeight) / NODE_HEIGHT) + 2
    );
    setVisibleRange({ start, end });
  };

  const handleNodeClick = (capsule: Capsule) => {
    if (capsule.status === 'pending') return;
    if (expandedId === capsule.id) {
      setExpandedId(null);
    } else {
      setExpandedId(capsule.id);
      if (capsule.status === 'opened') {
        markAsRead(capsule.id);
      }
    }
  };

  const handlePlayClick = (capsule: Capsule, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlayingCapsule(capsule);
    if (capsule.status === 'opened') {
      markAsRead(capsule.id);
    }
  };

  const totalHeight = filteredCapsules.length * NODE_HEIGHT + CONTAINER_OFFSET * 2;

  return (
    <div style={containerStyle}>
      <div style={filterBarStyle}>
        <span style={filterLabelStyle}>情绪筛选:</span>
        <div style={filterButtonsStyle}>
          {emotions.map((e) => (
            <button
              key={e}
              onClick={() => setActiveFilter(activeFilter === e ? null : e)}
              style={{
                ...filterBtnStyle,
                backgroundColor: EMOTION_COLORS[e],
                border: activeFilter === e ? '2px solid #fff' : '2px solid transparent',
              }}
              title={EMOTION_LABELS[e]}
            />
          ))}
        </div>
      </div>

      <div
        ref={containerRef}
        style={timelineContainerStyle}
        onScroll={handleScroll}
      >
        {isLoading && filteredCapsules.length === 0 && (
          <div style={loadingStyle}>加载中...</div>
        )}

        {!isLoading && filteredCapsules.length === 0 && (
          <div style={emptyStyle}>
            暂无胶囊
            <br />
            <span style={{ fontSize: '13px', color: '#6B6B9C' }}>
              创建你的第一颗情绪胶囊吧
            </span>
          </div>
        )}

        <div style={{ height: totalHeight, position: 'relative' }}>
          <div style={timelineLineStyle} />

          {filteredCapsules
            .slice(visibleRange.start, visibleRange.end)
            .map((capsule, index) => {
              const actualIndex = visibleRange.start + index;
              const top = actualIndex * NODE_HEIGHT + CONTAINER_OFFSET;
              const color = EMOTION_COLORS[capsule.emotion];
              const isOpened = capsule.status !== 'pending';
              const countdown = capsule.openAt - now;
              const isExpanded = expandedId === capsule.id;
              const isHovered = hoveredId === capsule.id;

              return (
                <div
                  key={capsule.id}
                  style={{
                    ...nodeContainerStyle,
                    top,
                    opacity: 0,
                    animation: `fadeInUp 0.5s ease-out ${actualIndex * 0.1}s forwards`,
                  }}
                  onMouseEnter={() => setHoveredId(capsule.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => handleNodeClick(capsule)}
                >
                  <div
                    style={{
                      ...nodeDotStyle,
                      backgroundColor: color,
                      transform: isHovered ? 'scale(2)' : 'scale(1)',
                      boxShadow: isOpened
                        ? `0 0 12px ${color}80`
                        : 'none',
                    }}
                  />

                  {isHovered && (
                    <div style={{ ...tooltipStyle, left: '30px' }}>
                      {formatDate(capsule.openAt)}
                    </div>
                  )}

                  <div
                    style={{
                      ...contentCardStyle,
                      borderColor: isOpened ? color + '50' : '#2D2D5C',
                      opacity: isOpened ? 1 : 0.7,
                    }}
                  >
                    <div style={contentHeaderStyle}>
                      <span
                        style={{
                          ...emotionTagStyle,
                          backgroundColor: color + '30',
                          color: color,
                        }}
                      >
                        {EMOTION_LABELS[capsule.emotion]}
                      </span>
                      {capsule.status === 'read' && (
                        <span style={readBadgeStyle}>已读</span>
                      )}
                      {capsule.status === 'opened' && (
                        <span style={openedBadgeStyle}>新!</span>
                      )}
                    </div>

                    {capsule.status === 'pending' ? (
                      <div
                        style={{
                          ...countdownStyle,
                          color: color,
                        }}
                      >
                        {formatCountdown(countdown)}
                      </div>
                    ) : (
                      <div style={summaryStyle}>
                        {truncateText(capsule.text, 30)}
                      </div>
                    )}

                    {isExpanded && isOpened && (
                      <div style={expandedContentStyle}>
                        <EmotionChart
                          data={capsule.emotionTrajectory}
                          color={color}
                        />
                        <button
                          onClick={(e) => handlePlayClick(capsule, e)}
                          style={{ ...playBtnStyle, backgroundColor: color }}
                        >
                          播放胶囊
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

const EmotionChart: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 200;
    const height = 40;
    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const stepX = width / (data.length - 1);

    ctx.beginPath();
    data.forEach((value, i) => {
      const x = i * stepX;
      const y = height - value * height;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    data.forEach((value, i) => {
      const x = i * stepX;
      const y = height - value * height;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [data, color]);

  return <canvas ref={canvasRef} style={{ width: '200px', height: '40px' }} />;
};

const containerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: '#0F0F23',
};

const filterBarStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '20px 32px',
  backgroundColor: '#1A1A3E',
  borderBottom: '1px solid #2D2D5C',
};

const filterLabelStyle: React.CSSProperties = {
  color: '#B0B0D0',
  fontSize: '14px',
};

const filterButtonsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
};

const filterBtnStyle: React.CSSProperties = {
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  transition: 'all 0.3s ease-in-out',
};

const timelineContainerStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: '0 40px 0 80px',
  position: 'relative',
};

const timelineLineStyle: React.CSSProperties = {
  position: 'absolute',
  left: '50px',
  top: CONTAINER_OFFSET,
  bottom: CONTAINER_OFFSET,
  width: '2px',
  backgroundColor: '#3D3D5C',
};

const nodeContainerStyle: React.CSSProperties = {
  position: 'absolute',
  left: 0,
  right: '40px',
  height: NODE_HEIGHT - 16,
  display: 'flex',
  alignItems: 'flex-start',
  cursor: 'pointer',
};

const nodeDotStyle: React.CSSProperties = {
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  position: 'absolute',
  left: '45px',
  top: '24px',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  zIndex: 2,
};

const tooltipStyle: React.CSSProperties = {
  position: 'absolute',
  top: '18px',
  backgroundColor: 'rgba(0,0,0,0.8)',
  color: '#fff',
  padding: '6px 12px',
  borderRadius: '8px',
  fontSize: '12px',
  whiteSpace: 'nowrap',
  zIndex: 10,
  pointerEvents: 'none',
};

const contentCardStyle: React.CSSProperties = {
  marginLeft: '80px',
  flex: 1,
  backgroundColor: '#1A1A3E',
  border: '1px solid #2D2D5C',
  borderRadius: '12px',
  padding: '12px 16px',
  transition: 'all 0.3s ease-in-out',
};

const contentHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '8px',
};

const emotionTagStyle: React.CSSProperties = {
  fontSize: '12px',
  padding: '2px 8px',
  borderRadius: '10px',
  fontWeight: 500,
};

const readBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#6B6B9C',
  backgroundColor: '#2D2D5C',
  padding: '2px 6px',
  borderRadius: '4px',
};

const openedBadgeStyle: React.CSSProperties = {
  fontSize: '11px',
  color: '#fff',
  backgroundColor: '#FF6B6B',
  padding: '2px 6px',
  borderRadius: '4px',
  animation: 'pulse 1.5s ease-in-out infinite',
};

const countdownStyle: React.CSSProperties = {
  fontFamily: 'monospace',
  fontSize: '20px',
  fontWeight: 600,
  letterSpacing: '2px',
};

const summaryStyle: React.CSSProperties = {
  color: '#E0E0E0',
  fontSize: '14px',
  lineHeight: 1.5,
};

const expandedContentStyle: React.CSSProperties = {
  marginTop: '12px',
  paddingTop: '12px',
  borderTop: '1px solid #2D2D5C',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
};

const playBtnStyle: React.CSSProperties = {
  border: 'none',
  color: '#1A1A2E',
  padding: '8px 20px',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.3s ease-in-out',
  whiteSpace: 'nowrap',
};

const loadingStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '200px',
  color: '#6B6B9C',
  fontSize: '14px',
};

const emptyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '300px',
  color: '#B0B0D0',
  fontSize: '16px',
  textAlign: 'center',
  gap: '8px',
};

export default CapsuleTimeline;
