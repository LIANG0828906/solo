import * as THREE from 'three'

export type Sentiment = 'positive' | 'negative' | 'neutral'

export interface SentimentResult {
  word: string
  sentiment: Sentiment
  abstraction: number
}

interface ParticleCluster {
  id: number
  word: string
  center: THREE.Vector3
  particleIndices: number[]
  baseScale: number
  targetScale: number
}

const POSITIVE_WORDS = new Set([
  '爱', '喜欢', '快乐', '开心', '幸福', '美好', '美丽', '希望', '光明', '温暖',
  '成功', '胜利', '自由', '和平', '梦想', '勇气', '希望', '善良', '真诚', '热情',
  'happy', 'love', 'joy', 'beautiful', 'wonderful', 'amazing', 'great', 'excellent',
  'good', 'nice', 'perfect', 'bright', 'warm', 'peaceful', 'hopeful', 'positive'
])

const NEGATIVE_WORDS = new Set([
  '恨', '讨厌', '悲伤', '痛苦', '难过', '绝望', '黑暗', '寒冷', '失败', '恐惧',
  '孤独', '愤怒', '嫉妒', '贪婪', '懒惰', '骄傲', '自私', '残忍', '虚伪', '冷漠',
  'sad', 'hate', 'pain', 'sorrow', 'grief', 'dark', 'cold', 'fear', 'angry', 'alone',
  'bad', 'terrible', 'awful', 'horrible', 'negative', 'hopeless', 'empty', 'lonely'
])

export class ParticleSystem {
  private scene: THREE.Scene
  private geometry: THREE.BufferGeometry | null = null
  private material: THREE.PointsMaterial | null = null
  private points: THREE.Points | null = null
  private backgroundStars: THREE.Points | null = null
  private clusters: ParticleCluster[] = []
  private particleCount: number = 0
  private maxParticles: number = 15000
  private isDiffusing: boolean = false
  private diffusionProgress: number = 0
  private diffusionDuration: number = 1.5
  private saturation: number = 1.0
  private hoveredClusterId: number | null = null
  private hoverTimer: number = 0
  private onClusterHover: ((word: string | null) => void) | null = null

  private positions: Float32Array | null = null
  private colors: Float32Array | null = null
  private sizes: Float32Array | null = null
  private startPositions: Float32Array | null = null
  private targetPositions: Float32Array | null = null
  private clusterIds: Int32Array | null = null

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.createBackgroundStars()
  }

  private createBackgroundStars(): void {
    const starCount = 200
    const positions = new Float32Array(starCount * 3)
    const colors = new Float32Array(starCount * 3)
    const sizes = new Float32Array(starCount)

    for (let i = 0; i < starCount; i++) {
      const radius = 50 + Math.random() * 50
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      const brightness = 0.3 + Math.random() * 0.3
      colors[i * 3] = brightness
      colors[i * 3 + 1] = brightness
      colors[i * 3 + 2] = brightness + Math.random() * 0.2

      sizes[i] = 0.5 + Math.random() * 1.0
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const material = new THREE.PointsMaterial({
      size: 0.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true
    })

    this.backgroundStars = new THREE.Points(geometry, material)
    this.scene.add(this.backgroundStars)
  }

  public analyzeText(text: string): SentimentResult[] {
    const results: SentimentResult[] = []
    const words = this.tokenize(text)

    for (const word of words) {
      const lowerWord = word.toLowerCase()
      let sentiment: Sentiment = 'neutral'
      
      if (POSITIVE_WORDS.has(lowerWord) || POSITIVE_WORDS.has(word)) {
        sentiment = 'positive'
      } else if (NEGATIVE_WORDS.has(lowerWord) || NEGATIVE_WORDS.has(word)) {
        sentiment = 'negative'
      }

      const abstraction = this.calculateAbstraction(word)

      results.push({
        word,
        sentiment,
        abstraction
      })
    }

    return results
  }

  private tokenize(text: string): string[] {
    const chineseRegex = /[\u4e00-\u9fa5]/g
    const englishRegex = /[a-zA-Z]+/g
    
    const chineseChars = text.match(chineseRegex) || []
    const englishWords = text.match(englishRegex) || []
    
    const words: string[] = []
    
    if (chineseChars.length > 0) {
      for (let i = 0; i < chineseChars.length; i += 2) {
        if (i + 1 < chineseChars.length) {
          words.push(chineseChars[i] + chineseChars[i + 1])
        } else {
          words.push(chineseChars[i])
        }
      }
    }
    
    words.push(...englishWords)
    
    return words.length > 0 ? words : [text]
  }

  private calculateAbstraction(word: string): number {
    const isChinese = /[\u4e00-\u9fa5]/.test(word)
    
    if (isChinese) {
      const abstractSuffixes = ['性', '化', '度', '感', '观', '念', '想', '思', '情', '意']
      for (const suffix of abstractSuffixes) {
        if (word.endsWith(suffix)) return 0.8
      }
      if (word.length <= 1) return 0.4
      return 0.5 + Math.random() * 0.3
    } else {
      const abstractSuffixes = ['ness', 'ity', 'tion', 'sion', 'ment', 'ance', 'ence', 'ship']
      for (const suffix of abstractSuffixes) {
        if (word.toLowerCase().endsWith(suffix)) return 0.8
      }
      if (word.length <= 3) return 0.4
      return 0.5 + Math.random() * 0.3
    }
  }

  public mapSentimentToColor(sentiment: Sentiment): THREE.Color {
    const color = new THREE.Color()
    
    switch (sentiment) {
      case 'positive':
        const warmProgress = Math.random()
        color.setHSL(0.03 + warmProgress * 0.08, 0.8, 0.6)
        break
      case 'negative':
        const coolProgress = Math.random()
        color.setHSL(0.55 + coolProgress * 0.1, 0.7, 0.45)
        break
      case 'neutral':
      default:
        color.setStyle('#9CA3AF')
        break
    }
    
    return color
  }

  public createParticles(sentimentData: SentimentResult[]): void {
    this.destroy()

    let totalParticles = 0
    const particlesPerWord: number[] = []
    
    for (let i = 0; i < sentimentData.length; i++) {
      const count = Math.floor(80 + Math.random() * 40)
      particlesPerWord.push(count)
      totalParticles += count
    }

    if (totalParticles > this.maxParticles) {
      const scale = this.maxParticles / totalParticles
      for (let i = 0; i < particlesPerWord.length; i++) {
        particlesPerWord[i] = Math.floor(particlesPerWord[i] * scale)
      }
      totalParticles = particlesPerWord.reduce((a, b) => a + b, 0)
    }

    this.particleCount = totalParticles

    this.positions = new Float32Array(totalParticles * 3)
    this.colors = new Float32Array(totalParticles * 3)
    this.sizes = new Float32Array(totalParticles)
    this.startPositions = new Float32Array(totalParticles * 3)
    this.targetPositions = new Float32Array(totalParticles * 3)
    this.clusterIds = new Int32Array(totalParticles)

    this.clusters = []
    let particleIndex = 0

    for (let i = 0; i < sentimentData.length; i++) {
      const data = sentimentData[i]
      const count = particlesPerWord[i]
      const color = this.mapSentimentToColor(data.sentiment)

      const cluster: ParticleCluster = {
        id: i,
        word: data.word,
        center: new THREE.Vector3(),
        particleIndices: [],
        baseScale: 1,
        targetScale: 1
      }

      const phi = Math.acos(2 * Math.random() - 1)
      const theta = Math.random() * Math.PI * 2
      const distance = 2 + data.abstraction * 6
      
      cluster.center.set(
        distance * Math.sin(phi) * Math.cos(theta),
        distance * Math.sin(phi) * Math.sin(theta),
        distance * Math.cos(phi)
      )

      const clusterRadius = 1.5 + data.abstraction * 2

      for (let j = 0; j < count; j++) {
        const idx = particleIndex + j

        this.startPositions[idx * 3] = 0
        this.startPositions[idx * 3 + 1] = 0
        this.startPositions[idx * 3 + 2] = 0

        const rPhi = Math.acos(2 * Math.random() - 1)
        const rTheta = Math.random() * Math.PI * 2
        const rDistance = Math.random() * clusterRadius

        this.targetPositions[idx * 3] = cluster.center.x + rDistance * Math.sin(rPhi) * Math.cos(rTheta)
        this.targetPositions[idx * 3 + 1] = cluster.center.y + rDistance * Math.sin(rPhi) * Math.sin(rTheta)
        this.targetPositions[idx * 3 + 2] = cluster.center.z + rDistance * Math.cos(rPhi)

        this.positions[idx * 3] = 0
        this.positions[idx * 3 + 1] = 0
        this.positions[idx * 3 + 2] = 0

        const colorVariation = 0.1
        this.colors[idx * 3] = color.r + (Math.random() - 0.5) * colorVariation
        this.colors[idx * 3 + 1] = color.g + (Math.random() - 0.5) * colorVariation
        this.colors[idx * 3 + 2] = color.b + (Math.random() - 0.5) * colorVariation

        this.sizes[idx] = 1.5 + Math.random() * 2.5

        this.clusterIds[idx] = i
        cluster.particleIndices.push(idx)
      }

      this.clusters.push(cluster)
      particleIndex += count
    }

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1))

    this.material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    this.points = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.points)

    this.isDiffusing = true
    this.diffusionProgress = 0
  }

  public update(deltaTime: number): void {
    if (this.isDiffusing && this.positions && this.targetPositions) {
      this.diffusionProgress += deltaTime / this.diffusionDuration
      
      if (this.diffusionProgress >= 1) {
        this.diffusionProgress = 1
        this.isDiffusing = false
      }

      const progress = this.easeOutCubic(this.diffusionProgress)
      const startPositions = this.startPositions!
      const targetPositions = this.targetPositions!
      const positions = this.positions!

      for (let i = 0; i < this.particleCount; i++) {
        const clusterId = this.clusterIds![i]
        const cluster = this.clusters[clusterId]
        const scale = cluster ? cluster.baseScale + (cluster.targetScale - cluster.baseScale) * 0.1 : 1
        
        if (cluster) {
          cluster.baseScale = scale
        }

        const startX = startPositions[i * 3]
        const startY = startPositions[i * 3 + 1]
        const startZ = startPositions[i * 3 + 2]

        const targetX = cluster ? cluster.center.x + (targetPositions[i * 3] - cluster.center.x) * scale : targetPositions[i * 3]
        const targetY = cluster ? cluster.center.y + (targetPositions[i * 3 + 1] - cluster.center.y) * scale : targetPositions[i * 3 + 1]
        const targetZ = cluster ? cluster.center.z + (targetPositions[i * 3 + 2] - cluster.center.z) * scale : targetPositions[i * 3 + 2]

        positions[i * 3] = startX + (targetX - startX) * progress
        positions[i * 3 + 1] = startY + (targetY - startY) * progress
        positions[i * 3 + 2] = startZ + (targetZ - startZ) * progress
      }

      if (this.geometry) {
        this.geometry.attributes.position.needsUpdate = true
      }
    } else if (!this.isDiffusing) {
      for (const cluster of this.clusters) {
        if (Math.abs(cluster.targetScale - cluster.baseScale) > 0.001) {
          cluster.baseScale += (cluster.targetScale - cluster.baseScale) * 0.05
          
          if (this.positions && this.targetPositions) {
            for (const idx of cluster.particleIndices) {
              const targetX = cluster.center.x + (this.targetPositions[idx * 3] - cluster.center.x) * cluster.baseScale
              const targetY = cluster.center.y + (this.targetPositions[idx * 3 + 1] - cluster.center.y) * cluster.baseScale
              const targetZ = cluster.center.z + (this.targetPositions[idx * 3 + 2] - cluster.center.z) * cluster.baseScale

              this.positions[idx * 3] = targetX
              this.positions[idx * 3 + 1] = targetY
              this.positions[idx * 3 + 2] = targetZ
            }
          }
          
          if (this.geometry) {
            this.geometry.attributes.position.needsUpdate = true
          }
        }
      }
    }

    if (this.material) {
      this.material.opacity = 0.9
    }
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3)
  }

  public getClusterAtPosition(worldPos: THREE.Vector3, camera: THREE.Camera): { word: string; screenPos: THREE.Vector2 } | null {
    let closestCluster: ParticleCluster | null = null
    let closestDistance = Infinity

    const raycaster = new THREE.Raycaster()
    const mouse = new THREE.Vector2(
      (worldPos.x / window.innerWidth) * 2 - 1,
      -(worldPos.y / window.innerHeight) * 2 + 1
    )

    raycaster.setFromCamera(mouse, camera)

    for (const cluster of this.clusters) {
      const direction = cluster.center.clone().sub(camera.position).normalize()
      const distance = cluster.center.distanceTo(camera.position)
      
      const rayDir = raycaster.ray.direction
      const dot = direction.dot(rayDir)
      
      if (dot > 0.95) {
        const projectedPoint = camera.position.clone().add(rayDir.multiplyScalar(distance))
        const dist = projectedPoint.distanceTo(cluster.center)
        
        if (dist < 3 && dist < closestDistance) {
          closestDistance = dist
          closestCluster = cluster
        }
      }
    }

    if (closestCluster) {
      const screenPos = closestCluster.center.clone().project(camera)
      return {
        word: closestCluster.word,
        screenPos: new THREE.Vector2(
          (screenPos.x + 1) / 2 * window.innerWidth,
          (-screenPos.y + 1) / 2 * window.innerHeight
        )
      }
    }

    return null
  }

  public handleHover(worldPos: THREE.Vector3, camera: THREE.Camera, deltaTime: number): void {
    const result = this.getClusterAtPosition(worldPos, camera)

    if (result) {
      const cluster = this.clusters.find(c => c.word === result.word)
      if (cluster) {
        if (this.hoveredClusterId !== cluster.id) {
          this.hoveredClusterId = cluster.id
          this.hoverTimer = 0
        }
        
        this.hoverTimer += deltaTime
        
        if (this.hoverTimer >= 1) {
          cluster.targetScale = 1.2
          if (this.onClusterHover) {
            this.onClusterHover(result.word)
          }
        }
      }
    } else {
      if (this.hoveredClusterId !== null) {
        const prevCluster = this.clusters.find(c => c.id === this.hoveredClusterId)
        if (prevCluster) {
          prevCluster.targetScale = 1
        }
        this.hoveredClusterId = null
        this.hoverTimer = 0
        
        if (this.onClusterHover) {
          this.onClusterHover(null)
        }
      }
    }
  }

  public setOnClusterHover(callback: (word: string | null) => void): void {
    this.onClusterHover = callback
  }

  public setDiffusionSpeed(speed: number): void {
    this.diffusionDuration = speed
  }

  public setSaturation(value: number): void {
    this.saturation = value / 100
    
    if (this.colors && this.geometry) {
      const colorAttr = this.geometry.attributes.color as THREE.BufferAttribute
      for (let i = 0; i < this.particleCount; i++) {
        const r = this.colors[i * 3]
        const g = this.colors[i * 3 + 1]
        const b = this.colors[i * 3 + 2]
        
        const color = new THREE.Color(r, g, b)
        const hsl = { h: 0, s: 0, l: 0 }
        color.getHSL(hsl)
        
        hsl.s = Math.min(1, Math.max(0, hsl.s * this.saturation))
        color.setHSL(hsl.h, hsl.s, hsl.l)
        
        colorAttr.setXYZ(i, color.r, color.g, color.b)
      }
      colorAttr.needsUpdate = true
    }
  }

  public setBackgroundDepth(value: number): void {
    if (this.backgroundStars) {
      const positions = this.backgroundStars.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < positions.length / 3; i++) {
        const scale = 1 + (value - 10) * 0.02
        positions[i * 3] *= scale
        positions[i * 3 + 1] *= scale
        positions[i * 3 + 2] *= scale
      }
      this.backgroundStars.geometry.attributes.position.needsUpdate = true
    }
  }

  public isAnimating(): boolean {
    return this.isDiffusing
  }

  public destroy(): void {
    if (this.points) {
      this.scene.remove(this.points)
      this.geometry?.dispose()
      this.material?.dispose()
      this.points = null
      this.geometry = null
      this.material = null
    }
    
    this.clusters = []
    this.particleCount = 0
    this.positions = null
    this.colors = null
    this.sizes = null
    this.startPositions = null
    this.targetPositions = null
    this.clusterIds = null
  }

  public getPoints(): THREE.Points | null {
    return this.points
  }
}
