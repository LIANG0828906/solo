import { useState, useCallback, useMemo } from 'react'
import QuizCard from './QuizCard'
import ResultCard from './ResultCard'

interface Question {
  id: number
  text: string
  options: { text: string }[]
}

interface PersonalityResult {
  title: string
  description: string
}

type Stage = 'welcome' | 'quiz' | 'result'

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: '周末闲暇时，你更倾向于？',
    options: [
      { text: '约三五好友出门聚会' },
      { text: '宅在家享受独处时光' },
    ],
  },
  {
    id: 2,
    text: '做决定时，你更依赖？',
    options: [
      { text: '逻辑分析与数据' },
      { text: '直觉与内心感受' },
    ],
  },
  {
    id: 3,
    text: '面对新环境，你通常？',
    options: [
      { text: '快速融入，主动结交朋友' },
      { text: '观察等待，慢慢适应' },
    ],
  },
  {
    id: 4,
    text: '处理任务时，你偏好？',
    options: [
      { text: '制定详细计划并严格执行' },
      { text: '灵活应对，随机应变' },
    ],
  },
  {
    id: 5,
    text: '面对困难挑战，你的态度是？',
    options: [
      { text: '迎难而上，享受突破的快感' },
      { text: '稳扎稳打，寻求最优解' },
    ],
  },
]

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 102, g: 126, b: 234 }
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      })
      .join('')
  )
}

function lerpColor(
  color1: string,
  color2: string,
  t: number
): { r: number; g: number; b: number } {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)
  return {
    r: c1.r + (c2.r - c1.r) * t,
    g: c1.g + (c2.g - c1.g) * t,
    b: c1.b + (c2.b - c1.b) * t,
  }
}

function generateGradientFromAnswers(answers: number[]): string[] {
  const baseColors = [
    '#667eea',
    '#f093fb',
    '#4facfe',
    '#43e97b',
    '#fa709a',
    '#30cfd0',
    '#ff9a9e',
    '#fbc2eb',
  ]

  let hash = 0
  answers.forEach((ans, idx) => {
    hash = (hash * 31 + ans * 17 + idx * 13) >>> 0
  })

  const startIdx = hash % baseColors.length
  const endIdx = (hash >> 3) % baseColors.length
  const offset1 = (hash & 0xff) / 255
  const offset2 = ((hash >> 8) & 0xff) / 255

  const startColor = lerpColor(
    baseColors[startIdx],
    baseColors[(startIdx + 1) % baseColors.length],
    offset1
  )
  const endColor = lerpColor(
    baseColors[endIdx],
    baseColors[(endIdx + 2) % baseColors.length],
    offset2
  )

  const hueShift = (hash % 40) - 20
  const satBoost = ((hash >> 5) & 0x0f) * 3

  const adjustColor = (c: { r: number; g: number; b: number }) => {
    const avg = (c.r + c.g + c.b) / 3
    return {
      r: c.r + (c.r - avg) * (satBoost / 100),
      g: c.g + (c.g - avg) * (satBoost / 100),
      b: c.b + (c.b - avg) * (satBoost / 100),
    }
  }

  const s = adjustColor(startColor)
  const e = adjustColor(endColor)

  return [rgbToHex(s.r, s.g, s.b), rgbToHex(e.r, e.g, e.b)]
}

const PERSONALITY_RESULTS: PersonalityResult[] = [
  {
    title: '热情探索者',
    description:
      '你是一个充满活力的人，喜欢结交新朋友，对世界充满好奇。你的热情感染着周围的每一个人，是团队中的气氛担当。在探索未知的道路上，你永远不知疲倦。',
  },
  {
    title: '深邃思考家',
    description:
      '你喜欢独处，享受与内心对话的时光。深刻的洞察力让你总能看到别人忽略的细节，思维缜密是你最大的优势。你用独特的视角理解这个世界。',
  },
  {
    title: '理性建筑师',
    description:
      '逻辑和秩序是你信奉的准则。你擅长规划，凡事都追求井井有条。在混乱中你总能找到清晰的路径，是身边人最可靠的依赖和支持。',
  },
  {
    title: '灵动艺术家',
    description:
      '你拥有敏锐的感知力和丰富的想象力。你的世界充满色彩和诗意，总能从平凡中发现美。创意是你的超能力，让生活处处充满惊喜。',
  },
  {
    title: '勇敢开拓者',
    description:
      '你不畏惧挑战，敢于踏出舒适区。你的勇气和决断力让你在人群中脱颖而出。你是天生的领导者，用行动激励身边的人一起前行。',
  },
  {
    title: '温和守护者',
    description:
      '你沉稳可靠，是朋友们最温暖的港湾。你的耐心和包容让人感到安心，你默默地守护着身边重要的人，用温柔的力量改变世界。',
  },
  {
    title: '阳光社交家',
    description:
      '你天生善于与人沟通，无论走到哪里都能成为焦点。你的正能量像阳光一样温暖，身边总不缺欢声笑语。你是连接人与人之间的桥梁。',
  },
  {
    title: '内省梦想家',
    description:
      '你心中有一片广阔的星空，喜欢构筑属于自己的精神世界。你浪漫而理想主义，对未来总是抱有美好的期待。你的梦想会带你去往很远的地方。',
  },
]

interface Bubble {
  id: number
  size: number
  left: number
  delay: number
  duration: number
}

function generateBubbles(count: number): Bubble[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    size: Math.random() * 60 + 20,
    left: Math.random() * 100,
    delay: Math.random() * 10,
    duration: Math.random() * 10 + 15,
  }))
}

export default function App() {
  const [stage, setStage] = useState<Stage>('welcome')
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [resultTitle, setResultTitle] = useState('')
  const [resultDescription, setResultDescription] = useState('')
  const [resultColors, setResultColors] = useState<string[]>(['#667eea', '#764ba2'])
  const [gradientDirection, setGradientDirection] = useState(0)

  const bubbles = useMemo(() => generateBubbles(18), [])

  const computeResult = useCallback((userAnswers: number[]) => {
    const score = userAnswers.reduce((sum, ans) => sum + ans, 0)

    let comboHash = 0
    userAnswers.forEach((ans, idx) => {
      comboHash = (comboHash << 1) | ans
      comboHash = (comboHash * 31 + idx * 7 + ans * 13) >>> 0
    })

    const personalityIndex = score % PERSONALITY_RESULTS.length
    const result = PERSONALITY_RESULTS[personalityIndex]
    const colors = generateGradientFromAnswers(userAnswers)

    setResultTitle(result.title)
    setResultDescription(result.description)
    setResultColors(colors)
    setGradientDirection(comboHash % 4)
  }, [])

  const handleStart = useCallback(() => {
    setStage('quiz')
    setCurrentQuestion(0)
    setAnswers([])
  }, [])

  const handleAnswer = useCallback(
    (optionIndex: number) => {
      const newAnswers = [...answers, optionIndex]
      setAnswers(newAnswers)

      if (currentQuestion < QUESTIONS.length - 1) {
        setTimeout(() => {
          setCurrentQuestion((prev) => prev + 1)
        }, 100)
      } else {
        computeResult(newAnswers)
        setTimeout(() => {
          setStage('result')
        }, 100)
      }
    },
    [answers, currentQuestion, computeResult]
  )

  const handleRestart = useCallback(() => {
    setStage('welcome')
    setCurrentQuestion(0)
    setAnswers([])
  }, [])

  return (
    <>
      <div className="bubble-container">
        {bubbles.map((b) => (
          <div
            key={b.id}
            className="bubble"
            style={{
              width: `${b.size}px`,
              height: `${b.size}px`,
              left: `${b.left}%`,
              animationDelay: `${b.delay}s`,
              animationDuration: `${b.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="app">
        {stage === 'welcome' && (
          <div className="glass-card card-enter">
            <div className="welcome-icon">✨</div>
            <h1 className="welcome-title">趣味性格测试</h1>
            <p className="welcome-subtitle">
              通过 5 道简单选择题
              <br />
              发现你的独特性格特质
            </p>
            <div className="welcome-features">
              <div className="welcome-feature-item">
                <span className="welcome-feature-dot" />
                <span>快速完成，仅需 30 秒</span>
              </div>
              <div className="welcome-feature-item">
                <span className="welcome-feature-dot" />
                <span>专属渐变配色，每份都独特</span>
              </div>
              <div className="welcome-feature-item">
                <span className="welcome-feature-dot" />
                <span>一键保存分享给朋友</span>
              </div>
            </div>
            <button className="btn-primary" onClick={handleStart}>
              开始测试
            </button>
          </div>
        )}

        {stage === 'quiz' && (
          <QuizCard
            question={QUESTIONS[currentQuestion]}
            currentIndex={currentQuestion}
            totalQuestions={QUESTIONS.length}
            onAnswer={handleAnswer}
          />
        )}

        {stage === 'result' && (
          <ResultCard
            title={resultTitle}
            description={resultDescription}
            gradientColors={resultColors}
            gradientDirection={gradientDirection}
            onTitleChange={setResultTitle}
            onGradientDirectionChange={setGradientDirection}
            onRestart={handleRestart}
          />
        )}
      </div>
    </>
  )
}
