import { useRef, useEffect, useState, useCallback, memo } from 'react';
import html2canvas from 'html2canvas';
import { PoemLine } from '../types';
import './CanvasPreview.css';

interface CanvasPreviewProps {
  poemLines: PoemLine[];
  fontFamily: string;
  backgroundColors: string[];
  noiseIntensity: number;
  particleEnabled: boolean;
  onLinePositionChange: (id: string, x: number, y: number) => void;
  isExporting: boolean;
  onExportComplete: () => void;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
}

const CanvasPreview = memo(function CanvasPreview({
  poemLines,
  fontFamily,
  backgroundColors,
  noiseIntensity,
  particleEnabled,
  onLinePositionChange,
  isExporting,
  onExportComplete,
}: CanvasPreviewProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0, lineX: 0, lineY: 0 });

  const initParticles = useCallback(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * 600,
        y: Math.random() * 800,
        size: 2 + Math.random() * 4,
        speedX: (Math.random() - 0.5) * 1,
        speedY: (Math.random() - 0.5) * 1,
        opacity: 0.1 + Math.random() * 0.3,
      });
    }
    particlesRef.current = particles;
  }, []);

  const updateParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const particles = particlesRef.current;
    for (const p of particles) {
      p.x += p.speedX * 0.5;
      p.y += p.speedY * 0.5;

      if (p.x < 0) p.x = 600;
      if (p.x > 600) p.x = 0;
      if (p.y < 0) p.y = 800;
      if (p.y > 800) p.y = 0;
    }

    const particleElements = canvas.querySelectorAll('.particle-dot');
    particleElements.forEach((el, index) => {
      const p = particles[index];
      if (p) {
        (el as HTMLElement).style.transform = `translate(${p.x}px, ${p.y}px)`;
        (el as HTMLElement).style.opacity = String(p.opacity);
      }
    });

    animationRef.current = requestAnimationFrame(updateParticles);
  }, []);

  useEffect(() => {
    if (particleEnabled) {
      initParticles();
      animationRef.current = requestAnimationFrame(updateParticles);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particleEnabled, initParticles, updateParticles]);

  useEffect(() => {
    if (isExporting && canvasRef.current) {
      const timer = setTimeout(() => {
        handleExport();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isExporting]);

  const handleExport = async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `一页诗画_${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        onExportComplete();
      }, 'image/png');
    } catch (error) {
      console.error('导出失败:', error);
      onExportComplete();
    }
  };

  const handleMouseDown = (e: React.MouseEvent, line: PoemLine) => {
    e.preventDefault();
    setDraggingId(line.id);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      lineX: line.x,
      lineY: line.y,
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!draggingId || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const dx = ((e.clientX - dragStartRef.current.x) / rect.width) * 100;
      const dy = ((e.clientY - dragStartRef.current.y) / rect.height) * 100;

      const newX = Math.max(0, Math.min(100, dragStartRef.current.lineX + dx));
      const newY = Math.max(0, Math.min(100, dragStartRef.current.lineY + dy));

      onLinePositionChange(draggingId, newX, newY);
    },
    [draggingId, onLinePositionChange]
  );

  const handleMouseUp = useCallback(() => {
    setDraggingId(null);
  }, []);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingId, handleMouseMove, handleMouseUp]);

  const canvasStyle = {
    '--bg-color-1': backgroundColors[0],
    '--bg-color-2': backgroundColors[1] || backgroundColors[0],
    background: 'linear-gradient(135deg, var(--bg-color-1) 0%, var(--bg-color-2) 100%)',
  } as React.CSSProperties;

  return (
    <div className="canvas-wrapper">
      <div
        ref={canvasRef}
        className="poster-canvas"
        style={canvasStyle}
      >
        {noiseIntensity > 0 && (
          <div
            className="noise-overlay"
            style={{ opacity: noiseIntensity * 0.3 }}
          />
        )}

        {particleEnabled && (
          <div className="particles-container">
            {particlesRef.current.map((particle, index) => (
              <div
                key={index}
                className="particle-dot"
                style={{
                  width: `${particle.size}px`,
                  height: `${particle.size}px`,
                  transform: `translate(${particle.x}px, ${particle.y}px)`,
                  opacity: particle.opacity,
                }}
              />
            ))}
          </div>
        )}

        {poemLines.map((line) => (
          <div
            key={line.id}
            className={`poem-line ${draggingId === line.id ? 'dragging' : ''}`}
            style={{
              left: `${line.x}%`,
              top: `${line.y}%`,
              fontFamily: fontFamily,
              cursor: draggingId === line.id ? 'move' : 'grab',
            }}
            onMouseDown={(e) => handleMouseDown(e, line)}
          >
            {line.text}
          </div>
        ))}
      </div>
    </div>
  );
});

export default CanvasPreview;
