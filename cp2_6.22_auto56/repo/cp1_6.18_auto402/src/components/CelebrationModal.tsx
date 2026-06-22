import { useGameStore } from '../store'
import RarityTag from './RarityTag'
import Button from './Button'
import type { Fragment } from '../types'

const CelebrationModal = () => {
  const showCelebration = useGameStore((s) => s.showCelebration)
  const fragments = useGameStore((s) => s.celebrationFragments)
  const setShowCelebration = useGameStore((s) => s.setShowCelebration)

  if (!showCelebration || fragments.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
        padding: 16,
      }}
      className="modal-fade-in"
    >
      <div
        style={{
          background: 'linear-gradient(180deg, #1A1A2E 0%, #0B0C10 100%)',
          border: '1px solid rgba(0, 212, 170, 0.3)',
          borderRadius: 20,
          padding: 40,
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -50,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 180,
            opacity: 0.08,
          }}
        >
          ✨
        </div>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>🎉</div>
          <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>获得碎片！</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 24, fontSize: 14 }}>
            恭喜你获得了 {fragments.length} 个数字碎片
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 28 }}>
            {fragments.map((f: Fragment) => (
              <div
                key={f.id}
                style={{
                  padding: 14,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 14,
                  minWidth: 120,
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 6 }}>💎</div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>{f.name}</div>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <RarityTag rarity={f.rarity} />
                </div>
              </div>
            ))}
          </div>

          <Button onClick={() => setShowCelebration(false)} size="lg">
            太棒了！
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CelebrationModal
