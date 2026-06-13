import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, authApi } from '../api'

interface RegisterProps {
  setUser: (user: User) => void
}

function Register({ setUser }: RegisterProps) {
  const [username, setUsername] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!username || username.length < 3 || username.length > 20) {
      errs.username = '用户名长度需在3-20个字符之间'
    }
    if (!nickname) {
      errs.nickname = '请输入昵称'
    }
    if (!password || password.length < 6) {
      errs.password = '密码长度不能少于6位'
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = '两次输入的密码不一致'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const data = await authApi.register({ username, password, nickname })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      setUser(data.user)
      navigate('/')
    } catch (err: any) {
      const msg = err.response?.data?.message || '注册失败，请重试'
      setErrors({ submit: msg })
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: `
        radial-gradient(ellipse at 20% 20%, rgba(212, 167, 106, 0.3) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, rgba(139, 111, 71, 0.25) 0%, transparent 50%),
        linear-gradient(135deg, var(--cream) 0%, var(--light-beige) 50%, var(--cream-dark) 100%)
      `
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '440px',
        padding: '48px 40px',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(32px) saturate(180%)',
        WebkitBackdropFilter: 'blur(32px) saturate(180%)',
        border: '1px solid var(--glass-border)',
        animation: 'scaleIn 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '56px', marginBottom: '12px' }}>✨</div>
          <h1 style={{
            fontSize: '28px',
            fontWeight: 700,
            background: 'linear-gradient(135deg, var(--warm-brown) 0%, var(--warm-coffee) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '6px'
          }}>
            加入旧物新语
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            让旧物在新的地方延续温暖
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label className="label">用户名</label>
            <input
              className="input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="3-20个字符"
            />
            {errors.username && (
              <div style={{ color: '#F56C6C', fontSize: '12px', marginTop: '6px' }}>{errors.username}</div>
            )}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label className="label">昵称</label>
            <input
              className="input"
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="给自己取个好听的名字"
            />
            {errors.nickname && (
              <div style={{ color: '#F56C6C', fontSize: '12px', marginTop: '6px' }}>{errors.nickname}</div>
            )}
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label className="label">密码</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="至少6位"
              autoComplete="new-password"
            />
            {errors.password && (
              <div style={{ color: '#F56C6C', fontSize: '12px', marginTop: '6px' }}>{errors.password}</div>
            )}
          </div>
          <div style={{ marginBottom: '12px' }}>
            <label className="label">确认密码</label>
            <input
              className="input"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="再次输入密码"
              autoComplete="new-password"
            />
            {errors.confirmPassword && (
              <div style={{ color: '#F56C6C', fontSize: '12px', marginTop: '6px' }}>{errors.confirmPassword}</div>
            )}
          </div>

          {errors.submit && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(245, 108, 108, 0.1)',
              border: '1px solid rgba(245, 108, 108, 0.25)',
              borderRadius: '10px',
              color: '#F56C6C',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              {errors.submit}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', padding: '14px', fontSize: '15px' }}
          >
            {loading ? '注册中...' : '注 册'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '28px',
          fontSize: '14px',
          color: 'var(--text-secondary)'
        }}>
          已有账号？
          <Link to="/login" style={{
            color: 'var(--warm-coffee)',
            fontWeight: 600,
            textDecoration: 'none',
            marginLeft: '4px'
          }}>
            返回登录
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register
