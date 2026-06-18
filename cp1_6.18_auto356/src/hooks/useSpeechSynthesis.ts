import { useRef } from 'react'
import { useSpeechStore } from '../store/speechStore'

function useSpeechSynthesis() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const oscillatorRef = useRef<OscillatorNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)

  const speak = () => {
    const { text, lang, rate, pitch, volume, setIsPlaying, setIsPaused, setProgress, setAnalyserNode, setAudioContext } = useSpeechStore.getState()

    window.speechSynthesis.cancel()

    if (!text.trim()) return

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang === 'zh' ? 'zh-CN' : 'en-US'
    utterance.rate = rate
    utterance.pitch = pitch
    utterance.volume = volume / 100

    utterance.onstart = () => {
      setIsPlaying(true)
      setIsPaused(false)
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
      setProgress(0)
      cleanupAudio()
    }

    utterance.onerror = () => {
      setIsPlaying(false)
      setIsPaused(false)
      setProgress(0)
      cleanupAudio()
    }

    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (text.length > 0) {
        setProgress(Math.min(event.charIndex / text.length, 1))
      }
    }

    utteranceRef.current = utterance

    cleanupAudio()

    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 256

    const oscillator = audioContext.createOscillator()
    oscillator.frequency.value = pitch * 200
    oscillator.type = 'sine'

    const gainNode = audioContext.createGain()
    gainNode.gain.value = 0.001

    oscillator.connect(gainNode)
    gainNode.connect(analyser)
    analyser.connect(audioContext.destination)
    oscillator.start()

    oscillatorRef.current = oscillator
    gainNodeRef.current = gainNode
    setAnalyserNode(analyser)
    setAudioContext(audioContext)

    window.speechSynthesis.speak(utterance)
  }

  const cleanupAudio = () => {
    try { oscillatorRef.current?.stop() } catch {}
    oscillatorRef.current?.disconnect()
    gainNodeRef.current?.disconnect()
    oscillatorRef.current = null
    gainNodeRef.current = null

    const store = useSpeechStore.getState()
    store.audioContext?.close()
    store.setAnalyserNode(null)
    store.setAudioContext(null)
  }

  const pause = () => {
    window.speechSynthesis.pause()
    useSpeechStore.getState().setIsPaused(true)
  }

  const resume = () => {
    window.speechSynthesis.resume()
    useSpeechStore.getState().setIsPaused(false)
  }

  const stop = () => {
    window.speechSynthesis.cancel()
    useSpeechStore.getState().setIsPlaying(false)
    useSpeechStore.getState().setIsPaused(false)
    useSpeechStore.getState().setProgress(0)
    cleanupAudio()
  }

  const togglePlay = () => {
    const { isPlaying, isPaused } = useSpeechStore.getState()
    if (!isPlaying) {
      speak()
    } else if (!isPaused) {
      pause()
    } else {
      resume()
    }
  }

  return { speak, pause, resume, stop, togglePlay }
}

export default useSpeechSynthesis
export { useSpeechSynthesis }
