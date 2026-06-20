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
  const [curveControls, setCurveControls] = useState({ attackCurve: 0, decayCurve: 0, releaseCurve: 0 });
  const W = 240, H = 70;

  const getPoints = () => {
    const ax = adsr.attack * 0.25 * W;
    const dx = ax + adsr.decay * 0.25 * W;
    const sx = W * 0.75 - adsr.release * 0.25 * W;
    const sy = (1 - adsr.sustain) * H;
    return {
      start: { x: 0, y: H },
      attack: { x: ax, y: 0 },
      attackCP: { x: ax * (0.5 + curveControls.attackCurve * 0.4), y: H * (0.5 - curveControls.attackCurve * 0.4) },
      decay: { x: dx, y: sy },
      decayCP: { x: ax + (dx - ax) * (0.5 + curveControls.decayCurve * 0.4), y: sy + (0 - sy) * (0.5 - curveControls.decayCurve * 0.4) },
      sustain: { x: sx, y: sy },
      release: { x: W, y: H },
      releaseCP: { x: sx + (W - sx) * (0.5 + curveControls.releaseCurve * 0.4), y: sy + (H - sy) * (0.5 - curveControls.releaseCurve * 0.4) },
    };
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

    const pts = getPoints();

    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = color + '55';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(pts.start.x, pts.start.y);
    ctx.lineTo(pts.attackCP.x, pts.attackCP.y);
    ctx.moveTo(pts.attack.x, pts.attack.y);
    ctx.lineTo(pts.attackCP.x, pts.attackCP.y);
    ctx.moveTo(pts.attack.x, pts.attack.y);
    ctx.lineTo(pts.decayCP.x, pts.decayCP.y);
    ctx.moveTo(pts.decay.x, pts.decay.y);
    ctx.lineTo(pts.decayCP.x, pts.decayCP.y);
    ctx.moveTo(pts.sustain.x, pts.sustain.y);
    ctx.lineTo(pts.releaseCP.x, pts.releaseCP.y);
    ctx.moveTo(pts.release.x, pts.release.y);
    ctx.lineTo(pts.releaseCP.x, pts.releaseCP.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(pts.start.x, pts.start.y);
    ctx.bezierCurveTo(pts.attackCP.x, pts.attackCP.y, pts.attackCP.x, pts.attackCP.y, pts.attack.x, pts.attack.y);
    ctx.bezierCurveTo(pts.decayCP.x, pts.decayCP.y, pts.decayCP.x, pts.decayCP.y, pts.decay.x, pts.decay.y);
    ctx.lineTo(pts.sustain.x, pts.sustain.y);
    ctx.bezierCurveTo(pts.releaseCP.x, pts.releaseCP.y, pts.releaseCP.x, pts.releaseCP.y, pts.release.x, pts.release.y);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const drawAnchor = (p: { x: number; y: number }, isActive: boolean = false) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, isActive ? 5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    const drawCP = (p: { x: number; y: number }) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color + '88';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.setLineDash([1, 1]);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    drawAnchor(pts.attack);
    drawAnchor(pts.decay);
    drawAnchor(pts.sustain);
    drawCP(pts.attackCP);
    drawCP(pts.decayCP);
    drawCP(pts.releaseCP);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '9px monospace';
    ctx.fillText('A', pts.attack.x - 3, pts.attack.y - 8);
    ctx.fillText('D', pts.decay.x - 3, pts.decay.y - 8);
    ctx.fillText('S', pts.sustain.x - 3, pts.sustain.y - 8);
    ctx.fillText('R', W - 12, H - 4);
  }, [adsr, color, curveControls]);

  useEffect(() => { draw(); }, [draw]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const pts = getPoints();

    const anchors: [string, { x: number; y: number }][] = [
      ['attack', pts.attack],
      ['decay', pts.decay],
      ['sustain', pts.sustain],
      ['attackCurve', pts.attackCP],
      ['decayCurve', pts.decayCP],
      ['releaseCurve', pts.releaseCP],
    ];

    for (const [name, p] of anchors) {
      if (Math.hypot(mx - p.x, my - p.y) < 10) {
        dragging.current = name;
        e.preventDefault();
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
      onChange(newAdsr);
    } else if (dragging.current === 'decay') {
      const attackEndX = adsr.attack * 0.25 * W;
      const decayX = Math.max(attackEndX + 5, mx);
      newAdsr.decay = Math.max(0.01, Math.min(1, ((decayX - attackEndX) / W) / 0.25));
      onChange(newAdsr);
    } else if (dragging.current === 'sustain') {
      const newSustain = Math.max(0.01, Math.min(1, 1 - my / H));
      newAdsr.sustain = newSustain;
      const attackEndX = adsr.attack * 0.25 * W;
      const releaseStartX = W * 0.75 - adsr.release * 0.25 * W;
      const sustainX = Math.max(attackEndX + 5, Math.min(releaseStartX - 5, mx));
      newAdsr.release = Math.max(0.01, Math.min(1, ((W - sustainX) / W) / 0.25));
      onChange(newAdsr);
    } else if (dragging.current === 'attackCurve') {
      const ax = adsr.attack * 0.25 * W;
      const curve = ((mx / ax) - 0.5) / 0.4;
      setCurveControls(c => ({ ...c, attackCurve: Math.max(-1, Math.min(1, curve)) }));
    } else if (dragging.current === 'decayCurve') {
      const ax = adsr.attack * 0.25 * W;
      const dx = ax + adsr.decay * 0.25 * W;
      const curve = ((mx - ax) / (dx - ax) - 0.5) / 0.4;
      setCurveControls(c => ({ ...c, decayCurve: Math.max(-1, Math.min(1, curve)) }));
    } else if (dragging.current === 'releaseCurve') {
      const sx = W * 0.75 - adsr.release * 0.25 * W;
      const curve = ((mx - sx) / (W - sx) - 0.5) / 0.4;
      setCurveControls(c => ({ ...c, releaseCurve: Math.max(-1, Math.min(1, curve)) }));
    }
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
  const [hoverAngle, setHoverAngle] = useState<number | null>(null);
  const lastY = useRef(0);
  const svgRef = useRef<SVGSVGElement>(null);

  const valueAngle = ((value + 1) / 2) * 270 - 135;

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

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const mx = e.clientX - rect.left - cx;
    const my = e.clientY - rect.top - cy;
    const angle = (Math.atan2(my, mx) * 180 / Math.PI) + 90;
    setHoverAngle(angle);
  };

  const handleMouseLeave = () => setHoverAngle(null);

  const polarToCart = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
  };

  const cx = 20, cy = 20;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg
        ref={svgRef}
        width={44}
        height={44}
        style={{ cursor: 'pointer' }}
        onMouseDown={startDrag}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <radialGradient id={`glow-${color.replace('#', '')}`}>
            <stop offset="0%" stopColor={color} stopOpacity="0.6" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>

        {isDragging && (
          <circle cx={cx} cy={cy} r={21} fill={`url(#glow-${color.replace('#', '')})`} />
        )}

        <circle
          cx={cx} cy={cy} r={17}
          fill="#1a1a2e"
          stroke={isDragging ? color : '#2d2d44'}
          strokeWidth={2}
        />

        <circle
          cx={cx} cy={cy} r={19}
          fill="none"
          stroke={color}
          strokeWidth={1}
          strokeDasharray="270 90"
          strokeDashoffset="135"
          opacity={0.2}
        />

        {hoverAngle !== null && !isDragging && (() => {
          const clamped = Math.max(-135, Math.min(135, hoverAngle));
          const p = polarToCart(cx, cy, 19, clamped);
          return (
            <>
              <circle cx={p.x} cy={p.y} r={3} fill={color} opacity={0.7} />
              <circle cx={p.x} cy={p.y} r={5} fill={color} opacity={0.2} />
            </>
          );
        })()}

        {isDragging && (() => {
          const p = polarToCart(cx, cy, 19, valueAngle);
          return (
            <>
              <circle cx={p.x} cy={p.y} r={4} fill={color} />
              <circle cx={p.x} cy={p.y} r={7} fill={color} opacity={0.3} />
              <circle cx={p.x} cy={p.y} r={10} fill={color} opacity={0.15} />
            </>
          );
        })()}

        <line
          x1={cx}
          y1={cy}
          x2={cx + 12 * Math.sin((valueAngle * Math.PI) / 180)}
          y2={cy - 12 * Math.cos((valueAngle * Math.PI) / 180)}
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
        />

        <circle cx={cx} cy={cy} r={2.5} fill={color} />
      </svg>
      <span style={{ fontSize: 9, color: '#888' }}>
        {value < -0.05 ? `L ${Math.abs(Math.round(value * 100))}%` : value > 0.05 ? `R ${Math.round(value * 100)}%` : 'C'}
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
  const [isDragging, setIsDragging] = useState(false);
  const H = 90;
  const normalized = (value + 60) / 66;
  const fillH = normalized * H;

  const updateFromY = (clientY: number) => {
    if (!faderRef.current) return;
    const rect = faderRef.current.getBoundingClientRect();
    const y = clientY - rect.top;
    const newNorm = Math.max(0, Math.min(1, 1 - y / H));
    const newDb = newNorm * 66 - 60;
    onChange(Math.max(-60, Math.min(6, Math.round(newDb * 2) / 2)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    updateFromY(e.clientY);
    const onMove = (ev: MouseEvent) => updateFromY(ev.clientY);
    const onUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const tickMarks = [];
  for (let db = 6; db >= -60; db -= 12) {
    const norm = (db + 60) / 66;
    tickMarks.push({ db, y: (1 - norm) * H });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: H }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: H, padding: '0 0' }}>
          {tickMarks.map(t => (
            <span key={t.db} style={{ fontSize: 7, color: '#444', lineHeight: 1, transform: `translateY(${t.y - (1 - ((t.db + 60) / 66)) * H}px)`, position: 'absolute', left: -22 }}>
              {t.db >= 0 ? `+${t.db}` : t.db}
            </span>
          ))}
        </div>
        <div
          ref={faderRef}
          style={{
            width: 24,
            height: H,
            background: 'linear-gradient(to top, #0a1628 0%, #122a55 20%, #1a5a88 40%, #228877 60%, #44bb55 80%, #77ee44 100%)',
            borderRadius: 5,
            position: 'relative',
            cursor: 'pointer',
            border: isDragging ? `1px solid ${color}` : '1px solid #2d2d44',
            boxShadow: isDragging ? `0 0 8px ${color}66` : 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            overflow: 'hidden',
          }}
          onMouseDown={handleMouseDown}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: fillH,
              background: `linear-gradient(to top, ${color}aa, ${color}ee)`,
              boxShadow: `inset 0 0 6px ${color}88`,
              pointerEvents: 'none' as const,
              transition: 'height 0.08s ease-out',
            }}
          />

          {[0.25, 0.5, 0.75].map(t => (
            <div key={t} style={{
              position: 'absolute',
              left: 2, right: 2,
              top: `${t * 100}%`,
              height: 1,
              background: 'rgba(255,255,255,0.1)',
              pointerEvents: 'none' as const,
            }} />
          ))}

          <div
            style={{
              position: 'absolute',
              left: -4,
              right: -4,
              bottom: fillH - 4,
              height: 8,
              background: `linear-gradient(to bottom, ${color}, ${color}cc)`,
              borderRadius: 3,
              boxShadow: `0 0 8px ${color}cc, inset 0 1px 2px rgba(255,255,255,0.3)`,
              pointerEvents: 'none' as const,
              transition: 'bottom 0.08s ease-out',
            }}
          />
        </div>
      </div>
      <span style={{ fontSize: 9, color: color, fontWeight: 600 }}>
        {value >= 0 ? `+${value}dB` : `${value}dB`}
      </span>
    </div>
  );
};

const TrackCard: React.FC<{ track: TrackState }> = ({ track }) => {
  const updateTrack = useAppStore((s) => s.updateTrack);

  const sliderStyle = (): React.CSSProperties => ({
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
        transition: 'border-color 0.3s, box-shadow 0.3s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#6c5ce7';
        e.currentTarget.style.boxShadow = '0 0 12px rgba(108,92,231,0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#2d2d44';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: track.color, boxShadow: `0 0 8px ${track.color}` }} />
          <span style={{ fontSize: 12, fontWeight: 600 }}>{track.name}</span>
        </div>
        <button
          onClick={() => updateTrack(track.id, { muted: !track.muted })}
          style={{
            background: track.muted ? '#6c5ce7' : 'transparent',
            border: '1px solid #6c5ce7',
            color: track.muted ? '#fff' : '#6c5ce7',
            borderRadius: 4,
            padding: '2px 8px',
            fontSize: 10,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {track.muted ? 'MUTED' : 'M'}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 3 }}>
        {WAVE_TYPES.map((wt) => (
          <button
            key={wt.type}
            onClick={() => updateTrack(track.id, { waveType: wt.type })}
            style={{
              flex: 1,
              padding: '4px 0',
              background: track.waveType === wt.type ? '#6c5ce7' : '#2d2d44',
              border: track.waveType === wt.type ? `1px solid ${track.color}` : '1px solid transparent',
              borderRadius: 4,
              color: '#e0e0e0',
              fontSize: 14,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            {wt.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9, color: '#888' }}>Frequency</span>
          <span style={{ fontSize: 10, color: track.color, fontWeight: 600, fontFamily: 'monospace' }}>{track.frequency} Hz</span>
        </div>
        <input
          type="range" min={20} max={2000} step={1} value={track.frequency}
          onChange={(e) => updateTrack(track.id, { frequency: +e.target.value })}
          style={sliderStyle()}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9, color: '#888' }}>Amplitude</span>
          <span style={{ fontSize: 10, color: track.color, fontWeight: 600, fontFamily: 'monospace' }}>{(track.amplitude * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range" min={0} max={1} step={0.01} value={track.amplitude}
          onChange={(e) => updateTrack(track.id, { amplitude: +e.target.value })}
          style={sliderStyle()}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9, color: '#888' }}>Phase</span>
          <span style={{ fontSize: 10, color: track.color, fontWeight: 600, fontFamily: 'monospace' }}>{track.phase}°</span>
        </div>
        <input
          type="range" min={0} max={360} step={1} value={track.phase}
          onChange={(e) => updateTrack(track.id, { phase: +e.target.value })}
          style={sliderStyle()}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 9, color: '#888' }}>ADSR Envelope</span>
          <span style={{ fontSize: 8, color: '#555' }}>drag points + curves</span>
        </div>
        <ADSREditor
          adsr={track.adsr}
          color={track.color}
          onChange={(adsr) => updateTrack(track.id, { adsr })}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
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
