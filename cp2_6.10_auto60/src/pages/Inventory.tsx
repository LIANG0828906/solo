import { useMemo, useState } from 'react';
import { useGameStore, MOLD_PATTERNS } from '../store/gameStore';
import VirtualList from '../components/VirtualList';
import type { InkBatch, MoldPattern } from '../types';

const MOLD_ICONS: Record<MoldPattern, string> = {
  dragon: '🐉',
  phoenix: '🐦',
  pineCrane: '🦢',
  fiveFu: '福',
  longevity: '壽',
  doubleCoin: '🪙'
};

const GRADE_LABELS = {
  superior: '上品',
  common: '中品',
  inferior: '下品'
};

function Inventory() {
  const { inventory } = useGameStore();
  const [filter, setFilter] = useState<'all' | 'drying' | 'ready' | 'gilded'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'pattern' | 'grade'>('date');

  const filteredInventory = useMemo(() => {
    let items = [...inventory];
    
    if (filter === 'drying') {
      items = items.filter(b => !b.isDried);
    } else if (filter === 'ready') {
      items = items.filter(b => b.isDried && !b.isGilded);
    } else if (filter === 'gilded') {
      items = items.filter(b => b.isGilded);
    }
    
    if (sortBy === 'date') {
      items.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === 'pattern') {
      items.sort((a, b) => a.pattern.localeCompare(b.pattern));
    } else if (sortBy === 'grade') {
      const gradeOrder = { superior: 0, common: 1, inferior: 2 };
      items.sort((a, b) => gradeOrder[a.grade] - gradeOrder[b.grade]);
    }
    
    return items;
  }, [inventory, filter, sortBy]);

  const stats = useMemo(() => {
    const gilded = inventory.filter(b => b.isGilded);
    return {
      total: inventory.length,
      drying: inventory.filter(b => !b.isDried).length,
      ready: inventory.filter(b => b.isDried && !b.isGilded).length,
      gilded: gilded.length,
      superior: gilded.filter(b => b.grade === 'superior').length,
      common: gilded.filter(b => b.grade === 'common').length,
      inferior: gilded.filter(b => b.grade === 'inferior').length
    };
  }, [inventory]);

  const renderItem = (batch: InkBatch) => {
    const formatDate = (ts: number) => {
      const d = new Date(ts);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    };

    return (
      <div 
        className="ink-item" 
        style={{ margin: '0 0.25rem 0.25rem 0.25rem' }}
      >
        <div className="ink-item-icon">
          {MOLD_ICONS[batch.pattern]}
        </div>
        <div className="ink-item-info">
          <div className="ink-item-name">
            {MOLD_PATTERNS[batch.pattern]}墨 · 硬度{batch.hardness}级
          </div>
          <div className="ink-item-details">
            {formatDate(batch.createdAt)}
            {batch.isGilded ? (
              <span className={`grade-badge grade-${batch.grade}`} style={{ marginLeft: '0.5rem' }}>
                {GRADE_LABELS[batch.grade]}
              </span>
            ) : batch.isDried ? (
              <span style={{ color: '#4a7c59', marginLeft: '0.5rem' }}>待描金</span>
            ) : (
              <span style={{ color: '#8b6914', marginLeft: '0.5rem' }}>晾干中</span>
            )}
          </div>
        </div>
        {batch.isGilded && (
          <div style={{ fontSize: '0.8rem', color: '#8b6f5a' }}>
            描金 {batch.gildingCoverage}%
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="panel">
      <h2 className="panel-title" style={{ fontSize: '1.4rem' }}>库存管理</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div className="stat-box">
          <div className="stat-box-value">{stats.total}</div>
          <div className="stat-box-label">总批次</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-value">{stats.drying}</div>
          <div className="stat-box-label">晾干中</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-value">{stats.ready}</div>
          <div className="stat-box-label">待描金</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-value">{stats.gilded}</div>
          <div className="stat-box-label">已完成</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '0.85rem', color: '#6b4e3a', marginRight: '0.5rem' }}>筛选：</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
            style={{
              padding: '0.5rem',
              border: '2px solid #c8a86e',
              borderRadius: '4px',
              background: '#fffef5',
              fontFamily: 'inherit',
              color: '#6b4e3a'
            }}
          >
            <option value="all">全部</option>
            <option value="drying">晾干中</option>
            <option value="ready">待描金</option>
            <option value="gilded">已完成</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '0.85rem', color: '#6b4e3a', marginRight: '0.5rem' }}>排序：</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            style={{
              padding: '0.5rem',
              border: '2px solid #c8a86e',
              borderRadius: '4px',
              background: '#fffef5',
              fontFamily: 'inherit',
              color: '#6b4e3a'
            }}
          >
            <option value="date">按日期</option>
            <option value="pattern">按图案</option>
            <option value="grade">按品级</option>
          </select>
        </div>
      </div>

      {stats.gilded > 0 && (
        <div style={{ 
          marginBottom: '1.5rem', 
          padding: '1rem', 
          background: 'rgba(212, 175, 55, 0.1)', 
          borderRadius: '8px',
          border: '2px solid #d4af37'
        }}>
          <h4 style={{ color: '#8b6914', marginBottom: '0.75rem' }}>🏆 品质评级榜</h4>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '80px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d4af37' }}>{stats.superior}</div>
              <div style={{ fontSize: '0.8rem', color: '#8b6914' }}>上品</div>
            </div>
            <div style={{ flex: 1, minWidth: '80px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#6b7b6b' }}>{stats.common}</div>
              <div style={{ fontSize: '0.8rem', color: '#6b7b6b' }}>中品</div>
            </div>
            <div style={{ flex: 1, minWidth: '80px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b3a3a' }}>{stats.inferior}</div>
              <div style={{ fontSize: '0.8rem', color: '#8b3a3a' }}>下品</div>
            </div>
          </div>
        </div>
      )}

      {filteredInventory.length > 0 ? (
        <VirtualList
          items={filteredInventory}
          itemHeight={72}
          containerHeight={450}
          renderItem={renderItem}
        />
      ) : (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem', 
          color: '#8b6f5a',
          background: 'rgba(0,0,0,0.03)',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
          <div>暂无库存记录</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
            完成制墨工序后，墨锭将显示在此处
          </div>
        </div>
      )}
    </div>
  );
}

export default Inventory;
