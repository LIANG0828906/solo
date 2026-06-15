import React, { useEffect, useRef, useState } from 'react';
import type { ChartConfig } from '@/types';
import { createChart } from '@/utils/chartRenderer';
import { Loader2, BarChart3 } from 'lucide-react';

interface ChartPreviewProps {
  config: ChartConfig;
  onDataPointClick?: (index: number) => void;
}

const ChartPreview: React.FC<ChartPreviewProps> = ({ config, onDataPointClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const render = () => {
      if (!containerRef.current) return;
      setIsLoading(true);

      try {
        cleanupRef.current = createChart(containerRef.current, config, onDataPointClick);
        setIsLoading(false);
      } catch (error) {
        console.error('Chart render error:', error);
        setIsLoading(false);
      }
    };

    const timer = setTimeout(render, 50);

    const handleResize = () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      render();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [config, onDataPointClick]);

  const hasData = config.data && config.data.length > 0;

  return (
    <div className="relative w-full h-full min-h-[200px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-10">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}
      
      {!hasData && !isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10">
          <BarChart3 className="w-12 h-12 text-gray-300 mb-2" />
          <p className="text-gray-400 text-sm">暂无数据</p>
        </div>
      )}
      
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};

export default ChartPreview;
