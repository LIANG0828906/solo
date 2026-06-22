import React, { useState, useMemo } from 'react';
import { Line, Pie } from '@ant-design/charts';
import { Card, Row, Col, Button } from 'antd';
import dayjs from 'dayjs';

interface StatsChartProps {
  dailyStats: { date: string; completion_rate: number }[];
  habitStats: { habit_name: string; completed_days: number; color: string }[];
  days: number;
  onDaysChange: (days: number) => void;
}

const StatsChart: React.FC<StatsChartProps> = ({
  dailyStats,
  habitStats,
  days,
  onDaysChange,
}) => {
  const [key, setKey] = useState(0);
  const [fade, setFade] = useState(true);

  const handleDaysChange = (newDays: number) => {
    if (newDays === days) return;
    setFade(false);
    setTimeout(() => {
      onDaysChange(newDays);
      setKey(prev => prev + 1);
      setFade(true);
    }, 300);
  };

  const lineData = useMemo(() => {
    return dailyStats.slice(-days).map(item => ({
      ...item,
      completion_rate: Math.round(item.completion_rate * 100),
      date: dayjs(item.date).format('MM-DD'),
    }));
  }, [dailyStats, days]);

  const pieData = useMemo(() => {
    return habitStats.map(item => ({
      type: item.habit_name,
      value: item.completed_days,
      color: item.color,
    }));
  }, [habitStats]);

  const lineConfig = {
    key: `line-${key}`,
    data: lineData,
    xField: 'date',
    yField: 'completion_rate',
    smooth: true,
    animation: {
      appear: {
        animation: 'fade-in',
        duration: 300,
      },
    },
    point: {
      size: 4,
      shape: 'circle',
    },
    tooltip: {
      formatter: (d: { date: string; completion_rate: number }) => ({
        name: d.date,
        value: `${d.completion_rate}%`,
      }),
    },
    yAxis: {
      min: 0,
      max: 100,
      label: {
        formatter: (v: string) => `${v}%`,
      },
    },
    color: '#7b68ee',
    lineStyle: {
      lineWidth: 2,
    },
  };

  const pieConfig = {
    key: `pie-${key}`,
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    color: pieData.map(item => item.color),
    radius: 0.8,
    innerRadius: 0.5,
    animation: {
      appear: {
        animation: 'fade-in',
        duration: 300,
      },
    },
    label: {
      type: 'outer',
      content: '{name}: {percentage}',
    },
    tooltip: {
      formatter: (d: { type: string; value: number }) => ({
        name: d.type,
        value: `${d.value}天`,
      }),
    },
    legend: {
      layout: 'horizontal',
      position: 'bottom',
    },
  };

  const dayOptions = [
    { label: '7天', value: 7 },
    { label: '30天', value: 30 },
    { label: '90天', value: 90 },
  ];

  return (
    <Card
      title="统计分析"
      extra={
        <div style={{ display: 'flex', gap: '8px' }}>
          {dayOptions.map(option => (
            <Button
              key={option.value}
              type={days === option.value ? 'primary' : 'default'}
              onClick={() => handleDaysChange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      }
      style={{ height: '100%' }}
    >
      <Row gutter={[16, 16]} style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.3s ease' }}>
        <Col xs={24} lg={14}>
          <Card size="small" title="每日完成率趋势">
            <Line {...lineConfig} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card size="small" title="习惯完成分布">
            <Pie {...pieConfig} />
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default StatsChart;
