import { memo, useState } from 'react'
import { useGameStore } from '../store/game-store'
import { TowerType, TOWER_CONFIGS } from '../game-logic/tower'
import { Heart, Coins, Layers, ChevronLeft, ChevronRight } from 'lucide-react'

const TowerCard = memo(function TowerCard({
  type,
  isSelected,
  canAfford,
  onClick,
}: {
  type: TowerType
  isSelected: boolean
  canAfford: boolean
  onClick: () => void
}) {
  const config = TOWER_CONFIGS[type]
  const names: Record<TowerType, string> = {
    arrow: '箭塔',
    cannon: '炮塔',
    magic: '魔法塔',
  }

  return (
    <div
      className={`tower-card ${isSelected ? 'selected' : ''} ${!canAfford ? 'disabled' : ''}`}
      onClick={canAfford ? onClick : undefined}
    >
      <div
        className="tower-icon"
        style={{ backgroundColor: config.color }}
      >
        <div className="tower-icon-inner" />
      </div>
      <div className="tower-info">
        <div className="tower-name">{names[type]}</div>
        <div className="tower-cost">
          <Coins size={14} className="coin-icon" />
          <span>{config.cost}</span>
        </div>
      </div>
    </div>
  )
})

export const HUD = memo(function HUD() {
  const { lives, gold, wave, goldBounceKey, selectedTowerType, selectTowerType, isPaused, togglePause } =
    useGameStore()
  const [panelCollapsed, setPanelCollapsed] = useState(false)

  return (
    <>
      <div className="top-hud">
        <div className="hud-item lives">
          <Heart className="heart-icon" size={24} fill="#e53935" color="#e53935" />
          <span className="hud-value lives-value">{lives}</span>
        </div>
        <div className="hud-item wave">
          <Layers size={20} className="wave-icon" />
          <span className="hud-label">波次</span>
          <span className="hud-value wave-value">{wave}</span>
        </div>
        <div className="hud-item gold">
          <Coins className="gold-icon" size={22} />
          <span key={goldBounceKey} className="hud-value gold-value bounce-animation">
            {gold}
          </span>
        </div>
        <button className="pause-btn" onClick={togglePause}>
          {isPaused ? '继续' : '暂停'}
        </button>
      </div>

      <div className={`left-panel ${panelCollapsed ? 'collapsed' : ''}`}>
        <button
          className="panel-toggle"
          onClick={() => setPanelCollapsed(!panelCollapsed)}
        >
          {panelCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {!panelCollapsed && (
          <>
            <h3 className="panel-title">防御塔</h3>
            <div className="tower-list">
              {(['arrow', 'cannon', 'magic'] as TowerType[]).map((type) => (
                <TowerCard
                  key={type}
                  type={type}
                  isSelected={selectedTowerType === type}
                  canAfford={gold >= TOWER_CONFIGS[type].cost}
                  onClick={() =>
                    selectTowerType(selectedTowerType === type ? null : type)
                  }
                />
              ))}
            </div>
            <div className="panel-hint">
              {selectedTowerType
                ? '点击空地放置防御塔'
                : '选择一种防御塔开始建造'}
            </div>
          </>
        )}
      </div>
    </>
  )
})
