import { useState } from 'react';
import './BarChart.css';

interface BarData {
  label: string;
  value: number;
  color: string;
  projectName?: string;
}

interface BarChartProps {
  data: BarData[];
  height?: number;
}

export default function BarChart({ data, height = 200 }: BarChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="bar-chart" style={{ height }}>
      <div className="bar-chart-bars">
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * 100;
          const isHovered = hoverIndex === index;

          return (
            <div
              key={index}
              className="bar-column"
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
            >
              {isHovered && (
                <div className="bar-tooltip">
                  <div className="tooltip-value">{item.value} 分钟</div>
                  {item.projectName && (
                    <div className="tooltip-label">{item.projectName}</div>
                  )}
                </div>
              )}
              <div
                className="bar"
                style={{
                  height: `${barHeight}%`,
                  background: `linear-gradient(180deg, ${item.color} 0%, ${item.color}80 100%)`,
                  opacity: isHovered ? 1 : 0.85,
                  transform: isHovered ? 'scaleX(1.1)' : 'scaleX(1)',
                }}
              />
              <div className="bar-label">{item.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
