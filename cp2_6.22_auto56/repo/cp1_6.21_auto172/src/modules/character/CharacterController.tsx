import { useEffect, useCallback, useRef } from 'react'
import { useCharacter } from '@/contexts/CharacterContext'
import { useRhythm } from '@/contexts/RhythmContext'
import { updateCharacter } from '@/api/characterApi'
import type { CharacterId } from '@/types/game'

const CHARACTER_ORDER: CharacterId[] = ['berserker', 'ranger', 'sage']
const MOVE_SPEED = 4
const JUMP_FORCE = -12
const GRAVITY = 0.6
const GROUND_Y = 300

interface TouchState {
  leftStart: { x: number; y: number } | null
  rightStart: { x: number; y: number } | null
  moveDelta: number
  trails: { id: number; points: { x: number; y: number }[]; startTime: number }[]
}

export default function CharacterController() {
  const { state, switchCharacter, useSkill, updatePosition, takeDamage, heal, tickCooldowns } = useCharacter()
  const { recordAttack, recordHealth, triggerScreenShake, setComboMilestone } = useRhythm()

  const velocityRef = useRef({ x: 0, y: 0 })
  const keysRef = useRef<Set<string>>(new Set())
  const touchRef = useRef<TouchState>({
    leftStart: null,
    rightStart: null,
    moveDelta: 0,
    trails: [],
  })
  const trailIdRef = useRef(0)
  const frameRef = useRef(0)
  const onGroundRef = useRef(true)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    keysRef.current.add(e.key.toLowerCase())

    if (e.key === '1' || e.key === '2' || e.key === '3') {
      const idx = parseInt(e.key) - 1
      switchCharacter(CHARACTER_ORDER[idx])
      updateCharacter(CHARACTER_ORDER[idx], { switchTriggered: true }).catch(() => {})
    }

    if (e.key === 'q' || e.key === 'Q') {
      const skill = state.characters[state.activeCharacterId].skills[0]
      if (skill && (skill.currentCooldown === 0 || Date.now() >= skill.currentCooldown)) {
        useSkill(skill.id)
        recordAttack(Date.now())
        if (skill.damage > 0) {
          checkComboMilestone()
        }
      }
    }
    if (e.key === 'w' || e.key === 'W') {
      const skill = state.characters[state.activeCharacterId].skills[1]
      if (skill && (skill.currentCooldown === 0 || Date.now() >= skill.currentCooldown)) {
        useSkill(skill.id)
        if (skill.id === 'heal') {
          heal(state.activeCharacterId, 30)
          recordHealth(state.activeCharacterId, state.characters[state.activeCharacterId].hp + 30, state.characters[state.activeCharacterId].maxHp)
        } else {
          recordAttack(Date.now())
          if (skill.damage > 0) checkComboMilestone()
        }
      }
    }
    if (e.key === 'e' || e.key === 'E') {
      const skill = state.characters[state.activeCharacterId].skills[2]
      if (skill && (skill.currentCooldown === 0 || Date.now() >= skill.currentCooldown)) {
        useSkill(skill.id)
        if (skill.damage > 0) {
          recordAttack(Date.now())
          checkComboMilestone()
        }
      }
    }

    if (e.key === ' ' && onGroundRef.current) {
      velocityRef.current.y = JUMP_FORCE
      onGroundRef.current = false
    }

    if (e.key === 'Tab') {
      e.preventDefault()
      const currentIdx = CHARACTER_ORDER.indexOf(state.activeCharacterId)
      const nextIdx = (currentIdx + 1) % CHARACTER_ORDER.length
      switchCharacter(CHARACTER_ORDER[nextIdx])
      updateCharacter(CHARACTER_ORDER[nextIdx], { switchTriggered: true }).catch(() => {})
    }
  }, [state, switchCharacter, useSkill, recordAttack, heal, recordHealth])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    keysRef.current.delete(e.key.toLowerCase())
  }, [])

  const checkComboMilestone = useCallback(() => {
    const combo = useRhythm
  }, [])

  const handleTouchStart = useCallback((e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      const x = touch.clientX
      const halfWidth = window.innerWidth / 2
      if (x < halfWidth) {
        touchRef.current.leftStart = { x: touch.clientX, y: touch.clientY }
        const trailId = trailIdRef.current++
        touchRef.current.trails.push({
          id: trailId,
          points: [{ x: touch.clientX, y: touch.clientY }],
          startTime: Date.now(),
        })
      } else {
        touchRef.current.rightStart = { x: touch.clientX, y: touch.clientY }
        const trailId = trailIdRef.current++
        touchRef.current.trails.push({
          id: trailId,
          points: [{ x: touch.clientX, y: touch.clientY }],
          startTime: Date.now(),
        })
      }
    }
  }, [])

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault()
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      const halfWidth = window.innerWidth / 2
      if (touch.clientX < halfWidth && touchRef.current.leftStart) {
        const dx = touch.clientX - touchRef.current.leftStart.x
        touchRef.current.moveDelta = dx > 10 ? 1 : dx < -10 ? -1 : 0
        const activeTrail = touchRef.current.trails[touchRef.current.trails.length - 1]
        if (activeTrail) {
          activeTrail.points.push({ x: touch.clientX, y: touch.clientY })
        }
      } else if (touch.clientX >= halfWidth && touchRef.current.rightStart) {
        const activeTrail = touchRef.current.trails[touchRef.current.trails.length - 1]
        if (activeTrail) {
          activeTrail.points.push({ x: touch.clientX, y: touch.clientY })
        }
      }
    }
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i]
      const halfWidth = window.innerWidth / 2
      if (touch.clientX >= halfWidth && touchRef.current.rightStart) {
        const dy = touch.clientY - touchRef.current.rightStart.y
        const dx = Math.abs(touch.clientX - touchRef.current.rightStart.x)
        if (dy < -30 && dx < 50) {
          if (onGroundRef.current) {
            velocityRef.current.y = JUMP_FORCE
            onGroundRef.current = false
          }
        } else if (dy > 30 && dx < 50) {
          const currentIdx = CHARACTER_ORDER.indexOf(state.activeCharacterId)
          const nextIdx = (currentIdx + 1) % CHARACTER_ORDER.length
          switchCharacter(CHARACTER_ORDER[nextIdx])
          updateCharacter(CHARACTER_ORDER[nextIdx], { switchTriggered: true }).catch(() => {})
        } else {
          const char = state.characters[state.activeCharacterId]
          const availSkill = char.skills.find(s => s.currentCooldown === 0 || Date.now() >= s.currentCooldown)
          if (availSkill) {
            useSkill(availSkill.id)
            if (availSkill.damage > 0) {
              recordAttack(Date.now())
            }
            if (availSkill.id === 'heal') {
              heal(state.activeCharacterId, 30)
            }
          }
        }
        touchRef.current.rightStart = null
      } else {
        touchRef.current.leftStart = null
        touchRef.current.moveDelta = 0
      }
    }
  }, [state, switchCharacter, useSkill, recordAttack, heal])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('touchstart', handleTouchStart, { passive: false })
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleKeyDown, handleKeyUp, handleTouchStart, handleTouchMove, handleTouchEnd])

  useEffect(() => {
    const gameLoop = () => {
      const now = Date.now()
      tickCooldowns(now)

      const char = state.characters[state.activeCharacterId]
      let vx = 0
      const keys = keysRef.current
      if (keys.has('a') || keys.has('arrowleft') || touchRef.current.moveDelta < 0) vx = -MOVE_SPEED
      if (keys.has('d') || keys.has('arrowright') || touchRef.current.moveDelta > 0) vx = MOVE_SPEED

      const vy = velocityRef.current.y + GRAVITY
      velocityRef.current = { x: vx, y: vy }

      let newY = char.position.y + vy
      let newX = char.position.x + vx
      if (newY >= GROUND_Y) {
        newY = GROUND_Y
        velocityRef.current.y = 0
        onGroundRef.current = true
      }

      newX = Math.max(20, Math.min(780, newX))

      updatePosition(state.activeCharacterId, { x: newX, y: newY })

      touchRef.current.trails = touchRef.current.trails.filter(
        t => now - t.startTime < 500
      )

      frameRef.current = requestAnimationFrame(gameLoop)
    }
    frameRef.current = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(frameRef.current)
  }, [state.activeCharacterId, state.characters, tickCooldowns, updatePosition])

  const touchTrails = touchRef.current.trails

  return (
    <div className="touch-trails">
      {touchTrails.map(trail => (
        <svg key={trail.id} className="touch-trail-svg">
          {trail.points.length > 1 && (
            <polyline
              points={trail.points.map(p => `${p.x},${p.y}`).join(' ')}
              fill="none"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              opacity={Math.max(0, 1 - (Date.now() - trail.startTime) / 500)}
            />
          )}
        </svg>
      ))}
    </div>
  )
}
