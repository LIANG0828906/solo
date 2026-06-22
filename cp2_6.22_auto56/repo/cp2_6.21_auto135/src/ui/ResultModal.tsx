import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import {
  EngineState,
  CivilizationType,
  Resources,
  ResourceType,
  CIVILIZATION_NAMES,
  CIVILIZATION_COLORS,
  RESOURCE_NAMES,
} from '../engine/types';

interface ResultModalProps {
  engineState: EngineState;
  onClose: () => void;
  calculateTotalAssets: (resources: Resources) => number;
}

const ResultModal: React.FC<ResultModalProps> = ({
  engineState,
  onClose,
  calculateTotalAssets,
}) => {
  const civIds: CivilizationType[] = ['elf', 'dwarf', 'human'];
  const resourceTypes: ResourceType[] = ['wood', 'ore', 'food', 'gold'];

  const barChartData = resourceTypes.map((res) => {
    const item: Record<string, string | number> = { resource: RESOURCE_NAMES[res] };
    civIds.forEach((civId) => {
      item[CIVILIZATION_NAMES[civId]] = engineState.civilizations[civId].resources[res];
    });
    return item;
  });

  const rankings = civIds
    .map((civId) => ({
      id: civId,
      name: CIVILIZATION_NAMES[civId],
      color: CIVILIZATION_COLORS[civId],
      totalAssets: calculateTotalAssets(engineState.civilizations[civId].resources),
      resources: engineState.civilizations[civId].resources,
    }))
    .sort((a, b) => b.totalAssets - a.totalAssets);

  const maxAssets = rankings[0]?.totalAssets || 1;

  const barColors = [
    CIVILIZATION_COLORS.elf,
    CIVILIZATION_COLORS.dwarf,
    CIVILIZATION_COLORS.human,
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#16213e',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '700px',
          width: '90%',
          maxHeight: '85vh',
          overflowY: 'auto',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: '0 0 24px 0',
            textAlign: 'center',
            fontSize: '24px',
            fontWeight: 600,
          }}
        >
          🏆 谈判结果汇总
        </h2>

        <div
          style={{
            marginBottom: '24px',
            height: '300px',
          }}
        >
          <h3
            style={{
              margin: '0 0 12px 0',
              fontSize: '16px',
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            最终资源对比
          </h3>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={barChartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a3a5a" />
              <XAxis
                dataKey="resource"
                stroke="#e0e0e0"
                tick={{ fill: '#e0e0e0', fontSize: 12 }}
              />
              <YAxis
                stroke="#e0e0e0"
                tick={{ fill: '#e0e0e0', fontSize: 12 }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a2a4a',
                  border: '1px solid #2a3a5a',
                  borderRadius: '8px',
                  color: '#e0e0e0',
                }}
                itemStyle={{ color: '#e0e0e0' }}
                labelStyle={{ color: '#e0e0e0', fontWeight: 'bold' }}
              />
              <Legend
                wrapperStyle={{ color: '#e0e0e0' }}
                formatter={(value: string) => (
                  <span style={{ color: '#e0e0e0' }}>{value}</span>
                )}
              />
              {civIds.map((civId, index) => (
                <Bar
                  key={civId}
                  dataKey={CIVILIZATION_NAMES[civId]}
                  fill={barColors[index]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3
            style={{
              margin: '0 0 16px 0',
              fontSize: '16px',
              fontWeight: 500,
              textAlign: 'center',
            }}
          >
            总资产排名
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rankings.map((item, index) => {
              const percentage = (item.totalAssets / maxAssets) * 100;
              const diffWithFirst =
                index === 0 ? 0 : rankings[0].totalAssets - item.totalAssets;

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    border: `1px solid ${item.color}33`,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          backgroundColor: item.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 'bold',
                          fontSize: '14px',
                        }}
                      >
                        {index + 1}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: '15px' }}>{item.name}</span>
                    </div>
                    <span style={{ fontWeight: 600, color: item.color, fontSize: '16px' }}>
                      {item.totalAssets.toFixed(1)} 金币
                    </span>
                  </div>

                  <div
                    style={{
                      height: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${percentage}%`,
                        backgroundColor: item.color,
                        borderRadius: '3px',
                        transition: 'width 0.5s ease',
                      }}
                    />
                  </div>

                  {index > 0 && (
                    <div style={{ fontSize: '12px', color: '#888', textAlign: 'right' }}>
                      与第1名相差: {diffWithFirst.toFixed(1)} 金币
                    </div>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: '#aaa',
                      flexWrap: 'wrap',
                      gap: '4px',
                    }}
                  >
                    {resourceTypes.map((res) => (
                      <span key={res}>
                        {RESOURCE_NAMES[res]}: {item.resources[res]}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: '100%',
            padding: '14px',
            background: 'linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%)',
            color: '#e0e0e0',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'filter 0.1s ease, transform 0.1s ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.15)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1)';
          }}
          onMouseDown={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)';
          }}
          onMouseUp={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
          }}
        >
          关闭
        </button>
      </div>
    </div>
  );
};

export default ResultModal;
