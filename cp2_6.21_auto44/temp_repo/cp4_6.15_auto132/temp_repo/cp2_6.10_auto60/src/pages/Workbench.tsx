import { useState } from 'react';
import { useGameStore, MOLD_PATTERNS } from '../store/gameStore';
import SmokePot from '../components/SmokePot';
import PoundingStation from '../components/PoundingStation';
import MoldingStation from '../components/MoldingStation';
import DryingTimer from '../components/DryingTimer';
import GildingStation from '../components/GildingStation';
import type { ProcessStage, MoldPattern } from '../types';

const STAGES: { id: ProcessStage; label: string }[] = [
  { id: 'smoke', label: '松烟和胶' },
  { id: 'pounding', label: '捶打揉捏' },
  { id: 'molding', label: '墨模压印' },
  { id: 'drying', label: '晾干' },
  { id: 'gilding', label: '描金' }
];

function Workbench() {
  const { processData, materials, inventory } = useGameStore();
  const { currentStage } = processData;
  const [activeTab, setActiveTab] = useState<'process' | 'drying' | 'gilding'>('process');

  const handleDragStart = (e: React.DragEvent, material: string) => {
    e.dataTransfer.setData('material', material);
  };

  const getStageStatus = (stage: ProcessStage) => {
    const currentIdx = STAGES.findIndex(s => s.id === currentStage);
    const stageIdx = STAGES.findIndex(s => s.id === stage);
    if (stageIdx < currentIdx) return 'completed';
    if (stageIdx === currentIdx) return 'active';
    return '';
  };

  const renderCurrentStage = () => {
    switch (currentStage) {
      case 'smoke':
        return <SmokePot onDropGlue={() => {}} />;
      case 'pounding':
        return <PoundingStation />;
      case 'molding':
        return <MoldingStation />;
      default:
        return <SmokePot onDropGlue={() => {}} />;
    }
  };

  const dryingCount = inventory.filter(b => !b.isDried).length;
  const gildingCount = inventory.filter(b => b.isDried && !b.isGilded).length;

  return (
    <div className="workbench-layout">
      <div className="panel">
        <h3 className="panel-title">材料库</h3>
        
        <div
          className={`material-item ${materials.glue <= 0 ? 'disabled' : ''}`}
          draggable={materials.glue > 0 && currentStage === 'smoke' && !processData.glueAdded}
          onDragStart={(e) => handleDragStart(e, 'glue')}
        >
          <div 
            className="material-icon" 
            style={{ background: '#e8d8a0', border: '2px solid #c8b880' }}
          />
          <div className="material-info">
            <div className="material-name">动物皮胶</div>
            <div className="material-count">剩余: {materials.glue} 块</div>
          </div>
        </div>

        <div className="material-item disabled">
          <div 
            className="material-icon" 
            style={{ background: '#3a3a3a', border: '2px solid #2a2a2a' }}
          />
          <div className="material-info">
            <div className="material-name">松烟粉</div>
            <div className="material-count">剩余: {materials.pineSoot} 份</div>
          </div>
        </div>

        <div className="material-item disabled">
          <div 
            className="material-icon" 
            style={{ background: '#87ceeb', border: '2px solid #5f9ea0' }}
          />
          <div className="material-info">
            <div className="material-name">清水</div>
            <div className="material-count">剩余: {materials.water} 份</div>
          </div>
        </div>

        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: 'rgba(0,0,0,0.05)', 
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: '#6b4e3a'
        }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#6b4e3a' }}>工艺说明</h4>
          <ul style={{ paddingLeft: '1.2rem', lineHeight: '1.8' }}>
            <li>拖入皮胶，调至85°C以上</li>
            <li>捶打60次以上达硬度3级</li>
            <li>选模按压5秒定型</li>
            <li>晾干14天后描金</li>
          </ul>
        </div>
      </div>

      <div className="panel">
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {(['process', 'drying', 'gilding'] as const).map(tab => (
            <button
              key={tab}
              className={`nav-tab ${activeTab === tab ? 'active' : ''}`}
              style={{ 
                flex: 1, 
                padding: '0.5rem',
                fontSize: '0.9rem'
              }}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'process' ? '制墨工序' : tab === 'drying' ? '晾干区' : '描金室'}
              {(tab === 'drying' && dryingCount > 0) && (
                <span style={{ marginLeft: '0.25rem' }}>({dryingCount})</span>
              )}
              {(tab === 'gilding' && gildingCount > 0) && (
                <span style={{ marginLeft: '0.25rem' }}>({gildingCount})</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'process' && (
          <>
            <div className="progress-indicator">
              {STAGES.slice(0, 3).map(stage => (
                <div
                  key={stage.id}
                  className={`progress-step ${getStageStatus(stage.id)}`}
                >
                  {stage.label}
                </div>
              ))}
            </div>
            {renderCurrentStage()}
          </>
        )}

        {activeTab === 'drying' && <DryingTimer />}
        {activeTab === 'gilding' && <GildingStation />}
      </div>

      <div className="panel">
        <h3 className="panel-title">订单 & 库存</h3>
        
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ color: '#6b4e3a', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            最近订单
          </h4>
          <OrdersPreview />
        </div>

        <div style={{ borderTop: '2px solid #c8a86e', paddingTop: '1rem' }}>
          <h4 style={{ color: '#6b4e3a', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
            成品库存
          </h4>
          <InventoryPreview />
        </div>
      </div>
    </div>
  );
}

function OrdersPreview() {
  const { orders } = useGameStore();
  const displayOrders = orders.filter(o => o.fulfilled < o.quantity).slice(0, 3);

  if (displayOrders.length === 0) {
    return (
      <div style={{ fontSize: '0.85rem', color: '#8b6f5a', textAlign: 'center', padding: '1rem' }}>
        暂无订单
      </div>
    );
  }

  return (
    <div className="orders-panel">
      {displayOrders.map(order => (
        <div key={order.id} className="order-item">
          <div className="order-title">
            {MOLD_PATTERNS[order.pattern]}墨 x{order.quantity}
          </div>
          <div className="order-details">
            品级要求：
            <span className={`grade-badge grade-${order.requiredGrade}`}>
              {order.requiredGrade === 'superior' ? '上品' : order.requiredGrade === 'common' ? '中品' : '下品'}
            </span>
          </div>
          <div className="order-reward">
            💰 报酬: {order.reward} 两
          </div>
          <div style={{ fontSize: '0.75rem', color: '#8b6f5a', marginTop: '0.25rem' }}>
            进度: {order.fulfilled}/{order.quantity}
          </div>
        </div>
      ))}
    </div>
  );
}

function InventoryPreview() {
  const { inventory } = useGameStore();
  const finishedItems = inventory.filter(b => b.isGilded).slice(0, 4);

  if (finishedItems.length === 0) {
    return (
      <div style={{ fontSize: '0.85rem', color: '#8b6f5a', textAlign: 'center', padding: '1rem' }}>
        暂无成品
      </div>
    );
  }

  const MOLD_ICONS: Record<MoldPattern, string> = {
    dragon: '🐉',
    phoenix: '🐦',
    pineCrane: '🦢',
    fiveFu: '福',
    longevity: '壽',
    doubleCoin: '🪙'
  };

  return (
    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
      {finishedItems.map(batch => (
        <div key={batch.id} className="ink-item" style={{ marginBottom: '0.5rem' }}>
          <div className="ink-item-icon">
            {MOLD_ICONS[batch.pattern]}
          </div>
          <div className="ink-item-info">
            <div className="ink-item-name">
              {MOLD_PATTERNS[batch.pattern]}墨
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className={`grade-badge grade-${batch.grade}`}>
                {batch.grade === 'superior' ? '上品' : batch.grade === 'common' ? '中品' : '下品'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Workbench;
