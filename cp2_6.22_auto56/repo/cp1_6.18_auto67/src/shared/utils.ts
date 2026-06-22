export type Difficulty = '初级' | '中级' | '高级'

export function shuffleArray<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function extractLetters(word: string): { id: string; letter: string }[] {
  const wordLetters = word.toUpperCase().split('')
  let letters: string[]

  if (wordLetters.length < 6) {
    const needed = 6 - wordLetters.length
    const randomLetters = getRandomLetters(needed)
    letters = [...wordLetters, ...randomLetters]
  } else if (wordLetters.length === 6) {
    letters = [...wordLetters]
  } else {
    letters = [...wordLetters]
  }

  const letterObjects = letters.map((letter) => ({
    id: crypto.randomUUID(),
    letter,
  }))

  return shuffleArray(letterObjects)
}

export function classifyDifficulty(current: Difficulty, correctRate: number): Difficulty {
  if (correctRate >= 0.8) {
    if (current === '初级') return '中级'
    if (current === '中级') return '高级'
    return '高级'
  }
  if (correctRate < 0.4) {
    if (current === '高级') return '中级'
    if (current === '中级') return '初级'
    return '初级'
  }
  return current
}

export function playSound(frequency: number = 523, duration: number = 0.15): void {
  try {
    const AudioContextClass =
      (window as unknown as { AudioContext?: typeof AudioContext }).AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!AudioContextClass) return

    const audioContext = new AudioContextClass()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + duration)
  } catch {
    // Silently fail if audio is not supported
  }
}

export function getRandomLetters(count: number): string[] {
  const letters: string[] = []
  for (let i = 0; i < count; i++) {
    const randomCode = Math.floor(Math.random() * 26) + 65
    letters.push(String.fromCharCode(randomCode))
  }
  return letters
}
