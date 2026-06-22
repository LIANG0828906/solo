import { useEffect, useRef, useCallback } from 'react'
import { useRhythm } from '@/contexts/RhythmContext'
import { useCharacter } from '@/contexts/CharacterContext'
import { saveComboRecord, saveHealthTimeline } from '@/api/characterApi'

const COMBO_CHECK_INTERVAL = 100
const COMBO_MAX_INTERVAL = 1500
const LEVEL_ID = 'level-1'

export default function RhythmAnalyzer() {
  const { state: rhythmState, recordAttack, breakCombo, clearComboBreak, recordHealth, triggerScreenShake, setComboMilestone, clearComboMilestone, exportTimelineAsJson } = useRhythm()
  const { state: charState, getActiveCharacter } = useCharacter()
  const lastCheckRef = useRef(0)
  const comboSyncRef = useRef(0)
  const healthSyncRef = useRef(0)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      if (rhythmState.lastAttackTime > 0 && now - rhythmState.lastAttackTime > COMBO_MAX_INTERVAL) {
        if (rhythmState.comboCount > 0) {
          breakCombo(now)
          setTimeout(() => clearComboBreak(), 1000)
        }
      }
      lastCheckRef.current = now
    }, COMBO_CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [rhythmState.lastAttackTime, rhythmState.comboCount, breakCombo, clearComboBreak])

  useEffect(() => {
    if (rhythmState.comboMilestone > 0) {
      triggerScreenShake()
      const timer = setTimeout(() => clearComboMilestone(), 500)
      return () => clearTimeout(timer)
    }
  }, [rhythmState.comboMilestone, triggerScreenShake, clearComboMilestone])

  useEffect(() => {
    const now = Date.now()
    if (now - comboSyncRef.current > 2000 && rhythmState.maxCombo > 0) {
      comboSyncRef.current = now
      saveComboRecord(rhythmState.maxCombo, LEVEL_ID, now).catch(() => {})
    }
  }, [rhythmState.maxCombo])

  useEffect(() => {
    const now = Date.now()
    if (now - healthSyncRef.current > 3000 && rhythmState.healthTimeline.length > 0) {
      healthSyncRef.current = now
      saveHealthTimeline(LEVEL_ID, rhythmState.healthTimeline).catch(() => {})
    }
  }, [rhythmState.healthTimeline.length])

  useEffect(() => {
    const char = getActiveCharacter()
    if (char.hp < char.maxHp) {
      recordHealth(char.id, char.hp, char.maxHp)
    }
  }, [charState.characters[charState.activeCharacterId]?.hp])

  const handleExportTimeline = useCallback(() => {
    const json = exportTimelineAsJson()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `health-timeline-${LEVEL_ID}-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [exportTimelineAsJson])

  return null
}

export { RhythmAnalyzer }
