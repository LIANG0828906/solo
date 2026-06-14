import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { GameEngine } from '@/game/GameEngine'
import type { Song, GameState } from '@/types'

export const useGameStore = defineStore('game', () => {
  const engine = ref(new GameEngine())
  const state = ref<GameState>(engine.value.getState())
  const selectedSongId = ref<string | null>(null)

  const currentSong = computed(() => state.value.currentSong)
  const score = computed(() => state.value.score)
  const combo = computed(() => state.value.combo)
  const lives = computed(() => state.value.lives)
  const gameStatus = computed(() => state.value.gameStatus)
  const capturedWords = computed(() => state.value.capturedWords)
  const fragments = computed(() => state.value.fragments)
  const particles = computed(() => state.value.particles)
  const songProgress = computed(() => state.value.songProgress)
  const sectionProgress = computed(() => state.value.sectionProgress)
  const completedSections = computed(() => state.value.completedSections)
  const isPlaying = computed(() => state.value.isPlaying)
  const isPaused = computed(() => state.value.isPaused)
  const errorCount = computed(() => state.value.errorCount)
  const maxCombo = computed(() => state.value.maxCombo)

  function initEngine() {
    engine.value.on((_event: string, data?: unknown) => {
      if (data && typeof data === 'object' && 'gameStatus' in data) {
        state.value = { ...(data as GameState) }
      } else {
        state.value = engine.value.getState()
      }
    })
  }

  function startGame(song: Song) {
    selectedSongId.value = song.id
    engine.value.start(song)
    state.value = engine.value.getState()
  }

  function stopGame() {
    engine.value.stop()
    state.value = engine.value.getState()
  }

  function pauseGame() {
    engine.value.pause()
    state.value = engine.value.getState()
  }

  function resumeGame() {
    engine.value.resume()
    state.value = engine.value.getState()
  }

  function captureFragment(id: string) {
    engine.value.captureFragment(id)
    state.value = engine.value.getState()
  }

  function removeCapturedWord(index: number) {
    engine.value.removeCapturedWord(index)
    state.value = engine.value.getState()
  }

  function resetGame() {
    engine.value.stop()
    selectedSongId.value = null
    state.value = engine.value.getState()
  }

  return {
    engine,
    state,
    selectedSongId,
    currentSong,
    score,
    combo,
    maxCombo,
    lives,
    gameStatus,
    capturedWords,
    fragments,
    particles,
    songProgress,
    sectionProgress,
    completedSections,
    isPlaying,
    isPaused,
    errorCount,
    initEngine,
    startGame,
    stopGame,
    pauseGame,
    resumeGame,
    captureFragment,
    removeCapturedWord,
    resetGame
  }
})
