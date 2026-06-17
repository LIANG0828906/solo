import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Download } from 'lucide-react';
import { FlavorProfile } from '@/shared/types';
import { renderRadarChart, exportRadarChart } from '@/renderer/radarRenderer';

interface RadarChartProps {
  profiles: FlavorProfile[];
  title?: string;
  onExport?: () => void;
}

export const RadarChart: React.FC<RadarChartProps> = ({ profiles, title, onExport }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 600, height: 600 });

  const handleResize = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const maxSize = Math.min(rect.width, rect.height, 600);
    setSize({ width: maxSize, height: maxSize });
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  useEffect(() => {
    if (!canvasRef.current) return;
    renderRadarChart(canvasRef.current, profiles, size.width, size.height, title);
  }, [profiles, size, title]);

  const handleExport = () => {
    const dataUrl = exportRadarChart(profiles);
    const link = document.createElement('a');
    link.download = `风味对比图_${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    onExport?.();
  };

  return (
    <div
      ref={containerRef}
      className="radar-chart-container"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: size.width,
          height: size.height,
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: size.width,
            height: size.height,
            display: 'block',
          }}
        />
      </div>
      <button
        onClick={handleExport}
        disabled={profiles.length === 0}
        style={{
          position: 'absolute',
          top: '20px',
          right: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '10px 18px',
          backgroundColor: profiles.length > 0 ? '#6C63FF' : '#3D3D5C',
          border: 'none',
          borderRadius: '10px',
          color: '#FFFFFF',
          fontSize: '13px',
          fontWeight: 500,
          cursor: profiles.length > 0 ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease-in-out',
          opacity: profiles.length > 0 ? 1 : 0.5,
          boxShadow: '0 4px 16px rgba(108, 99, 255, 0.3)',
        }}
      >
        <Download size={16} />
        导出 PNG (1920×1080)
      </button>
    </div>
  );
};
