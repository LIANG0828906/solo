import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '../store';
import '../styles/CostPanel.css';

const CostPanel = () => {
  const [showLedger, setShowLedger] = useState(false);

  const { calculationResult, isCalculating, selectedCargo, route, towns } = useAppStore((state) => ({
    calculationResult: state.calculationResult,
    isCalculating: state.isCalculating,
    selectedCargo: state.selectedCargo,
    route: state.route,
    towns: state.towns,
  }));

  const getTownById = (townId: string) => towns.find((t) => t.id === townId);

  const getRiskColor = (riskIndex: number) => {
    if (riskIndex < 30) return 'var(--color-risk-low)';
    if (riskIndex < 60) return 'var(--color-risk-medium)';
    return 'var(--color-risk-high)';
  };

  const getRiskLabel = (riskIndex: number) => {
    if (riskIndex < 30) return '低风险';
    if (riskIndex < 60) return '中风险';
    return '高风险';
  };

  const formatNumber = (num: number) => {
    return Math.round(num).toLocaleString('zh-CN');
  };

  if (selectedCargo.length === 0 || route.length < 2) {
    return (
      <div className="cost-panel scroll-panel">
        <div className="panel-content">
          <section className="panel-section">
            <h2 className="section-title title-calligraphy">成本明细</h2>
            <div className="empty-state">
              <div className="empty-icon">📜</div>
              <p className="empty-text">
                请先选择货物并规划路线<br />
                系统将自动计算运输成本与利润
              </p>
              <div className="hint-list">
                <div className="hint-item">
                  <span className="hint-icon">1</span>
                  <span>从左侧选择要运输的货物</span>
                </div>
                <div className="hint-item">
                  <span className="hint-icon">2</span>
                  <span>在地图上点击城镇规划路线</span>
                </div>
                <div className="hint-item">
                  <span className="hint-icon">3</span>
                  <span>查看实时成本与利润估算</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  if (isCalculating || !calculationResult) {
    return (
      <div className="cost-panel scroll-panel">
        <div className="panel-content">
          <section className="panel-section">
            <h2 className="section-title title-calligraphy">成本明细</h2>
            <div className="calculating-state">
              <div className="abacus-icon">🧮</div>
              <p>正在核算账目...</p>
              <div className="loading-bar">
                <motion.div
                  className="loading-progress"
                  animate={{ width: ['0%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="cost-panel scroll-panel">
      <div className="panel-content">
        <section className="panel-section">
          <h2 className="section-title title-calligraphy">成本明细</h2>

          <div className="route-summary ink-border">
            <h3 className="summary-title">路线概览</h3>
            <div className="route-towns">
              {route.map((node, index) => {
                const town = getTownById(node.townId);
                return (
                  <span key={node.townId} className="route-town-chip">
                    {town?.name}
                    {index < route.length - 1 && <span className="route-arrow">→</span>}
                  </span>
                );
              })}
            </div>
            <div className="route-stats">
              <div className="stat">
                <span className="stat-label">总里程</span>
                <span className="stat-value number-scroll">{formatNumber(calculationResult.totalDistance)} 里</span>
              </div>
              <div className="stat">
                <span className="stat-label">预计天数</span>
                <span className="stat-value number-scroll">{calculationResult.totalDays} 天</span>
              </div>
            </div>
          </div>
        </section>

        <section className="panel-section">
          <h3 className="subsection-title">成本构成</h3>
          <div className="cost-breakdown">
            <div className="cost-item">
              <div className="cost-label">
                <span className="cost-icon">🐪</span>
                <span>运输费用</span>
              </div>
              <span className="cost-value expense">{formatNumber(calculationResult.transportationCost)} 贯</span>
            </div>
            <div className="cost-item">
              <div className="cost-label">
                <span className="cost-icon">🍞</span>
                <span>粮草费用</span>
              </div>
              <span className="cost-value expense">{formatNumber(calculationResult.foodCost)} 贯</span>
            </div>
            <div className="cost-item">
              <div className="cost-label">
                <span className="cost-icon">👥</span>
                <span>人工费用</span>
              </div>
              <span className="cost-value expense">{formatNumber(calculationResult.laborCost)} 贯</span>
            </div>
            <div className="cost-item">
              <div className="cost-label">
                <span className="cost-icon">🏨</span>
                <span>住宿费用</span>
              </div>
              <span className="cost-value expense">{formatNumber(calculationResult.accommodationCost)} 贯</span>
            </div>
            <div className="cost-item">
              <div className="cost-label">
                <span className="cost-icon">⚠️</span>
                <span>风险准备金</span>
              </div>
              <span className="cost-value expense">{formatNumber(calculationResult.riskCost)} 贯</span>
            </div>
            <div className="cost-total-row">
              <span className="total-label">总成本</span>
              <span className="total-value expense">{formatNumber(calculationResult.totalCost)} 贯</span>
            </div>
          </div>
        </section>

        <section className="panel-section">
          <h3 className="subsection-title">收益预期</h3>
          <div className="profit-section">
            <div className="profit-row">
              <span className="profit-label">预计收入</span>
              <span className="profit-value income">{formatNumber(calculationResult.expectedRevenue)} 贯</span>
            </div>
            <div className="profit-row highlight">
              <span className="profit-label">预计利润</span>
              <span className={`profit-value ${calculationResult.expectedProfit >= 0 ? 'income' : 'expense'}`}>
                {calculationResult.expectedProfit >= 0 ? '+' : ''}{formatNumber(calculationResult.expectedProfit)} 贯
              </span>
            </div>
            <div className="profit-row">
              <span className="profit-label">利润率</span>
              <span className={`profit-value ${calculationResult.profitMargin >= 0 ? 'income' : 'expense'}`}>
                {calculationResult.profitMargin.toFixed(1)}%
              </span>
            </div>
          </div>
        </section>

        <section className="panel-section">
          <h3 className="subsection-title">风险评估</h3>
          <div className="risk-section">
            <div className="risk-meter">
              <div
                className="risk-fill"
                style={{
                  width: `${calculationResult.riskIndex}%`,
                  backgroundColor: getRiskColor(calculationResult.riskIndex),
                }}
              />
              <div className="risk-indicator" style={{ left: `${calculationResult.riskIndex}%` }} />
            </div>
            <div className="risk-labels">
              <span style={{ color: 'var(--color-risk-low)' }}>低</span>
              <span style={{ color: 'var(--color-risk-medium)' }}>中</span>
              <span style={{ color: 'var(--color-risk-high)' }}>高</span>
            </div>
            <div className="risk-score">
              <span className="risk-number" style={{ color: getRiskColor(calculationResult.riskIndex) }}>
                {calculationResult.riskIndex}
              </span>
              <span className="risk-label" style={{ color: getRiskColor(calculationResult.riskIndex) }}>
                / 100 · {getRiskLabel(calculationResult.riskIndex)}
              </span>
            </div>
            <p className="risk-assessment">{calculationResult.riskAssessment}</p>
          </div>
        </section>

        <section className="panel-section">
          <h3 className="subsection-title">地形分布</h3>
          <div className="terrain-section">
            {calculationResult.terrainBreakdown.map((terrain) => (
              <div key={terrain.type} className="terrain-item">
                <div className="terrain-info">
                  <span className="terrain-icon">
                    {terrain.type === 'desert' && '🏜️'}
                    {terrain.type === 'oasis' && '🌴'}
                    {terrain.type === 'gobi' && '🪨'}
                    {terrain.type === 'mountain' && '⛰️'}
                    {terrain.type === 'fortress' && '🏰'}
                  </span>
                  <span className="terrain-name">
                    {terrain.type === 'desert' && '沙漠'}
                    {terrain.type === 'oasis' && '绿洲'}
                    {terrain.type === 'gobi' && '戈壁'}
                    {terrain.type === 'mountain' && '山地'}
                    {terrain.type === 'fortress' && '城镇'}
                  </span>
                </div>
                <div className="terrain-bar">
                  <div
                    className={`terrain-fill terrain-${terrain.type}`}
                    style={{ width: `${terrain.percentage}%` }}
                  />
                </div>
                <span className="terrain-percent">{terrain.percentage.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </section>

        <section className="panel-section">
          <button
            className="ledger-toggle ink-button ripple-target"
            onClick={() => setShowLedger(!showLedger)}
          >
            {showLedger ? '收起账目' : '📜 查看完整账目'}
          </button>

          <AnimatePresence>
            {showLedger && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="ledger-section"
              >
                <h3 className="subsection-title ledger-title">商队账目</h3>
                <div className="ledger-table">
                  <div className="ledger-header">
                    <span>类别</span>
                    <span>摘要</span>
                    <span className="amount-col">金额</span>
                  </div>
                  {calculationResult.ledgerEntries.map((entry, index) => (
                    <div key={index} className={`ledger-row ${entry.type}`}>
                      <span className="ledger-category">{entry.category}</span>
                      <span className="ledger-desc">{entry.description}</span>
                      <span className={`ledger-amount ${entry.type}`}>
                        {entry.type === 'income' ? '+' : '-'}{formatNumber(entry.amount)} 贯
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>
    </div>
  );
};

export default CostPanel;
