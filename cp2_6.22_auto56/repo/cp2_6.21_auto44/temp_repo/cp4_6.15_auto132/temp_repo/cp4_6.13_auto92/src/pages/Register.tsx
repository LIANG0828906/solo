import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import { User } from '@/types';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { request } = useApi();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'instructor'>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('请填写所有必填字段');
      return;
    }
    if (password.length < 6) {
      setError('密码至少需要6位字符');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await request<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password, role }),
        requireAuth: false,
      });
      login(data.token, data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '440px',
      margin: '40px auto',
      background: '#fff',
      borderRadius: '16px',
      padding: '40px',
      border: '2px solid #E8DCC8',
      boxShadow: '0 4px 20px rgba(139, 94, 60, 0.1)',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{
          width: '60px',
          height: '60px',
          background: '#E67E22',
          borderRadius: '50%',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '28px',
          fontWeight: 'bold',
          marginBottom: '16px',
        }}>
          手
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#E67E22', marginBottom: '8px' }}>创建账号</h2>
        <p style={{ fontSize: '14px', color: '#8B5E3C' }}>加入手工坊社区，发现更多精彩</p>
      </div>

      {error && (
        <div style={{
          background: '#FDEDEC',
          color: '#E74C3C',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>
            用户名
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入您的昵称"
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '10px',
              border: '2px solid #E8DCC8',
              fontSize: '15px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>
            邮箱地址
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="请输入您的邮箱"
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '10px',
              border: '2px solid #E8DCC8',
              fontSize: '15px',
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#555', marginBottom: '8px' }}>
            密码
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="至少6位字符"
            style={{
              width: '100%',
              padding: '14px 16px',
              borderRadius: '10px',
              border: '2px solid #E8DCC8',
              fontSize: '15px',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#555', marginBottom: '12px' }}>
            身份选择
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setRole('student')}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '10px',
                border: role === 'student' ? '2px solid #E67E22' : '2px solid #E8DCC8',
                background: role === 'student' ? '#FFF5E6' : '#fff',
                color: role === 'student' ? '#E67E22' : '#666',
                fontSize: '14px',
                fontWeight: role === 'student' ? '600' : 'normal',
              }}
            >
              🎨 学员
            </button>
            <button
              type="button"
              onClick={() => setRole('instructor')}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '10px',
                border: role === 'instructor' ? '2px solid #E67E22' : '2px solid #E8DCC8',
                background: role === 'instructor' ? '#FFF5E6' : '#fff',
                color: role === 'instructor' ? '#E67E22' : '#666',
                fontSize: '14px',
                fontWeight: role === 'instructor' ? '600' : 'normal',
              }}
            >
              🛠️ 手工艺人
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            borderRadius: '10px',
            background: loading ? '#F5B77A' : '#E67E22',
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600',
            marginBottom: '16px',
          }}
        >
          {loading ? '注册中...' : '注册账号'}
        </button>
      </form>

      <div style={{ textAlign: 'center', fontSize: '14px', color: '#666' }}>
        已有账号？
        <Link to="/login" style={{ color: '#E67E22', fontWeight: '600', marginLeft: '4px' }}>
          立即登录
        </Link>
      </div>
    </div>
  );
};

export default Register;
