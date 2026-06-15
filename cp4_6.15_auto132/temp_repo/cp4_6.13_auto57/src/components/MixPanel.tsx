import { useRef, useState, useCallback } from 'react';
import { GripVertical } from 'lucide-react';

interface MixPanelProps {
  volume: number;
  eqLow: number;
  eqMid: number;
  eqHigh: number;
  reverb: number;
  effectOrder: string[];
  onVolumeChange: (v: number) => void;
  onEqLowChange: (v: number) => void;
  onEqMidChange: (v: number) => void;
  onEqHighChange: (v: number) => void;
  onReverbChange: (v: number) => void;
  onEffectOrderChange: (order: string[]) => void;
}

interface KnobProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}

function Knob({ label, value, min = 0, max = 1, onChange }: KnobProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);

  const normalizedValue = (value - min) / (max - min);
  const angleRange = 270;
  const startAngle = -225;
  const currentAngle = startAngle + normalizedValue * angleRange;

  const polarToCartesian = (cx: number, cy: number, r: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const describeArc = (cx: number, cy: number, r: number, start: number, end: number) => {
    const s = polarToCartesian(cx, cy, r, end);
    const e = polarToCartesian(cx, cy, r, start);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 0 ${e.x} ${e.y}`;
  };

  const tickMarks = Array.from({ length: 21 }, (_, i) => {
    const tickAngle = startAngle + (i / 20) * angleRange;
    const outer = polarToCartesian(50, 50, 42, tickAngle);
    const inner = polarToCartesian(50, 50, 37, tickAngle);
    return { x1: outer.x, y1: outer.y, x2: inner.x, y2: inner.y };
  });

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      isDragging.current = true;
      startY.current = e.clientY;
      startValue.current = value;
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    [value]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      const delta = startY.current - e.clientY;
      const range = max - min;
      const sensitivity = range / 150;
      const newValue = Math.min(max, Math.max(min, startValue.current + delta * sensitivity));
      onChange(newValue);
    },
    [min, max, onChange]
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const radius = 28;
  const bgArcPath = describeArc(50, 50, radius, startAngle, startAngle + angleRange);
  const valueArcEnd = startAngle + normalizedValue * angleRange;
  const valueArcPath = normalizedValue > 0.001
    ? describeArc(50, 50, radius, startAngle, valueArcEnd)
    : '';
  const indicator = polarToCartesian(50, 50, radius, currentAngle);

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <svg
        ref={svgRef}
        width={100}
        height={100}
        viewBox="0 0 100 100"
        className="knob-cursor"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <circle cx={50} cy={50} r={34} fill="#16213e" stroke="#0a1128" strokeWidth={2} />
        <path d={bgArcPath} fill="none" stroke="#0a1128" strokeWidth={5} strokeLinecap="round" />
        {valueArcPath && (
          <path d={valueArcPath} fill="none" stroke="#e94560" strokeWidth={5} strokeLinecap="round" />
        )}
        {tickMarks.map((t, i) => (
          <line
            key={i}
            x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
            stroke="#e0e0e0"
            strokeWidth={0.8}
            opacity={0.4}
          />
        ))}
        <circle cx={indicator.x} cy={indicator.y} r={4} fill="#e94560" />
      </svg>
      <span className="font-display text-[10px] uppercase tracking-wider text-accent">
        {label}
      </span>
      <span className="font-body text-sm text-accent-hover">
        {value.toFixed(2)}
      </span>
    </div>
  );
}

const EFFECT_META: Record<string, { label: string; getValues: (p: MixPanelProps) => string }> = {
  volume: {
    label: 'Volume',
    getValues: (p) => `${p.volume.toFixed(2)}`,
  },
  eq: {
    label: 'EQ',
    getValues: (p) => `L:${p.eqLow.toFixed(1)} M:${p.eqMid.toFixed(1)} H:${p.eqHigh.toFixed(1)}`,
  },
  reverb: {
    label: 'Reverb',
    getValues: (p) => `${p.reverb.toFixed(2)}`,
  },
};

export default function MixPanel(props: MixPanelProps) {
  const { effectOrder, onEffectOrderChange } = props;
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback(
    (e: React.DragEvent, index: number) => {
      setDragIndex(index);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(index));
    },
    []
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverIndex(index);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === index) {
        setDragIndex(null);
        setDragOverIndex(null);
        return;
      }
      const newOrder = [...effectOrder];
      const [removed] = newOrder.splice(dragIndex, 1);
      newOrder.splice(index, 0, removed);
      onEffectOrderChange(newOrder);
      setDragIndex(null);
      setDragOverIndex(null);
    },
    [dragIndex, effectOrder, onEffectOrderChange]
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  return (
    <div className="bg-card rounded-xl p-6 space-y-6">
      <h3 className="font-display text-sm uppercase tracking-widest text-accent">
        Mix Controls
      </h3>

      <div className="flex justify-around items-start flex-wrap gap-4">
        <Knob label="Volume" value={props.volume} onChange={props.onVolumeChange} />
        <Knob label="Low EQ" value={props.eqLow} min={-12} max={12} onChange={props.onEqLowChange} />
        <Knob label="Mid EQ" value={props.eqMid} min={-12} max={12} onChange={props.onEqMidChange} />
        <Knob label="High EQ" value={props.eqHigh} min={-12} max={12} onChange={props.onEqHighChange} />
      </div>

      <div>
        <h4 className="font-display text-xs uppercase tracking-widest text-accent/70 mb-3">
          Effect Chain
        </h4>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {effectOrder.map((effect, index) => {
            const meta = EFFECT_META[effect];
            const isDragging = dragIndex === index;
            const isDragOver = dragOverIndex === index && dragIndex !== index;
            return (
              <div
                key={effect}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`effect-card flex items-center gap-3 rounded-lg bg-deep-blue/60 border px-4 py-3 min-w-[160px] ${
                  isDragging ? 'dragging' : ''
                } ${isDragOver ? 'border-accent' : 'border-transparent'}`}
              >
                <div className="knob-cursor text-accent/50">
                  <GripVertical size={16} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-display text-xs uppercase tracking-wider text-accent">
                    {meta?.label ?? effect}
                  </span>
                  <span className="font-body text-[11px] text-accent-hover/70">
                    {meta?.getValues(props) ?? ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-4 pt-2">
        <span className="font-display text-xs uppercase tracking-wider text-accent/60">
          Reverb
        </span>
        <div className="flex-1 h-2 rounded-full bg-deep-blue relative">
          <div
            className="absolute left-0 top-0 h-full rounded-full transition-default"
            style={{
              width: `${props.reverb * 100}%`,
              background: 'linear-gradient(90deg, #e94560, #7b2ff7)',
            }}
          />
        </div>
        <span className="font-body text-xs text-accent-hover w-12 text-right">
          {props.reverb.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
