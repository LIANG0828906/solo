import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGameStore } from '../../store'
import Button from '../../components/Button'
import RarityTag from '../../components/RarityTag'
import Modal from '../../components/Modal'
import PuzzleGame from '../../components/PuzzleGame'
import QuizGame from '../../components/QuizGame'
import { ItemGenerator, getRarityColor } from '../../modules/nft-core/ItemGenerator'
import type { Artwork, Fragment } from '../../types'

const CollectionPage = () => {
  const navigate = useNavigate()
  const artworks = useGameStore((s) => s.player.artworks)
  const balance = useGameStore((s) => s.player.balance)
  const addFragment = useGameStore((s) => s.addFragment)
  const addFragments = useGameStore((s) => s.addFragments)
  const canTakeQuizToday = useGameStore((s) => s.canTakeQuizToday)
  const markQuizTaken = useGameStore((s) => s.markQuizTaken)
  const setShowCelebration = useGameStore((s) => s.setShowCelebration)

  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null)
  const [showPuzzle, setShowPuzzle] = useState(false)
  const [showQuiz, setShowQuiz] = useState(false)
  const [toast, setToast] = useState<string>('')

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  const handlePuzzleComplete = (difficulty: number, timeSpent: number) => {
    const fragment = ItemGenerator.generateFragmentByPuzzle(difficulty, timeSpent)
    addFragment(fragment)
    setShowPuzzle(false)
    setShowCelebration(true, [fragment])
    setTimeout(() => setShowCelebration(false), 3000)
    showToast(`🎉 获得 ${fragment.name}！`)
  }

  const handleQuizComplete = (correctCount: number, total: number) => {
    const fragments: Fragment[] = []
    for (let i = 0; i < correctCount; i++) {
      fragments.push(ItemGenerator.generateFragmentByQuiz(correctCount, total))
    }
    if (fragments.length > 0) {
      addFragments(fragments)
      setShowCelebration(true, fragments)
      setTimeout(() => setShowCelebration(false), 3000)
    }
    markQuizTaken()
    setShowQuiz(false)
    showToast(`📚 答题完成！获得 ${fragments.length} 个碎片`)
  }

  return (
    <div style={{ padding: '24px 0' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 28,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>💎 我的收藏品</h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
            完成拼图和答题收集碎片，合成独一无二的数字艺术品
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Button onClick={() => setShowPuzzle(true)}>🧩 拼图赚碎片</Button>
          <Button
            variant="secondary"
            onClick={() => {
              if (canTakeQuizToday()) setShowQuiz(true)
              else showToast('今天已经答过题啦，明天再来吧！')
            }}
          >
            📚 每日答题
          </Button>
        </div>
      </div>

      <div
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '20px 24px',
          marginBottom: 28,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 20,
        }}
      >
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 4 }}>
            艺术品收藏
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#00D4AA' }}>{artworks.length}</div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 4 }}>
            当前金币
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#FFD700' }}>🪙 {balance}</div>
        </div>
        <div>
          <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 4 }}>
            答题状态
          </div>
          <div style={{ fontSize: 16, fontWeight: 600, color: canTakeQuizToday() ? '#00D4AA' : 'rgba(255,255,255,0.4)' }}>
            {canTakeQuizToday() ? '✅ 今日可答' : '⏰ 已完成'}
          </div>
        </div>
      </div>

      {artworks.length === 0 ? (
        <div
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: 16,
            padding: 80,
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 16 }}>🌌</div>
          <h2 style={{ fontSize: 22, marginBottom: 8 }}>还没有收藏品</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 24, fontSize: 14 }}>
            通过拼图或答题收集碎片，集齐4个同组碎片即可合成艺术品
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button onClick={() => setShowPuzzle(true)}>开始拼图</Button>
            <Button variant="secondary" onClick={() => navigate('/backpack')}>
              查看背包
            </Button>
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 20,
          }}
        >
          {artworks.map((artwork) => (
            <ArtworkCard key={artwork.id} artwork={artwork} onClick={() => setSelectedArtwork(artwork)} />
          ))}
        </div>
      )}

      <Modal open={!!selectedArtwork} onClose={() => setSelectedArtwork(null)} width={560}>
        {selectedArtwork && (
          <div>
            <div
              style={{
                width: '100%',
                aspectRatio: '3/4',
                borderRadius: 16,
                overflow: 'hidden',
                marginBottom: 20,
                background: '#1A1A2E',
              }}
            >
              <img
                src={selectedArtwork.imageUrl}
                alt={selectedArtwork.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700 }}>{selectedArtwork.name}</h2>
              <RarityTag rarity={selectedArtwork.rarity} size="md" />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, marginBottom: 24 }}>
              {selectedArtwork.description}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedArtwork(null)
                  navigate('/market')
                }}
                style={{ flex: 1 }}
              >
                去市场交易
              </Button>
              <Button onClick={() => setSelectedArtwork(null)} style={{ flex: 1 }}>
                关闭
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={showPuzzle} onClose={() => setShowPuzzle(false)} width={640} closeOnOverlay={false}>
        <PuzzleGame onComplete={handlePuzzleComplete} onClose={() => setShowPuzzle(false)} />
      </Modal>

      <Modal open={showQuiz} onClose={() => setShowQuiz(false)} width={520} closeOnOverlay={false}>
        <QuizGame onComplete={handleQuizComplete} onClose={() => setShowQuiz(false)} />
      </Modal>

      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '12px 24px',
            background: 'rgba(0, 212, 170, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: 10,
            fontWeight: 600,
            zIndex: 2000,
            boxShadow: '0 4px 20px rgba(0, 212, 170, 0.4)',
          }}
        >
          {toast}
        </div>
      )}

      <style>{`
        @media (max-width: 1024px) {
          .artwork-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .artwork-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}

const ArtworkCard = ({ artwork, onClick }: { artwork: Artwork; onClick: () => void }) => {
  const color = getRarityColor(artwork.rarity)
  return (
    <div
      onClick={onClick}
      className="artwork-card"
      style={{
        background: '#FFFFFF08',
        border: '1px solid #FFFFFF12',
        borderRadius: 16,
        padding: 14,
        cursor: 'pointer',
        transition: 'all 0.25s ease',
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '1/1',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#1A1A2E',
          marginBottom: 12,
        }}
      >
        <img
          src={`https://picsum.photos/id/${artwork.groupId === 'g_mystery' ? 200 : parseInt(artwork.imageUrl.match(/id\/(\d+)/)?.[1] || '101')}/200/200`}
          alt={artwork.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {artwork.name}
        </span>
        <RarityTag rarity={artwork.rarity} />
      </div>
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          height: 2,
          background: `linear-gradient(90deg, ${color}00, ${color}, ${color}00)`,
          opacity: 0,
          transition: 'opacity 0.3s ease',
        }}
        className="artwork-card-glow"
      />
      <style>{`
        .artwork-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 30px #4A90D950;
          border-color: #4A90D980;
        }
        .artwork-card:hover .artwork-card-glow { opacity: 1; }
      `}</style>
    </div>
  )
}

export default CollectionPage
