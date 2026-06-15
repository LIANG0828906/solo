import { EmotionTag, ALL_EMOTIONS } from './musicDB'

export const EMOJI_TO_EMOTION: Record<string, EmotionTag> = {
  '😀': 'happy', '😃': 'happy', '😄': 'happy', '😁': 'happy', '😆': 'happy',
  '😊': 'happy', '😇': 'happy', '🥰': 'romantic', '😍': 'romantic',
  '🤩': 'excited', '😎': 'excited', '🥳': 'excited', '🎉': 'excited',
  '😢': 'sad', '😭': 'sad', '😔': 'sad', '😞': 'sad', '🥺': 'sad',
  '😠': 'angry', '😡': 'angry', '🤬': 'angry', '👿': 'angry',
  '😌': 'calm', '😴': 'tired', '😪': 'tired', '🥱': 'tired',
  '😰': 'anxious', '😨': 'anxious', '😱': 'anxious', '😟': 'anxious',
  '🙂': 'happy', '🙃': 'happy', '😋': 'happy', '🤗': 'happy',
  '💔': 'sad', '❤️': 'romantic', '💕': 'romantic', '💖': 'romantic',
  '💪': 'excited', '🔥': 'angry', '⚡': 'excited', '🌈': 'happy',
  '🌙': 'calm', '☕': 'calm', '🧘': 'calm', '🛌': 'tired'
}

const FACE_PIXEL_RULES: Array<{ range: [number, number]; emotion: EmotionTag; weight: number }> = [
  { range: [200, 255], emotion: 'happy',   weight: 2.2 },
  { range: [170, 199], emotion: 'excited', weight: 1.8 },
  { range: [140, 169], emotion: 'romantic',weight: 1.5 },
  { range: [110, 139], emotion: 'calm',    weight: 2.0 },
  { range: [80, 109],  emotion: 'tired',   weight: 1.8 },
  { range: [50, 79],   emotion: 'anxious', weight: 1.6 },
  { range: [25, 49],   emotion: 'sad',     weight: 2.0 },
  { range: [0, 24],    emotion: 'angry',   weight: 1.7 }
]

export function detectFromEmoji(emoji: string): { primary: EmotionTag; tags: EmotionTag[]; confidence: number } {
  const trimmed = (emoji || '').trim()
  let direct = EMOJI_TO_EMOTION[trimmed]
  if (!direct) {
    for (const key of Object.keys(EMOJI_TO_EMOTION)) {
      if (trimmed.includes(key) || key.includes(trimmed)) {
        direct = EMOJI_TO_EMOTION[key]
        break
      }
    }
  }
  if (!direct) {
    const codeMap: Array<[RegExp, EmotionTag]> = [
      [/smile|happy|joy|laugh|blush|angel|\+1|thumbsup/i, 'happy'],
      [/love|heart|romance|kiss|couple|date/i, 'romantic'],
      [/excited|star|party|tada|sunglass|cool|rocket|boom/i, 'excited'],
      [/sad|cry|tear|disappointed|broken|hurt|pensive/i, 'sad'],
      [/angry|rage|mad|devil|imp|swear|hiss|fire/i, 'angry'],
      [/sleep|tired|yawn|sleepy|zzz|bed|teddy/i, 'tired'],
      [/fear|scared|shock|anxious|worry|sweat|cold|ohm|meditation|yoga|tea|coffee|moon|night/i, 'anxious'],
      [/calm|relieved|satisfied|peace|zen|breathe/i, 'calm']
    ]
    for (const [re, tag] of codeMap) {
      const cp = Array.from(trimmed).map(c => c.codePointAt(0)?.toString(16) || '').join(' ')
      if (re.test(trimmed) || re.test(cp)) { direct = tag; break }
    }
  }
  if (direct) {
    const secondary = pickSecondary(direct)
    return {
      primary: direct,
      tags: [direct, secondary],
      confidence: 0.88 + Math.random() * 0.1
    }
  }
  const fallback = ALL_EMOTIONS[Math.floor(Math.random() * ALL_EMOTIONS.length)]
  return {
    primary: fallback,
    tags: [fallback, pickSecondary(fallback)],
    confidence: 0.55
  }
}

function pickSecondary(primary: EmotionTag): EmotionTag {
  const adj: Record<EmotionTag, EmotionTag[]> = {
    happy:    ['excited', 'romantic', 'calm'],
    excited:  ['happy', 'angry', 'romantic'],
    romantic: ['happy', 'calm', 'excited'],
    calm:     ['tired', 'romantic', 'happy'],
    tired:    ['calm', 'sad', 'anxious'],
    sad:      ['tired', 'anxious', 'calm'],
    anxious:  ['tired', 'sad', 'calm'],
    angry:    ['excited', 'sad', 'anxious']
  }
  const pool = adj[primary] || ALL_EMOTIONS
  return pool[Math.floor(Math.random() * pool.length)]
}

export interface PixelSample {
  r: number
  g: number
  b: number
  brightness: number
}

export function analyzeBrightness(samples: PixelSample[]): { primary: EmotionTag; tags: EmotionTag[]; confidence: number } {
  if (!samples || samples.length === 0) {
    const fallback = ALL_EMOTIONS[Math.floor(Math.random() * ALL_EMOTIONS.length)]
    return { primary: fallback, tags: [fallback, pickSecondary(fallback)], confidence: 0.5 }
  }
  const avg = samples.reduce((s, p) => s + p.brightness, 0) / samples.length
  const scores: Record<EmotionTag, number> = {
    happy: 0, sad: 0, angry: 0, calm: 0, excited: 0, romantic: 0, tired: 0, anxious: 0
  }
  for (const rule of FACE_PIXEL_RULES) {
    if (avg >= rule.range[0] && avg <= rule.range[1]) {
      scores[rule.emotion] += rule.weight * 3
    } else {
      const dist = Math.min(Math.abs(avg - rule.range[0]), Math.abs(avg - rule.range[1]))
      scores[rule.emotion] += Math.max(0, rule.weight - dist / 40)
    }
  }
  const warmBias = samples.reduce((s, p) => s + (p.r - p.b), 0) / samples.length
  if (warmBias > 15) { scores.happy += 1.2; scores.romantic += 1.5; scores.angry += 0.8 }
  if (warmBias < -15) { scores.calm += 1.0; scores.sad += 1.2; scores.tired += 0.8 }

  const sorted = (Object.entries(scores) as Array<[EmotionTag, number]>)
    .sort((a, b) => b[1] - a[1])
  const primary = sorted[0][0]
  const secondary = sorted[1][0]
  const total = Object.values(scores).reduce((s, v) => s + v, 0)
  const confidence = Math.min(0.95, sorted[0][1] / total + 0.2)
  return { primary, tags: [primary, secondary], confidence }
}

export function mockImageAnalysis(imagePath?: string): { primary: EmotionTag; tags: EmotionTag[]; confidence: number } {
  const seed = imagePath ? hashString(imagePath) : Date.now()
  const idx = Math.floor(positiveMod(seed, ALL_EMOTIONS.length))
  const primary = ALL_EMOTIONS[idx]
  return {
    primary,
    tags: [primary, pickSecondary(primary)],
    confidence: 0.72 + (positiveMod(seed * 7, 25) / 100)
  }
}

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h
}
function positiveMod(n: number, m: number): number {
  return ((n % m) + m) % m
}
