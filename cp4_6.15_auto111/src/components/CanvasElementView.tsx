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

function CanvasElementViewInner({
  element,
  preset,
  selected,
  onClick,
  onDragStart,
  dragging,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.setProperty('--er', `${element.rotation}deg`);
      ref.current.style.setProperty(
        '--final-opacity',
        element.visible ? '1' : '0'
      );
    }
  }, [element.rotation, element.visible]);

  if (!preset) return null;

  const glitchVar = element.glitchIntensity / 100;

  // 内层保持实际位置、旋转、大小
  const innerTransform = `translate3d(${element.x}px, ${element.y}px, 0) rotate(${element.rotation}deg)`;

  const glowIntensity = 4 + element.glitchIntensity / 12;
  const colorWithAlpha = (hex: string, alpha: number) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  };

  // 外层wrapper：负责实际位置/旋转/缩放 + 选中状态outline
  const wrapperClassNames = [
    selected ? 'selected-outline' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const wrapperStyle: CSSProperties = {
    position: 'absolute',
    left: 0,
    top: 0,
    width: element.width,
    height: element.height,
    transform: innerTransform,
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

  // 内容层：负责圆形clip-path入场 + glitch抖动 + 闪烁动画
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
    )})`,
    willChange: 'clip-path, transform',
  };

  return (
    <div
      ref={ref}
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
        {/* 故障残影层 1 - 品红偏移 */}
        {element.glitchIntensity > 0 && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translate3d(${glitchVar * 4}px, ${-glitchVar * 1.5}px, 0)`,
              opacity: 0.45 + glitchVar * 0.35,
              color: '#ff2d95',
              mixBlendMode: 'screen',
              pointerEvents: 'none',
              filter: `drop-shadow(0 0 ${glowIntensity * 0.7}px rgba(255,45,149,${0.4 + glitchVar * 0.25}))`,
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
        {/* 故障残影层 2 - 青蓝偏移 */}
        {element.glitchIntensity > 0 && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              transform: `translate3d(${-glitchVar * 4}px, ${glitchVar * 1.5}px, 0)`,
              opacity: 0.45 + glitchVar * 0.35,
              color: '#00f0ff',
              mixBlendMode: 'screen',
              pointerEvents: 'none',
              filter: `drop-shadow(0 0 ${glowIntensity * 0.7}px rgba(0,240,255,${0.4 + glitchVar * 0.25}))`,
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
        {/* 主图层 */}
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
        {/* 额外的水平扫描线故障条（当强度高时） */}
        {element.glitchIntensity > 50 && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background: `repeating-linear-gradient(0deg, transparent 0px, transparent 3px, rgba(0,240,255,${glitchVar * 0.08}) 3px, rgba(255,45,149,${glitchVar * 0.06}) 5px, transparent 5px, transparent 8px)`,
              pointerEvents: 'none',
              mixBlendMode: 'overlay',
            }}
          />
        )}
      </div>
      {/* 选中光晕占位（保持outline不随动画变形） */}
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
