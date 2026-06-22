import React from 'react';

const Dashboard: React.FC = () => {
  const stats = [
    { label: '总任务数', value: '156', color: '#fff' },
    { label: '待标注数', value: '42', color: '#FFA726' },
    { label: '待审核数', value: '28', color: '#42A5F5' },
    { label: '完成率', value: '82.1%', color: '#66BB6A' },
  ];

  return (
    <div style={{ padding: 24, overflow: 'auto', height: '100%' }}>
      <h2 style={{ color: '#fff', marginBottom: 24, fontSize: 20 }}>数据看板</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: 'rgba(55, 71, 79, 0.8)',
              borderRadius: 8,
              padding: 24,
            }}
          >
            <div style={{ color: '#90A4AE', fontSize: 13, marginBottom: 8 }}>{stat.label}</div>
            <div style={{ color: stat.color, fontSize: 32, fontWeight: 'bold' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div
          style={{
            backgroundColor: '#37474F',
            borderRadius: 8,
            padding: 24,
            minHeight: 300,
          }}
        >
          <h3 style={{ color: '#fff', fontSize: 15, marginBottom: 16 }}>任务状态分布</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, color: '#90A4AE' }}>
            环形图占位
          </div>
        </div>
        <div
          style={{
            backgroundColor: '#37474F',
            borderRadius: 8,
            padding: 24,
            minHeight: 300,
          }}
        >
          <h3 style={{ color: '#fff', fontSize: 15, marginBottom: 16 }}>近7日新增标注量</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 240, color: '#90A4AE' }}>
            折线图占位
          </div>
        </div>
      </div>

      <div
        style={{
          backgroundColor: '#37474F',
          borderRadius: 8,
          padding: 24,
          minHeight: 280,
        }}
      >
        <h3 style={{ color: '#fff', fontSize: 15, marginBottom: 16 }}>审核员通过率</h3>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220, color: '#90A4AE' }}>
          柱状图占位
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
