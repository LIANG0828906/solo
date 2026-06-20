import type { EffectConfig, EffectType } from '@/stores/projectStore'
import { clamp } from './wavEncoder'

export function buildEffectChain(
  ctx: AudioContext | OfflineAudioContext,
  source: AudioNode,
  effects: EffectConfig[],
  totalDuration: number
): AudioNode {
  let node: AudioNode = source
  for (const eff of effects) {
    node = applyEffect(ctx, node, eff, totalDuration)
  }
  return node
}

function applyEffect(
  ctx: AudioContext | OfflineAudioContext,
  input: AudioNode,
  effect: EffectConfig,
  totalDuration: number
): AudioNode {
  switch (effect.type) {
    case 'fadeIn':
    case 'fadeOut':
      return buildFade(ctx, input, effect, totalDuration)
    case 'echo':
      return buildEcho(ctx, input, effect)
    case 'lowpass':
    case 'highpass':
      return buildFilter(ctx, input, effect)
    default:
      return input
  }
}

function buildFade(
  ctx: AudioContext | OfflineAudioContext,
  input: AudioNode,
  effect: EffectConfig,
  totalDuration: number
): AudioNode {
  const gain = ctx.createGain()
  const duration = clamp(effect.params.duration ?? 0, 0, 3)
  if (effect.type === 'fadeIn') {
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(1, ctx.currentTime + duration)
  } else {
    gain.gain.setValueAtTime(1, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(
      0.0001,
      ctx.currentTime + Math.max(totalDuration, duration)
    )
  }
  input.connect(gain)
  return gain
}

function buildEcho(
  ctx: AudioContext | OfflineAudioContext,
  input: AudioNode,
  effect: EffectConfig
): AudioNode {
  const delayTime = clamp(effect.params.delay ?? 0.25, 0.1, 0.5)
  const feedback = clamp(effect.params.feedback ?? 0.4, 0, 0.8)

  const dry = ctx.createGain()
  const wet = ctx.createGain()
  const delay = ctx.createDelay(1.0)
  const fb = ctx.createGain()

  dry.gain.value = 1
  wet.gain.value = 0.5
  delay.delayTime.value = delayTime
  fb.gain.value = feedback

  input.connect(dry)
  input.connect(delay)
  delay.connect(fb)
  fb.connect(delay)
  delay.connect(wet)

  const out = ctx.createGain()
  dry.connect(out)
  wet.connect(out)
  return out
}

function buildFilter(
  ctx: AudioContext | OfflineAudioContext,
  input: AudioNode,
  effect: EffectConfig
): AudioNode {
  const filter = ctx.createBiquadFilter()
  filter.type = effect.type === 'lowpass' ? 'lowpass' : 'highpass'
  filter.frequency.value = clamp(effect.params.frequency ?? 1000, 20, 20000)
  filter.Q.value = 1
  input.connect(filter)
  return filter
}

export function buildPan(
  ctx: AudioContext | OfflineAudioContext,
  input: AudioNode,
  pan: number
): AudioNode {
  const p = clamp(pan, -1, 1)
  if ((ctx as any).createStereoPanner) {
    const panner = ctx.createStereoPanner()
    panner.pan.value = p
    input.connect(panner)
    return panner
  }
  const splitter = ctx.createChannelSplitter(2)
  const leftGain = ctx.createGain()
  const rightGain = ctx.createGain()
  const merger = ctx.createChannelMerger(2)
  const left = p <= 0 ? 1 : 1 - p
  const right = p >= 0 ? 1 : 1 + p
  leftGain.gain.value = left
  rightGain.gain.value = right
  input.connect(splitter)
  splitter.connect(leftGain, 0)
  splitter.connect(rightGain, 1)
  leftGain.connect(merger, 0, 0)
  rightGain.connect(merger, 0, 1)
  return merger
}

export function hasEffect(list: EffectConfig[], type: EffectType) {
  return list.find((e) => e.type === type)
}
