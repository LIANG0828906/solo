import React, { useCallback, useRef, useState, useEffect } from 'react';

interface BezierEditorProps {
  cp1: [number, number];
  cp2: [number, number];
  onChange: (cp1: [number, number], cp2: [number, number]) => void;
  isPlaying: boolean;
  animationProgress: number;
}

type DraggingPoint = 'cp1' | 'cp2' | null;

const CANVAS_SIZE = 300;
const CHART_HEIGHT = 180;
const CURVE_MARGIN = 30;
const CURVE_SIZE = 240;
const SNAP_THRESHOLD = 0.05;
const SNAP_VALUES = [0, 0.25, 0.5, 0.75, 1.0];
const CONTROL_RADIUS = 5;
const BALL_RADIUS = 8;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function mapNormX(nx: number): number {
  return nx * CURVE_SIZE + CURVE_MARGIN;
}

function mapNormY(ny: number): number {
  return (1 - ny) * CURVE_SIZE + CURVE_MARGIN;
}

function unmapX(px: number): number {
  return (px - CURVE_MARGIN) / CURVE_SIZE;
}

function unmapY(py: number): number {
  return 1 - (py - CURVE_MARGIN) / CURVE_SIZE;
}

function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

function cubicBezierDeriv(t: number, p0: number, p1: number, p2: number, p3: number): number {
  const mt = 1 - t;
  return 3 * mt * mt * (p1 - p0) + 6 * mt * t * (p2 - p1) + 3 * t * t * (p3 - p2);
}

function cubicBezierPoint(
  t: number,
  cp1: [number, number],
  cp2: [number, number]
): [number, number] {
  return [
    cubicBezier(t, 0, cp1[0], cp2[0], 1),
    cubicBezier(t, 0, cp1[1], cp2[1], 1),
  ];
}

function cubicBezierTangent(
  t: number,
  cp1: [number, number],
  cp2: [number, number]
): [number, number] {
  return [
    cubicBezierDeriv(t, 0, cp1[0], cp2[0], 1),
    cubicBezierDeriv(t, 0, cp1[1], cp2[1], 1),
  ];
}

function round2(v: number): string {
  return v.toFixed(2);
}

const BezierEditor: React.FC<BezierEditorProps> = ({
  cp1,
  cp2,
  onChange,
  isPlaying,
  animationProgress,
}) => {
  const curveCanvasRef = useRef<HTMLCanvasElement>(null);
  const ballCanvasRef = useRef<HTMLCanvasElement>(null);
  const chartCanvasRef = useRef<HTMLCanvasElement>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<DraggingPoint>(null);
  const [snapInfo, setSnapInfo] = useState<{
    point: DraggingPoint;
    x: number;
    y: number;
    snapped: boolean;
    label: string;
  } | null>(null);
  const [hovered, setHovered] = useState<DraggingPoint>(null);
  const [hoveredCp1, setHoveredCp1] = useState(false);
  const [hoveredCp2, setHoveredCp2] = useState(false);
  const [ballT, setBallT] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const directionRef = useRef<number>(1);
  const [chartWidth, setChartWidth] = useState(600);

  const ANIMATION_DURATION = 4000;

  useEffect(() => {
    const updateWidth = () => {
      if (chartContainerRef.current) {
        setChartWidth(chartContainerRef.current.clientWidth);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = 0;
      return;
    }

    const animate = (time: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time;
      }
      const delta = time - lastTimeRef.current;
      lastTimeRef.current = time;

      setBallT((prev) => {
        const step = delta / (ANIMATION_DURATION / 2);
        let dir = directionRef.current;
        let next = prev + step * dir;
        if (next >= 1) {
          next = 1;
          directionRef.current = -1;
        } else if (next <= 0) {
          next = 0;
          directionRef.current = 1;
        }
        return next;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying]);

  const applySnap = useCallback(
    (nx: number, ny: number, other: [number, number]): [number, number, boolean, string] => {
      let x = nx;
      let y = ny;
      let snapped = false;
      let sx: number | null = null;
      let sy: number | null = null;

      for (const sv of SNAP_VALUES) {
        if (Math.abs(x - sv) < SNAP_THRESHOLD) {
          x = sv;
          sx = sv;
          snapped = true;
        }
        if (Math.abs(y - sv) < SNAP_THRESHOLD) {
          y = sv;
          sy = sv;
          snapped = true;
        }
      }

      if (Math.abs(x - other[0]) < SNAP_THRESHOLD && Math.abs(y - other[1]) < SNAP_THRESHOLD) {
        x = other[0];
        y = other[1];
        sx = other[0];
        sy = other[1];
        snapped = true;
      }

      const label = snapped ? `Snap: (${round2(x)}, ${round2(y)})` : '';
      return [x, y, snapped, label];
    },
    []
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, point: 'cp1' | 'cp2') => {
      e.preventDefault();
      setDragging(point);
      const rect = curveCanvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const scaleX = CANVAS_SIZE / rect.width;
      const scaleY = CANVAS_SIZE / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      let nx = unmapX(mx);
      let ny = unmapY(my);
      nx = clamp(nx, 0, 1);
      ny = clamp(ny, -0.5, 1.5);
      const other = point === 'cp1' ? cp2 : cp1;
      const [sx, sy, snapped, label] = applySnap(nx, ny, other);
      const newCp1 = point === 'cp1' ? [sx, sy] as [number, number] : cp1;
      const newCp2 = point === 'cp2' ? [sx, sy] as [number, number] : cp2;
      onChange(newCp1, newCp2);
      setSnapInfo({ point, x: sx, y: sy, snapped, label });
    },
    [cp1, cp2, onChange, applySnap]
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = curveCanvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const scaleX = CANVAS_SIZE / rect.width;
      const scaleY = CANVAS_SIZE / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      let nx = unmapX(mx);
      let ny = unmapY(my);
      nx = clamp(nx, 0, 1);
      ny = clamp(ny, -0.5, 1.5);
      const other = dragging === 'cp1' ? cp2 : cp1;
      const [sx, sy, snapped, label] = applySnap(nx, ny, other);
      const newCp1 = dragging === 'cp1' ? [sx, sy] as [number, number] : cp1;
      const newCp2 = dragging === 'cp2' ? [sx, sy] as [number, number] : cp2;
      onChange(newCp1, newCp2);
      setSnapInfo({ point: dragging, x: sx, y: sy, snapped, label });
    };

    const handleMouseUp = () => {
      setDragging(null);
      setSnapInfo(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, cp1, cp2, onChange, applySnap]);

  useEffect(() => {
    const canvas = curveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const v = i / 10;
      const px = mapNormX(v);
      const py = mapNormY(v);
      ctx.beginPath();
      ctx.moveTo(px, CURVE_MARGIN);
      ctx.lineTo(px, CURVE_MARGIN + CURVE_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(CURVE_MARGIN, py);
      ctx.lineTo(CURVE_MARGIN + CURVE_SIZE, py);
      ctx.stroke();
    }

    ctx.strokeStyle = '#444466';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(CURVE_MARGIN, CURVE_MARGIN);
    ctx.lineTo(CURVE_MARGIN, CURVE_MARGIN + CURVE_SIZE);
    ctx.lineTo(CURVE_MARGIN + CURVE_SIZE, CURVE_MARGIN + CURVE_SIZE);
    ctx.stroke();

    ctx.fillStyle = '#8888aa';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const v = i / 5;
      const px = mapNormX(v);
      ctx.fillText(v.toFixed(1), px, CURVE_MARGIN + CURVE_SIZE + 14);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i <= 5; i++) {
      const v = i / 5;
      const py = mapNormY(v);
      ctx.fillText(v.toFixed(1), CURVE_MARGIN - 6, py);
    }
    ctx.textBaseline = 'alphabetic';

    const p0x = mapNormX(0);
    const p0y = mapNormY(0);
    const p3x = mapNormX(1);
    const p3y = mapNormY(1);
    const cp1x = mapNormX(cp1[0]);
    const cp1y = mapNormY(cp1[1]);
    const cp2x = mapNormX(cp2[0]);
    const cp2y = mapNormY(cp2[1]);

    ctx.strokeStyle = '#666688';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(p0x, p0y);
    ctx.lineTo(cp1x, cp1y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p3x, p3y);
    ctx.lineTo(cp2x, cp2y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p0x, p0y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p3x, p3y);
    ctx.stroke();

    if (dragging || snapInfo) {
      const dragPoint = snapInfo?.point ?? dragging;
      if (dragPoint) {
        const pt = dragPoint === 'cp1' ? cp1 : cp2;
        const dx = mapNormX(pt[0]);
        const dy = mapNormY(pt[1]);
        ctx.strokeStyle = '#444466';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(dx, CURVE_MARGIN);
        ctx.lineTo(dx, CURVE_MARGIN + CURVE_SIZE);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(CURVE_MARGIN, dy);
        ctx.lineTo(CURVE_MARGIN + CURVE_SIZE, dy);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    if (dragging === 'cp1' || snapInfo?.point === 'cp1') {
      const t = 0.25;
      const b = cubicBezierPoint(t, cp1, cp2);
      const d = cubicBezierTangent(t, cp1, cp2);
      const bx = mapNormX(b[0]);
      const by = mapNormY(b[1]);
      const mag = Math.sqrt(d[0] * d[0] + d[1] * d[1]);
      if (mag > 0) {
        const ux = d[0] / mag;
        const uy = -d[1] / mag;
        const endX = bx + ux * 70;
        const endY = by + uy * 70;
        ctx.strokeStyle = '#ff79c6';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        const ang = Math.atan2(uy, ux);
        const ah = 10;
        ctx.fillStyle = '#ff79c6';
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - ah * Math.cos(ang - Math.PI / 6),
          endY - ah * Math.sin(ang - Math.PI / 6)
        );
        ctx.lineTo(
          endX - ah * Math.cos(ang + Math.PI / 6),
          endY - ah * Math.sin(ang + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        const angleDeg = (Math.atan2(-d[1], d[0]) * 180) / Math.PI;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#ff79c6';
        ctx.textAlign = 'left';
        ctx.fillText(`θ: ${Math.round(angleDeg)}°`, endX + 6, endY + 4);
        ctx.textAlign = 'start';
      }
    }

    if (dragging === 'cp2' || snapInfo?.point === 'cp2') {
      const t = 0.75;
      const b = cubicBezierPoint(t, cp1, cp2);
      const d = cubicBezierTangent(t, cp1, cp2);
      const bx = mapNormX(b[0]);
      const by = mapNormY(b[1]);
      const mag = Math.sqrt(d[0] * d[0] + d[1] * d[1]);
      if (mag > 0) {
        const ux = d[0] / mag;
        const uy = -d[1] / mag;
        const endX = bx + ux * 70;
        const endY = by + uy * 70;
        ctx.strokeStyle = '#ff79c6';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        const ang = Math.atan2(uy, ux);
        const ah = 10;
        ctx.fillStyle = '#ff79c6';
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - ah * Math.cos(ang - Math.PI / 6),
          endY - ah * Math.sin(ang - Math.PI / 6)
        );
        ctx.lineTo(
          endX - ah * Math.cos(ang + Math.PI / 6),
          endY - ah * Math.sin(ang + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
        const angleDeg = (Math.atan2(-d[1], d[0]) * 180) / Math.PI;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#ff79c6';
        ctx.textAlign = 'left';
        ctx.fillText(`θ: ${Math.round(angleDeg)}°`, endX + 6, endY + 4);
        ctx.textAlign = 'start';
      }
    }

    const cp1Glow = hoveredCp1 || dragging === 'cp1' ? 14 : 6;
    ctx.save();
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = cp1Glow;
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.arc(cp1x, cp1y, CONTROL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const cp2Glow = hoveredCp2 || dragging === 'cp2' ? 14 : 6;
    ctx.save();
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = cp2Glow;
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(cp2x, cp2y, CONTROL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (snapInfo?.snapped && snapInfo.point) {
      const pt = snapInfo.point === 'cp1' ? cp1 : cp2;
      const lx = mapNormX(pt[0]) + 14;
      const ly = mapNormY(pt[1]) + 6;
      ctx.font = 'bold 11px sans-serif';
      const metrics = ctx.measureText(snapInfo.label);
      const pad = 6;
      const bw = metrics.width + pad * 2;
      const bh = 18;
      ctx.fillStyle = '#00ff88';
      ctx.beginPath();
      const radius = 4;
      ctx.moveTo(lx + radius, ly - bh + 4);
      ctx.lineTo(lx + bw - radius, ly - bh + 4);
      ctx.quadraticCurveTo(lx + bw, ly - bh + 4, lx + bw, ly - bh + 4 + radius);
      ctx.lineTo(lx + bw, ly + 4 - radius);
      ctx.quadraticCurveTo(lx + bw, ly + 4, lx + bw - radius, ly + 4);
      ctx.lineTo(lx + radius, ly + 4);
      ctx.quadraticCurveTo(lx, ly + 4, lx, ly + 4 - radius);
      ctx.lineTo(lx, ly - bh + 4 + radius);
      ctx.quadraticCurveTo(lx, ly - bh + 4, lx + radius, ly - bh + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1a1a2e';
      ctx.textBaseline = 'middle';
      ctx.fillText(snapInfo.label, lx + pad, ly - bh / 2 + 4);
      ctx.textBaseline = 'alphabetic';
    }
  }, [cp1, cp2, dragging, snapInfo, hoveredCp1, hoveredCp2]);

  useEffect(() => {
    const canvas = ballCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CANVAS_SIZE * dpr;
    canvas.height = CANVAS_SIZE * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    ctx.strokeStyle = '#1f2f4f';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const v = i / 10;
      const px = mapNormX(v);
      const py = mapNormY(v);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(CANVAS_SIZE, py);
      ctx.stroke();
    }

    ctx.strokeStyle = '#444466';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const pt = cubicBezierPoint(t, cp1, cp2);
      const px = mapNormX(pt[0]);
      const py = mapNormY(pt[1]);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    const t = isPlaying ? ballT : animationProgress;
    const bp = cubicBezierPoint(t, cp1, cp2);
    const bx = mapNormX(bp[0]);
    const by = mapNormY(bp[1]);

    const grad = ctx.createRadialGradient(bx - 2, by - 2, 2, bx, by, BALL_RADIUS * 2);
    grad.addColorStop(0, '#88ffaa');
    grad.addColorStop(0.5, '#00ff88');
    grad.addColorStop(1, '#00aa55');

    ctx.save();
    ctx.shadowColor = '#00ff88';
    ctx.shadowBlur = 20;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(bx, by, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(bx - 3, by - 3, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }, [cp1, cp2, ballT, isPlaying, animationProgress]);

  useEffect(() => {
    const canvas = chartCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = chartWidth;
    const h = CHART_HEIGHT;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#16213e';
    ctx.fillRect(0, 0, w, h);

    const chartLeft = 40;
    const chartRight = w - 10;
    const chartTop = 20;
    const chartBottom = h - 28;
    const chartW = chartRight - chartLeft;
    const chartH = chartBottom - chartTop;

    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 1;
    const xTicks = [0, 0.25, 0.5, 0.75, 1];
    const yTicks = [0, 0.5, 1.0, 1.5];
    for (const xt of xTicks) {
      const px = chartLeft + xt * chartW;
      ctx.beginPath();
      ctx.moveTo(px, chartTop);
      ctx.lineTo(px, chartBottom);
      ctx.stroke();
    }
    for (const yt of yTicks) {
      const py = chartBottom - (yt / 1.5) * chartH;
      ctx.beginPath();
      ctx.moveTo(chartLeft, py);
      ctx.lineTo(chartRight, py);
      ctx.stroke();
    }

    const midD = cubicBezierTangent(0.5, cp1, cp2);
    const midMag = Math.sqrt(midD[0] * midD[0] + midD[1] * midD[1]);

    const samples = 100;
    const speeds: number[] = new Array(samples);
    for (let i = 0; i < samples; i++) {
      const tt = i / (samples - 1);
      const d = cubicBezierTangent(tt, cp1, cp2);
      const mag = Math.sqrt(d[0] * d[0] + d[1] * d[1]);
      const norm = midMag > 0 ? mag / midMag : 1;
      speeds[i] = Math.min(norm, 1.5);
    }

    ctx.beginPath();
    for (let i = 0; i < samples; i++) {
      const tt = i / (samples - 1);
      const px = chartLeft + tt * chartW;
      const py = chartBottom - (speeds[i] / 1.5) * chartH;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    const grad = ctx.createLinearGradient(0, chartTop, 0, chartBottom);
    grad.addColorStop(0, 'rgba(0, 255, 136, 0.35)');
    grad.addColorStop(1, 'rgba(0, 255, 136, 0.02)');
    ctx.lineTo(chartRight, chartBottom);
    ctx.lineTo(chartLeft, chartBottom);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    for (let i = 0; i < samples; i++) {
      const tt = i / (samples - 1);
      const px = chartLeft + tt * chartW;
      const py = chartBottom - (speeds[i] / 1.5) * chartH;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#8888aa';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    for (const xt of xTicks) {
      const px = chartLeft + xt * chartW;
      ctx.fillText(`${Math.round(xt * 100)}%`, px, chartBottom + 16);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (const yt of yTicks) {
      const py = chartBottom - (yt / 1.5) * chartH;
      ctx.fillText(yt.toFixed(1), chartLeft - 8, py);
    }
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'start';

    const playT = isPlaying ? ballT : animationProgress;
    if (isPlaying || playT > 0) {
      const sx = chartLeft + playT * chartW;
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx, chartTop);
      ctx.lineTo(sx, chartBottom);
      ctx.stroke();

      ctx.fillStyle = '#00d4ff';
      ctx.beginPath();
      ctx.moveTo(sx, chartTop - 2);
      ctx.lineTo(sx - 5, chartTop - 10);
      ctx.lineTo(sx + 5, chartTop - 10);
      ctx.closePath();
      ctx.fill();

      const idx = Math.min(Math.round(playT * (samples - 1)), samples - 1);
      const currentSpeed = speeds[idx];
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#00d4ff';
      ctx.textAlign = 'left';
      ctx.fillText(currentSpeed.toFixed(2), sx + 8, chartTop + 4);
      ctx.textAlign = 'start';
    }
  }, [cp1, cp2, chartWidth, ballT, isPlaying, animationProgress]);

  const handleCurveMouseMove = (e: React.MouseEvent) => {
    const rect = curveCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const cp1x = mapNormX(cp1[0]);
    const cp1y = mapNormY(cp1[1]);
    const cp2x = mapNormX(cp2[0]);
    const cp2y = mapNormY(cp2[1]);
    const d1 = Math.sqrt((mx - cp1x) ** 2 + (my - cp1y) ** 2);
    const d2 = Math.sqrt((mx - cp2x) ** 2 + (my - cp2y) ** 2);
    const th = 12;
    setHoveredCp1(d1 < th);
    setHoveredCp2(d2 < th);
    if (d1 < th) setHovered('cp1');
    else if (d2 < th) setHovered('cp2');
    else setHovered(null);
  };

  const handleCurveMouseLeave = () => {
    setHoveredCp1(false);
    setHoveredCp2(false);
    setHovered(null);
  };

  const cp1Cursor = hoveredCp1 || dragging === 'cp1' ? 'grab' : 'default';
  const cp2Cursor = hoveredCp2 || dragging === 'cp2' ? 'grab' : 'default';
  const activeCursor = dragging === 'cp1' || dragging === 'cp2' ? 'grabbing' : (hovered ? 'grab' : 'default');

  return (
    <div
      style={{
        background: '#1a1a2e',
        borderRadius: 8,
        padding: 16,
        userSelect: 'none',
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        color: '#e0e0e0',
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: '#00ff88',
          marginBottom: 12,
          paddingBottom: 6,
          borderBottom: '2px solid #00ff88',
          boxShadow: '0 2px 8px -4px rgba(0,255,136,0.4)',
          display: 'inline-block',
        }}
      >
        Bezier Curve Editor
      </div>

      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              fontSize: 12,
              color: '#ffffff',
              fontWeight: 500,
              marginBottom: 8,
              paddingBottom: 4,
              borderBottom: '1px solid #00d4ff',
              width: '100%',
              textAlign: 'center',
            }}
          >
            Curve & Controls
          </div>
          <div style={{ position: 'relative' }}>
            <canvas
              ref={curveCanvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              style={{
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
                borderRadius: 6,
                border: '1px solid #2a2a4a',
                cursor: activeCursor,
                display: 'block',
              }}
              onMouseMove={handleCurveMouseMove}
              onMouseLeave={handleCurveMouseLeave}
              onMouseDown={(e) => {
                if (hoveredCp1) handleMouseDown(e, 'cp1');
                else if (hoveredCp2) handleMouseDown(e, 'cp2');
              }}
            />
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
                pointerEvents: 'none',
              }}
              viewBox={`0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}`}
            />
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 12,
              color: '#8888aa',
              fontFamily: 'monospace',
              background: '#16213e',
              padding: '6px 12px',
              borderRadius: 4,
              border: '1px solid #2a2a4a',
            }}
          >
            cubic-bezier(
            <span style={{ color: '#00d4ff' }}>{round2(cp1[0])}</span>,{' '}
            <span style={{ color: '#00d4ff' }}>{round2(cp1[1])}</span>,{' '}
            <span style={{ color: '#00ff88' }}>{round2(cp2[0])}</span>,{' '}
            <span style={{ color: '#00ff88' }}>{round2(cp2[1])}</span>)
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              fontSize: 12,
              color: '#ffffff',
              fontWeight: 500,
              marginBottom: 8,
              paddingBottom: 4,
              borderBottom: '1px solid #00ff88',
              width: '100%',
              textAlign: 'center',
            }}
          >
            Animation Preview
          </div>
          <canvas
            ref={ballCanvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            style={{
              width: CANVAS_SIZE,
              height: CANVAS_SIZE,
              borderRadius: 6,
              border: '1px solid #2a2a4a',
              display: 'block',
            }}
          />
          <div
            style={{
              marginTop: 10,
              fontSize: 11,
              color: '#8888aa',
              display: 'flex',
              gap: 16,
            }}
          >
            <span>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00d4ff', display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
              CP1
            </span>
            <span>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ff88', display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
              CP2
            </span>
            <span>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff79c6', display: 'inline-block', marginRight: 4, verticalAlign: 'middle' }} />
              Tangent
            </span>
          </div>
        </div>
      </div>

      <div
        ref={chartContainerRef}
        style={{
          width: '100%',
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: '#ffffff',
            fontWeight: 500,
            marginBottom: 8,
            paddingBottom: 4,
            borderBottom: '1px solid #00d4ff',
          }}
        >
          Speed over Time
        </div>
        <canvas
          ref={chartCanvasRef}
          style={{
            width: '100%',
            height: CHART_HEIGHT,
            borderRadius: 6,
            border: '1px solid #2a2a4a',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
};

export default BezierEditor;
