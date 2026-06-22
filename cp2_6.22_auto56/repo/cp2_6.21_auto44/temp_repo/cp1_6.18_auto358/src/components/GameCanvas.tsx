import { useEffect, useRef } from 'react';
import { useGameStore } from '@/game/GameMaster';
import type { Lens, Point } from '@/game/types';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const dragRef = useRef<{ lens: Lens | null; offset: Point; fromSidebar: boolean }>({
    lens: null,
    offset: { x: 0, y: 0 },
    fromSidebar: false,
  });
  const sizeRef = useRef({ width: 0, height: 0 });

  const levelData = useGameStore(s => s.levelData);
  const placedLenses = useGameStore(s => s.placedLenses);
  const availableLenses = useGameStore(s => s.availableLenses);
  const beamPath = useGameStore(s => s.beamPath);
  const particles = useGameStore(s => s.particles);
  const fireworks = useGameStore(s => s.fireworks);
  const selectedLensId = useGameStore(s => s.selectedLensId);
  const placeLens = useGameStore(s => s.placeLens);
  const rotateLens = useGameStore(s => s.rotateLens);
  const selectLens = useGameStore(s => s.selectLens);
  const updateParticles = useGameStore(s => s.updateParticles);
  const recalculateBeam = useGameStore(s => s.recalculateBeam);
  const levelComplete = useGameStore(s => s.levelComplete);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = window.devicePixelRatio || 1;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      sizeRef.current = { width: w, height: h };
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      recalculateBeam(w, h);
    };

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    resize();

    return () => ro.disconnect();
  }, [recalculateBeam]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const { width, height } = sizeRef.current;
      ctx.clearRect(0, 0, width, height);

      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, '#0a0a1a');
      bg.addColorStop(1, '#1a1a2e');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.3, width / 2, height / 2, Math.max(width, height) * 0.7);
      vignette.addColorStop(0, 'rgba(30, 30, 60, 0)');
      vignette.addColorStop(1, 'rgba(10, 10, 26, 0.8)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      if (!levelData) {
        frameRef.current = requestAnimationFrame(draw);
        return;
      }

      levelData.mirrors.forEach(m => {
        ctx.save();
        ctx.translate(m.position.x, m.position.y);
        ctx.rotate((m.angle * Math.PI) / 180);
        ctx.strokeStyle = '#9e9e9e';
        ctx.lineWidth = 3;
        ctx.shadowColor = 'rgba(255,255,255,0.3)';
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.moveTo(-m.length / 2, 0);
        ctx.lineTo(m.length / 2, 0);
        ctx.stroke();
        ctx.restore();
      });

      levelData.prisms.forEach(p => {
        ctx.save();
        ctx.translate(p.position.x, p.position.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        const s = p.sideLength;
        const h = (s * Math.sqrt(3)) / 2;
        const grad = ctx.createLinearGradient(-s / 2, h / 3, s / 2, -h * 2 / 3);
        grad.addColorStop(0, 'rgba(255, 0, 0, 0.3)');
        grad.addColorStop(0.5, 'rgba(0, 255, 0, 0.3)');
        grad.addColorStop(1, 'rgba(0, 0, 255, 0.3)');
        ctx.fillStyle = grad;
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -h * 2 / 3);
        ctx.lineTo(-s / 2, h / 3);
        ctx.lineTo(s / 2, h / 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });

      levelData.attenuators.forEach(a => {
        const grad = ctx.createRadialGradient(a.position.x, a.position.y, 0, a.position.x, a.position.y, a.radius);
        grad.addColorStop(0, 'rgba(255, 50, 50, 0.4)');
        grad.addColorStop(1, 'rgba(255, 50, 50, 0.05)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(a.position.x, a.position.y, a.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 80, 80, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      const target = levelData.target;
      const t = Date.now() / 1000;
      let targetColor = '#FFD700';
      let blinkAlpha = 1;
      if (levelComplete) {
        blinkAlpha = 0.5 + 0.5 * Math.sin(t * Math.PI * 4);
        targetColor = '#00FF00';
      } else if (target.hit) {
        blinkAlpha = 0.5 + 0.5 * Math.sin(t * Math.PI * 4);
        targetColor = '#00FF00';
      }
      ctx.save();
      ctx.translate(target.position.x, target.position.y);
      ctx.shadowColor = targetColor;
      ctx.shadowBlur = 20 * blinkAlpha;
      ctx.fillStyle = targetColor;
      ctx.globalAlpha = 0.4 + 0.6 * blinkAlpha;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI / 3) * i - Math.PI / 2;
        const x = Math.cos(a) * target.radius;
        const y = Math.sin(a) * target.radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      beamPath.forEach(seg => {
        ctx.save();
        ctx.shadowColor = seg.color;
        ctx.shadowBlur = 15;
        const grad = ctx.createLinearGradient(seg.start.x, seg.start.y, seg.end.x, seg.end.y);
        grad.addColorStop(0, '#FF4500');
        grad.addColorStop(1, '#8A2BE2');
        ctx.strokeStyle = grad;
        ctx.globalAlpha = seg.energy;
        ctx.lineWidth = seg.width;
        ctx.beginPath();
        ctx.moveTo(seg.start.x, seg.start.y);
        ctx.lineTo(seg.end.x, seg.end.y);
        ctx.stroke();
        ctx.restore();
      });

      particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      placedLenses.forEach(lens => {
        const selected = lens.id === selectedLensId;
        drawLens(ctx, lens, selected);
        if (selected) {
          ctx.save();
          ctx.fillStyle = '#ffffff';
          ctx.font = '12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`${Math.round(lens.angle)}°`, lens.position.x, lens.position.y - lens.radius - 8);
          ctx.restore();
        }
      });

      if (dragRef.current.lens && dragRef.current.fromSidebar) {
        drawLens(ctx, dragRef.current.lens, true);
      }

      fireworks.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      updateParticles();
      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [levelData, placedLenses, beamPath, particles, fireworks, selectedLensId, levelComplete, updateParticles]);

  const drawLens = (ctx: CanvasRenderingContext2D, lens: Lens, selected: boolean) => {
    ctx.save();
    ctx.translate(lens.position.x, lens.position.y);
    if (selected) {
      ctx.shadowColor = '#4FC3F7';
      ctx.shadowBlur = 25;
    }
    const grad = ctx.createRadialGradient(-lens.radius * 0.3, -lens.radius * 0.3, 0, 0, 0, lens.radius);
    grad.addColorStop(0, '#4FC3F7');
    grad.addColorStop(1, '#1E88E5');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, lens.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = selected ? '#ffffff' : 'rgba(255,255,255,0.5)';
    ctx.lineWidth = selected ? 2.5 : 1.5;
    ctx.stroke();
    ctx.rotate((lens.angle * Math.PI) / 180);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-lens.radius + 4, 0);
    ctx.lineTo(lens.radius - 4, 0);
    ctx.stroke();
    ctx.restore();
  };

  const getCanvasPoint = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const pt = getCanvasPoint(e);
    for (let i = placedLenses.length - 1; i >= 0; i--) {
      const lens = placedLenses[i];
      const dx = pt.x - lens.position.x;
      const dy = pt.y - lens.position.y;
      if (dx * dx + dy * dy <= lens.radius * lens.radius) {
        selectLens(lens.id);
        dragRef.current = {
          lens: { ...lens },
          offset: { x: dx, y: dy },
          fromSidebar: false,
        };
        return;
      }
    }
    selectLens(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.lens) return;
    const pt = getCanvasPoint(e);
    dragRef.current.lens.position = {
      x: pt.x - dragRef.current.offset.x,
      y: pt.y - dragRef.current.offset.y,
    };
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const { lens, fromSidebar } = dragRef.current;
    if (!lens) return;
    if (fromSidebar) {
      const pt = getCanvasPoint(e);
      if (pt.x > 0 && pt.y > 0 && pt.x < sizeRef.current.width && pt.y < sizeRef.current.height) {
        placeLens(lens.id, pt);
      }
    }
    dragRef.current = { lens: null, offset: { x: 0, y: 0 }, fromSidebar: false };
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!selectedLensId) return;
    e.preventDefault();
    const delta = e.deltaY > 0 ? 5 : -5;
    rotateLens(selectedLensId, delta);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const lensId = e.dataTransfer.getData('lensId');
    const lens = availableLenses.find(l => l.id === lensId);
    if (!lens) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const pt = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    placeLens(lensId, pt);
  };

  return (
    <canvas
      ref={canvasRef}
      className="block w-full h-full cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
    />
  );
}
