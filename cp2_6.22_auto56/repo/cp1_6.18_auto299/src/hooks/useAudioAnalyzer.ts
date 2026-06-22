import { useEffect, useRef, useCallback } from 'react'
import { useAudioStore } from '../store/useAudioStore'

const FREQUENCY_BIN_COUNT = 64
const WAVEFORM_BIN_COUNT = 256

export function useAudioAnalyzer() {
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const pauseTimeRef = useRef<number>(0)

  const {
    audioFile,
    isPlaying,
    volume,
    setIsPlaying,
    setVolume,
    setCurrentTime,
    setDuration,
    setFrequencyData,
    setWaveformData,
  } = useAudioStore()

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = WAVEFORM_BIN_COUNT * 2
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.gain.value = volume / 100
      analyserRef.current.connect(gainNodeRef.current)
      gainNodeRef.current.connect(audioContextRef.current.destination)
    }
  }, [volume])

  const updateAudioData = useCallback(() => {
    if (!analyserRef.current) return

    const frequencyData = new Uint8Array(FREQUENCY_BIN_COUNT)
    const waveformData = new Uint8Array(WAVEFORM_BIN_COUNT)

    analyserRef.current.getByteFrequencyData(frequencyData)
    analyserRef.current.getByteTimeDomainData(waveformData)

    setFrequencyData(frequencyData)
    setWaveformData(waveformData)

    if (audioContextRef.current && isPlaying) {
      const elapsed = audioContextRef.current.currentTime - startTimeRef.current
      setCurrentTime(elapsed)

      if (audioBufferRef.current && elapsed >= audioBufferRef.current.duration) {
        setIsPlaying(false)
        setCurrentTime(audioBufferRef.current.duration)
        return
      }
    }

    animationFrameRef.current = requestAnimationFrame(updateAudioData)
  }, [isPlaying, setCurrentTime, setFrequencyData, setWaveformData, setIsPlaying])

  useEffect(() => {
    if (!audioFile) return

    initAudioContext()

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer
        if (!audioContextRef.current) return

        const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer)
        audioBufferRef.current = audioBuffer
        setDuration(audioBuffer.duration)
        setCurrentTime(0)
        pauseTimeRef.current = 0

        if (sourceRef.current) {
          sourceRef.current.stop()
          sourceRef.current.disconnect()
        }

        sourceRef.current = audioContextRef.current.createBufferSource()
        sourceRef.current.buffer = audioBuffer
        sourceRef.current.connect(analyserRef.current!)
      } catch (error) {
        console.error('音频解码失败:', error)
      }
    }
    reader.readAsArrayBuffer(audioFile)
  }, [audioFile, initAudioContext, setDuration, setCurrentTime])

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 100
    }
  }, [volume])

  useEffect(() => {
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(updateAudioData)
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, updateAudioData])

  const play = useCallback(() => {
    if (!audioContextRef.current || !audioBufferRef.current) return

    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume()
    }

    if (sourceRef.current) {
      sourceRef.current.stop()
      sourceRef.current.disconnect()
    }

    sourceRef.current = audioContextRef.current.createBufferSource()
    sourceRef.current.buffer = audioBufferRef.current
    sourceRef.current.connect(analyserRef.current!)

    const offset = pauseTimeRef.current
    sourceRef.current.start(0, offset)
    startTimeRef.current = audioContextRef.current.currentTime - offset
    setIsPlaying(true)
  }, [setIsPlaying])

  const pause = useCallback(() => {
    if (sourceRef.current && audioContextRef.current) {
      pauseTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current
      sourceRef.current.stop()
      setIsPlaying(false)
    }
  }, [setIsPlaying])

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }, [isPlaying, play, pause])

  const changeVolume = useCallback((v: number) => {
    setVolume(Math.max(0, Math.min(100, v)))
  }, [setVolume])

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (sourceRef.current) {
        try { sourceRef.current.stop() } catch (_e) { /* noop */ }
        sourceRef.current.disconnect()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  return {
    togglePlay,
    changeVolume,
  }
}
