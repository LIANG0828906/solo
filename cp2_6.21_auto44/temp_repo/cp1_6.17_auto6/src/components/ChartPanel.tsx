import React, { useMemo } from 'react';
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
import type { Question, Vote } from '../types';

interface ChartPanelProps {
  question: Question;
  questionIndex: number;
  votes: Vote[];
  lastUpdateTime: number | null;
}

const SINGLE_COLORS = ['#FF9800'];
const MULTIPLE_COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0'];
const RATING_COLOR = '#E91E63';

const ChartPanel: React.FC<ChartPanelProps> = ({
  question,
  questionIndex,
  votes,
  lastUpdateTime,
}) => {
  const chartData = useMemo(() => {
    if (question.type === 'single' || question.type === 'multiple') {
      const options = question.options || [];
      const counts: Record<string, number> = {};
      options.forEach((opt) => {
        counts[opt] = 0;
      });

      votes.forEach((vote) => {
        const answer = vote.answers[questionIndex];
        if (question.type === 'single') {
          if (answer && typeof answer === 'string') {
            counts[answer] = (counts[answer] || 0) + 1;
          }
        } else if (question.type === 'multiple') {
          if (Array.isArray(answer)) {
            answer.forEach((opt: string) => {
              counts[opt] = (counts[opt] || 0) + 1;
            });
          }
        }
      });

      return options.map((opt) => ({
        name: opt.length > 15 ? opt.slice(0, 15) + '...' : opt,
        fullName: opt,
        value: counts[opt] || 0,
      }));
    }

    if (question.type === 'rating') {
      const ratingCounts: Record<number, number> = {};
      for (let i = 1; i <= 10; i++) {
        ratingCounts[i] = 0;
      }

      votes.forEach((vote) => {
        const rating = vote.answers[questionIndex];
        if (typeof rating === 'number' && rating >= 1 && rating <= 10) {
          ratingCounts[rating] = (ratingCounts[rating] || 0) + 1;
        }
      });

      return Object.entries(ratingCounts)
        .map(([rating, count]) => ({
          rating: Number(rating),
          count,
        }))
        .sort((a, b) => a.rating - b.rating);
    }

    return [];
  }, [question, questionIndex, votes]);

  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.max(...chartData.map((d: any) => d.value || d.count || 0));
  }, [chartData]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN');
  };

  const renderChart = () => {
    if (question.type === 'single') {
      return (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData as any[]}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={80} />
            <Tooltip
              formatter={(value: number) => [`${value} 票`, '票数']}
              labelFormatter={(label: string) => {
                const item = (chartData as any[]).find((d) => d.name === label);
                return item?.fullName || label;
              }}
            />
            <Bar
              dataKey="value"
              animationDuration={1000}
              animationEasing="ease-out"
              radius={[0, 4, 4, 0]}
            >
              {(chartData as any[]).map((entry, index) => {
                const isMax = entry.value === maxValue && maxValue > 0;
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={isMax ? '#FF5722' : '#FF9800'}
                    stroke={isMax ? '#FF5722' : 'none'}
                    strokeDasharray={isMax ? '4 2' : 'none'}
                    strokeWidth={isMax ? 2 : 0}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (question.type === 'multiple') {
      return (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={chartData as any[]}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" />
            <YAxis type="category" dataKey="name" width={80} />
            <Tooltip
              formatter={(value: number) => [`${value} 票`, '票数']}
              labelFormatter={(label: string) => {
                const item = (chartData as any[]).find((d) => d.name === label);
                return item?.fullName || label;
              }}
            />
            <Bar
              dataKey="value"
              animationDuration={1000}
              animationEasing="ease-out"
              radius={[0, 4, 4, 0]}
            >
              {(chartData as any[]).map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={MULTIPLE_COLORS[index % MULTIPLE_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }

    if (question.type === 'rating') {
      return (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={chartData as any[]}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="rating" domain={[1, 10]} type="number" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [`${value} 票`, '票数']}
              labelFormatter={(label: number) => `${label} 分`}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={RATING_COLOR}
              strokeWidth={2}
              dot={{ r: 3, fill: RATING_COLOR, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: RATING_COLOR }}
              animationDuration={1500}
              animationEasing="ease"
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    return null;
  };

  return (
    <div className="chart-container">
      <div className="chart-title">
        {questionIndex + 1}. {question.title}
      </div>
      {renderChart()}
      {lastUpdateTime && (
        <div className="last-update">最后更新: {formatTime(lastUpdateTime)}</div>
      )}
    </div>
  );
};

export default ChartPanel;
