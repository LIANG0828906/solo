import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaGem, FaShieldAlt, FaRing } from 'react-icons/fa'
import type { Equipment, EquipmentType } from '../domain/combatSystem'
import type { InventoryState } from '../domain/playerInventory'
import { equipmentTypeNames } from '../domain/saveManager'

interface InventoryPanelProps {
  isOpen: boolean
  onClose: () => void
  inventory: InventoryState
  onEquip: (itemId: string) => void
  onUnequip: (type: EquipmentType) => void
  onDiscard: (itemId: string) => void
}

const typeIcons: Record<EquipmentType, React.ReactNode> = {
  weapon: <FaGem style={{ color: '#FF5252' }} />,
  armor: <FaShieldAlt style={{ color: '#64B5F6' }} />,
  ring: <FaRing style={{ color: '#FFD700' }} />,
  helmet: <FaGem style={{ color: '#9C27B0' }} />,
}

const typeColors: Record<EquipmentType, string> = {
  weapon: 'linear-gradient(135deg, #FF5252 0%, #D32F2F 100%)',
  armor: 'linear-gradient(135deg, #64B5F6 0%, #1976D2 100%)',
  ring: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
  helmet: 'linear-gradient(135deg, #9C27B0 0%, #6A1B9A 100%)',
}

function EquipmentCard({
  item,
  isEquipped,
  onEquip,
  onDiscard,
}: {
  item: Equipment
  isEquipped: boolean
  onEquip: () => void
  onDiscard: () => void
}) {
  const [showActions, setShowActions] = useState(false)

  return (
    <motion.div
      className="inventory-card"
      layout
      whileHover={{ scale: 1.03 }}
      onClick={() => setShowActions(!showActions)}
      style={{
        background: typeColors[item.type],
        borderRadius: 12,
        padding: 12,
        minHeight: 120,
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          fontSize: 20,
        }}
      >
        {typeIcons[item.type]}
      </div>

      <div
        style={{
          fontWeight: 'bold',
          fontSize: 14,
          marginBottom: 8,
          color: 'white',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }}
      >
        {item.name}
      </div>

      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)' }}>
        <div style={{ marginBottom: 2 }}>
          类型: {equipmentTypeNames[item.type]}
        </div>
        {item.attackBonus > 0 && (
          <div style={{ color: '#FFCDD2' }}>攻击 +{item.attackBonus}</div>
        )}
        {item.defenseBonus > 0 && (
          <div style={{ color: '#BBDEFB' }}>防御 +{item.defenseBonus}</div>
        )}
        {item.healthBonus > 0 && (
          <div style={{ color: '#C8E6C9' }}>生命 +{item.healthBonus}</div>
        )}
      </div>

      {isEquipped && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            fontSize: 10,
            backgroundColor: 'rgba(0,0,0,0.3)',
            padding: '2px 8px',
            borderRadius: 10,
          }}
        >
          已装备
        </div>
      )}

      <AnimatePresence>
        {showActions && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              display: 'flex',
              gap: 4,
              padding: 8,
              backgroundColor: 'rgba(0,0,0,0.8)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {!isEquipped && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onEquip}
                style={{
                  flex: 1,
                  padding: '6px 0',
                  backgroundColor: '#4CAF50',
                  color: 'white',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                装备
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onDiscard}
              style={{
                flex: 1,
                padding: '6px 0',
                backgroundColor: '#F44336',
                color: 'white',
                borderRadius: 6,
                fontSize: 12,
              }}
            >
              丢弃
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function EquippedSlot({
  type,
  item,
  onUnequip,
}: {
  type: EquipmentType
  item: Equipment | null
  onUnequip: () => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: 8,
          backgroundColor: item ? 'transparent' : '#0D1442',
          border: '2px solid #3949AB',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          background: item ? typeColors[type] : undefined,
          cursor: item ? 'pointer' : 'default',
        }}
        onClick={item ? onUnequip : undefined}
      >
        {item ? typeIcons[type] : <span style={{ opacity: 0.3 }}>+</span>}
      </div>
      <span style={{ fontSize: 11, color: '#BBB' }}>
        {equipmentTypeNames[type]}
      </span>
    </div>
  )
}

export default function InventoryPanel({
  isOpen,
  onClose,
  inventory,
  onEquip,
  onUnequip,
  onDiscard,
}: InventoryPanelProps) {
  const equippedTypes: EquipmentType[] = ['weapon', 'armor', 'ring', 'helmet']
  const [columns, setColumns] = useState(4)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setColumns(2)
      } else {
        setColumns(4)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#00000080',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.3, type: 'spring', damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 600,
              maxWidth: '90vw',
              height: 400,
              maxHeight: '90vh',
              backgroundColor: '#1A237E',
              borderRadius: 16,
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                paddingBottom: 12,
                borderBottom: '1px solid #3949AB',
              }}
            >
              <h2 style={{ fontSize: 20 }}>🎒 背包</h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  backgroundColor: '#3949AB',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                }}
              >
                ×
              </motion.button>
            </div>

            <div
              style={{
                marginBottom: 16,
                padding: 12,
                backgroundColor: '#0D1442',
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 13, marginBottom: 8, color: '#9FA8DA' }}>
                已装备
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                }}
              >
                {equippedTypes.map((type) => (
                  <EquippedSlot
                    key={type}
                    type={type}
                    item={inventory.equipped[type]}
                    onUnequip={() => onUnequip(type)}
                  />
                ))}
              </div>
            </div>

            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: 8,
              }}
            >
              <div style={{ fontSize: 13, marginBottom: 8, color: '#9FA8DA' }}>
                物品 ({inventory.equipment.length})
              </div>
              {inventory.equipment.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 40,
                    color: '#5C6BC0',
                    fontSize: 14,
                  }}
                >
                  背包空空如也...
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gap: 8,
                  }}
                >
                  {inventory.equipment.map((item) => (
                    <EquipmentCard
                      key={item.id}
                      item={item}
                      isEquipped={false}
                      onEquip={() => onEquip(item.id)}
                      onDiscard={() => onDiscard(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
