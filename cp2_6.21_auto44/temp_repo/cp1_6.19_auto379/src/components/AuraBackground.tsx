import { useEffect, useRef } from 'react';
import { AuraCanvas } from '../core/auraCanvas';
import { getScrollBasedColor } from '../utils/colorEngine';
import { useAuraStore } from '../store/store';

export function AuraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const auraCanvasRef = useRef<AuraCanvas | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastScrollYRef = useRef<number>(-1);
  const setAuraColor = useAuraStore((s) => s.setAuraColor);
  const auraColor = useAuraStore((s) => s.auraColor);
  const locked = useAuraStore((s) => s.locked);

  useEffect(() => {
    if (!canvasRef.current) return;

    const auraCanvas = new AuraCanvas(canvasRef.current);
    auraCanvasRef.current = auraCanvas;
    auraCanvas.start();

    const initialColor = getScrollBasedColor(
      window.scrollY,
      window.innerHeight,
      document.documentElement.scrollHeight,
    );
    auraCanvas.setColors(initialColor);
    setAuraColor(initialColor);

    const handleScroll = () => {
      if (rafIdRef.current !== null) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const currentScrollY = window.scrollY;
        if (currentScrollY === lastScrollYRef.current) return;
        lastScrollYRef.current = currentScrollY;
        if (!locked) {
          const color = getScrollBasedColor(
            currentScrollY,
            window.innerHeight,
            document.documentElement.scrollHeight,
          );
          auraCanvasRef.current?.setColors(color);
          setAuraColor(color);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      auraCanvas.destroy();
      auraCanvasRef.current = null;
    };
  }, [locked, setAuraColor]);

  useEffect(() => {
    if (auraColor && auraCanvasRef.current) {
      auraCanvasRef.current.setColors(auraColor);
    }
  }, [auraColor]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
