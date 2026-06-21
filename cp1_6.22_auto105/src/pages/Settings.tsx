import React from 'react';

const Settings: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '24px', color: '#111827' }}>
        设置
      </h2>
      <p style={{ color: '#6B7280', lineHeight: 1.6 }}>
        这里是设置页面，您可以在这里配置应用的各项参数。
      </p>
      <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
        <p style={{ fontSize: '0.875rem', color: '#4B5563' }}>
          更多设置功能正在开发中...
        </p>
      </div>
    </div>
  );
};

export default Settings;
