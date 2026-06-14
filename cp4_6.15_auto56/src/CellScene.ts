import * as THREE from 'three'
import { ParticleEffect, PhaseType } from './ParticleEffect'

const CELL_RADIUS = 2.2

export class CellScene {
  public scene: THREE.Scene
  public container: THREE.Group

  private cellMembrane!: THREE.Mesh
  private cellMembraneInner!: THREE.Mesh
  private nucleus!: THREE.Mesh
  private nucleusGlow!: THREE.Mesh
  private equatorialPlate!: THREE.Mesh
  private rippleLight!: THREE.PointLight

  private chromosomeGroupRed!: THREE.Group
  private chromosomeGroupGreen!: THREE.Group
  private chromatidPairs: { group: THREE.Group; color: number; startX: number; startY: number; startZ: number; poleX: number; poleY: number; poleZ: number }[] = []

  private spindleFibers: THREE.Mesh[] = []
  private spindleGroup!: THREE.Group

  private trailMeshes: THREE.Mesh[] = []
  private trailGroup!: THREE.Group

  private daughterCells: THREE.Group[] = []
  private cleavageFurrow!: THREE.Mesh

  private flashOverlay!: THREE.Mesh

  private time = 0
  private currentPhase: PhaseType = 'interphase'
  private phaseProgress = 0

  private nucleusOpacity = 1
  private cellSplitProgress = 0

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.container = new THREE.Group()
    this.scene.add(this.container)

    this.setupBackground()
    this.setupLighting()
    this.createCellMembrane()
    this.createNucleus()
    this.createChromosomes()
    this.createEquatorialPlate()
    this.createSpindleFibers()
    this.createTrails()
    this.createDaughterCellTargets()
    this.createFlashOverlay()
  }

  private setupBackground(): void {
    const geo = new THREE.SphereGeometry(50, 32, 32)
    const mat = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: {
        topColor: { value: new THREE.Color(0x0a0e27) },
        bottomColor: { value: new THREE.Color(0x05081a) },
        glowColor: { value: new THREE.Color(0x3b4e9c) },
        glowCenter: { value: new THREE.Vector3(0, 0, 0) },
        glowRadius: { value: 8 }
      },
      vertexShader: `
        varying vec3 vPos;
        void main() {
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform vec3 glowColor;
        uniform vec3 glowCenter;
        uniform float glowRadius;
        varying vec3 vPos;
        void main() {
          float h = (vPos.y + 50.0) / 100.0;
          vec3 baseColor = mix(bottomColor, topColor, clamp(h, 0.0, 1.0));
          float dist = length(vPos - glowCenter);
          float glow = smoothstep(glowRadius + 12.0, glowRadius, dist) * 0.35;
          vec3 finalColor = baseColor + glowColor * glow;
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    })
    const bg = new THREE.Mesh(geo, mat)
    this.scene.add(bg)
  }

  private setupLighting(): void {
    const ambient = new THREE.AmbientLight(0x6670aa, 0.45)
    this.scene.add(ambient)

    const hem = new THREE.HemisphereLight(0xa5b4fc, 0x1a1040, 0.35)
    this.scene.add(hem)

    const keyLight = new THREE.DirectionalLight(0xcfe0ff, 0.7)
    keyLight.position.set(4, 6, 5)
    this.scene.add(keyLight)

    const fillLight = new THREE.DirectionalLight(0x7c9aff, 0.35)
    fillLight.position.set(-5, -2, -4)
    this.scene.add(fillLight)

    this.rippleLight = new THREE.PointLight(0x9ba5ff, 0, 8, 2)
    this.rippleLight.position.set(0, 0, 0)
    this.scene.add(this.rippleLight)
  }

  private createCellMembrane(): void {
    const geo = new THREE.SphereGeometry(CELL_RADIUS, 64, 64)
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x7dd3fc) },
        uOpacity: { value: 0.35 },
        uSplit: { value: 0 }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uSplit;
        varying vec3 vNormal;
        varying vec3 vPos;
        varying vec2 vUv;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPos = position;
          vUv = uv;
          vec3 pos = position;
          float wave = sin(pos.x * 3.0 + uTime * 0.8) * 0.015
                     + sin(pos.y * 2.5 + uTime * 1.1) * 0.015
                     + sin(pos.z * 2.8 + uTime * 0.9) * 0.015;
          pos += normal * wave;

          float furrow = 1.0;
          if (uSplit > 0.0) {
            float ringWidth = 0.25;
            float yFactor = smoothstep(-ringWidth, 0.0, pos.y) * (1.0 - smoothstep(0.0, ringWidth, pos.y));
            float squeeze = uSplit * yFactor * 0.55;
            float radial = sqrt(pos.x * pos.x + pos.z * pos.z);
            if (radial > 0.001) {
              pos.x *= (1.0 - squeeze);
              pos.z *= (1.0 - squeeze);
              float yShift = uSplit * yFactor * 0.4 * sign(pos.y);
              pos.y += yShift;
            }
          }

          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec3 vNormal;
        varying vec3 vPos;
        varying vec2 vUv;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
        }

        void main() {
          vec3 viewDir = normalize(cameraPosition - vPos);
          float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.5);

          vec2 flowUv = vUv * 3.5 + vec2(uTime * 0.15, uTime * 0.1);
          float n1 = noise(flowUv);
          float n2 = noise(flowUv * 2.0 + 10.0);
          float pattern = mix(n1, n2, 0.5);
          pattern = smoothstep(0.3, 0.7, pattern);

          vec3 baseColor = uColor * (0.6 + pattern * 0.4);
          vec3 glowColor = uColor * 1.4;
          vec3 finalColor = mix(baseColor, glowColor, fresnel * 0.7);

          float alpha = uOpacity + fresnel * 0.5 + pattern * 0.08;
          alpha = min(alpha, 0.95);

          float rim = fresnel * 0.8;
          finalColor += vec3(0.6, 0.8, 1.0) * rim;

          gl_FragColor = vec4(finalColor, alpha);
        }
      `
    })
    this.cellMembrane = new THREE.Mesh(geo, mat)
    this.container.add(this.cellMembrane)

    const innerGeo = new THREE.SphereGeometry(CELL_RADIUS * 0.98, 48, 48)
    const innerMat = new THREE.MeshPhysicalMaterial({
      color: 0x1a2560,
      transparent: true,
      opacity: 0.12,
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.BackSide
    })
    this.cellMembraneInner = new THREE.Mesh(innerGeo, innerMat)
    this.container.add(this.cellMembraneInner)
  }

  private createNucleus(): void {
    const geo = new THREE.SphereGeometry(1.0, 48, 48)
    geo.scale(1, 0.65, 1)

    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x5b2a90,
      transparent: true,
      opacity: 0.85,
      roughness: 0.35,
      metalness: 0.05,
      emissive: 0x2a0f50,
      emissiveIntensity: 0.4,
      clearcoat: 0.5,
      clearcoatRoughness: 0.5
    })
    this.nucleus = new THREE.Mesh(geo, mat)
    this.nucleus.position.set(0, 0, 0)
    this.container.add(this.nucleus)

    const glowGeo = new THREE.SphereGeometry(1.15, 32, 32)
    glowGeo.scale(1, 0.68, 1)
    const glowMat = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0 },
        uOpacity: { value: 1 }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPos;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vPos = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uIntensity;
        uniform float uOpacity;
        varying vec3 vNormal;
        varying vec3 vPos;
        void main() {
          vec3 viewDir = normalize(cameraPosition - vPos);
          float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 2.0);
          float ripple = 0.0;
          if (uIntensity > 0.0) {
            float dist = length(vPos) * 0.8;
            ripple = sin(dist * 8.0 - uTime * 4.0) * 0.5 + 0.5;
            ripple *= uIntensity * exp(-dist * 0.5);
          }
          vec3 color1 = vec3(0.7, 0.6, 1.0);
          vec3 color2 = vec3(0.4, 0.7, 1.0);
          vec3 color = mix(color1, color2, ripple);
          float alpha = (fresnel * 0.7 + ripple * 0.6) * uOpacity;
          gl_FragColor = vec4(color, alpha);
        }
      `
    })
    this.nucleusGlow = new THREE.Mesh(glowGeo, glowMat)
    this.container.add(this.nucleusGlow)
  }

  private createChromosomeGeometry(tadpoleShape: boolean, color: number): THREE.Mesh {
    const group = new THREE.Group()

    if (tadpoleShape) {
      const bodyGeo = new THREE.CapsuleGeometry(0.08, 0.35, 8, 16)
      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.35,
        metalness: 0.2,
        emissive: color,
        emissiveIntensity: 0.15
      })
      const body = new THREE.Mesh(bodyGeo, mat)
      return body
    } else {
      const shape = new THREE.Shape()
      const armLen = 0.22
      const width = 0.08

      shape.moveTo(-width, -armLen)
      shape.lineTo(width, -armLen)
      shape.lineTo(width, -0.02)
      shape.lineTo(-width, -0.02)
      shape.lineTo(-width, -armLen)

      const extrudeSettings = { depth: 0.06, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 }
      const armGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings)
      armGeo.center()

      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.3,
        metalness: 0.25,
        emissive: color,
        emissiveIntensity: 0.2
      })

      const topArm1 = new THREE.Mesh(armGeo, mat)
      topArm1.position.y = 0.12
      topArm1.rotation.z = 0.15
      topArm1.position.x = -0.05

      const topArm2 = new THREE.Mesh(armGeo, mat)
      topArm2.position.y = 0.12
      topArm2.rotation.z = -0.15
      topArm2.position.x = 0.05

      const botArm1 = new THREE.Mesh(armGeo, mat)
      botArm1.position.y = -0.12
      botArm1.rotation.z = -0.15
      botArm1.position.x = -0.05
      botArm1.rotation.x = Math.PI

      const botArm2 = new THREE.Mesh(armGeo, mat)
      botArm2.position.y = -0.12
      botArm2.rotation.z = 0.15
      botArm2.position.x = 0.05
      botArm2.rotation.x = Math.PI

      const centromereGeo = new THREE.SphereGeometry(0.055, 16, 16)
      const centromereMat = new THREE.MeshStandardMaterial({
        color: 0xffcc44,
        roughness: 0.4,
        metalness: 0.3,
        emissive: 0xffaa00,
        emissiveIntensity: 0.5
      })
      const centromere = new THREE.Mesh(centromereGeo, centromereMat)

      const g = new THREE.Group()
      g.add(topArm1, topArm2, botArm1, botArm2, centromere)
      g.scale.setScalar(1.6)

      const merged = this.mergeGroupToMesh(g, mat)
      return merged
    }
  }

  private mergeGroupToMesh(group: THREE.Group, material: THREE.Material): THREE.Mesh {
    const geometries: THREE.BufferGeometry[] = []
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const geo = child.geometry.clone()
        child.updateMatrixWorld(true)
        geo.applyMatrix4(child.matrixWorld)
        geometries.push(geo)
      }
    })

    if (geometries.length === 0) {
      return new THREE.Mesh(new THREE.BufferGeometry(), material)
    }

    const merged = this.mergeBufferGeometries(geometries)
    return new THREE.Mesh(merged, material)
  }

  private mergeBufferGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    const result = new THREE.BufferGeometry()
    const positions: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indices: number[] = []
    let indexOffset = 0

    geometries.forEach((geo) => {
      const pos = geo.getAttribute('position')
      const norm = geo.getAttribute('normal')
      const uv = geo.getAttribute('uv')
      const idx = geo.index

      for (let i = 0; i < pos.count; i++) {
        positions.push(pos.getX(i), pos.getY(i), pos.getZ(i))
        if (norm) normals.push(norm.getX(i), norm.getY(i), norm.getZ(i))
        if (uv) uvs.push(uv.getX(i), uv.getY(i))
      }

      if (idx) {
        for (let i = 0; i < idx.count; i++) {
          indices.push(idx.getX(i) + indexOffset)
        }
      } else {
        for (let i = 0; i < pos.count; i++) {
          indices.push(i + indexOffset)
        }
      }
      indexOffset += pos.count
    })

    result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    if (normals.length) result.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    if (uvs.length) result.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    result.setIndex(indices)
    return result
  }

  private createChromosomes(): void {
    this.chromosomeGroupRed = new THREE.Group()
    this.chromosomeGroupGreen = new THREE.Group()

    const redMesh = this.createChromosomeGeometry(true, 0xff3344)
    redMesh.position.set(-0.25, 0.1, 0)
    redMesh.rotation.z = 0.4
    this.chromosomeGroupRed.add(redMesh)

    const greenMesh = this.createChromosomeGeometry(true, 0x22dd66)
    greenMesh.position.set(0.25, -0.1, 0)
    greenMesh.rotation.z = -0.3
    this.chromosomeGroupGreen.add(greenMesh)

    this.container.add(this.chromosomeGroupRed)
    this.container.add(this.chromosomeGroupGreen)

    this.chromatidPairs = []
  }

  private ensureChromatidPairs(): void {
    if (this.chromatidPairs.length > 0) return

    this.chromosomeGroupRed.clear()
    this.chromosomeGroupGreen.clear()

    const colors = [0xff3344, 0x22dd66]
    const startPositions = [
      { x: -0.35, y: 0.0, z: 0.1 },
      { x: 0.35, y: 0.0, z: -0.1 }
    ]

    colors.forEach((color, i) => {
      const group = new THREE.Group()
      const pair = [
        this.createChromosomeGeometry(false, color),
        this.createChromosomeGeometry(false, color)
      ]

      pair[0].position.x = -0.08
      pair[0].rotation.z = 0.1
      pair[1].position.x = 0.08
      pair[1].rotation.z = -0.1

      group.add(pair[0])
      group.add(pair[1])
      group.position.set(startPositions[i].x, startPositions[i].y, startPositions[i].z)
      group.visible = false

      if (i === 0) {
        this.chromosomeGroupRed.add(group)
      } else {
        this.chromosomeGroupGreen.add(group)
      }

      this.chromatidPairs.push({
        group,
        color,
        startX: startPositions[i].x,
        startY: startPositions[i].y,
        startZ: startPositions[i].z,
        poleX: i === 0 ? -1.6 : 1.6,
        poleY: 0,
        poleZ: 0
      })
    })
  }

  private createEquatorialPlate(): void {
    const geo = new THREE.TorusGeometry(1.5, 0.015, 16, 96)
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffdd33,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    })
    this.equatorialPlate = new THREE.Mesh(geo, mat)
    this.equatorialPlate.rotation.x = Math.PI / 2
    this.container.add(this.equatorialPlate)
  }

  private createSpindleFibers(): void {
    this.spindleGroup = new THREE.Group()
    this.container.add(this.spindleGroup)

    const fiberMat = new THREE.MeshBasicMaterial({
      color: 0xffee88,
      transparent: true,
      opacity: 0
    })

    for (let i = 0; i < 8; i++) {
      const geo = new THREE.CylinderGeometry(0.008, 0.008, 1, 8)
      const fiber = new THREE.Mesh(geo, fiberMat.clone())
      fiber.visible = false
      this.spindleGroup.add(fiber)
      this.spindleFibers.push(fiber)
    }
  }

  private createTrails(): void {
    this.trailGroup = new THREE.Group()
    this.container.add(this.trailGroup)

    for (let i = 0; i < 4; i++) {
      const geo = new THREE.CylinderGeometry(0.02, 0.0, 0.8, 12)
      const mat = new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
      const trail = new THREE.Mesh(geo, mat)
      trail.visible = false
      this.trailGroup.add(trail)
      this.trailMeshes.push(trail)
    }
  }

  private createDaughterCellTargets(): void {
    this.daughterCells = []
  }

  private createFlashOverlay(): void {
    const geo = new THREE.PlaneGeometry(100, 100)
    const mat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false
    })
    this.flashOverlay = new THREE.Mesh(geo, mat)
    this.flashOverlay.position.z = -5
    this.container.add(this.flashOverlay)
  }

  private updateCellMembrane(): void {
    const mat = this.cellMembrane.material as THREE.ShaderMaterial
    mat.uniforms.uTime.value = this.time
    mat.uniforms.uSplit.value = this.cellSplitProgress
  }

  private updateNucleus(progress: number): void {
    if (this.currentPhase === 'prophase') {
      this.nucleusOpacity = 1 - this.easeInOutCubic(Math.min(progress * 1.3, 1))
      ;(this.nucleus.material as THREE.MeshPhysicalMaterial).opacity = this.nucleusOpacity * 0.85
      ;(this.nucleus.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.4 + progress * 0.6
      this.nucleus.scale.setScalar(1 + progress * 0.15)
      this.nucleus.visible = this.nucleusOpacity > 0.02

      const glowMat = this.nucleusGlow.material as THREE.ShaderMaterial
      glowMat.uniforms.uTime.value = this.time
      glowMat.uniforms.uIntensity.value = progress
      glowMat.uniforms.uOpacity.value = this.nucleusOpacity
      this.rippleLight.intensity = progress * 2.5
    } else if (this.currentPhase === 'telophase') {
      const reformProgress = this.easeInOutCubic(Math.min(progress * 1.5, 1))
      this.nucleusOpacity = reformProgress * 0.85
      this.nucleus.visible = reformProgress > 0.05
      ;(this.nucleus.material as THREE.MeshPhysicalMaterial).opacity = this.nucleusOpacity

      const glowMat = this.nucleusGlow.material as THREE.ShaderMaterial
      glowMat.uniforms.uTime.value = this.time
      glowMat.uniforms.uIntensity.value = 0.3 * reformProgress
      glowMat.uniforms.uOpacity.value = reformProgress * 0.7
      this.rippleLight.intensity = reformProgress * 1.2
    } else if (this.currentPhase === 'interphase') {
      this.nucleusOpacity = 1
      this.nucleus.visible = true
      ;(this.nucleus.material as THREE.MeshPhysicalMaterial).opacity = 0.85
      ;(this.nucleus.material as THREE.MeshPhysicalMaterial).emissiveIntensity = 0.4
      this.nucleus.scale.setScalar(1)
      const glowMat = this.nucleusGlow.material as THREE.ShaderMaterial
      glowMat.uniforms.uOpacity.value = 0
      this.rippleLight.intensity = 0
    } else {
      this.nucleus.visible = false
      const glowMat = this.nucleusGlow.material as THREE.ShaderMaterial
      glowMat.uniforms.uOpacity.value = 0
      this.rippleLight.intensity = 0
    }
  }

  private updateChromosomes(delta: number): void {
    const breathe = Math.sin(this.time * 2) * 0.03

    if (this.currentPhase === 'interphase') {
      this.chromosomeGroupRed.visible = true
      this.chromosomeGroupGreen.visible = true
      this.chromosomeGroupRed.children.forEach((c) => { c.visible = true })
      this.chromosomeGroupGreen.children.forEach((c) => { c.visible = true })
      this.chromosomeGroupRed.position.y = breathe
      this.chromosomeGroupGreen.position.y = -breathe
      this.chromosomeGroupRed.rotation.z = 0.4 + Math.sin(this.time) * 0.08
      this.chromosomeGroupGreen.rotation.z = -0.3 + Math.cos(this.time * 0.8) * 0.08
      this.chromatidPairs.forEach(p => p.group.visible = false)
    }

    if (this.currentPhase === 'prophase') {
      const condenseP = this.easeInOutCubic(Math.min(this.phaseProgress * 1.5, 1))

      if (condenseP > 0.15 && this.chromatidPairs.length === 0) {
        this.ensureChromatidPairs()
      }

      if (this.chromatidPairs.length > 0) {
        this.chromatidPairs.forEach(pair => {
          pair.group.visible = true
          pair.group.position.x = this.lerp(pair.startX, pair.startX * 0.5, condenseP)
          pair.group.scale.setScalar(this.lerp(0.3, 1, condenseP))
          pair.group.rotation.z = Math.sin(this.time * 2) * 0.08
        })

        this.chromosomeGroupRed.visible = condenseP < 0.3
        this.chromosomeGroupGreen.visible = condenseP < 0.3
      }
    }

    if (this.currentPhase === 'metaphase') {
      this.ensureChromatidPairs()
      const alignP = this.easeInOutCubic(Math.min(this.phaseProgress * 1.8, 1))

      this.chromatidPairs.forEach((pair, i) => {
        pair.group.visible = true
        const baseY = Math.sin(this.time * 2 + i) * 0.06
        const targetX = (i === 0 ? -0.35 : 0.35)
        pair.group.position.x = this.lerp(pair.group.position.x, targetX, 0.08)
        pair.group.position.y = this.lerp(pair.group.position.y, baseY, 0.1)
        pair.group.position.z = this.lerp(pair.group.position.z, Math.sin(this.time * 1.5 + i * 2) * 0.05, 0.08)
        pair.group.rotation.z = Math.sin(this.time * 3 + i) * 0.1
        pair.group.scale.setScalar(1 + Math.sin(this.time * 4) * 0.04)
      })

      const plateMat = this.equatorialPlate.material as THREE.MeshBasicMaterial
      plateMat.opacity = alignP * 0.55
    } else {
      if (this.currentPhase !== 'prophase' && this.currentPhase !== 'anaphase' && this.currentPhase !== 'telophase') {
        const plateMat = this.equatorialPlate.material as THREE.MeshBasicMaterial
        plateMat.opacity *= 0.92
      }
    }

    if (this.currentPhase === 'anaphase') {
      this.ensureChromatidPairs()
      const sepP = this.easeInOutCubic(this.phaseProgress)

      const splitAmount = 0.15 + sepP * 0.1

      this.chromatidPairs.forEach((pair, i) => {
        pair.group.visible = true

        const children = pair.group.children as THREE.Mesh[]
        if (children.length >= 2) {
          children[0].position.x = -splitAmount
          children[1].position.x = splitAmount
        }

        const dir = i === 0 ? -1 : 1
        const targetX = dir * 1.6 * sepP
        pair.group.position.x = this.lerp(pair.startX + dir * 0.3, targetX, sepP)
        pair.group.position.y = Math.sin(this.time * 5 + i) * 0.04
        pair.group.rotation.z = dir * (0.3 + sepP * 0.4) + Math.sin(this.time * 8) * 0.05
      })

      this.updateTrails(delta, sepP)
    } else {
      this.trailMeshes.forEach(t => { t.visible = false })
    }

    if (this.currentPhase === 'telophase') {
      const reformP = this.easeInOutCubic(Math.min(this.phaseProgress * 1.5, 1))

      this.chromatidPairs.forEach((pair, i) => {
        pair.group.visible = reformP < 0.85
        const dir = i === 0 ? -1 : 1
        pair.group.position.x = this.lerp(pair.group.position.x, dir * 1.6, 0.05)
        pair.group.position.y = this.lerp(pair.group.position.y, 0, 0.05)
        pair.group.scale.setScalar(Math.max(0.3, 1 - reformP * 0.7))
      })
    }
  }

  private updateSpindleFibers(delta: number): void {
    if (this.currentPhase === 'prophase' || this.currentPhase === 'metaphase' ||
        this.currentPhase === 'anaphase' || this.currentPhase === 'telophase') {

      this.ensureChromatidPairs()
      let targetOpacity = 0

      if (this.currentPhase === 'prophase') {
        targetOpacity = this.easeInOutCubic(Math.min(this.phaseProgress * 2, 1)) * 0.7
      } else if (this.currentPhase === 'telophase') {
        targetOpacity = this.easeInOutCubic(Math.max(0, 1 - this.phaseProgress * 1.5)) * 0.5
      } else {
        targetOpacity = 0.7
      }

      const poles = [
        new THREE.Vector3(-1.9, 0, 0),
        new THREE.Vector3(1.9, 0, 0)
      ]

      let fiberIdx = 0
      this.chromatidPairs.forEach((pair, ci) => {
        const children = pair.group.children
        if (children.length >= 2) {
          children.forEach((child, chi) => {
            if (fiberIdx < this.spindleFibers.length) {
              const fiber = this.spindleFibers[fiberIdx]
              fiber.visible = true

              const childWorldPos = new THREE.Vector3()
              child.getWorldPosition(childWorldPos)
              this.container.worldToLocal(childWorldPos)

              const pole = poles[ci]
              const start = childWorldPos
              const end = pole

              const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
              fiber.position.copy(mid)

              const dir = new THREE.Vector3().subVectors(end, start)
              const length = dir.length()
              fiber.scale.y = length / 1

              fiber.lookAt(end)
              fiber.rotateX(Math.PI / 2)

              if (this.currentPhase === 'anaphase') {
                const shrink = 1 - this.phaseProgress * 0.4
                fiber.scale.y *= shrink
                fiber.position.copy(start).add(new THREE.Vector3().subVectors(end, start).multiplyScalar(0.5 * shrink))
                const wobble = Math.sin(this.time * 30 + fiberIdx) * 0.005
                fiber.rotation.y += wobble
                fiber.rotation.x += wobble
              }

              const fMat = fiber.material as THREE.MeshBasicMaterial
              fMat.opacity = this.lerp(fMat.opacity, targetOpacity, 0.1)
              fMat.color.setHSL(0.12, 0.9, 0.65 + Math.sin(this.time * 3 + fiberIdx) * 0.05)

              fiberIdx++
            }
          })
        }
      })

      for (let i = fiberIdx; i < this.spindleFibers.length; i++) {
        this.spindleFibers[i].visible = false
      }
    } else {
      this.spindleFibers.forEach(fiber => {
        fiber.visible = false
        const fMat = fiber.material as THREE.MeshBasicMaterial
        fMat.opacity *= 0.9
      })
    }
  }

  private updateTrails(delta: number, sepP: number): void {
    if (this.chromatidPairs.length === 0) return

    let trailIdx = 0
    this.chromatidPairs.forEach((pair, ci) => {
      const children = pair.group.children as THREE.Mesh[]
      if (children.length >= 2) {
        children.forEach((child, chi) => {
          if (trailIdx < this.trailMeshes.length) {
            const trail = this.trailMeshes[trailIdx]
            trail.visible = sepP > 0.05

            const worldPos = new THREE.Vector3()
            child.getWorldPosition(worldPos)
            this.container.worldToLocal(worldPos)

            trail.position.copy(worldPos)
            const dir = ci === 0 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(-1, 0, 0)
            trail.position.add(dir.clone().multiplyScalar(0.2))

            trail.lookAt(worldPos.clone().add(dir.clone().multiplyScalar(1)))
            trail.rotateX(Math.PI / 2)

            const tMat = trail.material as THREE.MeshBasicMaterial
            tMat.opacity = sepP * 0.45
            tMat.color.setHSL(0.55, 0.8, 0.6 + Math.sin(this.time * 4 + trailIdx) * 0.1)

            trailIdx++
          }
        })
      }
    })
  }

  private updateCellDivision(): void {
    if (this.currentPhase === 'telophase') {
      this.cellSplitProgress = this.easeInOutCubic(Math.min(this.phaseProgress * 1.3, 1))
    } else if (this.currentPhase === 'interphase') {
      this.cellSplitProgress = 0
    }
  }

  public updateFlash(flashAlpha: number): void {
    const mat = this.flashOverlay.material as THREE.MeshBasicMaterial
    mat.opacity = flashAlpha * 0.7
  }

  public setPhase(phase: PhaseType): void {
    this.currentPhase = phase
    this.phaseProgress = 0
  }

  public update(delta: number, phase: PhaseType, phaseProgress: number, particleEffect: ParticleEffect): void {
    this.time += delta
    this.phaseProgress = phaseProgress

    this.updateCellMembrane()
    this.updateNucleus(phaseProgress)
    this.updateChromosomes(delta)
    this.updateSpindleFibers(delta)
    this.updateCellDivision()
  }

  public getCellCenter(): THREE.Vector3 {
    return new THREE.Vector3(0, 0, 0)
  }

  public getNucleusRadius(): number {
    return 0.85
  }

  public getDaughterPoles(): THREE.Vector3[] {
    return [new THREE.Vector3(-1.5, 0, 0), new THREE.Vector3(1.5, 0, 0)]
  }

  private easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t
  }
}
