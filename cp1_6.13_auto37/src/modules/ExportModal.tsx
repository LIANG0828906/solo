import { useEffect, useState } from 'react';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  onExportSVG: () => Promise<void>;
  onExportPNG: () => Promise<void>;
  layerCount: number;
}

export function ExportModal({
  open,
  onClose,
  onExportSVG,
  onExportPNG,
  layerCount
}: ExportModalProps) {
  const [visible, setVisible] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportType, setExportType] = useState<'svg' | 'png' | null>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
    } else {
      setVisible(false);
    }
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (open && e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!open && !visible) return null;

  const handleExport = async (type: 'svg' | 'png') => {
    if (exporting) return;
    setExporting(true);
    setExportType(type);
    try {
      if (type === 'svg') {
        await onExportSVG();
      } else {
        await onExportPNG();
      }
      setTimeout(() => {
        setExporting(false);
        setExportType(null);
        onClose();
      }, 400);
    } catch (err) {
      console.error('Export failed:', err);
      setExporting(false);
      setExportType(null);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: visible ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        transition: 'background 0.25s ease-out',
        backdropFilter: visible ? 'blur(3px)' : 'blur(0px)'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#2d2d44',
          borderRadius: 12,
          padding: 28,
          minWidth: 360,
          maxWidth: 420,
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
          transition: 'opacity 0.22s ease-out, transform 0.22s cubic-bezier(0.34,1.56,0.64,1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #4a9eff 0%, #7c5cff 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20
            }}
          >
            📤
          </div>
          <div>
            <h2 style={{ color: '#e0e0e0', fontSize: 18, margin: 0, fontWeight: 600 }}>
              导出图形
            </h2>
            <p style={{ color: '#888', fontSize: 12, margin: '4px 0 0 0' }}>
              共 {layerCount} 个图形层
            </p>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid #3d3d5c',
            margin: '16px -28px 20px -28px'
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ExportOption
            icon="📐"
            title="SVG 矢量图"
            desc="可缩放矢量格式，支持二次编辑"
            onClick={() => handleExport('svg')}
            loading={exporting && exportType === 'svg'}
            disabled={exporting}
            primary
          />
          <ExportOption
            icon="🖼"
            title="PNG 位图"
            desc="1200×800 白色背景，适合预览分享"
            onClick={() => handleExport('png')}
            loading={exporting && exportType === 'png'}
            disabled={exporting}
          />
        </div>

        <div style={{ marginTop: 22, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            disabled={exporting}
            style={{
              background: 'transparent',
              border: '1px solid #444',
              color: '#aaa',
              padding: '8px 20px',
              borderRadius: 6,
              fontSize: 13,
              cursor: exporting ? 'not-allowed' : 'pointer',
              transition: 'all 0.1s'
            }}
            onMouseEnter={(e) => {
              if (!exporting) {
                e.currentTarget.style.borderColor = '#666';
                e.currentTarget.style.color = '#fff';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#444';
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

function ExportOption({
  icon, title, desc, onClick, loading, disabled, primary
}: {
  icon: string;
  title: string;
  desc: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        background: primary
          ? (loading ? 'rgba(74,158,255,0.35)' : 'rgba(74,158,255,0.12)')
          : (loading ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.04)'),
        border: primary
          ? `1px solid ${loading ? '#4a9eff' : 'rgba(74,158,255,0.4)'}`
          : '1px solid #3d3d5c',
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        textAlign: 'left',
        transition: 'all 0.12s',
        position: 'relative',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = primary
            ? 'rgba(74,158,255,0.22)'
            : 'rgba(255,255,255,0.08)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = primary
            ? 'rgba(74,158,255,0.12)'
            : 'rgba(255,255,255,0.04)';
        }
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 8,
          background: primary ? 'rgba(74,158,255,0.25)' : 'rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0
        }}
      >
        {loading ? (
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              border: `2px solid ${primary ? '#4a9eff' : '#888'}`,
              borderTopColor: 'transparent',
              animation: 'spin 0.7s linear infinite'
            }}
          />
        ) : icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: loading ? '#4a9eff' : '#e0e0e0', fontSize: 14, fontWeight: 600 }}>
          {loading ? '导出中...' : title}
        </div>
        <div style={{ color: '#888', fontSize: 11.5, marginTop: 3 }}>
          {desc}
        </div>
      </div>
      <div style={{ color: '#666', fontSize: 18 }}>
        {!loading && '→'}
      </div>
    </button>
  );
}
