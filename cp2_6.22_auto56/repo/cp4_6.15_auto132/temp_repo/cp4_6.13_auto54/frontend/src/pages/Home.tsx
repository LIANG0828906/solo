import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store'
import type { Pet, PetType } from '../types'
import { playAdoptSound, playClickSound } from '../utils/audio'

const typeLabel: Record<PetType, string> = {
  cat: '🐱 小猫咪',
  dog: '🐶 小狗狗',
  rabbit: '🐰 小兔兔',
  other: '🐾 小伙伴',
}

export default function Home() {
  const navigate = useNavigate()
  const pets = useAppStore(s => s.adoptablePets)
  const loading = useAppStore(s => s.loading)
  const modalPet = useAppStore(s => s.modalPet)
  const showModal = useAppStore(s => s.showAdoptModal)
  const user = useAppStore(s => s.user)
  const currentPet = useAppStore(s => s.currentPet)
  const fetchPets = useAppStore(s => s.fetchAdoptablePets)
  const setModal = useAppStore(s => s.setModalPet)
  const setShow = useAppStore(s => s.setShowAdoptModal)
  const adopt = useAppStore(s => s.adoptPet)
  const [hoverId, setHoverId] = useState<string | null>(null)

  useEffect(() => {
    fetchPets()
  }, [fetchPets])

  const handleAdoptClick = (pet: Pet) => {
    playClickSound()
    setModal(pet)
    setShow(true)
  }

  const handleConfirmAdopt = async () => {
    if (!modalPet || !user) return
    playAdoptSound()
    await adopt(modalPet.id)
    setTimeout(() => navigate('/space'), 600)
  }

  return (
    <div>
      <HeroBanner hasPet={!!currentPet} />

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#5D4037' }}>
            🏡 收容所大厅
          </h2>
          <p style={{ color: '#8D6E63', fontSize: 14, marginTop: 4, fontWeight: 600 }}>
            选一只有缘的小可爱，带它回家吧～ 今天共有 <b style={{ color: '#FF6B3D' }}>{pets.length}</b> 只萌宠等待领养
          </p>
        </div>
        <button
          onClick={() => { playClickSound(); fetchPets() }}
          style={refreshBtn}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          🔄 换一批看看
        </button>
      </div>

      {loading && pets.length === 0 ? (
        <LoadingGrid />
      ) : pets.length === 0 ? (
        <EmptyState />
      ) : (
        <div style={{
          marginTop: 20,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 20,
        }}>
          {pets.map(pet => (
            <PetCard
              key={pet.id}
              pet={pet}
              isHover={hoverId === pet.id}
              onEnter={() => setHoverId(pet.id)}
              onLeave={() => setHoverId(null)}
              onAdopt={() => handleAdoptClick(pet)}
            />
          ))}
        </div>
      )}

      {showModal && modalPet && (
        <AdoptModal
          pet={modalPet}
          onClose={() => { playClickSound(); setShow(false); setModal(null) }}
          onConfirm={handleConfirmAdopt}
        />
      )}
    </div>
  )
}

function HeroBanner({ hasPet }: { hasPet: boolean }) {
  return (
    <div style={{
      position: 'relative',
      borderRadius: 28,
      padding: '32px 28px',
      background: 'linear-gradient(135deg, #FFE082 0%, #FFAB91 50%, #FF8C69 100%)',
      overflow: 'hidden',
      boxShadow: '0 12px 40px rgba(255,140,105,0.28)',
    }}>
      <div style={{ position: 'absolute', right: -20, top: -30, fontSize: 180, opacity: 0.15 }}>
        🐾🐾🐾
      </div>
      <div style={{ position: 'relative', maxWidth: 640 }}>
        <div style={{
          display: 'inline-block',
          padding: '4px 14px',
          background: 'rgba(255,255,255,0.35)',
          borderRadius: 999,
          color: '#BF360C',
          fontWeight: 700,
          fontSize: 12,
          marginBottom: 14,
          backdropFilter: 'blur(4px)',
        }}>
          ✨ 今日开放领养 · 24小时温暖守护
        </div>
        <h1 style={{
          fontSize: 34,
          fontWeight: 900,
          color: '#fff',
          textShadow: '0 2px 8px rgba(191,54,12,0.2)',
          lineHeight: 1.15,
        }}>
          {hasPet
            ? '欢迎回到收容所！你的毛孩子正在等你回家 💛'
            : '每一只小可爱，都值得一个温暖的家 🏡'}
        </h1>
        <p style={{
          marginTop: 12,
          color: '#FFF3E0',
          fontSize: 15,
          fontWeight: 600,
          lineHeight: 1.6,
          maxWidth: 540,
        }}>
          {hasPet
            ? '你已经有毛孩子啦，可以去「我的空间」陪它玩耍，或者继续为其他小可爱寻找家人～'
            : '从收容所领养一只像素风格萌宠，定时投喂、陪伴玩耍、哄它休息，用爱守护它成长。如果长期不照顾，它会孤单走失哦！'}
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          <span style={tag}>🎨 像素画风</span>
          <span style={tag}>💖 真实养成</span>
          <span style={tag}>📢 社区互助</span>
          <span style={tag}>🔔 走失预警</span>
        </div>
      </div>
    </div>
  )
}

const tag: React.CSSProperties = {
  padding: '6px 14px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.3)',
  color: '#fff',
  fontWeight: 700,
  fontSize: 13,
  backdropFilter: 'blur(4px)',
}

function PetCard({
  pet, isHover, onEnter, onLeave, onAdopt,
}: {
  pet: Pet
  isHover: boolean
  onEnter: () => void
  onLeave: () => void
  onAdopt: () => void
}) {
  return (
    <div
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        position: 'relative',
        background: '#FFFBF2',
        borderRadius: 24,
        padding: 20,
        border: '2px solid #FFE0B2',
        boxShadow: isHover
          ? '0 16px 40px rgba(255,140,105,0.28), 0 4px 12px rgba(0,0,0,0.06)'
          : '0 6px 18px rgba(255,140,105,0.12)',
        transform: isHover ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        cursor: 'pointer',
      }}
    >
      {isHover && (
        <div style={{
          position: 'absolute',
          top: -8,
          left: 12,
          right: 12,
          padding: '10px 14px',
          background: '#fff',
          borderRadius: 16,
          border: '2px solid #FFD93D',
          boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
          fontSize: 12,
          color: '#5D4037',
          lineHeight: 1.5,
          fontWeight: 600,
          zIndex: 10,
          animation: 'fadeDown 0.25s ease-out',
        }}>
          <span style={{ fontSize: 14 }}>💬 </span>
          {pet.intro}
          <style>{`
            @keyframes fadeDown {
              from { opacity: 0; transform: translateY(-8px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <div style={{
            position: 'absolute', bottom: -8, left: 28,
            width: 12, height: 12,
            background: '#fff',
            borderRight: '2px solid #FFD93D',
            borderBottom: '2px solid #FFD93D',
            transform: 'rotate(45deg)',
          }} />
        </div>
      )}

      <div style={{
        width: '100%',
        aspectRatio: '1 / 1',
        borderRadius: 18,
        background: 'linear-gradient(135deg, #FFF8E1, #FFE0B2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 88,
        position: 'relative',
        overflow: 'hidden',
        border: '3px dashed #FFD93D',
      }}>
        <div style={{ animation: 'bounce 2s ease-in-out infinite' }}>
          {pet.avatar}
        </div>
        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-8px); }
          }
        `}</style>
        <div style={{
          position: 'absolute', top: 8, right: 8,
          padding: '3px 10px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.85)',
          fontSize: 10,
          fontWeight: 800,
          color: '#E65100',
        }}>
          求领养
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#4E342E',
          }}>{pet.name}</h3>
          <span style={{
            fontSize: 11,
            padding: '3px 10px',
            borderRadius: 999,
            background: '#FFF3E0',
            color: '#E65100',
            fontWeight: 700,
          }}>{typeLabel[pet.type]}</span>
        </div>

        <div style={{
          marginTop: 10,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 6,
        }}>
          <MiniBar label="🍖" value={pet.hunger} color="#FF8C69" />
          <MiniBar label="😄" value={pet.happiness} color="#FFD93D" />
          <MiniBar label="❤️" value={pet.health} color="#66BB6A" />
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); onAdopt() }}
          style={adoptBtn}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,107,61,0.5)'
            e.currentTarget.style.transform = 'translateY(-2px)'
          }}
        >
          🎀 领养我