import { useState } from 'react';
import { Strategy } from '../types';

interface StrategyListProps {
  strategies: Strategy[];
  selectedStrategyId: string | null;
  selectedForComparison: string[];
  onSelectStrategy: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteStrategy: (id: string) => void;
  onToggleComparison: (id: string) => void;
  onCreateClick: () => void;
}

function StrategyList({
  strategies,
  selectedStrategyId,
  selectedForComparison,
  onSelectStrategy,
  onToggleFavorite,
  onDeleteStrategy,
  onToggleComparison,
  onCreateClick,
}: StrategyListProps) {
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  const favoriteStrategies = strategies.filter((s) => s.favorite);
  const otherStrategies = strategies.filter((s) => !s.favorite);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      onDeleteStrategy(id);
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  };

  const handleComparisonToggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onToggleComparison(id);
  };

  const renderStrategyCard = (strategy: Strategy) => {
    const isDeleting = deletingIds.has(strategy.id);
    const isSelected = selectedStrategyId === strategy.id;
    const isInComparison = selectedForComparison.includes(strategy.id);

    return (
      <div
        key={strategy.id}
        className={`strategy-card ${isSelected ? 'selected' : ''} ${
          isDeleting ? 'deleting' : ''
        }`}
        onClick={() => onSelectStrategy(strategy.id)}
      >
        <div className="strategy-card-header">
          <span className="strategy-name" title={strategy.name}>
            {strategy.name}
          </span>
          <button
            className={`star-btn ${strategy.favorite ? 'favorited' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(strategy.id);
            }}
            title={strategy.favorite ? '取消收藏' : '收藏'}
          >
            ★
          </button>
        </div>

        <div className="strategy-meta">
          <span className="strategy-benchmark">{strategy.benchmark}</span>
          <span>{strategy.targets.length} 个标的</span>
        </div>

        <div className="strategy-targets" title={strategy.targets.join('、')}>
          {strategy.targets.slice(0, 3).join('、')}
          {strategy.targets.length > 3 ? ` 等${strategy.targets.length}只` : ''}
        </div>

        <div className="strategy-actions">
          <label className="compare-checkbox" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={isInComparison}
              onChange={(e) => handleComparisonToggle(e as any, strategy.id)}
              disabled={!isInComparison && selectedForComparison.length >= 4}
            />
            加入对比
          </label>
          <button className="delete-btn" onClick={(e) => handleDelete(e, strategy.id)}>
            删除
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="strategy-list">
      <div className="strategy-list-header">
        <h3>策略列表</h3>
        <button className="create-btn" onClick={onCreateClick}>
          + 新建
        </button>
      </div>

      <div className="strategy-list-content">
        {favoriteStrategies.length > 0 && (
          <>
            <div className="favorite-section-label favorites">⭐ 收藏策略 ({favoriteStrategies.length}/8)</div>
            {favoriteStrategies.map(renderStrategyCard)}
          </>
        )}

        {otherStrategies.length > 0 && (
          <>
            {favoriteStrategies.length > 0 && (
              <div className="favorite-section-label">📋 全部策略</div>
            )}
            {otherStrategies.map(renderStrategyCard)}
          </>
        )}

        {strategies.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: '#bfbfbf' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
            <div>暂无策略</div>
            <div style={{ fontSize: '12px', marginTop: '8px' }}>点击上方按钮创建第一个策略</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StrategyList;
