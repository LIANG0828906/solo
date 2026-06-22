import { useState, useRef, useEffect, useCallback } from 'react'
import { Volume2, Sliders, Waves, Crown, User, SwitchCamera, CheckCircle2 } from 'lucide-react'
import type { Song } from '@/types'

interface MixingParams {
  volume: number
  bass: number
  mid: number
  treble: number
  reverb: number
}

interface MixingConsoleProps {
  song: Song
  collaboratorName: string
}

type ParticipantRole = 'host' | 'collaborator'

export default function MixingConsole({ song, collaboratorName }: MixingConsoleProps) {
  const [params, setParams] = useState<MixingParams>({
    volume: 75,
    bass: 50,
    mid: 50,
    treble: 50,
    reverb: 30,
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTurn, setCurrentTurn] = useState<ParticipantRole>('host')
  const [turnCount, setTurnCount] = useState(1)
  const [history, setHistory] = useState<Array<{ role: ParticipantRole; param: string; value: number; timestamp: Date }>>([])
  const [hostName] = useState('你')
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<AudioBufferSourceNode | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const bassFilterRef = useRef<BiquadFilterNode | null>(null)
  const midFilterRef = useRef<BiquadFilterNode | null>(null)
  const trebleFilterRef = useRef<BiquadFilterNode | null>(null)
  const convolverRef = useRef<ConvolverNode | null>(null)
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null)
  const isHost = true

  useEffect(() => {
    const channel = new BroadcastChannel(`mixing_${song.id}`)
    broadcastChannelRef.current = channel

    channel.onmessage = (event) => {
      if (event.data.type === 'PARAM_UPDATE' && event.data.role !== 'host') {
        setParams(prev => ({ ...prev, [event.data.param]: event.data.value }))
        applyAudioParam(event.data.param, event.data.value)
      } else if (event.data.type === 'TURN_CHANGE') {
        setCurrentTurn(event.data.turn)
      } else if (event.data.type === 'TURN_END') {
        setCurrentTurn('host')
        setTurnCount(prev => prev + 1)
      }
    }

    return () => {
      channel.close()
      if (sourceRef.current) {
        try { sourceRef.current.stop() } catch {}
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [song.id])

  const applyAudioParam = useCallback((param: string, value: number) => {
    if (!audioContextRef.current) return
    const ctx = audioContextRef.current

    switch (param) {
      case 'volume':
        if (gainRef.current) {
          gainRef.current.gain.setTargetAtTime(value / 100, ctx.currentTime, 0.1)
        }
        break
      case 'bass':
        if (bassFilterRef.current) {
          bassFilterRef.current.gain.setTargetAtTime((value - 50) * 0.4, ctx.currentTime, 0.1)
        }
        break
      case 'mid':
        if (midFilterRef.current) {
          midFilterRef.current.gain.setTargetAtTime((value - 50) * 0.4, ctx.currentTime, 0.1)
        }
        break
      case 'treble':
        if (trebleFilterRef.current) {
          trebleFilterRef.current.gain.setTargetAtTime((value - 50) * 0.4, ctx.currentTime, 0.1)
        }
        break
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
      gainNode.gain.value = params.volume / 100
      gainRef.current = gainNode

      const bassFilter = ctx.createBiquadFilter()
      bassFilter.type = 'lowshelf'
      bassFilter.frequency.value = 250
      bassFilter.gain.value = (params.bass - 50) * 0.4
      bassFilterRef.current = bassFilter

      const midFilter = ctx.createBiquadFilter()
      midFilter.type = 'peaking'
      midFilter.frequency.value = 2000
      midFilter.gain.value = (params.mid - 50) * 0.4
      midFilterRef.current = midFilter

      const trebleFilter = ctx.createBiquadFilter()
      trebleFilter.type = 'highshelf'
      trebleFilter.frequency.value = 4000
      trebleFilter.gain.value = (params.treble - 50) * 0.4
      trebleFilterRef.current = trebleFilter

      const convolver = ctx.createConvolver()
      const impulseLen = ctx.sampleRate * 2
      const impulse = ctx.createBuffer(2, impulseLen, ctx.sampleRate)
      for (let ch = 0; ch < 2; ch++) {
        const chData = impulse.getChannelData(ch)
        for (let i = 0; i < impulseLen; i++) {
          chData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / impulseLen, 2)
        }
      }
      convolver.buffer = impulse
      convolverRef.current = convolver

      const wetGain = ctx.createGain()
      wetGain.gain.value = params.reverb / 100 * 0.3
      const dryGain = ctx.createGain()
      dryGain.gain.value = 1 - params.reverb / 100 * 0.3

      source.connect(bassFilter)
      bassFilter.connect(midFilter)
      midFilter.connect(trebleFilter)
      trebleFilter.connect(gainNode)
      gainNode.connect(dryGain)
      gainNode.connect(convolver)
      convolver.connect(wetGain)
      dryGain.connect(ctx.destination)
      wetGain.connect(ctx.destination)

      source.start()
      setIsPlaying(true)

      source.onended = () => setIsPlaying(false)
    } catch {}
  }, [isPlaying, song.audioFile, params])

  const handleParamChange = (param: keyof MixingParams, value: number) => {
    if (currentTurn !== 'host' || !isHost) return

    setParams(prev => ({ ...prev, [param]: value }))
    applyAudioParam(param, value)

    setHistory(prev => [
      ...prev,
      { role: 'host', param, value, timestamp: new Date() }
    ])

    broadcastChannelRef.current?.postMessage({
      type: 'PARAM_UPDATE',
      role: 'host',
      param,
      value,
    })
  }

  const endTurn = () => {
    if (currentTurn !== 'host') return
    setCurrentTurn('collaborator')
    setTurnCount(prev => prev + 1)
    broadcastChannelRef.current?.postMessage({
      type: 'TURN_CHANGE',
      turn: 'collaborator',
    })

    setTimeout(() => {
      setCurrentTurn('host')
      setTurnCount(prev => prev + 1)
      broadcastChannelRef.current?.postMessage({
        type: 'TURN_CHANGE',
        turn: 'host',
      })
    }, 15000)
  }

  const sliders: Array<{
    label: string
    icon: typeof Volume2
    param: keyof MixingParams
    color: string
  }> = [
    { label: '音量', icon: Volume2, param: 'volume', color: 'from-brand-indigo to-brand-violet' },
    { label: '低频', icon: Waves, param: 'bass', color: 'from-brand-indigo to-brand-purple' },
    { label: '中频', icon: Sliders, param: 'mid', color: 'from-brand-violet to-brand-purple' },
    { label: '高频', icon: Waves, param: 'treble', color: 'from-brand-violet to-brand-indigo' },
    { label: '混响', icon: Sliders, param: 'reverb', color: 'from-brand-purple to-brand-indigo' },
  ]

  const canEdit = currentTurn === 'host'

  return (
    <div>
      <div className="text-center mb-6">
        <h3 className="font-display font-bold text-lg text-white">混音控制台</h3>
        <p className="text-gray-400 text-sm mt-1">与 {collaboratorName} 协作混音</p>
      </div>

      <div className="glass-card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SwitchCamera className="w-4 h-4 text-brand-violet" />
            <span className="text-sm text-gray-300">第 {turnCount} 轮</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${
            canEdit
              ? 'bg-green-500/20 text-green-400'
              : 'bg-orange-500/20 text-orange-400'
          }`}>
            {canEdit ? (
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                你的回合
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                对方调整中...
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3 rounded-lg ${canEdit ? 'bg-brand-indigo/20 border border-brand-indigo/30' : 'bg-white/5'}`}>
            <div className="flex items-center gap-2 mb-1">
              <Crown className={`w-3 h-3 ${canEdit ? 'text-brand-violet' : 'text-gray-500'}`} />
              <span className="text-xs text-gray-300">{hostName} (你)</span>
            </div>
            <p className={`text-xs ${canEdit ? 'text-brand-violet' : 'text-gray-500'}`}>
              {canEdit ? '操作权限' : '等待中'}
            </p>
          </div>
          <div className={`p-3 rounded-lg ${!canEdit ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-white/5'}`}>
            <div className="flex items-center gap-2 mb-1">
              <User className={`w-3 h-3 ${!canEdit ? 'text-orange-400' : 'text-gray-500'}`} />
              <span className="text-xs text-gray-300">{collaboratorName}</span>
            </div>
            <p className={`text-xs ${!canEdit ? 'text-orange-400' : 'text-gray-500'}`}>
              {!canEdit ? '操作权限' : '等待中'}
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={endTurn}
            className="w-full mt-3 py-2 rounded-lg bg-brand-violet/20 text-brand-purple text-sm font-medium btn-press hover:bg-brand-violet/30 transition-colors"
          >
            结束我的回合
          </button>
        )}
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
        {sliders.map(({ label, icon: Icon, param }) => (
          <div key={label} className="glass-card p-3">
            <div className="flex items-center gap-3">
              <Icon className={`w-4 h-4 flex-shrink-0 ${canEdit ? 'text-gray-400' : 'text-gray-600'}`} />
              <span className={`text-sm w-10 ${canEdit ? 'text-gray-300' : 'text-gray-600'}`}>{label}</span>
              <div className="flex-1 relative">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={params[param]}
                  onChange={(e) => handleParamChange(param, Number(e.target.value))}
                  disabled={!canEdit}
                  className={`w-full ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                  style={{
                    background: `linear-gradient(90deg, var(--tw-gradient-from), var(--tw-gradient-to)) ${params[param]}%, rgba(255,255,255,0.1) ${params[param]}%`,
                  }}
                />
              </div>
              <span className={`text-sm w-8 text-right ${canEdit ? 'text-gray-400' : 'text-gray-600'}`}>{params[param]}</span>
            </div>
          </div>
        ))}
      </div>

      {history.length > 0 && (
        <div className="mt-6 glass-card p-3">
          <p className="text-xs text-gray-400 mb-2">操作记录</p>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {history.slice(-5).reverse().map((h, i) => (
              <div key={i} className="text-xs flex justify-between text-gray-500">
                <span className="text-gray-400">
                  {h.role === 'host' ? hostName : collaboratorName}
                </span>
                <span>调整 {h.param} 为 {h.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
