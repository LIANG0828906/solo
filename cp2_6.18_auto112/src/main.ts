import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { parseProteinData, ParsedMolecule, AtomData } from './proteinParser'
import { buildMoleculeScene, setupLights, setDisplayMode, DisplayMode, MoleculeGroup } from './sceneBuilder'
import { InteractionManager, AtomInfo } from './interactionManager'
import { UIControls } from './uiControls'

class MoleculeVueApp {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera
  private renderer: THREE.WebGLRenderer
  private controls: OrbitControls
  private moleculeGroup: MoleculeGroup | null = null
  private interactionManager: InteractionManager | null = null
  private uiControls: UIControls | null = null
  private infoCard: HTMLElement | null = null
  private infoCardTimer: number | null = null
  private animationFrameId: number = 0
  private container: HTMLElement

  constructor(containerId: string) {
    const container = document.getElementById(containerId)
    if (!container) {
      throw new Error(`Container with id "${containerId}" not found`)
    }
    this.container = container

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x0A0E27)

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.shadowMap.enabled = false
    this.container.appendChild(this.renderer.domElement)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)

    this.setupLights()
    this.loadMolecule()
    this.setupUI()
    this.setupEventListeners()
    this.animate()

    this.centerCamera()

    if (this.interactionManager) {
      this.interactionManager.setInitialView(
        this.camera.position.clone(),
        this.controls.target.clone()
      )
    }
  }

  private setupLights(): void {
    setupLights(this.scene)
  }

  private loadMolecule(): void {
    const molecule: ParsedMolecule = parseProteinData()

    this.moleculeGroup = buildMoleculeScene(molecule)

    const moleculeRoot = new THREE.Group()
    moleculeRoot.add(this.moleculeGroup.atomGroup)
    moleculeRoot.add(this.moleculeGroup.bondGroup)
    moleculeRoot.add(this.moleculeGroup.glowGroup)

    const box = new THREE.Box3().setFromObject(moleculeRoot)
    const center = new THREE.Vector3()
    box.getCenter(center)
    moleculeRoot.position.sub(center)

    this.scene.add(moleculeRoot)
    this.moleculeGroup.atomGroup = moleculeRoot.children[0] as THREE.Group
    this.moleculeGroup.bondGroup = moleculeRoot.children[1] as THREE.Group
    this.moleculeGroup.glowGroup = moleculeRoot.children[2] as THREE.Group

    const atomMeshes: THREE.Mesh[] = []
    this.moleculeGroup.atomGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        atomMeshes.push(child)
      }
    })
    this.moleculeGroup.atomMeshes = atomMeshes

    const glowMeshes: THREE.Mesh[] = []
    this.moleculeGroup.glowGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        glowMeshes.push(child)
      }
    })
    this.moleculeGroup.glowMeshes = glowMeshes

    const atomsData = molecule.atoms.map((atom: AtomData) => ({
      element: atom.element,
      x: atom.x - center.x,
      y: atom.y - center.y,
      z: atom.z - center.z,
      id: atom.id
    }))

    this.interactionManager = new InteractionManager(
      this.camera,
      this.renderer,
      this.moleculeGroup.atomMeshes,
      this.controls,
      molecule.bonds,
      atomsData,
      this.moleculeGroup,
      {
        onAtomHover: (info) => this.onAtomHover(info),
        onAtomClick: (info) => this.onAtomClick(info)
      }
    )
  }

  private setupUI(): void {
    this.uiControls = new UIControls(document.body, {
      onRotationSpeedChange: (speed) => this.onRotationSpeedChange(speed),
      onDisplayModeChange: (mode) => this.onDisplayModeChange(mode),
      onResetView: () => this.resetView()
    })
  }

  private setupEventListeners(): void {
    window.addEventListener('resize', this.onResize.bind(this))
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(window.innerWidth, window.innerHeight)
  }

  private onRotationSpeedChange(speed: number): void {
    if (this.interactionManager) {
      this.interactionManager.setAutoRotate(speed > 0)
      this.interactionManager.setRotationSpeed(speed)
    }
  }

  private onDisplayModeChange(mode: DisplayMode): void {
    if (this.moleculeGroup) {
      setDisplayMode(this.moleculeGroup, mode, true)
    }
  }

  private onAtomHover(info: AtomInfo | null): void {
  }

  private onAtomClick(info: AtomInfo): void {
    this.showInfoCard(info)
  }

  private showInfoCard(info: AtomInfo): void {
    if (this.infoCardTimer) {
      clearTimeout(this.infoCardTimer)
      this.infoCardTimer = null
    }

    if (this.infoCard) {
      this.infoCard.remove()
      this.infoCard = null
    }

    const card = document.createElement('div')
    card.className = 'atom-info-card'

    const elementColors: Record<string, string> = {
      C: '#808080',
      O: '#FF0D0D',
      N: '#3050F8',
      S: '#FFFF30',
      H: '#FFFFFF'
    }
    const color = elementColors[info.element] || '#808080'

    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 14px;">
        <div style="
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: ${color};
          box-shadow: 0 0 20px ${color}80;
          flex-shrink: 0;
        "></div>
        <div>
          <div style="font-size: 20px; font-weight: 700;">${info.element}</div>
          <div style="font-size: 11px; color: rgba(255,255,255,0.6);">原子 #${info.id}</div>
        </div>
      </div>
      <div style="
        display: grid;
        grid-template-columns: auto 1fr;
        gap: 8px 16px;
        font-size: 13px;
      ">
        <span style="color: rgba(255,255,255,0.6);">X 坐标:</span>
        <span style="font-family: monospace; text-align: right;">${info.x.toFixed(2)}</span>
        <span style="color: rgba(255,255,255,0.6);">Y 坐标:</span>
        <span style="font-family: monospace; text-align: right;">${info.y.toFixed(2)}</span>
        <span style="color: rgba(255,255,255,0.6);">Z 坐标:</span>
        <span style="font-family: monospace; text-align: right;">${info.z.toFixed(2)}</span>
        <span style="color: rgba(255,255,255,0.6);">连接数:</span>
        <span style="font-family: monospace; text-align: right;">${info.neighborCount}</span>
      </div>
    `

    const cardWidth = 260
    const cardHeight = 240
    const margin = 20

    let posX = info.screenX + 30
    let posY = info.screenY - cardHeight / 2

    if (posX + cardWidth + margin > window.innerWidth) {
      posX = info.screenX - cardWidth - 30
    }
    if (posX < margin) {
      posX = margin
    }
    if (posX + cardWidth > window.innerWidth - margin) {
      posX = window.innerWidth - cardWidth - margin
    }
    if (posY < margin) {
      posY = margin
    }
    if (posY + cardHeight > window.innerHeight - margin) {
      posY = window.innerHeight - cardHeight - margin
    }

    card.style.cssText = `
      position: fixed;
      left: ${posX}px;
      top: ${posY}px;
      width: ${cardWidth}px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 20px;
      color: white;
      z-index: 2000;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(255, 255, 255, 0.15);
      opacity: 0;
      transform: scale(0.9);
      transform-origin: ${info.screenX < window.innerWidth / 2 ? 'left' : 'right'} center;
      transition: opacity 0.3s ease, transform 0.3s ease;
      pointer-events: none;
    `

    document.body.appendChild(card)
    this.infoCard = card

    requestAnimationFrame(() => {
      card.style.opacity = '1'
      card.style.transform = 'scale(1)'
    })

    this.infoCardTimer = window.setTimeout(() => {
      this.hideInfoCard()
    }, 2000)
  }

  private hideInfoCard(): void {
    if (this.infoCard) {
      this.infoCard.style.opacity = '0'
      this.infoCard.style.transform = 'scale(0.9)'
      const card = this.infoCard
      setTimeout(() => {
        if (card && card.parentNode) {
          card.remove()
        }
      }, 300)
      this.infoCard = null
    }
    this.infoCardTimer = null
  }

  private centerCamera(): void {
    if (!this.moleculeGroup) return

    const box = new THREE.Box3()
    this.moleculeGroup.atomGroup.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        box.expandByObject(child)
      }
    })

    const center = new THREE.Vector3()
    box.getCenter(center)

    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)

    const fov = this.camera.fov * (Math.PI / 180)
    const distance = (maxDim / 2) / Math.tan(fov / 2) * 1.8

    this.camera.position.set(distance * 0.7, distance * 0.5, distance)
    this.camera.lookAt(center)

    this.controls.target.copy(center)
    this.controls.update()
  }

  private resetView(): void {
    if (this.interactionManager) {
      this.interactionManager.resetView()
    }
  }

  private animate(): void {
    this.animationFrameId = requestAnimationFrame(() => this.animate())

    this.controls.update()

    this.renderer.render(this.scene, this.camera)
  }

  public dispose(): void {
    cancelAnimationFrame(this.animationFrameId)

    if (this.interactionManager) {
      this.interactionManager.dispose()
    }

    if (this.uiControls) {
      this.uiControls.dispose()
    }

    window.removeEventListener('resize', this.onResize.bind(this))

    this.renderer.dispose()
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement)
    }
  }
}

const app = new MoleculeVueApp('app')
;(window as any).__moleculeVueApp = app

export default app
