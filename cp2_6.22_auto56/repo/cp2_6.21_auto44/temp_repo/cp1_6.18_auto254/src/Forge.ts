import * as THREE from 'three'

export class Forge {
  public mesh: THREE.Group
  private fireParticles: THREE.Points
  private particleCount: number = 500
  private particleVelocities: Float32Array
  private particleFrequencies: Float32Array
  private particleBaseY: Float32Array
  private crackMeshes: THREE.Mesh[] = []
  private glowMaterial: THREE.MeshBasicMaterial

  constructor() {
    this.mesh = new THREE.Group()

    const forgeGeometry = new THREE.CylinderGeometry(2.5, 2.8, 4, 32, 1, false)
    const forgeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color('#3E2723') },
        bottomColor: { value: new THREE.Color('#1B0F0F') }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        varying vec2 vUv;
        void main() {
          vec3 color = mix(bottomColor, topColor, vUv.y);
          gl_FragColor = vec4(color, 1.0);
        }
      `
    })

    const forgeBody = new THREE.Mesh(forgeGeometry, forgeMaterial)
    forgeBody.position.y = 2
    this.mesh.add(forgeBody)

    const rimGeometry = new THREE.TorusGeometry(2.5, 0.2, 8, 32)
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x2c1810,
      roughness: 0.8,
      metalness: 0.2
    })
    const rim = new THREE.Mesh(rimGeometry, rimMaterial)
    rim.rotation.x = Math.PI / 2
    rim.position.y = 4
    this.mesh.add(rim)

    this.addCracks()

    this.glowMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color('#FF6F00'),
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    })

    const fireGeometry = new THREE.BufferGeometry()
    const positions = new Float32Array(this.particleCount * 3)
    const colors = new Float32Array(this.particleCount * 3)
    const sizes = new Float32Array(this.particleCount)

    this.particleVelocities = new Float32Array(this.particleCount)
    this.particleFrequencies = new Float32Array(this.particleCount)
    this.particleBaseY = new Float32Array(this.particleCount)

    const colorStart = new THREE.Color('#FF4500')
    const colorEnd = new THREE.Color('#FFD700')

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3
      const angle = Math.random() * Math.PI * 2
      const radius = Math.random() * 2
      const height = Math.random() * 1.5

      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] = 4 + height
      positions[i3 + 2] = Math.sin(angle) * radius

      const t = height / 1.5
      const color = new THREE.Color().lerpColors(colorStart, colorEnd, t)
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b

      sizes[i] = 0.05 + Math.random() * 0.1

      this.particleVelocities[i] = 0.3 + Math.random() * 0.7
      this.particleFrequencies[i] = 1 + Math.random() * 2
      this.particleBaseY[i] = 4 + height
    }

    fireGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    fireGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    fireGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const fireMaterial = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending
    })

    this.fireParticles = new THREE.Points(fireGeometry, fireMaterial)
    this.mesh.add(this.fireParticles)

    const fireLight = new THREE.PointLight(0xff6600, 2, 15)
    fireLight.position.set(0, 4.5, 0)
    this.mesh.add(fireLight)
  }

  private addCracks(): void {
    const crackCount = 12
    for (let i = 0; i < crackCount; i++) {
      const angle = (i / crackCount) * Math.PI * 2
      const height = 1 + Math.random() * 2
      const crackGeometry = new THREE.PlaneGeometry(0.05, height)
      const crackMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#FF6F00'),
        transparent: true,
        opacity: 0.6 + Math.random() * 0.2
      })
      const crack = new THREE.Mesh(crackGeometry, crackMaterial)
      crack.position.set(
        Math.cos(angle) * 2.52,
        height / 2 + 0.5,
        Math.sin(angle) * 2.52
      )
      crack.lookAt(new THREE.Vector3(0, crack.position.y, 0))
      crack.rotateZ(Math.random() * 0.3 - 0.15)
      this.mesh.add(crack)
      this.crackMeshes.push(crack)
    }
  }

  public update(time: number, deltaTime: number, temperature: number): void {
    const positions = this.fireParticles.geometry.getAttribute('position') as THREE.BufferAttribute
    const array = positions.array as Float32Array

    const intensity = (temperature - 500) / 1000

    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3
      const offset =
        Math.sin(time * this.particleFrequencies[i] + i) *
        0.2 *
        intensity
      array[i3 + 1] =
        this.particleBaseY[i] +
        offset +
        (Math.sin(time * this.particleFrequencies[i] * 0.5 + i * 0.3) * 0.1)
      this.particleBaseY[i] += this.particleVelocities[i] * deltaTime * intensity * 0.5

      if (this.particleBaseY[i] > 5.5) {
        this.particleBaseY[i] = 4
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * 2
        array[i3] = Math.cos(angle) * radius
        array[i3 + 2] = Math.sin(angle) * radius
      }
    }

    positions.needsUpdate = true

    const glowIntensity = 0.5 + Math.sin(time * 3) * 0.2 + intensity * 0.3
    this.crackMeshes.forEach((crack, index) => {
      const mat = crack.material as THREE.MeshBasicMaterial
      mat.opacity = (0.4 + Math.sin(time * 2 + index) * 0.2) * (0.5 + intensity * 0.5)
    })

    const fireMat = this.fireParticles.material as THREE.PointsMaterial
    fireMat.opacity = 0.7 + intensity * 0.3
  }

  public getOpeningPosition(): THREE.Vector3 {
    return new THREE.Vector3(0, 4.2, 0)
  }

  public getDropTargetPosition(): THREE.Vector3 {
    return new THREE.Vector3(0, 4.5, 0)
  }

  public dispose(): void {
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose()
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose())
        } else {
          child.material.dispose()
        }
      }
    })
    this.crackMeshes = []
  }
}

export class Torch {
  public mesh: THREE.Group
  private light: THREE.PointLight
  private baseIntensity: number

  constructor(position: THREE.Vector3) {
    this.mesh = new THREE.Group()
    this.baseIntensity = 0.5 + Math.random() * 0.5

    const poleGeometry = new THREE.CylinderGeometry(0.05, 0.08, 1.5, 8)
    const poleMaterial = new THREE.MeshStandardMaterial({ color: 0x3e2723 })
    const pole = new THREE.Mesh(poleGeometry, poleMaterial)
    pole.position.y = 0.75
    this.mesh.add(pole)

    const holderGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.2, 16)
    const holderMaterial = new THREE.MeshStandardMaterial({ color: 0x2c1810 })
    const holder = new THREE.Mesh(holderGeometry, holderMaterial)
    holder.position.y = 1.5
    this.mesh.add(holder)

    this.light = new THREE.PointLight(0xffaa33, this.baseIntensity, 10)
    this.light.position.y = 1.7
    this.mesh.add(this.light)

    const flameGeometry = new THREE.ConeGeometry(0.12, 0.3, 8)
    const flameMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.9
    })
    const flame = new THREE.Mesh(flameGeometry, flameMaterial)
    flame.position.y = 1.7
    this.mesh.add(flame)

    this.mesh.position.copy(position)
  }

  public update(time: number): void {
    const flicker = Math.sin(time * 8) * 0.1 + Math.sin(time * 13) * 0.05
    this.light.intensity = this.baseIntensity + flicker
  }

  public getLight(): THREE.PointLight {
    return this.light
  }
}
