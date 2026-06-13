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
  const [xDropdownOpen, setXDropdownOpen] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const xDropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (xDropdownRef.current && !xDropdownRef.current.contains(e.target as Node)) {
        setXDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    
    console.log(`检测到 ${allTurningPoints.length} 个转折点`, allTurningPoints);
    
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
    
    render();
    
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
          <div className="custom-select" ref={xDropdownRef}>
            <div 
              className="select-trigger"
              onClick={() => setXDropdownOpen(!xDropdownOpen)}
            >
              <span className="select-value">{xField || '请选择时间字段'}</span>
              <span className="select-arrow">▾</span>
            </div>
            {xDropdownOpen && (
              <div className="select-dropdown">
                {timeFields.map(field => (
                  <div
                    key={field}
                    className={`select-option ${xField === field ? 'selected' : ''}`}
                    onClick={() => {
                      setXField(field);
                      setXDropdownOpen(false);
                    }}
                  >
                    <span className="option-dot time-dot" />
                    <span className="option-label">{field}</span>
                    {xField === field && <span className="option-check">✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="field-group">
          <label className="field-label">
            数值字段 (Y轴) 
            <span className="field-count">({yFields.length}/3) - 点击选择</span>
          </label>
          <div className="y-field-selector">
            {numericFields.map(field => {
              const isSelected = yFields.includes(field);
              const isDisabled = !isSelected && yFields.length >= 3;
              
              return (
                <button
                  key={field}
                  className={`y-field-item ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                  onClick={() => !isDisabled && handleYFieldToggle(field)}
                  disabled={isDisabled}
                >
                  <span 
                    className="field-color-indicator"
                    style={{ backgroundColor: fieldColors[field] || '#666' }}
                  />
                  <span className="field-name-text">{field}</span>
                  <span className="field-toggle-icon">
                    {isSelected ? '−' : '+'}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="field-hint">最多选择 3 个字段，第一个使用左Y轴，第二、三个使用右Y轴</p>
        </div>
        
        <button
          className="generate-btn"
          onClick={handleGenerate}
          disabled={!xField || yFields.length === 0}
        >
          <span className="btn-icon">✨</span>
          生成数据故事
        </button>
      </div>
      
      {showChart && config && (
        <div className="chart-container" ref={containerRef}>
          <div className="chart-header">
            <h3 className="chart-title">数据趋势图</h3>
            <div className="chart-legend-hint">
              <span className="legend-dot" />
              点击图例切换显示
            </div>
          </div>
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            style={{ cursor: 'pointer', width: '100%' }}
          />
          <div className="chart-stats">
            <span className="stat-item">
              <strong>{data.rowCount}</strong> 个数据点
            </span>
            <span className="stat-item">
              <strong>{turningPoints.length}</strong> 个转折点
            </span>
            <span className="stat-item">
              <strong>{trendLines.length}</strong> 条趋势线
            </span>
          </div>
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
          border: 1px solid rgba(255, 255, 255, 0.06);
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
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 12px;
          font-family: 'Space Grotesk', sans-serif;
          letter-spacing: 0.3px;
        }
        
        .field-count {
          color: rgba(255, 255, 255, 0.4);
          font-weight: 400;
          margin-left: 8px;
          font-size: 12px;
        }
        
        .custom-select {
          position: relative;
        }
        
        .select-trigger {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .select-trigger:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(51, 87, 255, 0.5);
        }
        
        .select-value {
          font-weight: 500;
        }
        
        .select-arrow {
          color: rgba(255, 255, 255, 0.4);
          font-size: 10px;
          transition: transform 0.2s ease;
        }
        
        .custom-select.open .select-arrow {
          transform: rotate(180deg);
        }
        
        .select-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: rgba(20, 20, 40, 0.98);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
          z-index: 50;
          overflow: hidden;
          backdrop-filter: blur(10px);
        }
        
        .select-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        
        .select-option:hover {
          background: rgba(51, 87, 255, 0.1);
        }
        
        .select-option.selected {
          background: rgba(51, 87, 255, 0.15);
        }
        
        .option-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        
        .time-dot {
          background: #3357FF;