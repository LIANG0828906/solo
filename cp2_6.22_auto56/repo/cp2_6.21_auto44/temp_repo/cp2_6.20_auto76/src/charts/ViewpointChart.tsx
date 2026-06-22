import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

interface ViewpointChartProps {
  proCount: number;
  conCount: number;
  frequencyData: { time: string; pro: number; con: number }[];
  keywords: { word: string; count: number }[];
}

const titleStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
  color: '#1e3a5f',
  marginBottom: 8,
};

const ViewpointChart: React.FC<ViewpointChartProps> = ({ proCount, conCount, frequencyData, keywords }) => {
  const barData = [
    { name: '正方', count: proCount },
    { name: '反方', count: conCount },
  ];

  const keywordColors = ['#1e3a5f', '#1890ff', '#ff6b6b'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: 16 }}>
      <div>
        <div style={titleStyle}>发言数量</div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#1890ff" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div style={titleStyle}>发言频率</div>
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={frequencyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="pro" stroke="#1890ff" />
            <Line type="monotone" dataKey="con" stroke="#ff6b6b" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <div style={titleStyle}>热门关键词</div>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {keywords.map((kw, index) => (
            <span
              key={kw.word}
              style={{
                fontSize: Math.min(12 + kw.count * 4, 32),
                color: keywordColors[index % keywordColors.length],
                padding: '4px 8px',
                cursor: 'default',
              }}
            >
              {kw.word}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewpointChart;
