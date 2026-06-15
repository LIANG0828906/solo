import { useState, useEffect, useMemo } from 'react';
import { useAppStore } from './store';

export function InfoPanel() {
  const flowData = useAppStore((state) => state.flowData);
  const panel = useAppStore((state) => state.panel);
  const togglePanel = useAppStore((state) => state.togglePanel);
  const setPanelPosition = useAppStore((state) => state.setPanelPosition);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const aspectRatio = window.innerWidth / window.innerHeight;
      setPanelPosition(aspectRatio < 1.5 ? 'bottom' : 'top');
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setPanelPosition]);

  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return `${year}年${month}月${day}日 ${weekdays[date.getDay()]}`;
  };

  const overallIndex = flowData?.overallIndex ?? 0;
  const trendData = flowData?.trendData ?? [];

  const trendPath = useMemo(() => {
    if (trendData.length === 0) return { path: '', areaPath: '' };
    
    const width = 280;
    const height = 80;
    const padding = 4;
    const maxVal = 100;
    const minVal = 0;
    const range = maxVal - minVal;
    
    const points = trendData.map((value, index) => {
      const x = padding + (index / (trendData.length - 1)) * (width - padding * 2);
      const y = height - padding - ((value - minVal) / range) * (height - padding * 2);
      return { x, y };
    });
    
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) / 3;
      const cpx2 = prev.x + ((curr.x - prev.x) / 3) * 2;
      path += ` C ${cpx1} ${prev.y}, ${cpx2} ${curr.y}, ${curr.x} ${curr.y}`;
    }
    
    let areaPath = path + ` L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;
    
    return { path, areaPath };
  }, [trendData]);

  const indexColor = useMemo(() => {
    if (overallIndex < 20) return '#1a4de6';
    if (overallIndex < 40) return '#1ab2e6';
    if (overallIndex < 60) return '#33e680';
    if (overallIndex < 80) return '#f2d933';
    return '#f24d26';
  }, [overallIndex]);

  const indexLabel = useMemo(() => {
    if (overallIndex < 20) return '稀疏';
    if (overallIndex < 40) return '较少';
    if (overallIndex < 60) return '正常';
    if (overallIndex < 80) return '拥挤';
    return '密集';
  }, [overallIndex]);

  const isTop = panel.position === 'top';

  return (
    <div
      style={{
        position: 'fixed',
        [isTop ? 'top' : 'bottom']: 20,
        left: '50%',
        transform: `translateX(-50%) scale(${panel.isExpanded ? 1 : 0.85})`,
        transformOrigin: isTop ? 'center top' : 'center bottom',
        zIndex: 100,
        transition: 'all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        opacity: panel.isExpanded ? 1 : 0.5,
        pointerEvents: 'auto',
      }}
    >
      <div
        style={{
          background: 'rgba(15, 20, 40, 0.65)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(120, 160, 255, 0.25)',
          borderRadius: 16,
          padding: panel.isExpanded ? '20px 28px' : '10px 20px',
          boxShadow: `
            0 8px 32px rgba(0, 0, 0, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 40px rgba(80, 120, 255, 0.1)
          `,
          minWidth: 360,
          transition: 'padding 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: panel.isExpanded ? 16 : 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: indexColor,
                boxShadow: `0 0 10px ${indexColor}`,
              }}
            />
            <span
              style={{
                color: '#e8f0ff',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              城市人流监测系统
            </span>
          </div>
          <button
            onClick={togglePanel}
            style={{
              background: 'rgba(80, 120, 255, 0.2)',
              border: '1px solid rgba(120, 160, 255, 0.3)',
              borderRadius: 8,
              width: 28,
              height: 28,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a0c0ff',
              fontSize: 16,
              transition: 'all 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(80, 120, 255, 0.35)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(80, 120, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {panel.isExpanded ? '−' : '+'}
          </button>
        </div>

        {panel.isExpanded && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20,
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{
                    color: '#7890c0',
                    fontSize: 11,
                    marginBottom: 6,
                    letterSpacing: 1,
                  }}
                >
                  当前时间
                </div>
                <div
                  style={{
                    color: '#e8f0ff',
                    fontSize: 26,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    letterSpacing: 2,
                    marginBottom: 2,
                  }}
                >
                  {formatTime(currentTime)}
                </div>
                <div
                  style={{
                    color: '#6a7fa8',
                    fontSize: 11,
                  }}
                >
                  {formatDate(currentTime)}
                </div>
              </div>

              <div>
                <div
                  style={{
                    color: '#7890c0',
                    fontSize: 11,
                    marginBottom: 6,
                    letterSpacing: 1,
                  }}
                >
                  整体人流指数
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <div
                    style={{
                      color: indexColor,
                      fontSize: 36,
                      fontWeight: 800,
                      fontFamily: 'monospace',
                      textShadow: `0 0 20px ${indexColor}50`,
                    }}
                  >
                    {overallIndex}
                  </div>
                  <div
                    style={{
                      color: indexColor,
                      fontSize: 12,
                      fontWeight: 600,
                      padding: '3px 8px',
                      background: `${indexColor}20`,
                      borderRadius: 4,
                    }}
                  >
                    {indexLabel}
                  </div>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 4,
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: 2,
                    marginTop: 8,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${overallIndex}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, #1a4de6, #33e680, #f2d933, #f24d26)`,
                      borderRadius: 2,
                      transition: 'width 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                      boxShadow: `0 0 8px ${indexColor}`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    color: '#7890c0',
                    fontSize: 11,
                    letterSpacing: 1,
                  }}
                >
                  未来1小时趋势预测
                </span>
                <span
                  style={{
                    color: '#6a88c8',
                    fontSize: 10,
                  }}
                >
                  实时更新
                </span>
              </div>
              <div
                style={{
                  background: 'rgba(10, 15, 30, 0.5)',
                  borderRadius: 10,
                  padding: 8,
                  border: '1px solid rgba(120, 160, 255, 0.1)',
                }}
              >
                <svg width="280" height="80" viewBox="0 0 280 80">
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#33e680" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#33e680" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1ab2e6" />
                      <stop offset="50%" stopColor="#33e680" />
                      <stop offset="100%" stopColor="#f2d933" />
                    </linearGradient>
                  </defs>
                  
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line
                      key={`grid-${i}`}
                      x1="4"
                      y1={8 + i * 16}
                      x2="276"
                      y2={8 + i * 16}
                      stroke="rgba(120, 160, 255, 0.08)"
                      strokeWidth="1"
                      strokeDasharray="2,4"
                    />
                  ))}
                  
                  <path
                    d={trendPath.areaPath}
                    fill="url(#trendGradient)"
                  />
                  
                  <path
                    d={trendPath.path}
                    fill="none"
                    stroke="url(#lineGradient)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {trendData.length > 0 && (() => {
                    const width = 280;
                    const height = 80;
                    const padding = 4;
                    const lastIdx = trendData.length - 1;
                    const x = padding + (lastIdx / (trendData.length - 1)) * (width - padding * 2);
                    const y = height - padding - ((trendData[lastIdx] - 0) / 100) * (height - padding * 2);
                    return (
                      <>
                        <circle cx={x} cy={y} r="6" fill="#f2d933" opacity="0.3">
                          <animate
                            attributeName="r"
                            values="5;10;5"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                          <animate
                            attributeName="opacity"
                            values="0.4;0;0.4"
                            dur="2s"
                            repeatCount="indefinite"
                          />
                        </circle>
                        <circle cx={x} cy={y} r="4" fill="#f2d933" />
                      </>
                    );
                  })()}
                  
                  {[0, 2, 4, 6, 8, 10, 12].map((i) => (
                    <text
                      key={`xlabel-${i}`}
                      x={4 + (i / 12) * 272}
                      y={78}
                      fill="rgba(120, 160, 255, 0.4)"
                      fontSize="8"
                      textAnchor="middle"
                    >
                      {`${i * 5}m`}
                    </text>
                  ))}
                </svg>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
