let audioContext: AudioContext | null = null

const NOTE_FREQUENCIES = {
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  B4: 493.88,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
}

const NOTE_KEYS = Object.keys(NOTE_FREQUENCIES) as (keyof typeof NOTE_FREQUENCIES)[]

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
  }
  return audioContext
}

function generateMelody(seed: number): { note: keyof typeof NOTE_FREQUENCIES; duration: number }[] {
  const melody: { note: keyof typeof NOTE_FREQUENCIES; duration: number }[] = []
  const noteCount = 15 + (seed % 10)
  
  for (let i = 0; i < noteCount; i++) {
    const noteIndex = Math.floor(Math.abs(Math.sin(seed + i * 1.5) * 10)) % NOTE_KEYS.length
    const duration = 0.2 + Math.abs(Math.sin(seed + i * 0.8)) * 0.6
    melody.push({
      note: NOTE_KEYS[noteIndex],
      duration,
    })
  }
  
  return melody
}

export function playSongPreview(songId: string): { stop: () => void } {
  const ctx = getAudioContext()
  const seed = songId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const melody = generateMelody(seed)
  
  const masterGain = ctx.createGain()
  masterGain.gain.value = 0.15
  masterGain.connect(ctx.destination)
  
  let startTime = ctx.currentTime
  const oscillators: OscillatorNode[] = []
  
  melody.forEach(({ note, duration }) => {
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    osc.type = 'sine'
    osc.frequency.value = NOTE_FREQUENCIES[note]
    
    gainNode.gain.setValueAtTime(0, startTime)
    gainNode.gain.linearRampToValueAtTime(0.8, startTime + 0.02)
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
    
    osc.connect(gainNode)
    gainNode.connect(masterGain)
    
    osc.start(startTime)
    osc.stop(startTime + duration)
    
    oscillators.push(osc)
    startTime += duration * 0.7
  })
  
  const totalDuration = startTime - ctx.currentTime
  const timeoutId = setTimeout(() => {
    stopPreview()
  }, Math.min(totalDuration * 1000, 15000))
  
  const stopPreview = () => {
    clearTimeout(timeoutId)
    oscillators.forEach((osc) => {
      try {
        osc.stop()
        osc.disconnect()
      } catch (e) {
        // oscillator already stopped
      }
    })
    masterGain.disconnect()
  }
  
  return { stop: stopPreview }
}

export function stopAllAudio(): void {
  if (audioContext) {
    audioContext.close()
    audioContext = null
  }
}
