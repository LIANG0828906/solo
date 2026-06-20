import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Float, Text } from '@react-three/drei'
import * as THREE from 'three'
import { useGameStore } from '../../stores/gameStore'
import { RuneSlot } from './RuneSlot'
import { elementColors } from '../../utils/gemUtils'
import { getRandomOpponent, calculatePlayerStats, simulateBattle } from '../../utils/battleEngine'
import { playAttackHit, playSpecialEffect, playVictory } from '../../utils/audioUtils'
import type { Rune, SlotType, BattleRecord } from '../../types'
import './BattleArena.css'

const CharacterModel: React.FC<{ position: [number, number, number]; color: string; isAttacking: boolean; isPlayer?: boolean }> = ({
  position,
  color,
  isAttacking,
  isPlayer = true,
}) => {
  const meshRef = useRef<THREE.Group>(null)
  const [attackOffset, setAttackOffset] = useState(0)

  useFrame((_, delta) => {
    if (meshRef.current) {
      if (isAttacking) {
        setAttackOffset(isPlayer ? 1.5 : -1.5)
      } else {
        setAttackOffset(0)
      }
      meshRef.current.position.x = position[0] + attackOffset
      meshRef.current.position.y = position[1] + Math.sin(Date.now() * 0.002) * 0.1
    }
  })

  return (
    <group ref={meshRef} position={position}>
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <capsuleGeometry args={[0.4, 1, 4, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, -0.8, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 0.6, 8]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <pointLight position={[0, 0.5, 0]} color={color} intensity={isPlayer ? 1 : 0.5} distance={3} />
    </group>
  )
}

const DamageNumber: React.FC<{ position: [number, number, number]; value: number; isPlayer: boolean }> = ({ position, value, isPlayer }) => {
  const groupRef = useRef<THREE.Group>(null)
  const [visible, setVisible] = useState(true)
  const [yOffset, setYOffset] = useState(0)
  const [opacity, setOpacity] = useState(1)

  useFrame((_, delta) => {
    if (groupRef.current && visible) {
      setYOffset((prev) => prev + delta * 1.5)
      setOpacity((prev) => Math.max(0, prev - delta * 0.8))
    }
  })

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 1200)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  return (
    <group ref={groupRef} position={[position[0], position[1] + 2 + yOffset, position[2]]}>
      <Text
        fontSize={0.4}
        color={isPlayer ? '#ff6666' : '#66ff66'}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.04}
        outlineColor="#000"
        transparent
        opacity={opacity}
      >
        {value > 0 ? `-${value}` : '闪避!'}
      </Text>
    </group>
  )
}

const BattleScene: React.FC<{
  playerColor: string
  opponentColor: string
  isBattleActive: boolean
  currentTurn: 'player' | 'opponent'
  damageNumbers: Array<{ id: number; value: number; isPlayer: boolean }>
}> = ({ playerColor, opponentColor, isBattleActive, currentTurn, damageNumbers }) => {
  const playerAttacking = isBattleActive && currentTurn === 'player'
  const opponentAttacking = isBattleActive && currentTurn === 'opponent'

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 5, 0]} intensity={0.5} />
      <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={0.5} />

      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
        <CharacterModel position={[-2, 0, 0]} color={playerColor} isAttacking={playerAttacking} isPlayer />
      </Float>

      <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
        <CharacterModel position={[2, 0, 0]} color={opponentColor} isAttacking={opponentAttacking} isPlayer={false} />
      </Float>

      <mesh position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[4, 32]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.8} />
      </mesh>

      {damageNumbers.map((dmg) => (
        <DamageNumber
          key={dmg.id}
          position={[dmg.isPlayer ? -2 : 2, 1, 0]}
          value={dmg.value}
          isPlayer={dmg.isPlayer}
        />
      ))}
    </>
  )
}

export const BattleArena: React.FC = () => {
  const { equippedRunes, equipRune, unequipRune, addBattleRecord, runeCollection } = useGameStore()
  const [isBattling, setIsBattling] = useState(false)
  const [opponent, setOpponent] = useState(getRandomOpponent())
  const [battleResult, setBattleResult] = useState<BattleRecord | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [currentTurn, setCurrentTurn] = useState<'player' | 'opponent'>('player')
  const [damageNumbers, setDamageNumbers] = useState<Array<{ id: number; value: number; isPlayer: boolean }>>([])
  const [playerHealth, setPlayerHealth] = useState(500)
  const [opponentHealth, setOpponentHealth] = useState(200)
  const damageIdRef = useRef(0)
  const battleIntervalRef = useRef<number | null>(null)

  const playerStats = calculatePlayerStats(equippedRunes)
  const playerColor = playerStats.element !== 'neutral' && elementColors[playerStats.element as keyof typeof elementColors]
    ? elementColors[playerStats.element as keyof typeof elementColors]
    : '#c9a34a'

  const opponentColor = opponent.element !== 'stone' && elementColors[opponent.element as keyof typeof elementColors]
    ? elementColors[opponent.element as keyof typeof elementColors]
    : '#888888'

  const handleEquipRune = (slot: SlotType, rune: Rune) => {
    equipRune(slot, rune)
  }

  const handleUnequipRune = (slot: SlotType) => {
    unequipRune(slot)
  }

  const addDamageNumber = useCallback((value: number, isPlayer: boolean) => {
    const id = damageIdRef.current++
    setDamageNumbers((prev) => [...prev, { id, value, isPlayer }])
    setTimeout(() => {
      setDamageNumbers((prev) => prev.filter((d) => d.id !== id))
    }, 1000)
  }, [])

  const startBattle = () => {
    if (isBattling) return
    
    const newOpponent = getRandomOpponent()
    setOpponent(newOpponent)
    setIsBattling(true)
    setShowResult(false)
    setBattleResult(null)
    setPlayerHealth(playerStats.health)
    setOpponentHealth(newOpponent.baseHealth)

    const result = simulateBattle(playerStats, newOpponent)
    let currentLogIndex = 0

    battleIntervalRef.current = window.setInterval(() => {
      if (currentLogIndex >= result.damageLog.length) {
        if (battleIntervalRef.current) {
          clearInterval(battleIntervalRef.current)
          battleIntervalRef.current = null
        }
        setIsBattling(false)
        setBattleResult({
          id: '',
          timestamp: Date.now(),
          opponent: newOpponent.name,
          totalDamage: result.totalDamage,
          effectsTriggered: result.effectsTriggered,
          turns: result.turns,
          victory: result.victory,
        })
        addBattleRecord({
          opponent: newOpponent.name,
          totalDamage: result.totalDamage,
          effectsTriggered: result.effectsTriggered,
          turns: result.turns,
          victory: result.victory,
        })
        setShowResult(true)
        if (result.victory) {
          playVictory()
        }
        return
      }

      const log = result.damageLog[currentLogIndex]
      
      if (log.attacker === 'player') {
        setCurrentTurn('player')
        setOpponentHealth((prev) => Math.max(0, prev - log.damage))
        addDamageNumber(log.damage, false)
        playAttackHit()
        if (log.effect) {
          playSpecialEffect()
        }
      } else {
        setCurrentTurn('opponent')
        if (log.damage > 0) {
          setPlayerHealth((prev) => Math.max(0, prev - log.damage))
          addDamageNumber(log.damage, true)
        }
      }

      currentLogIndex++
    }, 800)
  }

  useEffect(() => {
    return () => {
      if (battleIntervalRef.current) {
        clearInterval(battleIntervalRef.current)
      }
    }
  }, [])

  const slotPositions: { slot: SlotType; position: string }[] = [
    { slot: 'helmet', position: 'top' },
    { slot: 'chest', position: 'right' },
    { slot: 'weapon', position: 'right' },
    { slot: 'offhand', position: 'left' },
    { slot: 'bracers', position: 'left' },
    { slot: 'ring', position: 'bottom' },
  ]

  return (
    <div className="battle-arena">
      <h2 className="section-title">战斗模拟</h2>

      <div className="battle-layout">
        <div className="character-equipment">
          <div className="character-display">
            <div
              className="character-avatar"
              style={{
                boxShadow: `0 0 30px ${playerColor}`,
              }}
            >
              <span className="avatar-emoji">⚔️</span>
              {Object.values(equippedRunes).some((r) => r) && (
                <div
                  className="character-aura"
                  style={{ background: `radial-gradient(circle, ${playerColor}40, transparent 70%)` }}
                />
              )}
            </div>
            <div className="character-name">勇者</div>
            <div className="character-stats">
              <span>❤️ {playerHealth}/{playerStats.health}</span>
              <span>⚔️ {playerStats.attack}</span>
              <span>🛡️ {playerStats.defense}</span>
            </div>
          </div>

          <div className="equipment-slots">
            <div className="slot-row top-row">
              <RuneSlot
                slotType="helmet"
                rune={equippedRunes.helmet}
                onDrop={(rune) => handleEquipRune('helmet', rune)}
                onRemove={() => handleUnequipRune('helmet')}
                position="top"
              />
            </div>
            <div className="slot-row middle-row">
              <RuneSlot
                slotType="offhand"
                rune={equippedRunes.offhand}
                onDrop={(rune) => handleEquipRune('offhand', rune)}
                onRemove={() => handleUnequipRune('offhand')}
                position="left"
              />
              <div className="center-spacer" />
              <RuneSlot
                slotType="weapon"
                rune={equippedRunes.weapon}
                onDrop={(rune) => handleEquipRune('weapon', rune)}
                onRemove={() => handleUnequipRune('weapon')}
                position="right"
              />
            </div>
            <div className="slot-row bottom-row">
              <RuneSlot
                slotType="bracers"
                rune={equippedRunes.bracers}
                onDrop={(rune) => handleEquipRune('bracers', rune)}
                onRemove={() => handleUnequipRune('bracers')}
                position="left"
              />
              <RuneSlot
                slotType="chest"
                rune={equippedRunes.chest}
                onDrop={(rune) => handleEquipRune('chest', rune)}
                onRemove={() => handleUnequipRune('chest')}
                position="bottom"
              />
              <RuneSlot
                slotType="ring"
                rune={equippedRunes.ring}
                onDrop={(rune) => handleEquipRune('ring', rune)}
                onRemove={() => handleUnequipRune('ring')}
                position="right"
              />
            </div>
          </div>
        </div>

        <div className="battle-scene-container">
          <div className="battle-canvas-wrapper">
            <Canvas
              camera={{ position: [0, 1, 6], fov: 60 }}
              style={{ background: 'transparent' }}
            >
              <BattleScene
                playerColor={playerColor}
                opponentColor={opponentColor}
                isBattleActive={isBattling}
                currentTurn={currentTurn}
                damageNumbers={damageNumbers}
              />
            </Canvas>
          </div>

          <div className="opponent-info">
            <div
              className="opponent-avatar"
              style={{ boxShadow: `0 0 20px ${opponentColor}` }}
            >
              <span>{opponent.avatar}</span>
            </div>
            <div className="opponent-name">{opponent.name}</div>
            <div className="health-bar">
              <div
                className="health-fill opponent"
                style={{ width: `${(opponentHealth / opponent.baseHealth) * 100}%` }}
              />
            </div>
          </div>

          <button
            className={`start-battle-btn ${isBattling ? 'disabled' : ''}`}
            onClick={startBattle}
            disabled={isBattling}
          >
            {isBattling ? '战斗中...' : '开始战斗'}
          </button>
        </div>
      </div>

      {showResult && battleResult && (
        <div className="battle-result-overlay">
          <div className={`battle-result-card ${battleResult.victory ? 'victory' : 'defeat'}`}>
            <h2>{battleResult.victory ? '🎉 胜利！' : '💀 失败...'}</h2>
            <div className="result-stats">
              <div className="stat-row">
                <span>对手</span>
                <span>{battleResult.opponent}</span>
              </div>
              <div className="stat-row">
                <span>总伤害</span>
                <span className="highlight">{battleResult.totalDamage}</span>
              </div>
              <div className="stat-row">
                <span>特效触发</span>
                <span className="highlight">{battleResult.effectsTriggered}次</span>
              </div>
              <div className="stat-row">
                <span>回合数</span>
                <span>{battleResult.turns}</span>
              </div>
            </div>
            <button
              className="close-result-btn"
              onClick={() => setShowResult(false)}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
