import { useState, useCallback, useRef, useEffect } from 'react'
import { useVeinStore } from '@/store/useVeinStore'
import VeinNode from '@/灵脉交互模块/VeinNode'
import CollectionBook from '@/法器管理模块/CollectionBook'
import ArtifactSmelter from '@/法器管理模块/ArtifactSmelter'
import type { BaseArtifact, ElementType, SmeltedArtifact, ResonationResult } from '@/utils/api'

type TabType = 'vein' | 'library' | 'collection'
type PageType = 'tabs' | 'smelter'

const ELEMENT_COLORS: Record<ElementType, string> = {
  metal: '#c0c0c0',
  wood: '#4caf50',
  water: '#2196f3',
  fire: '#f44336',
  earth: '#ff9800',
}

const ELEMENT_LABELS: Record<ElementType, string> = {
  metal: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土',
}

const MOCK_ARTIFACTS: BaseArtifact[] = [
  {
    id: 'sword-1',
    name: '青锋剑',
    type: 'sword',
    icon: '',
    baseElement: 'metal',
    baseStats: { attack: 100, defense: 30, speed: 50 },
  },
  {
    id: 'ding-1',
    name: '九转鼎',
    type: 'ding',
    icon: '',
    baseElement: 'earth',
    baseStats: { attack: 40, defense: 120, speed: 20 },
  },
  {
    id: 'banner-1',
    name: '招魂幡',
    type: 'banner',
    icon: '',
    baseElement: 'wood',
    baseStats: { attack: 60, defense: 50, speed: 80 },
  },
  {
    id: 'pearl-1',
    name: '定海珠',
    type: 'pearl',
    icon: '',
    baseElement: 'water',
    baseStats: { attack: 50, defense: 70, speed: 60 },
  },
  {
    id: 'mirror-1',
    name: '照妖镜',
    type: 'mirror',
    icon: '',
    baseElement: 'fire',
    baseStats: { attack: 80, defense: 40, speed: 70 },
  },
  {
    id: 'talisman-1',
    name: '天师符',
    type: 'talisman',
    icon: '',
    baseElement: 'fire',
    baseStats: { attack: 90, defense: 20, speed: 90 },
  },
  {
    id: 'sword-2',
    name: '轩辕剑',
    type: 'sword',
    icon: '',
    baseElement: 'metal',
    baseStats: { attack: 150, defense: 40, speed: 60 },
  },
  {
    id: 'pearl-2',
    name: '夜明珠',
    type: 'pearl',
    icon: '',
    baseElement: 'water',
    baseStats: { attack: 30, defense: 90, speed: 100 },
  },
]

interface ArtifactCardProps {
  artifact: BaseArtifact
  onClick: (e: React.MouseEvent) => void
}

function ArtifactCard({ artifact, onClick }: ArtifactCardProps) {
  const color = ELEMENT_COLORS[artifact.baseElement]

  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 215, 0, 0.2)',
        borderRadius: 12,
        padding: 16,
        cursor: 'pointer',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
        willChange: 'transform, box-shadow',
      }}
      className="artifact-card"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-8px)'
        e.currentTarget.style.boxShadow = '0 12px 32px rgba(255, 215, 0, 0.2)'
        e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.5)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.2)'
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '1',
          borderRadius: 8,
          background: `linear-gradient(135deg, ${color}33, ${color}11)`,
          border: `2px solid ${color}66`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          fontWeight: 900,
          color: color,
          marginBottom: 12,
        }}
      >
        {artifact.name.slice(0, 1)}
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#fff' }}>{artifact.name}</h3>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
        <span style={{ color: color, fontWeight: 600 }}>{ELEMENT_LABELS[artifact.baseElement]}系</span>
      </div>
      <div style={{ fontSize: 11, color: '#666', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <span>攻:{artifact.baseStats.attack}</span>
        <span>防:{artifact.baseStats.defense}</span>
        <span>速:{artifact.baseStats.speed}</span>
      </div>
    </div>
  )
}

function VeinSmeltingPage() {
  const { nodes, setNodes, addResonation, addResonationBoost, resonationCount, resonationBoost } = useVeinStore()

  const handleNodesChange = useCallback(
    (updatedNodes: typeof nodes) => {
      setNodes(updatedNodes)
    },
    [setNodes],
  )

  const handleResonation = useCallback(
    (result: ResonationResult) => {
      addResonation()
      addResonationBoost(result.boostPercent)
    },
    [addResonation, addResonationBoost],
  )

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 16px',
        height: '100%',
        overflowY: 'auto',
      }}
      className="scrollbar-hide"
    >
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: 16,
          padding: 24,
          maxWidth: 520,
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#ffd700' }}>
          灵脉祭炼
        </h2>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#888', marginBottom: 16 }}>
          点击灵脉节点激活，按相生顺序激活可触发共鸣
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#ffd700' }}>{resonationCount}</div>
            <div style={{ fontSize: 11, color: '#888' }}>共鸣次数</div>
          </div>
          <div style={{ width: 1, background: '#333' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#4caf50' }}>+{resonationBoost}%</div>
            <div style={{ fontSize: 11, color: '#888' }}>熔炼加成</div>
          </div>
        </div>

        <VeinNode
          nodes={nodes}
          onNodesChange={handleNodesChange}
          onResonation={handleResonation}
          centerX={200}
          centerY={200}
          radius={120}
        />
      </div>
    </div>
  )
}

function ArtifactLibraryPage({ onSelectArtifact }: { onSelectArtifact: (artifact: BaseArtifact, e: React.MouseEvent) => void }) {
  return (
    <div
      style={{
        padding: '24px 16px',
        height: '100%',
        overflowY: 'auto',
      }}
      className="scrollbar-hide"
    >
      <h2 style={{ textAlign: 'center', fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#ffd700' }}>
        法器库
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          maxWidth: 1200,
          margin: '0 auto',
        }}
        className="artifact-grid"
      >
        {MOCK_ARTIFACTS.map((artifact) => (
          <ArtifactCard
            key={artifact.id}
            artifact={artifact}
            onClick={(e) => onSelectArtifact(artifact, e)}
          />
        ))}
      </div>

      <style>{`
        @media (max-width: 1440px) {
          .artifact-grid {
            grid-template-columns: repeat(4, 1fr) !important;
          }
        }
        @media (max-width: 1024px) {
          .artifact-grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .artifact-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 480px) {
          .artifact-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('vein')
  const [currentPage, setCurrentPage] = useState<PageType>('tabs')
  const [selectedArtifact, setSelectedArtifact] = useState<BaseArtifact | null>(null)
  const [transitionState, setTransitionState] = useState<'idle' | 'entering' | 'exiting'>('idle')
  const [clipPosition, setClipPosition] = useState({ x: 50, y: 50 })
  const [tabTransitionKey, setTabTransitionKey] = useState(0)

  const animFrameRef = useRef<number>(0)
  const transitionTimerRef = useRef<number | null>(null)

  const { activeOrder, resonationBoost, addToCollection, addResonation, addResonationBoost } = useVeinStore()

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current)
      }
    }
  }, [])

  const handleTabChange = useCallback(
    (tab: TabType) => {
      if (tab === activeTab) return
      setActiveTab(tab)
      setTabTransitionKey((k) => k + 1)
    },
    [activeTab],
  )

  const handleSelectArtifact = useCallback(
    (artifact: BaseArtifact, e: React.MouseEvent) => {
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((rect.left + rect.width / 2) / window.innerWidth) * 100
      const y = ((rect.top + rect.height / 2) / window.innerHeight) * 100
      setClipPosition({ x, y })
      setSelectedArtifact(artifact)
      setTransitionState('entering')

      if (transitionTimerRef.current) {
        window.clearTimeout(transitionTimerRef.current)
      }
      transitionTimerRef.current = window.setTimeout(() => {
        setCurrentPage('smelter')
        requestAnimationFrame(() => {
          setTransitionState('idle')
        })
      }, 500)
    },
    [],
  )

  const handleBackToLibrary = useCallback(() => {
    setTransitionState('exiting')

    if (transitionTimerRef.current) {
      window.clearTimeout(transitionTimerRef.current)
    }
    transitionTimerRef.current = window.setTimeout(() => {
      setCurrentPage('tabs')
      requestAnimationFrame(() => {
        setTransitionState('idle')
        setSelectedArtifact(null)
      })
    }, 500)
  }, [])

  const handleSaveArtifact = useCallback(
    (artifact: SmeltedArtifact) => {
      addToCollection(artifact)
      addResonation()
      addResonationBoost(2)
    },
    [addToCollection, addResonation, addResonationBoost],
  )

  const activatedElements = activeOrder

  const tabLabels: Record<TabType, string> = {
    vein: '灵脉祭炼',
    library: '法器库',
    collection: '收藏册',
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #0d1b2a 100%)',
      }}
    >
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          background: 'rgba(26, 10, 46, 0.7)',
          borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
          padding: '0 16px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          willChange: 'backdrop-filter',
        }}
      >
        {currentPage === 'smelter' && (
          <button
            onClick={handleBackToLibrary}
            style={{
              position: 'absolute',
              left: 16,
              background: 'transparent',
              border: '1px solid #555',
              color: '#aaa',
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 13,
              transition: 'all 0.2s ease',
              willChange: 'transform',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ffd700'
              e.currentTarget.style.color = '#ffd700'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#555'
              e.currentTarget.style.color = '#aaa'
            }}
          >
            ← 返回
          </button>
        )}

        {currentPage === 'tabs' &&
          (['vein', 'library', 'collection'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontWeight: 600,
                background: 'transparent',
                border: 'none',
                color: activeTab === tab ? '#ffd700' : '#888',
                cursor: 'pointer',
                position: 'relative',
                transition: 'color 0.3s ease',
              }}
            >
              {tabLabels[tab]}
              {activeTab === tab && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 24,
                    height: 3,
                    borderRadius: 2,
                    background: 'linear-gradient(90deg, #ffd700, #ff8800)',
                    willChange: 'transform',
                  }}
                />
              )}
            </button>
          ))}

        {currentPage === 'smelter' && (
          <span style={{ fontSize: 16, fontWeight: 700, color: '#ffd700' }}>法器熔炼</span>
        )}
      </nav>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {currentPage === 'tabs' && (
          <div
            key={`tab-${tabTransitionKey}`}
            style={{
              width: '100%',
              height: '100%',
              animation: 'slide-left 0.4s ease-in-out',
              willChange: 'transform',
            }}
          >
            {activeTab === 'vein' && <VeinSmeltingPage />}
            {activeTab === 'library' && <ArtifactLibraryPage onSelectArtifact={handleSelectArtifact} />}
            {activeTab === 'collection' && <CollectionBook />}
          </div>
        )}

        {currentPage === 'smelter' && selectedArtifact && (
          <div
            style={{
              width: '100%',
              height: '100%',
              overflowY: 'auto',
              position: 'relative',
              zIndex: 10,
            }}
            className="scrollbar-hide"
          >
            <ArtifactSmelter
              artifact={selectedArtifact}
              activatedElements={activatedElements}
              resonationBoost={resonationBoost}
              onSave={handleSaveArtifact}
              onBack={handleBackToLibrary}
            />
          </div>
        )}

        {(transitionState === 'entering' || transitionState === 'exiting') && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'radial-gradient(ellipse at top, #1a0a2e 0%, #0d1b2a 100%)',
              zIndex: 50,
              pointerEvents: 'none',
              willChange: 'clip-path',
              '--clip-x': `${clipPosition.x}%`,
              '--clip-y': `${clipPosition.y}%`,
              animation: transitionState === 'entering'
                ? 'clip-expand 0.5s ease-in-out forwards'
                : 'clip-collapse 0.5s ease-in-out forwards',
            } as React.CSSProperties}
          />
        )}
      </div>

      <style>{`
        @keyframes slide-left {
          0% {
            transform: translateX(100%);
            opacity: 0;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes clip-expand {
          0% {
            clip-path: circle(0% at var(--clip-x, 50%) var(--clip-y, 50%));
          }
          100% {
            clip-path: circle(100% at var(--clip-x, 50%) var(--clip-y, 50%));
          }
        }

        @keyframes clip-collapse {
          0% {
            clip-path: circle(100% at var(--clip-x, 50%) var(--clip-y, 50%));
          }
          100% {
            clip-path: circle(0% at var(--clip-x, 50%) var(--clip-y, 50%));
          }
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}
