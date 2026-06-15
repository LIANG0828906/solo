import { CanvasEngine, Point } from './canvasEngine';
import { Controls } from './controls';
import { ExportHandler } from './exportHandler';

function init(): void {
  const canvas = document.getElementById('mainCanvas') as HTMLCanvasElement | null;
  const controlsPanel = document.getElementById('controlsPanel') as HTMLElement | null;
  const toolbar = document.getElementById('toolbar') as HTMLElement | null;

  if (!canvas || !controlsPanel || !toolbar) {
    console.error('Required DOM elements not found');
    return;
  }

  const engine = new CanvasEngine(canvas);
  const controls = new Controls(controlsPanel, (params) => {
    engine.setStyle(params);
  });
  const exporter = new ExportHandler(engine);
  exporter.bindToolbar(toolbar);

  let isDrawing = false;
  let lastPoint: Point | null = null;

  const getCanvasPoint = (e: MouseEvent | Touch): Point => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      timestamp: performance.now(),
    };
  };

  const handleStart = (e: MouseEvent): void => {
    e.preventDefault();
    isDrawing = true;
    lastPoint = getCanvasPoint(e);
    engine.startStroke(lastPoint);
  };

  const handleMove = (e: MouseEvent): void => {
    if (!isDrawing || !lastPoint) return;
    const point = getCanvasPoint(e);
    engine.drawSegment(lastPoint, point);
    lastPoint = point;
  };

  const handleEnd = (): void => {
    if (!isDrawing) return;
    isDrawing = false;
    engine.endStroke();
    lastPoint = null;
    exporter.saveHistory();
  };

  canvas.addEventListener('mousedown', handleStart);
  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);

  canvas.addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      if (!touch) return;
      isDrawing = true;
      lastPoint = getCanvasPoint(touch);
      engine.startStroke(lastPoint);
    },
    { passive: false }
  );

  canvas.addEventListener(
    'touchmove',
    (e) => {
      e.preventDefault();
      if (!isDrawing || !lastPoint) return;
      const touch = e.touches[0];
      if (!touch) return;
      const point = getCanvasPoint(touch);
      engine.drawSegment(lastPoint, point);
      lastPoint = point;
    },
    { passive: false }
  );

  canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    handleEnd();
  });

  let resizeTimeout: number | null = null;
  window.addEventListener('resize', () => {
    if (resizeTimeout !== null) {
      clearTimeout(resizeTimeout);
    }
    resizeTimeout = window.setTimeout(() => {
      engine.resize();
      resizeTimeout = null;
    }, 100);
  });

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      exporter.undo();
    }
  });
}

init();
