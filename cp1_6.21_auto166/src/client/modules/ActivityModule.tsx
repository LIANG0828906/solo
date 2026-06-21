import React from 'react';
import { useActivity } from '../context/ActivityContext';

const ActivityModule: React.FC = () => {
  const { currentActivityId, participants } = useActivity();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">活动管理</h1>
        <p className="page-subtitle">参与和创建各类活动</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">当前活动</div>
          <div className="stat-value blue">
            {currentActivityId ? '进行中' : '暂无'}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">参与人数</div>
          <div className="stat-value purple">{participants.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">可参与活动</div>
          <div className="stat-value green">12</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">已创建活动</div>
          <div className="stat-value orange">3</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '16px' }}>参与活动</h3>
        <p style={{ marginBottom: '20px' }}>浏览并参与感兴趣的活动，与其他参与者互动交流。</p>

        <div className="form-group">
          <label className="form-label">活动邀请码</label>
          <input type="text" placeholder="请输入6位邀请码" maxLength={6} />
        </div>

        <div className="btn-group">
          <button>参与活动</button>
          <button className="btn-secondary">创建新活动</button>
        </div>
      </div>

      {participants.length > 0 && (
        <div className="card" style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '16px' }}>参与者列表</h3>
          <ul style={{ listStyle: 'none' }}>
            {participants.map((p) => (
              <li
                key={p.id}
                style={{
                  padding: '12px 0',
                  borderBottom: '1px solid #334155',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ color: '#E2E8F0', fontWeight: 500 }}>{p.name}</div>
                  <div style={{ color: '#64748B', fontSize: '13px' }}>{p.email}</div>
                </div>
                <div style={{ color: '#64748B', fontSize: '12px' }}>
                  {new Date(p.joinedAt).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ActivityModule;
