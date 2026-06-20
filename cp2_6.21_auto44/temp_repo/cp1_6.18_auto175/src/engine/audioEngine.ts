import type { Clip, Track, EffectConfig } from '@/stores/projectStore'
import { buildEffectChain, buildPan } from '@/utils/effects'
import { encodeWAV } from '@/utils/wavEncoder'
import { drawWaveformPreview } from './visualizerEngine'

export interface TrackAudioNodes {
  gain: GainNode
  pan: AudioNode
  input: GainNode
}

export interface BeatBuffer {
  buffer: AudioBuffer
  refKey: string
}

type OnPlayhead = (t: number) => void
type OnStop = () => void

export class AudioEngine {
  private ctx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private mainAnalyser: AnalyserNode | null = null
  private trackNodes: Map<string, TrackAudioNodes> = new Map()
  private bufferCache: Map<string, AudioBuffer> = new Map()
  private waveformCache: Map<string, string> = new Map()
  private activeSources: Array<{
    src: AudioBufferSourceNode
    endAt: number
  }> = []
  private startContextTime = 0
  private startUserTime = 0
  private playing = false
  private raf = 0
  private onPlayhead: OnPlayhead | null = null
  private onStop: OnStop | null = null
  private tracksGetter: () => Track[] = () => []
  private onMainAnalyserReady: ((a: AnalyserNode) => void) | null = null

  constructor(opts: {
    onPlayhead: OnPlayhead
    onStop: OnStop
    tracksGetter: () => Track[]
    onMainAnalyserReady?: (a: AnalyserNode) => void
  }) {
    this.onPlayhead = opts.onPlayhead
    this.onStop = opts.onStop
    this.tracksGetter = opts.tracksGetter
    this.onMainAnalyserReady = opts.onMainAnalyserReady ?? null
  }

  async ensureContext() {
    if (this.ctx) return this.ctx
    const Ctor: typeof AudioContext = (window.AudioContext || (window as any).webkitAudioContext)
    if (!Ctor) throw new Error('当前浏览器不支持 Web Audio API')
    this.ctx = new Ctor({ sampleRate: 44100, latencyHint: 'interactive' })
    this.masterGain = this.ctx.createGain()
    this.masterGain.gain.value = 0.9
    this.mainAnalyser = this.ctx.createAnalyser()
    this.masterGain.connect(this.mainAnalyser)
    this.mainAnalyser.connect(this.ctx.destination)
    if (this.onMainAnalyserReady && this.mainAnalyser) {
      this.onMainAnalyserReady(this.mainAnalyser)
    }
    if (this.ctx.state === 'suspended') {
      try { await this.ctx.resume() } catch (_e) { /* noop */ }
    }
    return this.ctx
  }

  getContext() { return this.ctx }
  getMainAnalyser() { return this.mainAnalyser }

  getCachedBuffer(key: string) { return this.bufferCache.get(key) }

  async decodeFile(file: File, key?: string): Promise<AudioBuffer> {
    await this.ensureContext()
    const arr = await file.arrayBuffer()
    const buf = await this.ctx!.decodeAudioData(arr.slice(0))
    const cacheKey = key ?? `file:${file.name}:${file.size}:${file.lastModified}`
    this.bufferCache.set(cacheKey, buf)
    return buf
  }

  async loadFromUrl(url: string, key?: string): Promise<AudioBuffer> {
    await this.ensureContext()
    const resp = await fetch(url)
    const arr = await resp.arrayBuffer()
    const buf = await this.ctx!.decodeAudioData(arr.slice(0))
    this.bufferCache.set(key ?? url, buf)
    return buf
  }

  cacheBuffer(key: string, buf: AudioBuffer) {
    this.bufferCache.set(key, buf)
  }

  buildOrGetWaveformDataUrl(buffer: AudioBuffer, cacheKey: string, trimStart = 0, trimEnd?: number): string {
    const fullKey = `${cacheKey}:${trimStart.toFixed(3)}:${(trimEnd ?? buffer.duration).toFixed(3)}`
    if (this.waveformCache.has(fullKey)) return this.waveformCache.get(fullKey)!
    const c = document.createElement('canvas')
    c.style.width = '400px'
    c.style.height = '60px'
    c.width = 400
    c.height = 60
    drawWaveformPreview(c, buffer, trimStart, trimEnd, 'rgba(255,255,255,0.75)')
    const url = c.toDataURL('image/png')
    this.waveformCache.set(fullKey, url)
    return url
  }

  ensureTrackNodes(track: Track): TrackAudioNodes {
    if (!this.ctx) throw new Error('no ctx')
    const existing = this.trackNodes.get(track.id)
    if (existing) return existing
    const input = this.ctx.createGain()
    const pan = buildPan(this.ctx, input, track.pan)
    const gain = this.ctx.createGain()
    gain.gain.value = track.muted ? 0 : track.volume
    pan.connect(gain)
    gain.connect(this.masterGain!)
    const nodes: TrackAudioNodes = { input, gain, pan }
    this.trackNodes.set(track.id, nodes)
    return nodes
  }

  setTrackVolume(id: string, v: number) {
    this.trackNodes.get(id)?.gain.gain.setTargetAtTime(v, this.ctx?.currentTime ?? 0, 0.01)
  }

  setTrackMuted(id: string, muted: boolean) {
    const track = this.tracksGetter().find((t) => t.id === id)
    const vol = muted ? 0 : (track?.volume ?? 0.8)
    this.trackNodes.get(id)?.gain.gain.setTargetAtTime(vol, this.ctx?.currentTime ?? 0, 0.01)
  }

  setTrackSolo(id: string, active: boolean) {
    const vol = active ? (this.tracksGetter().find((t) => t.id === id)?.volume ?? 0.8) : 0
    this.trackNodes.get(id)?.gain.gain.setTargetAtTime(vol, this.ctx?.currentTime ?? 0, 0.01)
  }

  setTrackPan(id: string, pan: number) {
    if (!this.ctx) return
    const nodes = this.trackNodes.get(id)
    if (!nodes) return
    try {
      nodes.input.disconnect()
    } catch (_e) { /* noop */ }
    const newPan = buildPan(this.ctx, nodes.input, pan)
    try {
      (nodes.pan as any).disconnect?.()
    } catch (_e) { /* noop */ }
    nodes.pan = newPan
    newPan.connect(nodes.gain)
  }

  setMasterVolume(v: number) {
    this.masterGain?.gain.setTargetAtTime(v, this.ctx?.currentTime ?? 0, 0.01)
  }

  async generateBeatBuffer(bpm: number): Promise<BeatBuffer> {
    await this.ensureContext()
    const ctx = this.ctx!
    const spb = 60 / bpm
    const bars = 4
    const totalBeats = bars * 4
    const duration = totalBeats * spb
    const sampleRate = ctx.sampleRate
    const buffer = ctx.createBuffer(2, Math.ceil(duration * sampleRate), sampleRate)
    const L = buffer.getChannelData(0)
    const R = buffer.getChannelData(1)

    function synthKick(out: Float32Array, startSample: number, length: number) {
      const base = 130
      const end = 45
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate
        const freq = base + (end - base) * (1 - Math.exp(-t * 30))
        const env = Math.exp(-t * 20)
        const s = Math.sin(2 * Math.PI * freq * t) * env * 0.9
        const idx = startSample + i
        if (idx < out.length) out[idx] = s
      }
    }

    function synthSnare(out: Float32Array, startSample: number, length: number) {
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate
        const tone = Math.sin(2 * Math.PI * 200 * t) * 0.4
        const noise = (Math.random() * 2 - 1) * 0.7
        const env = Math.exp(-t * 12)
        const s = (tone + noise) * env * 0.7
        const idx = startSample + i
        if (idx < out.length) out[idx] = s
      }
    }

    for (let b = 0; b < totalBeats; b++) {
      const beatStart = b * spb
      const sample = Math.floor(beatStart * sampleRate)
      const isDownbeat = b % 4 === 0
      const isSnare = b % 4 === 2
      const kickLen = Math.floor(0.18 * sampleRate)
      if (isDownbeat) {
        synthKick(L, sample, kickLen)
        synthKick(R, sample, kickLen)
      } else {
        const softKickLen = Math.floor(0.12 * sampleRate)
        const start = b % 4 === 1 || b % 4 === 3 ? softKickLen : kickLen
        synthKick(L, sample, Math.min(start, kickLen))
        synthKick(R, sample, Math.min(start, kickLen))
      }
      if (isSnare) {
        const snareLen = Math.floor(0.2 * sampleRate)
        synthSnare(L, sample, snareLen)
        synthSnare(R, sample, snareLen)
      }
    }

    const refKey = `beat:${bpm}:${bars}`
    this.cacheBuffer(refKey, buffer)
    return { buffer, refKey }
  }

  seek(_t: number) {
    if (this.playing) {
      this.stopPlayback()
    }
  }

  startPlayback(fromSeconds: number) {
    if (!this.ctx) return
    const ctx = this.ctx
    if (ctx.state === 'suspended') ctx.resume()

    const tracks = this.tracksGetter()
    const anySolo = tracks.some((t) => t.solo)

    this.disposeActive()
    this.startContextTime = ctx.currentTime + 0.02
    this.startUserTime = fromSeconds

    let latestEnd = this.startContextTime
    for (const track of tracks) {
      const soloEffective = anySolo ? track.solo : true
      if (track.muted || !soloEffective) continue
      const nodes = this.ensureTrackNodes(track)
      nodes.gain.gain.setTargetAtTime(track.volume, ctx.currentTime, 0.01)
      for (const clip of track.clips) {
        const buffer = this.resolveBufferForClip(clip)
        if (!buffer) continue
        const clipDuration = clip.trimEnd - clip.trimStart
        const offsetInSession = clip.startAt
        const startInContext = this.startContextTime + (offsetInSession - fromSeconds)
        if (startInContext + 0.001 < ctx.currentTime) continue
        try {
          const source = ctx.createBufferSource()
          source.buffer = buffer
          const clipGain = ctx.createGain()
          let outNode: AudioNode = source
          if (clip.effects.length > 0) {
            outNode = buildEffectChain(ctx, source, clip.effects, clipDuration)
          }
          outNode.connect(clipGain)
          clipGain.connect(nodes.input)
          const offsetSrc = Math.max(0, fromSeconds - offsetInSession) + clip.trimStart
          const playLen = Math.max(0, clipDuration - Math.max(0, fromSeconds - offsetInSession))
          if (playLen <= 0) continue
          source.start(Math.max(ctx.currentTime + 0.001, startInContext), offsetSrc, playLen)
          const endCtx = startInContext + playLen
          source.stop(endCtx + 0.05)
          latestEnd = Math.max(latestEnd, endCtx)
          this.activeSources.push({ src: source, endAt: endCtx })
        } catch (e) {
          console.warn('start clip error', e)
        }
      }
    }

    this.playing = true
    this.tick()

    const totalMs = Math.max(200, (latestEnd - ctx.currentTime) * 1000)
    setTimeout(() => {
      if (this.playing) {
        const now = ctx.currentTime
        const allDone = this.activeSources.every((s) => s.endAt <= now + 0.05)
        if (allDone) this.stopPlayback(true)
      }
    }, totalMs + 200)
  }

  private resolveBufferForClip(clip: Clip): AudioBuffer | null {
    if (clip.isBeat) {
      if (clip.audioBufferRef && this.bufferCache.has(clip.audioBufferRef)) {
        return this.bufferCache.get(clip.audioBufferRef)!
      }
      return null
    }
    if (clip.audioBufferRef && this.bufferCache.has(clip.audioBufferRef)) {
      return this.bufferCache.get(clip.audioBufferRef)!
    }
    if (clip.audioUrl && this.bufferCache.has(clip.audioUrl)) {
      return this.bufferCache.get(clip.audioUrl)!
    }
    return null
  }

  stopPlayback(reachedEnd = false) {
    this.playing = false
    if (this.raf) cancelAnimationFrame(this.raf)
    this.raf = 0
    this.disposeActive()
    if (this.onStop && reachedEnd) this.onStop()
  }

  private disposeActive() {
    const ctx = this.ctx
    const now = ctx?.currentTime ?? 0
    for (const s of this.activeSources) {
      try {
        s.src.stop(now + 0.02)
      } catch (_e) { /* noop */ }
      try { s.src.disconnect() } catch (_e) { /* noop */ }
    }
    this.activeSources = []
  }

  private tick = () => {
    if (!this.playing || !this.ctx) return
    const elapsed = this.ctx.currentTime - this.startContextTime
    const current = this.startUserTime + elapsed
    if (this.onPlayhead) this.onPlayhead(current)
    this.raf = requestAnimationFrame(this.tick)
  }

  async renderOffline(
    getState: () => { tracks: Track[]; masterVolume: number }
  ): Promise<Blob> {
    await this.ensureContext()
    const { tracks, masterVolume } = getState()
    let maxDur = 0
    for (const t of tracks) {
      for (const c of t.clips) {
        const end = c.startAt + (c.trimEnd - c.trimStart)
        if (end > maxDur) maxDur = end
      }
    }
    const duration = Math.max(1, maxDur + 0.5)
    const sampleRate = 44100
    const offline = new OfflineAudioContext(2, Math.ceil(duration * sampleRate), sampleRate)

    const master = offline.createGain()
    master.gain.value = masterVolume
    master.connect(offline.destination)

    const anySolo = tracks.some((t) => t.solo)
    for (const track of tracks) {
      const vol = track.muted ? 0 : (anySolo ? (track.solo ? track.volume : 0) : track.volume)
      const input = offline.createGain()
      const panned = buildPan(offline, input, track.pan)
      const gain = offline.createGain()
      gain.gain.value = vol
      panned.connect(gain)
      gain.connect(master)

      for (const clip of track.clips) {
        const buf = this.resolveBufferForClip(clip)
        if (!buf) continue
        const src = offline.createBufferSource()
        const clipBuf = offline.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate)
        for (let c = 0; c < buf.numberOfChannels; c++) {
          clipBuf.copyToChannel(buf.getChannelData(c), c)
        }
        src.buffer = clipBuf
        let node: AudioNode = src
        const playLen = clip.trimEnd - clip.trimStart
        if (clip.effects.length > 0) {
          node = buildOfflineEffectChain(offline, src, clip.effects, playLen)
        }
        const clipGain = offline.createGain()
        node.connect(clipGain)
        clipGain.connect(input)
        const offsetCtx = clip.startAt
        src.start(offsetCtx, clip.trimStart, playLen)
        src.stop(offsetCtx + playLen + 0.05)
      }
    }

    const result = await offline.startRendering()
    return encodeWAV(result, 44100, 16)
  }

  dispose() {
    this.stopPlayback()
    for (const k of this.trackNodes.keys()) {
      const n = this.trackNodes.get(k)
      try { n?.gain.disconnect() } catch (_e) {}
      try { n?.input.disconnect() } catch (_e) {}
    }
    this.trackNodes.clear()
    try { this.masterGain?.disconnect() } catch (_e) {}
    try { this.mainAnalyser?.disconnect() } catch (_e) {}
    try { this.ctx?.close() } catch (_e) {}
    this.ctx = null
  }
}

function buildOfflineEffectChain(
  ctx: OfflineAudioContext,
  source: AudioNode,
  effects: EffectConfig[],
  totalDur: number
): AudioNode {
  let node: AudioNode = source
  for (const eff of effects) {
    node = applyOffline(ctx, node, eff, totalDur)
  }
  return node
}

function applyOffline(
  ctx: OfflineAudioContext,
  input: AudioNode,
  eff: EffectConfig,
  totalDur: number
): AudioNode {
  switch (eff.type) {
    case 'fadeIn': {
      const g = ctx.createGain()
      const d = Math.min(3, Math.max(0, eff.params.duration ?? 0))
      g.gain.setValueAtTime(0, 0)
      g.gain.linearRampToValueAtTime(1, d)
      input.connect(g); return g
    }
    case 'fadeOut': {
      const g = ctx.createGain()
      const d = Math.min(3, Math.max(0, eff.params.duration ?? 0))
      const start = Math.max(0, totalDur - d)
      g.gain.setValueAtTime(1, start)
      g.gain.linearRampToValueAtTime(0.0001, totalDur)
      input.connect(g); return g
    }
    case 'echo': {
      const delayTime = Math.max(0.1, Math.min(0.5, eff.params.delay ?? 0.25))
      const feedback = Math.max(0, Math.min(0.8, eff.params.feedback ?? 0.4))
      const dry = ctx.createGain()
      const wet = ctx.createGain()
      const delay = ctx.createDelay(1.0)
      const fb = ctx.createGain()
      dry.gain.value = 1; wet.gain.value = 0.5
      delay.delayTime.value = delayTime
      fb.gain.value = feedback
      input.connect(dry); input.connect(delay)
      delay.connect(fb); fb.connect(delay); delay.connect(wet)
      const out = ctx.createGain()
      dry.connect(out); wet.connect(out)
      input.connect(out)
      try { input.disconnect(dry); input.disconnect(delay) } catch (_e) {}
      input.connect(dry); input.connect(delay)
      return out
    }
    case 'lowpass':
    case 'highpass': {
      const f = ctx.createBiquadFilter()
      f.type = eff.type === 'lowpass' ? 'lowpass' : 'highpass'
      f.frequency.value = Math.max(20, Math.min(20000, eff.params.frequency ?? 1000))
      f.Q.value = 1
      input.connect(f); return f
    }
    default: return input
  }
}
