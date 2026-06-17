import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { TapRecord, TapResult, Difficulty } from '../types'

const BEATS_PER_MEASURE = 8
const TOTAL_MEASURES = 4

export const useRhythmStore = defineStore('rhythm', () => {
  const bpm = ref(120)
  const difficulty = ref<Difficulty>('beginner')
  const currentBeatIndex = ref(0)
  const currentMeasureIndex = ref(0)
  const tapRecords = ref<TapRecord[]>([])
  const perfectCount = ref(0)
  const goodCount = ref(0)
  const missCount = ref(0)
  const completedMeasures = ref(0)
  const isFinished = ref(false)
  const isPlaying = ref(false)

  const totalBeats = BEATS_PER_MEASURE * TOTAL_MEASURES

  const accuracy = computed(() => {
    const total = tapRecords.value.length
    if (total === 0) return 0
    const weighted = perfectCount.value * 2 + goodCount.value * 1
    const maxPossible = total * 2
    return Math.round((weighted / maxPossible) * 100)
  })

  const finalScore = computed(() => {
    if (tapRecords.value.length === 0) return 0
    const weighted = perfectCount.value * 2 + goodCount.value * 1
    const maxPossible = totalBeats * 2
    return Math.round((weighted / maxPossible) * 100)
  })

  function commitTap(timestamp: number, deviation: number, result: TapResult, beatIndex: number) {
    const record: TapRecord = { timestamp, deviation, result, beatIndex }
    tapRecords.value.push(record)

    if (result === 'perfect') perfectCount.value++
    else if (result === 'good') goodCount.value++
    else missCount.value++
  }

  function updateBeat(beatIndex: number, measureIndex: number) {
    currentBeatIndex.value = beatIndex
    currentMeasureIndex.value = measureIndex
  }

  function completeMeasure(measureIndex: number) {
    completedMeasures.value = measureIndex
    if (measureIndex >= TOTAL_MEASURES) {
      isFinished.value = true
      isPlaying.value = false
    }
  }

  function setBPM(val: number) {
    bpm.value = val
  }

  function setDifficulty(val: Difficulty) {
    difficulty.value = val
  }

  function setPlaying(val: boolean) {
    isPlaying.value = val
  }

  function reset() {
    bpm.value = 120
    difficulty.value = 'beginner'
    currentBeatIndex.value = 0
    currentMeasureIndex.value = 0
    tapRecords.value = []
    perfectCount.value = 0
    goodCount.value = 0
    missCount.value = 0
    completedMeasures.value = 0
    isFinished.value = false
    isPlaying.value = false
  }

  return {
    bpm,
    difficulty,
    currentBeatIndex,
    currentMeasureIndex,
    tapRecords,
    perfectCount,
    goodCount,
    missCount,
    completedMeasures,
    isFinished,
    isPlaying,
    totalBeats,
    accuracy,
    finalScore,
    commitTap,
    updateBeat,
    completeMeasure,
    setBPM,
    setDifficulty,
    setPlaying,
    reset
  }
})
