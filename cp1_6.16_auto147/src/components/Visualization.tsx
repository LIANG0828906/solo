import { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useAppStore } from '../store';
import { PlotType } from '../utils/simulation';
import { Loader2 } from 'lucide-react';

const PLOT_COLORS: Record<PlotType, string> = {
  tree: '#2E7D32',
  grass: '#7CB342',
  water: '#29B6F6',
  pavement: '#616161',
  building: '#455A64',
};

const GRID_SIZE = 20;

export interface VisualizationRef {
  generateThumbnail: () => string;
}

export const Visualization = forwardRef<VisualizationRef>(function Visualization(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isSimulating = useAppStore((s) => s.isSimulating);
  const plots = useAppStore((s) => s.plots);
  const blockConfig = useAppStore((s) => s.blockConfig);
  const selectedPlotType = useAppStore((s) => s.selectedPlotType);
  const hoveredPlot = useAppStore((s) => s.hoveredPlot);
  const simulationResult = useAppStore((s) => s.simulationResult);
  const setPlot = useAppStore((s) => s.setPlot);
  const setHoveredPlot = useAppStore((s) => s.setHoveredPlot);

  const rows = plots.length;
  const cols = plots[0]?.length || 0;
  const canvasWidth = cols * GRID_SIZE;
  const canvasHeight = rows * GRID_SIZE;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvasWidth * dpr;
    canvas.height = canvasHeight * dpr;
    canvas.style.width = `${canvasWidth}px`;
    canvas.style.height = `${canvasHeight}px`;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#2D2D2D';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const type = plots[y][x];
        const color = PLOT_COLORS[type];

        ctx.fillStyle = color;
        ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE - 0.5, GRID_SIZE - 0.5);

        if (type === 'tree') {
          const cx = x * GRID_SIZE + GRID_SIZE / 2;
          const cy = y * GRID_SIZE + GRID_SIZE / 2;
          ctx.fillStyle = '#1B5E20';
          ctx.beginPath();
          ctx.arc(cx, cy, GRID_SIZE * 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#388E3C';
          ctx.beginPath();
          ctx.arc(cx - 2, cy - 2, GRID_SIZE * 0.25, 0, Math.PI * 2);
          ctx.fill();
        }

        if (type === 'water') {
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.lineWidth = 1;
          const wy = y * GRID_SIZE + GRID_SIZE * 0.5;
          ctx.beginPath();
          ctx.moveTo(x * GRID_SIZE + 2, wy);
          ctx.quadraticCurveTo(
            x * GRID_SIZE + GRID_SIZE / 2,
            wy - 3,
            x * GRID_SIZE + GRID_SIZE - 2,
            wy
          );
          ctx.stroke();
        }

        if (type === 'building') {
          ctx.fillStyle = '#37474F';
          ctx.fillRect(
            x * GRID_SIZE + 3,
            y * GRID_SIZE + 3,
            GRID_SIZE - 6,
            GRID_SIZE - 6
          );
          ctx.fillStyle = '#546E7A';
          ctx.fillRect(
            x * GRID_SIZE + 5,
            y * GRID_SIZE + 5,
            GRID_SIZE - 10,
            GRID_SIZE - 10
          );
        }
      }
    }

    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * GRID_SIZE, 0);
      ctx.lineTo(x * GRID_SIZE, canvasHeight);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * GRID_SIZE);
      ctx.lineTo(canvasWidth, y * GRID_SIZE);
      ctx.stroke();
    }

    if (hoveredPlot) {
      const { x, y } = hoveredPlot;
      if (x >= 0 && x < cols && y >= 0 && y < rows) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(255,255,255,0.8)';
        ctx.shadowBlur = 6;
        ctx.strokeRect(
          x * GRID_SIZE + 1,
          y * GRID_SIZE + 1,
          GRID_SIZE - 2,
          GRID_SIZE - 2
        );
        ctx.shadowBlur = 0;
      }
    }
  }, [plots, rows, cols, canvasWidth, canvasHeight, hoveredPlot]);

  useEffect(() => {
    draw();
  }, [draw]);

  const generateThumbnail = useCallback((): string => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL('image/png', 0.6);
  }, []);

  useImperativeHandle(ref, () => ({
    generateThumbnail,
  }), [generateThumbnail]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / GRID_SIZE / (window.devicePixelRatio || 1));
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / GRID_SIZE / (window.devicePixelRatio || 1));

    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      setPlot(x, y, selectedPlotType);
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / GRID_SIZE / (window.devicePixelRatio || 1));
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / GRID_SIZE / (window.devicePixelRatio || 1));

    if (x >= 0 && x < cols && y >= 0 && y < rows) {
      if (!hoveredPlot || hoveredPlot.x !== x || hoveredPlot.y !== y) {
        setHoveredPlot({ x, y });
      }
    } else {
      if (hoveredPlot) {
        setHoveredPlot(null);
      }
    }
  };

  const handleCanvasMouseLeave = () => {
    setHoveredPlot(null);
  };

  return (
    <div className="visualization-container" ref={containerRef}>
      <div className="viz-header">
        <h3 className="viz-title">街区俯视图</h3>
        <div className="viz-info">
          <span>{blockConfig.width}m × {blockConfig.depth}m</span>
          <span className="viz-grid-info">{cols} × {rows} 格</span>
        </div>
      </div>
      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="block-canvas"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
          onMouseLeave={handleCanvasMouseLeave}
          style={{ cursor: 'crosshair' }}
        />
        {isSimulating && (
          <div className="simulation-overlay">
            <div className="simulation-loader">
              <Loader2 className="spin-icon-large" size={48} />
              <p className="loader-text">正在计算微气候数据...</p>
              <div className="progress-ring">
                <svg className="progress-ring-svg" width="120" height="120">
                  <circle
                    className="progress-ring-bg"
                    stroke="#333"
                    strokeWidth="8"
                    fill="transparent"
                    r="52"
                    cx="60"
                    cy="60"
                  />
                  <circle
                    className="progress-ring-progress"
                    stroke="#4FC3F7"
                    strokeWidth="8"
                    fill="transparent"
                    r="52"
                    cx="60"
                    cy="60"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * 0.7}
                  />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>
      {simulationResult && (
        <div className="viz-legend">
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#FF7043' }} />
            <span>温度变化</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#4FC3F7' }} />
            <span>湿度变化</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: '#66BB6A' }} />
            <span>风速变化</span>
          </div>
        </div>
      )}
    </div>
  );
});
