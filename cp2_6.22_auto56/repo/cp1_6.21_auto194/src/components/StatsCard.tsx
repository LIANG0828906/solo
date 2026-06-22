import React, { useState, useEffect, useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import ThemeToggle from './ThemeToggle';
import ExportButton from './ExportButton';
import { formatDuration } from '../utils/exportUtils';
import { ANIMATION, DARK_COLORS, LIGHT_COLORS, LAYOUT, FONT_STACK } from '../constants';
import { FileText, Clock, Zap, TrendingUp } from 'lucide-react';

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  color: string;
  fontSize?: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ value, duration = 200, color, fontSize = '22px' }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const rafRef = useRef<number>(0);
  const startValRef = useRef(value);
  const startTimeRef = useRef(0);

  useEffect(() => {
    const startVal = startValRef.current;
    const endVal = value;
    const startTime = performance.now();
    startTimeRef.current = startTime;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startVal + (endVal - startVal) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        startValRef.current = endVal;
      }
    };

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration]);

  return (
    <span
      style={{
        fontFamily: FONT_STACK,
        fontSize,
        fontWeight: 600,
        color,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
      }}
    >
      {displayValue.toLocaleString()}
    </span>
  );
};

const StatsCard: React.FC = () => {
  const { stats, theme } = useEditor();
  const isPaused = stats.isPaused;
  const [isMobile, setIsMobile] = useState(window.innerWidth < LAYOUT.mobileBreakpoint);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < LAYOUT.mobileBreakpoint);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const colors = theme === 'dark' ? DARK_COLORS : LIGHT_COLORS;
  const accentColor = theme === 'dark' ? '#818CF8' : '#F59E0B';

  return (
    <div
      style={{
        position: 'fixed',
        top: isMobile ? '16px' : '24px',
        right: isMobile ? '16px' : '32px',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        opacity: 0.7,
        transform: 'translateY(0)',
        transition: `all ${ANIMATION.cardTransition}ms cubic-bezier(0.16, 1, 0.3, 1)`,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.opacity = '1';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.opacity = '0.7';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          padding: isMobile ? '10px 14px' : '16px 20px',
          borderRadius: '12px',
          backgroundColor: colors.cardBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          border: `1px solid ${theme === 'dark' ? 'rgba(148,163,184,0.1)' : 'rgba(0,0,0,0.08)'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: isMobile ? '10px' : '14px' }}>
          <ThemeToggle />
          <div style={{ flex: 1 }} />
          <ExportButton />
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
            gap: isMobile ? '8px' : '16px',
          }}
        >
          <StatItem
            icon={<FileText size={isMobile ? 14 : 16} strokeWidth={1.8} color={accentColor} />}
            label="字数"
            value={
              <AnimatedNumber
                value={stats.wordCount}
                color={colors.text}
                fontSize={isMobile ? '18px' : '22px'}
              />
            }
            subValue="字"
            color={colors.text}
            compact={isMobile}
          />

          <StatItem
            icon={<Clock size={isMobile ? 14 : 16} strokeWidth={1.8} color={accentColor} />}
            label="时长"
            value={
              <span
                style={{
                  fontFamily: FONT_STACK,
                  fontSize: isMobile ? '16px' : '20px',
                  fontWeight: 600,
                  color: colors.text,
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '-0.02em',
                }}
              >
                {formatDuration(stats.writingDuration)}
              </span>
            }
            subValue={isPaused ? '已暂停' : ''}
            color={colors.text}
            compact={isMobile}
            subValueColor={isPaused ? '#F59E0B' : ''}
          />

          {(!isMobile || true) && (
            <StatItem
              icon={
                <div style={{ position: 'relative' }}>
                  <Zap size={isMobile ? 14 : 16} strokeWidth={1.8} color={accentColor} />
                </div>
              }
              label="击键频率"
              value={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <AnimatedNumber
                      value={stats.recentKeystrokeFrequency}
                      color={colors.text}
                      fontSize={isMobile ? '16px' : '20px'}
                    />
                    <span style={{ fontSize: '10px', color: colors.text, opacity: 0.5 }}>近5分</span>
                  </div>
                  {!isMobile && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                      <span
                        style={{
                          fontFamily: FONT_STACK,
                          fontSize: '13px',
                          fontWeight: 500,
                          color: colors.text,
                          opacity: 0.6,
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {stats.keystrokeFrequency}
                      </span>
                      <span style={{ fontSize: '10px', color: colors.text, opacity: 0.4 }}>全时段</span>
                    </div>
                  )}
                </div>
              }
              subValue="次/分"
              color={colors.text}
              compact={isMobile}
            />
          )}
        </div>

        {!isMobile && stats.keystrokeCount > 0 && (
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: `1px solid ${theme === 'dark' ? 'rgba(148,163,184,0.08)' : 'rgba(0,0,0,0.06)'}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: colors.text, opacity: 0.5 }}>
              <TrendingUp size={12} strokeWidth={1.8} />
              <span style={{ fontFamily: FONT_STACK, fontSize: '11px' }}>
                累计击键 {stats.keystrokeCount.toLocaleString()} 次
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subValue?: string;
  color: string;
  compact?: boolean;
  subValueColor?: string;
}

const StatItem: React.FC<StatItemProps> = ({ icon, label, value, subValue, color, compact, subValueColor }) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '4px' : '6px', minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        {icon}
        <span
          style={{
            fontFamily: FONT_STACK,
            fontSize: compact ? '10px' : '11px',
            color,
            opacity: 0.5,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', flexWrap: 'wrap' }}>
        {value}
        {subValue && (
          <span
            style={{
              fontFamily: FONT_STACK,
              fontSize: compact ? '10px' : '11px',
              color: subValueColor || color,
              opacity: subValueColor ? 1 : 0.5,
            }}
          >
            {subValue}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
