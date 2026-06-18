import React, { useState, useRef, useEffect } from 'react';
import type { ColorItem } from '../../store/colorStore';
import { rgbToString, hslToString, copyToClipboard } from '../../utils/colorUtils';

interface ExportPanelProps {
  colors: ColorItem[];
}

type CopyState = 'copy' | 'copied' | 'failed';

const ExportPanel: React.FC<ExportPanelProps> = ({ colors }) => {
  const [showExport, setShowExport] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [pickedColor, setPickedColor] = useState('#8B5CF6');
  const [copyState, setCopyState] = useState<CopyState>('copy');
  const [lastExport, setLastExport] = useState<CopyState>('copy');
  const exportRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setShowExport(false);
      }
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const generateCSS = () => {
    if (colors.length === 0) return '/* 暂无颜色 */';
    const lines: string[] = [':root {'];
    colors.forEach((c, i) => {
      const idx = i + 1;
      lines.push(`  --color-${idx}: ${c.hex};`);
      lines.push(`  --color-${idx}-rgb: ${rgbToString(c.rgb)};`);
      lines.push(`  --color-${idx}-hsl: ${hslToString(c.hsl)};`);
    });
    lines.push('}');
    return lines.join('\n');
  };

  const generateJSON = () => {
    if (colors.length === 0) return '[]';
    return JSON.stringify(
      colors.map((c, i) => ({
        index: i + 1,
        name: `Color ${i + 1}`,
        hex: c.hex,
        rgb: c.rgb,
        hsl: c.hsl,
        percentage: c.percentage,
        locked: c.locked,
      })),
      null,
      2
    );
  };

  const triggerCopyAnimation = () => {
    setLastExport('copied');
    setTimeout(() => setLastExport('copy'), 1200);
  };

  const handleExport = async (type: 'css' | 'json') => {
    const content = type === 'css' ? generateCSS() : generateJSON();
    const ok = await copyToClipboard(content);
    setShowExport(false);
    if (ok) {
      triggerCopyAnimation();
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `palette.${type === 'css' ? 'css' : 'json'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleCopyAll = async () => {
    if (colors.length === 0) return;
    const content = colors.map(c => `${c.hex.toUpperCase()}`).join('\n');
    const ok = await copyToClipboard(content);
    setCopyState(ok ? 'copied' : 'failed');
    setTimeout(() => setCopyState('copy'), 1200);
  };

  const handleAddColor = async () => {
    setShowPicker(false);
    const { hexToRgb, rgbToHsl } = await import('../../utils/colorUtils');
    const rgb = hexToRgb(pickedColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const { useColorStore } = await import('../../store/colorStore');
    useColorStore.getState().addManualColor({ hex: pickedColor.toUpperCase(), rgb, hsl });
    setPickedColor('#8B5CF6');
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* 添加颜色按钮 + 色轮弹窗 */}
      <div ref={pickerRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setShowPicker((v) => !v)}
          style={{
            padding: '12px 22px',
            border: '1px solid rgba(165, 180, 252, 0.3)',
            background: 'rgba(45, 46, 68, 0.7)',
            color: '#E4E4E7',
            borderRadius: 10,
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
            e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(45, 46, 68, 0.7)';
            e.currentTarget.style.borderColor = 'rgba(165, 180, 252, 0.3)';
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A5B4FC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          添加颜色
        </button>
        {showPicker && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              left: 0,
              zIndex: 100,
              background: '#2D2E44',
              padding: 14,
              borderRadius: 12,
              boxShadow: '0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(165,180,252,0.15)',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              minWidth: 230,
            }}
          >
            <input
              type="color"
              value={pickedColor}
              onChange={(e) => setPickedColor(e.target.value)}
              style={{
                width: '100%',
                height: 110,
                border: 'none',
                borderRadius: 8,
                background: 'transparent',
                cursor: 'pointer',
                padding: 0,
              }}
            />
            <input
              type="text"
              value={pickedColor.toUpperCase()}
              onChange={(e) => {
                let v = e.target.value.trim();
                if (!v.startsWith('#')) v = '#' + v;
                if (/^#[0-9A-Fa-f]{6}$/.test(v)) setPickedColor(v);
              }}
              style={{
                width: '100%',
                padding: '9px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(165,180,252,0.2)',
                borderRadius: 8,
                color: '#E4E4E7',
                fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
                fontSize: '0.85rem',
                outline: 'none',
                letterSpacing: 0.3,
              }}
            />
            <button
              onClick={handleAddColor}
              style={{
                padding: '10px 16px',
                border: 'none',
                borderRadius: 8,
                background: `linear-gradient(135deg, ${pickedColor}, rgba(139,92,246,0.8))`,
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              添加到调色板
            </button>
          </div>
        )}
      </div>

      {/* 导出下拉 */}
      <div ref={exportRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setShowExport((v) => !v)}
          style={{
            padding: '12px 22px',
            border: '1px solid rgba(165, 180, 252, 0.3)',
            background: lastExport === 'copied'
              ? 'rgba(16, 185, 129, 0.2)'
              : 'rgba(45, 46, 68, 0.7)',
            color: lastExport === 'copied' ? '#10B981' : '#E4E4E7',
            borderRadius: 10,
            fontSize: '0.9rem',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.25s ease',
            boxShadow: '0 2px 8px rgba(139, 92, 246, 0.1)',
            borderColor: lastExport === 'copied' ? 'rgba(16,185,129,0.6)' : undefined,
          }}
          onMouseEnter={(e) => {
            if (lastExport !== 'copied') {
              e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.6)';
            }
          }}
          onMouseLeave={(e) => {
            if (lastExport !== 'copied') {
              e.currentTarget.style.background = 'rgba(45, 46, 68, 0.7)';
              e.currentTarget.style.borderColor = 'rgba(165, 180, 252, 0.3)';
            }
          }}
        >
          {lastExport === 'copied' ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              已导出
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A5B4FC" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              导出
            </>
          )}
        </button>
        {showExport && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 10px)',
              left: 0,
              zIndex: 100,
              background: '#2D2E44',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(165,180,252,0.15)',
              minWidth: 200,
            }}
          >
            {[
              { type: 'css' as const, label: '导出 CSS 变量', sub: ':root { --color-1: ... }' },
              { type: 'json' as const, label: '导出 JSON', sub: '[{ "hex": ... }]' },
            ].map((item) => (
              <button
                key={item.type}
                onClick={() => handleExport(item.type)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  border: 'none',
                  background: 'transparent',
                  color: '#E4E4E7',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  transition: 'background 0.15s',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139,92,246,0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{item.label}</span>
                <span style={{ fontSize: '0.72rem', color: '#6B7280', fontFamily: 'ui-monospace, Menlo, Consolas, monospace' }}>{item.sub}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 一键复制所有色值 */}
      <button
        onClick={handleCopyAll}
        disabled={colors.length === 0}
        style={{
          padding: '12px 24px',
          border: 'none',
          background: copyState === 'copied'
            ? 'linear-gradient(135deg, #10B981, #059669)'
            : copyState === 'failed'
            ? 'linear-gradient(135deg, #EF4444, #DC2626)'
            : 'linear-gradient(135deg, #8B5CF6, #6366F1)',
          color: '#FFFFFF',
          borderRadius: 10,
          fontSize: '0.9rem',
          fontWeight: 600,
          cursor: colors.length === 0 ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          transition: 'all 0.25s ease',
          transform: copyState === 'copied' ? 'scale(1.03)' : 'scale(1)',
          boxShadow: copyState === 'copied'
            ? '0 4px 16px rgba(16, 185, 129, 0.4)'
            : '0 4px 16px rgba(139, 92, 246, 0.3)',
          opacity: colors.length === 0 ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (copyState === 'copy' && colors.length > 0) {
            e.currentTarget.style.transform = 'translateY(-1px)';
          }
        }}
        onMouseLeave={(e) => {
          if (copyState === 'copy') e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {copyState === 'copied' ? (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                animation: 'checkmark-pop 0.4s ease-out',
              }}
            >
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            已复制
          </>
        ) : copyState === 'failed' ? (
          '复制失败'
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            复制全部
          </>
        )}
      </button>

      <style>{`
        @keyframes checkmark-pop {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          50% { transform: scale(1.3) rotate(5deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default ExportPanel;
