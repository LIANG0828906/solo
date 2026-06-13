import React, { memo, useState, useEffect } from 'react';
import { LayoutManager } from '../layout/LayoutManager';
import { LayoutState, AVAILABLE_FONTS, ElementType, TextElement } from '../types';

interface ToolbarProps {
  layoutManager: LayoutManager;
  onExport: () => void;
  isExporting: boolean;
}

const colorSwatches = [
  '#2B3A4D', '#4A6B8C', '#FFFFFF', '#000000',
  '#E74C3C', '#E67E22', '#F1C40F', '#27AE60',
  '#3498DB', '#9B59B6', '#1ABC9C', '#95A5A6',
];

export const Toolbar: React.FC<ToolbarProps> = memo(
  ({ layoutManager, onExport, isExporting }) => {
    const [state, setState] = useState<LayoutState>(layoutManager.getState());

    useEffect(() => {
      return layoutManager.subscribe((s) => setState(s));
    }, [layoutManager]);

    const selected = state.selectedId
      ? state.elements.find((e) => e.id === state.selectedId)
      : null;
    const isText = selected?.type === ElementType.TEXT;
    const textEl = selected as TextElement | undefined;

    const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96];

    return (
      <div
        style={{
          height: 56,
          background: '#FFFFFF',
          borderBottom: '1px solid #D0D7DF',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          gap: 16,
          flexShrink: 0,
          minWidth: 0,
          overflowX: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginRight: 8,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              background: 'linear-gradient(135deg, #2B3A4D, #4A6B8C)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            P
          </div>
          <span
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: '#2B3A4D',
              letterSpacing: 0.5,
            }}
          >
            PosterCraft
          </span>
        </div>

        <div style={{ width: 1, height: 28, background: '#D0D7DF' }} />

        <ToolGroup label="字体">
          <select
            disabled={!isText}
            value={isText ? textEl?.fontFamily : ''}
            onChange={(e) => {
              if (state.selectedId) {
                layoutManager.updateElement(state.selectedId, {
                  fontFamily: e.target.value,
                } as Partial<TextElement>);
              }
            }}
            style={selectStyle(!isText)}
          >
            <option value="" disabled>
              选择字体
            </option>
            {AVAILABLE_FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </ToolGroup>

        <ToolGroup label="字号">
          <select
            disabled={!isText}
            value={isText ? String(textEl?.fontSize) : ''}
            onChange={(e) => {
              if (state.selectedId) {
                layoutManager.updateElement(state.selectedId, {
                  fontSize: Number(e.target.value),
                } as Partial<TextElement>);
              }
            }}
            style={selectStyle(!isText)}
          >
            <option value="" disabled>
              字号
            </option>
            {fontSizes.map((s) => (
              <option key={s} value={s}>
                {s}px
              </option>
            ))}
          </select>
        </ToolGroup>

        <ToolGroup label="文字色">
          <ColorPicker
            disabled={!isText}
            value={isText ? textEl?.color || '#2B3A4D' : '#2B3A4D'}
            onChange={(c) => {
              if (state.selectedId) {
                layoutManager.updateElement(state.selectedId, {
                  color: c,
                } as Partial<TextElement>);
              }
            }}
          />
        </ToolGroup>

        <ToolGroup label="背景色">
          <ColorPicker
            value={state.backgroundColor}
            onChange={(c) => layoutManager.setBackgroundColor(c)}
          />
        </ToolGroup>

        <div style={{ flex: 1 }} />

        <button
          onClick={onExport}
          disabled={isExporting}
          style={{
            height: 36,
            padding: '0 18px',
            border: 'none',
            borderRadius: 4,
            background: isExporting ? '#8AA1BB' : 'linear-gradient(135deg, #2B3A4D, #4A6B8C)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: isExporting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'all 0.2s',
            boxShadow: isExporting ? 'none' : '0 2px 8px rgba(43,58,77,0.3)',
            letterSpacing: 0.5,
          }}
        >
          {isExporting ? (
            <>
              <span
                style={{
                  width: 14,
                  height: 14,
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }}
              />
              生成中...
            </>
          ) : (
            <>
              <span>⬇</span>
              导出PNG
            </>
          )}
        </button>

        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
);

Toolbar.displayName = 'Toolbar';

const selectStyle = (disabled: boolean): React.CSSProperties => ({
  height: 32,
  minWidth: 100,
  padding: '0 8px',
  borderRadius: 4,
  border: '1px solid #D0D7DF',
  background: disabled ? '#F5F7FA' : '#fff',
  color: disabled ? '#95A5A6' : '#2B3A4D',
  fontSize: 12,
  cursor: disabled ? 'not-allowed' : 'pointer',
  outline: 'none',
});

const ToolGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
    <span
      style={{
        fontSize: 11,
        color: '#6B7C8D',
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
    {children}
  </div>
);

const ColorPicker: React.FC<{
  value: string;
  onChange: (c: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const ref = useRefOutside(() => setOpen(false));

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        style={{
          width: 32,
          height: 32,
          borderRadius: 4,
          border: '1px solid #D0D7DF',
          background: '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          padding: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            borderRadius: 2,
            background: value,
            border: value === '#FFFFFF' ? '1px solid #D0D7DF' : 'none',
            boxSizing: 'border-box',
          }}
        />
      </button>
      {open && (
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 0,
            zIndex: 99999,
            background: '#fff',
            border: '1px solid #D0D7DF',
            borderRadius: 6,
            padding: 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            width: 140,
          }}
        >
          {colorSwatches.map((c) => (
            <button
              key={c}
              onClick={() => {
                onChange(c);
                setOpen(false);
              }}
              style={{
                width: 24,
                height: 24,
                borderRadius: 3,
                border: c === value ? '2px solid #4A6B8C' : '1px solid #D0D7DF',
                background: c,
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              color: '#6B7C8D',
              marginTop: 4,
              width: '100%',
            }}
          >
            <input
              type="color"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              style={{ width: 24, height: 24, cursor: 'pointer', border: 'none', padding: 0 }}
            />
            <span style={{ flex: 1 }}>自定义</span>
          </label>
        </div>
      )}
    </div>
  );
};

function useRefOutside<T extends HTMLElement>(handler: () => void): React.RefObject<T> {
  const ref = React.useRef<T>(null);
  React.useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    };
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [handler]);
  return ref;
}
