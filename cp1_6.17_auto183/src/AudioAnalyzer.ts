export interface AudioAnalysisResult {
  bpm: number
  beatTimes: number[]
  energyPeaks: number[]
  duration: number
}

export class AudioAnalyzer {
  private audioContext: AudioContext | null = null
  private buffer: AudioBuffer | null = null

  async analyzeFile(file: File): Promise<AudioAnalysisResult> {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    const arrayBuffer = await file.arrayBuffer()
    this.buffer = await this.audioContext.decodeAudioData(arrayBuffer)
    
    const channelData = this.buffer.getChannelData(0)
    const sampleRate = this.buffer.sampleRate
    const duration = this.buffer.duration
    
    const bpm = this.detectBPM(channelData, sampleRate)
    const beatTimes = this.detectBeats(channelData, sampleRate, bpm)
    const energyPeaks = this.getEnergyPeaks(channelData, sampleRate, beatTimes)
    
    return {
      bpm,
      beatTimes,
      energyPeaks,
      duration,
    }
  }

  private detectBPM(channelData: Float32Array, sampleRate: number): number {
    const windowSize = Math.floor(sampleRate * 0.1)
    const hopSize = Math.floor(windowSize / 2)
    const energies: number[] = []
    
    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      let energy = 0
      for (let j = 0; j < windowSize; j++) {
        energy += channelData[i + j] * channelData[i + j]
      }
      energies.push(energy / windowSize)
    }
    
    const avgEnergy = energies.reduce((a, b) => a + b, 0) / energies.length
    const threshold = avgEnergy * 1.5
    
    const peaks: number[] = []
    for (let i = 1; i < energies.length - 1; i++) {
      if (energies[i] > threshold && energies[i] > energies[i - 1] && energies[i] > energies[i + 1]) {
        peaks.push(i * hopSize / sampleRate)
      }
    }
    
    if (peaks.length < 2) {
      return 120
    }
    
    const intervals: number[] = []
    for (let i = 1; i < peaks.length; i++) {
      const interval = peaks[i] - peaks[i - 1]
      if (interval > 0.2 && interval < 2.0) {
        intervals.push(interval)
      }
    }
    
    if (intervals.length === 0) {
      return 120
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const bpm = Math.round(60 / avgInterval)
    
    return Math.max(60, Math.min(200, bpm))
  }

  private detectBeats(channelData: Float32Array, sampleRate: number, bpm: number): number[] {
    const beatInterval = 60 / bpm
    const beatTimes: number[] = []
    
    const windowSize = Math.floor(sampleRate * 0.05)
    const hopSize = Math.floor(windowSize / 4)
    const energies: number[] = []
    const timeStamps: number[] = []
    
    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      let energy = 0
      for (let j = 0; j < windowSize; j++) {
        energy += Math.abs(channelData[i + j])
      }
      energies.push(energy / windowSize)
      timeStamps.push(i / sampleRate)
    }
    
    let lastBeatTime = -beatInterval * 0.5
    const minInterval = beatInterval * 0.6
    
    for (let i = 1; i < energies.length - 1; i++) {
      const time = timeStamps[i]
      if (time - lastBeatTime < minInterval) continue
      
      const localSlice = energies.slice(Math.max(0, i - 10), Math.min(energies.length, i + 10))
      const localAvg = localSlice.reduce((a, b) => a + b, 0) / localSlice.length
      
      if (energies[i] > localAvg * 1.3 && energies[i] > energies[i - 1] && energies[i] > energies[i + 1]) {
        beatTimes.push(time)
        lastBeatTime = time
      }
    }
    
    if (beatTimes.length < 4) {
      const duration = channelData.length / sampleRate
      for (let t = 0; t < duration; t += beatInterval) {
        beatTimes.push(t)
      }
    }
    
    return beatTimes
  }

  private getEnergyPeaks(
    channelData: Float32Array,
    sampleRate: number,
    beatTimes: number[]
  ): number[] {
    const windowSize = Math.floor(sampleRate * 0.1)
    const peaks: number[] = []
    
    for (const beatTime of beatTimes) {
      const centerSample = Math.floor(beatTime * sampleRate)
      const start = Math.max(0, centerSample - Math.floor(windowSize / 2))
      const end = Math.min(channelData.length, centerSample + Math.floor(windowSize / 2))
      
      let energy = 0
      for (let i = start; i < end; i++) {
        energy += channelData[i] * channelData[i]
      }
      peaks.push(energy / (end - start))
    }
    
    if (peaks.length > 0) {
      const maxPeak = Math.max(...peaks)
      if (maxPeak > 0) {
        for (let i = 0; i < peaks.length; i++) {
          peaks[i] = peaks[i] / maxPeak
        }
      }
    }
    
    return peaks
  }

  destroy(): void {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.buffer = null
  }
}
