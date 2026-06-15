import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { useAuthStore } from '../modules/auth/useAuthStore'

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const mode = searchParams.get('mode') || 'login'
  const [isLogin, setIsLogin] = useState(mode === 'login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, register, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/galleries')
    }
  }, [isAuthenticated])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) {
      setError('请填写完整信息')
      return
    }
    if (!isLogin) {
      if (!username.trim()) {
        setError('请填写用户名')
        return
      }
      if (password.length < 6) {
        setError('密码至少 6 位')
        return
      }
      if (password !== confirmPassword) {
        setError('两次密码不一致')
        return
      }
    }
    setLoading(true)
    let success = false
    if (isLogin) {
      success = await login(email.trim(), password)
      if (!success) setError('邮箱或密码错误')
    } else {
      success = await register(username.trim(), email.trim(), password)
      if (!success) setError('该邮箱已被注册')
    }
    setLoading(false)
    if (success) navigate('/galleries')
  }

  const switchMode = () => {
    setIsLogin(!isLogin)
    setError('')
    setUsername('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    navigate(`/auth?mode=${!isLogin ? 'login' : 'register'}`, { replace: true })
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'linear-gradient(135deg, #fafbff 0%, #fff5fa 100%)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#fff',
          borderRadius: '28px',
          padding: '48px 40px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.08)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <span style={{ fontSize: '40px' }}>🎨</span>
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', letterSpacing: '-0.5px' }}>
            {isLogin ? '欢迎回来' : '加入 ArtVault'}
          </h1>
          <p style={{ fontSize: '14px', color: '#888' }}>
            {isLogin ? '登录以继续探索艺术世界' : '创建账户，开启你的虚拟艺术馆之旅'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: '#444' }}>
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="例如：艺术爱好者"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e5e5e5',
                  fontSize: '14px',
                  background: '#fafafa',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#6366F1'
                  e.currentTarget.style.background = '#fff'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e5e5'
                  e.currentTarget.style.background = '#fafafa'
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: '#444' }}>
              邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid #e5e5e5',
                fontSize: '14px',
                background: '#fafafa',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#6366F1'
                e.currentTarget.style.background = '#fff'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e5e5'
                e.currentTarget.style.background = '#fafafa'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: '#444' }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? '输入你的密码' : '至少 6 个字符'}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid #e5e5e5',
                fontSize: '14px',
                background: '#fafafa',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#6366F1'
                e.currentTarget.style.background = '#fff'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#e5e5e5'
                e.currentTarget.style.background = '#fafafa'
              }}
            />
          </div>

          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, marginBottom: '8px', color: '#444' }}>
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: '1px solid #e5e5e5',
                  fontSize: '14px',
                  background: '#fafafa',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#6366F1'
                  e.currentTarget.style.background = '#fff'
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#e5e5e5'
                  e.currentTarget.style.background = '#fafafa'
                }}
              />
            </div>
          )}

          {error && (
            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(239,68,68,0.06)',
                color: '#EF4444',
                borderRadius: '10px',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '8px',
              padding: '14px',
              borderRadius: '12px',
              background: '#6366F1',
              color: '#fff',
              fontSize: '15px',
              fontWeight: 600,
          transition: 'all 0.2s',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.background = '#5558E8'
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.background = '#6366F1'
            }}
          >
            {loading ? '处理中...' : isLogin ? '登录' : '创建账户'}
          </button>
        </form>

        <div
          style={{
            marginTop: '28px',
            paddingTop: '24px',
            borderTop: '1px solid #f0f0f0',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '14px', color: '#666' }}>
            {isLogin ? '还没有账户？' : '已有账户？'}
            <button
              onClick={switchMode}
              style={{
                color: '#6366F1',
                fontWeight: 600,
                marginLeft: '4px',
              }}
            >
              {isLogin ? '立即注册' : '去登录'}
            </button>
          </p>
        </div>

        <div
          style={{
            marginTop: '24px',
            padding: '14px 16px',
            background: 'rgba(99,102,241,0.04)',
            borderRadius: '12px',
            fontSize: '12px',
            color: '#666',
            lineHeight: 1.7,
          }}
        >
          <div style={{ fontWeight: 500, marginBottom: '4px', color: '#444' }}>💡 提示</div>
          所有数据保存在浏览器本地 IndexedDB 中，清除浏览器数据会丢失账户和作品信息。
        </div>
      </div>
    </div>
  )
}
