import { useState } from 'react';
import { Users, Building2 } from 'lucide-react';

interface LoginPanelProps {
  onJoin: (nickname: string, roomId: string) => void;
}

export function LoginPanel({ onJoin }: LoginPanelProps) {
  const [nickname, setNickname] = useState('');
  const [roomId, setRoomId] = useState('');
  const [errors, setErrors] = useState<{ nickname?: string; roomId?: string }>({});

  const validate = () => {
    const newErrors: { nickname?: string; roomId?: string } = {};

    if (nickname.length < 2 || nickname.length > 8) {
      newErrors.nickname = '昵称长度需为2-8个字符';
    }
    if (!/^\d{4}$/.test(roomId)) {
      newErrors.roomId = '房间号必须为4位数字';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onJoin(nickname.trim(), roomId);
    }
  };

  return (
    <div
      className="login-container"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-50%',
          left: '-50%',
          width: '200%',
          height: '200%',
          background: `
            radial-gradient(circle at 30% 20%, rgba(52, 152, 219, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 70% 80%, rgba(155, 89, 182, 0.15) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(26, 188, 156, 0.1) 0%, transparent 50%)
          `,
          animation: 'float 20s ease-in-out infinite',
        }}
      />

      <div
        className="login-card"
        style={{
          background: 'rgba(30, 39, 58, 0.85)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '40px',
          width: '100%',
          maxWidth: '400px',
          zIndex: 10,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          animation: 'fadeIn 0.5s ease-out',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 16px',
              background: 'linear-gradient(135deg, #3498DB, #9B59B6)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 20px rgba(52, 152, 219, 0.4)',
            }}
          >
            <Building2 size={32} color="#fff" />
          </div>
          <h1
            style={{
              color: '#fff',
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '8px',
              background: 'linear-gradient(135deg, #3498DB, #1ABC9C)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            三维协同批注系统
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
            多人实时协作 · 历史回溯 · 直观标记
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '13px',
                marginBottom: '8px',
                fontWeight: 500,
              }}
            >
              用户昵称
            </label>
            <div style={{ position: 'relative' }}>
              <Users
                size={18}
                color="rgba(255,255,255,0.4)"
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                }}
              />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="请输入昵称（2-8字符）"
                maxLength={8}
                style={{
                  width: '100%',
                  padding: '12px 12px 12px 40px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: errors.nickname
                    ? '1px solid #E74C3C'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => {
                  if (!errors.nickname) {
                    e.target.style.borderColor = '#3498DB';
                  }
                }}
                onBlur={(e) => {
                  if (!errors.nickname) {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              />
            </div>
            {errors.nickname && (
              <p style={{ color: '#E74C3C', fontSize: '12px', marginTop: '6px' }}>
                {errors.nickname}
              </p>
            )}
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label
              style={{
                display: 'block',
                color: 'rgba(255, 255, 255, 0.8)',
                fontSize: '13px',
                marginBottom: '8px',
                fontWeight: 500,
              }}
            >
              房间号
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="请输入4位数字房间号"
                maxLength={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: errors.roomId
                    ? '1px solid #E74C3C'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                  fontSize: '16px',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  fontFamily: 'inherit',
                  fontWeight: 600,
                }}
                onFocus={(e) => {
                  if (!errors.roomId) {
                    e.target.style.borderColor = '#3498DB';
                  }
                }}
                onBlur={(e) => {
                  if (!errors.roomId) {
                    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  }
                }}
              />
            </div>
            {errors.roomId && (
              <p style={{ color: '#E74C3C', fontSize: '12px', marginTop: '6px' }}>
                {errors.roomId}
              </p>
            )}
          </div>

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #3498DB, #9B59B6)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(52, 152, 219, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(52, 152, 219, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 15px rgba(52, 152, 219, 0.3)';
            }}
          >
            加入 / 创建房间
          </button>
        </form>

        <p
          style={{
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '12px',
            marginTop: '20px',
          }}
        >
          输入相同房间号即可加入同一房间协作
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-2%, -2%); }
        }
      `}</style>
    </div>
  );
}
