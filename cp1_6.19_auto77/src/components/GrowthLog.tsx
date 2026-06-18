import React, { useRef, useEffect, useState, useMemo } from 'react';
import { GrowthLogEntry, EnvironmentParams } from '../data/plantTypes';

interface GrowthLogProps {
  data: GrowthLogEntry[];
}

interface TooltipData {
  x: number;
  y: number;
  timestamp: number;
  params: EnvironmentParams;
  show: boolean;
}

const paramColors: Record<keyof EnvironmentParams, string> = {
  light: '#FFD700',
  water: '#4FC3F7',
  temperature: '#FF7043',
};

const paramLabels: Record<keyof EnvironmentParams, string> = {
  light: '光照',
  water: '水分',
  temperature: '温度',
};

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

const GrowthLog: React.FC<GrowthLogProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 250 });
  const animationRef = useRef<number>();

  const padding = { top: 20, right: 80, bottom: 40, left: 50 };

  const filteredData = useMemo(() => {
    const now = Date.now();
    const cutoff = now - TWENTY_FOUR_HOURS;
    return data.filter((entry) => entry.timestamp >= cutoff);
  }, [data]);

  const downsampledData = useMemo(() => {
    if (filteredData.length <= 1000) return filteredData;
    
    const targetPoints = 500;
    const step = Math.ceil(filteredData.length / targetPoints);
    const result: GrowthLogEntry[] = [];
    
    for (let i = 0; i < filteredData.length; i += step) {
      result.push(filteredData[i]);
    }
    
    if (filteredData.length > 0 && result[result.length - 1] !== filteredData[filteredData.length - 1]) {
      result.push(filteredData[filteredData.length - 1]);
    }
    
    return result;
  }, [filteredData]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width: Math.max(width, 300), height: 250 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = dimensions.width * dpr;
      canvas.height = dimensions.height * dpr;
      canvas.style.width = `${dimensions.width}px`;
      canvas.style.height = `${dimensions.height}px`;
      ctx.scale(dpr, dpr);

      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      const chartWidth = dimensions.width - padding.left - padding.right;
      const chartHeight = dimensions.height - padding.top - padding.bottom;

      if (downsampledData.length < 2) {
        ctx.fillStyle = '#90A4AE';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('等待数据记录中...', dimensions.width / 2, dimensions.height / 2);
        return;
      }

      const now = Date.now();
      const startTime = now - TWENTY_FOUR_HOURS;
      const endTime = now;

      const xScale = (time: number) => {
        return padding.left + ((time - startTime) / (endTime - startTime)) * chartWidth;
      };

      const yScale = (value: number) => {
        return padding.top + chartHeight - (value / 100) * chartHeight;
      };

      ctx.strokeStyle = '#ECEFF1';
      ctx.lineWidth = 1;

      for (let i = 0; i <= 5; i++) {
        const y = padding.top + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(dimensions.width - padding.right, y);
        ctx.stroke();

        ctx.fillStyle = '#78909C';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'right';
        const value = 100 - i * 20;
        ctx.fillText(value.toString(), padding.left - 8, y + 4);
      }

      const timeLabels = [0, 6, 12, 18, 24];
      timeLabels.forEach((hoursAgo) => {
        const time = now - hoursAgo * 60 * 60 * 1000;
        const x = xScale(time);
        ctx.fillStyle = '#78909C';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${hoursAgo}h前`, x, dimensions.height - padding.bottom + 20);
      });

      (Object.keys(paramColors) as Array<keyof EnvironmentParams>).forEach((param) => {
        const color = paramColors[param];
        
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        downsampledData.forEach((entry, i) => {
          const x = xScale(entry.timestamp);
          const y = yScale(entry.params[param]);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.stroke();

        downsampledData.forEach((entry) => {
          const x = xScale(entry.timestamp);
          const y = yScale(entry.params[param]);
          
          ctx.beginPath();
          ctx.fillStyle = color;
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      const legendX = dimensions.width - padding.right + 10;
      let legendY = padding.top + 10;

      ctx.fillStyle = '#546E7A';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('图例', legendX, legendY);
      legendY += 20;

      (Object.keys(paramColors) as Array<keyof EnvironmentParams>).forEach((param) => {
        ctx.beginPath();
        ctx.fillStyle = paramColors[param];
        ctx.arc(legendX + 5, legendY - 4, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#546E7A';
        ctx.font = '12px sans-serif';
        ctx.fillText(paramLabels[param], legendX + 18, legendY);
        legendY += 20;
      });
    };

    const animate = () => {
      render();
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions, downsampledData]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || downsampledData.length < 2) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const chartWidth = dimensions.width - padding.left - padding.right;
    const now = Date.now();
    const startTime = now - TWENTY_FOUR_HOURS;

    const timeAtMouse = startTime + ((mouseX - padding.left) / chartWidth) * TWENTY_FOUR_HOURS;

    let closestIndex = 0;
    let closestDiff = Infinity;
    downsampledData.forEach((entry, i) => {
      const diff = Math.abs(entry.timestamp - timeAtMouse);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = i;
      }
    });

    const closestEntry = downsampledData[closestIndex];
    const x = padding.left + ((closestEntry.timestamp - startTime) / TWENTY_FOUR_HOURS) * chartWidth;

    if (Math.abs(x - mouseX) < 30) {
      setTooltip({
        x: mouseX,
        y: mouseY,
        timestamp: closestEntry.timestamp,
        params: closestEntry.params,
        show: true,
      });
    } else {
      setTooltip(null);
    }
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>生长日志 - 24小时参数趋势</h3>
      <div ref={containerRef} style={styles.chartContainer}>
        <canvas
          ref={canvasRef}
          style={styles.canvas}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {tooltip && (
          <div
            style={{
              ...styles.tooltip,
              left: tooltip.x,
              transform: `translateX(-50%) translateY(${tooltip.show ? '0' : '10px'})`,
              opacity: tooltip.show ? 1 : 0,
            } as React.CSSProperties}
          >
            <div style={styles.tooltipTime}>
              {new Date(tooltip.timestamp).toLocaleTimeString('zh-CN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </div>
            {(Object.keys(paramColors) as Array<keyof EnvironmentParams>).map((param) => (
              <div key={param} style={styles.tooltipRow}>
                <span
                  style={{
                    ...styles.tooltipDot,
                    backgroundColor: paramColors[param],
                  }}
                />
                <span style={styles.tooltipLabel}>{paramLabels[param]}</span>
                <span style={styles.tooltipValue}>{Math.round(tooltip.params[param])}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#ffffff',
    borderRadius: '8px',
    padding: '16px 24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    width: '100%',
    boxSizing: 'border-box',
  },
  title: {
    margin: '0 0 12px 0',
    fontSize: '16px',
    fontWeight: 600,
    color: '#546E7A',
  },
  chartContainer: {
    position: 'relative',
    width: '100%',
  },
  canvas: {
    display: 'block',
    width: '100%',
    cursor: 'crosshair',
  },
  tooltip: {
    position: 'absolute',
    bottom: 'calc(100% + 8px)',
    background: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '8px',
    padding: '10px 14px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    pointerEvents: 'none',
    zIndex: 10,
    minWidth: '140px',
    transition: 'transform 0.2s ease, opacity 0.2s ease',
    border: '1px solid #ECEFF1',
  },
  tooltipTime: {
    fontSize: '12px',
    color: '#90A4AE',
    marginBottom: '8px',
    borderBottom: '1px solid #ECEFF1',
    paddingBottom: '6px',
    fontFamily: 'monospace',
  },
  tooltipRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
    fontSize: '13px',
  },
  tooltipDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  tooltipLabel: {
    flex: 1,
    color: '#546E7A',
  },
  tooltipValue: {
    fontWeight: 600,
    color: '#37474F',
    fontFamily: 'monospace',
    minWidth: '30px',
    textAlign: 'right',
  },
};

export default GrowthLog;
