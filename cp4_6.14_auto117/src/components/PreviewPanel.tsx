import React, { memo } from 'react';
import { Fragment } from '@/modules/puzzleManager';
import { useGameStore } from '@/store/gameStore';

interface PreviewFragmentProps {
  fragment: Fragment;
  isHighlighted: boolean;
}

const PreviewFragment: React.FC<PreviewFragmentProps> = memo(({ fragment, isHighlighted }) => {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${fragment.previewX}%`,
    top: `${fragment.previewY}%`,
    width: `${fragment.previewW}%`,
    height: `${fragment.previewH}%`,
    backgroundColor: isHighlighted ? '#e0f2fe' : fragment.bgColor,
    border: isHighlighted ? '3px solid #3b82f6' : 'none',
    borderRadius: 2,
    transition: 'all 0.3s ease-out',
    opacity: fragment.isCorrect ? 0.3 : 1,
    boxSizing: 'border-box',
  };

  return <div style={style} />;
});

PreviewFragment.displayName = 'PreviewFragment';

const PreviewPanel: React.FC = () => {
  const { fragments, draggingId } = useGameStore();

  const panelStyle: React.CSSProperties = {
    width: 240,
    padding: 16,
    backgroundColor: 'var(--color-white)',
    borderLeft: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    flexShrink: 0,
  };

  const headerStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--color-text)',
    marginBottom: 4,
  };

  const previewContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    paddingTop: `${(700 / 600) * 100}%`,
    backgroundColor: 'var(--color-canvas)',
    borderRadius: 8,
    overflow: 'hidden',
    border: '1px solid var(--color-border)',
  };

  const previewInnerStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  };

  const hintStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 1.5,
  };

  const legendStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
    fontSize: 12,
    color: 'var(--color-text-secondary)',
  };

  const legendItemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const colorBoxStyle = (color: string): React.CSSProperties => ({
    width: 16,
    height: 16,
    backgroundColor: color,
    borderRadius: 4,
    border: color === '#22c55e' ? '1px solid #22c55e' : '1px solid var(--color-border)',
  });

  return (
    <div className="preview-panel" style={panelStyle}>
      <h2 style={headerStyle}>目标布局</h2>
      <div style={previewContainerStyle}>
        <div style={previewInnerStyle}>
          {fragments.map((fragment) => (
            <PreviewFragment
              key={fragment.id}
              fragment={fragment}
              isHighlighted={draggingId === fragment.id}
            />
          ))}
        </div>
      </div>
      <p style={hintStyle}>将碎片拖放到对应位置</p>
      <div style={legendStyle}>
        <div style={legendItemStyle}>
          <div style={colorBoxStyle('#22c55e')} />
          <span>已放置正确</span>
        </div>
        <div style={legendItemStyle}>
          <div style={colorBoxStyle('#3b82f6')} />
          <span>当前拖拽区域</span>
        </div>
      </div>
      <style>{`
        @media (max-width: 1000px) {
          .preview-panel {
            width: 180px !important;
          }
        }
        @media (max-width: 768px) {
          .preview-panel {
            width: 100% !important;
            border-left: none !important;
            border-top: 1px solid var(--color-border) !important;
          }
        }
      `}</style>
    </div>
  );
};

export default memo(PreviewPanel);
