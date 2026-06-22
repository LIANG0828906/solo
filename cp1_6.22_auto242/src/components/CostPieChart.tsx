import React from 'react';
import type { CostReportItem } from '../types';
import { FAMILY_COLORS } from '../types';

interface CostPieChartProps {
  items: CostReportItem[];
  size?: number;
}

const CostPieChart: React.FC<CostPieChartProps> = ({ items, size = 200 }) => {
  const totalCost = items.reduce((sum, item) => sum + item.cost, 0);
  
  if (totalCost === 0 || items.length === 0) {
    return (
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: '#F0EBE0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#A6967C',
        fontSize: '14px',
        fontFamily: "'Inter', sans-serif",
      }}>
        暂无数据
      </div>
    );
  }

  let currentAngle = -90;
  
  const colors = items.map((_, i) => {
    const palette = ['#C9A96E', '#7C9A73', '#D4A373', '#8B7355', '#A68DAD', '#7EC8E3', '#E8B4B8', '#F4D35E'];
    return palette[i % palette.length];
  });

  return (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        background: `conic-gradient(${items.map((item, i) => {
          const angle = (item.cost / totalCost) * 360;
          const startAngle = currentAngle;
          currentAngle += angle;
          return `${colors[i]} ${startAngle + 90}deg ${startAngle + angle + 90}deg`;
        }).join(', ')})`,
      }}>
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 0.6,
          height: size * 0.6,
          borderRadius: '50%',
          backgroundColor: '#FDFBF7',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            fontSize: '12px',
            color: '#8B7355',
            fontFamily: "'Inter', sans-serif",
          }}>
            总成本
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#3C2415',
            fontFamily: "'Playfair Display', serif",
          }}>
            ¥{totalCost.toFixed(2)}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {items.map((item, i) => (
          <div key={item.id} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            fontSize: '12px',
            fontFamily: "'Inter', sans-serif",
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              borderRadius: '2px',
              backgroundColor: colors[i],
              flexShrink: 0,
            }} />
            <span style={{ color: '#3C2415', minWidth: '60px' }}>{item.name}</span>
            <span style={{ color: '#8B7355' }}>¥{item.cost.toFixed(2)}</span>
            <span style={{ color: '#A6967C' }}>
              {totalCost > 0 ? ((item.cost / totalCost) * 100).toFixed(1) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CostPieChart;
