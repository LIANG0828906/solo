export interface SpeechCallbacks {
  onResult: (text: string, isFinal: boolean) => void
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: any) => void
  onAudioLevel?: (level: number) => void
}

class SpeechManager {
  private recognition: any = null
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private mediaStream: MediaStream | null = null
  private animationId: number | null = null
  private callbacks: SpeechCallbacks | null = null
  private isRunning = false

  private initRecognition(lang: string) {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      console.warn('Web Speech API not supported')
      return null
    }
    const recognition = new SR()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = lang === 'zh' ? 'zh-CN' : 'en-US'
    return recognition
  }

  private async initAudioAnalysis() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      source.connect(this.analyser)
      this.startLevelMonitoring()
    } catch (e) {
      console.warn('Audio analysis init failed:', e)
    }
  }

  private startLevelMonitoring() {
    if (!this.analyser || !this.callbacks) return
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount)

    const monitor = () => {
      if (!this.analyser || !this.isRunning) return
      this.analyser.getByteFrequencyData(dataArray)
      let sum = 0
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i]
      }
      const average = sum / dataArray.length
      const normalized = Math.min(average / 128, 1)
      this.callbacks?.onAudioLevel?.(normalized)
      this.animationId = requestAnimationFrame(monitor)
    }
    monitor()
  }

  private stopLevelMonitoring() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(t => t.stop())
      this.mediaStream = null
    }
    this.analyser = null
  }

  async startListening(lang: string, callbacks: SpeechCallbacks) {
    if (this.isRunning) return
    this.callbacks = callbacks
    this.isRunning = true

    await this.initAudioAnalysis()

    this.recognition = this.initRecognition(lang)
    if (!this.recognition) {
      this.simulateRecognition()
      return
    }

    this.recognition.onresult = (event: any) => {
      let finalText = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalText += transcript
        } else {
          interimText += transcript
        }
      }
      if (finalText) {
        callbacks.onResult(finalText.trim(), true)
      } else if (interimText) {
        callbacks.onResult(interimText.trim(), false)
      }
    }

    this.recognition.onstart = () => callbacks.onStart?.()
    this.recognition.onend = () => {
      if (this.isRunning) {
        try { this.recognition?.start() } catch (e) {}
      } else {
        callbacks.onEnd?.()
      }
    }
    this.recognition.onerror = (e: any) => callbacks.onError?.(e)

    try {
      this.recognition.start()
      callbacks.onStart?.()
    } catch (e) {
      console.warn('Recognition start error:', e)
      this.simulateRecognition()
    }
  }

  private simulateRecognition() {
    if (!this.callbacks) return
    const demoTexts = [
      '你好，今天天气怎么样？',
      'Hello, how are you today?',
      '我想练习英语口语',
      'I want to practice my English speaking',
    ]
    this.callbacks.onStart?.()
    let idx = 0
    const interval = setInterval(() => {
      if (!this.isRunning) {
        clearInterval(interval)
        this.callbacks?.onEnd?.()
        return
      }
      const text = demoTexts[idx % demoTexts.length]
      this.callbacks?.onResult(text, true)
      idx++
    }, 5000)
  }

  stopListening() {
    this.isRunning = false
    if (this.recognition) {
      try { this.recognition.stop() } catch (e) {}
      this.recognition = null
    }
    this.stopLevelMonitoring()
    this.callbacks?.onEnd?.()
  }

  speakText(text: string, lang: string = 'en-US') {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported')
      return
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US'
    utterance.rate = 0.9
    utterance.pitch = 1.1
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  }
}

export const speechManager = new SpeechManager()
