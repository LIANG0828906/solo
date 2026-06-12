import React, { useEffect, useRef, useCallback, useImperativeHandle, forwardRef, useState } from 'react';
import { Evaluator } from './ExpressionParser';

export interface ViewState {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export interface CurveData {
  id: string;
  expression: string;
  color: string;
  colorEnd: string;
  visible: boolean;
  opacityAnim: number;
  evaluator?: Evaluator;
}

export interface CoordinateCanvasHandle {
  exportSVG: () => void;
}

interface Props {
  curves: CurveData[];
  view: ViewState;
  onViewChange: (view: ViewState) => void;
  onToggleCurve: (id: string) => void;
}

interface ViewAnimation {
  start: ViewState;
  target: ViewState;
  startTime: number;
  duration: number;
}

const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);

const lerpView = (a: ViewState, b: ViewState, t: number): ViewState => ({
  xMin: a.xMin + (b.xMin - a.xMin) * t,
  xMax: a.xMax + (b.xMax - a.xMax) * t,
  yMin: a.yMin + (b.yMin - a.yMin) * t,
  yMax: a.yMax + (b.yMax - a.yMin) * t,
});

function pickGridStep(range: number): { major: number; minor: number } {
  const candidates = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];
  const targetLines = 10;
  let major = candidates[candidates.length - 1];
  for (const c of candidates) {
    if (range / c <= targetLines) {
      major = c;
      break;
    }
  }
  return { major, minor: major / 5 };
}

function formatNumber(n: number, step: number): string {
  const digits = Math.max(0, -Math.floor(Math.log10(step)) + 1);
  if (Math.abs(n) < step / 100) return '0';
  return n.toFixed(digits).replace(/\.?0+$/, '');
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16),
  };
}

export const CoordinateCanvas = forwardRef<CoordinateCanvasHandle, Props>(function CoordinateCanvas(
  { curves, view, onViewChange, onToggleCurve },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const viewAnimRef = useRef<ViewAnimation | null>(null);
  const currentViewRef = useRef<ViewState>(view);
  const curvesRef = useRef<CurveData[]>(curves);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, view: view });
  const lastWheelTimeRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);
  const legendClickableRef = useRef<{ id: string; x: number; y: number; w: number; h: number }[]>([]);

  useEffect(() => {
    curvesRef.current = curves;
  }, [curves]);

  useEffect(() => {
    currentViewRef.current = view;
  }, [view]);

  useImperativeHandle(ref, () => ({
    exportSVG: () => doExportSVG(),
  }));

  const worldToScreen = useCallback(
    (wx: number, wy: number, w: number, h: number, v: ViewState) => {
      const sx = ((wx - v.xMin) / (v.xMax - v.xMin)) * w;
      const sy = h - ((wy - v.yMin) / (v.yMax - v.yMin)) * h;
      return { x: sx, y: sy };
    },
    []
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let v: ViewState;
    if (viewAnimRef.current) {
      const now = performance.now();
      const anim = viewAnimRef.current;
      const elapsed = now - anim.startTime;
      if (elapsed >= anim.duration) {
        v = anim.target;
        viewAnimRef.current = null;
        currentViewRef.current = v;
        onViewChange(v);
      } else {
        const t = easeOut(elapsed / anim.duration);
        v = lerpView(anim.start, anim.target, t);
        currentViewRef.current = v;
      }
    } else {
      v = currentViewRef.current;
    }

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, h);

    const xRange = v.xMax - v.xMin;
    const yRange = v.yMax - v.yMin;
    const { major: majorX, minor: minorX } = pickGridStep(xRange);
    const { major: majorY, minor: minorY } = pickGridStep(yRange);

    const xMinorStart = Math.ceil(v.xMin / minorX) * minorX;
    const xMajorStart = Math.ceil(v.xMin / majorX) * majorX;
    const yMinorStart = Math.ceil(v.yMin / minorY) * minorY;
    const yMajorStart = Math.ceil(v.yMin / majorY) * majorY;

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#334155';
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    for (let x = xMinorStart; x <= v.xMax; x += minorX) {
      const { x: sx } = worldToScreen(x, 0, w, h, v);
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
    }
    for (let y = yMinorStart; y <= v.yMax; y += minorY) {
      const { y: sy } = worldToScreen(0, y, w, h, v);
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.lineWidth = 1;
    ctx.strokeStyle = '#475569';
    ctx.beginPath();
    for (let x = xMajorStart; x <= v.xMax; x += majorX) {
      const { x: sx } = worldToScreen(x, 0, w, h, v);
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
    }
    for (let y = yMajorStart; y <= v.yMax; y += majorY) {
      const { y: sy } = worldToScreen(0, y, w, h, v);
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
    }
    ctx.stroke();

    const origin = worldToScreen(0, 0, w, h, v);
    const axisY = Math.max(0, Math.min(h, origin.y));
    const axisX = Math.max(0, Math.min(w, origin.x));

    ctx.lineWidth = 2;
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(0, axisY);
    ctx.lineTo(w, axisY);
    ctx.moveTo(axisX, 0);
    ctx.lineTo(axisX, h);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "JetBrains Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let x = xMajorStart; x <= v.xMax; x += majorX) {
      if (Math.abs(x) < majorX / 100) continue;
      const { x: sx } = worldToScreen(x, 0, w, h, v);
      const labelY = Math.min(h - 14, Math.max(2, axisY + 4));
      ctx.fillText(formatNumber(x, majorX), sx, labelY);
    }
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = yMajorStart; y <= v.yMax; y += majorY) {
      if (Math.abs(y) < majorY / 100) continue;
      const { y: sy } = worldToScreen(0, y, w, h, v);
      const labelX = Math.max(20, Math.min(w - 2, axisX - 4));
      ctx.fillText(formatNumber(y, majorY), labelX, sy);
    }

    ctx.fillStyle = '#e2e8f0';
    ctx.font = 'bold 10px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('x', w - 10, Math.min(h - 4, Math.max(12, axisY - 4)));
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('y', Math.min(w - 10, Math.max(4, axisX + 4)), 4);

    const visibleCurves = curvesRef.current.filter((c) => c.evaluator);
    for (const curve of visibleCurves) {
      if (!curve.evaluator) continue;
      const alpha = curve.visible ? curve.opacityAnim : 1 - curve.opacityAnim;
      if (alpha <= 0.01) continue;

      const gradient = ctx.createLinearGradient(0, 0, w, 0);
      const startRgb = hexToRgb(curve.color);
      const endRgb = hexToRgb(curve.colorEnd);
      gradient.addColorStop(0, `rgba(${startRgb.r},${startRgb.g},${startRgb.b},${alpha})`);
      gradient.addColorStop(1, `rgba(${endRgb.r},${endRgb.g},${endRgb.b},${alpha})`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.beginPath();

      const samples = w * 2;
      let started = false;
      let prevY = 0;
      for (let i = 0; i <= samples; i++) {
        const wx = v.xMin + (xRange * i) / samples;
        let wy: number;
        try {
          wy = curve.evaluator(wx);
        } catch {
          wy = NaN;
        }
        if (!isFinite(wy)) {
          started = false;
          continue;
        }
        const { x: sx, y: sy } = worldToScreen(wx, wy, w, h, v);
        if (sy < -1e6 || sy > h + 1e6) {
          started = false;
          continue;
        }
        if (started) {
          const dy = Math.abs(sy - prevY);
          if (dy > h * 10) {
            ctx.moveTo(sx, sy);
          } else {
            ctx.lineTo(sx, sy);
          }
        } else {
          ctx.moveTo(sx, sy);
          started = true;
        }
        prevY = sy;
      }
      ctx.stroke();
    }

    legendClickableRef.current = [];
    const legendPad = 10;
    const legendX = 14;
    const legendY = 14;
    const visibleForLegend = curvesRef.current;
    if (visibleForLegend.length > 0) {
      const itemH = 22;
      const maxTextW = Math.max(
        ...visibleForLegend.map((c) => {
          ctx.font = '12px "JetBrains Mono", monospace';
          return ctx.measureText(c.expression || '(空)').width;
        }),
        80
      );
      const legendW = 16 + maxTextW + 8 + 12;
      const legendH = visibleForLegend.length * itemH + legendPad * 2 - 4;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      const rx = legendX,
        ry = legendY,
        rw = legendW,
        rh = legendH,
        r = 8;
      ctx.moveTo(rx + r, ry);
      ctx.arcTo(rx + rw, ry, rx + rw, ry + rh, r);
      ctx.arcTo(rx + rw, ry + rh, rx, ry + rh, r);
      ctx.arcTo(rx, ry + rh, rx, ry, r);
      ctx.arcTo(rx, ry, rx + rw, ry, r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      for (let i = 0; i < visibleForLegend.length; i++) {
        const c = visibleForLegend[i];
        const ix = legendX + legendPad;
        const iy = legendY + legendPad + i * itemH;
        const clickable = { id: c.id, x: legendX, y: legendY + i * itemH, w: legendW, h: itemH + 2 };
        legendClickableRef.current.push(clickable);

        const grad = ctx.createLinearGradient(ix, iy + 7, ix + 18, iy + 7);
        grad.addColorStop(0, c.color);
        grad.addColorStop(1, c.colorEnd);
        ctx.fillStyle = grad;
        ctx.globalAlpha = c.visible ? c.opacityAnim : 1 - c.opacityAnim;
        ctx.fillRect(ix, iy + 3, 18, 10);
        ctx.globalAlpha = 1;

        if (!c.visible) {
          ctx.strokeStyle = 'rgba(239,68,68,0.5)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(ix, iy + 3);
          ctx.lineTo(ix + 18, iy + 13);
          ctx.moveTo(ix + 18, iy + 3);
          ctx.lineTo(ix, iy + 13);
          ctx.stroke();
        }

        ctx.fillStyle = c.visible ? '#f1f5f9' : '#64748b';
        ctx.font = '12px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = c.visible ? c.opacityAnim : 1 - c.opacityAnim;
        ctx.fillText(c.expression || '(空)', ix + 26, iy + 8);
        ctx.globalAlpha = 1;
      }
    }

    if (viewAnimRef.current) {
      animationRef.current = requestAnimationFrame(render);
    }
  }, [worldToScreen, onViewChange]);

  useEffect(() => {
    viewAnimRef.current = {
      start: { ...currentViewRef.current },
      target: view,
      startTime: performance.now(),
      duration: 250,
    };
    if (!animationRef.current) {
      animationRef.current = requestAnimationFrame(render);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.xMin, view.xMax, view.yMin, view.yMax]);

  useEffect(() => {
    const needsAnim = curves.some((c) => c.opacityAnim !== (c.visible ? 1 : 0));
    if (needsAnim) {
      const start = performance.now();
      const dur = 200;
      const targetOpc = curves.map((c) => (c.visible ? 1 : 0));
      const startOpc = curves.map((c) => c.opacityAnim);
      const tick = () => {
        const now = performance.now();
        const t = Math.min(1, (now - start) / dur);
        const e = easeOut(t);
        let anyDiff = false;
        for (let i = 0; i < curvesRef.current.length; i++) {
          const c = curvesRef.current[i];
          const newOpc = startOpc[i] + (targetOpc[i] - startOpc[i]) * e;
          if (Math.abs(newOpc - c.opacityAnim) > 0.001) {
            c.opacityAnim = newOpc;
            anyDiff = true;
          } else {
            c.opacityAnim = targetOpc[i];
          }
        }
        render();
        if (anyDiff && t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [curves.map((c) => `${c.id}:${c.visible}`).join('|')]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(render);
    const onResize = () => {
      animationRef.current = requestAnimationFrame(render);
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', onResize);
    };
  }, [render]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const v = currentViewRef.current;
      const w = rect.width;
      const h = rect.height;
      const wx = v.xMin + (mx / w) * (v.xMax - v.xMin);
      const wy = v.yMax - (my / h) * (v.yMax - v.yMin);
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const newXMin = wx - (wx - v.xMin) * factor;
      const newXMax = wx + (v.xMax - wx) * factor;
      const newYMin = wy - (wy - v.yMin) * factor;
      const newYMax = wy + (v.yMax - wy) * factor;
      const now = performance.now();
      const instant = now - lastWheelTimeRef.current < 80;
      lastWheelTimeRef.current = now;
      if (instant) {
        const nv = { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax };
        currentViewRef.current = nv;
        onViewChange(nv);
        animationRef.current = requestAnimationFrame(render);
      } else {
        viewAnimRef.current = {
          start: { ...v },
          target: { xMin: newXMin, xMax: newXMax, yMin: newYMin, yMax: newYMax },
          startTime: performance.now(),
          duration: 200,
        };
        animationRef.current = requestAnimationFrame(render);
      }
    },
    [onViewChange, render]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      for (const item of legendClickableRef.current) {
        if (mx >= item.x && mx <= item.x + item.w && my >= item.y && my <= item.y + item.h) {
          onToggleCurve(item.id);
          return;
        }
      }
      isDraggingRef.current = true;
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        view: { ...currentViewRef.current },
      };
    },
    [onToggleCurve]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDraggingRef.current) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const sv = dragStartRef.current.view;
      const xRange = sv.xMax - sv.xMin;
      const yRange = sv.yMax - sv.yMin;
      const nv: ViewState = {
        xMin: sv.xMin - (dx / w) * xRange,
        xMax: sv.xMax - (dx / w) * xRange,
        yMin: sv.yMin + (dy / h) * yRange,
        yMax: sv.yMax + (dy / h) * yRange,
      };
      currentViewRef.current = nv;
      viewAnimRef.current = null;
      onViewChange(nv);
      animationRef.current = requestAnimationFrame(render);
    },
    [onViewChange, render]
  );

  const handleMouseUp = useCallback(() => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
    }
  }, []);

  const doExportSVG = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    const svgW = w * 2;
    const svgH = h * 2;
    const v = currentViewRef.current;
    const xRange = v.xMax - v.xMin;
    const yRange = v.yMax - v.yMin;

    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('xmlns', svgNS);
    svg.setAttribute('width', String(svgW));
    svg.setAttribute('height', String(svgH));
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('shape-rendering', 'geometricPrecision');

    const bg = document.createElementNS(svgNS, 'rect');
    bg.setAttribute('x', '0');
    bg.setAttribute('y', '0');
    bg.setAttribute('width', String(w));
    bg.setAttribute('height', String(h));
    bg.setAttribute('fill', '#1e293b');
    svg.appendChild(bg);

    const defs = document.createElementNS(svgNS, 'defs');
    const visibleCurves = curvesRef.current.filter((c) => c.evaluator && c.visible);
    for (let i = 0; i < visibleCurves.length; i++) {
      const c = visibleCurves[i];
      const lg = document.createElementNS(svgNS, 'linearGradient');
      lg.setAttribute('id', `grad-${i}`);
      lg.setAttribute('x1', '0');
      lg.setAttribute('y1', '0');
      lg.setAttribute('x2', '1');
      lg.setAttribute('y2', '0');
      const s1 = document.createElementNS(svgNS, 'stop');
      s1.setAttribute('offset', '0%');
      s1.setAttribute('stop-color', c.color);
      const s2 = document.createElementNS(svgNS, 'stop');
      s2.setAttribute('offset', '100%');
      s2.setAttribute('stop-color', c.colorEnd);
      lg.appendChild(s1);
      lg.appendChild(s2);
      defs.appendChild(lg);
    }
    svg.appendChild(defs);

    const ws = (wx: number) => ((wx - v.xMin) / xRange) * w;
    const hs = (wy: number) => h - ((wy - v.yMin) / yRange) * h;

    const { major: majorX, minor: minorX } = pickGridStep(xRange);
    const { major: majorY, minor: minorY } = pickGridStep(yRange);

    const minorG = document.createElementNS(svgNS, 'g');
    minorG.setAttribute('stroke', '#334155');
    minorG.setAttribute('stroke-width', '1');
    minorG.setAttribute('stroke-dasharray', '2,4');
    for (let x = Math.ceil(v.xMin / minorX) * minorX; x <= v.xMax; x += minorX) {
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', String(ws(x)));
      line.setAttribute('y1', '0');
      line.setAttribute('x2', String(ws(x)));
      line.setAttribute('y2', String(h));
      minorG.appendChild(line);
    }
    for (let y = Math.ceil(v.yMin / minorY) * minorY; y <= v.yMax; y += minorY) {
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', String(hs(y)));
      line.setAttribute('x2', String(w));
      line.setAttribute('y2', String(hs(y)));
      minorG.appendChild(line);
    }
    svg.appendChild(minorG);

    const majorG = document.createElementNS(svgNS, 'g');
    majorG.setAttribute('stroke', '#475569');
    majorG.setAttribute('stroke-width', '1');
    for (let x = Math.ceil(v.xMin / majorX) * majorX; x <= v.xMax; x += majorX) {
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', String(ws(x)));
      line.setAttribute('y1', '0');
      line.setAttribute('x2', String(ws(x)));
      line.setAttribute('y2', String(h));
      majorG.appendChild(line);
    }
    for (let y = Math.ceil(v.yMin / majorY) * majorY; y <= v.yMax; y += majorY) {
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('x1', '0');
      line.setAttribute('y1', String(hs(y)));
      line.setAttribute('x2', String(w));
      line.setAttribute('y2', String(hs(y)));
      majorG.appendChild(line);
    }
    svg.appendChild(majorG);

    const axes = document.createElementNS(svgNS, 'g');
    axes.setAttribute('stroke', '#e2e8f0');
    axes.setAttribute('stroke-width', '2');
    const ox = Math.max(0, Math.min(w, ws(0)));
    const oy = Math.max(0, Math.min(h, hs(0)));
    const ax1 = document.createElementNS(svgNS, 'line');
    ax1.setAttribute('x1', '0');
    ax1.setAttribute('y1', String(oy));
    ax1.setAttribute('x2', String(w));
    ax1.setAttribute('y2', String(oy));
    axes.appendChild(ax1);
    const ax2 = document.createElementNS(svgNS, 'line');
    ax2.setAttribute('x1', String(ox));
    ax2.setAttribute('y1', '0');
    ax2.setAttribute('x2', String(ox));
    ax2.setAttribute('y2', String(h));
    axes.appendChild(ax2);
    svg.appendChild(axes);

    const labels = document.createElementNS(svgNS, 'g');
    labels.setAttribute('fill', '#94a3b8');
    labels.setAttribute('font-family', '"JetBrains Mono", ui-monospace, monospace');
    labels.setAttribute('font-size', '11');
    for (let x = Math.ceil(v.xMin / majorX) * majorX; x <= v.xMax; x += majorX) {
      if (Math.abs(x) < majorX / 100) continue;
      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', String(ws(x)));
      t.setAttribute('y', String(Math.min(h - 4, Math.max(14, oy + 14))));
      t.setAttribute('text-anchor', 'middle');
      t.textContent = formatNumber(x, majorX);
      labels.appendChild(t);
    }
    for (let y = Math.ceil(v.yMin / majorY) * majorY; y <= v.yMax; y += majorY) {
      if (Math.abs(y) < majorY / 100) continue;
      const t = document.createElementNS(svgNS, 'text');
      t.setAttribute('x', String(Math.max(18, Math.min(w - 2, ox - 4))));
      t.setAttribute('y', String(hs(y) + 4));
      t.setAttribute('text-anchor', 'end');
      t.textContent = formatNumber(y, majorY);
      labels.appendChild(t);
    }
    svg.appendChild(labels);

    const curvesG = document.createElementNS(svgNS, 'g');
    curvesG.setAttribute('fill', 'none');
    curvesG.setAttribute('stroke-width', '2.2');
    curvesG.setAttribute('stroke-linejoin', 'round');
    curvesG.setAttribute('stroke-linecap', 'round');
    for (let i = 0; i < visibleCurves.length; i++) {
      const c = visibleCurves[i];
      if (!c.evaluator) continue;
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('stroke', `url(#grad-${i})`);
      const samples = w * 2;
      let d = '';
      let started = false;
      for (let j = 0; j <= samples; j++) {
        const wx = v.xMin + (xRange * j) / samples;
        let wy: number;
        try {
          wy = c.evaluator(wx);
        } catch {
          wy = NaN;
        }
        if (!isFinite(wy)) {
          started = false;
          continue;
        }
        const sx = ws(wx);
        const sy = hs(wy);
        if (!started) {
          d += `M${sx.toFixed(3)},${sy.toFixed(3)} `;
          started = true;
        } else {
          d += `L${sx.toFixed(3)},${sy.toFixed(3)} `;
        }
      }
      path.setAttribute('d', d.trim());
      curvesG.appendChild(path);
    }
    svg.appendChild(curvesG);

    if (curvesRef.current.length > 0) {
      const legendG = document.createElementNS(svgNS, 'g');
      const lx = 14,
        ly = 14,
        lpad = 10,
        ih = 22;
      const box = document.createElementNS(svgNS, 'rect');
      const lh = curvesRef.current.length * ih + lpad * 2 - 4;
      let tw = 120;
      for (const c of curvesRef.current) {
        tw = Math.max(tw, c.expression.length * 7.2);
      }
      const lw = 16 + tw + 8 + 12;
      box.setAttribute('x', String(lx));
      box.setAttribute('y', String(ly));
      box.setAttribute('width', String(lw));
      box.setAttribute('height', String(lh));
      box.setAttribute('rx', '8');
      box.setAttribute('fill', 'rgba(15, 23, 42, 0.88)');
      box.setAttribute('stroke', 'rgba(148, 163, 184, 0.12)');
      box.setAttribute('stroke-width', '1');
      legendG.appendChild(box);
      for (let i = 0; i < curvesRef.current.length; i++) {
        const c = curvesRef.current[i];
        const iy = ly + lpad + i * ih;
        const rect = document.createElementNS(svgNS, 'rect');
        rect.setAttribute('x', String(lx + lpad));
        rect.setAttribute('y', String(iy + 3));
        rect.setAttribute('width', '18');
        rect.setAttribute('height', '10');
        rect.setAttribute('fill', c.color);
        if (!c.visible) rect.setAttribute('opacity', '0.25');
        legendG.appendChild(rect);
        const t = document.createElementNS(svgNS, 'text');
        t.setAttribute('x', String(lx + lpad + 26));
        t.setAttribute('y', String(iy + 12));
        t.setAttribute('font-family', '"JetBrains Mono", monospace');
        t.setAttribute('font-size', '12');
        t.setAttribute('fill', c.visible ? '#f1f5f9' : '#64748b');
        if (!c.visible) t.setAttribute('opacity', '0.5');
        t.textContent = c.expression || '(空)';
        legendG.appendChild(t);
      }
      svg.appendChild(legendG);
    }

    const svgStr = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `funcvis-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, []);

  return (
    <div ref={containerRef} className="canvas-wrap">
      <canvas
        ref={canvasRef}
        className={isDragging ? 'dragging' : ''}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      />
      <div className="canvas-hint">
        <kbd>滚轮</kbd>缩放 · <kbd>拖拽</kbd>平移 · <kbd>点击图例</kbd>切换
      </div>
    </div>
  );
});
