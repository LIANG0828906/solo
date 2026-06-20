import { useCallback, useRef, useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'
import type { Spell, CooldownInfo } from '@/types'

export function useSpellSystem() {
  const spellSlots = useGameStore(s => s.spellSlots)
  const cooldowns = useGameStore(s => s.cooldowns)
  const player = useGameStore(s => s.player)
  const castSpell = useGameStore(s => s.castSpell)
  const tickCooldowns = useGameStore(s => s.tickCooldowns)
  const regenerateMana = useGameStore(s => s.regenerateMana)
  const isOnCooldown = useGameStore(s => s.isOnCooldown)
  const canCastSpell = useGameStore(s => s.canCastSpell)
  const getCooldownProgress = useGameStore(s => s.getCooldownProgress)

  const lastTickRef = useRef(performance.now())

  useEffect(() => {
    let animId: number
    const tick = () => {
      const now = performance.now()
      const delta = now - lastTickRef.current
      lastTickRef.current = now
      tickCooldowns(delta)
      regenerateMana(delta)
      animId = requestAnimationFrame(tick)
    }
    animId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animId)
  }, [tickCooldowns, regenerateMana])

  const tryCast = useCallback((spellId: string): boolean => {
    return castSpell(spellId)
  }, [castSpell])

  const getCooldownInfo = useCallback((spellId: string): CooldownInfo | null => {
    return cooldowns[spellId] || null
  }, [cooldowns])

  const isManaSufficient = useCallback((spellId: string): boolean => {
    const spell = spellSlots.find(s => s.id === spellId)
    if (!spell) return false
    return player.mp >= spell.manaCost
  }, [spellSlots, player.mp])

  return {
    spellSlots: spellSlots as readonly Spell[],
    cooldowns,
    player,
    tryCast,
    isOnCooldown,
    canCastSpell,
    getCooldownProgress,
    getCooldownInfo,
    isManaSufficient,
    currentMana: player.mp,
    maxMana: player.maxMp,
    currentHp: player.hp,
    maxHp: player.maxHp,
  }
}
