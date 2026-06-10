let audioContext: AudioContext | null = null

const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

export const playShockwaveSound = (intensity: number = 1) => {
  try {
    const ctx = initAudioContext()
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    const filter = ctx.createBiquadFilter()
    
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(150 + intensity * 50, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.5)
    
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(2000, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3)
    
    gainNode.gain.setValueAtTime(0.3 * intensity, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    
    oscillator.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.8)
    
    const noiseOsc = ctx.createOscillator()
    const noiseGain = ctx.createGain()
    const noiseFilter = ctx.createBiquadFilter()
    
    const bufferSize = 2 * ctx.sampleRate
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = noiseBuffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    
    const whiteNoise = ctx.createBufferSource()
    whiteNoise.buffer = noiseBuffer
    
    noiseFilter.type = 'highpass'
    noiseFilter.frequency.value = 1000
    
    noiseGain.gain.setValueAtTime(0.1 * intensity, ctx.currentTime)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
    
    whiteNoise.connect(noiseFilter)
    noiseFilter.connect(noiseGain)
    noiseGain.connect(ctx.destination)
    
    whiteNoise.start(ctx.currentTime)
    whiteNoise.stop(ctx.currentTime + 0.2)
  } catch (e) {
    console.log('Audio not available')
  }
}

export const playConnectSound = () => {
  try {
    const ctx = initAudioContext()
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(440, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15)
    
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.3)
  } catch (e) {
    console.log('Audio not available')
  }
}

export const playCreateSound = () => {
  try {
    const ctx = initAudioContext()
    
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(220, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.2)
    
    gainNode.gain.setValueAtTime(0.15, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.4)
  } catch (e) {
    console.log('Audio not available')
  }
}
