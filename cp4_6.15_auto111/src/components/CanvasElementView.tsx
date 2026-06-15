import { memo, CSSProperties, useEffect, useRef } from 'react';
import type { CanvasElement, PresetElement } from '@/types';

interface Props {
  element: CanvasElement;
  preset: PresetElement | undefined;
  selected: boolean;
  viewportScale: number;
  onClick: (e: React.PointerEvent | React.MouseEvent) => void;
  onDragStart: (e: React.PointerEvent) => void;
  dragging: boolean;
}

const GLITCH_SLICES = 5;

function CanvasElementViewInner({
  element,
  preset,
  selected,
  onClick,
  onDragStart,
  dragging,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (wrapperRef.current) {
      wrapperRef.current.style.setProperty(
        '--final-opacity',
        element.visible ? '1' : '0'
      );
    }
  }, [element.visible]);

  useEffect(() => {
    const hasGlitch = element.glitchIntensity > 0 || element.isGlitching;
    if (!hasGlitch) {
      const el = wrapperRef.current;
      if (el) {
        el.style.setProperty('--glitch-mx', '0px');
        el.style.setProperty('--glitch-my', '0px');
        el.style.setProperty('--glitch-cx', '0px');
        el.style.setProperty('--glitch-cy', '0px');
        el.style.setProperty('--glitch-ghost-opacity', '0');
        el.style.setProperty('--glitch-jx', '0px');
        el.style.setProperty('--glitch-jy', '0px');
        el.style.setProperty('--glitch-brightness', '1');
        for (let i = 0; i < GLITCH_SLICES; i++) {
          el.style.setProperty(`--slice-dx-${i}`, '0px');
        }
      }
      return;
    }

    const g = element.glitchIntensity / 100;
    let running = true;
    let time = 0;
    let lastTs = 0;

    const tick = (ts: number) => {
      if (!running || !wrapperRef.current) return;
      const dt = lastTs ? (ts - lastTs) / 1000 : 0;
      lastTs = ts;
      time += dt;
      const el = wrapperRef.current;
      const t = time;
      const shaking = element.isGlitching;
      const sm = shaking ? 2.5 : 1;

      const mx =
        (Math.sin(t * 13.7) * g * 4 + Math.sin(t * 41.3) * g * 1.5) * sm;
      const my = Math.cos(t * 10.1) * g * 2 * sm;
      const cx =
        (Math.sin(t * 17.3 + 2) * g * 4 + Math.cos(t * 37.7) * g * 1.5) *
        sm;
      const cy = Math.cos(t * 12.9 + 1) * g * 2 * sm;
      el.style.setProperty('--glitch-mx', `${mx.toFixed(2)}px`);
      el.style.setProperty('--glitch-my', `${my.toFixed(2)}px`);
      el.style.setProperty('--glitch-cx', `${cx.toFixed(2)}px`);
      el.style.setProperty('--glitch-cy', `${cy.toFixed(2)}px`);

      const ghostOpacity = g * 0.32 + Math.sin(t * 22) * g * 0.1;
      el.style.setProperty('--glitch-ghost-opacity', ghostOpacity.toFixed(3));

      const jx = shaking ? Math.sin(t * 55) * 4 + Math.cos(t * 73) * 2 : 0;
      const jy = shaking ? Math.cos(t * 47) * 3 + Math.sin(t * 61) * 1.5 : 0;
      el.style.setProperty('--glitch-jx', `${jx.toFixed(2)}px`);
      el.style.setProperty('--glitch-jy', `${jy.toFixed(2)}px`);

      const brightness = shaking ? 1 + Math.sin(t * 40) * 0.35 : 1;
      el.style.setProperty('--glitch-brightness', brightness.toFixed(3));

      for (let i = 0; i < GLITCH_SLICES; i++) {
        const dx =
          Math.sin(t * (18 + i * 7.3) + i * 2.1) * g * 10 * sm;
        el.style.setProperty(`--slice-dx-${i}`, `${dx.toFixed(2)}px`);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [element.glitchIntensity, element.isGlitching]);

  if (!preset) return null;

  const glitchVar = element.glitchIntensity / 100;
  const posTransform = `translate3d(${element.x}px, ${element.y}px, 0) rotate(${element.rotation}deg)`;
  const glowIntensity = 4 + element.glitchIntensity / 12;

  const colorWithAlpha = (hex: string, alpha: number) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const renderSvg = () => (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      width="100%"
      height="100%"
      dangerouslySetInnerHTML={{ __html: preset.svgContent }}
    />
  );

  const wrapperClassNames = [selected ? 'selected-outline' : '']
    .filter(Boolean)
    .join(' ');

  const wrapperStyle: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: element.width,
    height: element.height,
    transform: posTransform,
    transformOrigin: 'center center',
    willChange: 'transform, opacity',
    opacity: element.visible ? (element.isFlashing ? undefined : 1) : 0,
    visibility: element.visible || element.isFlashing ? 'visible' : 'hidden',
    transition: dragging ? 'none' : 'opacity 0.2s ease',
    pointerEvents: element.visible ? 'auto' : 'none',
    zIndex: element.zIndex,
    cursor: dragging ? 'grabbing' : 'grab',
    borderRadius: 2,
  };

  const contentClassNames = [
    'element-content',
    element.isNew ? 'element-new' : '',
    element.isGlitching ? 'element-glitching' : '',
    element.isFlashing ? 'element-flashing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const contentStyle: CSSProperties = {
    position: 'absolute',
    inset: 0,
    filter: `drop-shadow(0 0 ${glowIntensity}px ${colorWithAlpha(
      element.color,
      0.55 + glitchVar * 0.2
    )}) brightness(var(--glitch-brightness, 1))`,
    willChange: 'clip-path',
  };

  return (
    <div
      ref={wrapperRef}
      className={wrapperClassNames}
      style={wrapperStyle}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onDragStart(e);
      }}
    >
      <div className={contentClassNames} style={contentStyle}>
        {element.glitchIntensity > 0 && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              color: element.color,
              opacity: 'var(--glitch-ghost-opacity, 0)',
              filter: `blur(${2 + glitchVar * 4}px) brightness(1.5)`,
              transform:
                'translate3d(var(--glitch-jx, 0), var(--glitch-jy, 0), 0)',
              pointerEvents: 'none',
              mixBlendMode: 'screen',
            }}
          >
            {renderSvg()}
          </div>
        )}

        {element.glitchIntensity > 0 && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              color: '#ff2d95',
              mixBlendMode: 'screen',
              pointerEvents: 'none',
              opacity: 0.4 + glitchVar * 0.4,
              transform:
                'translate3d(var(--glitch-mx, 0), var(--glitch-my, 0), 0)',
              filter: `drop-shadow(0 0 ${glowIntensity * 0.6}px rgba(255,45,149,${0.35 + glitchVar * 0.3}))`,
            }}
          >
            {renderSvg()}
          </div>
        )}

        {element.glitchIntensity > 0 && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              color: '#00f0ff',
              mixBlendMode: 'screen',
              pointerEvents: 'none',
              opacity: 0.4 + glitchVar * 0.4,
              transform:
                'translate3d(var(--glitch-cx, 0), var(--glitch-cy, 0), 0)',
              filter: `drop-shadow(0 0 ${glowIntensity * 0.6}px rgba(0,240,255,${0.35 + glitchVar * 0.3}))`,
            }}
          >
            {renderSvg()}
          </div>
        )}

        {element.glitchIntensity > 25 &&
          Array.from({ length: GLITCH_SLICES }, (_, i) => {
            const topPct = (i / GLITCH_SLICES) * 100;
            const bottomPct =
              100 - ((i + 1) / GLITCH_SLICES) * 100;
            return (
              <div
                key={`slice-${i}`}
                aria-hidden
                style={{
                  position: 'absolute',
                  inset: 0,
                  clipPath: `inset(${topPct.toFixed(1)}% 0 ${bottomPct.toFixed(1)}% 0)`,
                  transform: `translateX(var(--slice-dx-${i}, 0))`,
                  color: element.color,
                  pointerEvents: 'none',
                  opacity: 0.6 + glitchVar * 0.3,
                }}
              >
                {renderSvg()}
              </div>
            );
          })}

        <div
          style={{
            position: 'absolute',
            inset: 0,
            color: element.color,
          }}
        >
          {renderSvg()}
        </div>

        {element.glitchIntensity > 50 && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background: `repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,240,255,${glitchVar * 0.06}) 2px, rgba(255,45,149,${glitchVar * 0.04}) 4px, transparent 4px, transparent 6px)`,
              pointerEvents: 'none',
              mixBlendMode: 'overlay',
            }}
          />
        )}
      </div>

      {selected && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: -8,
            top: -8,
            right: -8,
            bottom: -8,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}

export const CanvasElementView = memo(CanvasElementViewInner, (prev, next) => {
  return (
    prev.element === next.element &&
    prev.preset === next.preset &&
    prev.selected === next.selected &&
    prev.viewportScale === next.viewportScale &&
    prev.dragging === next.dragging
  );
});

export default CanvasElementView;
