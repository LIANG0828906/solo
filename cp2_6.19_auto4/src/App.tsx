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
  gradientColors: string[]
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

const GRADIENT_PALETTES = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#30cfd0', '#330867'],
  ['#a8edea', '#fed6e3'],
  ['#ff9a9e', '#fecfef'],
]

const PERSONALITY_RESULTS: PersonalityResult[] = [
  {
    title: '热情探索者',
    description:
      '你是一个充满活力的人，喜欢结交新朋友，对世界充满好奇。你的热情感染着周围的每一个人，是团队中的气氛担当。在探索未知的道路上，你永远不知疲倦。',
    gradientColors: GRADIENT_PALETTES[0],
  },
  {
    title: '深邃思考家',
    description:
      '你喜欢独处，享受与内心对话的时光。深刻的洞察力让你总能看到别人忽略的细节，思维缜密是你最大的优势。你用独特的视角理解这个世界。',
    gradientColors: GRADIENT_PALETTES[1],
  },
  {
    title: '理性建筑师',
    description:
      '逻辑和秩序是你信奉的准则。你擅长规划，凡事都追求井井有条。在混乱中你总能找到清晰的路径，是身边人最可靠的依赖和支持。',
    gradientColors: GRADIENT_PALETTES[2],
  },
  {
    title: '灵动艺术家',
    description:
      '你拥有敏锐的感知力和丰富的想象力。你的世界充满色彩和诗意，总能从平凡中发现美。创意是你的超能力，让生活处处充满惊喜。',
    gradientColors: GRADIENT_PALETTES[3],
  },
  {
    title: '勇敢开拓者',
    description:
      '你不畏惧挑战，敢于踏出舒适区。你的勇气和决断力让你在人群中脱颖而出。你是天生的领导者，用行动激励身边的人一起前行。',
    gradientColors: GRADIENT_PALETTES[4],
  },
  {
    title: '温和守护者',
    description:
      '你沉稳可靠，是朋友们最温暖的港湾。你的耐心和包容让人感到安心，你默默地守护着身边重要的人，用温柔的力量改变世界。',
    gradientColors: GRADIENT_PALETTES[5],
  },
  {
    title: '阳光社交家',
    description:
      '你天生善于与人沟通，无论走到哪里都能成为焦点。你的正能量像阳光一样温暖，身边总不缺欢声笑语。你是连接人与人之间的桥梁。',
    gradientColors: GRADIENT_PALETTES[6],
  },
  {
    title: '内省梦想家',
    description:
      '你心中有一片广阔的星空，喜欢构筑属于自己的精神世界。你浪漫而理想主义，对未来总是抱有美好的期待。你的梦想会带你去往很远的地方。',
    gradientColors: GRADIENT_PALETTES[7],
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
  const [resultColors, setResultColors] = useState<string[]>(GRADIENT_PALETTES[0])
  const [gradientDirection, setGradientDirection] = useState(0)

  const bubbles = useMemo(() => generateBubbles(18), [])

  const computeResult = useCallback((userAnswers: number[]) => {
    const score = userAnswers.reduce((sum, ans) => sum + ans, 0)
    const paletteIndex = userAnswers.reduce(
      (acc, ans, idx) => acc + ans * (idx + 1),
      0
    ) % GRADIENT_PALETTES.length
    const personalityIndex = score % PERSONALITY_RESULTS.length
    const result = PERSONALITY_RESULTS[personalityIndex]

    setResultTitle(result.title)
    setResultDescription(result.description)
    setResultColors(GRADIENT_PALETTES[paletteIndex])
    setGradientDirection(score % 4)
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
            <h1 className="welcome-title">趣味性格测试</h1>
            <p className="welcome-subtitle">
              只需回答 5 道简单问题
              <br />
              即可生成专属你的性格卡片
              <br />
              还能一键保存分享哦 ✨
            </p>
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
