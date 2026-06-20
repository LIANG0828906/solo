import React, { useCallback, useRef, useEffect, useState } from 'react';
import { useAppStore, TrackState } from '../modules/state/store';
import { WaveType } from '../modules/waveform/WaveformGenerator';

const WAVE_TYPES: { type: WaveType; label: string }[] = [
  { type: 'sine', label: '∿' },
  { type: 'square', label: '⊓' },
  { type: 'sawtooth', label: '⩘' },
  { type: 'triangle', label: '△' },
];

const ADSREditor: React.FC<{
  adsr: TrackState['adsr'];
  color: string;
  onChange: (adsr: TrackState['adsr']) => void;
}> = ({ adsr, color, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef<string | null>(null);
  const W = 240, H = 70;

  const points = {
    attack: { x: adsr.attack * 0.25 * W, y: 0 },
    decay: { x: adsr.attack * 0.25 * W + adsr.decay * 0.25 * W, y: (1 - adsr.sustain) * H },
    sustain: { x: W * 0.75 - adsr.release * 0.25 * W, y: (1 - adsr.sustain) * H },
    release: { x: W, y: H },
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0d0d1a';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = '#2d2d44';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo((W * i) / 4, 0);
      ctx.lineTo((W * i) / 4, H);
      ctx.stroke();
    }
    for (let i = 1; i < 4; i++) {
      ctx.beginPath();
      ctx.moveTo(0, (H * i) / 4);
      ctx.lineTo(W, (H * i) / 4);
      ctx.stroke();
    }

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(points.attack.x, points.attack.y);
    ctx.lineTo(points.decay.x, points.decay.y);
    ctx.lineTo(points.sustain.x, points.sustain.y);
    ctx.lineTo(points.release.x, points.release.y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const drawPoint = (p: { x: number; y: number }) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    };
    drawPoint(points.attack);
    drawPoint(points.decay);
    drawPoint(points.sustain);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '9px monospace';
    ctx.fillText('A', points.attack.x - 3, points.attack.y - 8);
    ctx.fillText('D', points.decay.x - 3, points.decay.y - 8);
    ctx.fillText('S', points.sustain.x - 3, points.sustain.y - 8);
    ctx.fillText('R', W - 12, H - 4);
  }, [adsr, color, points]);

  useEffect(() => { draw(); }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const pts: [string, { x: number; y: number }][] = [
      ['attack', points.attack],
      ['decay', points.decay],
      ['sustain', points.sustain],
    ];
    for (const [name, p] of pts) {
      if (Math.hypot(mx - p.x, my - p.y) < 10) {
        dragging.current = name;
        break;
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging.current) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = Math.max(0, Math.min(W, e.clientX - rect.left));
    const my = Math.max(0, Math.min(H, e.clientY - rect.top));
    const newAdsr = { ...adsr };

    if (dragging.current === 'attack') {
      newAdsr.attack = Math.max(0.01, Math.min(1, (mx / W) / 0.25));
    } else if (dragging.current === 'decay') {
      const decayX = mx - adsr.attack * 0.25 * W;
      newAdsr.decay = Math.max(0.01, Math.min(1, (decayX / W) / 0.25));
    } else if (dragging.current === 'sustain') {
      newAdsr.sustain = Math.max(0.01, Math.min(1, 1 - my / H));
    }
    onChange(newAdsr);
  };

  const handleMouseUp = () => { dragging.current = null; };

  return (
    <canvas
      ref={canvasRef}
      style={{ width: W, height: H, cursor: 'pointer', borderRadius: 4 }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};

const PanKnob: React.FC<{
  value: number;
  color: string;
  onChange: (v: number) => void;
}> = ({ value, color, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const lastY = useRef(0);
  const angle = ((value + 1) / 2) * 270 - 135;

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      const delta = (lastY.current - e.clientY) * 0.01;
      lastY.current = e.clientY;
      onChange(Math.max(-1, Math.min(1, value + delta)));
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, value, onChange]);

  const startDrag = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastY.current = e.clientY;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg
        width={40}
        height={40}
        style={{ cursor: 'pointer' }}
        onMouseDown={startDrag}
      >
        <circle cx={20} cy={20} r={17} fill="#1a1a2e" stroke={isDragging ? color : '#2d2d44'} strokeWidth={2} />
        {isDragging && <circle cx={20} cy={20} r={19} fill="none" stroke={color} strokeWidth={1} opacity={0.5} />}
        <line
          x1={20}
          y1={20}
          x2={20 + 12 * Math.sin((angle * Math.PI) / 180)}
          y2={20 - 12 * Math.cos((angle * Math.PI) / 180)}
          stroke={color}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </svg>
      <span style={{ fontSize: 9, color: '#888' }}>
        {value < -0.05 ? 'L' : value > 0.05 ? 'R' : 'C'}
      </span>
    </div>
  );
};

const VolumeFader: React.FC<{
  value: number;
  color: string;
  onChange: (v: number) => void;
}> = ({ value, color, onChange }) => {
  const faderRef = useRef<HTMLDivElement>(null);
  const H = 90;
  const normalized = (value + 60) / 66;
  const fillH = normalized * H;

  const handleClick = (e: React.MouseEvent) => {
    if (!faderRef.current) return;
    const rect = faderRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const newNorm = 1 - y / H;
    const newDb = newNorm * 66 - 60;
    onChange(Math.max(-60, Math.min(6, Math.round(newDb * 2) / 2)));
  };

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const onMove = (ev: MouseEvent) => {
      if (!faderRef.current) return;
      const rect = faderRef.current.getBoundingClientRect();
      const y = ev.clientY - rect.top;
      const newNorm = 1 - y / H;
      const newDb = newNorm * 66 - 60;
      onChange(Math.max(-60, Math.min(6, Math.round(newDb * 2) / 2)));
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div
        ref={faderRef}
        style={{
          width: 22,
          height: H,
          background: 'linear-gradient(to top, #0a1628, #0d4a2a, #22cc66)',
          borderRadius: 4,
          position: 'relative',
          cursor: 'pointer',
          border: '1px solid #2d2d44',
        }}
        onClick={handleClick}
        onMouseDown={startDrag}
      >
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: fillH,
            background: `linear-gradient(to top, ${color}88, ${color}cc)`,
            borderRadius: '0 0 3px 3px',
            pointerEvents: 'none' as const,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: -2,
            right: -2,
            bottom: fillH - 3,
            height: 6,
            background: color,
            borderRadius: 2,
            boxShadow: `0 0 6px ${color}`,
            pointerEvents: 'none' as const,
          }}
        />
      </div>
      <span style={{ fontSize: 8, color: '#888' }}>{value}dB</span>
    </div>
  );
};

const TrackCard: React.FC<{ track: TrackState }> = ({ track }) => {
  const updateTrack = useAppStore((s) => s.updateTrack);

  const sliderStyle = (value: number, min: number, max: number): React.CSSProperties => ({
    width: '100%',
    accentColor: track.color,
    height: 4,
    cursor: 'pointer',
  });

  return (
    <div
      style={{
        background: '#1a1a2e',
        borderRadius: 12,
        border: '1px solid #2d2d44',
        padding: 10,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        transition: 'border-color 0.3s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#6c5ce7'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#2d2d44'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: track.color, boxShadow: `0 0 6px ${track.color}` }} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>{track.name}</span>
        </div>
        <button
          onClick={() => updateTrack(track.id, { muted: !track.muted })}
          style={{
            background: track.muted ? '#6c5ce7' : 'transparent',
            border: '1px solid #6c5ce7',
            color: track.muted ? '#fff' : '#6c5ce7',
            borderRadius: 4,
            padding: '1px 6px',
            fontSize: 10,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          M
        </button>
      </div>

      <div style={{ display: 'flex', gap: 3 }}>
        {WAVE_TYPES.map((wt) => (
          <button
            key={wt.type}
            onClick={() => updateTrack(track.id, { waveType: wt.type })}
            style={{
              flex: 1,
              padding: '3px 0',
              background: track.waveType === wt.type ? '#6c5ce7' : '#2d2d44',
              border: 'none',
              borderRadius: 4,
              color: '#e0e0e0',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {wt.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9, color: '#888' }}>Freq</span>
          <span style={{ fontSize: 9, color: track.color }}>{track.frequency}Hz</span>
        </div>
        <input
          type="range" min={20} max={2000} step={1} value={track.frequency}
          onChange={(e) => updateTrack(track.id, { frequency: +e.target.value })}
          style={sliderStyle(track.frequency, 20, 2000)}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9, color: '#888' }}>Amp</span>
          <span style={{ fontSize: 9, color: track.color }}>{track.amplitude.toFixed(2)}</span>
        </div>
        <input
          type="range" min={0} max={1} step={0.01} value={track.amplitude}
          onChange={(e) => updateTrack(track.id, { amplitude: +e.target.value })}
          style={sliderStyle(track.amplitude, 0, 1)}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9, color: '#888' }}>Phase</span>
          <span style={{ fontSize: 9, color: track.color }}>{track.phase}°</span>
        </div>
        <input
          type="range" min={0} max={360} step={1} value={track.phase}
          onChange={(e) => updateTrack(track.id, { phase: +e.target.value })}
          style={sliderStyle(track.phase, 0, 360)}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 9, color: '#888' }}>ADSR Envelope</span>
        <ADSREditor
          adsr={track.adsr}
          color={track.color}
          onChange={(adsr) => updateTrack(track.id, { adsr })}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <VolumeFader
          value={track.volume}
          color={track.color}
          onChange={(v) => updateTrack(track.id, { volume: v })}
        />
        <div style={{ flex: 1 }} />
        <PanKnob
          value={track.pan}
          color={track.color}
          onChange={(v) => updateTrack(track.id, { pan: Math.round(v * 100) / 100 })}
        />
      </div>
    </div>
  );
};

export const TrackPanel: React.FC = () => {
  const tracks = useAppStore((s) => s.tracks);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: 8,
      overflowY: 'auto',
      height: '100%',
      scrollbarWidth: 'thin',
      scrollbarColor: '#2d2d44 transparent',
    }}>
      {tracks.map((track) => (
        <TrackCard key={track.id} track={track} />
      ))}
    </div>
  );
};
