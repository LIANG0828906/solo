import React from 'react';

interface StatsChartsProps {
  hourlyDistribution: number[];
  averagePassRate: number;
  averageScore: number;
}

const StatsCharts: React.FC<StatsChartsProps> = ({ hourlyDistribution }) => {
  const maxHour = Math.max(...hourlyDistribution, 1);

  const getHeatColor = (count: number) => {
    if (count === 0) return '#ffffff';
    const ratio = count / maxHour;
    const start = { r: 227, g: 242, b: 253 };
    const end = { r: 21, g: 101, b: 192 };
    const r = Math.round(start.r + (end.r - start.r) * ratio);
    const g = Math.round(start.g + (end.g - start.g) * ratio);
    const b = Math.round(start.b + (end.b - start.b) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getTextColor = (count: number) => {
    const ratio = count / maxHour;
    return ratio > 0.5 ? '#ffffff' : '#37474f';
  };

  return (
    <>
      <div className="card">
        <h4 style={{ fontSize: '15px', fontWeight: 600, color: '#455a64', marginBottom: '16px' }}>
          📊 提交按时分布（按小时）
        </h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gap: '4px',
        }} className="heatmap-desktop">
          {hourlyDistribution.map((count, hour) => (
            <div key={hour} style={{ textAlign: 'center' }}>
              <div
                title={`${hour}:00 - ${count}次提交`}
                style={{
                  height: '32px',
                  background: getHeatColor(count),
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: getTextColor(count),
                  border: '1px solid #e0e0e0',
                  transition: 'transform 0.15s',
                }}
              >
                {count > 0 ? count : ''}
              </div>
              <div style={{ fontSize: '10px', color: '#9e9e9e', marginTop: '2px' }}>
                {hour}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '4px',
        }} className="heatmap-mobile">
          {hourlyDistribution.map((count, hour) => (
            <div key={hour} style={{ textAlign: 'center' }}>
              <div
                title={`${hour}:00 - ${count}次提交`}
                style={{
                  height: '28px',
                  background: getHeatColor(count),
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: getTextColor(count),
                  border: '1px solid #e0e0e0',
                }}
              >
                {count > 0 ? count : ''}
              </div>
              <div style={{ fontSize: '9px', color: '#9e9e9e', marginTop: '2px' }}>
                {hour}时
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '12px', fontSize: '11px', color: '#757575' }}>
          <span>少</span>
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
            <div key={i} style={{
              width: '20px', height: '14px', borderRadius: '3px',
              background: `rgb(${227 - (227 - 21) * r}, ${242 - (242 - 101) * r}, ${253 - (253 - 192) * r})`,
              border: '1px solid #e0e0e0',
            }} />
          ))}
          <span>多</span>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .heatmap-desktop { display: none !important; }
          .heatmap-mobile { display: grid !important; }
        }
        @media (min-width: 769px) {
          .heatmap-mobile { display: none !important; }
          .heatmap-desktop { display: grid !important; }
        }
      `}</style>
    </>
  );
};

export default StatsCharts;
