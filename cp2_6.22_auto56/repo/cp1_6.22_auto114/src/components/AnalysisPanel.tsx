import React, { useMemo } from 'react';
import { ColorData } from '../data/sampleImages';
import { getContrastColor } from '../utils/colorAnalysis';

interface AnalysisPanelProps {
  colors: ColorData[] | null;
  averageColor: string;
  imageTitle: string;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ colors, averageColor, imageTitle }) => {
  const sortedColors = useMemo(() => {
    if (!colors) return null;
    return [...colors].sort((a, b) => b.percentage - a.percentage);
  }, [colors]);

  const renderDonutChart = (colorList: ColorData[]) => {
    const size = 200;
    const radius = 80;
    const innerRadius = 50;
    const center = size / 2;
    let cumulativeAngle = -Math.PI / 2;

    const paths = colorList.map((color, idx) => {
      const angle = (color.percentage / 100) * 2 * Math.PI;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle = endAngle;

      const x1 = center + radius * Math.cos(startAngle);
      const y1 = center + radius * Math.sin(startAngle);
      const x2 = center + radius * Math.cos(endAngle);
      const y2 = center + radius * Math.sin(endAngle);
      const x3 = center + innerRadius * Math.cos(endAngle);
      const y3 = center + innerRadius * Math.sin(endAngle);
      const x4 = center + innerRadius * Math.cos(startAngle);
      const y4 = center + innerRadius * Math.sin(startAngle);

      const largeArcFlag = angle > Math.PI ? 1 : 0;

      const pathData = [
        `M ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
        'Z'
      ].join(' ');

      return (
        <path
          key={idx}
          d={pathData}
          fill={color.hex}
          style={{
            transformOrigin: `${center}px ${center}px`,
            transition: 'opacity 0.2s ease'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as SVGPathElement).style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as SVGPathElement).style.opacity = '1';
          }}
        >
          <title>{`${color.name} ${color.percentage}%`}</title>
        </path>
      );
    });

    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="ring-animate"
        style={{ display: 'block' }}
      >
        {paths}
        <circle cx={center} cy={center} r={innerRadius - 2} fill="white" />
        <text
          x={center}
          y={center - 6}
          textAnchor="middle"
          style={{ fontSize: '12px', fill: '#999' }}
        >
          主色调
        </text>
        <text
          x={center}
          y={center + 14}
          textAnchor="middle"
          style={{ fontSize: '16px', fontWeight: 600, fill: '#333' }}
        >
          {colorList.length} 色
        </text>
      </svg>
    );
  };

  if (!sortedColors) {
    return (
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
          textAlign: 'center',
          color: '#999'
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎨</div>
        <div style={{ fontSize: '15px' }}>点击「分析主色调」按钮开始分析</div>
        <div style={{ fontSize: '13px', marginTop: '6px', color: '#BBB' }}>
          当前图片：{imageTitle || '未选择'}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
      }}
    >
      <div
        style={{
          fontSize: '16px',
          fontWeight: 600,
          marginBottom: '20px',
          color: '#333',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        <span style={{ display: 'inline-block', width: '4px', height: '18px', background: '#4A90D9', borderRadius: '2px' }} />
        主色调分析 · {imageTitle}
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1', minWidth: '280px' }}>
          <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px', fontWeight: 500 }}>
            占比条形图
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {sortedColors.map((color, idx) => (
              <div key={idx}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '4px'
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '4px',
                      background: color.hex,
                      border: '1px solid rgba(0,0,0,0.1)',
                      flexShrink: 0
                    }}
                  />
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#333', flex: 1 }}>
                    {color.name}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      color: getContrastColor(color.hex),
                      background: color.hex,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(0,0,0,0.08)'
                    }}
                  >
                    {color.hex.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#555', width: '42px', textAlign: 'right' }}>
                    {color.percentage}%
                  </span>
                </div>
                <div
                  style={{
                    height: '18px',
                    background: '#F5F5F5',
                    borderRadius: '9px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${color.percentage}%`,
                      height: '100%',
                      background: color.hex,
                      borderRadius: '9px',
                      transition: 'width 0.5s ease',
                      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: '20px',
              padding: '16px',
              background: '#FAFAFA',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '10px',
                background: averageColor,
                border: '2px solid white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                flexShrink: 0
              }}
            />
            <div>
              <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>平均色</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#333', letterSpacing: '1px' }}>
                {averageColor.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            minWidth: '220px'
          }}
        >
          <div style={{ fontSize: '13px', color: '#888', fontWeight: 500, alignSelf: 'flex-start' }}>
            环形色盘
          </div>
          <div
            style={{
              padding: '12px',
              background: '#FAFAFA',
              borderRadius: '12px',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)'
            }}
          >
            {renderDonutChart(sortedColors)}
          </div>

          <div style={{ width: '100%' }}>
            <div style={{ fontSize: '13px', color: '#888', marginBottom: '10px', fontWeight: 500 }}>
              颜色名称列表
            </div>
            <div
              style={{
                background: '#FAFAFA',
                borderRadius: '10px',
                padding: '12px 16px'
              }}
            >
              {sortedColors.map((color, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 0',
                    borderBottom: idx < sortedColors.length - 1 ? '1px solid #EEEEEE' : 'none',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#666',
                        width: '18px'
                      }}
                    >
                      {idx + 1}.
                    </span>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '3px',
                        background: color.hex,
                        border: '1px solid rgba(0,0,0,0.1)'
                      }}
                    />
                    <span style={{ fontSize: '14px', color: '#333', fontWeight: 500 }}>
                      {color.name}
                    </span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#4A90D9' }}>
                    {color.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
