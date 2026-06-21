import { useMemo } from 'react'
import { ScrollContext } from './context/ScrollContext'
import { useScrollProgress } from './hooks/useScrollProgress'
import HeroVideo from './components/HeroVideo'
import Scene from './components/Scene'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import './App.css'

const SCENE_DATA = [
  {
    imageUrl:
      'https://via.placeholder.com/800x600/1e88e5/ffffff?text=Scene+1+%E8%B5%B7%E6%BA%90',
    title: '起源：一个简单的想法',
    content:
      '一切始于对更好体验的追求。我们相信，科技应该服务于人，而非让人适应科技。"简约而不简单"是我们的设计哲学，每一个细节都经过反复推敲。',
  },
  {
    imageUrl:
      'https://via.placeholder.com/800x600/00acc1/ffffff?text=Scene+2+%E7%A0%94%E5%8F%91',
    title: '研发：日夜兼程的打磨',
    content:
      '数百个日夜的迭代，数千次用户测试。我们深入理解用户需求，将每一个功能做到极致。"用户的时间是最宝贵的资源"，这是团队内部的共识。',
  },
  {
    imageUrl:
      'https://via.placeholder.com/800x600/ff6b6b/ffffff?text=Scene+3+%E5%8F%91%E5%B8%83',
    title: '发布：与世界见面',
    content:
      '当产品第一次展现在用户面前，我们既紧张又期待。首发当日的用户反馈超出预期，"这正是我想要的"是我们听过最动听的话。',
  },
  {
    imageUrl:
      'https://via.placeholder.com/800x600/43a047/ffffff?text=Scene+4+%E6%88%90%E9%95%BF',
    title: '成长：百万用户的信任',
    content:
      '从第一个用户到第一百万用户，我们走过了不平凡的旅程。每一次好评都是前进的动力，每一条建议都是成长的养分。"与用户共同成长"是我们始终坚持的理念。',
  },
  {
    imageUrl:
      'https://via.placeholder.com/800x600/8e24aa/ffffff?text=Scene+5+%E5%88%9B%E6%96%B0',
    title: '创新：突破边界的勇气',
    content:
      '我们从不满足于现状。创新不只是口号，更是融入血液的基因。"敢于尝试，不怕失败"的文化，让我们始终走在行业前沿。',
  },
  {
    imageUrl:
      'https://via.placeholder.com/800x600/ff8f00/ffffff?text=Scene+6+%E6%9C%AA%E6%9D%A5',
    title: '未来：永不止步',
    content:
      '故事还在继续，每一天都是新的开始。我们期待与你一起，书写下一个篇章。"未来已来，只是分布不均"，让我们一起创造更美好的明天。',
  },
]

function App() {
  const { scrollProgress, currentScene, viewportHeight } = useScrollProgress({
    totalScenes: 6,
    throttleMs: 16,
  })

  const contextValue = useMemo(
    () => ({
      scrollProgress,
      currentScene,
      totalScenes: 6,
      viewportHeight,
    }),
    [scrollProgress, currentScene, viewportHeight]
  )

  return (
    <ScrollContext.Provider value={contextValue}>
      <div className="app">
        <Navbar />
        <main className="main-content">
          <HeroVideo
            title="品牌的故事"
            subtitle="一段关于初心、坚持与创新的旅程，邀你一同见证"
          />
          <div className="scenes-container">
            {SCENE_DATA.map((scene, index) => (
              <Scene
                key={index}
                index={index}
                imageUrl={scene.imageUrl}
                title={scene.title}
                content={scene.content}
              />
            ))}
          </div>
          <div className="bottom-spacer" />
        </main>
        <Footer />
      </div>
    </ScrollContext.Provider>
  )
}

export default App
