import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import StrategyList from './components/StrategyList';
import BacktestPanel from './components/BacktestPanel';
import ComparisonDashboard from './components/ComparisonDashboard';
import { Strategy, BacktestResult } from './types';
import './App.css';

function App() {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [backtestResults, setBacktestResults] = useState<Map<string, BacktestResult>>(new Map());
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<'list' | 'content'>('list');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    fetchStrategies();
  }, []);

  const fetchStrategies = async () => {
    try {
      const res = await fetch('/api/strategies');
      const data = await res.json();
      setStrategies(data);
    } catch (error) {
      console.error('获取策略列表失败:', error);
    }
  };

  const handleSelectStrategy = (id: string) => {
    setSelectedStrategyId(id);
    if (isMobile) {
      setMobileTab('content');
    }
    navigate('/');
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const res = await fetch(`/api/strategies/${id}/favorite`, { method: 'PUT' });
      if (res.ok) {
        const updated = await res.json();
        setStrategies((prev) =>
          prev.map((s) => (s.id === id ? updated : s)).sort((a, b) => {
            if (a.favorite !== b.favorite) return b.favorite ? 1 : -1;
            return b.createdAt - a.createdAt;
          })
        );
      }
    } catch (error) {
      console.error('收藏策略失败:', error);
    }
  };

  const handleDeleteStrategy = async (id: string) => {
    try {
      const res = await fetch(`/api/strategies/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStrategies((prev) => prev.filter((s) => s.id !== id));
        if (selectedStrategyId === id) {
          setSelectedStrategyId(null);
        }
        setBacktestResults((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
        setSelectedForComparison((prev) => prev.filter((sid) => sid !== id));
      }
    } catch (error) {
      console.error('删除策略失败:', error);
    }
  };

  const handleBacktestComplete = (result: BacktestResult) => {
    setBacktestResults((prev) => {
      const next = new Map(prev);
      next.set(result.strategyId, result);
      return next;
    });
  };

  const handleToggleComparison = (id: string) => {
    setSelectedForComparison((prev) => {
      if (prev.includes(id)) {
        return prev.filter((sid) => sid !== id);
      } else if (prev.length < 4) {
        return [...prev, id];
      }
      return prev;
    });
  };

  const handleGoToComparison = () => {
    if (selectedForComparison.length >= 2) {
      navigate('/comparison');
    }
  };

  const handleCreateStrategy = async (strategyData: {
    name: string;
    benchmark: string;
    targets: string[];
    factorWeights: { momentum: number; value: number; volatility: number };
  }) => {
    try {
      const res = await fetch('/api/strategies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(strategyData),
      });
      if (res.ok) {
        await fetchStrategies();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('创建策略失败:', error);
    }
  };

  const selectedStrategy = strategies.find((s) => s.id === selectedStrategyId) || null;
  const comparisonResults = selectedForComparison
    .map((id) => backtestResults.get(id))
    .filter((r): r is BacktestResult => r !== undefined);

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">📈 量化策略回测平台</h1>
          <div className="header-actions">
            {isMobile ? (
              <div className="mobile-tabs">
                <button
                  className={`mobile-tab ${mobileTab === 'list' ? 'active' : ''}`}
                  onClick={() => setMobileTab('list')}
                >
                  策略列表
                </button>
                <button
                  className={`mobile-tab ${mobileTab === 'content' ? 'active' : ''}`}
                  onClick={() => setMobileTab('content')}
                >
                  回测分析
                </button>
              </div>
            ) : (
              <>
                {selectedForComparison.length >= 2 && (
                  <button className="btn btn-secondary" onClick={handleGoToComparison}>
                    对比分析 ({selectedForComparison.length})
                  </button>
                )}
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                  + 创建策略
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="app-body">
        {!isMobile && (
          <aside className="sidebar">
            <StrategyList
              strategies={strategies}
              selectedStrategyId={selectedStrategyId}
              selectedForComparison={selectedForComparison}
              onSelectStrategy={handleSelectStrategy}
              onToggleFavorite={handleToggleFavorite}
              onDeleteStrategy={handleDeleteStrategy}
              onToggleComparison={handleToggleComparison}
              onCreateClick={() => setShowCreateModal(true)}
            />
          </aside>
        )}

        {isMobile && mobileTab === 'list' && (
          <div className="mobile-list-container">
            <StrategyList
              strategies={strategies}
              selectedStrategyId={selectedStrategyId}
              selectedForComparison={selectedForComparison}
              onSelectStrategy={handleSelectStrategy}
              onToggleFavorite={handleToggleFavorite}
              onDeleteStrategy={handleDeleteStrategy}
              onToggleComparison={handleToggleComparison}
              onCreateClick={() => setShowCreateModal(true)}
            />
          </div>
        )}

        <main className="main-content">
          <Routes>
            <Route
              path="/"
              element={
                selectedStrategy ? (
                  <BacktestPanel
                    strategy={selectedStrategy}
                    onBacktestComplete={handleBacktestComplete}
                    isInComparison={selectedForComparison.includes(selectedStrategy.id)}
                    onToggleComparison={() => handleToggleComparison(selectedStrategy.id)}
                  />
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <h2>选择一个策略开始回测</h2>
                    <p>从左侧策略列表中选择一个策略，或创建新策略</p>
                    <button
                      className="btn btn-primary btn-large"
                      onClick={() => setShowCreateModal(true)}
                    >
                      + 创建新策略
                    </button>
                  </div>
                )
              }
            />
            <Route
              path="/comparison"
              element={
                <ComparisonDashboard
                  strategies={strategies.filter((s) => selectedForComparison.includes(s.id))}
                  backtestResults={comparisonResults}
                  onBack={() => navigate('/')}
                />
              }
            />
          </Routes>
        </main>
      </div>

      {showCreateModal && (
        <CreateStrategyModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateStrategy}
        />
      )}
    </div>
  );
}

import { useState as useState2 } from 'react';

function CreateStrategyModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: {
    name: string;
    benchmark: string;
    targets: string[];
    factorWeights: { momentum: number; value: number; volatility: number };
  }) => void;
}) {
  const [name, setName] = useState2('');
  const [benchmark, setBenchmark] = useState('沪深300');
  const [targets, setTargets] = useState<string[]>([]);
  const [momentum, setMomentum] = useState(0.33);
  const [value, setValue] = useState(0.33);
  const [volatility, setVolatility] = useState(0.34);
  const [availableTargets, setAvailableTargets] = useState<string[]>([]);
  const [availableBenchmarks, setAvailableBenchmarks] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/targets')
      .then((r) => r.json())
      .then(setAvailableTargets);
    fetch('/api/benchmarks')
      .then((r) => r.json())
      .then(setAvailableBenchmarks);
  }, []);

  const handleTargetToggle = (target: string) => {
    setTargets((prev) =>
      prev.includes(target) ? prev.filter((t) => t !== target) : [...prev, target]
    );
  };

  const handleWeightChange = (factor: 'momentum' | 'value' | 'volatility', newValue: number) => {
    const remaining = 1 - newValue;
    const otherFactors = ['momentum', 'value', 'volatility'].filter((f) => f !== factor);
    const otherSum =
      (factor === 'momentum' ? 0 : momentum) +
      (factor === 'value' ? 0 : value) +
      (factor === 'volatility' ? 0 : volatility);

    if (otherSum === 0) {
      const each = remaining / 2;
      if (factor !== 'momentum') setMomentum(each);
      if (factor !== 'value') setValue(each);
      if (factor !== 'volatility') setVolatility(each);
    } else {
      const ratio = remaining / otherSum;
      if (factor !== 'momentum') setMomentum(Math.round(momentum * ratio * 100) / 100);
      if (factor !== 'value') setValue(Math.round(value * ratio * 100) / 100);
      if (factor !== 'volatility') setVolatility(Math.round(volatility * ratio * 100) / 100);
    }

    if (factor === 'momentum') setMomentum(newValue);
    if (factor === 'value') setValue(newValue);
    if (factor === 'volatility') setVolatility(newValue);
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      alert('请输入策略名称');
      return;
    }
    if (targets.length === 0) {
      alert('请至少选择一个投资标的');
      return;
    }
    onCreate({
      name: name.trim(),
      benchmark,
      targets,
      factorWeights: { momentum, value, volatility },
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>创建新策略</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>策略名称</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入策略名称"
            />
          </div>

          <div className="form-group">
            <label>基准指数</label>
            <select
              className="form-input"
              value={benchmark}
              onChange={(e) => setBenchmark(e.target.value)}
            >
              {availableBenchmarks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>投资标的（可多选）</label>
            <div className="target-grid">
              {availableTargets.map((target) => (
                <label
                  key={target}
                  className={`target-tag ${targets.includes(target) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={targets.includes(target)}
                    onChange={() => handleTargetToggle(target)}
                    style={{ display: 'none' }}
                  />
                  {target}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>
              因子权重（合计：
              <span style={{ color: '#1890ff', fontWeight: 600 }}>
                {(momentum + value + volatility).toFixed(2)}
              </span>
              ）
            </label>

            <div className="weight-slider-group">
              <div className="weight-slider">
                <div className="weight-label">
                  <span>动量因子</span>
                  <span className="weight-value">{(momentum * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={momentum}
                  onChange={(e) => handleWeightChange('momentum', parseFloat(e.target.value))}
                  className="range-slider momentum-slider"
                  style={{
                    background: `linear-gradient(to right, #52c41a 0%, #52c41a ${
                      momentum * 100
                    }%, #e8e8e8 ${momentum * 100}%, #e8e8e8 100%)`,
                  }}
                />
              </div>

              <div className="weight-slider">
                <div className="weight-label">
                  <span>价值因子</span>
                  <span className="weight-value">{(value * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={value}
                  onChange={(e) => handleWeightChange('value', parseFloat(e.target.value))}
                  className="range-slider value-slider"
                  style={{
                    background: `linear-gradient(to right, #1890ff 0%, #1890ff ${value * 100}%, #e8e8e8 ${
                      value * 100
                    }%, #e8e8e8 100%)`,
                  }}
                />
              </div>

              <div className="weight-slider">
                <div className="weight-label">
                  <span>波动率因子</span>
                  <span className="weight-value">{(volatility * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volatility}
                  onChange={(e) => handleWeightChange('volatility', parseFloat(e.target.value))}
                  className="range-slider volatility-slider"
                  style={{
                    background: `linear-gradient(to right, #fa8c16 0%, #fa8c16 ${
                      volatility * 100
                    }%, #e8e8e8 ${volatility * 100}%, #e8e8e8 100%)`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-default" onClick={onClose}>
            取消
          </button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            创建策略
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
