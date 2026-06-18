import { useState } from 'react';
import { TripManager } from '@/modules/trip/TripManager';
import { ExpenseTracker } from '@/modules/expense/ExpenseTracker';
import { useStore } from '@/modules/expense/store';
import { formatCurrency } from '@/utils/currency';

function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'detail'>('dashboard');
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const { trips, getTotalSpent, getBudgetPercentage } = useStore();

  const handleSelectTrip = (tripId: string) => {
    setSelectedTripId(tripId);
    setCurrentView('detail');
  };

  const handleBack = () => {
    setCurrentView('dashboard');
    setSelectedTripId(null);
  };

  const totalBudget = trips.reduce((sum, t) => sum + t.budget, 0);
  const totalSpentAll = trips.reduce((sum, t) => sum + getTotalSpent(t.id), 0);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--accent-mint), #00ffcc)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            ✈️ 旅行开销管家
          </h2>
          <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
            让每一次旅行都清清楚楚
          </p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => currentView !== 'dashboard' && handleBack()}
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: currentView === 'dashboard' ? 'var(--accent-mint)' : 'transparent',
              color: currentView === 'dashboard' ? 'var(--bg-primary)' : 'var(--text-secondary)',
              textAlign: 'left',
              fontWeight: currentView === 'dashboard' ? 600 : 400,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all var(--transition)',
            }}
          >
            📊 仪表盘
          </button>
          {currentView === 'detail' && selectedTripId && (
            <button
              onClick={() => {}}
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-mint)',
                color: 'var(--bg-primary)',
                textAlign: 'left',
                fontWeight: 600,
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              📍 {trips.find((t) => t.id === selectedTripId)?.destination}
            </button>
          )}
        </nav>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-color)' }}>
          <p className="text-muted" style={{ fontSize: '12px', marginBottom: '12px' }}>
            快速统计
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <p className="text-muted" style={{ fontSize: '11px' }}>旅行项目</p>
              <p style={{ fontSize: '18px', fontWeight: 600 }}>{trips.length} 个</p>
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: '11px' }}>总预算</p>
              <p style={{ fontSize: '16px', fontWeight: 600 }}>¥{totalBudget.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted" style={{ fontSize: '11px' }}>总花费</p>
              <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-mint)' }}>
                ¥{totalSpentAll.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        {currentView === 'dashboard' && <TripManager onSelectTrip={handleSelectTrip} />}
        {currentView === 'detail' && selectedTripId && (
          <ExpenseTracker tripId={selectedTripId} onBack={handleBack} />
        )}
      </main>

      <aside className="stats-panel">
        <h3 className="section-title">实时概览</h3>

        {trips.length === 0 ? (
          <div className="empty-state" style={{ padding: '30px 10px' }}>
            <p className="text-muted" style={{ fontSize: '13px' }}>暂无数据</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {trips.map((trip) => {
              const spent = getTotalSpent(trip.id);
              const percentage = getBudgetPercentage(trip.id);
              const isOver = spent > trip.budget;
              const isWarn = percentage >= 80 && !isOver;

              return (
                <div
                  key={trip.id}
                  className="card"
                  style={{
                    padding: '14px',
                    cursor: 'pointer',
                    borderColor: isOver
                      ? 'rgba(255, 107, 107, 0.5)'
                      : 'var(--glass-border)',
                    animation: isOver ? 'pulse-orange 2s ease-in-out infinite' : 'none',
                  }}
                  onClick={() => handleSelectTrip(trip.id)}
                >
                  <div className="flex justify-between items-center mb-sm">
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>
                      {trip.destination}
                    </span>
                    <span
                      className={`category-tag ${isOver ? 'category-shopping' : isWarn ? 'category-food' : 'category-transport'}`}
                      style={{ fontSize: '11px' }}
                    >
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${isOver ? 'progress-fill-danger' : isWarn ? 'progress-fill-warning' : 'progress-fill-safe'}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-muted" style={{ fontSize: '11px', marginTop: '8px' }}>
                    {formatCurrency(spent, trip.currency)} / {formatCurrency(trip.budget, trip.currency)}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>💡 小贴士</h4>
          <p className="text-muted" style={{ fontSize: '12px', lineHeight: 1.6 }}>
            建议将每日开销控制在预算的 {((1 / 7) * 100).toFixed(1)}% 以内，留有余地应对突发情况。
            记录每一笔开销，让旅行预算更加可控！
          </p>
        </div>

        <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>💱 支持货币</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['USD', 'EUR', 'CNY', 'JPY', 'GBP'].map((cur) => (
              <span
                key={cur}
                className="category-tag category-transport"
                style={{ fontSize: '11px' }}
              >
                {cur}
              </span>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

export default App;
