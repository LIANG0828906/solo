import type { Difficulty, DeviationResult, TapResult, BeatInfo } from './types'

type DeviationCallback = (result: DeviationResult) => void
type BeatCallback = (info: BeatInfo) => void
type MeasureCallback = (measureIndex: number) => void

const DIFFICULTY_CONFIG: Record<Difficulty, { bpmRange: [number, number]; pulseDurationRange: [number, number] }> = {
  beginner: { bpmRange: [60, 90], pulseDurationRange: [1.0, 1.5] },
  intermediate: { bpmRange: [90, 120], pulseDurationRange: [0.7, 1.0] },
  advanced: { bpmRange: [120, 160], pulseDurationRange: [0.5, 0.7] }
}

const BEATS_PER_MEASURE = 8
const TOTAL_MEASURES = 4
const PERFECT_THRESHOLD = 50
const GOOD_THRESHOLD = 100

export class BeatEngine {
  private bpm: number = 120
  private difficulty: Difficulty = 'beginner'
  private startTime: number = 0
  private running: boolean = false
  private rafId: number = 0
  private lastBeatIndex: number = -1
  private beatTimestamps: number[] = []
  private pulseDuration: number = 1.0
  private onDeviation: DeviationCallback | null = null
  private onBeat: BeatCallback | null = null
  private onMeasure: MeasureCallback | null = null
  private totalBeats: number = BEATS_PER_MEASURE * TOTAL_MEASURES
  private currentBeatIndex: number = 0

  constructor() {
    this.recalculateBeatTimestamps()
  }

  setDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty
    const config = DIFFICULTY_CONFIG[difficulty]
    const [minBpm, maxBpm] = config.bpmRange
    this.bpm = Math.round(minBpm + Math.random() * (maxBpm - minBpm))
    const [minPulse, maxPulse] = config.pulseDurationRange
    this.pulseDuration = minPulse + Math.random() * (maxPulse - minPulse)
    this.recalculateBeatTimestamps()
  }

  setBPM(bpm: number): void {
    this.bpm = Math.round(bpm)
    this.recalculateBeatTimestamps()
  }

  setPulseDuration(duration: number): void {
    this.pulseDuration = duration
  }

  getPulseDuration(): number {
    return this.pulseDuration
  }

  getBPM(): number {
    return this.bpm
  }

  getDifficulty(): Difficulty {
    return this.difficulty
  }

  getTotalBeats(): number {
    return this.totalBeats
  }

  getBeatsPerMeasure(): number {
    return BEATS_PER_MEASURE
  }

  getTotalMeasures(): number {
    return TOTAL_MEASURES
  }

  onDeviationEvent(cb: DeviationCallback): void {
    this.onDeviation = cb
  }

  onBeatEvent(cb: BeatCallback): void {
    this.onBeat = cb
  }

  onMeasureEvent(cb: MeasureCallback): void {
    this.onMeasure = cb
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.startTime = performance.now()
    this.lastBeatIndex = -1
    this.currentBeatIndex = 0
    this.loop(this.startTime)
  }

  stop(): void {
    this.running = false
    if (this.rafId) {
      cancelAnimationFrame(this.rafId)
      this.rafId = 0
    }
  }

  isRunning(): boolean {
    return this.running
  }

  registerTap(timestamp: number): DeviationResult | null {
    if (!this.running || this.beatTimestamps.length === 0) return null

    let minDeviation = Infinity
    let nearestBeatTimestamp = 0

    for (let i = Math.max(0, this.currentBeatIndex - 1); i < Math.min(this.beatTimestamps.length, this.currentBeatIndex + 2); i++) {
      const beatTime = this.beatTimestamps[i]
      const deviation = Math.abs(timestamp - beatTime)
      if (deviation < minDeviation) {
        minDeviation = deviation
        nearestBeatTimestamp = beatTime
      }
    }

    let result: TapResult
    if (minDeviation < PERFECT_THRESHOLD) {
      result = 'perfect'
    } else if (minDeviation < GOOD_THRESHOLD) {
      result = 'good'
    } else {
      result = 'miss'
    }

    const deviationResult: DeviationResult = {
      deviation: minDeviation,
      result,
      nearestBeatTimestamp
    }

    this.onDeviation?.(deviationResult)
    return deviationResult
  }

  getCurrentBeat(): BeatInfo | null {
    if (!this.running) return null
    const elapsed = performance.now() - this.startTime
    const beatInterval = 60000 / this.bpm
    const beatIndex = Math.floor(elapsed / beatInterval)
    return {
      beatIndex,
      measureIndex: Math.floor(beatIndex / BEATS_PER_MEASURE),
      beatInMeasure: beatIndex % BEATS_PER_MEASURE,
      timestamp: this.startTime + beatIndex * beatInterval
    }
  }

  getProgress(): number {
    if (!this.running) return 0
    const elapsed = performance.now() - this.startTime
    const beatInterval = 60000 / this.bpm
    const withinBeat = (elapsed % beatInterval) / beatInterval
    return withinBeat
  }

  private recalculateBeatTimestamps(): void {
    this.beatTimestamps = []
    const beatInterval = 60000 / this.bpm
    for (let i = 0; i < this.totalBeats; i++) {
      this.beatTimestamps.push(i * beatInterval)
    }
  }

  private loop = (now: number): void => {
    if (!this.running) return

    const elapsed = now - this.startTime
    const beatInterval = 60000 / this.bpm
    const beatIndex = Math.floor(elapsed / beatInterval)

    if (beatIndex !== this.lastBeatIndex && beatIndex < this.totalBeats) {
      this.lastBeatIndex = beatIndex
      this.currentBeatIndex = beatIndex

      const beatInfo: BeatInfo = {
        beatIndex,
        measureIndex: Math.floor(beatIndex / BEATS_PER_MEASURE),
        beatInMeasure: beatIndex % BEATS_PER_MEASURE,
        timestamp: this.startTime + beatIndex * beatInterval
      }

      this.onBeat?.(beatInfo)

      if (beatInfo.beatInMeasure === 0 && beatIndex > 0) {
        this.onMeasure?.(beatInfo.measureIndex)
      }
    }

    if (beatIndex >= this.totalBeats) {
      this.onMeasure?.(TOTAL_MEASURES)
      this.stop()
      return
    }

    this.rafId = requestAnimationFrame(this.loop)
  }
}
