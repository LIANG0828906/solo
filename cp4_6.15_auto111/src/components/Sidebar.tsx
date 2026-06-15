import { useState, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Shapes,
  Minus,
  Type,
  Sparkles,
  PanelLeftClose,
} from 'lucide-react';
import { CATEGORIES, getPresetsByCategory, NEON_COLORS } from '@/utils/presets';
import type { CategoryType, PresetElement } from '@/types';
import { useStore } from '@/store/slice';

interface Props {
  drawerMode?: boolean;
}

const categoryIcons: Record<CategoryType, React.ReactNode> = {
  basic: <Shapes size={14} />,
  line: <Minus size={14} />,
  text: <Type size={14} />,
  texture: <Sparkles size={14} />,
};

function NeonParticles({ x, y }: { x: number; y: number }) {
  const particles = Array.from({ length: 10 }).map((_, i) => {
    const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
    const dist = 30 + Math.random() * 40;
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;
    const color = NEON_COLORS[i % NEON_COLORS.length];
    return { px, py, color, id: i };
  });
  return (
    <>
      {particles.map((p) => (
        <span
          key={p.id}
          className="btn-particle"
          style={
            {
              left: x,
              top: y,
              background: p.color,
              ['--px' as string]: `${p.px}px`,
              ['--py' as string]: `${p.py}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </>
  );
}

export default function Sidebar({ drawerMode = false }: Props) {
  const [activeCategory, setActiveCategory] =
    useState<CategoryType>('basic');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);
  const particleIdRef = useRef(0);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);

  const presets = getPresetsByCategory(activeCategory);

  const handlePresetDragStart = useCallback(
    (e: React.DragEvent, preset: PresetElement) => {
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData(
        'application/cyber-preset',
        JSON.stringify(preset)
      );
      try {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const id = particleIdRef.current++;
        setParticles((p) => [...p, { id, x, y }]);
        setTimeout(
          () => setParticles((p) => p.filter((pp) => pp.id !== id)),
          700
        );
      } catch {
        // ignore
      }
    },
    []
  );

  const handlePresetClick = useCallback(
    (e: React.MouseEvent, preset: PresetElement) => {
      e.dataTransfer;
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = particleIdRef.current++;
      setParticles((p) => [...p, { id, x, y }]);
      setTimeout(
        () => setParticles((p) => p.filter((pp) => pp.id !== id)),
        700
      );

      const fakeEvt = {
        dataTransfer: {
          effectAllowed: 'copy',
          setData: () => {},
        },
      } as unknown as React.DragEvent;
      handlePresetDragStart(fakeEvt, preset);

      const canvasEl = document.getElementById('cyber-canvas');
      if (canvasEl) {
        const crect = canvasEl.getBoundingClientRect();
        const cx = (crect.width - preset.defaultWidth) / 2;
        const cy = (crect.height - preset.defaultHeight) / 2;
        const customEvent = new CustomEvent('cyber-drop-preset', {
          detail: { preset, canvasX: cx, canvasY: cy },
        });
        canvasEl.dispatchEvent(customEvent);
      }
    },
    [handlePresetDragStart]
  );

  const renderContent = () => (
    <div
      className="glass-panel"
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: drawerMode ? '16px 16px 0 0' : 0,
        border: drawerMode ? undefined : 'none',
        borderRight: drawerMode ? undefined : '1px solid var(--glass-border)',
      }}
    >
      <div
        style={{
          padding: '14px 16px 10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.16em',
            background:
              'linear-gradient(90deg, var(--neon-magenta), var(--neon-cyan))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          ELEMENTS
        </div>
        {!drawerMode && (
          <button
            onClick={toggleSidebar}
            className="btn-neon"
            style={{ padding: '4px 6px', minWidth: 28 }}
            title={sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
          >
            {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
        {drawerMode && (
          <button
            onClick={() => setDrawerOpen((o) => !o)}
            className="btn-neon"
            style={{ padding: '4px 6px', minWidth: 28 }}
          >
            <PanelLeftClose size={14} />
          </button>
        )}
      </div>

      <div
        style={{
          padding: '10px 12px',
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          flexWrap: drawerMode ? 'nowrap' : 'wrap',
        }}
      >
        {CATEGORIES.map((cat) => (
          <div
            key={cat.key}
            className={`category-tab ${
              activeCategory === cat.key ? 'active' : ''
            }`}
            onClick={() => setActiveCategory(cat.key)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            {categoryIcons[cat.key]}
            <span>{cat.label}</span>
          </div>
        ))}
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 12,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 10,
          }}
        >
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="preset-card"
              draggable
              onDragStart={(e) => handlePresetDragStart(e, preset)}
              onClick={(e) => handlePresetClick(e, preset)}
              style={{
                aspectRatio: '1 / 1',
                padding: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 4,
                position: 'relative',
                overflow: 'hidden',
              }}
              title={preset.name}
            >
              <div
                style={{
                  width: '100%',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: preset.defaultColor,
                  padding: '6px 4px',
                }}
              >
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="xMidYMid meet"
                  width="100%"
                  height="100%"
                  style={{
                    filter: `drop-shadow(0 0 4px ${preset.defaultColor}aa)`,
                  }}
                  dangerouslySetInnerHTML={{ __html: preset.svgContent }}
                />
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.05em',
                  textAlign: 'center',
                }}
              >
                {preset.name}
              </div>
              {particles.map((p) => (
                <NeonParticles key={p.id} x={p.x} y={p.y} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (drawerMode) {
    return (
      <div
        style={{
          margin: 8,
          maxHeight: drawerOpen ? '55vh' : 52,
          transition: 'max-height 0.35s ease',
          overflow: 'hidden',
          borderRadius: 16,
          boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
        }}
      >
        {renderContent()}
      </div>
    );
  }

  return renderContent();
}
