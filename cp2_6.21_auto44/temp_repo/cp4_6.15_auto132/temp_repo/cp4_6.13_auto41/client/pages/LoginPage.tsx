import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomId.trim() || !username.trim()) {
      alert('请输入房间号和昵称');
      return;
    }
    
    if (!/^\d{4}$/.test(roomId)) {
      alert('房间号必须是4位数字');
      return;
    }
    
    localStorage.setItem('username', username.trim());
    navigate(`/board/${roomId.trim()}`);
  };

  const generateRoomId = () => {
    const id = Math.floor(1000 + Math.random() * 9000).toString();
    setRoomId(id);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">协作白板</h1>
        <p className="login-subtitle">实时协作，创意无限</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">房间号</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="输入4位数字房间号"
                maxLength={4}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={generateRoomId}
                style={{
                  padding: '0 16px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#a0aec0',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.color = '#f7fafc';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = '#a0aec0';
                }}
              >
                随机
              </button>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">昵称</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="输入你的昵称"
              maxLength={20}
            />
          </div>
          
          <button type="submit" className="btn-primary">
            加入房间
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
