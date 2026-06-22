import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Cell
} from 'recharts';
import type { AudienceAge } from './DataQuery';

interface RadarChartCardProps {
  data: AudienceAge;
  animKey: number;
}

interface RadarVertex {
  subject: string;
  value: number;
  key: string;
}

export function RadarChartCard({ data, animKey }: RadarChartCardProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [animationProgress, setAnimationProgress] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    setAnimationProgress(0);
    const startTime = performance.now();
    const duration = 1200;

    function animate(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setAnimationProgress(eased);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [animKey]);

  const chartData: RadarVertex[] = useMemo(() => [
    { subject: '18-24岁', value: data['18-24'], key: '18-24' },
    { subject: '25-34岁', value: data['25-34'], key: '25-34' },
    { subject: '35-44岁', value: data['35-44'], key: '35-44' },
    { subject: '45岁以上', value: data['45+'], key: '45+' },
    { subject: '未知年龄', value: data['unknown'], key: 'unknown' }
  ], [data]);

  const animatedData = useMemo(() =>
    chartData.map(d => ({
      ...d,
      value: d.value * animationProgress
    })), [chartData, animationProgress]);

  const vertexPositions = useMemo(() => {
    const angles = [90, 162, 234, 306, 18];
    return angles.map((angle, idx) => {
      const rad = (angle - 90) * (Math.PI / 180);
      const baseRadius = 32;
      const valueRadius = baseRadius + (animatedData[idx].value / 100) * 35;
      return {
        cx: 50 + valueRadius * Math.cos(rad),
        cy: 50 + valueRadius * Math.sin(rad),
        angle,
        baseCx: 50 + baseRadius * Math.cos(rad),
        baseCy: 50 + baseRadius * Math.sin(rad),
        pulseRadius: 78
      };
    });
  }, [animatedData]);

  return (
    <div
      key={animKey}
      style={{ width: '100%', height: '100%', position: 'relative', animation: 'fadeSlideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={animatedData} outerRadius="75%">
          <defs>
            <linearGradient id="radarStrokeGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#00ffc3" />
              <stop offset="100%" stopColor="#00d4ff" />
            </linearGradient>
            <linearGradient id="radarFillGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00ffc3" stopOpacity={0.5} />
              <stop offset="50%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.2} />
            </linearGradient>
            <filter id="radarGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <PolarGrid stroke="#2a2a4e" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: hoveredKey ? '#ffffff' : '#8888aa',
              fontSize: 11,
              fontWeight: 500
            }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#555577', fontSize: 9 }}
            stroke="#2a2a4e"
            tickCount={5}
          />
          <Radar
            name="占比"
            dataKey="value"
            stroke="url(#radarStrokeGradient)"
            strokeWidth={2.5}
            fill="url(#radarFillGradient)"
            filter="url(#radarGlow)"
            isAnimationActive={false}
          >
            {animatedData.map((entry, index) => (
              <Cell
                key={index}
                onMouseEnter={() => setHoveredKey(entry.key)}
                onMouseLeave={() => setHoveredKey(null)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </Radar>
        </RadarChart>
      </ResponsiveContainer>

      {vertexPositions.map((pos, idx) => {
        const entry = chartData[idx];
        const isHovered = hoveredKey === entry.key;
        const nodeAnimProg = Math.min(animationProgress * 1.5, 1);
        const scale = 0.3 + nodeAnimProg * 0.7;
        const pulseScale = 1 + Math.sin(performance.now() / 500 + idx) * 0.2;

        return (
          <div
            key={entry.key}
            onMouseEnter={() => setHoveredKey(entry.key)}
            onMouseLeave={() => setHoveredKey(null)}
            style={{
              position: 'absolute',
              left: `${pos.cx}%`,
              top: `${pos.cy}%`,
              transform: `translate(-50%, -50%) scale(${scale * (isHovered ? pulseScale * 1.3 : 1)})`,
              width: isHovered ? 18 : 12,
              height: isHovered ? 18 : 12,
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, #ffffff, ${isHovered ? '#00ffc3' : '#00d4ff'})`,
              boxShadow: isHovered
                ? `0 0 25px #00ffc3, 0 0 50px rgba(0,255,195,0.5), inset 0 0 8px rgba(255,255,255,0.6)`
                : `0 0 12px #00d4ff, 0 0 24px rgba(0,212,255,0.3), inset 0 0 4px rgba(255,255,255,0.4)`,
              cursor: 'pointer',
              transition: 'width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease',
              zIndex: isHovered ? 5 : 2
            }}
          >
            {(isHovered || animationProgress > 0.8) && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 10px)',
                  left: '50%',
                  transform: `translateX(-50%) translateY(${isHovered ? '0' : '5px'})`,
                  opacity: isHovered ? 1 : animationProgress > 0.9 ? 0.7 : 0,
                  background: 'linear-gradient(135deg, #1a1a2e, #252550)',
                  padding: '6px 12px',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 11,
                  whiteSpace: 'nowrap',
                  border: `1px solid ${isHovered ? '#00ffc3' : '#3a3a6e'}`,
                  boxShadow: isHovered ? '0 4px 20px rgba(0,255,195,0.25)' : 'none',
                  transition: 'all 0.3s ease',
                  pointerEvents: 'none'
                }}
              >
                <div style={{ fontSize: 10, color: '#8888aa', marginBottom: 2 }}>{entry.subject}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ffc3', boxShadow: '0 0 6px #00ffc3' }} />
                  <span style={{ color: '#00ffc3', fontWeight: 700, fontSize: 14 }}>{entry.value}%</span>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '6px solid transparent',
                    borderRight: '6px solid transparent',
                    borderTop: `6px solid ${isHovered ? '#00ffc3' : '#3a3a6e'}`
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
