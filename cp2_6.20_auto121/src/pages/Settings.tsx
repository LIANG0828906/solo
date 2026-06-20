import React from 'react';
import { useUserStore } from '../stores/userStore';

const Settings: React.FC = () => {
  const user = useUserStore((s) => s.user);
  const updateNickname = useUserStore((s) => s.updateNickname);
  const [nickname, setNickname] = React.useState(user?.nickname || '');

  return (
    <div className="settings-page">
      <h2>设置</h2>
      <div className="settings-item">
        <label>昵称</label>
        <input value={nickname} onChange={(e) => setNickname(e.target.value)} />
      </div>
      <div className="settings-item">
        <label>头像</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img
            src={user?.avatar}
            alt="avatar"
            style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
          />
          <span style={{ color: '#95a5a6', fontSize: 13 }}>暂不支持修改头像</span>
        </div>
      </div>
      <div className="settings-item">
        <label>通知偏好</label>
        <div style={{ display: 'flex', gap: 16, fontSize: 14, color: '#555' }}>
          <label><input type="checkbox" defaultChecked /> 书评回复通知</label>
          <label><input type="checkbox" defaultChecked /> 辩论更新通知</label>
        </div>
      </div>
      <button className="settings-save-btn" onClick={() => updateNickname(nickname)}>
        保存设置
      </button>
    </div>
  );
};

export default Settings;
