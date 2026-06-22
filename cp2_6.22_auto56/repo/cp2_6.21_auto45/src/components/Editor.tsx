import React, { useCallback, useRef, useState } from 'react';
import { useStore } from '../store';

function Editor() {
  const keyframes = useStore((s) => s.keyframes);
  const currentKeyframeId = useStore((s) => s.currentKeyframeId);
  const addKeyframe = useStore((s) => s.addKeyframe);
  const removeKeyframe = useStore((s) => s.removeKeyframe);
  const updateKeyframe = useStore((s) => s.updateKeyframe);
  const updateKeyframePercent = useStore((s) => s.updateKeyframePercent);
  const setCurrentKeyframe = useStore((s) => s.setCurrentKeyframe);
  const saveToHistory = useStore((s) => s.saveToHistory);
  const history = useStore((s) => s.history);
  const loadFromHistory = useStore((s) => s.loadFromHistory);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const sorted = [...keyframes].sort((a, b) => a.percent - b.percent);
  const currentKf = keyframes.find((k) => k.id === currentKeyframeId);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!trackRef.current || draggingId) return;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const clamped = Math.max(0, Math.min(100, percent));
      if (addKeyframe(clamped)) {
        saveToHistory('');
      }
    },
    [addKeyframe, draggingId, saveToHistory]
  );

  const handleSliderMouseDown = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setDraggingId(id);
      setCurrentKeyframe(id);

      const kf = keyframes.find((k) => k.id === id);
      if (!kf || !trackRef.current) return;

      const track = trackRef.current;
      const onMove = (ev: MouseEvent) => {
        const rect = track.getBoundingClientRect();
        const percent = Math.round(((ev.clientX - rect.left) / rect.width) * 100);
        const clamped = Math.max(0, Math.min(100, percent));
        updateKeyframePercent(id, clamped);
      };

      const onUp = () => {
        setDraggingId(null);
        saveToHistory('');
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      };

      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    },
    [keyframes, updateKeyframePercent, saveToHistory, setCurrentKeyframe]
  );

  const handlePropertyChange = useCallback(
    (field: string, value: string | number) => {
      if (!currentKeyframeId) return;
      const updates: Record<string, string | number> = {};
      updates[field] = value;
      updateKeyframe(currentKeyframeId, updates);
    },
    [currentKeyframeId, updateKeyframe]
  );

  const handlePropertyBlur = useCallback(() => {
    saveToHistory('');
  }, [saveToHistory]);

  const drawThumbnail = useCallback((): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, 128, 96);

    const kfs = [...keyframes].sort((a, b) => a.percent - b.percent);
    const barY = 20;
    const barH = 8;
    const barX = 8;
    const barW = 112;

    ctx.fillStyle = '#0f3460';
    ctx.fillRect(barX, barY, barW, barH);

    for (const kf of kfs) {
      const x = barX + (kf.percent / 100) * barW;
      ctx.beginPath();
      ctx.arc(x, barY + barH / 2, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#00b4d8';
      ctx.fill();
    }

    ctx.fillStyle = '#8a8a8a';
    ctx.font = '9px sans-serif';
    ctx.fillText(`${kfs.length} keyframes`, barX, 50);

    return canvas.toDataURL('image/png');
  }, [keyframes]);

  const handleSaveHistory = useCallback(() => {
    const thumb = drawThumbnail();
    saveToHistory(thumb);
  }, [drawThumbnail, saveToHistory]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div className="panel-card">
        <div className="panel-title">关键帧时间轴</div>
        <div className="timeline-container">
          <div
            className="timeline-track"
            ref={trackRef}
            onClick={handleTrackClick}
          >
            {sorted.map((kf) => (
              <div
                key={kf.id}
                className={`timeline-slider ${draggingId === kf.id ? 'dragging' : ''} ${
                  currentKeyframeId === kf.id ? 'keyframe-selected' : ''
                }`}
                style={{ left: `${kf.percent}%` }}
                onMouseDown={(e) => handleSliderMouseDown(kf.id, e)}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentKeyframe(kf.id);
                }}
              >
                <span className="slider-label">{kf.percent}%</span>
                {kf.percent !== 0 && kf.percent !== 100 && (
                  <span
                    className="slider-delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeKeyframe(kf.id);
                      saveToHistory('');
                    }}
                  >
                    ×
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
        <button className="timeline-add-btn" onClick={handleSaveHistory}>
          + 添加关键帧并保存历史
        </button>
      </div>

      {currentKf && (
        <div className="panel-card">
          <div className="panel-title">
            属性编辑 — {currentKf.percent}%
          </div>

          <div className="property-row">
            <span className="property-label">transform</span>
            <input
              className="property-input"
              value={currentKf.properties.transform}
              onChange={(e) => handlePropertyChange('transform', e.target.value)}
              onBlur={handlePropertyBlur}
              placeholder="translateY(0px) rotate(0deg)"
            />
          </div>

          <div className="property-row">
            <span className="property-label">opacity</span>
            <input
              type="range"
              className="property-slider"
              min={0}
              max={100}
              value={currentKf.properties.opacity}
              onChange={(e) => handlePropertyChange('opacity', Number(e.target.value))}
              onMouseUp={handlePropertyBlur}
            />
            <span style={{ width: 36, textAlign: 'right', fontSize: 12, color: '#8a8a8a', fontFamily: 'JetBrains Mono, monospace' }}>
              {(currentKf.properties.opacity / 100).toFixed(2)}
            </span>
          </div>

          <div className="property-row">
            <span className="property-label">filter</span>
            <input
              className="property-input"
              value={currentKf.properties.filter}
              onChange={(e) => handlePropertyChange('filter', e.target.value)}
              onBlur={handlePropertyBlur}
              placeholder="blur(0px) brightness(100%)"
            />
          </div>

          <div className="property-row">
            <span className="property-label">border-radius</span>
            <input
              type="range"
              className="property-slider"
              min={0}
              max={100}
              value={currentKf.properties.borderRadius}
              onChange={(e) => handlePropertyChange('borderRadius', Number(e.target.value))}
              onMouseUp={handlePropertyBlur}
            />
            <span style={{ width: 36, textAlign: 'right', fontSize: 12, color: '#8a8a8a', fontFamily: 'JetBrains Mono, monospace' }}>
              {currentKf.properties.borderRadius}%
            </span>
          </div>
        </div>
      )}

      <div className="panel-card">
        <div className="panel-title">历史记录</div>
        {history.length === 0 ? (
          <div className="history-empty">暂无历史记录</div>
        ) : (
          <div className="history-panel">
            {history.map((snap, idx) => (
              <div
                key={snap.id}
                className="history-item"
                onClick={() => loadFromHistory(idx)}
                title={`回退到 ${formatTime(snap.timestamp)}`}
              >
                {snap.thumbnail ? (
                  <img src={snap.thumbnail} alt={`快照 ${idx + 1}`} />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    background: '#0f3460',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    color: '#8a8a8a'
                  }}>
                    {snap.keyframes.length}KF
                  </div>
                )}
                <span className="history-time">{formatTime(snap.timestamp)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Editor;
