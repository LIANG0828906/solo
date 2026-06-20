import { useState, useRef, useEffect } from 'react';
import { LineChart, BarChart3, PieChart, ScatterChart } from 'lucide-react';
import type { ChartType } from '../types';
import { useStoryStore } from '../store/useStoryStore';

const chartTypes: { type: ChartType; name: string; icon: React.ElementType; color: string }[] = [
  { type: 'line', name: '折线图', icon: LineChart, color: '#FF6B35' },
  { type: 'bar', name: '柱状图', icon: BarChart3, color: '#F7C59F' },
  { type: 'pie', name: '饼图', icon: PieChart, color: '#E63946' },
  { type: 'scatter', name: '散点图', icon: ScatterChart, color: '#2A9D8F' },
];

export default function ChartLibrary() {
  const setDraggedChartType = useStoryStore((state) => state.setDraggedChartType);
  const [dragPreview, setDragPreview] = useState<{ type: ChartType; name: string; icon: React.ElementType; color: string } | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragPreview) {
        setMousePos({ x: e.clientX, y: e.clientY });
      }
    };

    if (dragPreview) {
      document.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [dragPreview]);

  const handleDragStart = (e: React.DragEvent, chartType: ChartType, chartInfo: { type: ChartType; name: string; icon: React.ElementType; color: string }) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('chartType', chartType);
    setDraggedChartType(chartType);
    setDragPreview(chartInfo);
    setIsAnimating(false);

    const emptyImage = new Image();
    emptyImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(emptyImage, 0, 0);
  };

  const handleDragEnd = () => {
    setDraggedChartType(null);
    setIsAnimating(true);
    setTimeout(() => {
      setDragPreview(null);
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">图表组件</h2>
        <p className="text-xs text-gray-500 mt-1">拖拽到画布创建幻灯片</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3">
          {chartTypes.map((chartInfo) => {
            const { type, name, icon: Icon, color } = chartInfo;
            return (
              <div
                key={type}
                draggable
                onDragStart={(e) => handleDragStart(e, type, chartInfo)}
                onDragEnd={handleDragEnd}
                className="group flex items-center gap-3 p-3 rounded-lg border border-gray-200 bg-white cursor-grab active:cursor-grabbing hover:border-[#1A237E] hover:shadow-md transition-all duration-200"
                style={{
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${color}20` }}
                >
                  <Icon size={20} style={{ color }} />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800 text-sm">{name}</div>
                  <div className="text-xs text-gray-500">拖拽添加</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>提示：</strong>将图表拖拽到右侧画布区域，即可创建新的幻灯片。
          </p>
        </div>
      </div>

      {dragPreview && (
        <div
          ref={previewRef}
          className="fixed pointer-events-none z-50"
          style={{
            left: mousePos.x + 10,
            top: mousePos.y + 10,
            transform: isAnimating ? 'scale(1)' : 'scale(1.1)',
            transition: isAnimating ? 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
          }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${dragPreview.color}30` }}
            >
              <dragPreview.icon size={20} style={{ color: dragPreview.color }} />
            </div>
            <div className="font-medium text-gray-800 text-sm">{dragPreview.name}</div>
          </div>
        </div>
      )}
    </div>
  );
}
