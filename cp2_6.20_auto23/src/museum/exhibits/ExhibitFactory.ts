import * as THREE from 'three'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js'

export interface ExhibitData {
  id: string
  name: string
  author: string
  year: string
  material: string
  dimensions: string
  description: string
  hallId: 'painting' | 'sculpture' | 'modern' | 'lobby'
  position: { x: number; y: number; z: number }
  rotation?: { x: number; y: number; z: number }
  imageUrl: string
  type: 'painting' | 'sculpture' | 'installation'
  audioDuration: number
}

export interface Exhibit3D {
  group: THREE.Group
  data: ExhibitData
  baseY: number
  pulseMesh?: THREE.Mesh
  isPulsing: boolean
}

export class ExhibitFactory {
  private scene: THREE.Scene
  private labelRenderer: CSS2DRenderer
  private exhibits: Map<string, Exhibit3D> = new Map()
  private textureCache: Map<string, THREE.Texture> = new Map()

  constructor(scene: THREE.Scene, labelRenderer: CSS2DRenderer) {
    this.scene = scene
    this.labelRenderer = labelRenderer
  }

  private async loadTexture(url: string): Promise<THREE.Texture> {
    if (this.textureCache.has(url)) {
      return this.textureCache.get(url)!
    }
    const loader = new THREE.TextureLoader()
    return new Promise((resolve) => {
      loader.load(
        url,
        (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace
          this.textureCache.set(url, texture)
          resolve(texture)
        },
        undefined,
        () => {
          const canvas = document.createElement('canvas')
          canvas.width = 512
          canvas.height = 512
          const ctx = canvas.getContext('2d')!
          const gradient = ctx.createLinearGradient(0, 0, 512, 512)
          gradient.addColorStop(0, '#c9a962')
          gradient.addColorStop(0.5, '#e08a3c')
          gradient.addColorStop(1, '#c9a962')
          ctx.fillStyle = gradient
          ctx.fillRect(0, 0, 512, 512)
          ctx.fillStyle = 'rgba(255,255,255,0.1)'
          ctx.font = 'bold 36px Cinzel, serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('ARTWORK', 256, 256)
          const texture = new THREE.CanvasTexture(canvas)
          texture.colorSpace = THREE.SRGBColorSpace
          this.textureCache.set(url, texture)
          resolve(texture)
        }
      )
    })
  }

  async createExhibit(data: ExhibitData): Promise<Exhibit3D> {
    const group = new THREE.Group()
    group.position.set(data.position.x, data.position.y, data.position.z)
    if (data.rotation) {
      group.rotation.set(data.rotation.x, data.rotation.y, data.rotation.z)
    }

    let mainMesh: THREE.Mesh

    if (data.type === 'painting') {
      mainMesh = await this.createPainting(data)
      group.add(mainMesh)
      const frame = this.createFrame()
      group.add(frame)
    } else if (data.type === 'sculpture') {
      mainMesh = this.createSculpture(data)
      group.add(mainMesh)
      const pedestal = this.createPedestal()
      pedestal.position.y = -0.9
      group.add(pedestal)
    } else {
      mainMesh = this.createInstallation(data)
      group.add(mainMesh)
    }

    mainMesh.userData.exhibitId = data.id
    mainMesh.userData.isExhibit = true

    const halo = this.createPulseHalo()
    halo.visible = false
    group.add(halo)

    const label = this.createLabel(`${data.name}\n${data.author} · ${data.year}`)
    label.position.y = data.type === 'painting' ? -1.4 : -1.6
    group.add(label)

    this.scene.add(group)

    const exhibit3D: Exhibit3D = {
      group,
      data,
      baseY: data.position.y,
      pulseMesh: halo as THREE.Mesh,
      isPulsing: false,
    }

    this.exhibits.set(data.id, exhibit3D)
    return exhibit3D
  }

  private async createPainting(data: ExhibitData): Promise<THREE.Mesh> {
    const texture = await this.loadTexture(data.imageUrl)
    const geometry = new THREE.PlaneGeometry(1.8, 1.3)
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.7,
      metalness: 0.1,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.z = 0.02
    return mesh
  }

  private createFrame(): THREE.Mesh {
    const shape = new THREE.Shape()
    shape.moveTo(-1.05, -0.75)
    shape.lineTo(1.05, -0.75)
    shape.lineTo(1.05, 0.75)
    shape.lineTo(-1.05, 0.75)
    shape.lineTo(-1.05, -0.75)

    const hole = new THREE.Path()
    hole.moveTo(-0.9, -0.65)
    hole.lineTo(0.9, -0.65)
    hole.lineTo(0.9, 0.65)
    hole.lineTo(-0.9, 0.65)
    hole.lineTo(-0.9, -0.65)
    shape.holes.push(hole)

    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.1,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
    })

    const material = new THREE.MeshStandardMaterial({
      color: 0xc9a962,
      roughness: 0.4,
      metalness: 0.8,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.z = -0.05
    return mesh
  }

  private createSculpture(_data: ExhibitData): THREE.Mesh {
    const geometry = new THREE.TorusKnotGeometry(0.5, 0.15, 80, 16)
    const material = new THREE.MeshStandardMaterial({
      color: 0xd4cfc4,
      roughness: 0.3,
      metalness: 0.1,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.y = 0.3
    mesh.castShadow = true
    return mesh
  }

  private createPedestal(): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(0.45, 0.55, 0.6, 32)
    const material = new THREE.MeshStandardMaterial({
      color: 0x2a2a2f,
      roughness: 0.8,
      metalness: 0.2,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.receiveShadow = true
    return mesh
  }

  private createInstallation(_data: ExhibitData): THREE.Mesh {
    const geometry = new THREE.IcosahedronGeometry(0.6, 1)
    const material = new THREE.MeshStandardMaterial({
      color: 0xe08a3c,
      roughness: 0.2,
      metalness: 0.9,
      emissive: 0xe08a3c,
      emissiveIntensity: 0.1,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.castShadow = true
    return mesh
  }

  private createPulseHalo(): THREE.Object3D {
    const geometry = new THREE.RingGeometry(1.0, 1.1, 48)
    const material = new THREE.MeshBasicMaterial({
      color: 0xc9a962,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.rotation.x = -Math.PI / 2
    mesh.position.y = -0.95
    mesh.userData.isHalo = true
    return mesh
  }

  private createLabel(text: string): CSS2DObject {
    const div = document.createElement('div')
    div.style.cssText = `
      color: #c9a962;
      font-family: 'Cinzel', 'Noto Sans SC', serif;
      font-size: 12px;
      letter-spacing: 1px;
      text-align: center;
      background: rgba(26, 26, 31, 0.85);
      padding: 6px 12px;
      border-radius: 6px;
      border: 1px solid rgba(201, 169, 98, 0.3);
      backdrop-filter: blur(8px);
      white-space: pre-line;
      line-height: 1.5;
      pointer-events: none;
    `
    div.textContent = text
    const label = new CSS2DObject(div)
    return label
  }

  updateAnimations(delta: number, elapsedTime: number) {
    this.exhibits.forEach((exhibit) => {
      const floatOffset = Math.sin(elapsedTime * 1.5 + exhibit.group.position.x) * 0.05
      exhibit.group.position.y = exhibit.baseY + floatOffset

      if (exhibit.data.type !== 'painting') {
        exhibit.group.rotation.y += delta * 0.2
      }

      if (exhibit.isPulsing && exhibit.pulseMesh) {
        const pulse = (Math.sin(elapsedTime * 4) + 1) / 2
        const scale = 1 + pulse * 0.5
        exhibit.pulseMesh.scale.set(scale, scale, scale)
        ;(exhibit.pulseMesh.material as THREE.MeshBasicMaterial).opacity = 0.4 + pulse * 0.3
      }
    })
  }

  setExhibitPulsing(exhibitId: string, isPulsing: boolean) {
    const exhibit = this.exhibits.get(exhibitId)
    if (exhibit && exhibit.pulseMesh) {
      exhibit.isPulsing = isPulsing
      exhibit.pulseMesh.visible = isPulsing
      if (!isPulsing) {
        ;(exhibit.pulseMesh.material as THREE.MeshBasicMaterial).opacity = 0
      }
    }
  }

  getExhibit(id: string): Exhibit3D | undefined {
    return this.exhibits.get(id)
  }

  getAllExhibitIds(): string[] {
    return Array.from(this.exhibits.keys())
  }

  clear() {
    this.exhibits.forEach((e) => {
      this.scene.remove(e.group)
    })
    this.exhibits.clear()
  }
}
