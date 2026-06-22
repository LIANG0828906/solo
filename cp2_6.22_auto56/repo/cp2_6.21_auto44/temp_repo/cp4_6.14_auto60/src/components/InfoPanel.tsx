import { useEffect, useRef, useState } from 'react';
import { Activity, Clock, BarChart3, Route, RefreshCw, Gauge } from 'lucide-react';

interface InfoPanelProps {
  simTime: number;
  averageFlow: number;
  roadCount: number;
  intersectionCount: number;
  updateCount: number;
  isPlaying: boolean;
}

function formatTime(hoursFloat: number): string {
  const totalMinutes = Math.round(hoursFloat * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function getFlowLevel(flow: number): { label: string; color: string; bg: string; border: string } {
  if (flow < 30) {
    return {
      label: '畅通',
      color: '#22c55e',
      bg: 'rgba(34,197,94,0.12)',
      border: 'rgba(34,197,94,0.3)',
    };
  }
  if (flow < 60) {
    return {
      label: '缓行',
      color: '#eab308',
      bg: 'rgba(234,179,8,0.12)',
      border: 'rgba(234,179,8,0.3)',
    };
  }
  if (flow < 80) {
    return {
      label: '拥堵',
      color: '#f97316',
      bg: 'rgba(249,115,22,0.12)',
      border: 'rgba(249,115,22,0.3)',
    };
  }
  return {
    label: '严重拥堵',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
  };
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  valueColor?: string;
  highlight?: { bg: string; border: string };
}

function StatItem({ icon, label, value, subValue, valueColor, highlight }: StatItemProps) {
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: '8px',
        background: highlight?.bg || 'rgba(15,23,42,0.5)',
        border: `1px solid ${highlight?.border || 'rgba(148,163,184,0.1)'}`,
        transition: 'all 0.3s ease-out',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        marginBottom: '6px',
      }}>
        <span style={{ color: '#64748b', flexShrink: 0 }}>{icon}</span>
        <span style={{
          fontSize: '11px',
          color: '#94a3b8',
          letterSpacing: '0.02em',
          fontWeight: 500,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {label}
        </span>
      </div>
      <div style={{
        fontSize: '20px',
        fontWeight: 700,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        color: valueColor || '#e2e8f0',
        lineHeight: 1.2,
        letterSpacing: '0.02em',
      }}>
        {value}
      </div>
      {subValue && (
        <div style={{
          marginTop: '3px',
          fontSize: '10px',
          color: '#64748b',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}>
          {subValue}
        </div>
      )}
    </div>
  );
}

export function InfoPanel({
  simTime,
  averageFlow,
  roadCount,
  intersectionCount,
  updateCount,
  isPlaying,
}: InfoPanelProps) {
  const [fps, setFps] = useState(0);
  const frameTimesRef = useRef<number[]>([]);
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef<number | null>(null);
  const fpsSmoothedRef = useRef(0);

  useEffect(() => {
    const measure = () => {
      const now = performance.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      frameTimesRef.current.push(delta);
      if (frameTimesRef.current.length > 30) {
        frameTimesRef.current.shift();
      }

      const avgDelta = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
      const currentFps = avgDelta > 0 ? 1000 / avgDelta : 0;

      fpsSmoothedRef.current = fpsSmoothedRef.current * 0.85 + currentFps * 0.15;
      setFps(Math.round(fpsSmoothedRef.current));

      rafRef.current = requestAnimationFrame(measure);
    };

    rafRef.current = requestAnimationFrame(measure);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const flowLevel = getFlowLevel(averageFlow);
  const fpsColor = fps >= 50 ? '#22c55e' : fps >= 30 ? '#eab308' : '#ef4444';

  return (
    <div
      style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        width: '240px',
        background: 'rgba(30,41,59,0.85)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderRadius: '12px',
        border: '1px solid rgba(148,163,184,0.15)',
        boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
        padding: '14px',
        pointerEvents: 'auto',
        zIndex: 30,
        color: '#ffffff',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
        paddingBottom: '12px',
        borderBottom: '1px solid rgba(148,163,184,0.1)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '7px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(59,130,246,0.35)',
          }}>
            <Activity size={15} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#f1f5f9',
              letterSpacing: '0.01em',
            }}>
              交通监控中心
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginTop: '2px',
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: isPlaying ? '#22c55e' : '#64748b',
                boxShadow: isPlaying ? '0 0 8px #22c55e' : 'none',
                animation: isPlaying ? 'pulse 1.8s infinite' : 'none',
              }} />
              <span style={{
                fontSize: '10px',
                color: isPlaying ? '#22c55e' : '#64748b',
                fontWeight: 600,
              }}>
                {isPlaying ? '实时模拟中' : '暂停'}
              </span>
            </div>
          </div>
        </div>

        <div style={{
          textAlign: 'right',
        }}>
          <div style={{
            fontSize: '9px',
            color: '#64748b',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '3px',
          }}>
            FPS
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 800,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            color: fpsColor,
            lineHeight: 1,
            textShadow: `0 0 8px ${fpsColor}44`,
          }}>
            {fps}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px',
      }}>
        <StatItem
          icon={<Clock size={13} strokeWidth={2} />}
          label="模拟时间"
          value={formatTime(simTime)}
          subValue="HH:MM"
        />

        <StatItem
          icon={<Gauge size={13} strokeWidth={2} />}
          label="平均流量"
          value={averageFlow.toFixed(1)}
          subValue={flowLevel.label}
          valueColor={flowLevel.color}
          highlight={{ bg: flowLevel.bg, border: flowLevel.border }}
        />

        <StatItem
          icon={<Route size={13} strokeWidth={2} />}
          label="道路总数"
          value={roadCount.toString()}
          subValue={`${intersectionCount} 个路口`}
        />

        <StatItem
          icon={<RefreshCw size={13} strokeWidth={2} />}
          label="更新计数"
          value={updateCount.toString()}
          subValue="每 2 秒更新"
        />
      </div>

      <div style={{
        marginTop: '12px',
        padding: '10px 12px',
        borderRadius: '8px',
        background: 'rgba(15,23,42,0.5)',
        border: '1px solid rgba(148,163,184,0.08)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '8px',
        }}>
          <BarChart3 size={12} color="#64748b" strokeWidth={2} />
          <span style={{
            fontSize: '10px',
            color: '#94a3b8',
            letterSpacing: '0.04em',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}>
            流量强度指示
          </span>
        </div>

        <div style={{
          height: '6px',
          borderRadius: '3px',
          background: 'linear-gradient(90deg, #22c55e 0%, #eab308 50%, #ef4444 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div
            style={{
              position: 'absolute',
              top: '-2px',
              bottom: '-2px',
              left: `${averageFlow}%`,
              width: '3px',
              background: '#ffffff',
              borderRadius: '2px',
              transform: 'translateX(-50%)',
              boxShadow: '0 0 8px rgba(255,255,255,0.9)',
              transition: 'left 0.5s ease-out',
            }}
          />
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: '6px',
        }}>
          <span style={{ fontSize: '9px', color: '#22c55e', fontWeight: 600 }}>0 畅通</span>
          <span style={{ fontSize: '9px', color: '#eab308', fontWeight: 600 }}>50 缓行</span>
          <span style={{ fontSize: '9px', color: '#ef4444', fontWeight: 600 }}>100 拥堵</span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
}

export default InfoPanel;
