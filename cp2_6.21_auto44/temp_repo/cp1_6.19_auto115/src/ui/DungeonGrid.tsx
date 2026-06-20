import { motion } from 'framer-motion'
import { FaSkull } from 'react-icons/fa'
import type { DungeonData, Room } from '../domain/dungeonGenerator'
import { getNeighbors } from '../domain/dungeonGenerator'

interface DungeonGridProps {
  dungeon: DungeonData
  currentRoomId: string
  onRoomClick: (roomId: string) => void
  cellSize?: number
}

const UNEXPLORED_COLOR = '#333333'
const EXPLORED_COLOR = '#888888'
const CURRENT_COLOR = '#FFBF00'
const MONSTER_COLOR = '#E53935'

function DungeonRoom({
  room,
  isCurrent,
  isNeighbor,
  onClick,
  cellSize,
}: {
  room: Room
  isCurrent: boolean
  isNeighbor: boolean
  onClick: () => void
  cellSize: number
}) {
  let bgColor = UNEXPLORED_COLOR
  let cursor = 'default'

  if (room.explored) {
    bgColor = EXPLORED_COLOR
  }

  if (isCurrent) {
    bgColor = CURRENT_COLOR
  }

  if (isNeighbor && room.explored) {
    cursor = 'pointer'
  }

  if (isNeighbor && !room.explored) {
    cursor = 'pointer'
  }

  const showMonster =
    room.explored && room.hasMonster && !room.monsterDefeated

  return (
    <motion.div
      className="dungeon-room"
      whileHover={isNeighbor ? { scale: 1.1 } : {}}
      onClick={isNeighbor ? onClick : undefined}
      style={{
        width: cellSize,
        height: cellSize,
        backgroundColor: bgColor,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor,
        position: 'relative',
        border: isNeighbor ? '2px solid rgba(255,255,255,0.3)' : '2px solid transparent',
      }}
      animate={
        isCurrent
          ? {
              boxShadow: [
                `0 0 0px ${CURRENT_COLOR}`,
                `0 0 20px ${CURRENT_COLOR}`,
                `0 0 0px ${CURRENT_COLOR}`,
              ],
            }
          : {}
      }
      transition={
        isCurrent
          ? {
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : {}
      }
    >
      {showMonster && (
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            position: 'absolute',
            width: '70%',
            height: '70%',
            borderRadius: '50%',
            backgroundColor: MONSTER_COLOR,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.9,
          }}
        >
          <FaSkull style={{ color: 'white', fontSize: cellSize * 0.35 }} />
        </motion.div>
      )}

      {isCurrent && (
        <div
          style={{
            fontSize: cellSize * 0.4,
            fontWeight: 'bold',
            color: '#1E1E1E',
            zIndex: 1,
          }}
        >
          ★
        </div>
      )}
    </motion.div>
  )
}

export default function DungeonGrid({
  dungeon,
  currentRoomId,
  onRoomClick,
  cellSize = 80,
}: DungeonGridProps) {
  const { rooms, width, height } = dungeon
  const neighbors = getNeighbors(dungeon, currentRoomId)
  const neighborIds = new Set(neighbors.map((n) => n.id))

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${width}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${height}, ${cellSize}px)`,
    gap: 8,
    padding: 20,
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      style={gridStyle}
    >
      {rooms.map((room) => (
        <DungeonRoom
          key={room.id}
          room={room}
          isCurrent={room.id === currentRoomId}
          isNeighbor={neighborIds.has(room.id)}
          onClick={() => onRoomClick(room.id)}
          cellSize={cellSize}
        />
      ))}
    </motion.div>
  )
}
