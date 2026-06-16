/**
 * ============================================================
 *  QuizBurst - 主应用组件
 * ============================================================
 *
 *  依赖关系：
 *    - 依赖: src/components/TeamBoard.tsx (积分面板)
 *    - 依赖: src/components/QuizPanel.tsx (主持人面板)
 *    - 依赖: src/components/BuzzerPage.tsx (抢答页面)
 *    - 依赖: src/components/ScoreLog.tsx (得分日志)
 *    - 依赖: src/store.ts (全局状态管理)
 *
 *  数据流向：
 *    作为应用根组件，负责：
 *    - 初始化时从 IndexedDB 加载数据
 *    - 布局管理，将各组件按区域摆放
 *    - 各子组件通过 store 间接通信
 *
 *  布局结构：
 *    ┌─────────────────────────────────────────────────┐
 *    │  TeamBoard (小组积分面板)                       │
 *    ├──────────────────┬──────────────────────────────┤
 *    │  QuizPanel      │  BuzzerPage                  │
 *    │  (控制面板)     │  (抢答区)                    │
 *    ├──────────────────┴──────────────────────────────┤
 *    │  ScoreLog (得分日志)                            │
 *    └─────────────────────────────────────────────────┘
 *
 *  组件间通信：
 *    - QuizPanel → store → BuzzerPage: 控制比赛流程
 *    - BuzzerPage → store → TeamBoard: 抢答和分数更新
 *    - BuzzerPage → store → ScoreLog:  产生得分记录
 * ============================================================
 */

import { useEffect } from 'react'
import { useQuizStore } from './store'
import TeamBoard from './components/TeamBoard'
import QuizPanel from './components/QuizPanel'
import BuzzerPage from './components/BuzzerPage'
import ScoreLog from './components/ScoreLog'

function App() {
  const { loadFromDB, isLoaded } = useQuizStore()

  useEffect(() => {
    loadFromDB()
  }, [loadFromDB])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-white text-xl">加载中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a2e] to-[#16213e] p-6">
      <div className="max-w-[1920px] mx-auto space-y-6">
        <header className="text-center mb-2">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-wider">
            ⚡ QuizBurst
          </h1>
          <p className="text-white/60 mt-2">课堂趣味知识竞赛抢答系统</p>
        </header>

        <section>
          <TeamBoard />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 h-[600px]">
            <QuizPanel />
          </div>
          <div className="lg:col-span-8 h-[600px]">
            <BuzzerPage />
          </div>
        </section>

        <section>
          <ScoreLog />
        </section>
      </div>
    </div>
  )
}

export default App
