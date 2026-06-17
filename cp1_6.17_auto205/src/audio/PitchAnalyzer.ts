export interface PitchAnalysisResult {
  pitchSequence: number[]
  volumeSequence: number[]
  recordingId: string
}

export class PitchAnalyzer {
  private baseUrl: string = '/api'

  async analyze(audioData: number[], sampleRate: number = 44100): Promise<PitchAnalysisResult> {
    try {
      const response = await fetch(`${this.baseUrl}/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ audioData, sampleRate })
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        pitchSequence: data.pitchSequence,
        volumeSequence: data.volumeSequence,
        recordingId: data.id
      }
    } catch (error) {
      console.error('Pitch analysis error:', error)
      return this.fallbackAnalysis(audioData, sampleRate)
    }
  }

  private fallbackAnalysis(audioData: number[], sampleRate: number): PitchAnalysisResult {
    const pitchSequence: number[] = []
    const volumeSequence: number[] = []
    const frameSize = 2048
    const hopSize = 512
    
    const numFrames = Math.floor((audioData.length - frameSize) / hopSize)
    
    for (let i = 0; i < numFrames && pitchSequence.length < 256; i++) {
      const start = i * hopSize
      
      let sumSq = 0
      for (let j = 0; j < frameSize && start + j < audioData.length; j++) {
        const val = audioData[start + j] || 0
        sumSq += val * val
      }
      const rms = Math.sqrt(sumSq / frameSize)
      volumeSequence.push(Math.min(1, rms * 5))
      
      if (rms < 0.01) {
        pitchSequence.push(0)
        continue
      }
      
      let maxMag = 0
      let maxFreq = 0
      for (let k = 10; k < 200; k++) {
        const freq = k * sampleRate / frameSize
        if (freq < 80 || freq > 1200) continue
        
        let re = 0
        let im = 0
        for (let t = 0; t < frameSize && start + t < audioData.length; t++) {
          const angle = -2 * Math.PI * k * t / frameSize
          const val = audioData[start + t] || 0
          re += val * Math.cos(angle)
          im += val * Math.sin(angle)
        }
        const magnitude = Math.sqrt(re * re + im * im) / frameSize
        
        if (magnitude > maxMag) {
          maxMag = magnitude
          maxFreq = freq
        }
      }
      
      const normalizedPitch = Math.min(1, Math.max(0, (maxFreq - 80) / 1000))
      pitchSequence.push(normalizedPitch)
    }
    
    return {
      pitchSequence,
      volumeSequence,
      recordingId: 'local_' + Date.now().toString(36)
    }
  }

  async getRecording(id: string): Promise<PitchAnalysisResult | null> {
    try {
      const response = await fetch(`${this.baseUrl}/record/${id}`)
      
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      return {
        pitchSequence: data.pitchSequence,
        volumeSequence: data.volumeSequence,
        recordingId: data.id
      }
    } catch (error) {
      console.error('Get recording error:', error)
      return null
    }
  }

  async getShareUrl(id: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/share/${id}`)
      
      if (!response.ok) {
        return null
      }
      
      const data = await response.json()
      return data.shareUrl
    } catch (error) {
      console.error('Get share URL error:', error)
      return null
    }
  }
}
