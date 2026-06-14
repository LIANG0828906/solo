import { useState } from 'react'
import MatchingList from '../components/MatchingList'
import type { SearchFilters } from '../types'

export default function MatchingPage() {
  const [activeTab, setActiveTab] = useState('all')

  return (
    <div className="container" style={{ paddingTop: '40px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '36px',
          fontWeight: 800,
          color: 'var(--color-dark-brown)',
          marginBottom: '8px'
        }}>
          🔍 寻找寄养家庭
        </h1>
        <p style={{ color: 'var(--color-text-light)', fontSize: '16px' }}>
          筛选最适合您和毛孩子的寄养家庭，让爱不孤单
        </p>
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          🏠 全部家庭
        </button>
        <button
          className={`tab ${activeTab === 'dog' ? 'active' : ''}`}
          onClick={() => setActiveTab('dog')}
        >
          🐶 狗狗寄养
        </button>
        <button
          className={`tab ${activeTab === 'cat' ? 'active' : ''}`}
          onClick={() => setActiveTab('cat')}
        >
          🐱 猫咪寄养
        </button>
        <button
          className={`tab ${activeTab === 'other' ? 'active' : ''}`}
          onClick={() => setActiveTab('other')}
        >
          🐹 其他宠物
        </button>
      </div>

      <div className="tab-content">
        <div
          className="tab-panel"
          key={activeTab}
          style={{
            animation: 'fadeInUp 0.4s ease'
          }}
        >
          <MatchingList
            key={activeTab}
            filters={{
              petType: activeTab === 'all' ? 'all' : activeTab
            } as Partial<SearchFilters>}
            showFilters={true}
          />
        </div>
      </div>
    </div>
  )
}
