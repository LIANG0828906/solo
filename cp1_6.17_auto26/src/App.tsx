import React, { useState } from 'react'
import { Button } from 'antd'
import { ExperimentOutlined } from '@ant-design/icons'
import DanmakuPanel from '@/components/DanmakuPanel'
import GiftPanel from '@/components/GiftPanel'
import RankingTable from '@/components/RankingTable'
import GiftManager from '@/components/GiftManager'
import TestTool from '@/components/TestTool'
import './App.css'

const App: React.FC = () => {
  const [testToolOpen, setTestToolOpen] = useState(false)

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          <h1 className="app-title">🎬 直播实时互动仪表盘</h1>
        </div>
        <div className="header-right">
          <span className="live-badge">
            <span className="live-dot" />
            实时监控中
          </span>
        </div>
      </header>

      <main className="app-main">
        <div className="main-content">
          <div className="left-column">
            <DanmakuPanel />
          </div>

          <div className="center-column">
            <div className="center-top">
              <RankingTable />
            </div>
            <div className="center-bottom">
              <GiftManager />
            </div>
          </div>

          <div className="right-column">
            <GiftPanel />
          </div>
        </div>
      </main>

      <Button
        type="primary"
        shape="circle"
        size="large"
        icon={<ExperimentOutlined />}
        className="test-tool-btn"
        onClick={() => setTestToolOpen(true)}
      />

      <TestTool open={testToolOpen} onClose={() => setTestToolOpen(false)} />
    </div>
  )
}

export default App
