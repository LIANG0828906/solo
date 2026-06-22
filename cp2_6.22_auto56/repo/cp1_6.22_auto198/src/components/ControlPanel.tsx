import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, GripVertical, X } from 'lucide-react';
import type { FilterParams } from '@/types';

interface ControlPanelProps {
  filters: FilterParams;
  onChange: (f: FilterParams) => void;
}

type SectionKey = 'time' | 'magnitude' | 'plates';

export default function ControlPanel({ filters, onChange }: ControlPanelProps) {
  const [pos, setPos] = useState({ x: 20, y: 20 });
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(true);

  const [sections, setSections] = useState<Record<SectionKey, boolean>>({
    time: true,
    magnitude: true,
    plates: true,
  });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    setDragging(true);
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
  }, [isMobile]);

  useEffect(() => {
    if (!dragging) return;
    const move = (e: MouseEvent) => {
      setPos({
        x: Math.max(0, Math.min(window.innerWidth - 300, e.clientX - dragOffset.current.x)),
        y: Math.max(0, Math.min(window.innerHeight - 200, e.clientY - dragOffset.current.y)),
      });
    };
    const up = () => setDragging(false);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
  }, [dragging]);

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: drawerOpen ? 0 : -320,
        left: 0,
        right: 0,
        width: '100%',
        maxHeight: '50vh',
        borderRadius: '16px 16px 0 0',
        transition: 'bottom 0.3s ease',
        zIndex: 50,
      }
    : {
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        width: 300,
        cursor: dragging ? 'grabbing' : 'default',
        zIndex: 50,
      };

  const toggle = (k: SectionKey) =>
    setSections((s) => ({ ...s, [k]: !s[k] }));

  const timeOptions: Array<{ key: FilterParams['timeRange']; label: string }> = [
    { key: '7d', label: '最近 7 天' },
    { key: '30d', label: '最近 30 天' },
    { key: 'all', label: '全部' },
  ];

  return (
    <div
      ref={panelRef}
      style={{
        ...panelStyle,
        background: '#1A1A2E',
        border: '2px solid #E94560',
        borderRadius: isMobile ? '16px 16px 0 0' : 16,
        boxShadow: '0 0 15px rgba(233,69,96,0.3)',
        color: '#E0E0E0',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
        userSelect: 'none',
        overflow: 'hidden',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        onMouseDown={onMouseDown}
        style={{
          padding: isMobile ? '10px 14px' : '10px 12px',
          background: 'linear-gradient(90deg, #1A1A2E, #2A1A3E)',
          borderBottom: '1px solid rgba(233,69,96,0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: isMobile ? 'pointer' : 'grab',
        }}
        onClick={() => isMobile && setDrawerOpen(!drawerOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!isMobile && <GripVertical size={16} color="#E94560" />}
          <span style={{ fontWeight: 600, fontSize: 14, letterSpacing: 0.5 }}>控制面板</span>
        </div>
        {isMobile ? (
          drawerOpen ? <ChevronDown size={18} color="#E0E0E0" /> : <ChevronUp size={18} color="#E0E0E0" />
        ) : null}
      </div>

      <div style={{ padding: 12, overflowY: 'auto', maxHeight: isMobile ? 'calc(50vh - 44px)' : 'calc(100vh - 120px)' }}>
        <Section title="时间筛选" open={sections.time} onToggle={() => toggle('time')}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {timeOptions.map((opt) => {
              const active = filters.timeRange === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => onChange({ ...filters, timeRange: opt.key })}
                  style={{
                    flex: 1,
                    minWidth: 70,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    color: active ? '#fff' : '#E0E0E0',
                    background: active ? '#E94560' : 'rgba(255,255,255,0.06)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Section>

        <Section title="震级筛选" open={sections.magnitude} onToggle={() => toggle('magnitude')}>
          <div style={{ padding: '8px 4px 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8, color: '#aaa' }}>
              <span>最小: {filters.magnitudeMin.toFixed(1)}</span>
              <span>最大: {filters.magnitudeMax.toFixed(1)}</span>
            </div>
            <div style={{ position: 'relative', height: 28 }}>
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 0,
                  right: 0,
                  height: 4,
                  background: '#533483',
                  borderRadius: 2,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  left: `${(filters.magnitudeMin / 10) * 100}%`,
                  right: `${100 - (filters.magnitudeMax / 10) * 100}%`,
                  height: 4,
                  background: '#E94560',
                  borderRadius: 2,
                }}
              />
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={filters.magnitudeMin}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  onChange({
                    ...filters,
                    magnitudeMin: Math.min(v, filters.magnitudeMax - 0.5),
                  });
                }}
                style={thumbStyle}
              />
              <input
                type="range"
                min={0}
                max={10}
                step={0.5}
                value={filters.magnitudeMax}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  onChange({
                    ...filters,
                    magnitudeMax: Math.max(v, filters.magnitudeMin + 0.5),
                  });
                }}
                style={{ ...thumbStyle, pointerEvents: 'auto' }}
              />
            </div>
          </div>
        </Section>

        <Section title="板块边界" open={sections.plates} onToggle={() => toggle('plates')}>
          <button
            onClick={() => onChange({ ...filters, showPlateBoundaries: !filters.showPlateBoundaries })}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 8,
              border: `1.5px solid ${filters.showPlateBoundaries ? '#FF6B35' : 'rgba(255,255,255,0.2)'}`,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              color: '#fff',
              background: filters.showPlateBoundaries
                ? 'linear-gradient(90deg, rgba(255,107,53,0.3), rgba(233,69,96,0.3))'
                : 'rgba(255,255,255,0.05)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
            }}
          >
            <span style={{ color: '#FF6B35' }}>●</span>
            <span>{filters.showPlateBoundaries ? '板块边界：开启' : '板块边界：关闭'}</span>
            <span
              style={{
                width: 32,
                height: 18,
                borderRadius: 9,
                background: filters.showPlateBoundaries ? '#FF6B35' : 'rgba(255,255,255,0.15)',
                position: 'relative',
                transition: 'background 0.2s',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: filters.showPlateBoundaries ? 16 : 2,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: '#fff',
                  transition: 'left 0.2s',
                }}
              />
            </span>
          </button>
        </Section>
      </div>
    </div>
  );
}

const thumbStyle: React.CSSProperties = {
  position: 'absolute',
  top: 4,
  left: 0,
  width: '100%',
  height: 20,
  background: 'transparent',
  WebkitAppearance: 'none',
  appearance: 'none',
  pointerEvents: 'none',
  zIndex: 2,
};

interface SectionProps {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, open, onToggle, children }: SectionProps) {
  return (
    <div style={{ marginBottom: 10 }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '10px 4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'transparent',
          border: 'none',
          color: '#E0E0E0',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          borderBottom: open ? '1px solid rgba(233,69,96,0.2)' : '1px solid rgba(255,255,255,0.06)',
          letterSpacing: 0.3,
        }}
      >
        <span>{title}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      <div
        style={{
          maxHeight: open ? 400 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.25s ease',
          paddingTop: open ? 8 : 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}
