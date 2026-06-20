export class AudioRecorder {
  private mediaStream: MediaStream | null = null
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private dataArray: Float32Array | null = null
  private recordedChunks: Float32Array[] = []
  private isRecording: boolean = false
  private startTime: number = 0
  private animationId: number = 0
  private onVolumeChange: ((volume: number) => void) | null = null
  private onProgress: ((progress: number) => void) | null = null
  private maxDuration: number = 10000

  constructor(maxDuration: number = 10000) {
    this.maxDuration = maxDuration
  }

  setOnVolumeChange(callback: (volume: number) => void) {
    this.onVolumeChange = callback
  }

  setOnProgress(callback: (progress: number) => void) {
    this.onProgress = callback
  }

  async start(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      })

      this.audioContext = new AudioContext({ sampleRate: 44100 })
      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 2048
      this.analyser.smoothingTimeConstant = 0.3
      
      source.connect(this.analyser)
      
      this.dataArray = new Float32Array(this.analyser.fftSize) as Float32Array
      this.recordedChunks = []
      this.isRecording = true
      this.startTime = Date.now()
      
      this.captureLoop()
    } catch (error) {
      console.error('Failed to start recording:', error)
      throw error
    }
  }

  private captureLoop() {
    if (!this.isRecording || !this.analyser || !this.dataArray || !this.audioContext) {
      return
    }

    this.analyser.getFloatTimeDomainData(this.dataArray as Float32Array)
    
    const chunk = new Float32Array(this.dataArray.length)
    chunk.set(this.dataArray)
    this.recordedChunks.push(chunk)

    let sumSq = 0
    for (let i = 0; i < this.dataArray.length; i++) {
      sumSq += this.dataArray[i] * this.dataArray[i]
    }
    const rms = Math.sqrt(sumSq / this.dataArray.length)
    const volume = Math.min(1, rms * 5)

    if (this.onVolumeChange) {
      this.onVolumeChange(volume)
    }

    const elapsed = Date.now() - this.startTime
    const progress = Math.min(1, elapsed / this.maxDuration)
    
    if (this.onProgress) {
      this.onProgress(progress)
    }

    if (elapsed >= this.maxDuration) {
      this.stop()
      return
    }

    this.animationId = requestAnimationFrame(() => this.captureLoop())
  }

  async stop(): Promise<{ audioData: number[]; sampleRate: number }> {
    this.isRecording = false
    cancelAnimationFrame(this.animationId)

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }

    if (this.audioContext) {
      await this.audioContext.close()
      this.audioContext = null
    }

    let totalLength = 0
    for (const chunk of this.recordedChunks) {
      totalLength += chunk.length
    }

    const mergedData = new Float32Array(totalLength)
    let offset = 0
    for (const chunk of this.recordedChunks) {
      mergedData.set(chunk, offset)
      offset += chunk.length
    }

    const audioData = Array.from(mergedData)
    
    return {
      audioData,
      sampleRate: 44100
    }
  }

  getIsRecording(): boolean {
    return this.isRecording
  }

  destroy() {
    this.isRecording = false
    cancelAnimationFrame(this.animationId)
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }
    
    if (this.audioContext) {
      this.audioContext.close().catch(() => {})
      this.audioContext = null
    }
    
    this.recordedChunks = []
  }
}
