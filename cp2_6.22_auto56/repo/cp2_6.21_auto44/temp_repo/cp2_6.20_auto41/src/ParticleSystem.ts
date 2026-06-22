import * as THREE from 'three'
import { v4 as uuidv4 } from 'uuid'
import {
  AudioAnalysisResult,
  ControlParams,
  ParticleData,
  PRESET_CONFIGS,
  VisualizationMode,
  VisualizerPreset,
} from '@/types'
import { perlinNoise3D, clamp, lerp, ValueAnimator, easeInOutQuart } from '@/utils/animation'
import { hexToRgb, lerpColor } from '@/utils/colors'

// 粒子数据扩展接口，添加生命周期属性
interface ParticleDataExt extends ParticleData {
  lifespan: number
  birthTime: number
}

// 星云预设颜色常量（蓝紫渐变）
const NEBULA_LOW_COLOR = hexToRgb('#4169e1')
const NEBULA_MID_COLOR = hexToRgb('#6a5acd')
const NEBULA_HIGH_COLOR = hexToRgb('#9400d3')

// 脉冲预设颜色常量（红橙渐变）
const PULSE_LOW_COLOR = hexToRgb('#ff4500')
const PULSE_MID_COLOR = hexToRgb('#ff6347')
const PULSE_HIGH_COLOR = hexToRgb('#ffa500')

// 螺旋预设颜色常量（绿青渐变）
const SPIRAL_LOW_COLOR = hexToRgb('#00ff7f')
const SPIRAL_MID_COLOR = hexToRgb('#00fa9a')
const SPIRAL_HIGH_COLOR = hexToRgb('#00ced1')

// 情感映射颜色：舒缓（蓝紫）vs 激烈（红橙）
const CALM_LOW_COLOR = hexToRgb('#1e3a8a')    // 深蓝
const CALM_MID_COLOR = hexToRgb('#6366f1')    // 靛蓝
const CALM_HIGH_COLOR = hexToRgb('#a855f7')   // 紫色

const INTENSE_LOW_COLOR = hexToRgb('#dc2626')  // 纯红
const INTENSE_MID_COLOR = hexToRgb('#f97316')  // 橙色
const INTENSE_HIGH_COLOR = hexToRgb('#fbbf24') // 金黄

// 粒子最大生命周期（秒）
const MAX_PARTICLE_LIFESPAN = 30

export class ParticleSystem {
  // 粒子数组
  private particles: ParticleDataExt[] = []
  // Three.js 几何、材质和点对象
  private geometry: THREE.BufferGeometry | null = null
  private material: THREE.PointsMaterial | null = null
  private points: THREE.Points | null = null
  // 粒子数量限制
  private maxParticles: number = 8000
  private currentCount: number = 5000
  // 缓冲区数组
  private positions: Float32Array | null = null
  private colors: Float32Array | null = null
  private sizes: Float32Array | null = null
  // 预设动画状态
  private targetPreset: VisualizerPreset = 'nebula'
  private currentPreset: VisualizerPreset = 'nebula'
  private presetAnimator: ValueAnimator
  // 可视化模式状态
  private targetVisualizationMode: VisualizationMode = '3d'
  private currentVisualizationMode: VisualizationMode = '3d'
  private modeAnimator: ValueAnimator
  // 全局时间计数器
  private time: number = 0
  // 节拍脉冲值
  private beatPulse: number = 0
  // 临时向量和颜色对象
  private tempVector: THREE.Vector3 = new THREE.Vector3()
  private tempColor: { r: number; g: number; b: number } = { r: 0, g: 0, b: 0 }
  // 音频播放状态标记
  private isAudioPlaying: boolean = false

  // ========== 情感映射状态 ==========
  // 当前平滑后的情感评分 (-1 ~ +1)
  private smoothedEmotionScore: number = 0
  // 低频主导→高频主导的分布形态系数 (0=云团状聚集, 1=放射状散开)
  private shapeFactor: number = 0.5
  // 情感驱动的速度倍率
  private emotionSpeedFactor: number = 1.0
  // 平滑过渡用的上一次能量分布
  private lastEnergy: {
    bandLowRatio: number
    bandHighRatio: number
    rhythmDensity: number
    instantEnergy: number
  } = {
    bandLowRatio: 0.33,
    bandHighRatio: 0.33,
    rhythmDensity: 0,
    instantEnergy: 0,
  }

  constructor() {
    // 初始化预设过渡动画器（2秒）
    this.presetAnimator = new ValueAnimator(1, 2000, easeInOutQuart)
    // 初始化模式过渡动画器（1.5秒）
    this.modeAnimator = new ValueAnimator(1, 1500, easeInOutQuart)
  }

  /**
   * 初始化粒子系统
   * @param count 粒子数量
   */
  init(count: number): void {
    // 限制粒子数量在有效范围内
    this.currentCount = clamp(count, 1000, this.maxParticles)
    // 创建所有粒子
    this.createParticles(this.currentCount)
    // 创建几何对象
    this.createGeometry()
    // 创建材质对象
    this.createMaterial()
    // 创建 Three.js Points 对象
    this.points = new THREE.Points(this.geometry!, this.material!)
    // 禁用视锥剔除（粒子始终可见）
    this.points.frustumCulled = false
    // 重置全局时间
    this.time = 0
  }

  /**
   * 批量创建粒子
   * @param count 粒子数量
   */
  private createParticles(count: number): void {
    // 清空现有粒子数组
    this.particles = []

    // 逐个创建粒子
    for (let i = 0; i < count; i++) {
      const particle = this.createSingleParticle(i, count)
      this.particles.push(particle)
    }
  }

  /**
   * 创建单个粒子
   * @param index 粒子索引
   * @param total 总粒子数
   * @returns 粒子数据对象
   */
  private createSingleParticle(index: number, total: number): ParticleDataExt {
    // 生成唯一标识
    const id = uuidv4()
    // 根据索引分配频率索引（0-255均匀分布）
    const frequencyIndex = Math.floor((index / total) * 256)
    // 获取当前预设配置
    const preset = PRESET_CONFIGS[this.currentPreset]
    // 计算半径（在预设半径范围内随机分布）
    const radius = preset.distribution.radius * (0.3 + Math.random() * 0.7)

    // 声明位置变量
    let x: number, y: number, z: number

    // 根据预设分布类型计算初始位置
    switch (preset.distribution.type) {
      case 'cube': {
        // 立方体分布：在立方体内随机
        x = (Math.random() - 0.5) * radius * 2
        y = (Math.random() - 0.5) * radius * 2
        z = (Math.random() - 0.5) * radius * 2
        break
      }
      case 'disc': {
        // 圆盘分布：在XY平面圆盘内，Z轴范围较小
        const angle = Math.random() * Math.PI * 2
        const discRadius = Math.sqrt(Math.random()) * radius
        x = Math.cos(angle) * discRadius
        y = (Math.random() - 0.5) * radius * 0.3
        z = Math.sin(angle) * discRadius
        break
      }
      case 'sphere':
      default: {
        // 球体分布：使用球面坐标系
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(2 * Math.random() - 1)
        x = radius * Math.sin(phi) * Math.cos(theta)
        y = radius * Math.sin(phi) * Math.sin(theta)
        z = radius * Math.cos(phi)
        break
      }
    }

    // 随机初始大小（1-6像素）
    const baseSize = 1 + Math.random() * 5

    // 随机初始颜色
    const initialColor = {
      r: Math.random(),
      g: Math.random(),
      b: Math.random(),
    }

    // 组装并返回粒子数据
    return {
      id,
      position: { x, y, z },
      basePosition: { x, y, z },
      velocity: {
        x: (Math.random() - 0.5) * 0.01,
        y: (Math.random() - 0.5) * 0.01,
        z: (Math.random() - 0.5) * 0.01,
      },
      color: initialColor,
      size: baseSize,
      baseSize,
      frequencyIndex,
      angle: Math.random() * Math.PI * 2,
      radius,
      phase: Math.random() * Math.PI * 2,
      // 初始化生命周期属性
      lifespan: 0,
      birthTime: this.time,
    }
  }

  /**
   * 创建 Three.js 几何对象并配置缓冲区
   */
  private createGeometry(): void {
    this.geometry = new THREE.BufferGeometry()

    // 按最大粒子数预分配缓冲区
    const vertexCount = this.maxParticles
    this.positions = new Float32Array(vertexCount * 3)
    this.colors = new Float32Array(vertexCount * 3)
    this.sizes = new Float32Array(vertexCount)

    // 绑定缓冲区属性
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1))

    // 初始化缓冲区数据
    this.updateGeometryBuffers()
  }

  /**
   * 创建 Three.js 点材质
   */
  private createMaterial(): void {
    this.material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true,
    })
  }

  /**
   * 更新几何缓冲区数据
   */
  private updateGeometryBuffers(): void {
    if (!this.positions || !this.colors || !this.sizes) return

    // 将粒子属性同步到 GPU 缓冲区
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i]
      const i3 = i * 3

      // 位置坐标
      this.positions[i3] = particle.position.x
      this.positions[i3 + 1] = particle.position.y
      this.positions[i3 + 2] = particle.position.z

      // 颜色值
      this.colors[i3] = particle.color.r
      this.colors[i3 + 1] = particle.color.g
      this.colors[i3 + 2] = particle.color.b

      // 大小值
      this.sizes[i] = particle.size
    }

    // 标记缓冲区需要更新
    if (this.geometry) {
      this.geometry.attributes.position.needsUpdate = true
      this.geometry.attributes.color.needsUpdate = true
      this.geometry.attributes.size.needsUpdate = true
      // 设置实际绘制的粒子范围
      this.geometry.setDrawRange(0, this.currentCount)
    }
  }

  /**
   * 每帧更新粒子系统
   * @param frequencyData 频率数据
   * @param waveformData 波形数据
   * @param audioData 音频分析结果
   * @param deltaTime 帧间隔时间（秒）
   * @param controlParams 控制参数
   */
  update(
    frequencyData: Uint8Array,
    waveformData: Uint8Array,
    audioData: AudioAnalysisResult,
    deltaTime: number,
    controlParams: ControlParams
  ): void {
    // 累加全局时间（受速度参数影响）
    this.time += deltaTime * controlParams.speed

    // 更新音频播放状态
    this.isAudioPlaying = audioData.averageVolume > 0.001

    // 更新节拍脉冲衰减
    if (audioData.isBeat) {
      this.beatPulse = 1
    } else {
      this.beatPulse = lerp(this.beatPulse, 0, deltaTime * 5)
    }

    // 更新预设过渡动画
    const presetTransition = this.presetAnimator.update(deltaTime)
    // 更新模式过渡动画
    const modeTransition = this.modeAnimator.update(deltaTime)

    // 预设过渡完成后切换当前预设
    if (presetTransition >= 1 && this.currentPreset !== this.targetPreset) {
      this.currentPreset = this.targetPreset
    }

    // 模式过渡完成后切换当前模式
    if (modeTransition >= 1 && this.currentVisualizationMode !== this.targetVisualizationMode) {
      this.currentVisualizationMode = this.targetVisualizationMode
    }

    // 计算频率分段平均值
    const lowBandAvg = this.calculateLowBandAverage(frequencyData)
    const highBandAvg = this.calculateHighBandAverage(frequencyData)

    // 获取当前和目标预设配置
    const currentConfig = PRESET_CONFIGS[this.currentPreset]
    const targetConfig = PRESET_CONFIGS[this.targetPreset]

    // ========== 情感映射：根据音频特征动态调整 ==========
    const energy = audioData.energyDistribution
    if (energy) {
      // 平滑过渡各能量特征（时间常数~200ms，60fps下alpha≈0.1）
      const smoothAlpha = Math.min(1, deltaTime * 5)
      this.lastEnergy.bandLowRatio = lerp(this.lastEnergy.bandLowRatio, energy.bandLowRatio, smoothAlpha)
      this.lastEnergy.bandHighRatio = lerp(this.lastEnergy.bandHighRatio, energy.bandHighRatio, smoothAlpha)
      this.lastEnergy.rhythmDensity = lerp(this.lastEnergy.rhythmDensity, energy.rhythmDensity, smoothAlpha)
      this.lastEnergy.instantEnergy = lerp(this.lastEnergy.instantEnergy, energy.instantEnergy, smoothAlpha)

      // 平滑情感评分：-1(舒缓) ~ +1(激烈)，归一化到0~1
      this.smoothedEmotionScore = lerp(this.smoothedEmotionScore, energy.emotionScore, smoothAlpha)
      const emotionT = (this.smoothedEmotionScore + 1) * 0.5 // 映射到0~1

      // 分布形态系数：
      //  0 = 云团状（聚集，球形紧凑分布，粒子向内收缩，半径缩小30%）
      //  1 = 放射状（尖锐发散，粒子向外扩散，半径扩大40%，带有径向速度）
      // 使用低频占比和高频占比的差值驱动
      const targetShapeFactor = clamp(
        0.5 + (this.lastEnergy.bandHighRatio - this.lastEnergy.bandLowRatio) * 1.5,
        0,
        1
      )
      this.shapeFactor = lerp(this.shapeFactor, targetShapeFactor, smoothAlpha)

      // 情感速度因子：舒缓慢(0.6x)，激烈快(1.8x)
      const targetSpeedFactor = 0.6 + emotionT * 1.2 + this.lastEnergy.rhythmDensity * 0.1
      this.emotionSpeedFactor = lerp(this.emotionSpeedFactor, targetSpeedFactor, smoothAlpha)
    }

    // 遍历更新所有粒子
    for (let i = 0; i < this.currentCount; i++) {
      const particle = this.particles[i]
      if (!particle) continue

      // 检查是否需要回收粒子
      this.checkAndRecycleParticle(particle, i, this.currentCount)

      // 更新粒子生命周期
      particle.lifespan += deltaTime

      // 更新粒子运动
      this.updateParticleMotion(
        particle,
        i,
        this.currentCount,
        frequencyData,
        waveformData,
        audioData,
        deltaTime,
        controlParams,
        currentConfig,
        targetConfig,
        presetTransition,
        lowBandAvg,
        highBandAvg,
        this.shapeFactor,
        this.emotionSpeedFactor
      )

      // 更新粒子颜色
      this.updateParticleColor(
        particle,
        i,
        frequencyData,
        controlParams,
        presetTransition,
        this.smoothedEmotionScore
      )

      // 更新粒子大小
      this.updateParticleSize(particle, frequencyData, audioData, controlParams, this.lastEnergy.instantEnergy)

      // 应用可视化模式变换
      this.applyVisualizationMode(particle, modeTransition, i, this.currentCount, frequencyData)
    }

    // 同步缓冲区到 GPU
    this.updateGeometryBuffers()

    // 更新材质透明度
    if (this.material) {
      this.material.opacity = controlParams.opacity
    }
  }

  /**
   * 计算低频段平均值（前1/3频率数据）
   * @param frequencyData 频率数据
   * @returns 低频段归一化平均值
   */
  private calculateLowBandAverage(frequencyData: Uint8Array): number {
    const lowEnd = Math.floor(256 / 3)
    let sum = 0
    for (let i = 0; i < lowEnd; i++) {
      sum += frequencyData[i]
    }
    return sum / lowEnd / 255
  }

  /**
   * 计算高频段平均值（后1/3频率数据）
   * @param frequencyData 频率数据
   * @returns 高频段归一化平均值
   */
  private calculateHighBandAverage(frequencyData: Uint8Array): number {
    const highStart = Math.floor((2 * 256) / 3)
    let sum = 0
    for (let i = highStart; i < 256; i++) {
      sum += frequencyData[i]
    }
    return sum / (256 - highStart) / 255
  }

  /**
   * 检查并回收粒子（超过生命周期或音频停止时）
   * @param particle 粒子数据
   * @param index 粒子索引
   * @param total 总粒子数
   */
  private checkAndRecycleParticle(particle: ParticleDataExt, index: number, total: number): void {
    // 超过最大生命周期或音频未播放时回收
    if (particle.lifespan > MAX_PARTICLE_LIFESPAN || !this.isAudioPlaying) {
      // 重新生成基础位置
      const newBase = this.createSingleParticle(index, total)
      particle.basePosition.x = newBase.basePosition.x
      particle.basePosition.y = newBase.basePosition.y
      particle.basePosition.z = newBase.basePosition.z
      particle.position.x = newBase.position.x
      particle.position.y = newBase.position.y
      particle.position.z = newBase.position.z
      particle.radius = newBase.radius
      // 重置生命周期
      particle.lifespan = 0
      particle.birthTime = this.time
    }
  }

  /**
   * 更新单个粒子的运动
   */
  private updateParticleMotion(
    particle: ParticleDataExt,
    _index: number,
    _total: number,
    frequencyData: Uint8Array,
    _waveformData: Uint8Array,
    audioData: AudioAnalysisResult,
    deltaTime: number,
    controlParams: ControlParams,
    currentConfig: typeof PRESET_CONFIGS[VisualizerPreset],
    targetConfig: typeof PRESET_CONFIGS[VisualizerPreset],
    transition: number,
    lowBandAvg: number,
    highBandAvg: number,
    shapeFactor: number,
    emotionSpeedFactor: number
  ): void {
    // 当前频率值（归一化）
    const freqValue = frequencyData[particle.frequencyIndex] / 255
    // 速度系数（帧率归一化）
    const speed = controlParams.speed * deltaTime * 60 * emotionSpeedFactor

    // 插值计算当前振幅
    const amplitude = lerp(currentConfig.motion.amplitude, targetConfig.motion.amplitude, transition)
    // 插值计算当前速度倍率
    const speedMult = lerp(currentConfig.motion.speedMultiplier, targetConfig.motion.speedMultiplier, transition)

    const currentMotion = currentConfig.motion.type
    const targetMotion = targetConfig.motion.type

    const basePos = particle.basePosition
    const pos = particle.position

    // 节拍引起的径向偏移
    const beatOffset = this.beatPulse * amplitude * 0.3

    // 根据频率段确定特殊运动
    const lowThreshold = Math.floor(256 / 3)
    const highThreshold = Math.floor((2 * 256) / 3)
    const isLowBand = particle.frequencyIndex < lowThreshold
    const isHighBand = particle.frequencyIndex > highThreshold

    // 预设过渡时使用混合运动
    if (transition < 1 && currentMotion !== targetMotion) {
      const currentDisp = this.calculateMotionDisplacement(
        currentMotion,
        particle,
        freqValue,
        audioData,
        amplitude,
        speedMult,
        speed,
        lowBandAvg,
        highBandAvg
      )
      const targetDisp = this.calculateMotionDisplacement(
        targetMotion,
        particle,
        freqValue,
        audioData,
        amplitude,
        speedMult,
        speed,
        lowBandAvg,
        highBandAvg
      )

      pos.x = basePos.x + lerp(currentDisp.x, targetDisp.x, transition) + beatOffset * (basePos.x / particle.radius)
      pos.y = basePos.y + lerp(currentDisp.y, targetDisp.y, transition) + beatOffset * (basePos.y / particle.radius)
      pos.z = basePos.z + lerp(currentDisp.z, targetDisp.z, transition) + beatOffset * (basePos.z / particle.radius)
    } else {
      const disp = this.calculateMotionDisplacement(
        this.currentPreset === this.targetPreset ? currentMotion : targetMotion,
        particle,
        freqValue,
        audioData,
        amplitude,
        speedMult,
        speed,
        lowBandAvg,
        highBandAvg
      )

      pos.x = basePos.x + disp.x + beatOffset * (basePos.x / particle.radius)
      pos.y = basePos.y + disp.y + beatOffset * (basePos.y / particle.radius)
      pos.z = basePos.z + disp.z + beatOffset * (basePos.z / particle.radius)
    }

    // 应用频率分段特殊运动
    if (isLowBand) {
      // 低频粒子：沿Y轴根据低频平均值移动
      pos.y += lowBandAvg * amplitude * 0.8 * speed * 0.05
    } else if (isHighBand) {
      // 高频粒子：沿X轴旋转/扩散
      const diffuseAmount = highBandAvg * amplitude * 0.6 * speed * 0.03
      pos.x += (Math.sin(this.time * 3 + particle.phase) * diffuseAmount)
    }

    // 应用基础速度
    pos.x += particle.velocity.x * speed
    pos.y += particle.velocity.y * speed
    pos.z += particle.velocity.z * speed

    // 更新粒子角度
    particle.angle += 0.01 * speedMult * speed

    // === 情感映射：分布形态调整 ===
    // shapeFactor: 0→云团聚集（缩小半径，柔和流动），1→放射散开（扩大半径，尖锐爆发）
    const radialT = shapeFactor
    const contractionAmount = 1 - radialT * 0.3  // 聚集时收缩到70%
    const expansionAmount = 1 + radialT * 0.4   // 发散时扩张到140%
    const shapeScale = contractionAmount * (1 - radialT) + expansionAmount * radialT

    // 对位置做径向缩放（以原点为中心）
    pos.x *= shapeScale
    pos.y *= shapeScale
    pos.z *= shapeScale

    // 放射模式：高频粒子添加额外的向外径向速度（尖锐感）
    if (radialT > 0.5 && isHighBand) {
      const radialSpeed = (radialT - 0.5) * 2 * amplitude * 0.03 * speed
      const dist = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z) || 1
      pos.x += (pos.x / dist) * radialSpeed
      pos.y += (pos.y / dist) * radialSpeed * 0.5
      pos.z += (pos.z / dist) * radialSpeed
    }
  }

  /**
   * 计算不同运动类型的位移
   */
  private calculateMotionDisplacement(
    motionType: 'flow' | 'expand' | 'rotate',
    particle: ParticleDataExt,
    freqValue: number,
    audioData: AudioAnalysisResult,
    amplitude: number,
    speedMult: number,
    speed: number,
    _lowBandAvg: number,
    highBandAvg: number
  ): { x: number; y: number; z: number } {
    const time = this.time * speedMult

    switch (motionType) {
      case 'flow': {
        // 星云流动：使用柏林噪声计算偏移
        const noiseX = perlinNoise3D(
          particle.basePosition.x * 0.1,
          particle.basePosition.y * 0.1,
          this.time * 0.2
        )
        const noiseY = perlinNoise3D(
          particle.basePosition.y * 0.1,
          particle.basePosition.z * 0.1,
          this.time * 0.2 + 100
        )
        const noiseZ = perlinNoise3D(
          particle.basePosition.z * 0.1,
          particle.basePosition.x * 0.1,
          this.time * 0.2 + 200
        )

        return {
          x: noiseX * amplitude * 2 + Math.sin(time * 0.5 + particle.phase) * amplitude * freqValue * 0.5,
          y: noiseY * amplitude * 2 + Math.cos(time * 0.3 + particle.phase * 1.3) * amplitude * freqValue * 0.4,
          z: noiseZ * amplitude * 2 + Math.sin(time * 0.7 + particle.phase * 0.7) * amplitude * freqValue * 0.3,
        }
      }

      case 'expand': {
        // 脉冲膨胀：按音频振幅整体缩放半径（*2.5）
        const scaleFactor = 1 + audioData.averageVolume * 2.5
        const expandAmount = (audioData.lowFrequency * 0.7 + audioData.averageVolume * 0.3) * amplitude * scaleFactor
        const nx = particle.basePosition.x / particle.radius
        const ny = particle.basePosition.y / particle.radius
        const nz = particle.basePosition.z / particle.radius
        return {
          x: nx * expandAmount,
          y: ny * expandAmount,
          z: nz * expandAmount,
        }
      }

      case 'rotate': {
        // 螺旋旋转：基于频率分布的绕Y轴旋转
        const rotationAngle = (particle.frequencyIndex / 256) * Math.PI * 4 + this.time

        // 半径脉动变化
        const radiusVariation = particle.radius + Math.sin(this.time + particle.frequencyIndex * 0.1) * highBandAvg * 2
        const rotationSpeed = 0.5 + audioData.highFrequency * 2
        const radius = radiusVariation + freqValue * amplitude * 0.5
        const angle = particle.angle + time * rotationSpeed * speed * 0.1 + rotationAngle * 0.1
        const heightOffset = Math.sin(time * 2 + particle.phase) * amplitude * 0.3 * freqValue

        // 计算螺旋位置偏移（相对于基础位置）
        const spiralX = Math.cos(angle) * radius
        const spiralZ = Math.sin(angle) * radius

        return {
          x: spiralX - particle.basePosition.x,
          y: heightOffset,
          z: spiralZ - particle.basePosition.z,
        }
      }

      default:
        return { x: 0, y: 0, z: 0 }
    }
  }

  /**
   * 更新单个粒子的颜色
   */
  private updateParticleColor(
    particle: ParticleDataExt,
    index: number,
    frequencyData: Uint8Array,
    controlParams: ControlParams,
    transition: number,
    emotionScore: number
  ): void {
    const freqValue = frequencyData[particle.frequencyIndex]
    const normalizedFreq = freqValue / 255
    const frequencyIndex = particle.frequencyIndex

    // 根据当前预设计算颜色
    const currentColor = this.calculatePresetColor(this.currentPreset, particle.frequencyIndex)
    const targetColor = this.calculatePresetColor(this.targetPreset, particle.frequencyIndex)

    // 预设过渡时颜色插值
    this.tempColor.r = lerp(currentColor.r, targetColor.r, transition)
    this.tempColor.g = lerp(currentColor.g, targetColor.g, transition)
    this.tempColor.b = lerp(currentColor.b, targetColor.b, transition)

    // === 情感映射：颜色混合 ===
    // emotionScore -1→舒缓(蓝紫)，+1→激烈(红橙)
    const t = (emotionScore + 1) * 0.5 // 映射到0~1

    // 基于频率索引在情感颜色渐变中取色
    const freqT = frequencyIndex / 256
    let calmColor, intenseColor
    if (freqT < 0.33) {
      calmColor = CALM_LOW_COLOR
      intenseColor = INTENSE_LOW_COLOR
    } else if (freqT < 0.66) {
      calmColor = CALM_MID_COLOR
      intenseColor = INTENSE_MID_COLOR
    } else {
      calmColor = CALM_HIGH_COLOR
      intenseColor = INTENSE_HIGH_COLOR
    }
    const emotionalColor = lerpColor(calmColor, intenseColor, t)

    // 预设颜色与情感颜色按情感强度混合
    // 情感强度越大，情感颜色占比越高（最多60%）
    const emotionBlend = Math.abs(emotionScore) * 0.6
    this.tempColor.r = lerp(this.tempColor.r, emotionalColor.r, emotionBlend)
    this.tempColor.g = lerp(this.tempColor.g, emotionalColor.g, emotionBlend)
    this.tempColor.b = lerp(this.tempColor.b, emotionalColor.b, emotionBlend)

    // 应用颜色强度
    const intensity = 0.6 + normalizedFreq * 0.4 * controlParams.colorSensitivity
    particle.color.r = clamp(this.tempColor.r * intensity, 0, 1)
    particle.color.g = clamp(this.tempColor.g * intensity, 0, 1)
    particle.color.b = clamp(this.tempColor.b * intensity, 0, 1)

    // 节拍时增强部分粒子亮度
    if (this.beatPulse > 0.1 && index % 3 === 0) {
      particle.color.r = Math.min(1, particle.color.r + this.beatPulse * 0.3)
      particle.color.g = Math.min(1, particle.color.g + this.beatPulse * 0.2)
      particle.color.b = Math.min(1, particle.color.b + this.beatPulse * 0.3)
    }
  }

  /**
   * 根据预设计算颜色
   * @param preset 预设类型
   * @param frequencyIndex 频率索引
   * @param normalizedFreq 归一化频率值
   * @returns RGB颜色对象
   */
  private calculatePresetColor(
    preset: VisualizerPreset,
    frequencyIndex: number
  ): { r: number; g: number; b: number } {
    const t = frequencyIndex / 256

    switch (preset) {
      case 'nebula': {
        // 星云：蓝紫渐变（low=#4169e1, mid=#6a5acd, high=#9400d3）
        if (t < 0.5) {
          return lerpColor(NEBULA_LOW_COLOR, NEBULA_MID_COLOR, t / 0.5)
        } else {
          return lerpColor(NEBULA_MID_COLOR, NEBULA_HIGH_COLOR, (t - 0.5) / 0.5)
        }
      }
      case 'pulse': {
        // 脉冲：红橙渐变（low=#ff4500, mid=#ff6347, high=#ffa500）
        if (t < 0.5) {
          return lerpColor(PULSE_LOW_COLOR, PULSE_MID_COLOR, t / 0.5)
        } else {
          return lerpColor(PULSE_MID_COLOR, PULSE_HIGH_COLOR, (t - 0.5) / 0.5)
        }
      }
      case 'spiral': {
        // 螺旋：绿青渐变（low=#00ff7f, mid=#00fa9a, high=#00ced1）
        if (t < 0.5) {
          return lerpColor(SPIRAL_LOW_COLOR, SPIRAL_MID_COLOR, t / 0.5)
        } else {
          return lerpColor(SPIRAL_MID_COLOR, SPIRAL_HIGH_COLOR, (t - 0.5) / 0.5)
        }
      }
      default:
        return { r: 1, g: 1, b: 1 }
    }
  }

  /**
   * 更新单个粒子的大小
   */
  private updateParticleSize(
    particle: ParticleDataExt,
    frequencyData: Uint8Array,
    audioData: AudioAnalysisResult,
    controlParams: ControlParams,
    instantEnergy: number
  ): void {
    const freqValue = frequencyData[particle.frequencyIndex] / 255
    const beatBoost = this.beatPulse * 1.5

    // === 情感映射：粒子呼吸缩放 ===
    // 基于瞬时能量值产生细腻的"呼吸"效果：
    // 使用正弦波叠加能量，让粒子随音乐起伏
    const breathingPhase = this.time * 2 + particle.phase
    const breathingWave = 0.5 + 0.5 * Math.sin(breathingPhase)
    // 呼吸强度：瞬时能量越高越明显（0.1 ~ 0.8倍缩放）
    const breathingAmount = 0.1 + instantEnergy * 0.7
    const breathingScale = 1 + (breathingWave - 0.5) * breathingAmount

    // 节奏密度影响：节奏越快，粒子越大（活跃感）
    const energy = audioData.energyDistribution
    const rhythmBoost = energy ? energy.rhythmDensity * 0.15 : 0

    // 情感强度影响：激烈时粒子整体更大
    const emotionT = energy ? (energy.emotionScore + 1) * 0.5 : 0.5
    const emotionSizeBoost = emotionT * 0.3

    // 综合计算粒子大小
    const baseScale = 1 + freqValue * 1.5 * controlParams.colorSensitivity
    particle.size = particle.baseSize * baseScale * breathingScale * (1 + beatBoost + rhythmBoost + emotionSizeBoost)
  }

  /**
   * 应用可视化模式变换（2D/3D/频谱）
   */
  private applyVisualizationMode(
    particle: ParticleDataExt,
    transition: number,
    index: number,
    total: number,
    frequencyData: Uint8Array
  ): void {
    if (this.currentVisualizationMode === this.targetVisualizationMode && transition >= 1) {
      return
    }

    const freqValue = frequencyData[particle.frequencyIndex] / 255

    // 获取指定模式下的位置
    const getModePosition = (mode: VisualizationMode) => {
      switch (mode) {
        case '2d': {
          const angle = (index / total) * Math.PI * 4 + particle.phase
          const radius = 2 + freqValue * 6
          return {
            x: Math.cos(angle) * radius,
            y: Math.sin(angle) * radius,
            z: 0,
          }
        }
        case 'spectrum': {
          const barIndex = Math.floor((index / total) * 64)
          const barX = (barIndex - 32) * 0.25
          const barZ = freqValue * 5
          return {
            x: barX + (Math.random() - 0.5) * 0.1,
            y: particle.basePosition.y * 0.3,
            z: barZ,
          }
        }
        case '3d':
        default: {
          return {
            x: particle.position.x,
            y: particle.position.y,
            z: particle.position.z,
          }
        }
      }
    }

    const currentPos = getModePosition(this.currentVisualizationMode)
    const targetPos = getModePosition(this.targetVisualizationMode)

    // 模式过渡时位置插值
    particle.position.x = lerp(currentPos.x, targetPos.x, transition)
    particle.position.y = lerp(currentPos.y, targetPos.y, transition)
    particle.position.z = lerp(currentPos.z, targetPos.z, transition)
  }

  /**
   * 切换粒子预设
   * @param preset 目标预设
   */
  setPreset(preset: VisualizerPreset): void {
    if (preset === this.targetPreset) return
    this.targetPreset = preset
    // 重新创建预设过渡动画器
    this.presetAnimator = new ValueAnimator(0, 2000, easeInOutQuart)
    this.presetAnimator.animateTo(1)

    // 为所有粒子重新计算基础位置以匹配新预设的分布
    this.particles.forEach((particle, i) => {
      const targetPresetConfig = PRESET_CONFIGS[preset]
      const radius = targetPresetConfig.distribution.radius * (0.3 + (i / this.currentCount) * 0.7)

      let tx: number, ty: number, tz: number
      switch (targetPresetConfig.distribution.type) {
        case 'cube': {
          tx = (Math.random() - 0.5) * radius * 2
          ty = (Math.random() - 0.5) * radius * 2
          tz = (Math.random() - 0.5) * radius * 2
          break
        }
        case 'disc': {
          const angle = Math.random() * Math.PI * 2
          const discRadius = Math.sqrt(Math.random()) * radius
          tx = Math.cos(angle) * discRadius
          ty = (Math.random() - 0.5) * radius * 0.3
          tz = Math.sin(angle) * discRadius
          break
        }
        case 'sphere':
        default: {
          const theta = Math.random() * Math.PI * 2
          const phi = Math.acos(2 * Math.random() - 1)
          tx = radius * Math.sin(phi) * Math.cos(theta)
          ty = radius * Math.sin(phi) * Math.sin(theta)
          tz = radius * Math.cos(phi)
          break
        }
      }

      particle.basePosition.x = tx
      particle.basePosition.y = ty
      particle.basePosition.z = tz
      particle.radius = radius
    })
  }

  /**
   * 设置粒子数量
   * @param count 目标粒子数
   */
  setParticleCount(count: number): void {
    const newCount = clamp(count, 1000, this.maxParticles)
    if (newCount === this.currentCount) return

    if (newCount > this.currentCount) {
      // 增加粒子：补齐缺失部分
      for (let i = this.currentCount; i < newCount; i++) {
        const particle = this.createSingleParticle(i, newCount)
        this.particles.push(particle)
      }
    } else {
      // 减少粒子：截断数组
      this.particles = this.particles.slice(0, newCount)
    }

    this.currentCount = newCount
    this.updateGeometryBuffers()
  }

  /**
   * 设置可视化模式
   * @param mode 目标模式
   */
  setVisualizationMode(mode: VisualizationMode): void {
    if (mode === this.targetVisualizationMode) return
    this.targetVisualizationMode = mode
    this.modeAnimator = new ValueAnimator(0, 1500, easeInOutQuart)
    this.modeAnimator.animateTo(1)
  }

  /**
   * 设置速度（预留接口）
   */
  setSpeed(speed: number): void {
    void speed
  }

  /**
   * 设置颜色敏感度（预留接口）
   */
  setColorSensitivity(sensitivity: number): void {
    void sensitivity
  }

  /**
   * 设置透明度（预留接口）
   */
  setOpacity(opacity: number): void {
    void opacity
  }

  /**
   * 获取 Three.js Points 对象
   */
  getPoints(): THREE.Points | null {
    return this.points
  }

  /**
   * 获取当前粒子数量
   */
  getParticleCount(): number {
    return this.currentCount
  }

  /**
   * 获取当前预设
   */
  getCurrentPreset(): VisualizerPreset {
    return this.currentPreset
  }

  /**
   * 获取当前可视化模式
   */
  getCurrentVisualizationMode(): VisualizationMode {
    return this.currentVisualizationMode
  }

  /**
   * 获取临时向量（供外部使用）
   */
  getTempVector(): THREE.Vector3 {
    return this.tempVector
  }

  /**
   * 销毁粒子系统，释放资源
   * 当音频停止时调用
   */
  destroy(): void {
    // 释放几何对象
    if (this.geometry) {
      this.geometry.dispose()
      this.geometry = null
    }
    // 释放材质对象
    if (this.material) {
      this.material.dispose()
      this.material = null
    }
    // 清空粒子数组
    this.particles = []
    // 重置缓冲区引用
    this.positions = null
    this.colors = null
    this.sizes = null
    // 重置 Three.js 对象引用
    this.points = null
    // 重置状态
    this.currentCount = 5000
    this.time = 0
    this.beatPulse = 0
    this.isAudioPlaying = false
    // 重置预设和模式
    this.currentPreset = 'nebula'
    this.targetPreset = 'nebula'
    this.currentVisualizationMode = '3d'
    this.targetVisualizationMode = '3d'
  }
}
