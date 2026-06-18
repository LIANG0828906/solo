import { useEffect, useRef, useCallback } from 'react'
import { useGameStore } from './game/store'
import { render } from './game/renderer'
import { createSonarWave, updateSonarWave, createMarkPoint, updateMarkPoint } from './game/sonar'
import { createDart, createParticle, updateMonster, updateDart, updateParticle, findNearestMarkedMonster } from './game/entities'
import { circleCollidesWithMap } from './game/map'

class AudioManager {
  private ctx: AudioContext | null = null
  private ambientOsc: OscillatorNode | null = null
  private ambientGain: GainNode | null = null

  init(): void {
    if (this.ctx) return
    this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    this.startAmbient()
  }

  private startAmbient(): void {
    if (!this.ctx) return
    this.ambientOsc = this.ctx.createOscillator()
    this.ambientGain = this.ctx.createGain()
    this.ambientOsc.type = 'sine'
    this.ambientOsc.frequency.value = 60
    this.ambientGain.gain.value = 0.05
    this.ambientOsc.connect(this.ambientGain)
    this.ambientGain.connect(this.ctx.destination)
    this.ambientOsc.start()
  }

  playSonar(power: number): void {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(200 + power * 400, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.4)
    gain.gain.setValueAtTime(0.1 + power * 0.1, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.4)
  }

  playHit(): void {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = 150
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.2)
  }

  playDart(): void {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = 800
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.15)
  }

  playExplosion(): void {
    if (!this.ctx) return
    const bufferSize = this.ctx.sampleRate * 0.3
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2)
    }
    const noise = this.ctx.createBufferSource()
    noise.buffer = buffer
    const gain = this.ctx.createGain()
    gain.gain.value = 0.15
    noise.connect(gain)
    gain.connect(this.ctx.destination)
    noise.start()
  }

  playDamage(): void {
    if (!this.ctx) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(200, this.ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.3)
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3)
    osc.connect(gain)
    gain.connect(this.ctx.destination)
    osc.start()
    osc.stop(this.ctx.currentTime + 0.3)
  }
}

const audio = new AudioManager()

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef<Set<string>>(new Set())
  const animationRef = useRef<number>(0)
  const initializedRef = useRef(false)

  const store = useGameStore

  const gameLoop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = store.getState()

    if (state.gameStarted && !state.gameOver) {
      let dx = 0, dy = 0
      const speed = 2.5
      if (keysRef.current.has('w') || keysRef.current.has('arrowup')) dy -= speed
      if (keysRef.current.has('s') || keysRef.current.has('arrowdown')) dy += speed
      if (keysRef.current.has('a') || keysRef.current.has('arrowleft')) dx -= speed
      if (keysRef.current.has('d') || keysRef.current.has('arrowright')) dx += speed

      if (dx !== 0 || dy !== 0) {
        const newX = state.player.x + dx
        const newY = state.player.y + dy
        if (!circleCollidesWithMap(newX, state.player.y, 10, state.mapData)) {
          state.updatePlayerPos(newX, state.player.y)
        }
        if (!circleCollidesWithMap(state.player.x, newY, 10, state.mapData)) {
          state.updatePlayerPos(state.player.x, newY)
        }
      }

      if (state.charging) {
        state.incrementChargePower()
      }

      state.incrementTime()

      for (const monster of state.monsters) {
        updateMonster(monster, state.player.x, state.player.y, state.mapData, 1)
      }

      if (!state.player.invincible) {
        for (const monster of state.monsters) {
          const mx = monster.x - state.player.x
          const my = monster.y - state.player.y
          const dist = Math.sqrt(mx * mx + my * my)
          if (dist < 20) {
            state.decreaseLife()
            audio.playDamage()
            if (state.player.lives <= 1) {
              state.setGameOver(true)
            } else {
              state.setInvincible(true, 60)
            }
            break
          }
        }
      }

      state.updateInvincibleTimer()

      const wavesToRemove: string[] = []
      for (const wave of state.sonarWaves) {
        const result = updateSonarWave(wave, state.mapData, state.monsters)
        for (const monsterId of result.hitMonsters) {
          state.updateMonster(monsterId, m => {
            m.marked = true
            m.markTimer = 180
            m.hitBySonar = true
            m.hitBoostTimer = 60
          })
        }
        for (const mark of result.newMarks) {
          state.addMarkPoint(createMarkPoint(mark.x, mark.y))
          audio.playHit()
        }
        if (!result.waveAlive) {
          wavesToRemove.push(wave.id)
        }
