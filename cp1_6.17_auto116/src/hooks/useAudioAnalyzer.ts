import { useRef, useCallback, useEffect } from 'react'
import { useAppStore } from '@/store/useAppStore'

export function useAudioAnalyzer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const frequencyDataRef = useRef<Uint8Array>(new Uint8Array(128))
  const timeDomainDataRef = useRef<Uint8Array>(new Uint8Array(128))
  const animationFrameRef = useRef<number | null>(null)

  const setAudioData = useAppStore((state) => state.setAudioData)
  const volume = useAppStore((state) => state.volume)
  const isPlaying = useAppStore((state) => state.isPlaying)

  const initializeAudioContext = useCallback(async () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      analyserRef.current.smoothingTimeConstant = 0.8

      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.gain.value = volume

      frequencyDataRef.current = new Uint8Array(analyserRef.current.frequencyBinCount)
      timeDomainDataRef.current = new Uint8Array(analyserRef.current.frequencyBinCount)
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }
  }, [volume])

  const connectAudioSource = useCallback(
    (audioElement: HTMLAudioElement) => {
      if (!audioContextRef.current || !analyserRef.current || !gainNodeRef.current) return

      if (sourceRef.current) {
        sourceRef.current.disconnect()
      }

      sourceRef.current = audioContextRef.current.createMediaElementSource(audioElement)
      sourceRef.current.connect(analyserRef.current)
      analyserRef.current.connect(gainNodeRef.current)
      gainNodeRef.current.connect(audioContextRef.current.destination)
    },
    [],
  )

  const updateAudioData = useCallback(() => {
    if (!analyserRef.current || !isPlaying) return

    analyserRef.current.getByteFrequencyData(frequencyDataRef.current)
    analyserRef.current.getByteTimeDomainData(timeDomainDataRef.current)

    setAudioData(new Uint8Array(frequencyDataRef.current), new Uint8Array(timeDomainDataRef.current))

    animationFrameRef.current = requestAnimationFrame(updateAudioData)
  }, [isPlaying, setAudioData])

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume
    }
  }, [volume])

  useEffect(() => {
    if (isPlaying && analyserRef.current) {
      updateAudioData()
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, updateAudioData])

  const loadAudioFile = useCallback(
    async (file: File) => {
      await initializeAudioContext()

      if (!audioRef.current) {
        audioRef.current = new Audio()
        audioRef.current.crossOrigin = 'anonymous'
      }

      const url = URL.createObjectURL(file)
      audioRef.current.src = url

      connectAudioSource(audioRef.current)

      return audioRef.current
    },
    [initializeAudioContext, connectAudioSource],
  )

  const play = useCallback(async () => {
    if (!audioRef.current || !audioContextRef.current) return

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume()
    }

    await audioRef.current.play()
  }, [])

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
  }, [])

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }, [])

  const getCurrentTime = useCallback(() => {
    return audioRef.current?.currentTime || 0
  }, [])

  const getDuration = useCallback(() => {
    return audioRef.current?.duration || 0
  }, [])

  const getSampleRate = useCallback(() => {
    return audioContextRef.current?.sampleRate || 44100
  }, [])

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect()
    }
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }
  }, [])

  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

  return {
    audioElement: audioRef.current,
    loadAudioFile,
    play,
    pause,
    seek,
    getCurrentTime,
    getDuration,
    getSampleRate,
    frequencyData: frequencyDataRef.current,
    timeDomainData: timeDomainDataRef.current,
    cleanup,
  }
}
