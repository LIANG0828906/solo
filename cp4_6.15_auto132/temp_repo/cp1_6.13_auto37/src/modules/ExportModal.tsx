import { useEffect, useState } from 'react';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  onExportSVG: () => void;
  onExportPNG: () => void;
  layerCount: number;
}

export function ExportModal({
  visible,
  onClose,
  onExportSVG,
  onExportPNG,
  layerCount
}: ExportModalProps) {
  const [show, setShow] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => {
        setTimeout(() => setShow(true), 10);
      });
    } else {
      setShow(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, onClose]);

  const handleExport = async (type: 'svg' | 'png', fn: () => void) => {
    setExporting(type);
    try {
      await new Promise(resolve => setTimeout(resolve, 50));
      fn();
    } finally {
      setExporting(null);
      onClose();
    }
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: show ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0)',
        transition: 'background 0.25s ease-in-out',
        pointerEvents: show ? 'auto' : 'none'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#2d2d44',
          borderRadius: 10,
          padding: '28px 32px',
          width: 400,
          maxWidth: '90vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          border: '1px solid #3d3d5c',
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.95)',
          transition: 'opacity 0.25s ease-out, transform 0.25s ease-out',
          pointerEvents: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            margin: 0,
            marginBottom: 8,
            fontSize: 18,
            fontWeight: 600,
            color: '#e0e0e0'
          }}
        >
          导出图形
        </h3>
        <p style={{ margin: 0, marginBottom: 20, fontSize: 13, color: '#888' }}>
          共 {layerCount} 个图形层，选择导出格式
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => handleExport('svg', onExportSVG)}
            disabled={exporting !== null}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 18px',
              borderRadius: 6,
              border: '1px solid #3d3d5c',
              background: 'rgba(255,255,255,0.04)',
              color: '#e0e0e0',
              cursor: exporting ? 'wait' : 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s, border-color 0.15s'
            }}
            onMouseEnter={(e) => {
              if (!exporting) {
                e.currentTarget.style.background = 'rgba(74,158,255,0.12)';
                e.currentTarget.style.borderColor = '#4a9eff';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = '#3d3d5c';
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                background: 'rgba(74,158,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0
              }}
            >
              📄
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>SVG 矢量图</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                无损缩放，适合设计稿、动画制作
              </div>
            </div>
            {exporting === 'svg' && <span style={{ fontSize: 12, color: '#4a9eff' }}>导出中...</span>}
          </button>

          <button
            onClick={() => handleExport('png', onExportPNG)}
            disabled={exporting !== null}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 18px',
              borderRadius: 6,
              border: '1px solid #3d3d5c',
              background: 'rgba(255,255,255,0.04)',
              color: '#e0e0e0',
              cursor: exporting ? 'wait' : 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s, border-color 0.15s'
            }}
            onMouseEnter={(e) => {
              if (!exporting) {
                e.currentTarget.style.background = 'rgba(255,140,0,0.12)';
                e.currentTarget.style.borderColor = '#ff8c00';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.borderColor = '#3d3d5c';
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 6,
                background: 'rgba(255,140,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                flexShrink: 0
              }}
            >
              🖼️
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>PNG 位图</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
                1200 × 800 像素，白色背景
              </div>
            </div>
            {exporting === 'png' && <span style={{ fontSize: 12, color: '#ff8c00' }}>导出中...</span>}
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              borderRadius: 5,
              border: '1px solid #3d3d5c',
              background: 'transparent',
              color: '#aaa',
              cursor: 'pointer',
              fontSize: 13,
              transition: 'background 0.1s, color 0.1s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#aaa';
            }}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
