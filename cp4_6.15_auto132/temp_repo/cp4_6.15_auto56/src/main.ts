import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CellScene } from './CellScene'
import { MitosisController, PHASES, PhaseType } from './MitosisController'
import { ParticleEffect } from './ParticleEffect'

class App {
  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private controls!: OrbitControls
  private cellScene!: CellScene
  private particleEffect!: ParticleEffect
  private controller!: MitosisController

  private initialCameraPos = new THREE.Vector3(0, 1.2, 6.2)
  private initialTarget = new THREE.Vector3(0, 0, 0)
  private clock = new THREE.Clock()

  constructor() {
    this.init()
    this.animate()
    this.setupUI()
  }

  private init(): void {
    const canvas = document.getElementById('three-canvas') as HTMLCanvasElement

    this.scene = new THREE.Scene()
    this.scene.fog = new THREE.FogExp2(0x05081a, 0.045)

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      200
    )
    this.camera.position.copy(this.initialCameraPos)
    this.camera.lookAt(this.initialTarget)

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.15
    this.renderer.setClearColor(0x05081a, 1)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.06
    this.controls.rotateSpeed = 0.65
    this.controls.zoomSpeed = 0.7
    this.controls.minDistance = 3
    this.controls.maxDistance = 18
    this.controls.target.copy(this.initialTarget)
    this.controls.enablePan = false
    this.controls.minPolarAngle = Math.PI * 0.15
    this.controls.maxPolarAngle = Math.PI * 0.85

    this.cellScene = new CellScene(this.scene)
    this.particleEffect = new ParticleEffect(this.scene)
    this.controller = new MitosisController(this.cellScene, this.particleEffect)

    this.controller.setOnPhaseChange((phase) => this.updatePhaseUI(phase))
    this.controller.setOnProgressChange((phaseProgress, overall) => this.updateProgressUI(phaseProgress, overall))
    this.controller.setOnPlayStateChange((isPlaying) => this.updatePlayButtonUI(isPlaying))
    this.controller.setOnTimeUpdate((remaining, total) => this.updateTimeUI(remaining, total))

    window.addEventListener('resize', this.onResize.bind(this))
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  private animate(): void {
    requestAnimationFrame(this.animate.bind(this))
    const delta = Math.min(this.clock.getDelta(), 0.05)
    this.controls.update()
    this.controller.update(delta)
    this.renderer.render(this.scene, this.camera)
  }

  private setupUI(): void {
    const playBtn = document.getElementById('play-btn')
    const resetCameraBtn = document.getElementById('reset-camera-btn')
    const phaseButtons = document.querySelectorAll('.phase-btn')
    const miniStages = document.querySelectorAll('.mini-stage')
    const panelToggle = document.getElementById('panel-toggle')
    const infoPanel = document.getElementById('info-panel')

    playBtn?.addEventListener('click', () => {
      this.controller.toggle()
    })

    resetCameraBtn?.addEventListener('click', () => {
      this.resetCamera()
    })

    phaseButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const phase = (btn as HTMLElement).dataset.phase as PhaseType
        if (phase) {
          this.controller.jumpToPhase(phase)
          this.controller.play()
        }
      })
    })

    miniStages.forEach((stage) => {
      stage.addEventListener('click', () => {
        const phase = (stage as HTMLElement).dataset.phase as PhaseType
        if (phase) {
          this.controller.jumpToPhase(phase)
          this.controller.play()
        }
      })
    })

    panelToggle?.addEventListener('click', () => {
      this.toggleDrawer()
    })

    const drawerOverlay = document.getElementById('drawer-overlay')
    drawerOverlay?.addEventListener('click', () => {
      this.closeDrawer()
    })

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) {
        this.closeDrawer()
      }
    })

    this.updatePhaseUI('interphase')
    this.updateProgressUI(0, 0)
    this.updatePlayButtonUI(false)
    this.updateActivePhaseButtons('interphase')
  }

  private resetCamera(): void {
    const duration = 600
    const startPos = this.camera.position.clone()
    const startTarget = this.controls.target.clone()
    const startTime = performance.now()

    const animateCamera = () => {
      const elapsed = performance.now() - startTime
      const t = Math.min(1, elapsed / duration)
      const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

      this.camera.position.lerpVectors(startPos, this.initialCameraPos, eased)
      this.controls.target.lerpVectors(startTarget, this.initialTarget, eased)

      if (t < 1) {
        requestAnimationFrame(animateCamera)
      }
    }
    animateCamera()
  }

  private updatePhaseUI(phase: PhaseType): void {
    const info = PHASES[phase]
    const phaseNameEl = document.getElementById('phase-name')
    const phaseDurationEl = document.getElementById('phase-duration')
    const phaseDescEl = document.getElementById('phase-description')
    const infoPanel = document.getElementById('info-panel')

    if (infoPanel) {
      infoPanel.classList.remove('visible')
      void infoPanel.offsetWidth
      infoPanel.classList.add('visible')
    }

    if (phaseNameEl) phaseNameEl.textContent = info.name
    if (phaseDurationEl) phaseDurationEl.textContent = `剩余 ${info.duration}秒`
    if (phaseDescEl) phaseDescEl.textContent = info.description

    this.updateActivePhaseButtons(phase)
  }

  private updateTimeUI(remainingSeconds: number, totalSeconds: number): void {
    const phaseDurationEl = document.getElementById('phase-duration')
    if (phaseDurationEl) {
      phaseDurationEl.textContent = `剩余 ${Math.max(0, remainingSeconds)}秒`
    }
  }

  private updateProgressUI(phaseProgress: number, overallProgress: number): void {
    const progressFill = document.getElementById('progress-fill')
    const progressText = document.getElementById('progress-text')
    if (progressFill) progressFill.style.width = `${Math.round(overallProgress * 100)}%`
    if (progressText) progressText.textContent = `${Math.round(overallProgress * 100)}%`
  }

  private updatePlayButtonUI(isPlaying: boolean): void {
    const playBtn = document.getElementById('play-btn')
    if (!playBtn) return
    const iconEl = playBtn.querySelector('.btn-icon')
    const labelEl = playBtn.querySelector('.btn-label')

    if (isPlaying) {
      playBtn.classList.add('playing')
      if (iconEl) iconEl.textContent = '❚❚'
      if (labelEl) labelEl.textContent = '暂停'
    } else {
      playBtn.classList.remove('playing')
      if (iconEl) iconEl.textContent = '▶'
      if (labelEl) labelEl.textContent = this.controller.getIsFinished() ? '重播' : '播放'
    }
  }

  private updateActivePhaseButtons(phase: PhaseType): void {
    document.querySelectorAll('.phase-btn').forEach((btn) => {
      if ((btn as HTMLElement).dataset.phase === phase) {
        btn.classList.add('active')
      } else {
        btn.classList.remove('active')
      }
    })

    document.querySelectorAll('.mini-stage').forEach((stage) => {
      if ((stage as HTMLElement).dataset.phase === phase) {
        stage.classList.add('active')
      } else {
        stage.classList.remove('active')
      }
    })
  }

  private toggleDrawer(): void {
    const infoPanel = document.getElementById('info-panel')
    const drawerOverlay = document.getElementById('drawer-overlay')
    const isOpen = infoPanel?.classList.contains('drawer-open')

    if (isOpen) {
      this.closeDrawer()
    } else {
      this.openDrawer()
    }
  }

  private openDrawer(): void {
    const infoPanel = document.getElementById('info-panel')
    const drawerOverlay = document.getElementById('drawer-overlay')
    infoPanel?.classList.add('drawer-open')
    drawerOverlay?.classList.add('visible')
  }

  private closeDrawer(): void {
    const infoPanel = document.getElementById('info-panel')
    const drawerOverlay = document.getElementById('drawer-overlay')
    infoPanel?.classList.remove('drawer-open')
    drawerOverlay?.classList.remove('visible')
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App()
})
