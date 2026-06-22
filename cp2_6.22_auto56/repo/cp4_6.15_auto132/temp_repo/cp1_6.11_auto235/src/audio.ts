let audioCtx: AudioContext | null = null

export function initAudio(): void {
  audioCtx = new AudioContext()
}

export function playCrackSound(): void {
  if (!audioCtx) {
    audioCtx = new AudioContext()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }

  const duration = 0.08
  const sampleRate = audioCtx.sampleRate
  const bufferSize = Math.floor(sampleRate * duration)

  const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    const t = i / sampleRate
    const envelope = Math.exp(-t * 80)
    data[i] = (Math.random() * 2 - 1) * envelope * 0.3
  }

  const source = audioCtx.createBufferSource()
  source.buffer = buffer

  const filter = audioCtx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 800
  filter.Q.value = 2

  const gain = audioCtx.createGain()
  gain.gain.value = 0.4

  source.connect(filter)
  filter.connect(gain)
  gain.connect(audioCtx.destination)

  source.start()
}
