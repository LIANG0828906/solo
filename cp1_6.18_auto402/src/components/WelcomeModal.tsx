import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../store'
import Button from './Button'

const WelcomeModal = () => {
  const navigate = useNavigate()
  const showWelcome = useGameStore((s) => s.showWelcome)
  const setShowWelcome = useGameStore((s) => s.setShowWelcome)

  if (!showWelcome) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#00000080',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: 16,
      }}
      className="modal-fade-in"
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #1A1A2E 0%, #16162A 100%)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 16,
          padding: 40,
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 72, marginBottom: 16 }}>🌌</div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            marginBottom: 8,
            background: 'linear-gradient(135deg, #00D4AA, #009FCC)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          欢迎来到数字奇境
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 12, fontSize: 15 }}>
          在这里，你可以通过完成拼图挑战、回答每日问题来收集独特的数字碎片。
        </p>
        <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 28, fontSize: 15 }}>
          集齐同组4个碎片即可合成独一无二的数字艺术品，在市场中展示、交易，成为顶级收藏家！
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 28,
          }}
        >
          {[
            { icon: '🧩', label: '拼图挑战' },
            { icon: '📚', label: '每日答题' },
            { icon: '🔮', label: '碎片合成' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: '16px 8px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 12,
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 4 }}>{item.icon}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{item.label}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            size="lg"
            onClick={() => setShowWelcome(false)}
            style={{ flex: 1 }}
          >
            🧩 前往拼图获得碎片
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => {
              setShowWelcome(false)
              navigate('/market')
            }}
            style={{ flex: 1 }}
          >
            🛒 逛逛市场
          </Button>
        </div>

        <p style={{ marginTop: 16, color: 'rgba(255,255,255,0.35)', fontSize: 12 }}>
          🪙 已为你赠送 1000 初始金币作为启动资金
        </p>
      </div>
    </div>
  )
}

export default WelcomeModal
