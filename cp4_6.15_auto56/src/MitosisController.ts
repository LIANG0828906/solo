import * as THREE from 'three'
import { CellScene } from './CellScene'
import { ParticleEffect, PhaseType } from './ParticleEffect'

export interface PhaseInfo {
  name: string
  duration: number
  description: string
}

export const PHASES: Record<PhaseType, PhaseInfo> = {
  interphase: {
    name: '间期',
    duration: 5,
    description: '细胞进行DNA复制和相关蛋白质合成，为细胞分裂做准备。染色体以染色质细丝的形式存在于细胞核内，呈松散状态。'
  },
  prophase: {
    name: '前期',
    duration: 5,
    description: '染色质高度螺旋化、浓缩变短变粗形成染色体，每条染色体包含两条姐妹染色单体。核膜逐渐消散，核仁消失。中心体移向细胞两极，纺锤丝开始出现。'
  },
  metaphase: {
    name: '中期',
    duration: 5,
    description: '染色体的着丝点排列在细胞中央的赤道板上。纺锤丝从细胞两极发出，连接到每条染色体的着丝点上。这是观察染色体形态和数目的最佳时期。'
  },
  anaphase: {
    name: '后期',
    duration: 5,
    description: '着丝点分裂，姐妹染色单体在纺锤丝的牵引下分别向细胞两极移动。此时细胞内染色体数目暂时加倍。'
  },
  telophase: {
    name: '末期',
    duration: 5,
    description: '染色体到达两极后逐渐解螺旋变成染色质。核膜、核仁重新出现。细胞膜从中部内陷形成环沟，最终一个细胞缢裂为两个子细胞。'
  }
}

const PHASE_ORDER: PhaseType[] = ['interphase', 'prophase', 'metaphase', 'anaphase', 'telophase']

export class MitosisController {
  private cellScene: CellScene
  private particleEffect: ParticleEffect

  private currentPhase: PhaseType = 'interphase'
  private phaseElapsed = 0
  private isPlaying = false
  private isPaused = false
  private hasDissolved = false
  private hasReformed = false
  private hasFlashed = false
  private isFinished = false

  private onPhaseChange?: (phase: PhaseType) => void
  private onProgressChange?: (phaseProgress: number, overallProgress: number) => void
  private onPlayStateChange?: (isPlaying: boolean) => void

  constructor(cellScene: CellScene, particleEffect: ParticleEffect) {
    this.cellScene = cellScene
    this.particleEffect = particleEffect
    this.cellScene.setPhase(this.currentPhase)
  }

  public setOnPhaseChange(callback: (phase: PhaseType) => void): void {
    this.onPhaseChange = callback
  }

  public setOnProgressChange(callback: (phaseProgress: number, overallProgress: number) => void): void {
    this.onProgressChange = callback
  }

  public setOnPlayStateChange(callback: (isPlaying: boolean) => void): void {
    this.onPlayStateChange = callback
  }

  public getCurrentPhase(): PhaseType {
    return this.currentPhase
  }

  public getPhaseProgress(): number {
    const info = PHASES[this.currentPhase]
    return Math.min(1, this.phaseElapsed / info.duration)
  }

  public getOverallProgress(): number {
    const phaseIdx = PHASE_ORDER.indexOf(this.currentPhase)
    const totalPhases = PHASE_ORDER.length
    const baseProgress = phaseIdx / totalPhases
    const phaseProgress = this.getPhaseProgress() / totalPhases
    return baseProgress + phaseProgress
  }

  public getIsPlaying(): boolean {
    return this.isPlaying && !this.isPaused
  }

  public getIsFinished(): boolean {
    return this.isFinished
  }

  public play(): void {
    if (this.isFinished) {
      this.reset()
    }
    this.isPlaying = true
    this.isPaused = false
    if (this.onPlayStateChange) this.onPlayStateChange(true)
  }

  public pause(): void {
    this.isPaused = true
    if (this.onPlayStateChange) this.onPlayStateChange(false)
  }

  public toggle(): void {
    if (this.isPlaying && !this.isPaused) {
      this.pause()
    } else {
      this.play()
    }
  }

  public reset(): void {
    this.jumpToPhase('interphase')
    this.isPlaying = false
    this.isPaused = false
    this.isFinished = false
    if (this.onPlayStateChange) this.onPlayStateChange(false)
  }

  public jumpToPhase(phase: PhaseType): void {
    this.currentPhase = phase
    this.phaseElapsed = 0
    this.hasDissolved = false
    this.hasReformed = false
    this.hasFlashed = false
    this.isFinished = false
    this.cellScene.setPhase(phase)
    if (this.onPhaseChange) this.onPhaseChange(phase)
    if (this.onProgressChange) this.onProgressChange(0, this.getOverallProgress())
  }

  public update(delta: number): void {
    this.particleEffect.update(delta)
    this.cellScene.updateFlash(this.particleEffect.getFlashAlpha())

    if (!this.isPlaying || this.isPaused || this.isFinished) {
      this.cellScene.update(delta, this.currentPhase, this.getPhaseProgress(), this.particleEffect)
      return
    }

    this.phaseElapsed += delta
    const phaseInfo = PHASES[this.currentPhase]
    const progress = this.getPhaseProgress()

    if (this.currentPhase === 'prophase' && !this.hasDissolved && progress > 0.15) {
      this.hasDissolved = true
      this.particleEffect.triggerNuclearDissolution(
        this.cellScene.getCellCenter(),
        this.cellScene.getNucleusRadius()
      )
    }

    if (this.currentPhase === 'telophase' && !this.hasReformed && progress > 0.35) {
      this.hasReformed = true
      this.particleEffect.triggerNuclearReformation(
        this.cellScene.getDaughterPoles(),
        0.6
      )
    }

    if (this.currentPhase === 'telophase' && !this.hasFlashed && progress > 0.88) {
      this.hasFlashed = true
      this.particleEffect.triggerFlash()
    }

    this.cellScene.update(delta, this.currentPhase, progress, this.particleEffect)

    if (this.onProgressChange) {
      this.onProgressChange(progress, this.getOverallProgress())
    }

    if (this.phaseElapsed >= phaseInfo.duration) {
      this.advancePhase()
    }
  }

  private advancePhase(): void {
    const idx = PHASE_ORDER.indexOf(this.currentPhase)
    if (idx < PHASE_ORDER.length - 1) {
      this.jumpToPhase(PHASE_ORDER[idx + 1])
    } else {
      this.isFinished = true
      this.isPlaying = false
      if (this.onPlayStateChange) this.onPlayStateChange(false)
    }
  }
}
