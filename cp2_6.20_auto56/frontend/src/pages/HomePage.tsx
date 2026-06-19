import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PetPanel from '../modules/pet/PetPanel'
import PetInteraction from '../modules/pet/PetInteraction'
import useUserStore from '../modules/user/UserStore'
import { PetType, PetColor } from '../types'

const petOptions: { type: PetType; name: string; emoji: string }[] = [
  { type: 'cat', name: '小猫咪', emoji: '🐱' },
  { type: 'dog', name: '小狗狗', emoji: '🐶' },
  { type: 'dragon', name: '小龙龙', emoji: '🐲' },
]

const colorOptions: { color: PetColor; name: string; filter: string }[] = [
  { color: 'default', name: '原色', filter: 'none' },
  { color: 'pink', name: '粉色', filter: 'hue-rotate(-20deg) saturate(1.2)' },
  { color: 'blue', name: '蓝色', filter: 'hue-rotate(180deg) saturate(1.2)' },
]

function AdoptModal() {
  const navigate = useNavigate()
  const adoptPet = useUserStore((s) => s.adoptPet)
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState<PetType | null>(null)
  const [selectedColor, setSelectedColor] = useState<PetColor>('default')
  const [petName, setPetName] = useState('')

  const handleAdopt = async () => {
    if (!selectedType || !petName.trim()) return
    await adoptPet(selectedType, selectedColor, petName.trim())
    navigate('/pet')
  }

  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius-lg)',
      padding: 28,
      boxShadow: 'var(--shadow-soft)',
      animation: 'fade-drop 0.4s ease-out',
    }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 6 }}>
        🎉 欢迎来到萌宠花园
      </h2>
      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24 }}>
        选择一只可爱的宠物开始你的旅程吧！
      </p>

      {step === 1 && (
        <>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>第一步：选择宠物种类</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {petOptions.map((opt) => (
              <button
                key={opt.type}
                onClick={() => setSelectedType(opt.type)}
                className="btn-press"
                style={{
                  padding: 20,
                  border: selectedType === opt.type ? '2px solid var(--accent-orange)' : '2px solid transparent',
                  borderRadius: 'var(--radius-md)',
                  background: selectedType === opt.type ? 'rgba(255,154,90,0.1)' : '#faf6ee',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ fontSize: 48 }}>{opt.emoji}</span>
                <span style={{ fontSize: 13, fontWeight: 600 }}>{opt.name}</span>
              </button>
            ))}
          </div>
          <button
            disabled={!selectedType}
            onClick={() => setStep(2)}
            style={{
              width: '100%',
              padding: 14,
              border: 'none',
              borderRadius: 999,
              background: selectedType ? 'linear-gradient(135deg, #ffb347, #ff7e5f)' : '#ddd',
              color: 'white',
              fontWeight: 600,
              fontSize: 15,
              cursor: selectedType ? 'pointer' : 'not-allowed',
            }}
          >
            下一步
          </button>
        </>
      )}

      {step === 2 && selectedType && (
        <>
          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>第二步：选择颜色</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
            {colorOptions.map((opt) => {
              const petEmoji = petOptions.find((p) => p.type === selectedType)?.emoji
              return (
                <button
                  key={opt.color}
                  onClick={() => setSelectedColor(opt.color)}
                  className="btn-press"
                  style={{
                    padding: 16,
                    border: selectedColor === opt.color ? '2px solid var(--accent-orange)' : '2px solid transparent',
                    borderRadius: 'var(--radius-md)',
                    background: selectedColor === opt.color ? 'rgba(255,154,90,0.1)' : '#faf6ee',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 36, filter: opt.filter }}>{petEmoji}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{opt.name}</span>
                </button>
              )
            })}
          </div>

          <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>给它取个名字：</p>
          <input
            type="text"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
            placeholder="输入宠物名字..."
            maxLength={12}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #eee',
              borderRadius: 'var(--radius-md)',
              fontSize: 14,
              marginBottom: 16,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={() => setStep(1)}
              style={{
                flex: 1,
                padding: 14,
                border: 'none',
                borderRadius: 999,
                background: '#f0ebe0',
                color: 'var(--text-primary)',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
              }}
            >
              返回
            </button>
            <button
              disabled={!petName.trim()}
              onClick={handleAdopt}
              style={{
                flex: 2,
                padding: 14,
                border: 'none',
                borderRadius: 999,
                background: petName.trim() ? 'linear-gradient(135deg, #ffb347, #ff7e5f)' : '#ddd',
                color: 'white',
                fontWeight: 600,
                fontSize: 15,
                cursor: petName.trim() ? 'pointer' : 'not-allowed',
              }}
            >
              🎊 领养它！
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function HomePage() {
  const user = useUserStore((s) => s.user)
  const claimDailyReward = useUserStore((s) => s.claimDailyReward)
  const [claimed, setClaimed] = useState(false)

  const handleClaim = async () => {
    await claimDailyReward()
    setClaimed(true)
  }

  if (!user) {
    return <div style={{ textAlign: 'center', padding: 40 }}>加载中...</div>
  }

  if (!user.pet) {
    return <AdoptModal />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{
        background: 'linear-gradient(135deg, #fff3e0, #ffe0b2)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        boxShadow: 'var(--shadow-soft)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
              你好，{user.name}！ 👋
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              连续登录 {user.consecutiveDays} 天 · 已送出 {user.giftsSent} 份礼物
            </p>
          </div>
          <button
            onClick={handleClaim}
            disabled={claimed}
            className="btn-press"
            style={{
              padding: '10px 18px',
              border: 'none',
              borderRadius: 999,
              background: claimed ? '#ccc' : 'linear-gradient(135deg, #ffd700, #ffa500)',
              color: 'white',
              fontWeight: 700,
              fontSize: 13,
              cursor: claimed ? 'not-allowed' : 'pointer',
              boxShadow: claimed ? 'none' : '0 2px 8px rgba(255,165,0,0.4)',
            }}
          >
            {claimed ? '✓ 已领取' : '🎁 领每日奖励'}
          </button>
        </div>
      </div>

      <PetPanel />
      <PetInteraction />
    </div>
  )
}

export default HomePage
