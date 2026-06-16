import { useEffect, useRef, useState } from 'react';
import { useLayoutStore } from '@/store/layoutStore';
import { Path, PathPoint } from '@/types';

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function bezierPoint(
  p0: PathPoint,
  p1: PathPoint,
  t: number
): { x: number; y: number } {
  const cp1x = p0.bezier ? p0.bezier.cp1x : p0.x + (p1.x - p0.x) * 0.33;
  const cp1y = p0.bezier ? p0.bezier.cp1y : p0.y;
  const cp2x = p0.bezier ? p0.bezier.cp2x : p0.x + (p1.x - p0.x) * 0.67;
  const cp2y = p0.bezier ? p0.bezier.cp2y : p1.y;
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * cp1x + 3 * mt * t * t * cp2x + t * t * t * p1.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * cp1y + 3 * mt * t * t * cp2y + t * t * t * p1.y,
  };
}

interface Segment {
  pathId: string;
  segIndex: number;
  points: PathPoint[];
  length: number;
  accumulatedStart: number;
}

function buildSegments(paths: Path[]): Segment[] {
  const segs: Segment[] = [];
  let acc = 0;
  paths.forEach((p) => {
    for (let i = 0; i < p.points.length - 1; i++) {
      const pts = [p.points[i], p.points[i + 1]];
      let len = 0;
      let prev = pts[0];
      for (let s = 1; s <= 12; s++) {
        const t = s / 12;
        const cur = bezierPoint(pts[0], pts[1], t);
        len += Math.hypot(cur.x - prev.x, cur.y - prev.y);
        prev = cur as unknown as PathPoint;
      }
      segs.push({
        pathId: p.id,
        segIndex: i,
        points: pts,
        length: len,
        accumulatedStart: acc,
      });
      acc += len;
    }
  });
  return segs;
}

export default function VisitorSimulator() {
  const { paths, canvas, visitorSpeed, setCanvas, zones } = useLayoutStore();
  const segmentsRef = useRef<Segment[]>(buildSegments(paths));
  const progressRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [currentNodeIdx, setCurrentNodeIdx] = useState<number>(-1);

  useEffect(() => {
    segmentsRef.current = buildSegments(paths);
    progressRef.current = 0;
    setCurrentNodeIdx(-1);
  }, [paths]);

  const totalLen = segmentsRef.current.reduce((s, x) => s + x.length, 0);

  useEffect(() => {
    if (totalLen === 0) return;

    const BASE_SPEED = 180;

    const step = (ts: number) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const dt = Math.min(64, ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      progressRef.current += (BASE_SPEED * visitorSpeed * dt);
      const prog = progressRef.current % totalLen;

      let seg = segmentsRef.current[0];
      for (const s of segmentsRef.current) {
        if (s.accumulatedStart + s.length >= prog) {
          seg = s;
          break;
        }
      }
      const localT = (prog - seg.accumulatedStart) / Math.max(seg.length, 0.001);
      const pt = bezierPoint(seg.points[0], seg.points[1], Math.min(1, localT));
      setPos(pt);

      const allNodes = paths.flatMap((p) => p.points);
      let nearestIdx = -1;
      let nearestDist = Infinity;
      allNodes.forEach((n, i) => {
        const d = Math.hypot(n.x - pt.x, n.y - pt.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearestIdx = i;
        }
      });
      if (nearestDist < 18) {
        setCurrentNodeIdx(nearestIdx);
      } else {
        setCurrentNodeIdx(-1);
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
    };
  }, [paths, totalLen, visitorSpeed]);

  useEffect(() => {
    if (!pos) return;
    const wrapper = document.querySelector('.canvas-grid') as HTMLElement | null;
    if (!wrapper) return;
    const rect = wrapper.parentElement?.getBoundingClientRect();
    if (!rect) return;
    const targetViewX = rect.width / 2 - (pos.x + canvas.offsetX) * canvas.zoom;
    const targetViewY = rect.height / 2 - (pos.y + canvas.offsetY) * canvas.zoom;
    setCanvas({
      offsetX: lerp(canvas.offsetX, targetViewX, 0.08),
      offsetY: lerp(canvas.offsetY, targetViewY, 0.08),
    });
  }, [pos, canvas.zoom, setCanvas]);

  if (totalLen === 0 || !pos) return null;

  const allNodes = paths.flatMap((p) => p.points);

  return (
    <>
      {/* 节点光晕 */}
      {allNodes.map((n, i) => {
        const isActive = i === currentNodeIdx;
        return (
          <div
            key={i}
            className={isActive ? 'pulse-node' : ''}
            style={{
              position: 'absolute',
              left: n.x - (isActive ? 18 : 5),
              top: n.y - (isActive ? 18 : 5),
              width: isActive ? 36 : 10,
              height: isActive ? 36 : 10,
              borderRadius: '50%',
              background: isActive
                ? 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(142,68,173,0.6) 40%, transparent 70%)'
                : 'rgba(142,68,173,0.3)',
              pointerEvents: 'none',
              zIndex: 5,
              transition: 'all 0.3s ease',
            }}
          />
        );
      })}

      {/* 访客点 */}
      <div
        className="visitor-dot"
        style={{
          position: 'absolute',
          left: pos.x - 24,
          top: pos.y - 24,
          width: 48,
          height: 48,
          zIndex: 10,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%,-50%)',
            width: 14,
            height: 14,
            borderRadius: '50%',
            background: 'white',
            boxShadow: '0 0 8px rgba(255,255,255,0.8)',
          }}
        />
      </div>
    </>
  );
}
