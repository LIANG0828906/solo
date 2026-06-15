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

  const handleDragStart = (e: React.DragEvent, chartType: ChartType) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('chartType', chartType);
    setDraggedChartType(chartType);
  };

  const handleDragEnd = () => {
    setDraggedChartType(null);
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">图表组件</h2>
        <p className="text-xs text-gray-500 mt-1">拖拽到画布创建幻灯片</p>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3">
          {chartTypes.map(({ type, name, icon: Icon, color }) => (
            <div
              key={type}
              draggable
              onDragStart={(e) => handleDragStart(e, type)}
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
          ))}
        </div>

        <div className="mt-6 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-600">
            <strong>提示：</strong>将图表拖拽到右侧画布区域，即可创建新的幻灯片。
          </p>
        </div>
      </div>
    </div>
  );
}
