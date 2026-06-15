import { memo, CSSProperties, useEffect, useRef } from 'react';
import type { CanvasElement, PresetElement } from '@/types';

interface Props {
  element: CanvasElement;
  preset: PresetElement | undefined;
  selected: boolean;
  viewportScale: number;
  onClick: () => void;
  onDragStart: (e: React.PointerEvent) => void;
  dragging: boolean;
}

function CanvasElementViewInner({
  element,
  preset,
  selected,
  viewportScale,
  onClick,
  onDragStart,
  dragging,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty('--ex', '0px');
      ref.current.style.setProperty('--ey', '0px');
      ref.current.style.setProperty('--er', `${element.rotation}deg`);
      ref.current.style.setProperty(
        '--final-opacity',
        element.visible ? '1' : '0'
      );
    }
  }, [element.rotation, element.visible]);

  if (!preset) return null;

  const glitchVar = element.glitchIntensity / 100;

  const baseTransform = `translate3d(${element.x}px, ${element.y}px, 0) rotate(${element.rotation}deg)`;

  const glowIntensity = 4 + element.glitchIntensity / 12;
  const colorWithAlpha = (hex: string, alpha: number) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  const style: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: element.width,
    height: element.height,
    transform: baseTransform,
    transformOrigin: 'center center',
    willChange: 'transform, opacity',
    opacity: element.visible ? (element.isFlashing ? undefined : 1) : 0,
    visibility: element.visible || element.isFlashing ? 'visible' : 'hidden',
    transition: dragging
      ? 'none'
      : 'transform 0.05s linear, opacity 0.2s ease',
    pointerEvents: element.visible ? 'auto' : 'none',
    zIndex: element.zIndex,
    filter: `drop-shadow(0 0 ${glowIntensity}px ${colorWithAlpha(
      element.color,
      0.55 + glitchVar * 0.2
    )})`,
    cursor: dragging ? 'grabbing' : 'grab',
  };

  const classNames = [
    element.isNew ? 'element-new' : '',
    element.isGlitching ? 'element-glitching' : '',
    element.isFlashing ? 'element-flashing' : '',
    selected ? 'selected-outline' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      ref={ref}
      className={classNames}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onDragStart(e);
      }}
    >
      {element.glitchIntensity > 0 && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translate3d(${glitchVar * 3}px, ${-glitchVar}px, 0)`,
            opacity: glitchVar * 0.55,
            color: '#ff2d95',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            width="100%"
            height="100%"
            dangerouslySetInnerHTML={{ __html: preset.svgContent }}
          />
        </div>
      )}
      {element.glitchIntensity > 0 && (
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translate3d(${-glitchVar * 3}px, ${glitchVar}px, 0)`,
            opacity: glitchVar * 0.55,
            color: '#00f0ff',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }}
        >
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            width="100%"
            height="100%"
            dangerouslySetInnerHTML={{ __html: preset.svgContent }}
          />
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          color: element.color,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          dangerouslySetInnerHTML={{ __html: preset.svgContent }}
        />
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
