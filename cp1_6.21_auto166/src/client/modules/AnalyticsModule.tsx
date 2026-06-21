import React from 'react';

const AnalyticsModule: React.FC = () => {
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">数据看板</h1>
        <p className="page-subtitle">查看活动数据分析与统计报表</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">总活动数</div>
          <div className="stat-value blue">48</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">总参与人次</div>
          <div className="stat-value purple">1,286</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">本月新增</div>
          <div className="stat-value green">+156</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">活跃率</div>
          <div className="stat-value orange">72.5%</div>
        </div>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="stat-card">
          <div className="stat-label">活动类型分布</div>
          <div style={{ marginTop: '16px' }}>
            {[
              { label: '线上会议', value: 35, color: '#3B82F6' },
              { label: '线下聚会', value: 28, color: '#8B5CF6' },
              { label: '培训课程', value: 22, color: '#10B981' },
              { label: '其他', value: 15, color: '#F59E0B' },
            ].map((item) => (
              <div key={item.label} style={{ marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ color: '#94A3B8', fontSize: '13px' }}>{item.label}</span>
                  <span style={{ color: '#E2E8F0', fontSize: '13px', fontWeight: 500 }}>{item.value}%</span>
                </div>
                <div style={{ height: '8px', background: '#334155', borderRadius: '4px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${item.value}%`,
                      background: item.color,
                      borderRadius: '4px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">近7天参与趋势</div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px' }}>
            {[45, 62, 38, 71, 55, 89, 67].map((value, idx) => (
              <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '100%',
                    height: `${(value / 100) * 100}%`,
                    background: 'linear-gradient(180deg, #3B82F6, #8B5CF6)',
                    borderRadius: '6px 6px 0 0',
                    minHeight: '4px',
                  }}
                />
                <span style={{ color: '#64748B', fontSize: '11px' }}>{['一', '二', '三', '四', '五', '六', '日'][idx]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <h3 style={{ marginBottom: '16px' }}>热门活动排行</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155' }}>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94A3B8', fontWeight: 500, fontSize: '13px' }}>排名</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94A3B8', fontWeight: 500, fontSize: '13px' }}>活动名称</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94A3B8', fontWeight: 500, fontSize: '13px' }}>参与人数</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', color: '#94A3B8', fontWeight: 500, fontSize: '13px' }}>满意度</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: '2026年度技术分享大会', count: 256, rate: 96 },
                { name: '新员工入职培训营', count: 189, rate: 92 },
                { name: '产品设计工作坊', count: 142, rate: 89 },
                { name: '团队建设户外活动', count: 98, rate: 94 },
              ].map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #1E293B' }}>
                  <td style={{ padding: '14px 8px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        background: idx < 3 ? 'linear-gradient(135deg, #3B82F6, #8B5CF6)' : '#334155',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFF',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      {idx + 1}
                    </span>
                  </td>
                  <td style={{ padding: '14px 8px', color: '#E2E8F0' }}>{item.name}</td>
                  <td style={{ padding: '14px 8px', color: '#94A3B8' }}>{item.count} 人</td>
                  <td style={{ padding: '14px 8px' }}>
                    <span style={{ color: '#10B981', fontWeight: 500 }}>{item.rate}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsModule;
