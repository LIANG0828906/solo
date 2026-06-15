import * as THREE from 'three'

export interface ArtworkPosition {
  id: string
  position: THREE.Vector3
  rotation: THREE.Euler
  frameMesh: THREE.Mesh
  frameGroup: THREE.Group
}

interface ArtworkAnimState {
  hoverTime: number
  basePosition: THREE.Vector3
  baseScale: THREE.Vector3
  haloPoints: THREE.Mesh[]
  haloAngle: number
}

export interface GalleryConfig {
  ringRadius?: number
  wallHeight?: number
  wallThickness?: number
  artworkWidth?: number
  artworkHeight?: number
  artworkCount?: number
  artworkHeightOffset?: number
  particleCount?: number
  wallColor?: THREE.Color
  particleColor?: THREE.Color
}

const DEFAULT_CONFIG: Required<GalleryConfig> = {
  ringRadius: 10,
  wallHeight: 5,
  wallThickness: 0.3,
  artworkWidth: 2,
  artworkHeight: 1.5,
  artworkCount: 6,
  artworkHeightOffset: 1.5,
  particleCount: 200,
  wallColor: new THREE.Color(0x9966ff),
  particleColor: new THREE.Color(0xffffff),
}

export class GalleryBuilder {
  private scene: THREE.Scene
  private config: Required<GalleryConfig>

  private wallMesh: THREE.Mesh | null = null
  private wallMaterial: THREE.ShaderMaterial | null = null
  private floorMesh: THREE.Mesh | null = null
  private floorMaterial: THREE.MeshStandardMaterial | null = null
  private spotlight: THREE.SpotLight | null = null
  private particles: THREE.Points | null = null
  private particleMaterial: THREE.PointsMaterial | null = null

  private artworkPositions: ArtworkPosition[] = []
  private frameMeshes: THREE.Mesh[] = []
  private glowMeshes: THREE.Mesh[] = []
  private frameGroups: THREE.Group[] = []
  private animStates: Map<string, ArtworkAnimState> = new Map()

  private hoveredId: string | null = null
  private selectedId: string | null = null

  private particleVelocities: THREE.Vector3[] = []
  private wallColorPhase: number = 0
  private wallColorCyclePeriod: number = 30

  private readonly hoverDuration: number = 0.3
  private readonly haloPointCount: number = 16
  private readonly haloRotationSpeed: number = Math.PI * 2
  private readonly hoverColorStart: THREE.Color = new THREE.Color(0x4488ff)
  private readonly hoverColorEnd: THREE.Color = new THREE.Color(0xffd700)
  private readonly emissiveIntensityStart: number = 0.3
  private readonly emissiveIntensityEnd: number = 0.8

  private isBuilt: boolean = false

  constructor(scene: THREE.Scene, config: GalleryConfig = {}) {
    this.scene = scene
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  build(): void {
    if (this.isBuilt) return

    this.createWall()
    this.createFloor()
    this.createArtworkFrames()
    this.createSpotlight()
    this.createParticles()

    this.isBuilt = true
  }

  private createWall(): void {
    const { ringRadius, wallHeight, wallThickness } = this.config

    const innerRadius = ringRadius - wallThickness / 2
    const outerRadius = ringRadius + wallThickness / 2

    const geometry = new THREE.CylinderGeometry(
      outerRadius,
      outerRadius,
      wallHeight,
      64,
      1,
      true
    )

    const innerGeometry = new THREE.CylinderGeometry(
      innerRadius,
      innerRadius,
      wallHeight,
      64,
      1,
      true
    )

    const mergedGeometry = this.mergeCylinderGeometries(
      geometry,
      innerGeometry,
      wallHeight,
      innerRadius,
      outerRadius
    )

    const vertexShader = `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vHeight;

      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vHeight = position.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `

    const fragmentShader = `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uWallHeight;

      varying vec3 vNormal;
      varying vec3 vPosition;
      varying float vHeight;

      void main() {
        float normalizedHeight = (vHeight + uWallHeight / 2.0) / uWallHeight;
        
        float glowIntensity = 0.6 + 0.4 * sin(normalizedHeight * 3.14159);
        
        float edgeGlow = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0) * 0.3;
        
        vec3 finalColor = uColor * (glowIntensity + edgeGlow);
        float alpha = 0.4 + 0.2 * glowIntensity;

        gl_FragColor = vec4(finalColor, alpha);
      }
    `

    this.wallMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: this.config.wallColor.clone() },
        uTime: { value: 0 },
        uWallHeight: { value: wallHeight },
      },
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    this.wallMesh = new THREE.Mesh(mergedGeometry, this.wallMaterial)
    this.wallMesh.position.y = wallHeight / 2
    this.scene.add(this.wallMesh)
  }

  private mergeCylinderGeometries(
    outerGeo: THREE.CylinderGeometry,
    innerGeo: THREE.CylinderGeometry,
    height: number,
    innerRadius: number,
    outerRadius: number
  ): THREE.BufferGeometry {
    const positions: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    const outerPositions = outerGeo.attributes.position
    const outerNormals = outerGeo.attributes.normal
    const outerUvs = outerGeo.attributes.uv
    const outerIndex = outerGeo.index

    const innerPositions = innerGeo.attributes.position
    const innerNormals = innerGeo.attributes.normal
    const innerUvs = innerGeo.attributes.uv
    const innerIndex = innerGeo.index

    let vertexOffset = 0

    if (outerIndex) {
      for (let i = 0; i < outerPositions.count; i++) {
        positions.push(
          outerPositions.getX(i),
          outerPositions.getY(i),
          outerPositions.getZ(i)
        )
        normals.push(
          outerNormals.getX(i),
          outerNormals.getY(i),
          outerNormals.getZ(i)
        )
        uvs.push(outerUvs.getX(i), outerUvs.getY(i))
      }
      for (let i = 0; i < outerIndex.count; i++) {
        indices.push(outerIndex.getX(i) + vertexOffset)
      }
      vertexOffset += outerPositions.count
    }

    if (innerIndex) {
      for (let i = 0; i < innerPositions.count; i++) {
        positions.push(
          innerPositions.getX(i),
          innerPositions.getY(i),
          innerPositions.getZ(i)
        )
        normals.push(
          -innerNormals.getX(i),
          -innerNormals.getY(i),
          -innerNormals.getZ(i)
        )
        uvs.push(innerUvs.getX(i), innerUvs.getY(i))
      }
      for (let i = 0; i < innerIndex.count; i++) {
        indices.push(innerIndex.getX(i) + vertexOffset)
      }
      vertexOffset += innerPositions.count
    }

    const segments = 64
    const halfHeight = height / 2

    for (let i = 0; i < segments; i++) {
      const angle1 = (i / segments) * Math.PI * 2
      const angle2 = ((i + 1) / segments) * Math.PI * 2

      const x1o = Math.cos(angle1) * outerRadius
      const z1o = Math.sin(angle1) * outerRadius
      const x2o = Math.cos(angle2) * outerRadius
      const z2o = Math.sin(angle2) * outerRadius

      const x1i = Math.cos(angle1) * innerRadius
      const z1i = Math.sin(angle1) * innerRadius
      const x2i = Math.cos(angle2) * innerRadius
      const z2i = Math.sin(angle2) * innerRadius

      const topIdx = vertexOffset
      positions.push(x1o, halfHeight, z1o)
      positions.push(x2o, halfHeight, z2o)
      positions.push(x2i, halfHeight, z2i)
      positions.push(x1i, halfHeight, z1i)

      for (let j = 0; j < 4; j++) {
        normals.push(0, 1, 0)
        uvs.push(j % 2, j < 2 ? 1 : 0)
      }

      indices.push(topIdx, topIdx + 1, topIdx + 2)
      indices.push(topIdx, topIdx + 2, topIdx + 3)

      vertexOffset += 4

      const bottomIdx = vertexOffset
      positions.push(x1o, -halfHeight, z1o)
      positions.push(x1i, -halfHeight, z1i)
      positions.push(x2i, -halfHeight, z2i)
      positions.push(x2o, -halfHeight, z2o)

      for (let j = 0; j < 4; j++) {
        normals.push(0, -1, 0)
        uvs.push(j % 2, j < 2 ? 0 : 1)
      }

      indices.push(bottomIdx, bottomIdx + 1, bottomIdx + 2)
      indices.push(bottomIdx, bottomIdx + 2, bottomIdx + 3)

      vertexOffset += 4
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setIndex(indices)

    return geometry
  }

  private createFloor(): void {
    const { ringRadius } = this.config

    const geometry = new THREE.CircleGeometry(ringRadius * 1.2, 64)

    this.floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a1a2e,
      metalness: 0.9,
      roughness: 0.1,
      envMapIntensity: 1.0,
    })

    this.floorMesh = new THREE.Mesh(geometry, this.floorMaterial)
    this.floorMesh.rotation.x = -Math.PI / 2
    this.floorMesh.receiveShadow = true
    this.scene.add(this.floorMesh)
  }

  private createArtworkFrames(): void {
    const {
      ringRadius,
      artworkCount,
      artworkWidth,
      artworkHeight,
      artworkHeightOffset,
    } = this.config

    const frameThickness = 0.1
    const frameBorder = 0.15

    for (let i = 0; i < artworkCount; i++) {
      const angle = (i / artworkCount) * Math.PI * 2

      const x = Math.sin(angle) * (ringRadius - 0.5)
      const z = Math.cos(angle) * (ringRadius - 0.5)
      const y = artworkHeightOffset

      const frameGroup = new THREE.Group()

      const frameGeometry = new THREE.BoxGeometry(
        artworkWidth + frameBorder * 2,
        artworkHeight + frameBorder * 2,
        frameThickness
      )

      const frameMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a3a,
        metalness: 0.8,
        roughness: 0.3,
        emissive: 0x4488ff,
        emissiveIntensity: 0.3,
      })

      const id = `artwork-${i}`

      const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial)
      frameMesh.castShadow = true
      frameMesh.receiveShadow = true
      frameMesh.userData.artworkId = id
      frameGroup.add(frameMesh)
      this.frameMeshes.push(frameMesh)

      const canvasGeometry = new THREE.PlaneGeometry(artworkWidth, artworkHeight)
      const canvasMaterial = new THREE.MeshBasicMaterial({
        color: 0x111122,
        side: THREE.DoubleSide,
      })
      const canvasMesh = new THREE.Mesh(canvasGeometry, canvasMaterial)
      canvasMesh.name = 'artwork-canvas'
      canvasMesh.userData.artworkId = id
      canvasMesh.userData.type = 'canvas'
      canvasMesh.position.z = frameThickness / 2 + 0.001
      frameGroup.add(canvasMesh)

      const glowGeometry = new THREE.PlaneGeometry(
        artworkWidth + frameBorder * 2 + 0.1,
        artworkHeight + frameBorder * 2 + 0.1
      )
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      })
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial)
      glowMesh.position.z = -frameThickness / 2 - 0.01
      frameGroup.add(glowMesh)
      this.glowMeshes.push(glowMesh)

      const haloPoints = this.createHaloPoints(artworkWidth + frameBorder * 2, artworkHeight + frameBorder * 2, frameThickness)
      haloPoints.forEach((p) => {
        p.visible = false
        frameGroup.add(p)
      })

      frameGroup.position.set(x, y, z)
      frameGroup.rotation.y = angle
      frameGroup.scale.set(1, 1, 1)
      frameGroup.userData.artworkId = id

      this.frameGroups.push(frameGroup)
      this.animStates.set(id, {
        hoverTime: 0,
        basePosition: new THREE.Vector3(x, y, z),
        baseScale: new THREE.Vector3(1, 1, 1),
        haloPoints,
        haloAngle: 0,
      })

      this.artworkPositions.push({
        id,
        position: new THREE.Vector3(x, y, z),
        rotation: new THREE.Euler(0, angle, 0),
        frameMesh: frameMesh,
        frameGroup: frameGroup,
      })

      this.scene.add(frameGroup)
    }
  }

  private createHaloPoints(width: number, height: number, depth: number): THREE.Mesh[] {
    const points: THREE.Mesh[] = []
    const pointGeometry = new THREE.SphereGeometry(0.02, 8, 8)
    const pointMaterial = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.9,
    })

    for (let i = 0; i < this.haloPointCount; i++) {
      const mesh = new THREE.Mesh(pointGeometry, pointMaterial.clone())
      points.push(mesh)
    }

    this.updateHaloPointPositions(points, width, height, depth, 0)

    return points
  }

  private updateHaloPointPositions(
    points: THREE.Mesh[],
    width: number,
    height: number,
    depth: number,
    startAngle: number
  ): void {
    const hw = width / 2
    const hh = height / 2
    const zd = depth / 2 + 0.02

    const perimeter = 2 * (width + height)

    for (let i = 0; i < points.length; i++) {
      const distAlongPerimeter = ((i / points.length) * perimeter + startAngle * perimeter / (Math.PI * 2)) % perimeter

      let px: number
      let py: number

      if (distAlongPerimeter < width) {
        px = -hw + distAlongPerimeter
        py = hh
      } else if (distAlongPerimeter < width + height) {
        px = hw
        py = hh - (distAlongPerimeter - width)
      } else if (distAlongPerimeter < 2 * width + height) {
        px = hw - (distAlongPerimeter - width - height)
        py = -hh
      } else {
        px = -hw
        py = -hh + (distAlongPerimeter - 2 * width - height)
      }

      points[i].position.set(px, py, zd)
    }
  }

  private createSpotlight(): void {
    const { wallHeight } = this.config

    this.spotlight = new THREE.SpotLight(0xffeedd, 2, 30, Math.PI / 4, 0.5, 1)
    this.spotlight.position.set(0, wallHeight - 0.5, 0)
    this.spotlight.target.position.set(0, wallHeight / 2, -10)
    this.spotlight.castShadow = true
    this.spotlight.shadow.mapSize.width = 1024
    this.spotlight.shadow.mapSize.height = 1024
    this.spotlight.shadow.camera.near = 0.5
    this.spotlight.shadow.camera.far = 30
    this.spotlight.shadow.bias = -0.0001

    this.scene.add(this.spotlight)
    this.scene.add(this.spotlight.target)
  }

  private createParticles(): void {
    const { particleCount, ringRadius, wallHeight, particleColor } = this.config

    const geometry = new THREE.BufferGeometry()
    const positions: number[] = []
    const sizes: number[] = []
    const colors: number[] = []

    for (let i = 0; i < particleCount; i++) {
      const radius = Math.random() * ringRadius * 0.9
      const angle = Math.random() * Math.PI * 2
      const y = Math.random() * wallHeight * 0.9 + 0.2

      positions.push(
        Math.cos(angle) * radius,
        y,
        Math.sin(angle) * radius
      )

      const size = 0.5 + Math.random() * 1.5
      sizes.push(size)

      colors.push(particleColor.r, particleColor.g, particleColor.b)

      this.particleVelocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02,
          (Math.random() - 0.5) * 0.02
        )
      )
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))

    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.08,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })

    this.particles = new THREE.Points(geometry, this.particleMaterial)
    this.scene.add(this.particles)
  }

  update(delta: number, camera?: THREE.Camera): void {
    if (!this.isBuilt) return

    this.wallColorPhase += delta / this.wallColorCyclePeriod
    this.wallColorPhase = this.wallColorPhase % 1

    if (this.wallMaterial) {
      const color = this.getGradientColor(this.wallColorPhase)
      this.wallMaterial.uniforms.uColor.value.copy(color)
      this.wallMaterial.uniforms.uTime.value += delta
    }

    this.updateParticles(delta)
    this.updateArtworkAnimations(delta)

    if (this.spotlight && camera) {
      this.updateSpotlightTarget(camera)
    }
  }

  private updateArtworkAnimations(delta: number): void {
    const { artworkWidth, artworkHeight, artworkCount } = this.config
    const frameBorder = 0.15
    const frameThickness = 0.1
    const fullWidth = artworkWidth + frameBorder * 2
    const fullHeight = artworkHeight + frameBorder * 2

    for (let i = 0; i < artworkCount; i++) {
      const id = `artwork-${i}`
      const state = this.animStates.get(id)
      const frameGroup = this.frameGroups[i]
      const glowMesh = this.glowMeshes[i]
      const frameMesh = this.frameMeshes[i]

      if (!state || !frameGroup || !glowMesh || !frameMesh) continue

      if (this.hoveredId === id) {
        state.hoverTime = Math.min(this.hoverDuration, state.hoverTime + delta)
      } else {
        state.hoverTime = Math.max(0, state.hoverTime - delta)
      }

      const t = state.hoverTime / this.hoverDuration
      const easeT = this.easeOutCubic(t)

      const scaleValue = 1 + 0.1 * easeT
      frameGroup.scale.set(
        state.baseScale.x * scaleValue,
        state.baseScale.y * scaleValue,
        state.baseScale.z * scaleValue
      )

      frameGroup.position.set(
        state.basePosition.x,
        state.basePosition.y + 0.01 * easeT,
        state.basePosition.z
      )

      const glowMat = glowMesh.material as THREE.MeshBasicMaterial
      glowMat.color.copy(this.hoverColorStart).lerp(this.hoverColorEnd, easeT)
      glowMat.opacity = 0.3 + 0.3 * easeT

      const frameMat = frameMesh.material as THREE.MeshStandardMaterial
      frameMat.emissive.copy(this.hoverColorStart).lerp(this.hoverColorEnd, easeT)
      frameMat.emissiveIntensity = this.emissiveIntensityStart + (this.emissiveIntensityEnd - this.emissiveIntensityStart) * easeT

      const isSelected = this.selectedId === id
      state.haloPoints.forEach((p) => {
        p.visible = isSelected
      })

      if (isSelected) {
        state.haloAngle += this.haloRotationSpeed * delta
        state.haloAngle = state.haloAngle % (Math.PI * 2)
        this.updateHaloPointPositions(state.haloPoints, fullWidth, fullHeight, frameThickness, state.haloAngle)
      }
    }
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  private getGradientColor(phase: number): THREE.Color {
    const purple = new THREE.Color(0x9966ff)
    const blue = new THREE.Color(0x4488ff)

    const t = Math.sin(phase * Math.PI * 2) * 0.5 + 0.5

    return purple.clone().lerp(blue, t)
  }

  private updateParticles(delta: number): void {
    if (!this.particles) return

    const positions = this.particles.geometry.attributes.position as THREE.BufferAttribute
    const { ringRadius, wallHeight, particleCount } = this.config

    for (let i = 0; i < particleCount; i++) {
      const velocity = this.particleVelocities[i]

      velocity.x += (Math.random() - 0.5) * 0.001
      velocity.y += (Math.random() - 0.5) * 0.001
      velocity.z += (Math.random() - 0.5) * 0.001

      const maxSpeed = 0.03
      if (velocity.length() > maxSpeed) {
        velocity.normalize().multiplyScalar(maxSpeed)
      }

      let x = positions.getX(i) + velocity.x
      let y = positions.getY(i) + velocity.y
      let z = positions.getZ(i) + velocity.z

      const distFromCenter = Math.sqrt(x * x + z * z)
      if (distFromCenter > ringRadius * 0.85) {
        const angle = Math.atan2(z, x)
        x = Math.cos(angle) * ringRadius * 0.85
        z = Math.sin(angle) * ringRadius * 0.85
        velocity.x *= -0.5
        velocity.z *= -0.5
      }

      if (y < 0.3) {
        y = 0.3
        velocity.y = Math.abs(velocity.y) * 0.5
      }
      if (y > wallHeight - 0.3) {
        y = wallHeight - 0.3
        velocity.y = -Math.abs(velocity.y) * 0.5
      }

      positions.setXYZ(i, x, y, z)
    }

    positions.needsUpdate = true
  }

  private updateSpotlightTarget(camera: THREE.Camera): void {
    if (!this.spotlight) return

    const direction = new THREE.Vector3()
    camera.getWorldDirection(direction)
    direction.y = 0
    direction.normalize()

    const targetDistance = 8
    const targetPos = new THREE.Vector3(
      direction.x * targetDistance,
      this.config.wallHeight / 2,
      direction.z * targetDistance
    )

    this.spotlight.target.position.lerp(targetPos, 0.1)
    this.spotlight.target.updateMatrixWorld()
  }

  setHoveredArtwork(id: string | null): void {
    this.hoveredId = id
  }

  setSelectedArtwork(id: string | null): void {
    this.selectedId = id
  }

  getFrameGroups(): THREE.Group[] {
    return this.frameGroups.slice()
  }

  setWallColor(color: THREE.Color | string | number): void {
    if (this.wallMaterial) {
      this.wallMaterial.uniforms.uColor.value.set(color)
    }
  }

  setParticleColor(color: THREE.Color | string | number): void {
    if (!this.particles) return

    const colors = this.particles.geometry.attributes.color as THREE.BufferAttribute
    const targetColor = new THREE.Color(color)

    for (let i = 0; i < colors.count; i++) {
      colors.setXYZ(i, targetColor.r, targetColor.g, targetColor.b)
    }
    colors.needsUpdate = true
  }

  getArtworkPositions(): ArtworkPosition[] {
    return this.artworkPositions.map((ap) => ({
      ...ap,
      position: ap.position.clone(),
      rotation: ap.rotation.clone(),
    }))
  }

  dispose(): void {
    if (this.wallMesh) {
      this.scene.remove(this.wallMesh)
      this.wallMesh.geometry.dispose()
      this.wallMaterial?.dispose()
      this.wallMesh = null
      this.wallMaterial = null
    }

    if (this.floorMesh) {
      this.scene.remove(this.floorMesh)
      this.floorMesh.geometry.dispose()
      this.floorMaterial?.dispose()
      this.floorMesh = null
      this.floorMaterial = null
    }

    this.frameGroups.forEach((group) => {
      this.scene.remove(group)
      group.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })
    })
    this.frameMeshes = []
    this.glowMeshes = []
    this.frameGroups = []
    this.artworkPositions = []
    this.animStates.clear()
    this.hoveredId = null
    this.selectedId = null

    if (this.spotlight) {
      this.scene.remove(this.spotlight)
      this.scene.remove(this.spotlight.target)
      this.spotlight.dispose()
      this.spotlight = null
    }

    if (this.particles) {
      this.scene.remove(this.particles)
      this.particles.geometry.dispose()
      this.particleMaterial?.dispose()
      this.particles = null
      this.particleMaterial = null
      this.particleVelocities = []
    }

    this.isBuilt = false
  }
}
