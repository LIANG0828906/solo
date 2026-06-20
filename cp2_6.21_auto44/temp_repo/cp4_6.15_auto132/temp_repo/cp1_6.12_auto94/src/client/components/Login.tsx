import React, { useState } from 'react';

const COLORS = [
  '#5c7cfa',
  '#40c057',
  '#fa5252',
  '#be4bdb',
  '#fd7e14',
  '#22b8cf',
  '#fcc419',
  '#e64980',
];

function getRandomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

interface LoginProps {
  onLogin: (nickname: string, teamName: string, color: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [nickname, setNickname] = useState('');
  const [teamName, setTeamName] = useState('');
  const [color, setColor] = useState(getRandomColor());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim() && teamName.trim()) {
      onLogin(nickname.trim(), teamName.trim(), color);
    }
  };

  const regenerateColor = () => {
    setColor(getRandomColor());
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>🎨 团队头脑风暴</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>昵称</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="请输入您的昵称"
              maxLength={20}
            />
          </div>
          <div className="form-group">
            <label>团队名称</label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="请输入团队名称加入房间"
              maxLength={30}
            />
          </div>
          <div className="form-group">
            <label>
              您的标识色
              <span className="color-preview" style={{ backgroundColor: color }} />
              <button
                type="button"
                onClick={regenerateColor}
                style={{
                  marginLeft: '10px',
                  padding: '4px 10px',
                  background: 'transparent',
                  border: '1px solid #3a3a5c',
                  borderRadius: '4px',
                  color: '#b0b0b0',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                换一个
              </button>
            </label>
          </div>
          <button type="submit" className="login-btn" disabled={!nickname.trim() || !teamName.trim()}>
            加入团队
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
