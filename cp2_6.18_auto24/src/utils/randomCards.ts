import { v4 as uuidv4 } from 'uuid'

export interface Card {
  id: string
  width: number
  height: number
  title: string
  content: string
}

const LOREM_TITLES = [
  '设计系统概览',
  '响应式布局指南',
  '组件库搭建',
  '移动端适配方案',
  '性能优化实践',
  'CSS Grid 进阶',
  'Flexbox 完全教程',
  '断点设计策略',
  '弹性盒子实战',
  '多端统一体验',
  '视觉层级构建',
  '间距规范设定',
  '色彩系统原理',
  '排版规则梳理',
  '动效设计基础',
  '无障碍访问设计',
  '模块化架构',
  '前端工程化',
  '设计令牌管理',
  '主题切换实现',
  '微交互动画',
  '图片自适应',
  '字体响应式',
  '容器查询应用',
]

const LOREM_PARAGRAPHS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
  'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam.',
  'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos.',
  'Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam.',
  'Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi.',
]

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateRandomCards(count?: number): Card[] {
  const n = count ?? randomInRange(16, 24)
  const cards: Card[] = []

  for (let i = 0; i < n; i++) {
    const width = randomInRange(120, 240)
    const height = randomInRange(80, 160)
    cards.push({
      id: uuidv4(),
      width,
      height,
      title: pickRandom(LOREM_TITLES),
      content: pickRandom(LOREM_PARAGRAPHS),
    })
  }

  return cards
}

export function generateSingleCard(): Card {
  const width = randomInRange(120, 240)
  const height = randomInRange(80, 160)
  return {
    id: uuidv4(),
    width,
    height,
    title: pickRandom(LOREM_TITLES),
    content: pickRandom(LOREM_PARAGRAPHS),
  }
}
