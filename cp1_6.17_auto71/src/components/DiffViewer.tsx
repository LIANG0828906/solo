import { useMemo } from 'react';
import { computeDiff, DiffLine } from '@/utils/diffEngine';

interface DiffViewerProps {
  oldCode: string;
  newCode: string;
  onClose: () => void;
}

const DiffViewer = ({ oldCode, newCode, onClose }: DiffViewerProps) => {
  const diffResult = useMemo(() => {
    const start = performance.now();
    const result = computeDiff(oldCode, newCode);
    const elapsed = performance.now() - start;
    if (elapsed > 50) {
      console.warn(`Diff计算耗时 ${elapsed.toFixed(1)}ms (超过50ms阈值)`);
    }
    return result;
  }, [oldCode, newCode]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        padding: 24,
        animation: 'fadeIn 0.2s ease-in-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(900px, 90vw)',
          height: 'min(500px, 70vh)',
          background: '#2D2D2D',
          borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'slideUp 0.2s ease-in-out',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #3A3A3C',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h3 style={{ color: '#FFFFFF', fontSize: 15, fontWeight: 600, margin: 0 }}>
              版本对比
            </h3>
            <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
              <span style={{ color: '#D4D4D4' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: '#8D3C3C',
                    marginRight: 6,
                  }}
                />
                删除 {diffResult.removeCount}
              </span>
              <span style={{ color: '#D4D4D4' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: '#3C8D3C',
                    marginRight: 6,
                  }}
                />
                新增 {diffResult.addCount}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              color: '#D4D4D4',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#007ACC40';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
            }}
          >
            ×
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minWidth: 600 }}>
            {diffResult.lines.map((line: DiffLine, idx: number) => (
              <LineRow key={idx} line={line} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const LineRow = ({ line }: { line: DiffLine }) => {
  const baseStyle: React.CSSProperties = {
    padding: '3px 12px',
    fontSize: 13,
    fontFamily: '"Fira Code", monospace',
    lineHeight: '20px',
    whiteSpace: 'pre',
    borderBottom: '1px solid rgba(255,255,255,0.03)',
  };

  const lineNumStyle: React.CSSProperties = {
    display: 'inline-block',
    width: 40,
    color: '#6A6A6A',
    userSelect: 'none',
    textAlign: 'right',
    paddingRight: 12,
  };

  if (line.type === 'equal') {
    return (
      <>
        <div style={{ ...baseStyle, background: 'transparent' }}>
          <span style={lineNumStyle}>{line.leftLine}</span>
          <span style={{ color: '#D4D4D4' }}>{line.content || ' '}</span>
        </div>
        <div style={{ ...baseStyle, background: 'transparent' }}>
          <span style={lineNumStyle}>{line.rightLine}</span>
          <span style={{ color: '#D4D4D4' }}>{line.content || ' '}</span>
        </div>
      </>
    );
  }

  if (line.type === 'remove') {
    return (
      <>
        <div style={{ ...baseStyle, background: 'rgba(141, 60, 60, 0.3)', borderLeft: '3px solid #8D3C3C' }}>
          <span style={{ ...lineNumStyle, color: '#8D3C3C' }}>{line.leftLine}</span>
          <span style={{ color: '#FF8080' }}>- {line.content || ' '}</span>
        </div>
        <div style={{ ...baseStyle, background: 'rgba(141, 60, 60, 0.1)' }}>
          <span style={lineNumStyle}>&nbsp;</span>
          <span>&nbsp;</span>
        </div>
      </>
    );
  }

  return (
    <>
      <div style={{ ...baseStyle, background: 'rgba(60, 141, 60, 0.1)' }}>
        <span style={lineNumStyle}>&nbsp;</span>
        <span>&nbsp;</span>
      </div>
      <div style={{ ...baseStyle, background: 'rgba(60, 141, 60, 0.3)', borderLeft: '3px solid #3C8D3C' }}>
        <span style={{ ...lineNumStyle, color: '#3C8D3C' }}>{line.rightLine}</span>
        <span style={{ color: '#80FF80' }}>+ {line.content || ' '}</span>
      </div>
    </>
  );
};

export default DiffViewer;
