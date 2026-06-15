import { useState } from 'react'
import { authAPI } from '../services/api'
import type { UserData } from '../types'

interface LoginPageProps {
  onLogin: (user: UserData) => void
}

function LoginPage({ onLogin }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = isLogin
        ? await authAPI.login(username, password)
        : await authAPI.register(username, password)

      if (result.success) {
        onLogin({ userId: result.userId, username: result.username })
      } else {
        setError(result.message || '操作失败')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '网络错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.bgDecoration1} />
      <div style={styles.bgDecoration2} />
      <div style={styles.card} className="glass-panel">
        <div style={styles.header}>
          <h1 style={styles.title}>虚拟艺术策展</h1>
          <p style={styles.subtitle}>打造属于你的线上画廊</p>
        </div>

        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(isLogin ? styles.tabActive : {}) }}
            onClick={() => setIsLogin(true)}
          >
            登录
          </button>
          <button
            style={{ ...styles.tab, ...(!isLogin ? styles.tabActive : {}) }}
            onClick={() => setIsLogin(false)}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              placeholder="请输入用户名"
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              placeholder="请输入密码"
              required
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
            disabled={loading}
          >
            {loading ? '处理中...' : isLogin ? '登 录' : '注 册'}
          </button>
        </form>

        <div style={styles.demoHint}>
          <p>演示账号：demo / demo123</p>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
    position: 'relative',
    overflow: 'hidden'
  },
  bgDecoration1: {
    position: 'absolute',
    top: '-20%',
    right: '-10%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(212,165,116,0.15) 0%, transparent 70%)'
  },
  bgDecoration2: {
    position: 'absolute',
    bottom: '-15%',
    left: '-5%',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(200,180,160,0.2) 0%, transparent 70%)'
  },
  card: {
    width: '420px',
    padding: '40px',
    borderRadius: '20px',
    position: 'relative',
    zIndex: 1
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    color: '#2c2c2c',
    marginBottom: '8px',
    letterSpacing: '2px'
  },
  subtitle: {
    fontSize: '14px',
    color: '#888'
  },
  tabs: {
    display: 'flex',
    marginBottom: '30px',
    background: 'rgba(0,0,0,0.04)',
    borderRadius: '10px',
    padding: '4px'
  },
  tab: {
    flex: 1,
    padding: '10px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#666',
    borderRadius: '8px',
    transition: 'all 0.2s ease'
  },
  tabActive: {
    background: 'white',
    color: '#333',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    color: '#555',
    fontWeight: 500
  },
  input: {
    padding: '12px 16px',
    border: '1px solid rgba(0,0,0,0.1)',
    borderRadius: '10px',
    fontSize: '14px',
    background: 'rgba(255,255,255,0.8)',
    outline: 'none',
    transition: 'all 0.2s ease'
  },
  error: {
    color: '#e74c3c',
    fontSize: '13px',
    textAlign: 'center'
  },
  submitBtn: {
    marginTop: '10px',
    padding: '14px',
    fontSize: '15px',
    fontWeight: 600,
    letterSpacing: '2px'
  },
  demoHint: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#aaa'
  }
}

export default LoginPage
