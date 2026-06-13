import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { ParsedCSVData, ChartConfig, LineVisibility, TurningPoint, TrendLine } from '../types';
import { SATURATED_COLORS } from '../types';
import { 
  calculateDimensions, 
  drawChart, 
  handleLegendClick,
  detectTurningPoints,
  calculateTrendLine
} from '../utils/chartEngine';

interface ChartPanelProps {
  data: ParsedCSVData;
  onGenerate: (config: ChartConfig, turningPoints: TurningPoint[], trendLines: TrendLine[]) => void;
}

const ChartPanel: React.FC<ChartPanelProps> = ({ data, onGenerate }) => {
  const [xField, setXField] = useState<string>('');
  const [yFields, setYFields] = useState<string[]>([]);
  const [fieldColors, setFieldColors] = useState<Record<string, string>>({});
  const [visibility, setVisibility] = useState<LineVisibility>({});
  const [showChart, setShowChart] = useState(false);
  const [config, setConfig] = useState<ChartConfig | null>(null);
  const [turningPoints, setTurningPoints] = useState<TurningPoint[]>([]);
  const [trendLines, setTrendLines] = useState<TrendLine[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  const timeFields = data.headers.filter(h => h.type === 'time').map(h => h.name);
  const numericFields = data.headers.filter(h => h.type === 'numeric').map(h => h.name);

  useEffect(() => {
    if (timeFields.length > 0 && !xField) {
      setXField(timeFields[0]);
    }
  }, [timeFields, xField]);

  useEffect(() => {
    const colors: Record<string, string> = {};
    data.headers.forEach((header, index) => {
      colors[header.name] = SATURATED_COLORS[index % SATURATED_COLORS.length];
    });
    setFieldColors(colors);
  }, [data.headers]);

  const handleYFieldToggle = useCallback((field: string) => {
    setYFields(prev => {
      if (prev.includes(field)) {
        return prev.filter(f => f !== field);
      } else if (prev.length < 3) {
        return [...prev, field];
      }
      return prev;
    });
  }, []);

  const toggleLineVisibility = useCallback((field: string) => {
    setVisibility(prev => ({
      ...prev,
      [field]: prev[field] === false ? true : false
    }));
  }, []);

  const handleGenerate = useCallback(() => {
    if (!xField || yFields.length === 0) return;
    
    const startTime = performance.now();
    
    const newConfig: ChartConfig = {
      xField,
      yFields: [...yFields],
      fieldColors: { ...fieldColors },
      showTrendLine: true
    };
    
    const newVisibility: LineVisibility = {};
    yFields.forEach(field => {
      newVisibility[field] = true;
    });
    
    const allTurningPoints: TurningPoint[] = [];
    yFields.forEach(field => {
      const points = detectTurningPoints(data, xField, field, 0.3);
      allTurningPoints.push(...points);
    });
    
    const newTrendLines: TrendLine[] = [];
    yFields.forEach(field => {
      const trend = calculateTrendLine(data, xField, field, fieldColors[field]);
      if (trend) {
        newTrendLines.push(trend);
      }
    });
    
    setConfig(newConfig);
    setVisibility(newVisibility);
    setTurningPoints(allTurningPoints);
    setTrendLines(newTrendLines);
    setShowChart(true);
    
    onGenerate(newConfig, allTurningPoints, newTrendLines);
    
    const endTime = performance.now();
    console.log(`图表生成耗时: ${(endTime - startTime).toFixed(2)}ms`);
  }, [xField, yFields, fieldColors, data, onGenerate]);

  useEffect(() => {
    if (!showChart || !config || !canvasRef.current || !containerRef.current) return;
    
    const render = () => {
      const containerWidth = containerRef.current?.clientWidth || 800;
      const dimensions = calculateDimensions(containerWidth);
      
      drawChart({
        canvas: canvasRef.current!,
        data,
        config,
        dimensions,
        visibility,
        turningPoints,
        trendLines
      });
    };
    
    const startTime = performance.now();
    render();
    const endTime = performance.now();
    console.log(`图表渲染耗时: ${(endTime - startTime).toFixed(2)}ms`);
    
    const handleResize = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [showChart, config, data, visibility, turningPoints, trendLines]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!config || !canvasRef.current || !containerRef.current) return;
    
    const containerWidth = containerRef.current.clientWidth;
    const dimensions = calculateDimensions(containerWidth);
    
    handleLegendClick(
      e,
      canvasRef.current,
      config,
      dimensions,
      visibility,
      toggleLineVisibility
    );
  }, [config, visibility, toggleLineVisibility]);

  return (
    <div className="chart-panel">
      <div className="field-selection">
        <div className="field-group">
          <label className="field-label">时间字段 (X轴)</label>
          <select 
            className="field-select"
            value={xField}
            onChange={(e) => setXField(e.target.value)}
          >
            <option value="">请选择时间字段</option>
            {timeFields.map(field => (
              <option key={field} value={field}>{field}</option>
            ))}
          </select>
        </div>
        
        <div className="field-group">
          <label className="field-label">
            数值字段 (Y轴) 
            <span className="field-count">({yFields.length}/3)</span>
          </label>
          <div className="field-tags">
            {numericFields.map(field => (
              <button
                key={field}
                className={`field-tag ${yFields.includes(field) ? 'selected' : ''}`}
                style={{
                  '--tag-color': fieldColors[field] || '#666'
                } as React.CSSProperties}
                onClick={() => handleYFieldToggle(field)}
                disabled={!yFields.includes(field) && yFields.length >= 3}
              >
                <span 
                  className="tag-dot" 
                  style={{ backgroundColor: fieldColors[field] || '#666' }}
                />
                <span className="tag-name">{field}</span>
                {yFields.includes(field) && (
                  <span className="tag-remove">×</span>
                )}
              </button>
            ))}
          </div>
        </div>
        
        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={!xField || yFields.length === 0}
        >
          生成数据故事
        </button>
      </div>
      
      {showChart && config && (
        <div className="chart-container" ref={containerRef}>
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{ cursor: 'pointer' }}
          />
          <p className="chart-hint">点击右上角图例可切换线条显示</p>
        </div>
      )}
      
      <style>{`
        .chart-panel {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .field-selection {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 16px;
          padding: 28px;
          margin-bottom: 24px;
        }
        
        .field-group {
          margin-bottom: 24px;
        }
        
        .field-group:last-of-type {
          margin-bottom: 28px;
        }
        
        .field-label {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 12px;
          font-family: 'Space Grotesk', sans-serif;
        }
        
        .field-count {
          color: rgba(255, 255, 255, 0.4);
          font-weight: 400;
          margin-left: 4px;
        }
        
        .field-select {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .field-select:focus {
          outline: none;
          border-color: #3357FF;
          background: rgba(51, 87, 255, 0.05);
        }
        
        .field-select option {
          background: #1a1a2e;
          color: rgba(255, 255, 255, 0.9);
        }
        
        .field-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        
        .field-tag {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 20px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
        }
        
        .field-tag:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-1px);
        }
        
        .field-tag:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        
        .field-tag.selected {
          background: color-mix(in srgb, var(--tag-color) 15%, transparent);
          border-color: var(--tag-color);
          color: rgba(255, 255, 255, 0.9);
        }
        
        .tag-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .tag-name {
          white-space: nowrap;
        }
        
        .tag-remove {
          font-size: 16px;
          line-height: 1;
          opacity: 0.6;
          margin-left: 2px;
        }
        
        .field-tag.selected:hover .tag-remove {
          opacity: 1;
        }
        
        .generate-btn {
          width: 100%;
          padding: 16px 32px;
          background: linear-gradient(135deg, #FF5733 0%, #FF33A6 100%);
          border: none;
          border-radius: 10px;
          color: white;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: 0.5px;
        }
        
        .generate-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(255, 87, 51, 0.4);
        }
        
        .generate-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          transform: none;
        }
        
        .chart-container {
          background: #1a1a2e;
          border-radius: 16px;
          padding: 20px;
          overflow: hidden;
        }
        
        .chart-container canvas {
          display: block;
          width: 100%;
          border-radius: 8px;
        }
        
        .chart-hint {
          text-align: center;
          color: rgba(255, 255, 255, 0.4);
          font-size: 12px;
          margin: 12px 0 0 0;
        }
      `}</style>
    </div>
  );
};

export default ChartPanel;
