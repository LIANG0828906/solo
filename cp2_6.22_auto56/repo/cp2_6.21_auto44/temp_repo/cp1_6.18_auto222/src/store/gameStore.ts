import { create } from 'zustand'
import type { Spell, PlayerState, CooldownInfo, ComboState, SpellCastEvent, ComboEffect, ComboEffectType } from '@/types'
import { ALL_SPELLS } from '@/utils/spellData'

interface GameStore {
  player: PlayerState
  spellSlots: Spell[]
  cooldowns: Record<string, CooldownInfo>
  combo: ComboState
  castLog: string[]
  comboEffects: ComboEffect[]
  battleEffects: SpellCastEvent[]

  castSpell: (spellId: string) => boolean
  swapSpell: (slotIndex: number, newSpell: Spell) => void
  tickCooldowns: (deltaMs: number) => void
  regenerateMana: (deltaMs: number) => void
  addBattleEffect: (event: SpellCastEvent) => void
  clearBattleEffects: () => void
  addComboEffect: (type: ComboEffectType, x: number, y: number) => void
  removeComboEffects: () => void
  addCastLog: (msg: string) => void
  isOnCooldown: (spellId: string) => boolean
  getCooldownProgress: (spellId: string) => number
  canCastSpell: (spellId: string) => boolean
}

const initialSlots: Spell[] = ALL_SPELLS.slice(0, 8)

export const useGameStore = create<GameStore>((set, get) => ({
  player: { hp: 100, maxHp: 100, mp: 100, maxMp: 100 },
  spellSlots: initialSlots,
  cooldowns: {},
  combo: { spellIds: [], lastCastTime: 0, isActive: false },
  castLog: [],
  comboEffects: [],
  battleEffects: [],

  castSpell: (spellId: string): boolean => {
    const state = get()
    const spell = state.spellSlots.find(s => s.id === spellId)
    if (!spell) return false
    if (state.player.mp < spell.manaCost) return false
    if (state.cooldowns[spellId] && state.cooldowns[spellId].remainingMs > 0) return false

    const now = performance.now()
    const combo = { ...state.combo }
    const newComboSpellIds = [...combo.spellIds]
    if (now - combo.lastCastTime < 800) {
      newComboSpellIds.push(spellId)
    } else {
      newComboSpellIds.length = 0
      newComboSpellIds.push(spellId)
    }

    const isCombo = newComboSpellIds.length >= 3
    const totalManaCost = isCombo
      ? [...new Set(newComboSpellIds)].reduce((sum, id) => {
          const s = state.spellSlots.find(sp => sp.id === id)
          return sum + (s?.manaCost ?? 0)
        }, 0)
      : spell.manaCost

    if (state.player.mp < totalManaCost) return false

    const newCooldowns = { ...state.cooldowns }
    const spellsToCooldown = isCombo ? [...new Set(newComboSpellIds)] : [spellId]
    for (const id of spellsToCooldown) {
      const s = state.spellSlots.find(sp => sp.id === id)
      if (s) {
        newCooldowns[id] = {
          spellId: id,
          remainingMs: s.cooldownMs,
          totalMs: s.cooldownMs,
        }
      }
    }

    set({
      player: {
        ...state.player,
        mp: Math.max(0, state.player.mp - totalManaCost),
      },
      cooldowns: newCooldowns,
      combo: {
        spellIds: isCombo ? [] : newComboSpellIds,
        lastCastTime: now,
        isActive: isCombo,
      },
    })

    return true
  },

  swapSpell: (slotIndex: number, newSpell: Spell) => {
    const slots = [...get().spellSlots]
    if (slotIndex >= 0 && slotIndex < slots.length) {
      slots[slotIndex] = newSpell
      set({ spellSlots: slots })
    }
  },

  tickCooldowns: (deltaMs: number) => {
    const cooldowns = { ...get().cooldowns }
    let changed = false
    for (const key of Object.keys(cooldowns)) {
      const cd = { ...cooldowns[key] }
      cd.remainingMs = Math.max(0, cd.remainingMs - deltaMs)
      if (cd.remainingMs <= 0) {
        delete cooldowns[key]
      } else {
        cooldowns[key] = cd
      }
      changed = true
    }
    if (changed) set({ cooldowns })
  },

  regenerateMana: (deltaMs: number) => {
    const player = get().player
    const regen = (deltaMs / 1000) * 3
    const newMp = Math.min(player.maxMp, player.mp + regen)
    if (Math.abs(newMp - player.mp) > 0.01) {
      set({ player: { ...player, mp: newMp } })
    }
  },

  addBattleEffect: (event: SpellCastEvent) => {
    set({ battleEffects: [...get().battleEffects, event] })
  },

  clearBattleEffects: () => {
    set({ battleEffects: [] })
  },

  addComboEffect: (type: ComboEffectType, x: number, y: number) => {
    set({
      comboEffects: [...get().comboEffects, {
        type,
        x,
        y,
        startTime: performance.now(),
        duration: 2000,
      }],
    })
  },

  removeComboEffects: () => {
    const now = performance.now()
    set({
      comboEffects: get().comboEffects.filter(e => now - e.startTime < e.duration),
    })
  },

  addCastLog: (msg: string) => {
    const log = [...get().castLog]
    log.push(msg)
    if (log.length > 50) log.shift()
    set({ castLog: log })
  },

  isOnCooldown: (spellId: string): boolean => {
    const cd = get().cooldowns[spellId]
    return cd ? cd.remainingMs > 0 : false
  },

  getCooldownProgress: (spellId: string): number => {
    const cd = get().cooldowns[spellId]
    if (!cd || cd.remainingMs <= 0) return 0
    return 1 - cd.remainingMs / cd.totalMs
  },

  canCastSpell: (spellId: string): boolean => {
    const state = get()
    const spell = state.spellSlots.find(s => s.id === spellId)
    if (!spell) return false
    if (state.player.mp < spell.manaCost) return false
    if (state.cooldowns[spellId] && state.cooldowns[spellId].remainingMs > 0) return false
    return true
  },
}))
