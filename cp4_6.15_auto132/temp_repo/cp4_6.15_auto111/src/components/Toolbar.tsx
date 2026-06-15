import { useCallback, useRef, useState } from 'react';
import {
  Undo2,
  Redo2,
  AlignCenter,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  Download,
  PanelLeftOpen,
  Trash2,
} from 'lucide-react';
import { useStore } from '@/store/slice';
import ExportModal from './ExportModal';

export default function Toolbar() {
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const alignCenter = useStore((s) => s.alignCenter);
  const distributeHorizontal = useStore((s) => s.distributeHorizontal);
  const distributeVertical = useStore((s) => s.distributeVertical);
  const history = useStore((s) => s.history);
  const selectedIds = useStore((s) => s.selectedIds);
  const elements = useStore((s) => s.elements);
  const deleteElements = useStore((s) => s.deleteElements);
  const responsiveMode = useStore((s) => s.responsiveMode);
  const toggleSidebar = useStore((s) => s.toggleSidebar);
  const sidebarCollapsed = useStore((s) => s.sidebarCollapsed);

  const [exportOpen, setExportOpen] = useState(false);
  const rippleIdRef = useRef(0);
  const [ripplesByBtn, setRipplesByBtn] = useState<
    Record<string, Array<{ id: number; x: number; y: number }>>
  >({});

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  const hasSelection = selectedIds.length > 0;

  const handleClick = useCallback(
    (
      key: string,
      e: React.MouseEvent<HTMLElement>,
      handler?: () => void
    ) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = rippleIdRef.current++;
      setRipplesByBtn((m) => ({
        ...m,
        [key]: [...(m[key] || []), { id, x, y }],
      }));
      setTimeout(
        () =>
          setRipplesByBtn((m) => ({
            ...m,
            [key]: (m[key] || []).filter((rr) => rr.id !== id),
          })),
        650
      );
      handler?.();
    },
    []
  );

  const renderButton = (
    key: string,
    icon: React.ReactNode,
    label: string,
    handler?: () => void,
    opts: { disabled?: boolean; primary?: boolean; danger?: boolean } = {}
  ) => {
    const ripples = ripplesByBtn[key] || [];
    return (
      <button
        className={`btn-neon ${opts.primary ? 'btn-neon-primary' : ''}`}
        style={{
          position: 'relative',
          overflow: 'hidden',
          minWidth: responsiveMode === 'desktop' ? 38 : 34,
          padding: responsiveMode === 'desktop' ? '8px 10px' : '6px 8px',
          borderColor: opts.danger ? 'rgba(255,45,149,0.45)' : undefined,
          color: opts.danger ? 'var(--neon-magenta)' : undefined,
        }}
        title={label}
        disabled={opts.disabled}
        onClick={(e) => handleClick(key, e, handler)}
      >
        {icon}
        {responsiveMode === 'desktop' && (
          <span style={{ fontSize: 11 }}>{label}</span>
        )}
        {ripples.map((r) => (
          <span
            key={r.id}
            className="btn-ripple"
            style={{
              left: r.x - 15,
              top: r.y - 15,
              width: 30,
              height: 30,
            }}
          />
        ))}
      </button>
    );
  };

  return (
    <>
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '0 14px',
          zIndex: 50,
          borderBottom: '1px solid rgba(255,45,149,0.15)',
          borderRadius: 0,
          overflowX: responsiveMode !== 'desktop' ? 'auto' : 'visible',
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: responsiveMode === 'desktop' ? 16 : 14,
            fontWeight: 800,
            letterSpacing: '0.18em',
            marginRight: 10,
            background:
              'linear-gradient(90deg, var(--neon-magenta) 0%, var(--neon-cyan) 50%, var(--neon-green) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundSize: '200% 100%',
            animation: 'bgGridFlow 4s linear infinite',
            whiteSpace: 'nowrap',
          }}
        >
          赛博街牌 · CYBER
        </div>

        <div
          style={{
            width: 1,
            height: 24,
            background:
              'linear-gradient(180deg, transparent, rgba(255,45,149,0.3), transparent)',
            margin: '0 4px',
            flexShrink: 0,
          }}
        />

        {responsiveMode !== 'desktop' &&
          renderButton(
            'sidebar',
            <PanelLeftOpen size={16} />,
            '侧边栏',
            toggleSidebar
          )}

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 4px',
            borderRadius: 10,
            background: 'rgba(0,240,255,0.04)',
            border: '1px solid rgba(0,240,255,0.15)',
            flexShrink: 0,
          }}
        >
          {renderButton(
            'center',
            <AlignCenter size={15} />,
            '居中',
            alignCenter,
            { disabled: !hasSelection }
          )}
          {renderButton(
            'hdist',
            <AlignHorizontalDistributeCenter size={15} />,
            '横布',
            distributeHorizontal,
            { disabled: selectedIds.length < 3 }
          )}
          {renderButton(
            'vdist',
            <AlignVerticalDistributeCenter size={15} />,
            '竖布',
            distributeVertical,
            { disabled: selectedIds.length < 3 }
          )}
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 4px',
            borderRadius: 10,
            background: 'rgba(255,45,149,0.04)',
            border: '1px solid rgba(255,45,149,0.15)',
            flexShrink: 0,
          }}
        >
          {renderButton(
            'undo',
            <Undo2 size={15} />,
            '撤销',
            undo,
            { disabled: !canUndo }
          )}
          {renderButton(
            'redo',
            <Redo2 size={15} />,
            '重做',
            redo,
            { disabled: !canRedo }
          )}
          {renderButton(
            'delete',
            <Trash2 size={15} />,
            '删除',
            () => deleteElements(selectedIds),
            { disabled: !hasSelection, danger: true }
          )}
        </div>

        <div style={{ flex: 1 }} />

        <div
          style={{
            fontSize: 10,
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)',
            marginRight: 10,
            whiteSpace: 'nowrap',
            display: responsiveMode === 'desktop' ? 'block' : 'none',
          }}
        >
          元素 {elements.length} · 选中 {selectedIds.length}
        </div>

        {renderButton(
          'export',
          <Download size={16} />,
          '导出',
          () => setExportOpen(true),
          { primary: true }
        )}
      </div>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </>
  );
}
