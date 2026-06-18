import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaSync, FaDownload, FaBox, FaInfoCircle } from 'react-icons/fa'
import DungeonGrid from './DungeonGrid'
import CombatModal from './CombatModal'
import InventoryPanel from './InventoryPanel'
import StatusBar from './StatusBar'
import { GameProvider, useGame } from './GameContext'
import { getRoomById } from '../domain/dungeonGenerator'
import type { EquipmentType } from '../domain/combatSystem'

function GameContent() {
  const { state, generateNewDungeon, moveToRoom, attack, closeCombat, equipItem, unequipItem, discardItem, exportSave } = useGame()

  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [cellSize, setCellSize] = useState(80)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCellSize(60)
      } else {
        setCellSize(80)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (state.combatActive) return

      if (e.key === 'i' || e.key === 'I') {
        setInventoryOpen(true)
        return
      }
      if (e.key === 'Escape') {
        setInventoryOpen(false)
        return
      }

      if (inventoryOpen) return

      const currentRoom = getRoomById(state.dungeon, state.currentRoomId)
      if (!currentRoom) return

      let targetX = currentRoom.x
      let targetY = currentRoom.y

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          targetY -= 1
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          targetY += 1
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          targetX -= 1
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          targetX += 1
          break
        default:
          return
      }

      const targetRoomId = `${targetX},${targetY}`
      moveToRoom(targetRoomId)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.dungeon, state.currentRoomId, state.combatActive, inventoryOpen, moveToRoom])

  const handleEquip = (itemId: string) => {
    equipItem(itemId)
  }

  const handleUnequip = (type: string) => {
    unequipItem(type as EquipmentType)
  }

  const handleDiscard = (itemId: string) => {
    discardItem(itemId)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#1E1E1E',
        color: 'white',
      }}
    >
      <StatusBar stats={state.inventory.playerStats} />

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          fontSize: 28,
          marginBottom: 20,
          color: '#FFBF00',
          textShadow: '0 2px 10px rgba(255,191,0,0.3)',
        }}
      >
        🏰 Roguelike 地牢探索
      </motion.h1>

      <AnimatePresence>
        {state.lootMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: 160,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#4CAF50',
              color: 'white',
              padding: '12px 24px',
              borderRadius: 8,
              zIndex: 50,
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
            }}
          >
            🎉 {state.lootMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <DungeonGrid
        dungeon={state.dungeon}
        currentRoomId={state.currentRoomId}
        onRoomClick={moveToRoom}
        cellSize={cellSize}
      />

      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 20,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: '#333333' }}
          />
          <span>未探索</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: '#888888' }}
          />
          <span>已探索</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{ backgroundColor: '#FFBF00' }}
          />
          <span>当前位置</span>
        </div>
        <div className="legend-item">
          <div
            className="legend-color"
            style={{
              backgroundColor: '#E53935',
              borderRadius: '50%',
            }}
          />
          <span>怪物房间</span>
        </div>
      </div>

      <div
        style={{
          marginTop: 24,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: '#8BC34A' }}
          whileTap={{ scale: 0.95 }}
          onClick={generateNewDungeon}
          style={{
            padding: '12px 24px',
            backgroundColor: '#689F38',
            color: 'white',
            borderRadius: 8,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <FaSync />
          生成新地牢
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: '#5C6BC0' }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setInventoryOpen(true)}
          style={{
            padding: '12px 24px',
            backgroundColor: '#3949AB',
            color: 'white',
            borderRadius: 8,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <FaBox />
          背包 (I)
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05, backgroundColor: '#8E24AA' }}
          whileTap={{ scale: 0.95 }}
          onClick={exportSave}
          style={{
            padding: '12px 24px',
            backgroundColor: '#6A1B9A',
            color: 'white',
            borderRadius: 8,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <FaDownload />
          导出存档
        </motion.button>
      </div>

      <div
        style={{
          marginTop: 20,
          fontSize: 13,
          color: '#666',
          textAlign: 'center',
          maxWidth: 500,
        }}
      >
        <FaInfoCircle style={{ marginRight: 6 }} />
        使用方向键或 WASD 移动，点击相邻房间也可移动。按 I 打开背包。
        遇到怪物会自动进入战斗，击败后有概率掉落装备。
      </div>

      <CombatModal
        isOpen={state.combatActive}
        enemy={state.currentEnemy}
        playerHealth={state.inventory.playerStats.currentHealth}
        playerMaxHealth={state.inventory.playerStats.maxHealth}
        onAttack={attack}
        onClose={closeCombat}
        isPlayerAttacking={state.isPlayerAttacking}
        isEnemyAttacking={state.isEnemyAttacking}
        combatLog={state.combatLog}
        combatResult={state.combatResult}
      />

      <InventoryPanel
        isOpen={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
        inventory={state.inventory}
        onEquip={handleEquip}
        onUnequip={handleUnequip}
        onDiscard={handleDiscard}
      />
    </div>
  )
}

export default function App() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  )
}
