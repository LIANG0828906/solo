import { useRef, useEffect, useCallback, useState } from 'react'
import * as Tone from 'tone'
import { useStore } from '../store'
import { TICKS_PER_BEAT, TOTAL_BEATS } from '../types'

interface UseMetronomeMixerReturn {
  togglePlay: () => Promise<void>
  handleSeek: (tick: number) => void
  analyserNode: AnalyserNode | null
}

export function useMetronomeMixer(): UseMetronomeMixerReturn {
  const { currentProject, isPlaying, setIsPlaying, setPlayheadTick } = useStore()
  const synthRef = useRef<Tone.PolySynth | null>(null)
  const metronomeRef = useRef<Tone.MembraneSynth | null>(null)
  const webAnalyserRef = useRef<AnalyserNode | null>(null)
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null)
  const lastTickRef = useRef<number>(-1)
  const audioInitRef = useRef(false)

  const initAudio = useCallback(async () => {
    if (audioInitRef.current) return
    await Tone.start()

    const ctx = Tone.getContext().rawContext as AudioContext
    const webAnalyser = ctx.createAnalyser()
    webAnalyser.fftSize = 2048
    webAnalyserRef.current = webAnalyser
    setAnalyserNode(webAnalyser)

    const masterGain = new Tone.Gain(0.8)
    const toneAnalyser = new Tone.Analyser('waveform', 2048)
    masterGain.connect(toneAnalyser)
    masterGain.toDestination()

    const destNode = Tone.getContext().rawContext.destination
    masterGain.connect(destNode as unknown as Tone.ToneAudioNode)

    const internalGain = (masterGain as unknown as { _gain: GainNode })._gain
    if (internalGain) {
      internalGain.connect(webAnalyser)
    } else {
      const rawGain = masterGain.output
      if (rawGain && 'connect' in rawGain) {
        ;(rawGain as unknown as AudioNode).connect(webAnalyser)
      }
    }

    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.2, release: 0.5 },
    })
    synth.connect(masterGain)

    const metronome = new Tone.MembraneSynth({
      pitchDecay: 0.01,
      octaves: 2,
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.1 },
    })
    metronome.connect(masterGain)

    synthRef.current = synth
    metronomeRef.current = metronome
    audioInitRef.current = true
  }, [])

  const scheduleNotes = useCallback(() => {
    if (!currentProject || !synthRef.current) return

    const bpm = currentProject.bpm
    Tone.getTransport().bpm.value = bpm
    Tone.getTransport().timeSignature = 4

    Tone.getTransport().cancel()
    Tone.getTransport().position = 0
    lastTickRef.current = -1

    const ticksPerBeat = TICKS_PER_BEAT
    const totalTicks = TOTAL_BEATS * ticksPerBeat

    currentProject.tracks.forEach((track) => {
      if (track.muted) return
      const hasSolo = currentProject.tracks.some((t) => t.solo)
      if (hasSolo && !track.solo) return

      const volume = track.volume / 100

      track.notes.forEach((note) => {
        const startTime = `${note.startTick}:${ticksPerBeat}i`
        const durationSeconds = (note.duration / ticksPerBeat) * (60 / bpm)
        const freq = Tone.Frequency(note.pitch, 'midi').toFrequency()

        Tone.getTransport().schedule((time) => {
          try {
            synthRef.current?.triggerAttackRelease(
              freq,
              Math.max(0.05, durationSeconds),
              time,
              volume * 0.7
            )
          } catch {}
        }, startTime)
      })
    })

    for (let beat = 0; beat < TOTAL_BEATS; beat++) {
      const startTime = `${beat * ticksPerBeat}:${ticksPerBeat}i`
      Tone.getTransport().schedule((time) => {
        try {
          metronomeRef.current?.triggerAttackRelease(
            beat % 4 === 0 ? 'C5' : 'C4',
            '32n',
            time,
            0.15
          )
        } catch {}
      }, startTime)
    }

    Tone.getTransport().scheduleRepeat((time) => {
      const pos = Tone.getTransport().ticks
      const currentTick = Math.floor(pos)
      if (currentTick !== lastTickRef.current) {
        lastTickRef.current = currentTick
        Tone.getDraw().schedule(() => {
          setPlayheadTick(currentTick)
        }, time)
      }
    }, '16n')

    Tone.getTransport().schedule(() => {
      Tone.getTransport().stop()
      setIsPlaying(false)
      setPlayheadTick(0)
    }, `${totalTicks}:${ticksPerBeat}i`)
  }, [currentProject, setPlayheadTick, setIsPlaying])

  useEffect(() => {
    if (!isPlaying) {
      Tone.getTransport().stop()
      Tone.getTransport().cancel()
      return
    }
    initAudio().then(() => {
      scheduleNotes()
      Tone.getTransport().start()
    })
  }, [isPlaying, initAudio, scheduleNotes])

  useEffect(() => {
    return () => {
      Tone.getTransport().stop()
      Tone.getTransport().cancel()
      synthRef.current?.dispose()
      metronomeRef.current?.dispose()
    }
  }, [])

  const togglePlay = useCallback(async () => {
    await initAudio()
    setIsPlaying(!isPlaying)
  }, [isPlaying, initAudio, setIsPlaying])

  const handleSeek = useCallback(
    (tick: number) => {
      if (isPlaying) {
        Tone.getTransport().ticks = tick
      }
      setPlayheadTick(tick)
    },
    [isPlaying, setPlayheadTick]
  )

  return { togglePlay, handleSeek, analyserNode }
}
