import { useRef, useEffect, useState, useCallback } from 'react';
import { useAnimationStore } from '@/stores/animationStore';
import type { BezierControlPoints } from '@/types';
import { generateBezierPath } from '@/utils/easing';

const TIMELINE_PADDING = 24;
const ROW_HEIGHT = 80;
const ROW_TOP = 20;
const KEYFRAME_RADIUS = 6;
const CONTROL_RADIUS = 4;

type DragTarget =
  | { type: 'none' }
  | { type: 'keyframe'; id: string; offsetX: number }
  | { type: 'control'; kfId: string; index: 0 | 1 }
  | { type: 'playhead' }
  | { type: 'duration' };

export default function Timeline() {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 120 });

  const {
    elements,
    selectedElementId,
    keyframes,
    selectedKeyframeId,
    timeline,
    addKeyframe,
    updateKeyframe,
    selectKeyframe,
    deleteKeyframe,
    setCurrentTime,
    setTimelineDuration,
    setKeyframeEasing,
  } = useAnimationStore();

  const dragRef = useRef<DragTarget>({ type: 'none' });
  const [, force] = useState(0);

  useEffect(() => {
    const onResize = () => {
      if (svgRef.current) {
        const r = svgRef.current.getBoundingClientRect();
        setDims({ w: r.width, h: r.height });
      }
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const innerWidth = Math.max(0, dims.w - TIMELINE_PADDING * 2);

  const timeToX = useCallback(
    (t: number) => {
      if (timeline.duration <= 0) return TIMELINE_PADDING;
      return TIMELINE_PADDING + (t / timeline.duration) * innerWidth;
    },
    [timeline.duration, innerWidth],
  );

  const xToTime = useCallback(
    (x: number) => {
      if (innerWidth <= 0) return 0;
      const pct = (x - TIMELINE_PADDING) / innerWidth;
      return Math.max(0, Math.min(1, pct)) * timeline.duration;
    },
    [timeline.duration, innerWidth],
  );

  const rowY = (elIdx: number) => ROW_TOP + elIdx * (ROW_HEIGHT + 8);

  const ticks = (() => {
    const arr: { x: number; label: string; major: boolean }[] = [];
    if (timeline.duration <= 0) return arr;
    const majorStepMs =
      timeline.duration <= 3000
        ? 500
        : timeline.duration <= 6000
          ? 1000
          : 2000;
    const minorStepMs = majorStepMs / 5;
    for (let t = 0; t <= timeline.duration; t += minorStepMs) {
      const major = t % majorStepMs === 0;
      arr.push({
        x: timeToX(t),
        label: major ? `${(t / 1000).toFixed(1)}s` : '',
        major,
      });
    }
    return arr;
  })();

  const elementRows = elements.map((el, idx) => ({
    element: el,
    y: rowY(idx),
    keyframes: keyframes
      .filter((k) => k.elementId === el.id)
      .sort((a, b) => a.time - b.time),
  }));

  const selectedElement = elements.find((e) => e.id === selectedElementId);
  const selectedElementRow = elementRows.find(
    (r) => r.element.id === selectedElementId,
  );

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragRef.current.type !== 'none') return;
    const rect = svgRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const time = xToTime(x);

    if (!selectedElementRow || !selectedElement) return;
    const rowYBottom = selectedElementRow.y + ROW_HEIGHT;
    if (y >= selectedElementRow.y && y <= rowYBottom) {
      addKeyframe(selectedElement.id, time);
    } else {
      setCurrentTime(time);
    }
  };

  const startDrag = (target: DragTarget) => {
    dragRef.current = target;
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const target = dragRef.current;
      if (target.type === 'none' || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (target.type === 'keyframe') {
        const t = xToTime(x - target.offsetX);
        updateKeyframe(target.id, { time: t });
      } else if (target.type === 'playhead') {
        setCurrentTime(xToTime(x));
      } else if (target.type === 'duration') {
        const newDur = Math.max(xToTime(x), 1000);
        setTimelineDuration(newDur);
      } else if (target.type === 'control') {
        const row = elementRows.find((r) =>
          r.keyframes.some((k) => k.id === target.kfId),
        );
        const kf = keyframes.find((k) => k.id === target.kfId);
        if (!row || !kf) return;
        const sorted = row.keyframes;
        const idx = sorted.findIndex((k) => k.id === kf.id);
        const next = sorted[idx + 1];
        if (!next) return;
        const segmentWidth = Math.max(
          1,
          timeToX(next.time) - timeToX(kf.time),
        );
        const rowBottom = row.y + ROW_HEIGHT;
        const maxY = row.y + ROW_HEIGHT * 0.9;
        const minY = row.y + ROW_HEIGHT * 0.1;

        let nx = (x - timeToX(kf.time)) / segmentWidth;
        let ny = (rowBottom - y) / ROW_HEIGHT;
        nx = Math.max(0, Math.min(1, nx));
        ny = Math.max(0, Math.min(1.1, ny));
        y;
        maxY;
        minY;

        const updated: BezierControlPoints = { ...kf.easing };
        if (target.index === 0) {
          updated.x1 = nx;
          updated.y1 = ny;
        } else {
          updated.x2 = nx;
          updated.y2 = ny;
        }
        setKeyframeEasing(kf.id, updated);
        force((n) => n + 1);
      }
    };

    const onUp = () => {
      dragRef.current = { type: 'none' };
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [
    elementRows,
    keyframes,
    updateKeyframe,
    setCurrentTime,
    setTimelineDuration,
    setKeyframeEasing,
    xToTime,
    timeToX,
  ]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        (e.key === 'Delete' || e.key === 'Backspace') &&
        selectedKeyframeId &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault();
        deleteKeyframe(selectedKeyframeId);
      }
    },
    [selectedKeyframeId, deleteKeyframe],
  );

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  const durationX = timeToX(timeline.duration);
  const playheadX = timeToX(timeline.currentTime);
  const svgHeight = Math.max(
    ROW_TOP + elements.length * (ROW_HEIGHT + 8) + 30,
    dims.h,
  );

  return (
    <div className="timeline">
      <svg
        ref={svgRef}
        className="timeline-svg"
        viewBox={`0 0 ${dims.w} ${svgHeight}`}
        preserveAspectRatio="none"
        onClick={handleSvgClick}
      >
        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={t.x}
              y1={ROW_TOP - 10}
              x2={t.x}
              y2={ROW_TOP + ROW_HEIGHT * elements.length + 8}
              className={t.major ? 'timeline-tick-major' : 'timeline-tick'}
            />
            {t.label && (
              <text
                x={t.x}
                y={ROW_TOP - 14}
                textAnchor="middle"
                className="timeline-tick-label"
              >
                {t.label}
              </text>
            )}
          </g>
        ))}

        {elementRows.map(({ element, y, keyframes: sorted }) => (
          <g key={element.id}>
            <rect
              x={TIMELINE_PADDING - 8}
              y={y - 4}
              width={innerWidth + 16}
              height={ROW_HEIGHT + 8}
              fill={
                element.id === selectedElementId
                  ? 'rgba(233, 69, 96, 0.06)'
                  : 'transparent'
              }
              rx={6}
            />

            {sorted.map((kf, i) => {
              const next = sorted[i + 1];
              if (!next) return null;
              const x1 = timeToX(kf.time);
              const x2 = timeToX(next.time);
              const yStart = y + ROW_HEIGHT;
              const yEnd = y + ROW_HEIGHT;
              const path = generateBezierPath(
                x1,
                yStart,
                x2,
                yEnd,
                kf.easing,
                ROW_HEIGHT * 0.8,
              );
              const active =
                selectedKeyframeId === kf.id ||
                selectedKeyframeId === next.id;

              const cp1x = x1 + kf.easing.x1 * (x2 - x1);
              const cp1y = yEnd - kf.easing.y1 * (ROW_HEIGHT * 0.8);
              const cp2x = x1 + kf.easing.x2 * (x2 - x1);
              const cp2y = yEnd - kf.easing.y2 * (ROW_HEIGHT * 0.8);

              return (
                <g key={`curve-${kf.id}`}>
                  <path
                    d={path}
                    className={`easing-path ${active ? 'active' : ''}`}
                  />
                  {active && (
                    <>
                      <line
                        x1={x1}
                        y1={yStart}
                        x2={cp1x}
                        y2={cp1y}
                        className="easing-control-line"
                      />
                      <line
                        x1={x2}
                        y1={yEnd}
                        x2={cp2x}
                        y2={cp2y}
                        className="easing-control-line"
                      />
                      <g
                        className="control-handle"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          startDrag({ type: 'control', kfId: kf.id, index: 0 });
                        }}
                      >
                        <circle
                          cx={cp1x}
                          cy={cp1y}
                          r={CONTROL_RADIUS}
                          fill="#FFFFFF"
                        />
                      </g>
                      <g
                        className="control-handle"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          startDrag({ type: 'control', kfId: kf.id, index: 1 });
                        }}
                      >
                        <circle
                          cx={cp2x}
                          cy={cp2y}
                          r={CONTROL_RADIUS}
                          fill="#FFFFFF"
                        />
                      </g>
                    </>
                  )}
                </g>
              );
            })}

            {sorted.map((kf) => {
              const cx = timeToX(kf.time);
              const cy = y + ROW_HEIGHT;
              const isSelected = selectedKeyframeId === kf.id;
              return (
                <g
                  key={kf.id}
                  className={`keyframe-node ${isSelected ? 'selected' : ''}`}
                  style={{ color: element.color }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    const rect = svgRef.current!.getBoundingClientRect();
                    const mX = e.clientX - rect.left;
                    startDrag({
                      type: 'keyframe',
                      id: kf.id,
                      offsetX: mX - cx,
                    });
                    selectKeyframe(kf.id);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    selectKeyframe(kf.id);
                  }}
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={KEYFRAME_RADIUS + 4}
                    fill="transparent"
                  />
                  <circle cx={cx} cy={cy} r={KEYFRAME_RADIUS} fill={element.color} />
                </g>
              );
            })}
          </g>
        ))}

        <g
          onMouseDown={(e) => {
            e.stopPropagation();
            startDrag({ type: 'playhead' });
          }}
          style={{ cursor: 'ew-resize' }}
        >
          <polygon
            className="playhead-triangle"
            points={`${playheadX - 6},${ROW_TOP - 10} ${playheadX + 6},${ROW_TOP - 10} ${playheadX},${ROW_TOP - 2}`}
          />
          <rect
            className="playhead-line"
            x={playheadX - 1}
            y={ROW_TOP - 2}
            width={2}
            height={ROW_HEIGHT * elements.length + 20}
          />
        </g>

        <g
          className="duration-handle"
          onMouseDown={(e) => {
            e.stopPropagation();
            startDrag({ type: 'duration' });
          }}
        >
          <rect
            x={durationX - 4}
            y={ROW_TOP - 8}
            width={8}
            height={ROW_HEIGHT * elements.length + 16}
            rx={4}
          />
        </g>
      </svg>
    </div>
  );
}
