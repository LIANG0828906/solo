import { useEffect, useRef } from 'react';
import { useApp, Sample } from '../context/AppContext';

interface Props {
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (v: boolean) => void;
}

export default function SampleBrowser({ isMobileDrawerOpen, setIsMobileDrawerOpen }: Props) {
  const { samples, selectedSampleId, setSelectedSampleId, setSearchQuery } = useApp();
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  useEffect(() => {
    samples.forEach(sample => {
      const canvas = canvasRefs.current.get(sample.id);
      if (canvas) {
        drawWaveform(canvas, sample.waveformData);
      }
    });
  }, [samples]);

  const drawWaveform = (canvas: HTMLCanvasElement, data: number[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const barWidth = w / data.length;

    ctx.fillStyle = '#27272A';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = '#A78BFA';
    data.forEach((val, i) => {
      const barHeight = val * h * 0.8;
      const x = i * barWidth;
      const y = (h - barHeight) / 2;
      ctx.fillRect(x, y, Math.max(1, barWidth - 1), barHeight);
    });
  };

  const handleCardClick = (sample: Sample) => {
    setSelectedSampleId(sample.id);
    setIsMobileDrawerOpen(false);
  };

  return (
    <>
      {isMobileDrawerOpen && (
        <div
          className="drawer-overlay"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}
      <aside className={`sample-browser ${isMobileDrawerOpen ? 'drawer-open' : ''}`}>
        <div className="browser-header">
          <h3>采样库</h3>
          <span className="sample-count">{samples.length} 个采样</span>
        </div>
        <div className="sample-grid">
          {samples.map((sample, index) => (
            <div
              key={sample.id}
              className={`sample-card ${selectedSampleId === sample.id ? 'card-selected' : ''}`}
              onClick={() => handleCardClick(sample)}
              style={{ animationDelay: `${index * 0.03}s` }}
            >
              <div className="card-name">{sample.name}</div>
              <canvas
                ref={el => {
                  if (el) canvasRefs.current.set(sample.id, el);
                }}
                className="card-waveform"
              />
              <div className="card-tags">
                <span className="tag-badge">{sample.bpm}</span>
                <span className="tag-badge">{sample.key}</span>
              </div>
            </div>
          ))}
        </div>
        {samples.length === 0 && (
          <div className="empty-browser">
            <p>暂无采样</p>
          </div>
        )}
      </aside>
    </>
  );
}
