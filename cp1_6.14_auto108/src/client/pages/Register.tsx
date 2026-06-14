import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../api';

interface User {
  id: string;
  email: string;
  name: string;
  avatarColor: string;
}

interface RegisterProps {
  onRegister: (user: User, token: string) => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #F5F0EB 0%, #E8E0D8 100%)',
  padding: '20px',
};

const cardStyle: React.CSSProperties = {
  background: 'white',
  borderRadius: '20px',
  padding: '40px',
  width: '100%',
  maxWidth: '420px',
  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
  animation: 'slideUp 0.5s ease',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '32px',
};

const logoStyle: React.CSSProperties = {
  fontSize: '3rem',
  marginBottom: '12px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '1.75rem',
  fontWeight: 700,
  color: '#3B4A6B',
  marginBottom: '8px',
};

const subtitleStyle: React.CSSProperties = {
  color: '#718096',
  fontSize: '0.95rem',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '18px',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontWeight: 500,
  color: '#2D3748',
  fontSize: '0.9rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  fontSize: '1rem',
  borderRadius: '10px',
};

const btnStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px',
  fontSize: '1rem',
  fontWeight: 600,
  borderRadius: '10px',
  background: 'linear-gradient(135deg, #3B4A6B, #5A6B8C)',
  color: 'white',
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  marginTop: '8px',
};

const footerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginTop: '24px',
  color: '#718096',
  fontSize: '0.9rem',
};

const linkStyle: React.CSSProperties = {
  color: '#3B4A6B',
  fontWeight: 600,
  textDecoration: 'none',
  marginLeft: '4px',
};

export default function Register({ onRegister, showToast }: RegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      showToast('请填写所有字段', 'error');
      return;
    }
    if (password.length < 6) {
      showToast('密码长度至少6位', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.register({ name, email, password });
      onRegister(res.user, res.token);
      showToast('注册成功', 'success');
      navigate('/dashboard');
    } catch (err: any) {
      showToast(err.response?.data?.error || '注册失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div className="card" style={cardStyle}>
        <div style={headerStyle}>
          <div style={logoStyle}>✎</div>
          <h1 style={titleStyle}>创建账户</h1>
          <p style={subtitleStyle}>开始你的创意写作之旅</p>
        </div>

        <form style={formStyle} onSubmit={handleSubmit}>
          <div>
            <label style={labelStyle}>昵称</label>
            <input
              type="text"
              style={inputStyle}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入昵称"
            />
          </div>

          <div>
            <label style={labelStyle}>邮箱</label>
            <input
              type="email"
              style={inputStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
            />
          </div>

          <div>
            <label style={labelStyle}>密码</label>
            <input
              type="password"
              style={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码（至少6位）"
            />
          </div>

          <button
            type="submit"
            style={btnStyle}
            disabled={loading}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = 'linear-gradient(135deg, #C99A3E, #E8B85C)';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(201, 154, 62, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #3B4A6B, #5A6B8C)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {loading ? '注册中...' : '注 册'}
          </button>
        </form>

        <div style={footerStyle}>
          已有账户？
          <Link to="/login" style={linkStyle}>立即登录</Link>
        </div>
      </div>
    </div>
  );
}
