import { useState, useCallback } from 'react';
import { useGameStore, MOLD_PATTERNS } from '../store/gameStore';
import { motion, AnimatePresence } from 'framer-motion';
import type { InkBatch, MoldPattern, Order } from '../types';

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

function Orders() {
  const { orders, inventory, fulfillOrder, playSound, triggerSweep, money, reputation } = useGameStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedBatches, setSelectedBatches] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const availableBatches = inventory.filter(b => b.isGilded);

  const handleDragStart = (e: React.DragEvent | any, batchId: string) => {
    if ('dataTransfer' in e) {
      e.dataTransfer.setData('batchId', batchId);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (selectedOrder) setDragOver(true);
  }, [selectedOrder]);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const batchId = e.dataTransfer.getData('batchId');
    if (!batchId || !selectedOrder) return;
    
    if (selectedBatches.includes(batchId)) {
      setSelectedBatches(prev => prev.filter(id => id !== batchId));
    } else if (selectedBatches.length < selectedOrder.quantity) {
      setSelectedBatches(prev => [...prev, batchId]);
    }
  }, [selectedOrder, selectedBatches]);

  const handleFulfill = () => {
    if (!selectedOrder || selectedBatches.length === 0) return;
    
    const order = orders.find(o => o.id === selectedOrder.id);
    if (!order) return;
    
    const batches = inventory.filter(b => selectedBatches.includes(b.id));
    const validBatches = batches.filter(b =>
      b.pattern === order.pattern &&
      b.grade === order.requiredGrade &&
      b.isGilded
    );
    
    if (validBatches.length >= order.quantity) {
      fulfillOrder(order.id, selectedBatches);
      playSound('success');
      triggerSweep();
    } else {
      fulfillOrder(order.id, selectedBatches);
      playSound('error');
    }
    
    setSelectedOrder(null);
    setSelectedBatches([]);
  };

  const toggleBatchSelection = (batchId: string) => {
    if (!selectedOrder) return;
    
    if (selectedBatches.includes(batchId)) {
      setSelectedBatches(prev => prev.filter(id => id !== batchId));
    } else if (selectedBatches.length < selectedOrder.quantity) {
      setSelectedBatches(prev => [...prev, batchId]);
    }
  };

  const isBatchValidForOrder = (batch: InkBatch, order: Order) => {
    return batch.pattern === order.pattern && 
           batch.grade === order.requiredGrade && 
           batch.isGilded;
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      <div className="panel">
        <h2 className="panel-title" style={{ fontSize: '1.4rem' }}>订单管理</h2>
        
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'rgba(0,0,0,0.05)',
          borderRadius: '8px'
        }}>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#d4af37' }}>
              💰 {money} 两
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8b6914' }}>当前银两</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: '700', 
              color: reputation > 50 ? '#4a7c59' : reputation > 20 ? '#8b6914' : '#8b3a3a' 
            }}>
              ⭐ {reputation} 点
            </div>
            <div style={{ fontSize: '0.8rem', color: '#8b6914' }}>墨坊声誉</div>
          </div>
        </div>

        <div className="orders-panel" style={{ maxHeight: '500px' }}>
          {orders.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem', 
              color: '#8b6f5a' 
            }}>
              暂无订单
            </div>
          ) : (
            orders.map(order => (
              <motion.div
                key={order.id}
                className={`order-item ${order.fulfilled >= order.quantity ? 'fulfilled' : ''} ${selectedOrder?.id === order.id ? 'selected' : ''}`}
                style={{
                  cursor: order.fulfilled < order.quantity ? 'pointer' : 'default',
                  borderColor: selectedOrder?.id === order.id ? '#d4af37' : undefined
                }}
                onClick={() => {
                  if (order.fulfilled < order.quantity) {
                    setSelectedOrder(selectedOrder?.id === order.id ? null : order);
                    setSelectedBatches([]);
                  }
                }}
                whileHover={order.fulfilled < order.quantity ? { scale: 1.02 } : {}}
              >
                <div className="order-title">
                  {MOLD_ICONS[order.pattern]} {MOLD_PATTERNS[order.pattern]}墨 x{order.quantity}
                </div>
                <div className="order-details">
                  品级要求：
                  <span className={`grade-badge grade-${order.requiredGrade}`}>
                    {GRADE_LABELS[order.requiredGrade]}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="order-reward">
                    💰 {order.reward} 两 ({order.reward / order.quantity} 两/块)
                  </div>
                </div>
                <div style={{ 
                  marginTop: '0.5rem',
                  fontSize: '0.8rem', 
                  color: '#8b6f5a' 
                }}>
                  进度: {order.fulfilled}/{order.quantity}
                  <div style={{
                    height: '6px',
                    background: 'rgba(0,0,0,0.1)',
                    borderRadius: '3px',
                    marginTop: '0.25rem',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${(order.fulfilled / order.quantity) * 100}%`,
                      background: 'linear-gradient(to right, #a07030, #d4af37)',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <div className="panel">
        <h2 className="panel-title" style={{ fontSize: '1.4rem' }}>
          {selectedOrder ? '发货区' : '可用库存'}
        </h2>

        {selectedOrder && (
          <div style={{ 
            marginBottom: '1rem', 
            padding: '1rem', 
            background: 'rgba(212, 175, 55, 0.1)', 
            borderRadius: '8px',
            border: '2px dashed #d4af37'
          }}>
            <div style={{ fontWeight: '600', color: '#6b4e3a', marginBottom: '0.5rem' }}>
              当前订单：{MOLD_PATTERNS[selectedOrder.pattern]}墨 {GRADE_LABELS[selectedOrder.requiredGrade]} x{selectedOrder.quantity}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#8b6f5a' }}>
              已选择: {selectedBatches.length}/{selectedOrder.quantity}
            </div>
          </div>
        )}

        {selectedOrder && (
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {selectedBatches.length === 0 ? (
              <div style={{ color: '#8b6f5a' }}>
                ← 拖拽或点击左侧库存中的墨锭到此处
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {selectedBatches.map(id => {
                  const batch = inventory.find(b => b.id === id);
                  if (!batch) return null;
                  const isValid = selectedOrder ? isBatchValidForOrder(batch, selectedOrder) : false;
                  return (
                    <motion.div
                      key={id}
                      className="ink-item"
                      style={{
                        cursor: 'pointer',
                        borderColor: isValid ? '#4a7c59' : '#8b3a3a',
                        width: '80px'
                      }}
                      onClick={() => toggleBatchSelection(id)}
                      layout
                    >
                      <div style={{ fontSize: '1.5rem' }}>
                        {MOLD_ICONS[batch.pattern]}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#6b4e3a' }}>
                        {isValid ? '✓' : '✗'}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedOrder && selectedBatches.length > 0 && (
          <div className="controls-row">
            <button
              className="btn-bronze btn-large"
              onClick={handleFulfill}
              disabled={selectedBatches.length < selectedOrder.quantity}
            >
              发货
            </button>
            <button
              className="btn-bronze"
              onClick={() => {
                setSelectedOrder(null);
                setSelectedBatches([]);
              }}
            >
              取消
            </button>
          </div>
        )}

        <div style={{ marginTop: '1.5rem' }}>
          <h4 style={{ color: '#6b4e3a', marginBottom: '0.75rem' }}>
            可用墨锭 ({availableBatches.length})
          </h4>
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            <AnimatePresence>
              {availableBatches.map(batch => (
                <motion.div
                  key={batch.id}
                  className={`ink-item ${selectedBatches.includes(batch.id) ? 'dragging' : ''}`}
                  draggable={!!selectedOrder}
                  onDragStart={(e) => handleDragStart(e, batch.id)}
                  onClick={() => selectedOrder && toggleBatchSelection(batch.id)}
                  style={{
                    opacity: selectedBatches.includes(batch.id) ? 0.5 : 1,
                    cursor: selectedOrder ? 'pointer' : 'default'
                  }}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <div className="ink-item-icon">
                    {MOLD_ICONS[batch.pattern]}
                  </div>
                  <div className="ink-item-info">
                    <div className="ink-item-name">
                      {MOLD_PATTERNS[batch.pattern]}墨
                    </div>
                    <div className="ink-item-details">
                      <span className={`grade-badge grade-${batch.grade}`}>
                        {GRADE_LABELS[batch.grade]}
                      </span>
                      <span style={{ marginLeft: '0.5rem' }}>
                        硬度{batch.hardness}级
                      </span>
                    </div>
                  </div>
                  {selectedOrder && (
                    <div style={{ fontSize: '0.8rem' }}>
                      {isBatchValidForOrder(batch, selectedOrder) ? (
                        <span style={{ color: '#4a7c59' }}>✓ 匹配</span>
                      ) : (
                        <span style={{ color: '#8b3a3a' }}>✗ 不匹配</span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        <div style={{ 
          marginTop: '1.5rem', 
          padding: '1rem', 
          background: 'rgba(0,0,0,0.05)', 
          borderRadius: '8px',
          fontSize: '0.85rem',
          color: '#6b4e3a'
        }}>
          <h4 style={{ marginBottom: '0.5rem', color: '#6b4e3a' }}>📋 订单说明</h4>
          <ul style={{ paddingLeft: '1.2rem', lineHeight: '1.8' }}>
            <li>每块上品墨锭报酬：3两银子</li>
            <li>中品墨锭报酬：2两银子</li>
            <li>下品墨锭报酬：1两银子</li>
            <li>匹配失败扣5两并降低声誉</li>
            <li>声誉归零则墨坊破产</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Orders;
