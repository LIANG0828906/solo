import PetPanel from '../modules/pet/PetPanel'
import PetInteraction from '../modules/pet/PetInteraction'
import useUserStore from '../modules/user/UserStore'
import { useNavigate } from 'react-router-dom'

const achievements = [
  { id: 'a1', name: '贴心主人', description: '连续照顾7天', icon: '💝', condition: '连续登录7天', unlocked: true },
  { id: 'a2', name: '慷慨好友', description: '送出100次礼物', icon: '🎁', condition: '送出100份礼物', unlocked: false },
  { id: 'a3', name: '快乐达人', description: '宠物最高快乐度达到90', icon: '✨', condition: '宠物快乐度≥90', unlocked: true },
  { id: 'a4', name: '社交蝴蝶', description: '花园互动50次', icon: '🦋', condition: '花园互动50次', unlocked: false },
  { id: 'a5', name: '收藏家', description: '收集全部种类礼物', icon: '📦', condition: '拥有全部8种礼物', unlocked: false },
  { id: 'a6', name: '园丁大师', description: '在花园累计1小时', icon: '🌳', condition: '花园累计1小时', unlocked: false },
]

function PetPage() {
  const user = useUserStore((s) => s.user)
  const navigate = useNavigate()

  if (!user?.pet) {
    return (
      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: 40,
        textAlign: 'center',
        boxShadow: 'var(--shadow-soft)',
      }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>还没有宠物哦～</p>
        <button
          onClick={() => navigate('/home')}
          style={{
            padding: '10px 24px',
            border: 'none',
            borderRadius: 999,
            background: 'linear-gradient(135deg, #ffb347, #ff7e5f)',
            color: 'white',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >去领养</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <PetPanel />
      <PetInteraction />

      <div style={{
        background: 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        boxShadow: 'var(--shadow-soft), var(--shadow-inner)',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>🏅 成就墙</h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}>
          {achievements.map((ach, idx) => (
            <div
              key={ach.id}
              style={{
                position: 'relative',
                padding: '16px 8px',
                background: ach.unlocked
                  ? 'linear-gradient(135deg, #fff8e7 0%, #ffe4b5 100%)'
                  : 'rgba(200,200,200,0.15)',
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                aspectRatio: '1 / 1.1',
                opacity: ach.unlocked ? 1 : 0.5,
                animation: ach.unlocked ? `fade-drop 0.5s ease-out ${idx * 0.1}s both` : undefined,
              }}
            >
              {ach.unlocked && (
                <div style={{
                  position: 'absolute',
                  top: 0, left: 0, right: 0, bottom: 0,
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
                  backgroundSize: '200% 100%',
                  animation: 'badge-shine 3s ease-in-out infinite',
                  borderRadius: 8,
                  pointerEvents: 'none',
                }} />
              )}
              <span style={{ fontSize: 28, filter: ach.unlocked ? 'none' : 'grayscale(1)' }}>
                {ach.icon}
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                color: ach.unlocked ? 'var(--text-primary)' : 'var(--text-secondary)',
                textAlign: 'center',
              }}>
                {ach.name}
              </span>
              {!ach.unlocked && (
                <span style={{ fontSize: 8, color: 'var(--text-secondary)' }}>
                  {ach.condition}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PetPage
