import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { FabricType, CarbonStats } from '../types';
import { fabricData } from '../data/clothing';
import { FaLeaf, FaRecycle, FaTree, FaSeedling } from 'react-icons/fa';

interface CarbonPieChartProps {
  stats: CarbonStats;
  onSelectFabric?: (fabric: FabricType | null) => void;
  selectedFabric?: FabricType | null;
}

const COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#a855f7'];

const fabricIcons: Record<FabricType, React.ReactNode> = {
  organicCotton: <FaLeaf size={14} />,
  recycledPolyester: <FaRecycle size={14} />,
  tencel: <FaTree size={14} />,
  hemp: <FaSeedling size={14} />
};

export function CarbonPieChart({ stats, onSelectFabric, selectedFabric }: CarbonPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const data = Object.entries(stats.fabricUsage)
    .filter(([_, count]) => count > 0)
    .map(([fabric, count], index) => ({
      name: fabricData[fabric as FabricType].name,
      value: count,
      fabric: fabric as FabricType,
      color: COLORS[index % COLORS.length]
    }));

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
      return (
        <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-medium text-gray-800">{item.name}</span>
          </div>
          <p className="text-sm text-gray-600">
            {item.value} 件 ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const handleClick = (entry: any, index: number) => {
    if (onSelectFabric) {
      if (selectedFabric === entry.fabric) {
        onSelectFabric(null);
        setActiveIndex(null);
      } else {
        onSelectFabric(entry.fabric);
        setActiveIndex(index);
      }
    }
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        暂无数据，开始定制您的第一件环保服装吧
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
              onClick={handleClick}
              animationDuration={500}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  opacity={activeIndex === null || activeIndex === index ? 1 : 0.3}
                  stroke={selectedFabric === entry.fabric ? '#fff' : 'transparent'}
                  strokeWidth={selectedFabric === entry.fabric ? 3 : 0}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: 'center'
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        {data.map((item, index) => (
          <button
            key={item.fabric}
            onClick={() => handleClick(item, index)}
            className={`flex items-center gap-2 p-2 rounded-lg transition-all duration-200 text-left ${
              selectedFabric === item.fabric
                ? 'bg-gray-100 ring-2 ring-emerald-500'
                : 'hover:bg-gray-50'
            }`}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white"
              style={{ backgroundColor: item.color }}
            >
              {fabricIcons[item.fabric]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
              <p className="text-xs text-gray-500">
                {item.value} 件 · {total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%
              </p>
            </div>
          </button>
        ))}
      </div>

      {selectedFabric && (
        <p className="text-xs text-center text-emerald-600 mt-3">
          正在筛选 {fabricData[selectedFabric].name} 的定制记录
        </p>
      )}
    </div>
  );
}
