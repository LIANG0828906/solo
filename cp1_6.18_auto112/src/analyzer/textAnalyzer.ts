import { v4 as uuidv4 } from 'uuid'
import { SentimentResult, ReadabilityResult, AnalysisResult, SentenceSentiment } from '../types'

const POSITIVE_WORDS = new Set([
  'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'brilliant',
  'happy', 'joyful', 'love', 'loved', 'loving', 'beautiful', 'delightful', 'perfect',
  'awesome', 'outstanding', 'superb', 'pleasant', 'nice', 'wonderful', 'successful',
  'positive', 'cheerful', 'grateful', 'thankful', 'excited', 'enthusiastic', 'proud',
  'confident', 'hopeful', 'inspired', 'peaceful', 'calm', 'relaxed', 'satisfied',
  'best', 'better', 'enjoy', 'enjoyed', 'enjoying', 'fun', 'interesting', 'fascinating',
  'impressive', 'remarkable', 'exceptional', 'magnificent', 'splendid', 'marvelous',
  'glad', 'pleased', 'thrilled', 'ecstatic', 'content', 'blessed', 'fortunate',
  'like', 'liked', 'love', 'adore', 'admire', 'appreciate', 'celebrate', 'triumph',
  'victory', 'win', 'won', 'achieve', 'achieved', 'success', 'progress', 'improve'
])

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'awful', 'horrible', 'worst', 'worse', 'sad', 'unhappy',
  'angry', 'furious', 'hate', 'hated', 'hating', 'disappointing', 'disappointed',
  'frustrating', 'frustrated', 'annoying', 'annoyed', 'boring', 'bored', 'tired',
  'exhausted', 'stressed', 'anxious', 'worried', 'afraid', 'scared', 'fearful',
  'depressed', 'miserable', 'lonely', 'heartbroken', 'grief', 'sorrow', 'regret',
  'guilty', 'ashamed', 'embarrassed', 'humiliated', 'offended', 'insulted',
  'disgusted', 'nauseous', 'painful', 'suffering', 'crying', 'cried', 'tears',
  'fail', 'failed', 'failure', 'defeat', 'lost', 'lose', 'problem', 'issue',
  'mistake', 'error', 'fault', 'flaw', 'weakness', 'shortcoming', 'difficult',
  'hard', 'tough', 'challenging', 'demanding', 'impossible', 'hopeless', 'desperate',
  'ugly', 'nasty', 'mean', 'cruel', 'violent', 'aggressive', 'hostile', 'rude',
  'disrespectful', 'unfair', 'unjust', 'corrupt', 'evil', 'wicked', 'immoral'
])

const TONE_RULES: { pattern: RegExp; tone: string; weight: number }[] = [
  { pattern: /\b(haha|lol|lmao|rofl|funny|hilarious|joke|joking)\b/i, tone: '幽默', weight: 2 },
  { pattern: /\b(please|kindly|thank\s*you|sincerely|respectfully|dear\s+)\b/i, tone: '正式', weight: 1.5 },
  { pattern: /\b(angry|furious|mad|outraged|hate|damn|hell|shit|fuck|stupid|idiot)\b/i, tone: '愤怒', weight: 2.5 },
  { pattern: /\b(sad|unhappy|depressed|miserable|heartbroken|sorrow|grief|crying|tears|lonely)\b/i, tone: '悲伤', weight: 2 },
  { pattern: /\b(wow|amazing|incredible|unbelievable|oh\s+my|holy\s+)\b/i, tone: '惊讶', weight: 1.5 },
  { pattern: /\b(must|should|need\s+to|have\s+to|require|demand|mandatory)\b/i, tone: '命令', weight: 1.5 },
  { pattern: /\b(maybe|perhaps|possibly|might|could\s+be|not\s+sure|wondering)\b/i, tone: '犹豫', weight: 1.5 },
  { pattern: /\b(love|adore|beautiful|wonderful|perfect|sweet|lovely|charming)\b/i, tone: '温柔', weight: 2 },
  { pattern: /[!]{2,}/, tone: '激动', weight: 1.5 },
  { pattern: /\?{2,}/, tone: '疑惑', weight: 1 },
  { pattern: /\b(urgent|asap|immediately|right\s+now|instantly|promptly)\b/i, tone: '紧迫', weight: 1.5 },
  { pattern: /\b(sorry|apologize|forgive|regret|unfortunate)\b/i, tone: '歉意', weight: 2 }
]

const splitSentences = (text: string): string[] => {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (!cleaned) return []
  
  const sentences: string[] = []
  let current = ''
  
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]
    current += char
    
    if ((char === '.' || char === '!' || char === '?') && (i === cleaned.length - 1 || cleaned[i + 1] === ' ')) {
      const trimmed = current.trim()
      if (trimmed.length > 0) {
        sentences.push(trimmed)
      }
      current = ''
    }
  }
  
  if (current.trim().length > 0) {
    sentences.push(current.trim())
  }
  
  if (sentences.length === 0 && cleaned.length > 0) {
    sentences.push(cleaned)
  }
  
  return sentences
}

const countSyllables = (word: string): number => {
  const w = word.toLowerCase().replace(/[^a-z]/g, '')
  if (w.length <= 3) return 1
  
  let count = 0
  let prevVowel = false
  const vowels = 'aeiouy'
  
  for (let i = 0; i < w.length; i++) {
    const isVowel = vowels.includes(w[i])
    if (isVowel && !prevVowel) {
      count++
    }
    prevVowel = isVowel
  }
  
  if (w.endsWith('e') && count > 1) count--
  if (w.endsWith('le') && w.length > 2 && !vowels.includes(w[w.length - 3])) count++
  if (w.endsWith('ed') && w.length > 2 && !vowels.includes(w[w.length - 3])) count--
  
  return Math.max(1, count)
}

const tokenizeWords = (text: string): string[] => {
  return text.toLowerCase().match(/[a-z]+/g) || []
}

const calculateSentimentScore = (text: string): number => {
  const words = tokenizeWords(text)
  if (words.length === 0) return 0
  
  let score = 0
  const wordFreq = new Map<string, number>()
  
  for (const word of words) {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
  }
  
  let posCount = 0
  let negCount = 0
  
  for (const [word, freq] of wordFreq) {
    if (POSITIVE_WORDS.has(word)) {
      posCount += freq
      score += 2 * freq
    }
    if (NEGATIVE_WORDS.has(word)) {
      negCount += freq
      score -= 2 * freq
    }
  }
  
  if (text.includes('!')) score += 0.5
  if (/not\s+\w+/.test(text.toLowerCase())) score -= 1
  if (/\b(very|extremely|incredibly|absolutely)\b/.test(text.toLowerCase())) {
    score *= 1.3
  }
  
  const normalized = (score / Math.max(words.length, 1)) * 10
  return Math.max(-10, Math.min(10, normalized))
}

const detectToneTags = (text: string): string[] => {
  const toneScores = new Map<string, number>()
  
  for (const rule of TONE_RULES) {
    const matches = text.match(rule.pattern)
    if (matches) {
      const count = matches.length
      toneScores.set(rule.tone, (toneScores.get(rule.tone) || 0) + count * rule.weight)
    }
  }
  
  return Array.from(toneScores.entries())
    .sort((a, b) => b[1] - a[1])
    .filter(([, score]) => score >= 1)
    .slice(0, 3)
    .map(([tone]) => tone)
}

const calculateReadability = (text: string): ReadabilityResult => {
  const sentences = splitSentences(text)
  const words = tokenizeWords(text)
  
  const sentenceCount = Math.max(1, sentences.length)
  const wordCount = words.length
  
  let syllableCount = 0
  let totalWordLength = 0
  
  for (const word of words) {
    syllableCount += countSyllables(word)
    totalWordLength += word.length
  }
  
  const avgSentenceLength = wordCount / sentenceCount
  const avgSyllablesPerWord = wordCount > 0 ? syllableCount / wordCount : 0
  
  const fleschKincaid = 206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
  const clampedScore = Math.max(0, Math.min(100, fleschKincaid))
  
  let grade: string
  if (clampedScore >= 90) grade = '非常简单'
  else if (clampedScore >= 80) grade = '简单'
  else if (clampedScore >= 70) grade = '较易'
  else if (clampedScore >= 60) grade = '标准'
  else if (clampedScore >= 50) grade = '较难'
  else if (clampedScore >= 30) grade = '困难'
  else grade = '非常困难'
  
  return {
    fleschKincaid: parseFloat(clampedScore.toFixed(1)),
    fleschKincaidGrade: grade,
    wordCount,
    sentenceCount,
    syllableCount,
    avgWordLength: wordCount > 0 ? parseFloat((totalWordLength / wordCount).toFixed(2)) : 0
  }
}

export const analyzeSentiment = (text: string): SentimentResult => {
  const sentences = splitSentences(text)
  
  const analyzedSentences: SentenceSentiment[] = sentences.map(sentence => {
    const score = calculateSentimentScore(sentence)
    let label: 'positive' | 'negative' | 'neutral'
    if (score > 1) label = 'positive'
    else if (score < -1) label = 'negative'
    else label = 'neutral'
    
    return {
      id: uuidv4(),
      text: sentence,
      sentimentScore: parseFloat(score.toFixed(2)),
      sentimentLabel: label,
      toneTags: detectToneTags(sentence)
    }
  })
  
  const totalScore = analyzedSentences.reduce((sum, s) => sum + s.sentimentScore, 0)
  const overallScore = analyzedSentences.length > 0
    ? parseFloat((totalScore / analyzedSentences.length).toFixed(2))
    : 0
  
  return {
    sentences: analyzedSentences,
    overallScore
  }
}

export const analyzeText = (text: string): AnalysisResult => {
  return {
    sentiment: analyzeSentiment(text),
    readability: calculateReadability(text),
    timestamp: Date.now()
  }
}
