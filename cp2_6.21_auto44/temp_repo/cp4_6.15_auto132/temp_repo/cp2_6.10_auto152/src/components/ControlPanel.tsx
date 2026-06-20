import React, { memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  useGameStore, 
  DEFENSE_CONFIGS, 
  DefenseType
} from '../store/gameStore'

const ControlPanel: React.FC = memo(() => {
  const {
    resources,
    fortressHealth,
    maxFortressHealth,
    currentWave,
    totalWaves,
    phase,
    selectedDefense,
    removeMode,
    setSelectedDefense,
    setRemoveMode,
    startWave,
    resetGame,
    nextWave,
    enemies
  } = useGameStore()

  const handleDragStart = useCallback((type: DefenseType) => {
    if (resources < DEFENSE_CONFIGS[type].cost) {
      return
    }
    window.dispatchEvent(new CustomEvent('defenseDragStart', { detail: { type } }))
  }, [resources])

  const handleDragEnd = useCallback(() => {
    window.dispatchEvent(new CustomEvent('defenseDragEnd'))
  }, [])

  const handleItemClick = useCallback((type: DefenseType) => {
    if (resources >= DEFENSE_CONFIGS[type].cost) {
      setSelectedDefense(selectedDefense === type ? null : type)
    }
  }, [resources, selectedDefense, setSelectedDefense])

  const healthPercentage = (fortressHealth / maxFortressHealth) * 100
  const healthClass = healthPercentage > 60 ? 'high' : healthPercentage > 30 ? 'medium' : ''

  const canStartWave = phase === 'preparing' && currentWave < totalWaves
  const canRemove = phase === 'preparing'

  const renderDefenseItems = () => {
    return Object.values(DEFENSE_CONFIGS).map(config => {
      const canAfford = resources >= config.cost
      const isSelected = selectedDefense === config.type
      
      return (
        <motion.div
          key={config.type}
          className={`defense-item ${!canAfford ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
          draggable={canAfford && canRemove}
          onDragStart={() => handleDragStart(config.type)}
          onDragEnd={handleDragEnd}
          onClick={() => handleItemClick(config.type)}
          whileHover={canAfford ? { scale: 1.02 } : {}}
          whileTap={canAfford ? { scale: 0.98 } : {}}
          style={{
            borderColor: isSelected ? '#ffd700' : undefined,
            boxShadow: isSelected ? '0 0 10px rgba(255, 215, 0, 0.5)' : undefined
          }}
        >
          <div className="defense-icon">{config.icon}</div>
          <div className="defense-info">
            <div className="defense-name">{config.name}</div>
            <div className="defense-cost">消耗: {config.cost} 资源</div>
          </div>
        </motion.div>
      )
    })
  }

  return (
    <div className="control-panel">
      <div className="panel-section">
        <h3 className="panel-title">战况</h3>
        <div className="stat-row">
          <span>波次</span>
          <span className="stat-value">{currentWave} / {totalWaves}</span>
        </div>
        <div className="stat-row">
          <span>资源</span>
          <span className="stat-value">{resources}</span>
        </div>
        <div className="stat-row">
          <span>剩余敌兵</span>
          <span className="stat-value">{enemies.length}</span>
        </div>
        <div className="stat-row" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <span>烽燧耐久</span>
          <div className="health-bar">
            <motion.div
              className={`health-fill ${healthClass}`}
              initial={{ width: `${healthPercentage}%` }}
              animate={{ width: `${healthPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <span style={{ textAlign: 'right', fontSize: '12px', marginTop: '4px' }}>
            {fortressHealth} / {maxFortressHealth}
          </span>
        </div>
      </div>

      <div className="panel-section">
        <h3 className="panel-title">防御设施</h3>
        <div className="defense-items">
          {renderDefenseItems()}
        </div>
        {selectedDefense && (
          <p className="remove-hint">已选择 {DEFENSE_CONFIGS[selectedDefense].name}，点击地图放置</p>
        )}
      </div>

      <div className="panel-section">
        <h3 className="panel-title">操作</h3>
        {phase === 'preparing' && currentWave < totalWaves && (
          <React.Fragment>
            <motion.button
              className="action-btn"
              onClick={() => setRemoveMode(!removeMode)}
              style={{ marginBottom: '10px' }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {removeMode ? '取消拆除' : '拆除设施'}
            </motion.button>
            <motion.button
              className="action-btn"
              onClick={startWave}
              disabled={!canStartWave}
              whileHover={canStartWave ? { scale: 1.02 } : {}}
              whileTap={canStartWave ? { scale: 0.98 } : {}}
            >
              {currentWave === 0 ? '开始战斗' : `开始第 ${currentWave + 1} 波`}
            </motion.button>
          </React.Fragment>
        )}

        {phase === 'fighting' && enemies.length === 0 && (
          <motion.button
            className="action-btn"
            onClick={nextWave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            本波已肃清
          </motion.button>
        )}

        {phase === 'fighting' && enemies.length > 0 && (
          <motion.button
            className="action-btn"
            disabled
          >
            战斗中...
          </motion.button>
        )}

        {(phase === 'victory' || phase === 'defeat') && (
          <motion.button
            className="action-btn danger"
            onClick={resetGame}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            重新开始
          </motion.button>
        )}

        {removeMode && (
          <p className="remove-hint">点击地图上的设施进行拆除，返还50%资源</p>
        )}
      </div>

      <div className="panel-section" style={{ fontSize: '12px', color: '#d4b896', lineHeight: '1.6' }}>
        <h3 className="panel-title" style={{ fontSize: '14px' }}>操作说明</h3>
        <p>• 右键拖拽平移地图</p>
        <p>• 滚轮缩放地图</p>
        <p>• 拖拽或点击选择设施后在地图放置</p>
        <p>• 击杀敌兵获得资源奖励</p>
        <p>• 撑过5波敌兵即可胜利</p>
      </div>
    </div>
  )
})

ControlPanel.displayName = 'ControlPanel'

export default ControlPanel
