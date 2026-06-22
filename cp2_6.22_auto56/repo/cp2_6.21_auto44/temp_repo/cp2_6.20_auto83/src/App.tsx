import { useState, useRef, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { useForgeStore, RuneType, WeaponType, Rune, availableRunes } from './store'
import Forge from './components/Forge'
import './App.css'

const runeInfo: Record<RuneType, { name: string; emoji: string; color: string; bgColor: string }> = {
  fire: { name: '火焰', emoji: '🔥', color: '#ff6b35', bgColor: 'rgba(255, 107, 53, 0.2)' },
  ice: { name: '冰霜', emoji: '❄️', color: '#4ecdc4', bgColor: 'rgba(78, 205, 196, 0.2)' },
  thunder: { name: '雷电', emoji: '⚡', color: '#ffd93d', bgColor: 'rgba(255, 217, 61, 0.2)' },
  shadow: { name: '暗影', emoji: '🌑', color: '#9b59b6', bgColor: 'rgba(155, 89, 182, 0.2)' },
  holy: { name: '神圣', emoji: '✨', color: '#f7f7ff', bgColor: 'rgba(247, 247, 255, 0.2)' },
}

const weaponInfo: Record<WeaponType, { name: string; emoji: string }> = {
  sword: { name: '剑', emoji: '⚔️' },
  bow: { name: '弓', emoji: '🏹' },
  staff: { name: '法杖', emoji: '🔮' },
}

function RuneCard({
  rune,
  selectedLevel,
  onLevelChange,
  onDragStart,
}: {
  rune: Rune
  selectedLevel: number
  onLevelChange: (level: number) => void
  onDragStart: (e: React.DragEvent, rune: Rune) => void
}) {
  const info = runeInfo[rune.type]
  const displayRune = { ...rune, level: selectedLevel }

  return (
    <div
      className="rune-card"
      draggable
      onDragStart={(e) => onDragStart(e, displayRune)}
      style={{
        borderColor: info.color,
        backgroundColor: info.bgColor,
      }}
    >
      <div className="rune-emoji">{info.emoji}</div>
      <div className="rune-name" style={{ color: info.color }}>
        {info.name}符文
      </div>
      <div className="rune-levels">
        {[1, 2, 3, 4, 5].map((lv) => (
          <button
            key={lv}
            className={`rune-level-btn ${selectedLevel === lv ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onLevelChange(lv)
            }}
            style={{
              backgroundColor: selectedLevel === lv ? info.color : 'rgba(255,255,255,0.1)',
              color: selectedLevel === lv ? '#1a1a2e' : info.color,
              borderColor: info.color,
            }}
          >
            {lv}
          </button>
        ))}
      </div>
    </div>
  )
}

function RuneSlot({
  index,
  rune,
  isHovered,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
}: {
  index: number
  rune: Rune | null
  isHovered: boolean
  onDragOver: (e: React.DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: React.DragEvent, index: number) => void
  onRemove: (index: number) => void
}) {
  const info = rune ? runeInfo[rune.type] : null

  return (
    <div
      className={`rune-slot ${isHovered ? 'hovered' : ''} ${rune ? 'filled' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      onClick={() => rune && onRemove(index)}
      style={{
        borderColor: info ? info.color : 'rgba(230, 184, 0, 0.3)',
        backgroundColor: info ? info.bgColor : 'rgba(0, 0, 0, 0.4)',
      }}
    >
      {rune ? (
        <>
          <div className="slot-emoji">{info!.emoji}</div>
          <div className="slot-level" style={{ color: info!.color }}>
            Lv.{rune.level}
          </div>
        </>
      ) : (
        <div className="slot-empty">槽位 {index + 1}</div>
      )}
    </div>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={`star ${star <= rating ? 'active' : ''}`}>
          ★
        </span>
      ))}
    </div>
  )
}

export default function App() {
  const weaponType = useForgeStore((s) => s.weaponType)
  const weaponName = useForgeStore((s) => s.weaponName)
  const setWeaponType = useForgeStore((s) => s.setWeaponType)
  const gold = useForgeStore((s) => s.gold)
  const attack = useForgeStore((s) => s.attack)
  const elementDamage = useForgeStore((s) => s.elementDamage)
  const critRate = useForgeStore((s) => s.critRate)
  const upgradeLevel = useForgeStore((s) => s.upgradeLevel)
  const upgradeChance = useForgeStore((s) => s.upgradeChance)
  const slots = useForgeStore((s) => s.slots)
  const setRuneInSlot = useForgeStore((s) => s.setRuneInSlot)
  const removeRuneFromSlot = useForgeStore((s) => s.removeRuneFromSlot)
  const upgrade = useForgeStore((s) => s.upgrade)
  const animation = useForgeStore((s) => s.animation)

  const [runeLevels, setRuneLevels] = useState<Record<RuneType, number>>({
    fire: 1,
    ice: 1,
    thunder: 1,
    shadow: 1,
    holy: 1,
  })

  const [hoveredSlots, setHoveredSlots] = useState<Set<number>>(new Set())
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [isNarrow, setIsNarrow] = useState(false)
  const [draggingOffset, setDraggingOffset] = useState<{ x: number; y: number } | null>(null)
  const dragGhostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const checkWidth = () => {
      setIsNarrow(window.innerWidth < 1024)
    }
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  const handleRuneLevelChange = (type: RuneType, level: number) => {
    setRuneLevels((prev) => ({ ...prev, [type]: level }))
  }

  const handleDragStart = (e: React.DragEvent, rune: Rune) => {
    e.dataTransfer.setData('application/json', JSON.stringify(rune))
    e.dataTransfer.effectAllowed = 'copyMove'

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setDraggingOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })

    if (dragGhostRef.current) {
      const info = runeInfo[rune.type]
      dragGhostRef.current.style.display = 'block'
      dragGhostRef.current.innerHTML = `<div style="font-size:32px">${info.emoji}</div><div style="color:${info.color};font-size:12px">Lv.${rune.level}</div>`
      e.dataTransfer.setDragImage(dragGhostRef.current, 30, 30)
    }
  }

  const handleDragOver = (slotIndex: number) => (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setHoveredSlots((prev) => new Set(prev).add(slotIndex))
  }

  const handleDragLeave = (slotIndex: number) => () => {
    setHoveredSlots((prev) => {
      const next = new Set(prev)
      next.delete(slotIndex)
      return next
    })
  }

  const handleDrop = (e: React.DragEvent, slotIndex: number) => {
    e.preventDefault()
    setHoveredSlots((prev) => {
      const next = new Set(prev)
      next.delete(slotIndex)
      return next
    })
    try {
      const data = e.dataTransfer.getData('application/json')
      if (data) {
        const rune = JSON.parse(data) as Rune
        setRuneInSlot(slotIndex, rune)
      }
    } catch {}
  }

  const handleRemoveRune = (slotIndex: number) => {
    removeRuneFromSlot(slotIndex)
  }

  const calcRating = (): number => {
    const runeScore = slots.filter((s) => s.rune).length * 20
    const levelScore = upgradeLevel * 10
    const statScore = (attack + elementDamage) / 20
    const total = runeScore + levelScore + statScore
    if (total >= 100) return 5
    if (total >= 80) return 4
    if (total >= 60) return 3
    if (total >= 40) return 2
    return 1
  }

  const upgradeCost = upgradeLevel * 100
  const rating = calcRating()

  return (
    <div className={`app-container ${animation}`}>
      <div ref={dragGhostRef} className="drag-ghost" />

      <header className="top-toolbar">
        <div className="weapon-buttons">
          {(Object.keys(weaponInfo) as WeaponType[]).map((type) => (
            <button
              key={type}
              className={`weapon-btn ${weaponType === type ? 'active' : ''}`}
              onClick={() => setWeaponType(type)}
            >
              <span className="weapon-emoji">{weaponInfo[type].emoji}</span>
              <span className="weapon-label">{weaponInfo[type].name}</span>
            </button>
          ))}
        </div>
        <div className="weapon-name-display">{weaponName}</div>
        <div className="gold-display">
          <span className="gold-icon">💰</span>
          <span className="gold-amount">{gold.toLocaleString()}</span>
        </div>
      </header>

      <div className="main-content">
        <aside
          className={`left-panel ${isNarrow ? 'narrow' : ''} ${leftPanelOpen ? 'open' : ''}`}
          onClick={isNarrow ? () => setLeftPanelOpen(!leftPanelOpen) : undefined}
        >
          <div className="panel-content">
            <div className="preview-section">
              <div className="preview-title">武器预览</div>
              <div className="preview-emoji">{weaponInfo[weaponType].emoji}</div>
              <div className="preview-weapon-name">{weaponName}</div>
              <div className="preview-level">+{upgradeLevel}</div>
            </div>

            <div className="rune-slots-section">
              <div className="section-title">符文槽位</div>
              <div className="rune-slots">
                {slots.map((slot, i) => (
                  <RuneSlot
                    key={i}
                    index={i}
                    rune={slot.rune}
                    isHovered={hoveredSlots.has(i)}
                    onDragOver={handleDragOver(i)}
                    onDragLeave={handleDragLeave(i)}
                    onDrop={handleDrop}
                    onRemove={handleRemoveRune}
                  />
                ))}
              </div>
            </div>

            <div className="runes-section">
              <div className="section-title">符文列表 (拖拽到槽位)</div>
              <div className="runes-list">
                {(Object.keys(runeInfo) as RuneType[]).map((type) => (
                  <RuneCard
                    key={type}
                    rune={availableRunes[type][0]}
                    selectedLevel={runeLevels[type]}
                    onLevelChange={(lv) => handleRuneLevelChange(type, lv)}
                    onDragStart={handleDragStart}
                  />
                ))}
              </div>
            </div>
          </div>

          {isNarrow && (
            <div className="narrow-icon">
              <span>📜</span>
              <small>符文</small>
            </div>
          )}
        </aside>

        {isNarrow && leftPanelOpen && (
          <div className="panel-overlay" onClick={() => setLeftPanelOpen(false)} />
        )}
        {isNarrow && rightPanelOpen && (
          <div className="panel-overlay" onClick={() => setRightPanelOpen(false)} />
        )}

        <main className="canvas-container">
          <Canvas
            camera={{ position: [0, 0, 5], fov: 50 }}
            style={{ background: 'transparent' }}
          >
            <Forge />
          </Canvas>

          {animation === 'success' && (
            <div className="animation-overlay success-animation">
              <div className="golden-pillar" />
              <div className="success-text">Success!</div>
            </div>
          )}
          {animation === 'fail' && (
            <div className="animation-overlay fail-animation">
              <div className="fail-text">失败...</div>
            </div>
          )}
        </main>

        <aside
          className={`right-panel ${isNarrow ? 'narrow' : ''} ${rightPanelOpen ? 'open' : ''}`}
          onClick={isNarrow ? () => setRightPanelOpen(!rightPanelOpen) : undefined}
        >
          <div className="panel-content">
            <div className="stats-section">
              <div className="section-title">属性面板</div>
              <div className="stat-item">
                <span className="stat-label">⚔️ 攻击力</span>
                <span className="stat-value attack">{attack}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">🔮 元素伤害</span>
                <span className="stat-value element">{elementDamage}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">💥 暴击率</span>
                <span className="stat-value crit">{(critRate * 100).toFixed(1)}%</span>
              </div>
            </div>

            <div className="upgrade-section">
              <div className="section-title">武器强化</div>
              <div className="upgrade-level-display">
                <span className="level-label">强化等级</span>
                <span className="level-value">+{upgradeLevel}</span>
              </div>
              <div className="upgrade-chance">
                <span className="chance-label">成功概率</span>
                <div className="chance-bar">
                  <div
                    className="chance-fill"
                    style={{
                      width: `${upgradeChance * 100}%`,
                      backgroundColor:
                        upgradeChance >= 0.7 ? '#27ae60' : upgradeChance >= 0.4 ? '#e6b800' : '#e74c3c',
                    }}
                  />
                </div>
                <span
                  className="chance-value"
                  style={{
                    color:
                      upgradeChance >= 0.7 ? '#27ae60' : upgradeChance >= 0.4 ? '#e6b800' : '#e74c3c',
                  }}
                >
                  {(upgradeChance * 100).toFixed(0)}%
                </span>
              </div>
              <button
                className={`upgrade-btn ${animation}`}
                onClick={upgrade}
                disabled={gold < upgradeCost}
              >
                <span className="upgrade-text">强化武器</span>
                <span className="upgrade-cost">
                  💰 {upgradeCost === 0 ? '免费' : upgradeCost.toLocaleString()}
                </span>
              </button>
            </div>

            <div className="rating-section">
              <div className="section-title">最终评分</div>
              <StarRating rating={rating} />
              <div className="rating-text">
                {rating === 5 && '传说品质'}
                {rating === 4 && '史诗品质'}
                {rating === 3 && '稀有品质'}
                {rating === 2 && '优秀品质'}
                {rating === 1 && '普通品质'}
              </div>
            </div>
          </div>

          {isNarrow && (
            <div className="narrow-icon">
              <span>⚙️</span>
              <small>属性</small>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
