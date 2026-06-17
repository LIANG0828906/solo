import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  Cell,
} from 'recharts';
import type { Question, ResultData } from '../types';

interface ChartPanelProps {
  question: Question;
  result: ResultData;
}

const MULTIPLE_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'];

function ChartPanel({ question, result }: ChartPanelProps) {
  const chartData = useMemo(() => {
    if (question.type === 'single' || question.type === 'multiple') {
      const options = question.options || [];
      return options.map((opt, index) => ({
        name: opt,
        value: result.data[opt] || 0,
        fill: question.type === 'multiple' 
          ? MULTIPLE_COLORS[index % MULTIPLE_COLORS.length]
          : undefined,
      }));
    } else if (question.type === 'rating') {
      const data = [];
      for (let i = 1; i <= 10; i++) {
        data.push({
          name: String(i),
          value: result.data[i] || 0,
        });
      }
      return data;
    }
    return [];
  }, [question, result]);

  const maxValue = useMemo(() => {
    return Math.max(...chartData.map((d) => d.value), 1);
  }, [chartData]);

  if (question.type === 'single') {
    const maxIndex = chartData.findIndex((d) => d.value === maxValue && maxValue > 0);
    
    return (
      <div className="chart-container">
        <div className="chart-title">{question.title}</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              animationDuration={1000}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={`hsl(${33 + (entry.value / maxValue) * 10}, 100%, ${65 - (entry.value / maxValue) * 15}%)`}
                />
              ))}
            </Bar>
            {maxIndex >= 0 && (
              <ReferenceLine
                x={maxValue}
                stroke="#FF5722"
                strokeDasharray="6 3"
                strokeWidth={2}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (question.type === 'multiple') {
    return (
      <div className="chart-container">
        <div className="chart-title">{question.title}</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar
              dataKey="value"
              radius={[0, 4, 4, 0]}
              animationDuration={1000}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={MULTIPLE_COLORS[index % MULTIPLE_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (question.type === 'rating') {
    return (
      <div className="chart-container">
        <div className="chart-title">
          {question.title}
          <span style={{ marginLeft: 12, fontSize: 14, color: '#E91E63', fontWeight: '500' }}>
            平均分: {result.average || 0}
          </span>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#E91E63"
              strokeWidth={2}
              dot={{ r: 3, fill: '#E91E63' }}
              activeDot={{ r: 5 }}
              animationDuration={1500}
              animationBegin={0}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}

export default ChartPanel;
