import { useEffect, useState, memo } from 'react';
import { TrendingUp, Activity, MessageCircle, Info } from 'lucide-react';
import { RhythmMetrics } from '@/types';

interface DashboardProps {
  metrics: RhythmMetrics | null;
}

interface GaugeProps {
  value: number;
  min: number;
  max: number;
  recommendedRange: [number, number];
  label: string;
  unit: string;
  icon: React.ReactNode;
  gradientColors: [string, string];
  description: string;
}

const Gauge = memo(function Gauge({
  value,
  min,
  max,
  recommendedRange,
  label,
  unit,
  icon,
  gradientColors,
  description,
}: GaugeProps) {
  const [animatedValue, setAnimatedValue] = useState(min);
  const clampedValue = Math.max(min, Math.min(max, value));
  const progress = (clampedValue - min) / (max - min);
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2 - 4;
  const circumference = Math.PI * radius;
  const dashOffset = circumference * (1 - progress);
  const [c1, c2] = gradientColors;

  const rangeStartX = 20 + (radius + 10) * (1 + Math.cos(Math.PI - (recommendedRange[0] - min) / (max - min) * Math.PI));
  const rangeEndX = 20 + (radius + 10) * (1 + Math.cos(Math.PI - (recommendedRange[1] - min) / (max - min) * Math.PI));
  const rangeY = size - 20;

  const isInRange = clampedValue >= recommendedRange[0] && clampedValue <= recommendedRange[1];
  const statusColor = isInRange ? '#00CED1' : clampedValue < recommendedRange[0] ? '#9B87F5' : 'var(--color-over-budget)';
  const statusText = isInRange ? '理想范围' : clampedValue < recommendedRange[0] ? '偏低' : '偏高';

  useEffect(() => {
    let rafId: number;
    const startTime = performance.now();
    const startValue = animatedValue;
    const duration = 500;
    
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimatedValue(startValue + (clampedValue - startValue) * eased);
      if (t < 1) rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
     
  }, [clampedValue]);

  const gradientId = `grad-${label.replace(/\s/g, '-')}`;

  return (
    <div
      className="card-hover"
      style={{
        flex: 1,
        minWidth: 0,
        background: 'linear-gradient(160deg, rgba(15,52,96,0.5) 0%, rgba(22,33,62,0.8) 100%)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-xl)',
        padding: '20px 16px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        top: -40,
        right: -40,
        width: 120,
        height: 120,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${c1}30 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
        width: '100%',
      }}>
        <div style={{
          width: 32, height: 32,
          borderRadius: 'var(--radius-sm)',
          background: `linear-gradient(135deg, ${c1}30, ${c2}30)`,
          border: `1px solid ${c1}50`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: c1,
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#fff',
            lineHeight: 1.2,
          }}>
            {label}
          </div>
          <div style={{
            fontSize: 10,
            color: statusColor,
            fontFamily: 'var(--font-mono)',
            marginTop: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}>
            <span style={{
              width: 6, height: 6,
              borderRadius: '50%',
              background: statusColor,
              display: 'inline-block',
            }} />
            {statusText}
          </div>
        </div>
      </div>

      <div style={{
        width: size,
        height: size / 2 + 20,
        position: 'relative',
        margin: '4px 0',
      }}>
        <svg
          width={size}
          height={size / 2 + 16}
          viewBox={`0 0 ${size} ${size / 2 + 16}`}
          style={{ overflow: 'visible' }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={c1} />
              <stop offset="100%" stopColor={c2} />
            </linearGradient>
          </defs>

          <path
            d={`M ${20 + strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 20 - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          <line
            x1={rangeStartX}
            y1={size / 2 + 4}
            x2={rangeEndX}
            y2={size / 2 + 4}
            stroke="#00CED1"
            strokeWidth={3}
            strokeLinecap="round"
            opacity={0.5}
          />
          <text
            x={(rangeStartX + rangeEndX) / 2}
            y={size / 2 + 18}
            textAnchor="middle"
            fontSize={8}
            fill="#00CED1"
            fontFamily="var(--font-mono)"
            opacity={0.7}
          >
            建议范围
          </text>

          <path
            d={`M ${20 + strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - 20 - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            style={{
              transition: 'stroke-dashoffset 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            ref={(el) => {
              if (el) {
                requestAnimationFrame(() => {
                  el.style.strokeDashoffset = dashOffset.toString();
                });
              }
            }}
          />

          <circle
            cx={20 + (radius + strokeWidth / 2) * (1 + Math.cos(Math.PI - progress * Math.PI))}
            cy={size / 2 - (radius + strokeWidth / 2) * Math.sin(Math.PI - progress * Math.PI)}
            r={8}
            fill="#fff"
            stroke={`url(#${gradientId})`}
            strokeWidth={3}
            style={{
              filter: `drop-shadow(0 0 8px ${c1}80)`,
              transition: 'cx 500ms cubic-bezier(0.34, 1.56, 0.64, 1), cy 500ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          />
        </svg>

        <div style={{
          position: 'absolute',
          bottom: 18,
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 28,
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            background: `linear-gradient(135deg, ${c1}, ${c2})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1,
            letterSpacing: '-0.02em',
          }}>
            {Math.round(animatedValue)}
          </div>
          <div style={{
            fontSize: 10,
            color: 'var(--color-text-muted)',
            fontFamily: 'var(--font-mono)',
            marginTop: 2,
          }}>
            {unit}
          </div>
        </div>
      </div>

      <div style={{
        width: '100%',
        padding: '8px 10px',
        borderRadius: 'var(--radius-sm)',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid var(--color-border-light)',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 'auto',
      }}>
        <Info size={12} style={{
          color: 'var(--color-text-muted)',
          flexShrink: 0,
          marginTop: 1,
        }} />
        <p style={{
          fontSize: 10,
          color: 'var(--color-text-muted)',
          lineHeight: 1.5,
        }}>
          {description}
        </p>
      </div>
    </div>
  );
});

const Dashboard = memo(function Dashboard({ metrics }: DashboardProps) {
  if (!metrics) {
    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
      }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-xl)',
              padding: 20,
              height: 260,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <div style={{
              width: 48, height: 48,
              borderRadius: '50%',
              border: '3px solid var(--color-border)',
              borderTopColor: 'transparent',
              animation: 'spin 1s linear infinite',
            }} />
            <p style={{
              fontSize: 12,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
            }}>
              等待分析数据...
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ))}
      </div>
    );
  }

  const fillerList = metrics.fillerWordCount.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 16,
      }}>
        <Gauge
          value={metrics.speakingRate}
          min={80}
          max={360}
          recommendedRange={metrics.speakingRateRange}
          label="语速"
          unit="字/分钟"
          icon={<TrendingUp size={16} />}
          gradientColors={['#E94560', '#FF6B9D']}
          description="中文播客理想语速为180-240字/分钟，过快易让听众疲劳，过慢则显拖沓。"
        />
        <Gauge
          value={metrics.uniformity}
          min={0}
          max={100}
          recommendedRange={metrics.uniformityRange}
          label="段落均匀度"
          unit="指数"
          icon={<Activity size={16} />}
          gradientColors={['#00CED1', '#7EC8E3']}
          description="衡量各段落时长差异程度，70分以上表示节奏均匀，避免一段过长或过短。"
        />
        <Gauge
          value={metrics.fillerFrequency}
          min={0}
          max={15}
          recommendedRange={metrics.fillerFrequencyRange}
          label="填充词频率"
          unit="次/分钟"
          icon={<MessageCircle size={16} />}
          gradientColors={['#9B87F5', '#C4B5FD']}
          description="嗯、那个等填充词出现频率。控制在4次/分钟以内可显著提升专业度。"
        />
      </div>

      {fillerList.length > 0 && (
        <div
          className="card-hover"
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, rgba(155,135,245,0.08) 0%, rgba(233,69,96,0.08) 100%)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <MessageCircle size={16} style={{ color: '#9B87F5' }} />
              <span style={{ fontSize: 13, fontWeight: 600 }}>填充词检测 Top 5</span>
            </div>
            <span style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--color-text-muted)',
            }}>
              共检测到 {metrics.fillerWordCount.reduce((s, f) => s + f.count, 0)} 次填充词
            </span>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {fillerList.map((f) => {
              const maxCount = Math.max(...metrics.fillerWordCount.map(x => x.count));
              const pct = maxCount > 0 ? (f.count / maxCount) * 100 : 0;
              return (
                <div
                  key={f.word}
                  style={{
                    flex: 1,
                    minWidth: 120,
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(26,26,46,0.6)',
                    border: '1px solid var(--color-border-light)',
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 6,
                  }}>
                    <span style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#fff',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      「{f.word}」
                    </span>
                    <span style={{
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      color: pct > 70 ? 'var(--color-over-budget)' : 'var(--color-text-secondary)',
                      fontWeight: 600,
                    }}>
                      {f.count} 次
                    </span>
                  </div>
                  <div style={{
                    height: 4,
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${pct}%`,
                      borderRadius: 2,
                      background: pct > 70
                        ? 'linear-gradient(90deg, var(--color-over-budget), #FF7070)'
                        : 'linear-gradient(90deg, #9B87F5, #C4B5FD)',
                      transition: 'width 0.5s ease-out',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

export default Dashboard;
