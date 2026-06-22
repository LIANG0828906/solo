import React, { useRef, useEffect, useMemo } from 'react';
import type {
  MountStyle,
  MountParams,
  CropArea,
} from './types';
import {
  renderMountedCanvas,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from './utils/canvasRenderer';
import { useThrottleRender } from './hooks/useThrottleRender';
import { styleLabels } from './types';

interface CompareViewProps {
  originalImage: HTMLImageElement | null;
  cropArea: CropArea | null;
  styles: MountStyle[];
  params: MountParams;
}

const CompareView: React.FC<CompareViewProps> = ({
  originalImage,
  cropArea,
  styles,
  params,
}) => {
  const canvasRefs = useRef<Map<string, HTMLCanvasElement>>(new Map());

  const key = useMemo(
    () => styles.join(',') + '-' + JSON.stringify(params),
    [styles, params]
  );

  const doRenderAll = () => {
    if (!originalImage || !cropArea) return;
    styles.forEach((style) => {
      const canvas = canvasRefs.current.get(style);
      if (!canvas) return;
      renderMountedCanvas(canvas, originalImage, cropArea, style, params, false);
    });
  };

  const throttledRender = useThrottleRender(doRenderAll, 100);

  useEffect(() => {
    throttledRender();
  }, [throttledRender, originalImage, cropArea, styles, params, key]);

  if (!originalImage || !cropArea || styles.length === 0) return null;

  const cols = styles.length;

  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
  };

  return (
    <div className="compare-view" style={gridStyle}>
      {styles.map((style) => (
        <div key={style} className="compare-col">
          <div className="compare-label">{styleLabels[style]}</div>
          <canvas
            key={style + key}
            ref={(el) => {
              if (el) canvasRefs.current.set(style, el);
            }}
            className="compare-canvas"
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            style={{ width: '100%', height: 'auto', maxWidth: CANVAS_WIDTH }}
          />
        </div>
      ))}
    </div>
  );
};

export default CompareView;
