import React, { useState } from 'react';
import RecipeMatcher from './RecipeMatcher';
import DietLogger, { MealEntry } from './DietLogger';
import NutritionPanel from './NutritionPanel';

type Page = 'recipe' | 'logger' | 'settings';

const NAV_ITEMS: { key: Page; label: string; icon: string }[] = [
  { key: 'recipe', label: '食谱生成', icon: '🍳' },
  { key: 'logger', label: '饮食日志', icon: '📝' },
  { key: 'settings', label: '账号设置', icon: '⚙️' },
];

export default function App() {
  const [page, setPage] = useState<Page>('recipe');
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  return (
    <div className="app">
      <nav className="nav">
        <div className="nav-logo">
          🍽️ 食<span>谱</span>
        </div>
        <div className="nav-items">
          {NAV_ITEMS.map((it) => (
            <button
              key={it.key}
              className={'nav-item' + (page === it.key ? ' active' : '')}
              onClick={() => setPage(it.key)}
            >
              <span style={{ marginRight: 6 }}>{it.icon}</span>
              {it.label}
            </button>
          ))}
        </div>
        <div className="nav-avatar" title="我的账号">U</div>
      </nav>

      <div className="main-layout">
        <div className="main-left">
          {page === 'recipe' && <RecipeMatcher />}
          {page === 'logger' && <DietLogger entries={entries} setEntries={setEntries} />}
          {page === 'settings' && (
            <div className="card">
              <div className="card-title">⚙️ 账号设置</div>
              <div style={{ display: 'grid', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>昵称</label>
                  <input
                    style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none' }}
                    defaultValue="健康达人"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>身高（cm）</label>
                    <input
                      style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none' }}
                      type="number"
                      defaultValue={170}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>体重（kg）</label>
                    <input
                      style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none' }}
                      type="number"
                      defaultValue={65}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, marginBottom: 6, fontWeight: 500 }}>每日热量目标</label>
                  <input
                    style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid var(--border)', fontSize: 14, outline: 'none' }}
                    type="number"
                    defaultValue={2000}
                  />
                </div>
                <button className="btn btn-primary" style={{ marginTop: 10, justifyContent: 'center' }}>
                  保存设置
                </button>
                <div style={{
                  marginTop: 18,
                  padding: 18,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #FFF5F5, #F0F8E8)',
                  fontSize: 13,
                  lineHeight: 1.8,
                  color: 'var(--text-light)',
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 8, fontSize: 14 }}>🌟 关于本应用</div>
                  基于您现有的食材，智能推荐匹配的食谱；
                  通过可视化的雷达图和趋势图，帮助您科学追踪每日营养摄入。
                  所有营养数据均为预估值，仅供健康参考。
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="main-right">
          <NutritionPanel entries={entries} />
        </div>
      </div>

      <button
        className="fab"
        onClick={() => setMobilePanelOpen(true)}
        title="查看营养面板"
      >
        📊
      </button>

      {mobilePanelOpen && (
        <div className="mobile-panel">
          <button className="mobile-close" onClick={() => setMobilePanelOpen(false)}>✕</button>
          <div style={{ clear: 'both' }} />
          <NutritionPanel entries={entries} />
        </div>
      )}
    </div>
  );
}
