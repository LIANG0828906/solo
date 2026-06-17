import { v4 as uuidv4 } from 'uuid'

export interface Bottle {
  id: string
  url: string
  comment: string
  emoji: string
  tag: string
  passCount: number
  height: number
}

export interface Message {
  id: string
  url: string
  comment: string
  passCount: number
  emoji: string
}

const delay = () => new Promise<void>((resolve) => setTimeout(resolve, 500 + Math.random() * 1000))

const randomHeight = () => Math.floor(160 + Math.random() * 120)

const mockBottles: Bottle[] = [
  { id: uuidv4(), url: 'https://developer.mozilla.org/zh-CN/', comment: 'MDN文档永远的神，前端开发必备参考手册', emoji: '🦊', tag: '开发', passCount: 12, height: randomHeight() },
  { id: uuidv4(), url: 'https://www.typescriptlang.org/play', comment: 'TypeScript在线练习场，写TS代码即时看编译结果', emoji: '🔷', tag: '工具', passCount: 8, height: randomHeight() },
  { id: uuidv4(), url: 'https://react.dev/learn', comment: 'React官方教程，从零开始的组件化思维训练', emoji: '⚛️', tag: '学习', passCount: 23, height: randomHeight() },
  { id: uuidv4(), url: 'https://github.com/trending', comment: 'GitHub趋势榜，每天看看有什么新奇特的项目', emoji: '🐙', tag: '社区', passCount: 45, height: randomHeight() },
  { id: uuidv4(), url: 'https://css-tricks.com/', comment: 'CSS技巧大全，解决各种样式疑难杂症', emoji: '🎨', tag: '设计', passCount: 19, height: randomHeight() },
  { id: uuidv4(), url: 'https://www.figma.com/community', comment: 'Figma社区，发现各种优秀的设计资源和插件', emoji: '✨', tag: '设计', passCount: 31, height: randomHeight() },
  { id: uuidv4(), url: 'https://vitejs.dev/', comment: 'Vite构建工具官网，极快的开发体验', emoji: '⚡', tag: '工具', passCount: 15, height: randomHeight() },
  { id: uuidv4(), url: 'https://zustand.docs.pmnd.rs/', comment: 'Zustand状态管理库，轻量又好用', emoji: '🐻', tag: '开发', passCount: 7, height: randomHeight() },
  { id: uuidv4(), url: 'https://tailwindcss.com/', comment: 'Tailwind CSS原子化样式框架，写CSS的新方式', emoji: '💨', tag: '开发', passCount: 28, height: randomHeight() },
  { id: uuidv4(), url: 'https://dribbble.com/shots/popular', comment: 'Dribbble热门设计，找灵感来这里就对了', emoji: '🏀', tag: '灵感', passCount: 52, height: randomHeight() },
  { id: uuidv4(), url: 'https://www.producthunt.com/', comment: 'Product Hunt，发现最新最酷的产品和工具', emoji: '🚀', tag: '社区', passCount: 38, height: randomHeight() },
  { id: uuidv4(), url: 'https://excalidraw.com/', comment: '手绘风格白板工具，画架构图和流程图特别好看', emoji: '🖊️', tag: '工具', passCount: 16, height: randomHeight() },
]

let bottles = [...mockBottles]

export async function fetchBottles(): Promise<Bottle[]> {
  await delay()
  return [...bottles]
}

export async function pickBottle(id: string): Promise<Message> {
  await delay()
  const bottle = bottles.find((b) => b.id === id)
  if (!bottle) {
    throw new Error('Bottle not found')
  }
  bottles = bottles.filter((b) => b.id !== id)
  return {
    id: bottle.id,
    url: bottle.url,
    comment: bottle.comment,
    passCount: bottle.passCount,
    emoji: bottle.emoji,
  }
}

export async function throwBottle(id: string): Promise<void> {
  await delay()
  bottles = bottles.filter((b) => b.id !== id)
}

export async function throwNewBottle(
  data: Omit<Bottle, 'id' | 'passCount' | 'height'>
): Promise<Bottle> {
  await delay()
  const newBottle: Bottle = {
    id: uuidv4(),
    url: data.url,
    comment: data.comment,
    emoji: data.emoji,
    tag: data.tag,
    passCount: 0,
    height: randomHeight(),
  }
  bottles = [newBottle, ...bottles]
  return newBottle
}

export async function getMessage(id: string): Promise<Message> {
  await delay()
  const bottle = mockBottles.find((b) => b.id === id)
  if (!bottle) {
    throw new Error('Message not found')
  }
  return {
    id: bottle.id,
    url: bottle.url,
    comment: bottle.comment,
    passCount: bottle.passCount,
    emoji: bottle.emoji,
  }
}
