import PetPanel from '../modules/pet/PetPanel'
import PetInteraction from '../modules/pet/PetInteraction'
import useUserStore from '../modules/user/UserStore'
import { useNavigate } from 'react-router-dom'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition: string
  unlocked: boolean
}

const achievements: Achievement[] = [
  { id: 'a1', name: '贴心主人', description: '连续照顾7天', icon: '💝', condition: '连续登录7天', unlocked: true },
  { id: 'a2', name: '慷慨好友', description: '送出100次礼物', icon: '🎁', condition: '送出100份礼物', unlocked: false },
  { id: 'a3', name: '快乐达人', description: '宠物最高快乐度达到90', icon: '✨', condition: '宠物快乐度≥90', unlocked: true },
  { id: 'a4', name: '社交蝴蝶', description: '花园互动50次', icon: '🦋', condition: '花园互动50次', unlocked: false },
  { id: 'a5', name: '收藏家', description: '收集全部种类礼物', icon: '📦', condition: '拥有全部8种礼物', unlocked: false },
  { id: 'a6', name: '园丁大师', description: '在花园累计1小时', icon: '🌳', condition: '花园累计1小时', unlocked: false },
]

const particlePositions = [
  { top: '10%', left: '20%', delay: 0 },
  { top: '15%', left: '75%', delay: 0.3 },
  { top: '45%', left: '10%', delay: 0.6 },
  { top: '55%', left: '85%', delay: 0.9 },
  { top: '80%', left: '30%', delay: 0.4 },
  { top: '75%', left: '65%', delay: 0.7 },
  { top: '30%', left: '50%', delay: 1.1 },
  { top: '65%', left: '45%', delay: 1.4 },
]

function AchievementBadge({ achievement, index }: { achievement: Achievement; index: number }) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '1 / 1.15',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: achievement.unlocked
          ? `fade-drop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.12}s both`
          : `fade-drop 0.4s ease-out ${index * 0.12}s both`,
      }}
    >
      <div
        className={`hexagon-badge ${achievement.unlocked ? 'hexagon-unlocked' : ''}`}
        style={{
          position: 'absolute',
          inset: 0,
          background: achievement.unlocked
            ? 'linear-gradient(145deg, #fff4c2 0%, #ffd700 30%, #ffaa00 60%, #ff8c00 100%)'
            : 'linear-gradient(145deg, #e8e8e8 0%, #c8c8c8 100%)',
          opacity: achievement.unlocked ? 1 : 0.45,
          filter: achievement.unlocked ? 'saturate(1.1)' : 'grayscale(0.8)',
        }}
      />

      <div
        className="hexagon-badge"
        style={{
          position: 'absolute',
          inset: 3,
          background: achievement.unlocked
            ? 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,240,200,0.85) 40%, rgba(255,200,100,0.8) 100%)'
            : 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(230,230,230,0.5) 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          padding: '8% 12%',
        }}
      >
        <span
          style={{
            fontSize: 'clamp(22px, 7vw, 32px)',
            filter: achievement.unlocked
              ? 'drop-shadow(0 2px 4px rgba(255,150,0,0.4))'
              : 'grayscale(1) opacity(0.6)',
          }}
        >
          {achievement.icon}
        </span>
        <span
          style={{
            fontSize: 'clamp(9px, 2.8vw, 11px)',
            fontWeight: 800,
            color: achievement.unlocked ? '#8b5a00' : '#888',
            textAlign: 'center',
            lineHeight: 1.2,
            letterSpacing: achievement.unlocked ? '0.3px' : '0',
          }}
        >
          {achievement.name}
        </span>
        {!achievement.unlocked && (
          <span
            style={{
              fontSize: 'clamp(7px, 2vw, 8px)',
              color: '#999',
              textAlign: 'center',
              marginTop: 2,
              lineHeight: 1.2,
            }}
          >
            {achievement.condition}
          </span>
        )}
      </div>

      {achievement.unlocked && (
        <div
          className="hexagon-badge"
          style={{
            position: 'absolute',
            inset: 3,
            background: 'linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.8) 50%, transparent 70%)',
            backgroundSize: '250% 100%',
            animation: 'badge-shine 2.8s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}

      {achievement.unlocked &&
        particlePositions.slice(0, 4).map((p, i) => (
          <span
            key={i}
            className="badge-particle"
            style={{
              top: p.top,
              left: p.left,
              animationDelay: `${p.delay + index * 0.15}s`,
              ['--px' as string]: `${(i % 2 === 0 ? 1 : -1) * (8 + i * 4)}px`,
              ['--py' as string]: `-${6 + i * 3}px`,
            } as React.CSSProperties}
          />
        ))}

      {achievement.unlocked && (
        <div
          style={{
            position: 'absolute',
            top: '18%',
            left: '25%',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #fff, #ffe066, transparent)',
            animation: `twinkle 1.8s ease-in-out ${index * 0.2 + 0.3}s infinite`,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

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
        animation: 'fade-drop 0.5s ease-out',
      }}>
        <div style={{ fontSize: 64, marginBottom: 12 }}>🐾</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: 15 }}>
          还没有宠物哦～快去领养一只可爱的小伙伴吧！
        </p>
        <button
          onClick={() => navigate('/home')}
          className="btn-press"
          style={{
            padding: '12px 32px',
            border: 'none',
            borderRadius: 999,
            background: 'linear-gradient(135deg, #ffb347, #ff7e5f)',
            color: 'white',
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(255,126,95,0.4)',
          }}
        >🎊 去领养宠物</button>
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
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div
          style={{
            position: 'absolute',
            top: -40,
            right: -40,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,215,0,0.18), transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <h3 style={{
          fontSize: 17,
          fontWeight: 800,
          marginBottom: 20,
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span style={{ fontSize: 22 }}>🏅</span>
          成就墙
          <span style={{
            marginLeft: 'auto',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--accent-orange)',
            background: 'rgba(255,154,90,0.12)',
            padding: '4px 12px',
            borderRadius: 999,
          }}>
            {achievements.filter(a => a.unlocked).length}/{achievements.length} 已解锁
          </span>
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '14px 10px',
          padding: '4px 6px 8px',
        }}>
          {achievements.map((ach, idx) => (
            <AchievementBadge key={ach.id} achievement={ach} index={idx} />
          ))}
        </div>
      </div>
    </div>
  )
}

export default PetPage
