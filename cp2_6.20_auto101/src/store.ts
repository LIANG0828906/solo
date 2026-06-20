import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import {
  Skill,
  Talent,
  ComboSlot,
  PlaybackState,
  PRESET_SKILLS,
  PRESET_TALENTS,
  SKILL_DURATION,
  TRANSITION_DURATION,
} from './types'

const createInitialSlots = (): ComboSlot[] => {
  return Array.from({ length: 6 }, (_, i) => ({
    id: uuidv4(),
    skillId: null,
    order: i,
    combinationEffects: [],
  }))
}

const calculateStats = (
  slots: ComboSlot[],
  skills: Skill[],
  talents: Talent[],
  selectedTalents: string[]
): { totalDamage: number; totalCooldown: number; totalDuration: number } => {
  let totalDamage = 0
  let totalCooldown = 0
  let totalDuration = 0
  const activeTalents = talents.filter((t) => selectedTalents.includes(t.id))

  const filledSlots = slots.filter((s) => s.skillId !== null)

  filledSlots.forEach((slot, index) => {
    const skill = skills.find((s) => s.id === slot.skillId)
    if (!skill) return

    let damage = skill.damage
    let cooldown = skill.cooldown

    activeTalents.forEach((talent) => {
      if (talent.relatedSkillTypes.includes(skill.effectType)) {
        if (talent.bonusEffect.damageMultiplier) {
          damage = Math.round(damage * talent.bonusEffect.damageMultiplier)
        }
        if (talent.bonusEffect.cooldownReduction) {
          cooldown = Math.max(1, cooldown - talent.bonusEffect.cooldownReduction)
        }
      }
    })

    totalDamage += damage
    totalCooldown = Math.max(totalCooldown, cooldown)
    totalDuration = index * (SKILL_DURATION + TRANSITION_DURATION) + SKILL_DURATION
  })

  return { totalDamage, totalCooldown, totalDuration }
}

interface AppState {
  skills: Skill[]
  talents: Talent[]
  comboSlots: ComboSlot[]
  selectedTalents: string[]
  playback: PlaybackState
  setSkillToSlot: (slotId: string, skillId: string | null) => void
  reorderSlots: (fromIndex: number, toIndex: number) => void
  removeSkillFromSlot: (slotId: string) => void
  toggleTalent: (talentId: string) => void
  startPlayback: () => void
  stopPlayback: () => void
  setCurrentPlaybackIndex: (index: number) => void
  resetCombo: () => void
  saveCombo: () => void
  shareCombo: () => void
  getSkillById: (id: string | null) => Skill | undefined
  getTalentById: (id: string) => Talent | undefined
  calculateCombinationEffects: (skill: Skill) => string[]
}

export const useAppStore = create<AppState>((set, get) => ({
  skills: PRESET_SKILLS,
  talents: PRESET_TALENTS,
  comboSlots: createInitialSlots(),
  selectedTalents: [],
  playback: {
    isPlaying: false,
    currentIndex: -1,
    startTime: 0,
    stats: {
      totalDamage: 0,
      totalCooldown: 0,
      totalDuration: 0,
    },
  },

  getSkillById: (id) => {
    return get().skills.find((s) => s.id === id)
  },

  getTalentById: (id) => {
    return get().talents.find((t) => t.id === id)
  },

  calculateCombinationEffects: (skill) => {
    const { selectedTalents, talents } = get()
    const effects: string[] = []

    selectedTalents.forEach((talentId) => {
      const talent = talents.find((t) => t.id === talentId)
      if (talent && talent.relatedSkillTypes.includes(skill.effectType)) {
        if (talent.bonusEffect.extraDuration) {
          effects.push(`+${talent.bonusEffect.extraDuration}s 燃烧`)
        }
        if (talent.bonusEffect.damageMultiplier) {
          effects.push(`+${Math.round((talent.bonusEffect.damageMultiplier - 1) * 100)}% 伤害`)
        }
        if (talent.bonusEffect.cooldownReduction) {
          effects.push(`-${talent.bonusEffect.cooldownReduction}s 冷却`)
        }
      }
    })

    return effects
  },

  setSkillToSlot: (slotId, skillId) => {
    set((state) => {
      const newSlots = state.comboSlots.map((slot) => {
        if (slot.id === slotId) {
          const skill = state.skills.find((s) => s.id === skillId)
          const effects = skill ? get().calculateCombinationEffects(skill) : []
          return { ...slot, skillId, combinationEffects: effects }
        }
        return slot
      })
      const stats = calculateStats(newSlots, state.skills, state.talents, state.selectedTalents)
      return {
        comboSlots: newSlots,
        playback: { ...state.playback, stats },
      }
    })
  },

  reorderSlots: (fromIndex, toIndex) => {
    set((state) => {
      const newSlots = [...state.comboSlots]
      const [removed] = newSlots.splice(fromIndex, 1)
      newSlots.splice(toIndex, 0, removed)
      const reorderedSlots = newSlots.map((slot, i) => ({ ...slot, order: i }))
      const stats = calculateStats(reorderedSlots, state.skills, state.talents, state.selectedTalents)
      return {
        comboSlots: reorderedSlots,
        playback: { ...state.playback, stats },
      }
    })
  },

  removeSkillFromSlot: (slotId) => {
    set((state) => {
      const newSlots = state.comboSlots.map((slot) => {
        if (slot.id === slotId) {
          return { ...slot, skillId: null, combinationEffects: [] }
        }
        return slot
      })
      const stats = calculateStats(newSlots, state.skills, state.talents, state.selectedTalents)
      return {
        comboSlots: newSlots,
        playback: { ...state.playback, stats },
      }
    })
  },

  toggleTalent: (talentId) => {
    set((state) => {
      const newSelected = state.selectedTalents.includes(talentId)
        ? state.selectedTalents.filter((id) => id !== talentId)
        : [...state.selectedTalents, talentId]

      const newSlots = state.comboSlots.map((slot) => {
        if (slot.skillId) {
          const skill = state.skills.find((s) => s.id === slot.skillId)
          if (skill) {
            const effects = state.talents
              .filter((t) => newSelected.includes(t.id))
              .filter((t) => t.relatedSkillTypes.includes(skill.effectType))
              .flatMap((t) => {
                const e: string[] = []
                if (t.bonusEffect.extraDuration) {
                  e.push(`+${t.bonusEffect.extraDuration}s 燃烧`)
                }
                if (t.bonusEffect.damageMultiplier) {
                  e.push(`+${Math.round((t.bonusEffect.damageMultiplier - 1) * 100)}% 伤害`)
                }
                if (t.bonusEffect.cooldownReduction) {
                  e.push(`-${t.bonusEffect.cooldownReduction}s 冷却`)
                }
                return e
              })
            return { ...slot, combinationEffects: effects }
          }
        }
        return slot
      })

      const stats = calculateStats(newSlots, state.skills, state.talents, newSelected)
      return {
        selectedTalents: newSelected,
        comboSlots: newSlots,
        playback: { ...state.playback, stats },
      }
    })
  },

  startPlayback: () => {
    set((state) => ({
      playback: {
        ...state.playback,
        isPlaying: true,
        currentIndex: 0,
        startTime: Date.now(),
      },
    }))
  },

  stopPlayback: () => {
    set((state) => ({
      playback: {
        ...state.playback,
        isPlaying: false,
        currentIndex: -1,
      },
    }))
  },

  setCurrentPlaybackIndex: (index) => {
    set((state) => ({
      playback: {
        ...state.playback,
        currentIndex: index,
      },
    }))
  },

  resetCombo: () => {
    set({
      comboSlots: createInitialSlots(),
      selectedTalents: [],
      playback: {
        isPlaying: false,
        currentIndex: -1,
        startTime: 0,
        stats: {
          totalDamage: 0,
          totalCooldown: 0,
          totalDuration: 0,
        },
      },
    })
  },

  saveCombo: () => {
    const { comboSlots, selectedTalents } = get()
    const data = {
      slots: comboSlots.map((s) => ({ skillId: s.skillId, order: s.order })),
      talents: selectedTalents,
      timestamp: Date.now(),
    }
    try {
      localStorage.setItem('skill_combo_save', JSON.stringify(data))
      alert('连招配置已保存！')
    } catch {
      alert('保存失败，请稍后重试')
    }
  },

  shareCombo: () => {
    const { comboSlots, selectedTalents } = get()
    const data = {
      slots: comboSlots.map((s) => ({ skillId: s.skillId, order: s.order })),
      talents: selectedTalents,
    }
    const encoded = btoa(JSON.stringify(data))
    const shareUrl = `${window.location.origin}${window.location.pathname}?combo=${encoded}`
    try {
      navigator.clipboard.writeText(shareUrl)
      alert('分享链接已复制到剪贴板！')
    } catch {
      alert(`分享链接：${shareUrl}`)
    }
  },
}))
