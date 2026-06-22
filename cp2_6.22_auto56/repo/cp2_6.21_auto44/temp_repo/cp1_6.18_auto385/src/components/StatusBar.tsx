import React from 'react';
import { useStore } from '@/store/useStore';

const styles: Record<string, React.CSSProperties> = {
  bar: {
    width: '100%',
    padding: '10px 16px',
    background: 'rgba(13, 13, 28, 0.85)',
    borderTop: '1px solid #00D4FF33',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    fontSize: 12,
    backdropFilter: 'blur(8px)',
  },
  fpsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    color: '#8A8A9A',
    fontFamily: 'monospace',
    fontSize: 12,
    letterSpacing: 1,
  },
  value: {
    color: '#00FFAA',
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 600,
    minWidth: 40,
    textAlign: 'right',
    textShadow: '0 0 6px #00FFAA66',
  },
  ok: { color: '#00FFAA', textShadow: '0 0 6px #00FFAA66' },
  warn: { color: '#FFAA00', textShadow: '0 0 6px #FFAA0066' },
  bad: { color: '#FF4466', textShadow: '0 0 6px #FF446666' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    display: 'inline-block',
  },
  infoGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    color: '#8A8A9A',
    fontFamily: 'monospace',
    fontSize: 11,
  },
};

const StatusBar: React.FC = () => {
  const fps = useStore((s) => s.fps);
  const isProcessing = useStore((s) => s.isProcessing);
  const depthWidth = useStore((s) => s.depthWidth);
  const depthHeight = useStore((s) => s.depthHeight);
  const hasMesh = useStore((s) => !!s.depthMap);

  let fpsColor = styles.value;
  let dotBg = '#00FFAA';
  if (fps > 0) {
    if (fps >= 45) {
      fpsColor = { ...styles.value, ...styles.ok };
      dotBg = '#00FFAA';
    } else if (fps >= 30) {
      fpsColor = { ...styles.value, ...styles.warn };
      dotBg = '#FFAA00';
    } else {
      fpsColor = { ...styles.value, ...styles.bad };
      dotBg = '#FF4466';
    }
  }

  return (
    <div style={styles.bar}>
      <div style={styles.fpsGroup}>
        <span style={styles.label}>FPS</span>
        <span style={{ ...styles.dot, background: dotBg, boxShadow: `0 0 8px ${dotBg}` }} />
        <span style={fpsColor}>{fps > 0 ? fps : '--'}</span>
      </div>
      <div style={styles.infoGroup}>
        <span>
          {isProcessing ? (
            <span style={{ color: '#00D4FF' }}>● 处理中...</span>
          ) : hasMesh ? (
            <span style={{ color: '#00FFAA' }}>● 已就绪</span>
          ) : (
            <span style={{ color: '#8A8A9A' }}>○ 等待上传图片</span>
          )}
        </span>
        {depthWidth > 0 && depthHeight > 0 && (
          <span>
            深度图 {depthWidth}×{depthHeight}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatusBar;
