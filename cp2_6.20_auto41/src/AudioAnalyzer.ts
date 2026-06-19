import { Howl } from 'howler'
import { BeatDetector, calculateFrequencyBands, validateAudioFile } from '@/utils/audio'
import { AudioAnalysisResult } from '@/types'

// 节拍信息回调类型
export type BeatDetectCallback = (beatInfo: {
  timestamp: number
  intensity: number
  bpm: number | null
}) => void

// 音频分析结果回调类型
export type AnalysisCallback = (result: AudioAnalysisResult) => void

// 音频状态变化回调类型
export type StateChangeCallback = (state: {
  isPlaying: boolean
  currentTime: number
  duration: number
}) => void

// 音频结束回调类型
export type EndCallback = () => void

// 音频暂停回调类型
export type PauseCallback = () => void

export class AudioAnalyzer {
  // Web Audio API 上下文
  private audioContext: AudioContext | null = null
  // 分析节点
  private analyser: AnalyserNode | null = null
  // 媒体元素源节点
  private source: MediaElementAudioSourceNode | null = null
  // 增益节点
  private gainNode: GainNode | null = null
  // Howl 音频播放实例
  private howl: Howl | null = null
  // 频率数据缓冲区
  private frequencyData: Uint8Array
  // 波形数据缓冲区
  private waveformData: Uint8Array
  // 节拍检测器实例
  private beatDetector: BeatDetector
  // 分析结果回调
  private onAnalysisCallback: AnalysisCallback | null = null
  // 状态变化回调
  private onStateChangeCallback: StateChangeCallback | null = null
  // 节拍检测回调
  private onBeatDetectCallback: BeatDetectCallback | null = null
  // 音频结束回调
  private onEndCallback: EndCallback | null = null
  // 音频暂停回调
  private onPauseCallback: PauseCallback | null = null
  // 动画帧ID（用于循环分析）
  private animationFrameId: number | null = null
  // 当前音频文件名
  private currentFileName: string = ''
  // 加载状态标记
  private isLoading: boolean = false
  // 节拍时间戳历史记录
  private beatTimestamps: number[] = []
  // 能量历史记录（用于动态阈值计算）
  private energyHistory: number[] = []
  // 最大能量历史记录长度
  private readonly maxEnergyHistorySize: number = 100

  constructor() {
    // 初始化缓冲区（FFT大小为512时，频率数据长度为256）
    this.frequencyData = new Uint8Array(256)
    this.waveformData = new Uint8Array(256)
    // 初始化节拍检测器
    this.beatDetector = new BeatDetector()
  }

  /**
   * 初始化或恢复 AudioContext
   * 处理浏览器自动播放限制
   */
  private async initAudioContext(): Promise<void> {
    // 首次创建 AudioContext 和相关节点
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      // FFT大小决定频率分辨率
      this.analyser.fftSize = 512
      // 平滑时间常数（0-1），影响数据变化快慢
      this.analyser.smoothingTimeConstant = 0.8
      this.gainNode = this.audioContext.createGain()
      // 连接节点链：analyser -> gain -> destination
      this.analyser.connect(this.gainNode)
      this.gainNode.connect(this.audioContext.destination)
    }

    // 恢复被浏览器自动暂停的 AudioContext
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume()
    }
  }

  /**
   * 加载音频文件
   * @param file 音频文件对象
   */
  async loadAudio(file: File): Promise<void> {
    // 验证文件格式
    if (!validateAudioFile(file)) {
      throw new Error('不支持的音频格式，请上传 mp3、wav 或 ogg 文件')
    }

    this.isLoading = true
    this.currentFileName = file.name

    // 初始化音频上下文
    await this.initAudioContext()
    // 清理之前的音频资源
    this.cleanupExistingAudio()

    return new Promise((resolve, reject) => {
      // 创建 Blob URL 供 Howl 加载
      const url = URL.createObjectURL(file)

      this.howl = new Howl({
        src: [url],
        html5: true,
        format: ['mp3', 'wav', 'ogg'],
        // 加载成功回调
        onload: () => {
          this.connectAudioNode()
          this.isLoading = false
          resolve()
        },
        // 加载失败回调
        onloaderror: (_id, error) => {
          this.isLoading = false
          reject(new Error(`音频加载失败: ${error}`))
        },
        // 开始播放回调
        onplay: () => {
          this.notifyStateChange()
          this.startAnalysisLoop()
        },
        // 暂停回调
        onpause: () => {
          this.notifyStateChange()
          // 触发暂停回调
          if (this.onPauseCallback) {
            this.onPauseCallback()
          }
        },
        // 停止回调
        onstop: () => {
          this.notifyStateChange()
          this.stopAnalysisLoop()
        },
        // 播放结束回调
        onend: () => {
          this.notifyStateChange()
          this.stopAnalysisLoop()
          // 触发结束回调
          if (this.onEndCallback) {
            this.onEndCallback()
          }
        },
      })
    })
  }

  /**
   * 将 Howl 内部的 HTMLAudioElement 连接到 Web Audio 分析节点
   */
  private connectAudioNode(): void {
    if (!this.howl || !this.analyser || !this.audioContext) return

    // 访问 Howl 内部的音频元素（非标准API）
    const howlAny = this.howl as unknown as { _sounds?: { _node?: HTMLAudioElement }[] }
    const audioElement = howlAny._sounds?.[0]?._node
    if (!audioElement) return

    try {
      // 断开之前的连接
      if (this.source) {
        this.source.disconnect()
      }
      // 创建媒体元素源并连接到分析器
      this.source = this.audioContext.createMediaElementSource(audioElement)
      this.source.connect(this.analyser)
    } catch {
      console.warn('音频节点已连接，跳过重复连接')
    }
  }

  /**
   * 清理现有音频资源和状态
   */
  private cleanupExistingAudio(): void {
    if (this.howl) {
      this.howl.unload()
      this.howl = null
    }
    if (this.source) {
      this.source.disconnect()
      this.source = null
    }
    this.stopAnalysisLoop()
    // 重置节拍检测器
    this.beatDetector.reset()
    // 清空节拍时间戳历史
    this.beatTimestamps = []
    // 清空能量历史
    this.energyHistory = []
  }

  /**
   * 峰值检测算法
   * 分析时域能量变化，识别节拍
   * @param waveformData 波形数据（时域）
   * @param timestamp 当前时间戳
   * @returns 检测结果：是否为峰值、强度
   */
  private detectPeaks(
    waveformData: Uint8Array
  ): { isPeak: boolean; peakIntensity: number } {
    const N = waveformData.length

    // 计算瞬时能量：sum((sample - 128)^2) / N
    let instantaneousEnergy = 0
    for (let i = 0; i < N; i++) {
      const sample = waveformData[i] - 128
      instantaneousEnergy += sample * sample
    }
    instantaneousEnergy = instantaneousEnergy / N

    // 将当前能量加入历史记录
    this.energyHistory.push(instantaneousEnergy)
    if (this.energyHistory.length > this.maxEnergyHistorySize) {
      this.energyHistory.shift()
    }

    // 历史记录不足时无法判断
    if (this.energyHistory.length < 10) {
      return { isPeak: false, peakIntensity: 0 }
    }

    // 计算能量历史的均值
    const mean = this.energyHistory.reduce((sum, val) => sum + val, 0) / this.energyHistory.length
    // 计算能量历史的方差
    const variance =
      this.energyHistory.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      this.energyHistory.length
    // 动态阈值：mean + variance * 1.5
    const dynamicThreshold = mean + variance * 1.5

    // 检查当前能量是否超过动态阈值
    const exceedsThreshold = instantaneousEnergy > dynamicThreshold

    // 检查是否为3样本窗口的局部峰值
    const currentIdx = this.energyHistory.length - 1
    let isLocalPeak = false
    if (currentIdx >= 1 && currentIdx < this.energyHistory.length - 1) {
      const prev = this.energyHistory[currentIdx - 1]
      const curr = this.energyHistory[currentIdx]
      const next = this.energyHistory[currentIdx] // 当前帧，使用自身作为比较（下一帧还未到达）
      isLocalPeak = curr > prev && curr >= next
    }

    // 综合判断：超过阈值 且 是局部峰值
    const isPeak = exceedsThreshold && isLocalPeak

    // 计算峰值强度（归一化到0-1）
    const peakIntensity = Math.min(1, instantaneousEnergy / (dynamicThreshold + 0.0001))

    return { isPeak, peakIntensity }
  }

  /**
   * 自相关算法估计 BPM
   * 计算波形的自相关函数，在60-180 BPM范围内寻找峰值
   * @param waveformData 波形数据
   * @param sampleRate 采样率（默认44100Hz）
   * @returns 估计的BPM值，无法估计时返回null
   */
  private autocorrelation(
    waveformData: Uint8Array,
    sampleRate: number = 44100
  ): number | null {
    const N = waveformData.length
    // 归一化波形数据（中心化到-1~1）
    const normalized = new Float32Array(N)
    for (let i = 0; i < N; i++) {
      normalized[i] = (waveformData[i] - 128) / 128
    }

    // 计算自相关函数
    const autocorr = new Float32Array(N)
    for (let lag = 0; lag < N; lag++) {
      let sum = 0
      for (let i = 0; i < N - lag; i++) {
        sum += normalized[i] * normalized[i + lag]
      }
      autocorr[lag] = sum / (N - lag)
    }

    // BPM 范围：60~180 BPM
    // 周期范围 = 60/BPM_max ~ 60/BPM_min 秒
    // 转换为滞后样本数：lag = period * sampleRate
    const minBPM = 60
    const maxBPM = 180
    const minLag = Math.floor((60 / maxBPM) * sampleRate / (512 / N)) // 调整到FFT窗口大小
    const maxLag = Math.floor((60 / minBPM) * sampleRate / (512 / N))

    // 在有效范围内查找自相关峰值
    let bestLag = -1
    let bestValue = -Infinity

    // 限制在自相关数组有效范围内
    const startLag = Math.max(2, minLag)
    const endLag = Math.min(N - 1, maxLag)

    for (let lag = startLag; lag < endLag; lag++) {
      // 简单的局部最大值检测
      if (
        autocorr[lag] > autocorr[lag - 1] &&
        autocorr[lag] >= autocorr[lag + 1] &&
        autocorr[lag] > bestValue
      ) {
        bestValue = autocorr[lag]
        bestLag = lag
      }
    }

    // 未找到有效峰值
    if (bestLag <= 0 || bestValue < 0.01) {
      return null
    }

    // 将滞后样本数转换为 BPM
    // 注意：由于使用了 FFT_SIZE/2 的窗口，需要调整采样率换算
    const adjustedSampleRate = sampleRate * (N / 512)
    const bpm = Math.round((60 * adjustedSampleRate) / bestLag)

    // 再次验证 BPM 是否在合理范围
    if (bpm >= minBPM && bpm <= maxBPM) {
      return bpm
    }

    return null
  }

  /**
   * 播放音频
   */
  play(): void {
    if (this.howl && !this.howl.playing()) {
      this.howl.play()
    }
  }

  /**
   * 暂停音频
   */
  pause(): void {
    if (this.howl && this.howl.playing()) {
      this.howl.pause()
    }
  }

  /**
   * 切换播放/暂停状态
   */
  togglePlay(): void {
    if (this.howl) {
      if (this.howl.playing()) {
        this.pause()
      } else {
        this.play()
      }
    }
  }

  /**
   * 停止音频播放
   */
  stop(): void {
    if (this.howl) {
      this.howl.stop()
    }
  }

  /**
   * 启动音频分析循环
   * 通过 requestAnimationFrame 每帧更新频率数据和波形数据
   */
  private startAnalysisLoop(): void {
    const analyze = () => {
      // 检查音频是否仍在播放
      if (!this.analyser || !this.howl?.playing()) {
        return
      }

      // 获取频域数据（ByteFrequencyData）
      this.analyser.getByteFrequencyData(this.frequencyData)
      // 获取时域数据（ByteTimeDomainData）
      this.analyser.getByteTimeDomainData(this.waveformData)

      // 计算分段频率值
      const bands = calculateFrequencyBands(this.frequencyData)
      const currentTime = performance.now()

      // 使用 BeatDetector 进行节拍检测（基于能量历史）
      const beatDetectorResult = this.beatDetector.detect(bands.average, currentTime)

      // 额外进行波形峰值检测
      const peakResult = this.detectPeaks(this.waveformData)

      // 综合判断是否为节拍：BeatDetector结果 或 峰值检测结果
      const isBeat = beatDetectorResult || peakResult.isPeak

      // 计算节拍强度
      const beatStrength = this.beatDetector.getBeatStrength()
      const beatIntensity = Math.max(beatStrength, peakResult.peakIntensity)

      // 通过自相关估计 BPM（每30帧计算一次以节省性能）
      let estimatedBPM: number | null = null
      if (Math.random() < 0.033) {
        estimatedBPM = this.autocorrelation(this.waveformData, 44100)
      }
      // 如果自相关无法估计，使用 BeatDetector 的历史间隔估计
      if (!estimatedBPM) {
        estimatedBPM = this.beatDetector.estimateBPM()
      }

      // 检测到节拍时的处理
      if (isBeat) {
        // 记录节拍时间戳
        this.beatTimestamps.push(currentTime)
        // 限制历史记录大小（保留最近100个）
        if (this.beatTimestamps.length > 100) {
          this.beatTimestamps.shift()
        }

        // 触发节拍检测回调
        if (this.onBeatDetectCallback) {
          this.onBeatDetectCallback({
            timestamp: currentTime,
            intensity: beatIntensity,
            bpm: estimatedBPM,
          })
        }
      }

      // 组装完整的音频分析结果
      const result: AudioAnalysisResult = {
        frequencyData: this.frequencyData.slice(),
        waveformData: this.waveformData.slice(),
        lowFrequency: bands.low,
        midFrequency: bands.mid,
        highFrequency: bands.high,
        averageVolume: bands.average,
        isBeat,
        timestamp: currentTime,
        beatIntensity,
        estimatedBPM,
      }

      // 触发分析结果回调
      if (this.onAnalysisCallback) {
        this.onAnalysisCallback(result)
      }

      // 通知状态变化
      this.notifyStateChange()

      // 请求下一帧
      this.animationFrameId = requestAnimationFrame(analyze)
    }

    // 启动第一帧分析
    analyze()
  }

  /**
   * 停止分析循环
   */
  private stopAnalysisLoop(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * 通知音频状态变化（播放/暂停/进度）
   */
  private notifyStateChange(): void {
    if (this.onStateChangeCallback && this.howl) {
      this.onStateChangeCallback({
        isPlaying: this.howl.playing(),
        currentTime: this.howl.seek() as number,
        duration: this.howl.duration(),
      })
    }
  }

  // ========== Getter 方法 ==========

  /**
   * 获取当前频率数据（内部缓冲区引用）
   */
  getFrequencyData(): Uint8Array {
    return this.frequencyData
  }

  /**
   * 获取当前波形数据（内部缓冲区引用）
   */
  getWaveformData(): Uint8Array {
    return this.waveformData
  }

  /**
   * 获取低频段值
   */
  getLowFrequency(): number {
    const bands = calculateFrequencyBands(this.frequencyData)
    return bands.low
  }

  /**
   * 获取中频段值
   */
  getMidFrequency(): number {
    const bands = calculateFrequencyBands(this.frequencyData)
    return bands.mid
  }

  /**
   * 获取高频段值
   */
  getHighFrequency(): number {
    const bands = calculateFrequencyBands(this.frequencyData)
    return bands.high
  }

  /**
   * 获取音频是否正在播放
   */
  getIsPlaying(): boolean {
    return this.howl?.playing() ?? false
  }

  /**
   * 获取当前加载的音频文件名
   */
  getCurrentFileName(): string {
    return this.currentFileName
  }

  /**
   * 获取是否正在加载
   */
  getIsLoading(): boolean {
    return this.isLoading
  }

  /**
   * 获取节拍时间戳历史记录
   */
  getBeatTimestamps(): number[] {
    return [...this.beatTimestamps]
  }

  // ========== Setter / Callback 注册方法 ==========

  /**
   * 设置音频分析结果回调
   * @param callback 回调函数，每帧触发一次
   */
  setOnAnalysisCallback(callback: AnalysisCallback): void {
    this.onAnalysisCallback = callback
  }

  /**
   * 设置音频状态变化回调
   * @param callback 回调函数，播放/暂停/进度变化时触发
   */
  setOnStateChangeCallback(callback: StateChangeCallback): void {
    this.onStateChangeCallback = callback
  }

  /**
   * 设置节拍检测回调
   * 每当检测到节拍时触发，包含强度和BPM估计
   * @param callback 回调函数
   */
  setOnBeatDetectCallback(callback: BeatDetectCallback): void {
    this.onBeatDetectCallback = callback
  }

  /**
   * 设置音频播放结束回调
   * @param callback 回调函数
   */
  setOnEndCallback(callback: EndCallback): void {
    this.onEndCallback = callback
  }

  /**
   * 设置音频暂停回调
   * @param callback 回调函数
   */
  setOnPauseCallback(callback: PauseCallback): void {
    this.onPauseCallback = callback
  }

  /**
   * 销毁分析器，释放所有资源
   */
  destroy(): void {
    this.stopAnalysisLoop()
    this.cleanupExistingAudio()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    // 清空所有回调引用
    this.onAnalysisCallback = null
    this.onStateChangeCallback = null
    this.onBeatDetectCallback = null
    this.onEndCallback = null
    this.onPauseCallback = null
  }
}
