import { useState, useRef, useEffect, useCallback } from 'react'
import { Volume2, Sliders, Waves } from 'lucide-react'
import type { Song } from '@/types'

interface MixingConsoleProps {
  song: Song
  collaboratorName: string
}

export default function MixingConsole({ song, collaboratorName }: MixingConsoleProps) {
  const [volume, setVolume] = useState(75)
  const [bass, setBass] = useState(50)
  const [mid, setMid] = useState(50)
  const [treble, setTreble] = useState(50)
  const [reverb, setReverb] = useState(30)
  const [isPlaying, setIsPlaying] = useState(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)

  useEffect(() => {
    return () => {
      if (sourceRef.current) {
        try { sourceRef.current.stop() } catch {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const handlePlay = useCallback(async () => {
    if (!song.audioFile) return

    if (isPlaying) {
      if (sourceRef.current) {
        try { sourceRef.current.stop() } catch {}
      }
      setIsPlaying(false)
      return
    }

    try {
      const ctx = audioContextRef.current || new AudioContext()
      audioContextRef.current = ctx

      const response = await fetch(song.audioFile)
      const arrayBuffer = await response.arrayBuffer()
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      sourceRef.current = source

      const gainNode = ctx.createGain()
      gainNode.gain.value = volume / 100
      gainRef.current = gainNode

      source.connect(gainNode)
      gainNode.connect(ctx.destination)
      source.start()
      setIsPlaying(true)

      source.onended = () => setIsPlaying(false)
    } catch {}
  }, [isPlaying, song.audioFile, volume])

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.setValueAtTime(volume / 100, audioContextRef.current?.currentTime || 0)
    }
  }, [volume])

  const sliders = [
    { label: '音量', icon: Volume2, value: volume, setter: setVolume, color: 'from-brand-indigo to-brand-violet' },
    { label: '低频', icon: Waves, value: bass, setter: setBass, color: 'from-brand-indigo to-brand-purple' },
    { label: '中频', icon: Sliders, value: mid, setter: setMid, color: 'from-brand-violet to-brand-purple' },
    { label: '高频', icon: Waves, value: treble, setter: setTreble, color: 'from-brand-violet to-brand-indigo' },
    { label: '混响', icon: Sliders, value: reverb, setter: setReverb, color: 'from-brand-purple to-brand-indigo' },
  ]

  return (
    <div>
      <div className="text-center mb-6">
        <h3 className="font-display font-bold text-lg text-white">混音控制台</h3>
        <p className="text-gray-400 text-sm mt-1">与 {collaboratorName} 协作混音</p>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handlePlay}
          className="px-5 py-2 rounded-full gradient-bg text-white text-sm font-medium btn-press"
        >
          {isPlaying ? '暂停' : '播放'}
        </button>
        <span className="text-sm text-gray-400">{song.title}</span>
      </div>

      <div className="space-y-4">
        {sliders.map(({ label, icon: Icon, value, setter, color }) => (
          <div key={label} className="glass-card p-3">
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-300 w-10">{label}</span>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={value}
                  onChange={(e) => setter(Number(e.target.value))}
                  className="w-full"
                  style={{
                    background: `linear-gradient(90deg, var(--tw-gradient-from), var(--tw-gradient-to)) ${value}%, rgba(255,255,255,0.1) ${value}%`,
                  }}
                />
              </div>
              <span className="text-sm text-gray-400 w-8 text-right">{value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">你的调整</p>
          <p className="text-sm text-brand-violet font-medium">实时生效</p>
        </div>
        <div className="glass-card p-3 text-center">
          <p className="text-xs text-gray-400 mb-1">{collaboratorName} 的调整</p>
          <p className="text-sm text-brand-purple font-medium">等待中...</p>
        </div>
      </div>
    </div>
  )
}
