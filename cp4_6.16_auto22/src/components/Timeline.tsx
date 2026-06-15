import { useEffect, useRef, useState, memo } from 'react';
import { Play, Pause, SkipBack, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { TimelineSegment } from '@/types';
import { formatDuration } from '@/utils/audioAnalyzer';

interface TimelineProps {
  segments: TimelineSegment[];
  totalDuration: number;
}

const Timeline = memo(function Timeline({ segments, totalDuration }: TimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timelineWidth = Math.max(1200, segments.length * 180);
  const pxPerSec = timelineWidth / Math.max(totalDuration, 1);

  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(false);
  }, [segments, totalDuration]);

  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const next = prev + 0.1;
          if (next >= totalDuration) {
            setIsPlaying(false);
            return totalDuration;
          }
          return next;
        });
      }, 100);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    }
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, totalDuration]);

  useEffect(() => {
    if (scrollRef.current && isPlaying) {
      const indicatorX = currentTime * pxPerSec;
      const container = scrollRef.current;
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      if (indicatorX < scrollLeft + 80 || indicatorX > scrollLeft + containerWidth - 80) {
        container.scrollTo({
          left: Math.max(0, indicatorX - containerWidth / 2),
          behavior: 'smooth',
        });
      }
    }
  }, [currentTime, isPlaying, pxPerSec]);

  const generateTicks = () => {
    const ticks: { sec: number; major: boolean }[] = [];
    const interval = totalDuration > 600 ? 60 : totalDuration > 300 ? 30 : totalDuration > 120 ? 15 : 10;
    for (let t = 0; t <= totalDuration + 0.001; t += interval) {
      ticks.push({ sec: t, major: true });
    }
    return ticks;
  };

  const ticks = generateTicks();
  const overBudgetCount = segments.filter(s => s.isOverBudget).length;

  if (segments.length === 0) {
    return (
      <div style={{
        padding: '60px 24px',
        textAlign: 'center',
        color: 'var(--color-text-muted)',
      }}>
        <div style={{
          width: 64, height: 64,
          margin: '0 auto 16px',
          borderRadius: '50%',
          background: 'rgba(155,135,245,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9B87F5',
        }}>
          <Play size={28} />
        </div>
        <p style={{ fontSize: 14, marginBottom: 4 }}>暂无时间轴数据</p>
        <p style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>请先上传音频文件进行分析</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--color-border-light)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: 6,
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255,255,255,0.03)',
        }}>
          <button
            onClick={() => { setCurrentTime(0); setIsPlaying(false); }}
            style={btnStyle()}
            title="回到开头"
          >
            <SkipBack size={14} />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              ...btnStyle(),
              background: isPlaying ? 'var(--color-accent)' : 'rgba(233,69,96,0.15)',
              color: isPlaying ? '#fff' : 'var(--color-accent)',
              borderColor: isPlaying ? 'var(--color-accent)' : 'rgba(233,69,96,0.3)',
            }}
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
        </div>

        <div style={{
          fontSize: 13,
          fontFamily: 'var(--font-mono)',
          color: '#fff',
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(26,26,46,0.8)',
          border: '1px solid var(--color-border)',
        }}>
          <span style={{ color: 'var(--color-indicator)', fontWeight: 600 }}>
            {formatDuration(currentTime)}
          </span>
          <span style={{ color: 'var(--color-text-muted)', margin: '0 6px' }}>/</span>
          <span style={{ color: 'var(--color-text-secondary)' }}>
            {formatDuration(totalDuration)}
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={totalDuration}
          step={0.1}
          value={currentTime}
          onChange={(e) => {
            setCurrentTime(Number(e.target.value));
            if (isPlaying) setIsPlaying(false);
          }}
          style={{
            flex: 1,
            height: 4,
            accentColor: 'var(--color-indicator)',
            cursor: 'pointer',
          }}
        />

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {overBudgetCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              background: 'rgba(255,68,68,0.12)',
              border: '1px solid rgba(255,68,68,0.3)',
              color: 'var(--color-over-budget)',
            }}>
              <AlertTriangle size={12} /> {overBudgetCount} 段超时
            </div>
          )}
          {overBudgetCount === 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              background: 'rgba(0,206,209,0.1)',
              border: '1px solid rgba(0,206,209,0.3)',
              color: '#00CED1',
            }}>
              <CheckCircle2 size={12} /> 节奏良好
            </div>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '100px 1fr',
        gap: 12,
        alignItems: 'center',
        marginLeft: 4,
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        color: 'var(--color-text-muted)',
      }}>
        <span>图例</span>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 14, height: 10,
              borderRadius: 2,
              background: 'linear-gradient(90deg, var(--color-accent), #9B87F5)',
              opacity: 0.35,
            }} />
            <span>预期时长</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 14, height: 10,
              borderRadius: 2,
              background: '#00CED1',
            }} />
            <span>实际时长</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 14, height: 10,
              borderRadius: 2,
              background: 'var(--color-over-budget)',
              boxShadow: '0 0 8px rgba(255,68,68,0.4)',
            }} />
            <span>超时 (超20%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{
              width: 10, height: 10,
              borderRadius: '50%',
              background: 'var(--color-indicator)',
              boxShadow: '0 0 10px var(--color-indicator-glow)',
            }} />
            <span>播放位置</span>
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        style={{
          overflowX: 'auto',
          overflowY: 'hidden',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          background: 'rgba(26,26,46,0.4)',
          padding: 0,
          willChange: 'transform',
        }}
      >
        <div
          style={{
            width: timelineWidth + 100,
            minWidth: '100%',
            position: 'relative',
            padding: '16px 16px 20px',
          }}
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: '100px 1fr',
            gap: 12,
            position: 'sticky',
            left: 0,
            zIndex: 2,
            marginBottom: 8,
          }}>
            <div />
            <div style={{
              position: 'relative',
              height: 22,
              borderBottom: '1px dashed var(--color-border)',
              paddingBottom: 4,
            }}>
              {ticks.map((tick, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: tick.sec * pxPerSec,
                    top: 0,
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <span style={{
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--color-text-muted)',
                  }}>
                    {formatDuration(tick.sec)}
                  </span>
                  <div style={{
                    width: 1,
                    height: tick.major ? 10 : 5,
                    background: 'var(--color-border)',
                  }} />
                </div>
              ))}
            </div>
          </div>

          {segments.map((seg, idx) => {
            const left = seg.startTime * pxPerSec;
            const expWidth = seg.expectedDuration * pxPerSec;
            const actWidth = seg.actualDuration * pxPerSec;
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={seg.id}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '100px 1fr',
                  gap: 12,
                  position: 'relative',
                  marginBottom: idx < segments.length - 1 ? 10 : 0,
                  padding: '4px 0',
                }}
              >
                <div style={{
                  alignSelf: 'center',
                  paddingRight: 8,
                  borderRight: '1px solid var(--color-border-light)',
                }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: isHovered ? '#fff' : 'var(--color-text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: 1.3,
                      marginBottom: 2,
                      transition: 'var(--transition-base)',
                    }}
                    title={seg.title}
                  >
                    {seg.title}
                  </div>
                  <div style={{
                    fontSize: 10,
                    fontFamily: 'var(--font-mono)',
                    color: seg.isOverBudget ? 'var(--color-over-budget)' : 'var(--color-text-muted)',
                  }}>
                    {seg.isOverBudget && '⚠ '}
                    {formatDuration(seg.actualDuration)}
                  </div>
                </div>

                <div style={{ position: 'relative', height: 64 }}>
                  <div style={{
                    position: 'absolute',
                    top: 4,
                    left,
                    width: Math.max(expWidth, 2),
                    height: 24,
                    borderRadius: 'var(--radius-sm)',
                    background: 'linear-gradient(90deg, rgba(233,69,96,0.4), rgba(155,135,245,0.4))',
                    border: '1px dashed rgba(233,69,96,0.5)',
                    transition: 'var(--transition-base)',
                    opacity: isHovered ? 0.9 : 0.55,
                  }}>
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      color: 'rgba(255,255,255,0.7)',
                    }}>
                      预期 {formatDuration(seg.expectedDuration)}
                    </div>
                  </div>

                  <div
                    style={{
                      position: 'absolute',
                      bottom: 4,
                      left,
                      width: Math.max(actWidth, 2),
                      height: 28,
                      borderRadius: 'var(--radius-sm)',
                      background: seg.isOverBudget
                        ? 'linear-gradient(135deg, var(--color-over-budget) 0%, #FF7070 100%)'
                        : 'linear-gradient(135deg, #00CED1 0%, #7EC8E3 100%)',
                      boxShadow: seg.isOverBudget
                        ? '0 0 16px rgba(255,68,68,0.35)'
                        : '0 0 12px rgba(0,206,209,0.25)',
                      border: seg.isOverBudget
                        ? '1px solid rgba(255,68,68,0.6)'
                        : '1px solid rgba(0,206,209,0.5)',
                      transition: 'var(--transition-base)',
                      transform: isHovered ? 'translateY(-1px)' : 'none',
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0 10px',
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      color: '#fff',
                      fontWeight: 600,
                    }}>
                      <span style={{ opacity: 0.9 }}>
                        {formatDuration(seg.actualDuration)}
                      </span>
                      <span style={{
                        fontSize: 9,
                        padding: '1px 6px',
                        borderRadius: 999,
                        background: seg.deviation >= 0
                          ? 'rgba(255,255,255,0.2)'
                          : 'rgba(255,255,255,0.2)',
                      }}>
                        {seg.deviation >= 0 ? '+' : ''}{Math.round(seg.deviation)}s
                      </span>
                    </div>
                  </div>

                  {isHovered && (
                    <div style={{
                      position: 'absolute',
                      left: Math.max(0, left + actWidth / 2 - 100),
                      top: -50,
                      width: 200,
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(26,26,46,0.98)',
                      border: '1px solid var(--color-border)',
                      boxShadow: 'var(--shadow-card-hover)',
                      fontSize: 11,
                      zIndex: 20,
                      pointerEvents: 'none',
                    }}>
                      <div style={{
                        fontWeight: 600,
                        marginBottom: 6,
                        color: '#fff',
                        fontSize: 12,
                      }}>
                        {seg.title}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-mono)' }}>
                        <span>预期</span><span>{formatDuration(seg.expectedDuration)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: seg.isOverBudget ? 'var(--color-over-budget)' : '#00CED1', fontFamily: 'var(--font-mono)' }}>
                        <span>实际</span><span>{formatDuration(seg.actualDuration)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-muted)', fontFamily: 'var(--font-mono)', fontSize: 10, marginTop: 4, paddingTop: 4, borderTop: '1px solid var(--color-border-light)' }}>
                        <span>偏差</span>
                        <span style={{ color: seg.isOverBudget ? 'var(--color-over-budget)' : '#00CED1' }}>
                          {seg.deviation >= 0 ? '+' : ''}{seg.deviation.toFixed(1)}s
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          <div
            className="pulse-indicator"
            style={{
              position: 'absolute',
              left: 112 + currentTime * pxPerSec,
              top: 0,
              bottom: 0,
              width: 3,
              background: 'var(--color-indicator)',
              borderRadius: 2,
              zIndex: 15,
              pointerEvents: 'none',
              transition: 'left 0.1s linear',
            }}
          >
            <div style={{
              position: 'absolute',
              top: -6,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: 'var(--color-indicator)',
              border: '2px solid #fff',
            }} />
          </div>
        </div>
      </div>
    </div>
  );
});

function btnStyle(): React.CSSProperties {
  return {
    padding: 8,
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--color-border)',
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition-base)',
  };
}

export default Timeline;
